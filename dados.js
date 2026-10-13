/* ==========================================================
   dados.js — Dados do protótipo
   Etapa 2: unidades territoriais (27 NTEs) e polos (106 informados).
   Etapa 3: motivos da ocorrência.
   Não há banco de dados nesta fase.
   ========================================================== */
"use strict";

// 27 NTEs (lista oficial). O "id" é o número do NTE (1 a 27) e é o valor
// que o sistema guarda; o "nome" é apenas o texto exibido e pesquisado.
const NOMES_NTES = Object.freeze([
  "NTE 01 — Irecê",
  "NTE 02 — Bom Jesus da Lapa",
  "NTE 03 — Seabra",
  "NTE 04 — Serrinha",
  "NTE 05 — Itabuna",
  "NTE 06 — Valença",
  "NTE 07 — Teixeira de Freitas",
  "NTE 08 — Itapetinga",
  "NTE 09 — Amargosa",
  "NTE 10 — Juazeiro",
  "NTE 11 — Barreiras",
  "NTE 12 — Macaúbas",
  "NTE 13 — Caetité",
  "NTE 14 — Itaberaba",
  "NTE 15 — Ipirá",
  "NTE 16 — Jacobina",
  "NTE 17 — Ribeira do Pombal",
  "NTE 18 — Alagoinhas",
  "NTE 19 — Feira de Santana",
  "NTE 20 — Vitória da Conquista",
  "NTE 21 — Santo Antônio de Jesus",
  "NTE 22 — Jequié",
  "NTE 23 — Santa Maria da Vitória",
  "NTE 24 — Paulo Afonso",
  "NTE 25 — Senhor do Bonfim",
  "NTE 26 — Salvador",
  "NTE 27 — Eunápolis"
]);

// Polos informados (nomes exatamente como fornecidos). O "id" é a posição
// na lista fornecida (1 a 106) e NÃO representa vínculo com nenhum NTE.
// PENDÊNCIA: a lista original falava em 110 polos, mas só 106 nomes foram
// enviados. Os 4 nomes restantes devem ser acrescentados ao final desta
// lista quando forem informados (não inventar nomes).
const NOMES_POLOS = Object.freeze([
  "AMELIA RODRIGUES",
  "AMERICA DOURADA",
  "IBITITA",
  "IPUPIARA",
  "IRECE",
  "XIQUE-XIQUE",
  "BARRA",
  "BOM JESUS DA LAPA",
  "CARINHANHA",
  "IBOTIRAMA",
  "OLIVEIRA DOS BREJINHOS",
  "RIACHO DE SANTANA",
  "BARRA DA ESTIVA",
  "ITAETE",
  "MORRO DO CHAPEU",
  "PIATA",
  "SEABRA",
  "ARACI",
  "CANSANCAO",
  "CONCEICAO DO COITE",
  "MONTE SANTO",
  "SERRINHA",
  "VALENTE",
  "CAMACAN",
  "ILHEUS",
  "ITABUNA",
  "ITAPE",
  "GANDU",
  "IGRAPIUNA",
  "VALENCA",
  "ITAMARAJU",
  "MEDEIROS NETO",
  "MUCURI",
  "PRADO",
  "TEIXEIRA DE FREITAS",
  "ITAPETINGA",
  "AMARGOSA",
  "JAGUAQUARA",
  "MARACAS",
  "CAMPO ALEGRE DE LOURDES",
  "CASA NOVA",
  "CURACA",
  "JUAZEIRO",
  "PILAO ARCADO",
  "REMANSO",
  "SENTO SE",
  "UAUA",
  "BARREIRAS",
  "BURITIRAMA",
  "ESPLANADA",
  "FORMOSA DO RIO PRETO",
  "LUIS EDUARDO MAGALHAES",
  "SANTA RITA DE CASSIA",
  "MACAUBAS",
  "BRUMADO",
  "CAETITE",
  "GUANAMBI",
  "ITABERABA",
  "PIRITIBA",
  "IPIRA",
  "MAIRI",
  "RIACHAO DO JACUIPE",
  "JACOBINA",
  "CICERO DANTAS",
  "JEREMOABO",
  "PEDRO ALEXANDRE",
  "RIBEIRA DO POMBAL",
  "ALAGOINHAS",
  "ENTRE RIOS",
  "RIO REAL",
  "FEIRA DE SANTANA",
  "IRARA",
  "SANTO ESTEVAO",
  "SAO GONCALO DOS CAMPOS",
  "ANAGE",
  "BELO CAMPO",
  "MORTUGABA",
  "POCOES",
  "VITORIA DA CONQUISTA",
  "CACHOEIRA",
  "CRUZ DAS ALMAS",
  "NAZARE",
  "SANTO AMARO",
  "SANTO ANTONIO DE JESUS",
  "IPIAU",
  "JEQUIE",
  "CORRENTINA",
  "JABORANDI",
  "SANTA MARIA DA VITORIA",
  "SANTANA",
  "PAULO AFONSO",
  "PONTO NOVO",
  "SENHOR DO BONFIM",
  "CAMPO FORMOSO",
  "CAMACARI",
  "CANDEIAS",
  "LAURO DE FREITAS",
  "MATA DE SAO JOAO",
  "SALVADOR",
  "SAO FRANCISCO DO CONDE",
  "SIMOES FILHO",
  "VERA CRUZ",
  "EUNAPOLIS",
  "ITABELA",
  "ITAGIMIRIM",
  "PORTO SEGURO"
]);

// Cria a lista oficial { id, nome } a partir dos nomes, em ordem (id = posição).
function criarListaNomeada(nomes) {
  return Object.freeze(nomes.map(function (nome, indice) {
    return Object.freeze({ id: indice + 1, nome: nome });
  }));
}

// Motivos da ocorrência. O "id" é o valor estável que será gravado
// (futuramente no banco); o "nome" é apenas o texto exibido.
const MOTIVOS = Object.freeze([
  Object.freeze({ id: "comunicacao", nome: "Comunicação" }),
  Object.freeze({ id: "prazo", nome: "Prazo" }),
  Object.freeze({ id: "equipe_aplicacao", nome: "Equipe de aplicação" }),
  Object.freeze({ id: "logistica", nome: "Logística" }),
  Object.freeze({ id: "material_aplicacao", nome: "Material de aplicação" }),
  Object.freeze({ id: "procedimento_aplicacao", nome: "Procedimento de aplicação" }),
  Object.freeze({ id: "atendimento_especializado", nome: "Atendimento especializado" }),
  Object.freeze({ id: "polo", nome: "Polo" }),
  Object.freeze({ id: "seguranca_sigilo", nome: "Segurança/Sigilo" }),
  Object.freeze({ id: "financeiro", nome: "Financeiro" }),
  Object.freeze({ id: "outros_fatos_relevantes", nome: "Outros fatos relevantes" })
]);

const DADOS = Object.freeze({
  unidades: criarListaNomeada(NOMES_NTES), // NTE 01 até NTE 27
  polos: criarListaNomeada(NOMES_POLOS),   // 106 polos informados
  motivos: MOTIVOS
});
