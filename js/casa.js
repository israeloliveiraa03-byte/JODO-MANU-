/* =========================================================
   casa.js — A CASA DA VOVÓ (medidas e desenhos 2D)
   O cenário em si é 3D (veja casa3d.js). Aqui ficam as medidas da casa,
   onde fica cada coisa, e os desenhos 2D que andam por cima da cena 3D:
   os bichos, as cenouras e as roupas do guarda-roupa.

   A casa é vista "em corte", como uma casinha de bonecas aberta.
   O mundo tem 4000 de largura:
     quintal (-760–1000) · sala (1000–2000) · cozinha (2000–3000) · quarto (3000–4000)
   Os pés das pessoas pisam na linha 520.
   ========================================================= */
const MUNDO = { inicio: -760, largura: 4000, piso: 520, teto: 112 };
const ESCALA_PESSOA = .55;

const COMODOS = [
  { id: "quintal", nome: "quintal", x0: -760, x1: 1000 },
  { id: "sala", nome: "sala", x0: 1000, x1: 2000 },
  { id: "cozinha", nome: "cozinha", x0: 2000, x1: 3000 },
  { id: "quarto", nome: "quarto", x0: 3000, x1: 4000 },
];
const comodoEm = x => COMODOS.find(c => x >= c.x0 && x < c.x1) || COMODOS[0];

/* Lugares onde se guarda coisas.
   x = onde a pessoa fica de pé para usar; vagas = quantos itens cabem */
const LUGARES = {
  geladeira: { x: 2300, vagas: 6, nome: "geladeira" },
  fruteira:  { x: 2965, vagas: 4, nome: "fruteira" },
  bau:       { x: 1760, vagas: 5, nome: "baú" },
};

/* Coisas da casa que reagem ao toque (x = onde a pessoa para) */
const COISAS = {
  arvore: 360, horta: 670, galinha: 800, planta: 3234, sofa: 1290, quadro: 1290,
  radio: 1580, gato: 1700, filtro: 2070, pia: 2400, fogao: 2590,
  cama: 3470, abajur: 3730, armario: 3125,
  pato: -400, passaros: -40, casinha: -250, coruja: 300,
  freezer: 2300, armarioPia: 2400, forno: 2590, porta: 1000,
};

/* Posições dentro dos lugares (x, y do pé do item, escala) */
const VAGAS = {
  geladeira: [[2160, 356], [2222, 356], [2160, 424], [2222, 424], [2160, 490], [2222, 490]].map(([x, y]) => [x, y, .62]),
  fruteira: [[2826, 414], [2843, 410], [2860, 410], [2877, 414]].map(([x, y]) => [x, y, .58]),
  bau: [[1834, 458], [1858, 454], [1882, 458], [1906, 454], [1930, 458]].map(([x, y]) => [x, y, .62]),
};
const FRUTAS_ARVORE = [[196, 262], [298, 230], [258, 314]];
const CENOURAS_HORTA = [610, 676, 742];

/* sombrinha embaixo dos bichos */
function sombraNoChao(x, rx, y = 502) {
  return `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${n1(rx * .12 + 4)}" fill="url(#sombraChao)"/>`;
}

/* Os bichos que ficam no plano das pessoas (desenhados em 2D, por cima da cena 3D) */
function desenharBichos() {
  let s = "";
  // galinha
  s += `<g data-coisa="galinha" transform="translate(880 500)">
    <rect x="-50" y="-90" width="100" height="92" fill="#fff" fill-opacity="0"/>
    ${sombraNoChao(0, 38, 0)}
    <g class="galinha">
      <path d="M-6 0 L-6 -14 M8 0 L8 -14" stroke="#e0a03a" stroke-width="4" stroke-linecap="round"/>
      ${vol(`path d="M-30 -40 C-46 -60 -40 -78 -30 -70 C-24 -64 -26 -50 -18 -44 Z"`, "#f7f3ea")}
      ${vol(`ellipse cx="0" cy="-34" rx="32" ry="24"`, "#fbf8f1")}
      ${vol(`circle cx="22" cy="-58" r="15"`, "#fbf8f1")}
      ${vol(`path d="M16 -72 Q20 -84 24 -74 Q28 -84 32 -72 Z"`, "#e4746a")}
      <path d="M36 -60 L46 -56 L36 -52 Z" fill="#f2b630"/>
      <circle cx="27" cy="-61" r="2.6" fill="#2a1a12"/>
      ${vol(`ellipse cx="34" cy="-49" rx="3.5" ry="5"`, "#e4746a")}
      <path d="M-12 -36 Q0 -24 12 -34" stroke="#e8e1d2" stroke-width="3" fill="none" stroke-linecap="round"/>
    </g>
  </g>`;
  // passarinhos na cerca
  s += `<g data-coisa="passaros">
    <rect x="-110" y="350" width="150" height="70" fill="#fff" fill-opacity="0"/>
    ${[[-70, 400, "#e88f7a"], [0, 402, "#7fb0d8"]].map(([x, y, c], i) => `<g transform="translate(${x} ${y})"><g class="ave ave-${i}">
      ${vol(`ellipse cx="0" cy="-12" rx="14" ry="11"`, c)}
      ${vol(`circle cx="10" cy="-24" r="8"`, c)}
      <path d="M17 -25 L24 -23 L17 -21 Z" fill="#f2b630"/>
      <circle cx="12" cy="-26" r="1.6" fill="#2a1a12"/>
      ${vol(`path d="M-4 -16 Q-12 -26 -18 -12 Q-10 -10 -4 -16 Z"`, clarear(c, .25))}
      <path d="M-12 -8 L-22 -4" stroke="${c}" stroke-width="4" stroke-linecap="round"/>
    </g></g>`).join("")}
  </g>`;

  // gato dormindo no tapete
  s += `<g data-coisa="gato" transform="translate(1700 512)">
    <rect x="-56" y="-56" width="112" height="60" fill="#fff" fill-opacity="0"/>
    ${sombraNoChao(0, 52, 0)}
    <g class="gato">
      ${vol(`path d="M40 -6 Q62 -10 58 -28 Q52 -18 38 -16 Z"`, "#e9a160")}
      ${vol(`ellipse cx="0" cy="-20" rx="46" ry="22"`, "#eea567")}
      <path d="M-14 -38 q4 10 0 18 M2 -40 q4 10 0 18" stroke="#d48344" stroke-width="4" fill="none" stroke-linecap="round"/>
      ${vol(`path d="M-46 -30 L-44 -52 L-30 -40 Z"`, "#eea567")}${vol(`path d="M-24 -40 L-14 -54 L-10 -34 Z"`, "#eea567")}
      ${vol(`circle cx="-30" cy="-26" r="20"`, "#eea567")}
      <path class="olho-fechado" d="M-42 -28 q4 3 8 0 M-26 -28 q4 3 8 0" stroke="#7a3b22" stroke-width="2" fill="none" stroke-linecap="round"/>
      <g class="olho-aberto"><circle cx="-38" cy="-28" r="3.5" fill="#5f9c3c"/><circle cx="-22" cy="-28" r="3.5" fill="#5f9c3c"/></g>
      <path d="M-32 -20 L-28 -20 L-30 -17 Z" fill="#e0707f"/>
    </g></g>`;
  // pato no laguinho
  s += `<g data-coisa="pato">
    <g transform="translate(-440 512)"><g class="pato">
      ${vol(`ellipse cx="0" cy="-16" rx="30" ry="17"`, "#fbf6e8")}
      ${vol(`path d="M-30 -20 L-42 -30 L-28 -12 Z"`, "#f3ecd9")}
      ${vol(`circle cx="20" cy="-40" r="13"`, "#fbf6e8")}
      ${vol(`path d="M31 -40 Q44 -38 44 -34 Q36 -32 30 -34 Z"`, "#f2a23a")}
      <circle cx="23" cy="-43" r="2.4" fill="#2a1a12"/>
      <path d="M-14 -20 Q0 -10 14 -18" stroke="#ebe2cb" stroke-width="3" fill="none" stroke-linecap="round"/>
    </g></g>
  </g>`;
  // coruja no galho da mangueira
  s += `<g class="coruja-toque" data-coisa="coruja" transform="translate(300 300)">
    <rect x="-34" y="-64" width="68" height="70" fill="#fff" fill-opacity="0"/>
    <g class="coruja">
      ${vol('ellipse cx="0" cy="-26" rx="22" ry="26"', "#9a7a5c")}
      ${vol('ellipse cx="0" cy="-18" rx="14" ry="16"', "#c9ad8c")}
      <path d="M-18 -46 L-14 -60 L-6 -48 Z M18 -46 L14 -60 L6 -48 Z" fill="#8a6a4e"/>
      <circle cx="-9" cy="-38" r="8" fill="#fff8e0"/><circle cx="9" cy="-38" r="8" fill="#fff8e0"/>
      <circle cx="-9" cy="-38" r="4" fill="#2a1a12"/><circle cx="9" cy="-38" r="4" fill="#2a1a12"/>
      <path d="M-3 -30 L3 -30 L0 -24 Z" fill="#f2b630"/>
      <path d="M-30 2 L30 2" stroke="#9a6a46" stroke-width="7" stroke-linecap="round"/>
    </g></g>`;
  // cenouras da horta
  s += `<g data-coisa="horta"><g id="cenouras"></g></g>`;
  return s;
}

/* ---------- o cachorro (anda pelo quintal, por isso é desenhado à parte) ---------- */
function desenharCachorro() {
  const C = "#d9a066", E = "#b57a42", B = "#f3d7b0";
  return `<rect x="-60" y="-90" width="120" height="92" fill="#fff" fill-opacity="0"/>
    <ellipse cx="0" cy="0" rx="46" ry="7" fill="url(#sombraChao)"/>
    <g class="corpo-cao">
      <g class="rabo-cao">${vol('path d="M-36 -46 Q-58 -66 -52 -78 Q-44 -66 -30 -54 Z"', C)}</g>
      ${["-26", "-12", "14", "28"].map((x, i) => `<g class="pata pata-${i % 2}">${vol(`rect x="${+x - 6}" y="-34" width="12" height="34" rx="6"`, i % 2 ? C : E, "cil")}</g>`).join("")}
      ${vol('ellipse cx="0" cy="-42" rx="40" ry="20"', C)}
      ${vol('ellipse cx="4" cy="-34" rx="22" ry="10"', B)}
      ${vol('circle cx="34" cy="-62" r="20"', C)}
      ${vol('ellipse cx="50" cy="-56" rx="12" ry="9"', B)}
      <ellipse cx="60" cy="-60" rx="5" ry="4" fill="#3a2418"/>
      <circle cx="38" cy="-68" r="3.2" fill="#2a1a12"/><circle cx="39" cy="-69" r="1.1" fill="#fff"/>
      <g class="orelha-cao">${vol('path d="M22 -78 Q12 -76 14 -54 Q24 -58 30 -72 Z"', E)}</g>
      <path d="M50 -50 Q55 -46 60 -50" stroke="#7a3b22" stroke-width="2" fill="none" stroke-linecap="round"/>
      <g class="boca-cao" transform="translate(60 -48)"></g>
    </g>`;
}

function desenharCenouras(horta) {
  return horta.map((tem, i) => tem ? `<g data-vaga="${i}" transform="translate(${CENOURAS_HORTA[i]} 490)">
      <circle cx="0" cy="-20" r="30" fill="#fff" fill-opacity="0"/>
      ${vol('path d="M-9 0 Q0 -5 9 0 L6 6 L-6 6 Z"', "#f08a3c")}
      ${vol('path d="M-2 -2 Q-14 -24 -8 -30 Q0 -18 0 -2 Z"', "#6aa65a")}${vol('path d="M2 -2 Q12 -26 18 -20 Q8 -14 2 -2 Z"', "#7cbb68")}${vol('path d="M0 -2 Q-2 -26 4 -32 Q6 -16 0 -2 Z"', "#86c070")}
    </g>` : `<ellipse cx="${CENOURAS_HORTA[i]}" cy="490" rx="8" ry="3" fill="#7d5c40"/>`).join("");
}
/* Uma roupinha pendurada; tocar nela veste a Manu */
function roupaNoCabide(x, roupa, cor) {
  const corpo = roupa === "pijama"
    ? vol(`path d="M${x - 15} 290 L${x + 15} 290 L${x + 17} 330 L${x + 12} 380 L${x + 2} 380 L${x} 340 L${x - 2} 380 L${x - 12} 380 L${x - 17} 330 Z"`, cor, "volSuave") +
      `<circle cx="${x - 6}" cy="${306}" r="2.5" fill="#fff" fill-opacity=".8"/><circle cx="${x + 7}" cy="${322}" r="2.5" fill="#fff" fill-opacity=".8"/><circle cx="${x - 7}" cy="${354}" r="2.5" fill="#fff" fill-opacity=".8"/>`
    : vol(`path d="M${x - 13} 290 L${x + 13} 290 L${x + 15} 312 L${x + 26} ${roupa === "fada" ? 360 : 352} L${x - 26} ${roupa === "fada" ? 360 : 352} L${x - 15} 312 Z"`, cor, "volSuave") +
      (roupa === "fada" ? `<g fill="#e9e0ff" fill-opacity=".85"><ellipse cx="${x - 20}" cy="300" rx="12" ry="8"/><ellipse cx="${x + 20}" cy="300" rx="12" ry="8"/></g><polygon points="${pontosEstrela(x, 336, 5)}" fill="#fff"/>`
        : `<circle cx="${x - 8}" cy="330" r="2" fill="${escurecer(cor, .25)}"/><circle cx="${x + 6}" cy="338" r="2" fill="${escurecer(cor, .25)}"/><circle cx="${x - 2}" cy="320" r="2" fill="${escurecer(cor, .25)}"/>`);
  return `<g data-roupa="${roupa}">
    <rect x="${x - 20}" y="262" width="40" height="124" fill="#fff" fill-opacity="0"/>
    <path d="M${x} 264 q-5 -1 -4 6 M${x - 14} 288 L${x} 274 L${x + 14} 288" stroke="#cfc3b0" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    ${corpo}</g>`;
}

