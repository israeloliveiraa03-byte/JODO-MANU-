/* =========================================================
   itens.js — AS COISAS QUE DÁ PARA PEGAR

   Cada item tem:
   - nome:  como a voz chama o item
   - tipo:  "fruta", "comida" ou "brinquedo" (decide onde ele "mora")
   - d():   o desenho, com o pé do item no ponto (0, 0)
   ========================================================= */
const ITENS = {
  manga: {
    nome: "manga", tipo: "fruta",
    d: () => `${vol('path d="M-4 0 C-26 0 -28 -30 -14 -42 C-4 -50 14 -48 20 -34 C26 -18 18 0 -4 0 Z"', "#f2a23a")}
      <path d="M-14 -40 C-6 -48 8 -48 16 -38 C8 -40 -4 -40 -14 -40 Z" fill="#e0603e" fill-opacity=".55"/>
      <path d="M2 -46 Q4 -52 8 -54" stroke="#6b4a2a" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      ${vol('path d="M8 -52 Q22 -60 26 -48 Q16 -46 8 -52 Z"', "#6aa65a")}`,
  },
  umbu: {
    nome: "umbu", tipo: "fruta",
    d: () => `${vol('circle cx="0" cy="-17" r="17"', "#c6cf6a")}
      <circle cx="-6" cy="-22" r="1.4" fill="#a7b04e"/><circle cx="5" cy="-12" r="1.4" fill="#a7b04e"/><circle cx="7" cy="-24" r="1.2" fill="#a7b04e"/>
      <path d="M0 -34 Q1 -39 4 -41" stroke="#6b4a2a" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
  },
  laranja: {
    nome: "laranja", tipo: "fruta",
    d: () => `${vol('circle cx="0" cy="-21" r="21"', "#f39a3c")}
      <circle cx="-6" cy="-26" r="1.3" fill="#d97f22"/><circle cx="6" cy="-14" r="1.3" fill="#d97f22"/><circle cx="8" cy="-28" r="1.3" fill="#d97f22"/>
      ${vol('path d="M1 -41 Q12 -52 18 -42 Q9 -38 1 -41 Z"', "#6aa65a")}`,
  },
  banana: {
    nome: "banana", tipo: "fruta",
    d: () => `${vol('path d="M-26 -30 C-22 -6 10 2 28 -14 C30 -17 28 -20 25 -18 C10 -8 -14 -12 -20 -32 Z"', "#f6d35a")}
      <path d="M-26 -30 L-22 -36" stroke="#7a5a2a" stroke-width="4" stroke-linecap="round"/>
      <circle cx="27" cy="-16" r="2.5" fill="#6b4a2a"/>`,
  },
  cenoura: {
    nome: "cenoura", tipo: "comida",
    d: () => `${vol('path d="M-11 -40 Q0 -44 11 -40 L2 -2 Q0 2 -2 -2 Z"', "#f08a3c")}
      <path d="M-6 -30 L0 -29 M-4 -20 L1 -19 M-2 -11 L1 -10" stroke="#c96a26" stroke-width="2" stroke-linecap="round"/>
      ${vol('path d="M-2 -40 Q-14 -58 -8 -62 Q0 -52 0 -40 Z"', "#6aa65a")}${vol('path d="M2 -40 Q12 -60 18 -54 Q8 -48 2 -40 Z"', "#7cbb68")}`,
  },
  ovo: {
    nome: "ovo", tipo: "comida",
    d: () => vol('path d="M0 -38 C14 -38 20 -16 18 -10 C16 -2 8 0 0 0 C-8 0 -16 -2 -18 -10 C-20 -16 -14 -38 0 -38 Z"', "#fbf3e4"),
  },
  leite: {
    nome: "leite", tipo: "comida",
    d: () => `${vol('rect x="-17" y="-48" width="34" height="48" rx="4"', "#fbfbf8", "volSuave")}
      ${vol('path d="M-17 -48 L0 -62 L17 -48 Z"', "#e9eef5")}
      <rect x="-17" y="-30" width="34" height="14" fill="#6aa8e8"/>
      <circle cx="0" cy="-23" r="5" fill="#fff"/>`,
  },
  queijo: {
    nome: "queijo", tipo: "comida",
    d: () => `${vol('path d="M-24 0 L-24 -22 L22 -34 L24 0 Z"', "#f6cf5a", "volSuave")}
      ${vol('path d="M-24 -22 L22 -34 L24 -30 L-22 -18 Z"', "#fbe08a")}
      <circle cx="-8" cy="-10" r="4" fill="#e3b33a"/><circle cx="10" cy="-16" r="3" fill="#e3b33a"/><circle cx="6" cy="-5" r="2.5" fill="#e3b33a"/>`,
  },
  pao: {
    nome: "pão", tipo: "comida",
    d: () => `${vol('path d="M-28 0 C-32 -24 -14 -34 0 -34 C14 -34 32 -24 28 0 Z"', "#d9a05a")}
      <path d="M-14 -28 Q-10 -18 -14 -10 M0 -32 Q4 -20 0 -10 M14 -28 Q18 -18 14 -10" stroke="#f3d29a" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,
  },
  bolo: {
    nome: "bolo", tipo: "comida",
    d: () => `${vol('ellipse cx="0" cy="-3" rx="30" ry="6"', "#f1ece2")}
      ${vol('rect x="-24" y="-34" width="48" height="30" rx="8"', "#e2b07a", "volSuave")}
      ${vol('path d="M-25 -30 Q-25 -40 -14 -40 L14 -40 Q25 -40 25 -30 q-6 8 -12 0 q-6 8 -12 0 q-6 8 -12 0 q-6 8 -12 0 Z"', "#fff3ec", "volSuave")}
      ${vol('circle cx="0" cy="-44" r="5"', "#e4574b")}`,
  },
  picole: {
    nome: "picolé", tipo: "comida",
    d: () => `<rect x="-3.5" y="-16" width="7" height="16" rx="3" fill="#e2c49a"/>
      ${vol('rect x="-12" y="-52" width="24" height="38" rx="11"', "#f39ab6", "volSuave")}
      <path d="M-12 -30 Q0 -24 12 -30 L12 -26 Q0 -20 -12 -26 Z" fill="#fbd3e0"/>`,
  },
  bola: {
    nome: "bola", tipo: "brinquedo",
    d: () => `${vol('circle cx="0" cy="-24" r="24"', "#f08a7e")}
      <path d="M-24 -24 Q0 -14 24 -24" stroke="#fff" stroke-width="5" fill="none"/>
      <path d="M-14 -44 Q0 -30 14 -44" stroke="#f6d35a" stroke-width="5" fill="none"/>`,
  },
  urso: {
    nome: "ursinho", tipo: "brinquedo",
    d: () => { const U = "#c08a5a", C = "#ecc79c"; return `
      ${vol(`circle cx="-15" cy="-58" r="8"`, U)}${vol(`circle cx="15" cy="-58" r="8"`, U)}
      ${vol(`ellipse cx="0" cy="-18" rx="20" ry="18"`, U)}
      ${vol(`ellipse cx="0" cy="-15" rx="10" ry="10"`, C)}
      ${vol(`circle cx="-17" cy="-6" r="7"`, U)}${vol(`circle cx="17" cy="-6" r="7"`, U)}
      ${vol(`circle cx="0" cy="-46" r="17"`, U)}
      ${vol(`ellipse cx="0" cy="-41" rx="7.5" ry="6"`, C)}
      <ellipse cx="0" cy="-43" rx="3" ry="2.2" fill="#3a2418"/>
      <circle cx="-6" cy="-50" r="2.4" fill="#2a1a12"/><circle cx="6" cy="-50" r="2.4" fill="#2a1a12"/>
      <path d="M-6 -32 L0 -28 L6 -32" stroke="#e4574b" stroke-width="4" fill="none" stroke-linecap="round"/>`; },
  },
  cubo: {
    nome: "bloquinho", tipo: "brinquedo",
    d: () => `${vol('rect x="-21" y="-42" width="42" height="42" rx="7"', "#7aa7e0", "volSuave")}
      <rect x="-14" y="-35" width="28" height="28" rx="5" fill="#fff" fill-opacity=".85"/>
      <text x="0" y="-12" text-anchor="middle" font-family="Baloo 2, Trebuchet MS, sans-serif" font-weight="800" font-size="24" fill="#4a7cc4">A</text>`,
  },
};

const ehComida = tipo => ITENS[tipo].tipo === "fruta" || ITENS[tipo].tipo === "comida";

/* Desenha um item com uma área de toque maior que ele (dedinhos pequenos erram) */
function desenharItem(tipo, attrs = "") {
  return `<g ${attrs}><circle cx="0" cy="-26" r="44" fill="#fff" fill-opacity="0"/>${ITENS[tipo].d()}</g>`;
}
