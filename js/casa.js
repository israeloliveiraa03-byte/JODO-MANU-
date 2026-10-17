/* =========================================================
   casa.js — A CASA DA VOVÓ (os desenhos)

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
  arvore: 360, horta: 670, galinha: 800, planta: 1080, sofa: 1290, quadro: 1290,
  radio: 1580, gato: 1700, filtro: 2070, pia: 2400, fogao: 2590,
  cama: 3470, abajur: 3730, armario: 3125,
  pato: -400, passaros: -40, casinha: -250, coruja: 300,
};

/* Posições dentro dos lugares (x, y do pé do item, escala) */
const VAGAS = {
  geladeira: [[2160, 356], [2222, 356], [2160, 424], [2222, 424], [2160, 490], [2222, 490]].map(([x, y]) => [x, y, .62]),
  fruteira: [[2826, 414], [2843, 410], [2860, 410], [2877, 414]].map(([x, y]) => [x, y, .58]),
  bau: [[1834, 458], [1858, 454], [1882, 458], [1906, 454], [1930, 458]].map(([x, y]) => [x, y, .62]),
};
const FRUTAS_ARVORE = [[196, 262], [298, 230], [258, 314]];
const CENOURAS_HORTA = [610, 676, 742];

/* ---------- pedacinhos reaproveitados ---------- */
function janelaCasa(x, y, w, h, corCortina) {
  return `<g>
    <rect x="${x + 5}" y="${y + 8}" width="${w}" height="${h}" rx="10" fill="#1a0f14" fill-opacity=".07"/>
    ${vol(`rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10"`, "#fbf8f2", "volSuave")}
    <rect x="${x + 10}" y="${y + 10}" width="${w - 20}" height="${h - 20}" rx="5" fill="#cfe5f1"/>
    <ellipse cx="${x + w * .3}" cy="${y + h - 26}" rx="${w * .35}" ry="18" fill="#bcd8a4"/>
    <rect x="${x + 10}" y="${y + 10}" width="${w - 20}" height="${h - 20}" rx="5" fill="url(#vidro)"/>
    <rect x="${x + w / 2 - 3}" y="${y + 10}" width="6" height="${h - 20}" fill="#fbf8f2"/>
    ${vol(`path d="M${x - 8} ${y - 6} Q${x + 18} ${y + h * .5} ${x + 4} ${y + h + 6} L${x - 14} ${y + h + 6} L${x - 14} ${y - 6} Z"`, corCortina, "volSuave")}
    ${vol(`path d="M${x + w + 8} ${y - 6} Q${x + w - 18} ${y + h * .5} ${x + w - 4} ${y + h + 6} L${x + w + 14} ${y + h + 6} L${x + w + 14} ${y - 6} Z"`, corCortina, "volSuave")}
    ${vol(`rect x="${x - 22}" y="${y - 12}" width="${w + 44}" height="8" rx="4"`, "#b58a62", "cil")}
  </g>`;
}

function sombraNoChao(x, rx, y = 502) {
  return `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${n1(rx * .12 + 4)}" fill="url(#sombraChao)"/>`;
}

/* ---------- o céu, o chão e o telhado ---------- */
function desenharCeuEChao() {
  let s = `<rect x="-4000" y="-3000" width="12000" height="3500" fill="url(#ceuDia)"/>`;
  s += `<circle cx="140" cy="-70" r="120" fill="url(#luzJanela)"/><circle cx="140" cy="-70" r="46" fill="#fff1c4"/>`;
  for (const [x, y, k] of [[520, -120, 1], [-300, 20, .8], [4400, -60, 1.1], [3300, -260, .9], [1800, -300, .8], [820, 40, .7]]) {
    s += `<g class="nuvem-ceu" transform="translate(${x} ${y}) scale(${k})" fill="#fff" fill-opacity=".85">
      <ellipse cx="0" cy="0" rx="70" ry="26"/><ellipse cx="34" cy="-16" rx="40" ry="26"/><ellipse cx="-30" cy="-10" rx="32" ry="20"/></g>`;
  }
  // morros ao longe
  s += `<ellipse cx="-600" cy="490" rx="900" ry="140" fill="#cfe0bd"/><ellipse cx="700" cy="500" rx="700" ry="110" fill="#c5dab0"/>`;
  s += `<ellipse cx="4700" cy="495" rx="900" ry="150" fill="#cfe0bd"/>`;
  // grama e terra
  s += `<rect x="-4000" y="488" width="12000" height="76" fill="#bcd69f"/>`;
  s += `<rect x="-4000" y="488" width="12000" height="10" fill="#a9c78c" fill-opacity=".6"/>`;
  // jardim da frente (aparece com o celular em pé)
  s += `<rect x="-4000" y="560" width="12000" height="3000" fill="#b3cf96"/>`;
  s += `<rect x="-4000" y="560" width="12000" height="18" fill="#a3c287"/>`;
  for (let x = -3900, i = 0; x < 8000; x += 170, i++) {
    const y = 660 + (i % 3) * 34;
    s += vol(`ellipse cx="${x}" cy="${y}" rx="${46 + (i % 2) * 14}" ry="28"`, i % 2 ? "#9fc184" : "#a7c78b", "volSuave");
    if (i % 2 === 0) s += `<circle cx="${x - 18}" cy="${y - 14}" r="5" fill="#f3d6dc"/><circle cx="${x + 12}" cy="${y - 20}" r="5" fill="#fbf3dc"/><circle cx="${x + 26}" cy="${y - 6}" r="4.5" fill="#f3d6dc"/>`;
  }
  s += `<path d="M960 566 Q900 760 980 1100 L1060 1100 Q990 760 1030 566 Z" fill="#e3d2b4"/>`;
  return s;
}

function desenharTelhado() {
  let s = `<path d="M960 94 L1190 -44 L3810 -44 L4040 94 Z" fill="#1a0f14" fill-opacity=".08" transform="translate(6 8)"/>`;
  s += vol(`path d="M960 94 L1190 -44 L3810 -44 L4040 94 Z"`, "#c98a6e", "volSuave");
  for (let y = -26, i = 0; y < 90; y += 24, i++) {
    const dx = (y + 44) * (230 / 138);
    let d = `M${n1(1190 - dx)} ${y}`;
    for (let x = 1190 - dx + (i % 2) * 20; x < 3810 + dx - 40; x += 40) d += ` q20 12 40 0`;
    s += `<path d="${d}" stroke="#b5755a" stroke-width="2.5" fill="none" stroke-opacity=".6"/>`;
  }
  // chaminé com fumacinha lenta
  s += vol(`rect x="2600" y="-120" width="64" height="86" rx="6"`, "#b8735a", "volSuave");
  s += vol(`rect x="2592" y="-130" width="80" height="16" rx="6"`, "#a8664e", "volSuave");
  s += `<g class="fumaca" fill="#fff"><circle cx="2632" cy="-150" r="14"/><circle cx="2646" cy="-150" r="10"/></g>`;
  return s;
}

/* ---------- o quintal ---------- */
function desenharQuintal() {
  let s = "";
  // cerca
  for (let x = -742; x < 990; x += 56) s += vol(`path d="M${x - 9} 492 L${x - 9} 412 L${x} 400 L${x + 9} 412 L${x + 9} 492 Z"`, "#f3eee4", "volSuave");
  s += vol(`rect x="-756" y="424" width="1742" height="10" rx="4"`, "#ece5d8", "cil") + vol(`rect x="-756" y="462" width="1742" height="10" rx="4"`, "#ece5d8", "cil");

  // laguinho com o pato
  s += `<g data-coisa="pato">
    <rect x="-560" y="430" width="250" height="100" fill="#fff" fill-opacity="0"/>
    ${vol(`ellipse cx="-430" cy="514" rx="128" ry="24"`, "#9ccbdc", "volSuave")}
    <ellipse cx="-430" cy="512" rx="104" ry="15" fill="#b7dbe7"/>
    <path d="M-470 512 q14 -4 28 0 M-400 518 q14 -4 28 0" stroke="#fff" stroke-opacity=".7" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    ${[-548, -538, -318].map((x, i) => `<path d="M${x} 512 Q${x - 4} ${470 - i * 8} ${x + 2} ${452 - i * 6}" stroke="#7fae6a" stroke-width="4" fill="none" stroke-linecap="round"/>`).join("")}
    <g transform="translate(-440 512)"><g class="pato">
      ${vol(`ellipse cx="0" cy="-16" rx="30" ry="17"`, "#fbf6e8")}
      ${vol(`path d="M-30 -20 L-42 -30 L-28 -12 Z"`, "#f3ecd9")}
      ${vol(`circle cx="20" cy="-40" r="13"`, "#fbf6e8")}
      ${vol(`path d="M31 -40 Q44 -38 44 -34 Q36 -32 30 -34 Z"`, "#f2a23a")}
      <circle cx="23" cy="-43" r="2.4" fill="#2a1a12"/>
      <path d="M-14 -20 Q0 -10 14 -18" stroke="#ebe2cb" stroke-width="3" fill="none" stroke-linecap="round"/>
    </g></g>
  </g>`;

  // casinha do cachorro
  s += `<g>${sombraNoChao(-250, 70)}
    ${vol(`rect x="-310" y="430" width="120" height="70" rx="6"`, "#d9b38c", "volSuave")}
    ${vol(`path d="M-322 436 L-250 380 L-178 436 Z"`, "#c98a6e", "volSuave")}
    <path d="M-272 500 L-272 468 Q-250 446 -228 468 L-228 500 Z" fill="#6b4a36"/>
    <rect x="-276" y="418" width="52" height="12" rx="4" fill="#fbf6ee"/>
    <text x="-250" y="428" text-anchor="middle" font-family="Baloo 2, Trebuchet MS, sans-serif" font-weight="800" font-size="10" fill="#8a6a55">CARAMELO</text>
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

  // mangueira
  s += `<g data-coisa="arvore" class="arvore">
    <rect x="110" y="80" width="300" height="420" fill="#fff" fill-opacity="0"/>
    ${sombraNoChao(262, 130)}
    ${vol(`path d="M236 500 C244 420 240 360 222 300 L250 296 C262 340 268 300 300 280 L312 292 C284 320 276 380 284 500 Z"`, "#9a6a46", "cil")}
    <g class="copa">
      ${vol(`circle cx="170" cy="270" r="76"`, "#86b072")}${vol(`circle cx="352" cy="268" r="80"`, "#86b072")}
      ${vol(`circle cx="222" cy="164" r="72"`, "#8fb97a")}${vol(`circle cx="312" cy="172" r="74"`, "#8fb97a")}
      ${vol(`circle cx="262" cy="236" r="104"`, "#93bd7e")}
      <g id="frutas-arvore"></g>
    </g>
  </g>`;

  // horta
  s += `<g data-coisa="horta">
    <rect x="560" y="420" width="230" height="100" fill="#fff" fill-opacity="0"/>
    ${vol(`rect x="566" y="482" width="216" height="24" rx="10"`, "#9a7454", "volSuave")}
    <g id="cenouras"></g>
  </g>`;

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
  return s;
}

/* ---------- a casa por dentro ---------- */
function desenharParedes() {
  let s = "";
  // sala: verde-sálvia com listras bem suaves
  s += `<rect x="1000" y="${MUNDO.teto}" width="1000" height="${488 - MUNDO.teto}" fill="#dfe7d5"/>`;
  for (let x = 1020; x < 2000; x += 44) s += `<rect x="${x}" y="${MUNDO.teto}" width="16" height="${488 - MUNDO.teto}" fill="#e8eee0"/>`;
  // cozinha: creme em cima, azulejo embaixo
  s += `<rect x="2000" y="${MUNDO.teto}" width="1000" height="${488 - MUNDO.teto}" fill="#f4ecdc"/>`;
  s += `<rect x="2000" y="356" width="1000" height="132" fill="#e6eff0"/>`;
  for (let x = 2000; x <= 3000; x += 33) s += `<line x1="${x}" y1="356" x2="${x}" y2="488" stroke="#fff" stroke-width="2"/>`;
  for (let y = 356; y <= 488; y += 33) s += `<line x1="2000" y1="${y}" x2="3000" y2="${y}" stroke="#fff" stroke-width="2"/>`;
  // quarto: rosa-antigo com bolinhas
  s += `<rect x="3000" y="${MUNDO.teto}" width="1000" height="${488 - MUNDO.teto}" fill="#f1e3e0"/>`;
  for (let y = 140, l = 0; y < 480; y += 46, l++) for (let x = 3020 + (l % 2) * 23; x < 4000; x += 46) s += `<circle cx="${x}" cy="${y}" r="2.6" fill="#e6cfcb"/>`;
  // sombra suave embaixo do teto
  s += `<rect x="1000" y="${MUNDO.teto}" width="3000" height="40" fill="url(#sombraTeto)"/>`;
  // rodapé
  s += `<rect x="1000" y="472" width="3000" height="16" fill="#f6f2ea"/>`;
  // piso de madeira
  s += `<rect x="1000" y="488" width="3000" height="72" fill="#d8ab78"/>`;
  for (const y of [506, 524, 542]) s += `<line x1="1000" y1="${y}" x2="4000" y2="${y}" stroke="#c4935f" stroke-width="2" stroke-opacity=".6"/>`;
  s += `<rect x="1000" y="488" width="3000" height="8" fill="#1a0f14" fill-opacity=".06"/>`;
  s += vol(`rect x="992" y="556" width="3016" height="12" rx="3"`, "#b98a5a", "cil");
  s += vol(`rect x="996" y="566" width="3008" height="44" rx="4"`, "#d3bba0", "volSuave");
  for (let x = 1040; x < 4000; x += 120) s += `<rect x="${x}" y="576" width="80" height="24" rx="5" fill="#c7ad8e" fill-opacity=".6"/>`;
  return s;
}

function desenharEstrutura() {
  // laje do teto, paredes cortadas e vãos das portas
  let s = vol(`rect x="986" y="90" width="3028" height="24" rx="4"`, "#d2a679", "cil");
  s += vol(`rect x="986" y="90" width="30" height="160" rx="4"`, "#e8d9c2", "cil");     // parede do quintal (porta embaixo)
  s += vol(`rect x="986" y="488" width="30" height="78" rx="4"`, "#e8d9c2", "cil");
  s += vol(`rect x="3984" y="90" width="30" height="476" rx="4"`, "#e8d9c2", "cil");    // parede do fundo
  for (const x of [2000, 3000]) s += vol(`rect x="${x - 13}" y="112" width="26" height="128" rx="4"`, "#e8d9c2", "cil");
  return s;
}

function retratos(fichas) {
  const pessoas = ["manu", "vovo", "vovoo"];
  return `<g data-coisa="quadro">` + pessoas.map((id, i) => {
    const x = 1196 + i * 94, y = 186;
    return `<g data-quem="${id}">
      <rect x="${x - 34}" y="${y + 6}" width="76" height="86" rx="8" fill="#1a0f14" fill-opacity=".08"/>
      ${vol(`rect x="${x - 38}" y="${y}" width="76" height="86" rx="8"`, "#c49a6c", "volSuave")}
      <rect x="${x - 30}" y="${y + 8}" width="60" height="70" rx="4" fill="#f7efe2"/>
      <svg x="${x - 30}" y="${y + 8}" width="60" height="70" viewBox="${recorteDe("rosto", fichas[id])}">${desenharAvatar(fichas[id], { sombra: false })}</svg>
    </g>`;
  }).join("") + `</g>`;
}

function desenharSala(fichas) {
  let s = janelaCasa(1494, 168, 150, 156, "#c8d6b8");
  s += retratos(fichas);
  // planta
  s += `<g data-coisa="planta">${sombraNoChao(1074, 40)}
    ${vol(`path d="M1046 440 L1102 440 L1094 500 L1054 500 Z"`, "#c98a6e", "volSuave")}
    ${vol(`path d="M1074 440 C1040 400 1030 360 1052 340 C1062 380 1070 400 1074 440 Z"`, "#7fae6a")}
    ${vol(`path d="M1074 440 C1100 390 1120 360 1112 330 C1090 360 1080 400 1074 440 Z"`, "#8fb97a")}
    ${vol(`path d="M1074 440 C1066 390 1076 350 1080 320 C1090 360 1086 400 1074 440 Z"`, "#86b072")}</g>`;
  // sofá
  s += `<g data-coisa="sofa">${sombraNoChao(1290, 150)}
    ${vol(`rect x="1168" y="372" width="244" height="90" rx="30"`, "#a9bccb", "volSuave")}
    ${vol(`rect x="1176" y="432" width="228" height="48" rx="18"`, "#b6c8d5", "volSuave")}
    ${vol(`rect x="1146" y="410" width="44" height="76" rx="20"`, "#9fb3c3", "volSuave")}${vol(`rect x="1390" y="410" width="44" height="76" rx="20"`, "#9fb3c3", "volSuave")}
    ${vol(`rect x="1200" y="396" width="64" height="44" rx="14"`, "#e9d6b9", "volSuave")}${vol(`rect x="1316" y="396" width="64" height="44" rx="14"`, "#e3c4c0", "volSuave")}
    <rect x="1170" y="484" width="10" height="16" rx="3" fill="#8d6a4c"/><rect x="1400" y="484" width="10" height="16" rx="3" fill="#8d6a4c"/></g>`;
  // tapete
  s += `<ellipse cx="1500" cy="514" rx="170" ry="22" fill="#e8cdb6"/><ellipse cx="1500" cy="514" rx="150" ry="16" fill="none" stroke="#f3e2d3" stroke-width="3" stroke-dasharray="8 7"/>`;
  // mesinha com rádio
  s += `<g data-coisa="radio">${sombraNoChao(1580, 46)}
    <rect x="1520" y="340" width="120" height="160" fill="#fff" fill-opacity="0"/>
    ${vol(`rect x="1536" y="436" width="88" height="12" rx="5"`, "#b58a62", "cil")}
    ${vol(`rect x="1546" y="446" width="10" height="54" rx="4"`, "#a87d56", "cil")}${vol(`rect x="1604" y="446" width="10" height="54" rx="4"`, "#a87d56", "cil")}
    ${vol(`rect x="1546" y="390" width="68" height="46" rx="12"`, "#c98a6e", "volSuave")}
    <circle cx="1566" cy="413" r="13" fill="#e9d6b9"/>
    <path d="M1557 407 h18 M1555 413 h22 M1557 419 h18" stroke="#c9b08e" stroke-width="2" stroke-linecap="round"/>
    ${vol(`circle cx="1596" cy="406" r="6"`, "#f3e7c9")}${vol(`circle cx="1596" cy="422" r="6"`, "#f3e7c9")}
    <path d="M1594 390 L1606 362" stroke="#8d6a4c" stroke-width="2.5" stroke-linecap="round"/>
    <g class="notas" fill="#8a7bb8"><text x="1612" y="380" font-size="22">♪</text><text x="1630" y="360" font-size="18">♫</text></g></g>`;
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
  // baú de brinquedos
  s += `<g data-lugar="bau" id="bau" class="bau">
    ${sombraNoChao(1880, 80)}
    <rect x="1796" y="380" width="168" height="124" fill="#fff" fill-opacity="0"/>
    <rect x="1812" y="430" width="136" height="70" rx="8" fill="#7a5236"/>
    <g id="dentro-bau"></g>
    ${vol(`rect x="1808" y="444" width="144" height="58" rx="10"`, "#b98458", "volSuave")}
    <rect x="1808" y="458" width="144" height="6" fill="#9a6a46" fill-opacity=".5"/>
    ${vol(`rect x="1868" y="452" width="24" height="18" rx="5"`, "#e8c46a")}
    <g class="tampa-bau">${vol(`path d="M1804 446 L1804 428 Q1804 410 1824 410 L1936 410 Q1956 410 1956 428 L1956 446 Z"`, "#c48f62", "volSuave")}
      <rect x="1804" y="434" width="152" height="5" fill="#9a6a46" fill-opacity=".45"/></g>
  </g>`;
  return s;
}

function desenharCozinha() {
  let s = janelaCasa(2330, 178, 140, 136, "#e9b7a8");
  // filtro de barro
  s += `<g data-coisa="filtro">${sombraNoChao(2066, 40)}
    <rect x="2020" y="330" width="96" height="172" fill="#fff" fill-opacity="0"/>
    ${vol(`rect x="2030" y="434" width="72" height="10" rx="4"`, "#b58a62", "cil")}
    ${vol(`rect x="2038" y="444" width="10" height="56" rx="4"`, "#a87d56", "cil")}${vol(`rect x="2084" y="444" width="10" height="56" rx="4"`, "#a87d56", "cil")}
    ${vol(`ellipse cx="2066" cy="404" rx="30" ry="30"`, "#c47a58")}
    ${vol(`ellipse cx="2066" cy="358" rx="25" ry="24"`, "#cc8462")}
    ${vol(`ellipse cx="2066" cy="334" rx="14" ry="6"`, "#b8714f")}
    <path d="M2034 382 Q2066 392 2098 382" stroke="#a8634a" stroke-width="3" fill="none"/>
    ${vol(`rect x="2088" y="410" width="16" height="7" rx="3"`, "#9fb3c3")}
    <g class="gota"><path d="M2102 420 q-4 7 0 9 q4 -2 0 -9 Z" fill="#8fc3e6"/></g></g>`;
  // geladeira
  s += `<g data-lugar="geladeira" id="geladeira" class="geladeira">
    ${sombraNoChao(2190, 84)}
    <rect x="2116" y="220" width="148" height="284" fill="#fff" fill-opacity="0"/>
    ${vol(`rect x="2120" y="226" width="140" height="274" rx="24"`, "#c9e2d7", "volSuave")}
    <rect x="2130" y="300" width="120" height="194" rx="8" fill="#f6fbf9"/>
    <rect x="2130" y="300" width="120" height="30" fill="#e3f0ea"/>
    ${[358, 426].map(y => `<rect x="2134" y="${y}" width="112" height="5" rx="2" fill="#d5e7df"/>`).join("")}
    <g id="dentro-geladeira"></g>
    ${vol(`path d="M2120 296 L2120 250 Q2120 226 2144 226 L2236 226 Q2260 226 2260 250 L2260 296 Z"`, "#cfe6dc", "volSuave")}
    ${vol(`rect x="2134" y="248" width="8" height="34" rx="4"`, "#eef6f2", "cil")}
    <g class="porta-geladeira">
      ${vol(`path d="M2120 300 L2260 300 L2260 478 Q2260 500 2238 500 L2142 500 Q2120 500 2120 478 Z"`, "#cfe6dc", "volSuave")}
      ${vol(`rect x="2132" y="320" width="9" height="74" rx="4.5"`, "#eef6f2", "cil")}
      <circle cx="2232" cy="324" r="7" fill="#f2b630" fill-opacity=".8"/>
    </g>
    <rect x="2132" y="498" width="14" height="6" rx="2" fill="#9aa9a2"/><rect x="2234" y="498" width="14" height="6" rx="2" fill="#9aa9a2"/>
  </g>`;
  // pia e armário
  s += `<g data-coisa="pia">${sombraNoChao(2400, 110)}
    <rect x="2296" y="360" width="208" height="142" fill="#fff" fill-opacity="0"/>
    ${vol(`rect x="2300" y="418" width="200" height="82" rx="6"`, "#efe4d1", "volSuave")}
    <rect x="2306" y="426" width="92" height="68" rx="5" fill="#e6d8c1"/><rect x="2402" y="426" width="92" height="68" rx="5" fill="#e6d8c1"/>
    <circle cx="2388" cy="460" r="4" fill="#c4a882"/><circle cx="2412" cy="460" r="4" fill="#c4a882"/>
    ${vol(`rect x="2294" y="406" width="212" height="14" rx="5"`, "#f7f4ef", "cil")}
    <path d="M2360 408 Q2400 422 2440 408" stroke="#d8dfe2" stroke-width="5" fill="none"/>
    <path d="M2392 408 L2392 376 Q2392 366 2404 366 L2416 366" stroke="#b9c4ca" stroke-width="7" fill="none" stroke-linecap="round"/>
    <g class="agua"><rect x="2412" y="370" width="7" height="38" rx="3" fill="#a8d4ef" fill-opacity=".85"/></g></g>`;
  // fogão com panela
  s += `<g data-coisa="fogao">${sombraNoChao(2590, 70)}
    <rect x="2526" y="330" width="128" height="172" fill="#fff" fill-opacity="0"/>
    ${vol(`rect x="2530" y="398" width="120" height="102" rx="10"`, "#f4f0ea", "volSuave")}
    <rect x="2546" y="430" width="88" height="54" rx="8" fill="#3e3a44" fill-opacity=".75"/>
    <rect x="2552" y="436" width="40" height="10" rx="4" fill="#fff" fill-opacity=".18"/>
    ${[2552, 2576, 2604, 2628].map(x => vol(`circle cx="${x}" cy="414" r="5"`, "#d9d2c8")).join("")}
    ${vol(`rect x="2560" y="364" width="62" height="32" rx="10"`, "#a9bccb", "volSuave")}
    ${vol(`rect x="2556" y="358" width="70" height="10" rx="5"`, "#9fb3c3", "cil")}
    ${vol(`circle cx="2591" cy="352" r="6"`, "#8aa0b2")}
    <g class="vapor" fill="#fff"><circle cx="2578" cy="336" r="9"/><circle cx="2600" cy="326" r="11"/><circle cx="2590" cy="306" r="8"/></g></g>`;
  // mesa com toalha xadrez e fruteira
  let xadrez = "";
  for (let x = 2764; x < 2936; x += 16) for (let y = 420; y < 456; y += 16) if (((x - 2764) / 16 + (y - 420) / 16) % 2 === 0) xadrez += `<rect x="${x}" y="${y}" width="16" height="16" fill="#e7a99a" fill-opacity=".55"/>`;
  s += `<g data-lugar="fruteira" id="fruteira">${sombraNoChao(2850, 100)}
    <rect x="2756" y="350" width="190" height="152" fill="#fff" fill-opacity="0"/>
    ${vol(`rect x="2776" y="440" width="12" height="60" rx="4"`, "#a87d56", "cil")}${vol(`rect x="2912" y="440" width="12" height="60" rx="4"`, "#a87d56", "cil")}
    <path d="M2760 418 L2940 418 L2940 456 Q2850 468 2760 456 Z" fill="#fbf6ee"/>${xadrez}
    <path d="M2760 418 L2940 418 L2940 456 Q2850 468 2760 456 Z" fill="url(#volSuave)"/>
    <g id="dentro-fruteira"></g>
    ${vol(`path d="M2814 400 L2886 400 Q2882 418 2850 420 Q2818 418 2814 400 Z"`, "#f1ece2")}
    ${vol(`rect x="2838" y="417" width="24" height="4" rx="2"`, "#e2dacb")}</g>`;
  return s;
}

function desenharQuarto() {
  let s = janelaCasa(3404, 176, 140, 128, "#e3c4c0");
  // guarda-roupa
  s += `<g data-coisa="armario">${sombraNoChao(3125, 84)}
    ${vol(`rect x="3050" y="236" width="150" height="264" rx="12"`, "#dcb894", "volSuave")}
    <line x1="3125" y1="248" x2="3125" y2="488" stroke="#c49e78" stroke-width="3"/>
    ${vol(`circle cx="3114" cy="370" r="5"`, "#f3e7c9")}${vol(`circle cx="3136" cy="370" r="5"`, "#f3e7c9")}
    ${vol(`rect x="3044" y="228" width="162" height="14" rx="5"`, "#c9a47e", "cil")}</g>`;
  // tapete redondo
  s += `<ellipse cx="3470" cy="516" rx="150" ry="18" fill="#e9d2cf"/>`;
  // cama com colcha de crochê
  let croche = "";
  for (let x = 3360, i = 0; x < 3600; x += 30, i++) for (let y = 428; y < 470; y += 22) {
    const c = ["#f2c2b6", "#bfd8c4", "#f3dc9a", "#c8d3ea"][(i + Math.round(y / 22)) % 4];
    croche += `<circle cx="${x + (y % 44 ? 15 : 0)}" cy="${y}" r="7" fill="${c}"/><circle cx="${x + (y % 44 ? 15 : 0)}" cy="${y}" r="2.5" fill="#fffaf0"/>`;
  }
  s += `<g data-coisa="cama">${sombraNoChao(3470, 180)}
    <rect x="3280" y="320" width="380" height="182" fill="#fff" fill-opacity="0"/>
    ${vol(`rect x="3290" y="330" width="42" height="170" rx="16"`, "#b98458", "volSuave")}
    ${vol(`rect x="3608" y="398" width="40" height="102" rx="14"`, "#b98458", "volSuave")}
    ${vol(`rect x="3310" y="448" width="320" height="34" rx="10"`, "#c48f62", "volSuave")}
    ${vol(`ellipse cx="3376" cy="414" rx="44" ry="20"`, "#ffffff")}
    ${vol(`path d="M3340 420 L3620 420 L3620 470 Q3480 482 3340 470 Z"`, "#f6eedc", "volSuave")}
    ${croche}
    <path d="M3340 470 Q3480 482 3620 470" stroke="#e8d7b8" stroke-width="5" fill="none" stroke-dasharray="2 8" stroke-linecap="round"/></g>`;
  // criado-mudo e abajur
  s += `<g data-coisa="abajur">${sombraNoChao(3730, 46)}
    <rect x="3680" y="330" width="100" height="172" fill="#fff" fill-opacity="0"/>
    <circle class="luz-abajur" cx="3730" cy="380" r="120" fill="url(#luzJanela)"/>
    ${vol(`rect x="3690" y="432" width="80" height="68" rx="8"`, "#c48f62", "volSuave")}
    <rect x="3698" y="458" width="64" height="4" fill="#a87d56" fill-opacity=".6"/>
    ${vol(`circle cx="3730" cy="474" r="4"`, "#f3e7c9")}
    ${vol(`rect x="3722" y="404" width="16" height="28" rx="4"`, "#e8d9c2", "cil")}
    ${vol(`path d="M3702 404 L3758 404 L3746 360 L3714 360 Z"`, "#f6d9a8", "volSuave")}</g>`;
  return s;
}

/* A casa inteira (só as partes que não mudam durante o jogo) */
function desenharCasa(fichas) {
  return desenharCeuEChao() + desenharTelhado() + desenharParedes() + desenharQuintal() +
    desenharSala(fichas) + desenharCozinha() + desenharQuarto() + desenharEstrutura();
}

/* ---------- partes que mudam ---------- */
function desenharFrutasArvore(n) {
  return FRUTAS_ARVORE.slice(0, n).map(([x, y]) => `<g transform="translate(${x} ${y + 40}) scale(.9)">${ITENS.manga.d()}</g>`).join("");
}
function desenharCenouras(horta) {
  return horta.map((tem, i) => tem ? `<g data-vaga="${i}" transform="translate(${CENOURAS_HORTA[i]} 490)">
      <circle cx="0" cy="-20" r="30" fill="#fff" fill-opacity="0"/>
      ${vol('path d="M-9 0 Q0 -5 9 0 L6 6 L-6 6 Z"', "#f08a3c")}
      ${vol('path d="M-2 -2 Q-14 -24 -8 -30 Q0 -18 0 -2 Z"', "#6aa65a")}${vol('path d="M2 -2 Q12 -26 18 -20 Q8 -14 2 -2 Z"', "#7cbb68")}${vol('path d="M0 -2 Q-2 -26 4 -32 Q6 -16 0 -2 Z"', "#86c070")}
    </g>` : `<ellipse cx="${CENOURAS_HORTA[i]}" cy="490" rx="8" ry="3" fill="#7d5c40"/>`).join("");
}
function desenharDentro(lugar, itens) {
  return itens.map(it => {
    const [x, y, k] = VAGAS[lugar][it.vaga];
    return `<g transform="translate(${x} ${y}) scale(${k})">${desenharItem(it.tipo, `data-item="${it.id}"`)}</g>`;
  }).join("");
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

/* ---------- a noite (uma camada por cima de tudo, que aparece devagar) ---------- */
function desenharNoite() {
  const ini = MUNDO.inicio;
  let s = `<rect x="-6000" y="-4000" width="${1000 + 6000}" height="8000" fill="#16204a" fill-opacity=".55"/>`;
  s += `<rect x="4000" y="-4000" width="8000" height="8000" fill="#16204a" fill-opacity=".55"/>`;
  s += `<rect x="1000" y="-4000" width="3000" height="${4000 + 90}" fill="#16204a" fill-opacity=".5"/>`;
  s += `<rect x="1000" y="566" width="3000" height="4000" fill="#16204a" fill-opacity=".5"/>`;
  s += `<rect x="1000" y="90" width="3000" height="476" fill="#1d2550" fill-opacity=".16"/>`;
  // janelas: lá fora está escuro, com estrelinhas
  for (const [x, y, w, h] of [[1504, 178, 130, 136], [2340, 188, 120, 116], [3414, 186, 120, 108]]) {
    s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="#1b2656" fill-opacity=".7"/>`;
    s += `<polygon points="${pontosEstrela(x + w * .3, y + h * .3, 5)}" fill="#fff4c4"/><polygon points="${pontosEstrela(x + w * .7, y + h * .55, 4)}" fill="#fff4c4"/>`;
  }
  // luzinhas quentes dentro de casa
  for (const [x, y, r] of [[1290, 200, 260], [2190, 210, 240], [2850, 260, 220], [3730, 380, 200]]) {
    s += `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#luzJanela)" opacity=".5"/>`;
  }
  // lua e estrelas (no céu do quintal e acima do telhado)
  s += `<circle cx="680" cy="120" r="70" fill="url(#luzJanela)"/><circle cx="680" cy="120" r="34" fill="#fbf3cf"/>
        <circle cx="694" cy="110" r="30" fill="#2a3466" fill-opacity=".9"/>`;
  const estrelas = [[520, 60], [600, 210], [820, 70], [900, 230], [760, 300], [-120, 120], [-300, 60], [-520, 160], [-660, 80], [40, 50],
                    [1400, -120], [1900, -200], [2300, -90], [2900, -240], [3400, -110], [3800, -200], [-200, -150], [600, -220]];
  s += estrelas.map(([x, y], i) => `<polygon class="estrela-noite e${i % 3}" points="${pontosEstrela(x, y, 4 + (i % 3) * 2)}" fill="#fff4c4"/>`).join("");
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
  return s;
}
