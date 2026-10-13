/* ==========================================================
   permissoes.js — Perfis e permissões (fonte única)
   Etapa 3.

   ATENÇÃO: esta matriz serve para orientar a interface e as
   regras de negócio do protótipo. Ela NÃO é uma barreira de
   segurança: qualquer pessoa pode alterar o JavaScript no
   navegador. No sistema real, cada ação deve ser validada
   novamente no servidor/banco (login + RLS/políticas) com base
   no usuário autenticado, nunca no perfil enviado pelo cliente.
   ========================================================== */
"use strict";

const Permissoes = (function () {
  const PERFIS = Object.freeze({
    territorial: Object.freeze({
      rotulo: "Coordenador Territorial",
      origem: "unidade",
      acoes: Object.freeze(["ocorrencia:criar"])
    }),
    polo: Object.freeze({
      rotulo: "Coordenador do Polo",
      origem: "polo",
      acoes: Object.freeze(["ocorrencia:criar"])
    }),
    subcoordenador: Object.freeze({
      rotulo: "Subcoordenador",
      origem: "identificacao", // texto livre: polo ou área de atuação
      acoes: Object.freeze(["ocorrencia:criar"])
    }),
    administrador: Object.freeze({
      rotulo: "Administrador",
      origem: null,
      acoes: Object.freeze(["ocorrencia:resolver"])
    })
  });

  function existe(perfil) {
    return typeof perfil === "string" &&
      Object.prototype.hasOwnProperty.call(PERFIS, perfil);
  }

  function rotulo(perfil) {
    return existe(perfil) ? PERFIS[perfil].rotulo : "";
  }

  // Tipo de origem do perfil: "unidade", "polo", "identificacao" ou null.
  function origemDoPerfil(perfil) {
    return existe(perfil) ? PERFIS[perfil].origem : null;
  }

  function pode(perfil, acao) {
    return existe(perfil) && PERFIS[perfil].acoes.indexOf(acao) !== -1;
  }

  return Object.freeze({ existe, rotulo, origemDoPerfil, pode });
})();
