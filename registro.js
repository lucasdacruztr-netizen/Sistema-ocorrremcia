/* ==========================================================
   registro.js — Tela de registro de ocorrência (Etapa 3)
   Somente interface. Regras e validações ficam em ocorrencias.js.
   Todo texto do usuário é exibido com textContent (sem innerHTML).
   ========================================================== */
"use strict";

const Registro = (function () {
  const $ = function (id) { return document.getElementById(id); };

  const tela = $("tela-registro");
  const titulo = $("titulo-registro");
  const textoContexto = $("registro-contexto");
  const form = $("form-registro");
  const listaMotivos = $("lista-motivos");
  const campoDescricao = $("campo-descricao");
  const campoArquivo = $("campo-arquivo");
  const botaoArquivo = $("botao-arquivo");
  const botaoRemover = $("botao-remover-arquivo");
  const nomeArquivo = $("nome-arquivo");
  const botaoEnviar = $("botao-enviar");
  const confirmacao = $("registro-confirmacao");
  const erros = {
    motivo: $("erro-motivo"),
    descricao: $("erro-descricao"),
    arquivo: $("erro-arquivo"),
    geral: $("erro-registro")
  };
  const SEM_ARQUIVO = "Nenhum arquivo selecionado.";

  let contexto = null;
  let retornos = {};
  let anexo = null;
  let enviando = false;

  function mostrarErro(chave, mensagem) {
    erros[chave].textContent = mensagem || "";
    erros[chave].hidden = !mensagem;
  }

  function limparErros() {
    Object.keys(erros).forEach(function (chave) { mostrarErro(chave, ""); });
  }

  function montarMotivos() {
    listaMotivos.textContent = "";
    DADOS.motivos.forEach(function (motivo) {
      const rotulo = document.createElement("label");
      rotulo.className = "opcao";
      const entrada = document.createElement("input");
      entrada.type = "radio";
      entrada.name = "motivo";
      entrada.value = motivo.id;
      entrada.className = "opcao__input";
      const texto = document.createElement("span");
      texto.className = "opcao__texto";
      texto.textContent = motivo.nome;
      rotulo.append(entrada, texto);
      listaMotivos.appendChild(rotulo);
    });
  }

  function motivoSelecionado() {
    const marcado = form.querySelector('input[name="motivo"]:checked');
    return marcado ? marcado.value : "";
  }

  function formatarTamanho(bytes) {
    return bytes < 1024 * 1024
      ? Math.max(1, Math.round(bytes / 1024)) + " KB"
      : (bytes / (1024 * 1024)).toFixed(1).replace(".", ",") + " MB";
  }

  function limparAnexo() {
    anexo = null;
    campoArquivo.value = "";
    nomeArquivo.textContent = SEM_ARQUIVO;
    botaoRemover.hidden = true;
  }

  async function aoEscolherArquivo() {
    mostrarErro("arquivo", "");
    const arquivo = campoArquivo.files && campoArquivo.files[0];
    if (!arquivo) {
      return;
    }
    const resultado = await Ocorrencias.validarAnexo(arquivo);
    if (!resultado.ok) {
      limparAnexo();
      mostrarErro("arquivo", resultado.erro);
      return;
    }
    anexo = arquivo;
    nomeArquivo.textContent = resultado.meta.nomeOriginal + " (" + formatarTamanho(resultado.meta.tamanho) + ")";
    botaoRemover.hidden = false;
  }

  function reiniciar() {
    form.reset();
    limparAnexo();
    limparErros();
    confirmacao.hidden = true;
    form.hidden = false;
    botaoEnviar.disabled = false;
  }

  function formatarData(iso) {
    const p = String(iso).split("-");
    return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : "";
  }

  function mostrarConfirmacao(o) {
    let nomeMotivo = "";
    DADOS.motivos.forEach(function (m) { if (m.id === o.motivo) { nomeMotivo = m.nome; } });
    $("conf-id").textContent = o.id;
    $("conf-data").textContent = formatarData(o.data) + " às " + o.horario.slice(0, 5);
    $("conf-motivo").textContent = nomeMotivo;
    $("conf-status").textContent = Ocorrencias.rotuloStatus(o.status);
    $("conf-arquivo").textContent = o.arquivo ? o.arquivo.nomeOriginal : "Nenhum";
    $("conf-descricao").textContent = o.descricao;
    $("conf-resolucao").value = o.resolucao;
    form.hidden = true;
    confirmacao.hidden = false;
    titulo.focus();
  }

  function aplicarErros(resultado) {
    Object.keys(resultado).forEach(function (chave) { mostrarErro(chave, resultado[chave]); });
    const ordem = [
      ["motivo", form.querySelector('input[name="motivo"]')],
      ["descricao", campoDescricao],
      ["arquivo", botaoArquivo]
    ];
    for (let i = 0; i < ordem.length; i++) {
      if (resultado[ordem[i][0]]) {
        ordem[i][1].focus();
        return;
      }
    }
  }

  async function aoEnviar(evento) {
    evento.preventDefault();
    if (enviando || !contexto) {
      return;
    }
    enviando = true;
    botaoEnviar.disabled = true;
    limparErros();
    try {
      const resultado = await Ocorrencias.criar(
        { perfil: contexto.perfil, origem: contexto.origem },
        { motivo: motivoSelecionado(), descricao: campoDescricao.value, arquivo: anexo }
      );
      if (resultado.ok) {
        mostrarConfirmacao(resultado.ocorrencia);
      } else {
        aplicarErros(resultado.erros);
      }
    } finally {
      enviando = false;
      botaoEnviar.disabled = false;
    }
  }

  function sair(chave) {
    tela.hidden = true;
    contexto = null;
    if (typeof retornos[chave] === "function") {
      retornos[chave]();
    }
  }

  // Retorna false se o contexto for inválido (a tela não é aberta).
  function abrir(novoContexto, novosRetornos) {
    if (!novoContexto || !Permissoes.pode(novoContexto.perfil, "ocorrencia:criar")) {
      return false;
    }
    contexto = novoContexto;
    retornos = novosRetornos || {};
    let nomeOrigem = "";
    if (Permissoes.origemDoPerfil(novoContexto.perfil) === "identificacao") {
      // Texto livre do Subcoordenador: exibido somente via textContent.
      nomeOrigem = String((novoContexto.origem && novoContexto.origem.texto) || "");
    } else {
      const origem = novoContexto.origem && novoContexto.origem.id;
      const lista = Permissoes.origemDoPerfil(novoContexto.perfil) === "unidade" ? DADOS.unidades : DADOS.polos;
      lista.forEach(function (item) { if (item.id === origem) { nomeOrigem = item.nome; } });
    }
    textoContexto.textContent = Permissoes.rotulo(novoContexto.perfil) + " — " + nomeOrigem;
    reiniciar();
    tela.hidden = false;
    titulo.focus();
    return true;
  }

  montarMotivos();
  limparAnexo();
  form.addEventListener("submit", aoEnviar);
  botaoArquivo.addEventListener("click", function () { campoArquivo.click(); });
  campoArquivo.addEventListener("change", aoEscolherArquivo);
  botaoRemover.addEventListener("click", function () { limparAnexo(); mostrarErro("arquivo", ""); });
  $("registro-voltar").addEventListener("click", function () { sair("aoVoltar"); });
  $("botao-inicio").addEventListener("click", function () { sair("aoSair"); });
  $("botao-nova").addEventListener("click", reiniciar);

  return Object.freeze({ abrir });
})();
