/* ==========================================================
   campo-pesquisa.js — Campo de seleção pesquisável
   Lista com setinha e filtro enquanto o usuário digita.
   Usado na seleção de NTE e de polo. Sem dependências.

   Segurança: os textos das opções entram na tela somente com
   textContent (nunca innerHTML). O valor devolvido por valor()
   é sempre o "id" de uma opção realmente escolhida na lista;
   texto digitado sem escolha não vale. Quem usa o campo deve
   revalidar esse id na lista oficial (veja script.js).
   ========================================================== */
"use strict";

const CampoPesquisa = (function () {
  // Minúsculas, sem acentos e com espaços simples: "Irecê" -> "irece".
  function normalizar(texto) {
    return String(texto == null ? "" : texto)
      .normalize("NFD")
      .replace(/[\u0300-\u036F]/g, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  // Aceita erro de uma letra no começo de uma palavra ("iri" ~ "ire"),
  // para tolerar pequenos erros de digitação.
  function palavraProxima(nome, termo) {
    const palavras = nome.split(/[^a-z0-9]+/);
    for (let i = 0; i < palavras.length; i++) {
      const palavra = palavras[i];
      if (palavra.length < termo.length) {
        continue;
      }
      let diferencas = 0;
      for (let j = 0; j < termo.length && diferencas <= 1; j++) {
        if (palavra.charAt(j) !== termo.charAt(j)) {
          diferencas++;
        }
      }
      if (diferencas <= 1) {
        return true;
      }
    }
    return false;
  }

  // Filtra os itens { id, nome }. Primeiro vêm os que contêm o texto
  // digitado; depois, os parecidos (só para termos de uma palavra com
  // 3 ou mais letras). A ordem original da lista é mantida em cada grupo.
  function filtrar(itens, termoBruto) {
    const termo = normalizar(termoBruto);
    if (termo === "") {
      return itens.slice();
    }
    const aproximar = /^[a-z0-9]{3,}$/.test(termo);
    const exatos = [];
    const parecidos = [];
    itens.forEach(function (item) {
      const nome = normalizar(item.nome);
      if (nome.indexOf(termo) !== -1) {
        exatos.push(item);
      } else if (aproximar && palavraProxima(nome, termo)) {
        parecidos.push(item);
      }
    });
    return exatos.concat(parecidos);
  }

  // config: { campo, botao, lista, aoMudar(itemOuNull) }
  function criar(config) {
    const campo = config.campo;
    const botao = config.botao;
    const lista = config.lista;
    const caixa = campo.parentNode;
    const aoMudar = typeof config.aoMudar === "function" ? config.aoMudar : function () {};

    let itens = [];
    let visiveis = [];
    let selecionado = null;
    let ativo = -1;
    let aberta = false;

    function idOpcao(indice) {
      return lista.id + "-opcao-" + indice;
    }

    function marcarAtivo(indice, rolar) {
      const anterior = lista.querySelector(".combo__opcao--ativa");
      if (anterior) {
        anterior.classList.remove("combo__opcao--ativa");
      }
      ativo = indice;
      const atual = indice >= 0 ? document.getElementById(idOpcao(indice)) : null;
      if (atual) {
        atual.classList.add("combo__opcao--ativa");
        campo.setAttribute("aria-activedescendant", atual.id);
        if (rolar && typeof atual.scrollIntoView === "function") {
          atual.scrollIntoView({ block: "nearest" });
        }
      } else {
        campo.removeAttribute("aria-activedescendant");
      }
    }

    function renderizar(termo) {
      visiveis = filtrar(itens, termo);
      lista.textContent = "";
      if (visiveis.length === 0) {
        const vazio = document.createElement("li");
        vazio.className = "combo__vazio";
        vazio.setAttribute("role", "presentation");
        vazio.textContent = "Nenhum resultado encontrado.";
        lista.appendChild(vazio);
        return -1;
      }
      let indiceSelecionado = -1;
      visiveis.forEach(function (item, indice) {
        const opcao = document.createElement("li");
        opcao.id = idOpcao(indice);
        opcao.className = "combo__opcao";
        opcao.setAttribute("role", "option");
        opcao.setAttribute("data-indice", String(indice));
        opcao.setAttribute("aria-selected", item === selecionado ? "true" : "false");
        opcao.textContent = item.nome;
        lista.appendChild(opcao);
        if (item === selecionado) {
          indiceSelecionado = indice;
        }
      });
      return indiceSelecionado >= 0 ? indiceSelecionado : (normalizar(termo) === "" ? -1 : 0);
    }

    function abrir(termo) {
      const inicial = renderizar(termo);
      lista.hidden = false;
      aberta = true;
      campo.setAttribute("aria-expanded", "true");
      botao.setAttribute("aria-expanded", "true");
      marcarAtivo(inicial, true);
    }

    function fechar() {
      lista.hidden = true;
      aberta = false;
      campo.setAttribute("aria-expanded", "false");
      botao.setAttribute("aria-expanded", "false");
      marcarAtivo(-1, false);
    }

    function selecionar(indice) {
      if (indice < 0 || indice >= visiveis.length) {
        return;
      }
      selecionado = visiveis[indice];
      campo.value = selecionado.nome;
      fechar();
      aoMudar(selecionado);
    }

    function mover(passo) {
      if (visiveis.length === 0) {
        return;
      }
      const proximo = Math.min(Math.max(ativo + passo, 0), visiveis.length - 1);
      marcarAtivo(proximo, true);
    }

    // Ao abrir pela seta (ou com uma opção já escolhida), mostra a lista toda.
    function abrirCompleta() {
      abrir("");
    }

    campo.addEventListener("input", function () {
      selecionado = null;
      abrir(campo.value);
      aoMudar(null);
    });

    campo.addEventListener("click", function () {
      if (!aberta) {
        abrir(selecionado ? "" : campo.value);
      }
    });

    campo.addEventListener("keydown", function (evento) {
      if (evento.key === "ArrowDown") {
        evento.preventDefault();
        if (aberta) {
          mover(1);
        } else {
          abrir(selecionado ? "" : campo.value);
        }
      } else if (evento.key === "ArrowUp") {
        evento.preventDefault();
        if (aberta) {
          mover(-1);
        }
      } else if (evento.key === "Enter") {
        if (aberta && ativo >= 0) {
          evento.preventDefault();
          selecionar(ativo);
        }
      } else if (evento.key === "Escape") {
        if (aberta) {
          evento.preventDefault();
          fechar();
        }
      }
    });

    // Mantém o foco no campo ao tocar na seta ou nas opções.
    botao.addEventListener("mousedown", function (evento) { evento.preventDefault(); });
    lista.addEventListener("mousedown", function (evento) { evento.preventDefault(); });

    botao.addEventListener("click", function () {
      if (aberta) {
        fechar();
        return;
      }
      abrirCompleta();
      // No celular, não força o foco: o teclado cobriria a lista.
      const toque = typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
      if (!toque) {
        campo.focus();
      }
    });

    lista.addEventListener("click", function (evento) {
      const alvo = evento.target;
      const opcao = alvo && typeof alvo.closest === "function" ? alvo.closest("[data-indice]") : null;
      if (opcao) {
        selecionar(Number(opcao.getAttribute("data-indice")));
      }
    });

    caixa.addEventListener("focusout", function (evento) {
      if (aberta && !caixa.contains(evento.relatedTarget)) {
        fechar();
      }
    });

    document.addEventListener("pointerdown", function (evento) {
      if (aberta && !caixa.contains(evento.target)) {
        fechar();
      }
    });

    function limpar() {
      selecionado = null;
      campo.value = "";
      visiveis = [];
      lista.textContent = "";
      fechar();
    }

    return Object.freeze({
      // Troca as opções (lista oficial { id, nome }) e limpa a escolha.
      definirItens: function (novosItens) {
        itens = Array.prototype.slice.call(novosItens);
        limpar();
      },
      definirPlaceholder: function (texto) {
        campo.placeholder = texto;
      },
      // Id da opção realmente escolhida, ou "" se não houver escolha.
      valor: function () {
        return selecionado ? String(selecionado.id) : "";
      },
      limpar: limpar,
      focar: function () {
        campo.focus();
      }
    });
  }

  return Object.freeze({ criar, filtrar, normalizar });
})();
