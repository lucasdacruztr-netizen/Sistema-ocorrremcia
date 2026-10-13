/* ==========================================================
   script.js — Telas e fluxos dos coordenadores
   Etapa 1: tela inicial.
   Etapa 2: seleção de unidade e polo.
   Etapa 3: abre o registro de ocorrência (registro.js).
   Seleção pesquisável de NTE/polo (campo-pesquisa.js) e identificação
   livre do Subcoordenador.
   ========================================================== */
"use strict";

(function () {
  // Configuração da seleção de cada tipo de coordenador.
  var SELECOES = {
    territorial: {
      titulo: "Unidade territorial",
      texto: "Selecione a sua unidade para continuar.",
      rotulo: "Unidade",
      vazio: "Selecione uma unidade",
      erro: "Selecione uma unidade para continuar.",
      lista: DADOS.unidades
    },
    polo: {
      titulo: "Polo",
      texto: "Selecione o seu polo para continuar.",
      rotulo: "Polo",
      vazio: "Selecione um polo",
      erro: "Selecione um polo para continuar.",
      lista: DADOS.polos
    },
    // Identificação livre (texto): não há lista fixa de opções.
    subcoordenador: {
      tipo: "texto",
      titulo: "Subcoordenador",
      texto: "Informe a sua identificação para continuar.",
      erro: "Informe a identificação do subcoordenador para continuar."
    }
  };

  // Estado em memória (some ao recarregar a página; não há armazenamento).
  var estado = { perfil: null, selecionado: null };

  var telaInicial = document.getElementById("tela-inicial");
  var telaSelecao = document.getElementById("tela-selecao");
  var avisoInicial = document.getElementById("aviso");
  var avisoSelecao = document.getElementById("aviso-selecao");
  var titulo = document.getElementById("titulo-selecao");
  var texto = document.getElementById("texto-selecao");
  var rotulo = document.getElementById("rotulo-selecao");
  var campo = document.getElementById("campo-selecao");
  var blocoPesquisa = document.getElementById("bloco-pesquisa");
  var blocoIdentificacao = document.getElementById("bloco-identificacao");
  var campoIdentificacao = document.getElementById("campo-identificacao");
  var erro = document.getElementById("erro-selecao");
  var botaoVoltar = document.getElementById("botao-voltar");
  var botaoContinuar = document.getElementById("botao-continuar");
  var cards = document.querySelectorAll("[data-perfil]");

  // Campo pesquisável (setinha + busca) usado para NTE e polo.
  var combo = CampoPesquisa.criar({
    campo: campo,
    botao: document.getElementById("botao-lista"),
    lista: document.getElementById("lista-selecao"),
    aoMudar: aoMudarSelecao
  });

  function ehTexto(config) {
    return config.tipo === "texto";
  }

  function temSelecao(chave) {
    return Object.prototype.hasOwnProperty.call(SELECOES, chave);
  }

  // Procura o item na lista oficial; nunca confia no valor bruto do campo.
  function buscarItem(lista, valor) {
    if (!/^[0-9]{1,3}$/.test(valor)) {
      return null;
    }
    var id = Number(valor);
    for (var i = 0; i < lista.length; i++) {
      if (lista[i].id === id) {
        return lista[i];
      }
    }
    return null;
  }

  function limparMensagens() {
    erro.textContent = "";
    erro.hidden = true;
    avisoSelecao.textContent = "";
    avisoSelecao.hidden = true;
  }

  // Mostra o campo certo para o perfil: lista pesquisável ou texto livre.
  function prepararCampo(config) {
    var porTexto = ehTexto(config);
    blocoPesquisa.hidden = porTexto;
    blocoIdentificacao.hidden = !porTexto;
    campoIdentificacao.value = "";
    if (porTexto) {
      combo.definirItens([]);
      return;
    }
    rotulo.textContent = config.rotulo;
    combo.definirPlaceholder(config.vazio);
    combo.definirItens(config.lista);
  }

  function focarCampo(config) {
    if (ehTexto(config)) {
      campoIdentificacao.focus();
      return;
    }
    // No celular, não abre o teclado sozinho para não cobrir a lista.
    var toque = typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
    if (!toque) {
      combo.focar();
    }
  }

  // Devolve o item oficial escolhido na lista, ou { texto } com a identificação
  // válida do Subcoordenador; qualquer outra coisa devolve null.
  function obterSelecao(config) {
    if (ehTexto(config)) {
      var identificacao = Ocorrencias.validarIdentificacao(campoIdentificacao.value);
      return identificacao.ok ? { texto: identificacao.valor } : null;
    }
    return buscarItem(config.lista, combo.valor());
  }

  function abrirSelecao(chave) {
    var config = SELECOES[chave];
    estado.perfil = chave;
    estado.selecionado = null;

    titulo.textContent = config.titulo;
    texto.textContent = config.texto;
    prepararCampo(config);
    botaoContinuar.disabled = true;
    limparMensagens();

    telaInicial.hidden = true;
    telaSelecao.hidden = false;
    focarCampo(config);
  }

  function voltarParaInicio() {
    estado.perfil = null;
    estado.selecionado = null;
    limparMensagens();
    telaSelecao.hidden = true;
    telaInicial.hidden = false;
    avisoInicial.hidden = true;
    avisoInicial.textContent = "";
  }

  function aoMudarSelecao() {
    var config = SELECOES[estado.perfil];
    var escolha = config ? obterSelecao(config) : null;
    estado.selecionado = escolha;
    botaoContinuar.disabled = escolha === null;
    limparMensagens();
  }

  function continuar() {
    var config = SELECOES[estado.perfil];
    var item = config ? obterSelecao(config) : null;

    if (item === null) {
      estado.selecionado = null;
      botaoContinuar.disabled = true;
      erro.textContent = config ? config.erro : "Seleção inválida.";
      erro.hidden = false;
      return;
    }

    estado.selecionado = item;
    telaSelecao.hidden = true;
    var origem = ehTexto(config)
      ? { tipo: Permissoes.origemDoPerfil(estado.perfil), texto: item.texto }
      : { tipo: Permissoes.origemDoPerfil(estado.perfil), id: item.id };
    var aberto = Registro.abrir(
      { perfil: estado.perfil, origem: origem },
      { aoVoltar: reabrirSelecao, aoSair: voltarParaInicio }
    );
    if (!aberto) {
      telaSelecao.hidden = false;
      erro.textContent = "Não foi possível abrir o registro para este perfil.";
      erro.hidden = false;
    }
  }

  function reabrirSelecao() {
    telaSelecao.hidden = false;
    if (SELECOES[estado.perfil]) {
      focarCampo(SELECOES[estado.perfil]);
    }
  }

  function escolherPerfil(chave) {
    if (temSelecao(chave)) {
      abrirSelecao(chave);
      return;
    }
    if (!Permissoes.existe(chave)) {
      return;
    }
    // Administrador: comportamento mantido; área criada na Etapa 4.
    avisoInicial.textContent =
      "Perfil escolhido: " + Permissoes.rotulo(chave) + ". A próxima tela será criada na Etapa 4.";
    avisoInicial.hidden = false;
  }

  cards.forEach(function (card) {
    card.addEventListener("click", function () {
      escolherPerfil(card.getAttribute("data-perfil"));
    });
  });

  campoIdentificacao.addEventListener("input", aoMudarSelecao);
  botaoContinuar.addEventListener("click", continuar);
  botaoVoltar.addEventListener("click", voltarParaInicio);
})();
