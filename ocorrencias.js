/* ==========================================================
   ocorrencias.js — Regras de negócio das ocorrências (Etapa 3)
   Sem acesso ao DOM: pode ser reaproveitado em PWA/app.

   Camadas:
   - Repositorio: guarda em memória. Para usar API/banco, troque
     apenas este objeto (mesma interface assíncrona).
   - Funções criar/resolver: validam permissão e dados.
   Toda validação aqui deve ser repetida no servidor.
   ========================================================== */
"use strict";

const Ocorrencias = (function () {
  const STATUS = Object.freeze({ PENDENTE: "pendente", RESOLVIDA: "resolvida" });
  const ROTULOS_STATUS = Object.freeze({ pendente: "Pendente", resolvida: "Resolvida" });

  const LIMITES = Object.freeze({
    DESCRICAO_MIN: 10,
    DESCRICAO_MAX: 5000,
    RESOLUCAO_MIN: 5,
    RESOLUCAO_MAX: 5000,
    ARQUIVO_BYTES: 5 * 1024 * 1024,
    NOME_ARQUIVO_MAX: 120,
    IDENTIFICACAO_MAX: 120
  });

  // Lista permitida de anexos: extensão -> tipo real + assinatura (magic number).
  const TIPOS_ANEXO = Object.freeze({
    pdf: { mime: "application/pdf", assinatura: [0x25, 0x50, 0x44, 0x46, 0x2d] },
    png: { mime: "image/png", assinatura: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
    jpg: { mime: "image/jpeg", assinatura: [0xff, 0xd8, 0xff] },
    jpeg: { mime: "image/jpeg", assinatura: [0xff, 0xd8, 0xff] }
  });

  // Extensões executáveis/ativas: bloqueadas mesmo em "relatorio.exe.pdf".
  const EXTENSOES_PERIGOSAS = Object.freeze([
    "exe", "dll", "bat", "cmd", "com", "scr", "msi", "lnk", "sh", "jar", "apk",
    "js", "mjs", "vbs", "ps1", "hta", "php", "html", "htm", "xhtml", "svg"
  ]);

  // ---------- Repositório (em memória) ----------
  const Repositorio = (function () {
    const itens = new Map();
    const arquivos = new Map(); // id da ocorrência -> File (nunca exposto)
    return Object.freeze({
      salvar: async function (ocorrencia, arquivo) {
        itens.set(ocorrencia.id, ocorrencia);
        if (arquivo) {
          // Futuro: enviar para armazenamento PRIVADO; o servidor define o nome.
          arquivos.set(ocorrencia.id, arquivo);
        }
        return ocorrencia;
      },
      buscar: async function (id) {
        return itens.get(id) || null;
      },
      atualizar: async function (ocorrencia) {
        itens.set(ocorrencia.id, ocorrencia);
        return ocorrencia;
      }
    });
  })();

  // ---------- Utilitários ----------
  function criarId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    const b = new Uint8Array(16);
    crypto.getRandomValues(b);
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    const h = Array.from(b, function (x) { return x.toString(16).padStart(2, "0"); }).join("");
    return [h.slice(0, 8), h.slice(8, 12), h.slice(12, 16), h.slice(16, 20), h.slice(20)].join("-");
  }

  // Remove caracteres de controle. NÃO escapa HTML: a proteção contra
  // XSS é feita na saída (textContent), nunca com innerHTML.
  function normalizarTexto(valor) {
    return String(valor == null ? "" : valor)
      .replace(/\r\n?/g, "\n")
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
      .trim();
  }

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function acharPorId(lista, id) {
    for (let i = 0; i < lista.length; i++) {
      if (String(lista[i].id) === String(id)) {
        return lista[i];
      }
    }
    return null;
  }

  // Identificação livre do Subcoordenador: obrigatória, texto simples.
  // Espaços (inclusive invisíveis) não contam como conteúdo. O texto nunca
  // é interpretado como HTML: a tela o exibe somente com textContent.
  function validarIdentificacao(valor) {
    if (typeof valor !== "string") {
      return { ok: false, erro: "Informe a identificação do subcoordenador." };
    }
    const texto = normalizarTexto(valor)
      .replace(/[\u200B-\u200D\u2060\uFEFF]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (texto.length === 0) {
      return { ok: false, erro: "Informe a identificação do subcoordenador." };
    }
    if (texto.length > LIMITES.IDENTIFICACAO_MAX) {
      return { ok: false, erro: "A identificação pode ter no máximo " + LIMITES.IDENTIFICACAO_MAX + " caracteres." };
    }
    return { ok: true, valor: texto };
  }

  // A origem (unidade/polo) é sempre reconstruída pela lista oficial
  // e precisa ser compatível com o perfil. Para a identificação livre
  // (Subcoordenador) o texto é revalidado e guardado como "nome".
  function resolverOrigem(perfil, origem) {
    const tipo = Permissoes.origemDoPerfil(perfil);
    if (!tipo || !origem || origem.tipo !== tipo) {
      return null;
    }
    if (tipo === "identificacao") {
      const identificacao = validarIdentificacao(origem.texto);
      return identificacao.ok ? Object.freeze({ tipo: tipo, id: null, nome: identificacao.valor }) : null;
    }
    if (!/^[0-9]{1,3}$/.test(String(origem.id))) {
      return null;
    }
    const item = acharPorId(tipo === "unidade" ? DADOS.unidades : DADOS.polos, origem.id);
    return item ? Object.freeze({ tipo: tipo, id: item.id, nome: item.nome }) : null;
  }

  // ---------- Anexo ----------
  async function validarAnexo(arquivo) {
    const falha = function (erro) { return { ok: false, erro: erro }; };
    if (!arquivo || typeof arquivo.name !== "string" || typeof arquivo.size !== "number") {
      return falha("Arquivo inválido.");
    }
    const nome = arquivo.name.replace(/[\u0000-\u001F\u007F]/g, "").trim();
    if (!nome || nome.length > LIMITES.NOME_ARQUIVO_MAX || /[\\/]/.test(nome)) {
      return falha("Nome de arquivo inválido ou muito longo.");
    }
    const partes = nome.toLowerCase().split(".");
    if (partes.length < 2) {
      return falha("O arquivo precisa ter extensão (PDF, PNG ou JPG).");
    }
    const extensao = partes[partes.length - 1];
    const tipo = Object.prototype.hasOwnProperty.call(TIPOS_ANEXO, extensao)
      ? TIPOS_ANEXO[extensao] : null;
    if (!tipo) {
      return falha("Tipo não permitido. Envie PDF, PNG ou JPG.");
    }
    if (partes.slice(1, -1).some(function (p) { return EXTENSOES_PERIGOSAS.indexOf(p) !== -1; })) {
      return falha("Nome de arquivo suspeito. Renomeie e tente novamente.");
    }
    if (arquivo.size <= 0) {
      return falha("O arquivo está vazio.");
    }
    if (arquivo.size > LIMITES.ARQUIVO_BYTES) {
      return falha("Arquivo maior que 5 MB.");
    }
    if (arquivo.type && arquivo.type !== tipo.mime) {
      return falha("O tipo do arquivo não confere com a extensão.");
    }
    let bytes;
    try {
      bytes = new Uint8Array(await arquivo.slice(0, 8).arrayBuffer());
    } catch (e) {
      return falha("Não foi possível ler o arquivo.");
    }
    const confere = tipo.assinatura.every(function (b, i) { return bytes[i] === b; });
    if (!confere) {
      return falha("O conteúdo não corresponde a um " + extensao.toUpperCase() + " válido.");
    }
    return {
      ok: true,
      meta: Object.freeze({
        nomeOriginal: nome,
        tipoMime: tipo.mime,
        tamanho: arquivo.size,
        chaveArmazenamento: null // o servidor definirá um nome aleatório e privado
      })
    };
  }

  // ---------- Criar ----------
  // ator: { perfil, origem: { tipo, id } }  |  entrada: { motivo, descricao, arquivo }
  // Status, resolução, ID e datas NUNCA vêm da entrada.
  async function criar(ator, entrada) {
    const perfil = ator && ator.perfil;
    if (!Permissoes.pode(perfil, "ocorrencia:criar")) {
      return { ok: false, erros: { geral: "Seu perfil não pode registrar ocorrências." } };
    }
    const origem = resolverOrigem(perfil, ator.origem);
    if (!origem) {
      return { ok: false, erros: { geral: "Unidade, polo ou identificação inválida. Volte e preencha novamente." } };
    }

    const dados = entrada || {};
    const erros = {};
    const motivo = acharPorId(DADOS.motivos, dados.motivo);
    if (!motivo) {
      erros.motivo = "Selecione um motivo.";
    }
    const descricao = normalizarTexto(dados.descricao);
    if (descricao.length < LIMITES.DESCRICAO_MIN) {
      erros.descricao = "Descreva a ocorrência com pelo menos " + LIMITES.DESCRICAO_MIN + " caracteres.";
    } else if (descricao.length > LIMITES.DESCRICAO_MAX) {
      erros.descricao = "A descrição pode ter no máximo " + LIMITES.DESCRICAO_MAX + " caracteres.";
    }
    let meta = null;
    if (dados.arquivo) {
      const resultado = await validarAnexo(dados.arquivo);
      if (resultado.ok) {
        meta = resultado.meta;
      } else {
        erros.arquivo = resultado.erro;
      }
    }
    if (Object.keys(erros).length > 0) {
      return { ok: false, erros: erros };
    }

    const agora = new Date();
    const ocorrencia = Object.freeze({
      id: criarId(),
      criadoPor: Object.freeze({
        identificador: "prototipo:" + perfil + ":" + origem.tipo + ":" + (origem.id === null ? "livre" : origem.id),
        perfil: perfil,
        autenticado: false // protótipo: ainda não há login real
      }),
      origem: origem,
      data: agora.getFullYear() + "-" + pad(agora.getMonth() + 1) + "-" + pad(agora.getDate()),
      horario: pad(agora.getHours()) + ":" + pad(agora.getMinutes()) + ":" + pad(agora.getSeconds()),
      criadoEm: agora.toISOString(),
      motivo: motivo.id,
      descricao: descricao,
      status: STATUS.PENDENTE,
      resolucao: "",
      resolvidaPor: null,
      resolvidaEm: null,
      arquivo: meta,
      atualizadoEm: agora.toISOString(),
      versao: 1
    });
    await Repositorio.salvar(ocorrencia, meta ? dados.arquivo : null);
    return { ok: true, ocorrencia: ocorrencia };
  }

  // ---------- Resolver (somente Administrador) ----------
  // Ainda sem tela (Etapa 4). A regra já existe e exige permissão.
  async function resolver(ator, id, textoResolucao) {
    const perfil = ator && ator.perfil;
    if (!Permissoes.pode(perfil, "ocorrencia:resolver")) {
      return { ok: false, erro: "Somente o Administrador pode resolver ocorrências." };
    }
    const atual = await Repositorio.buscar(id);
    if (!atual) {
      return { ok: false, erro: "Ocorrência não encontrada." };
    }
    if (atual.status !== STATUS.PENDENTE) {
      return { ok: false, erro: "A ocorrência já foi resolvida." };
    }
    const resolucao = normalizarTexto(textoResolucao);
    if (resolucao.length < LIMITES.RESOLUCAO_MIN || resolucao.length > LIMITES.RESOLUCAO_MAX) {
      return { ok: false, erro: "Informe como foi resolvido (até " + LIMITES.RESOLUCAO_MAX + " caracteres)." };
    }
    const agora = new Date().toISOString();
    const nova = Object.freeze(Object.assign({}, atual, {
      status: STATUS.RESOLVIDA,
      resolucao: resolucao,
      resolvidaPor: Object.freeze({ perfil: perfil, autenticado: false }),
      resolvidaEm: agora,
      atualizadoEm: agora,
      versao: atual.versao + 1
    }));
    await Repositorio.atualizar(nova);
    return { ok: true, ocorrencia: nova };
  }

  function rotuloStatus(status) {
    return Object.prototype.hasOwnProperty.call(ROTULOS_STATUS, status) ? ROTULOS_STATUS[status] : "";
  }

  return Object.freeze({ STATUS, LIMITES, validarAnexo, validarIdentificacao, criar, resolver, rotuloStatus });
})();
