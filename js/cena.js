/* =========================================================
   cena.js — O QUARTO

   Aqui ficam os desenhos do quarto e dos objetos, no mesmo
   estilo da personagem (cada forma ganha luz e sombra com vol()).
   ========================================================= */

/* ONDE cada coisa fica: uma arrumação para o celular deitado e outra em pé.
   s = tamanho (escala) do objeto */
const ARRUMACAO = {
  deitado: {
    tamanho: [1000, 600], chao: 440,
    janela: { x: 640, y: 70 }, quadro: { x: 330, y: 120 }, varal: { x1: 30, x2: 970, y: 34 },
    tapete: { x: 520, y: 548, rx: 230, ry: 40 },
    estrelasTeto: [[90, 120], [210, 80], [480, 110], [560, 200], [900, 120], [950, 250]],
    cama:  { x: 220, y: 525, s: 1.1 },
    manu:  { x: 460, y: 566, s: .92 },
    gato:  { x: 618, y: 584, s: .95 },
    bolo:  { x: 778, y: 532, s: 1 },
    caixa: { x: 920, y: 568, s: .85 },
  },
  empe: {
    tamanho: [600, 1000], chao: 640,
    janela: { x: 330, y: 150 }, quadro: { x: 50, y: 250 }, varal: { x1: 16, x2: 584, y: 60 },
    tapete: { x: 300, y: 905, rx: 250, ry: 52 },
    estrelasTeto: [[70, 150], [200, 110], [260, 220], [560, 120], [570, 420], [220, 400]],
    cama:  { x: 165, y: 720, s: .9 },
    caixa: { x: 475, y: 712, s: .85 },
    manu:  { x: 318, y: 936, s: 1.02 },
    gato:  { x: 95,  y: 978, s: .9 },
    bolo:  { x: 500, y: 962, s: .9 },
  },
};

// Tamanho da sombrinha no chão embaixo de cada objeto
const SOMBRAS = { manu: [62, 11], gato: [70, 12], bolo: [90, 12], cama: [160, 16], caixa: [70, 11] };

const OBJETOS_CENA = {
  gato() {
    const L = "#ee9a4f", LI = "#cc7330", B = "#f9dcb6";
    return `
      <rect x="-100" y="-150" width="180" height="150" fill="#fff" fill-opacity="0"/>
      <g class="rabo"><path d="M-52 -42 Q-98 -52 -86 -104" stroke="${L}" stroke-width="16" fill="none" stroke-linecap="round"/>
        <path d="M-58 -46 Q-92 -56 -84 -98" stroke="#fff" stroke-opacity=".3" stroke-width="4" fill="none" stroke-linecap="round"/></g>
      ${vol(`ellipse cx="-6" cy="-42" rx="56" ry="38"`, L)}
      <path d="M-30 -76 q4 14 0 26 M-12 -79 q4 14 0 28" stroke="${LI}" stroke-width="5" fill="none" stroke-linecap="round"/>
      ${vol(`ellipse cx="8" cy="-30" rx="28" ry="20"`, B)}
      ${vol(`ellipse cx="-42" cy="-8" rx="15" ry="9"`, L)}${vol(`ellipse cx="22" cy="-7" rx="13" ry="8"`, L)}${vol(`ellipse cx="46" cy="-7" rx="13" ry="8"`, L)}
      ${vol(`path d="M12 -108 L16 -146 L42 -120 Z"`, L)}${vol(`path d="M42 -120 L66 -146 L68 -106 Z"`, L)}
      <path d="M20 -116 L22 -134 L34 -121 Z M50 -120 L60 -134 L62 -114 Z" fill="#f4a6b8"/>
      ${vol(`circle cx="40" cy="-92" r="34"`, L)}
      <path d="M34 -125 q2 10 0 16 M46 -125 q-2 10 0 16" stroke="${LI}" stroke-width="4" fill="none" stroke-linecap="round"/>
      <ellipse cx="27" cy="-95" rx="7" ry="8.5" fill="#fff"/><ellipse cx="53" cy="-95" rx="7" ry="8.5" fill="#fff"/>
      <circle cx="27" cy="-94" r="5.5" fill="#5f9c3c"/><circle cx="53" cy="-94" r="5.5" fill="#5f9c3c"/>
      <circle cx="27" cy="-94" r="2.8" fill="#1a110c"/><circle cx="53" cy="-94" r="2.8" fill="#1a110c"/>
      <circle cx="29" cy="-97" r="2" fill="#fff"/><circle cx="55" cy="-97" r="2" fill="#fff"/>
      <path d="M36 -82 L44 -82 L40 -77 Z" fill="#e0707f"/>
      <path d="M33 -73 Q40 -68 40 -76 Q40 -68 47 -73" stroke="#7a3b22" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M20 -80 L-2 -84 M20 -76 L-2 -74 M60 -80 L82 -84 M60 -76 L82 -74" stroke="#7a3b22" stroke-width="1.6" stroke-linecap="round" fill="none"/>
      <ellipse cx="22" cy="-80" rx="6" ry="4" fill="#ff8a8a" fill-opacity=".35"/><ellipse cx="58" cy="-80" rx="6" ry="4" fill="#ff8a8a" fill-opacity=".35"/>`;
  },

  bolo() {
    const granulado = [[-30, -150, "#7aa7e0"], [-8, -140, "#8fc9a9"], [16, -152, "#f2b630"], [36, -138, "#7aa7e0"], [-40, -135, "#f2b630"]]
      .map(([x, y, c]) => `<rect x="${x}" y="${y}" width="9" height="4" rx="2" fill="${c}" transform="rotate(${x % 50} ${x} ${y})"/>`).join("");
    let cobertura = "M-52 -176 Q-52 -192 -36 -192 L36 -192 Q52 -192 52 -176";
    for (let i = 0; i < 6; i++) cobertura += " q-8.67 13 -17.33 0";
    return `
      <rect x="-95" y="-250" width="190" height="250" fill="#fff" fill-opacity="0"/>
      ${vol(`rect x="-72" y="-112" width="12" height="112" rx="5"`, "#a6643a", "cil")}${vol(`rect x="60" y="-112" width="12" height="112" rx="5"`, "#a6643a", "cil")}
      ${vol(`rect x="-88" y="-126" width="176" height="20" rx="8"`, "#b9774a", "volSuave")}
      ${vol(`ellipse cx="0" cy="-126" rx="70" ry="11"`, "#f7f7f2")}
      ${vol(`rect x="-52" y="-188" width="104" height="64" rx="12"`, "#f4a6b8")}
      <rect x="-52" y="-160" width="104" height="8" fill="#e98aa2"/>
      ${vol(`path d="${cobertura} Z"`, "#fff8f2", "volSuave")}
      ${granulado}
      ${vol(`rect x="-4" y="-222" width="8" height="32" rx="3"`, "#8fc9a9", "cil")}
      <path d="M-4 -214 L4 -218 M-4 -204 L4 -208" stroke="#fff" stroke-width="2"/>
      <g class="chama"><circle cx="0" cy="-232" r="22" fill="url(#brilhoChama)"/>
        <ellipse cx="0" cy="-232" rx="7" ry="11" fill="#ffb52e"/><ellipse cx="0" cy="-229" rx="3.5" ry="6" fill="#fff2a8"/></g>`;
  },

  cama() {
    const pontos = [[-20, -84], [10, -74], [40, -86], [70, -72], [96, -84], [-30, -66], [56, -62]]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.5" fill="#fff" fill-opacity=".6"/>`).join("");
    return `
      <rect x="-155" y="-200" width="310" height="200" fill="#fff" fill-opacity="0"/>
      ${vol(`rect x="-130" y="-30" width="14" height="30" rx="5"`, "#8d5531", "cil")}${vol(`rect x="118" y="-30" width="14" height="30" rx="5"`, "#8d5531", "cil")}
      ${vol(`rect x="-150" y="-174" width="44" height="174" rx="18"`, "#b06c40", "volSuave")}
      ${vol(`circle cx="-128" cy="-140" r="10"`, "#f2b630")}
      ${vol(`rect x="-140" y="-66" width="280" height="40" rx="12"`, "#c07f50", "volSuave")}
      ${vol(`rect x="118" y="-114" width="30" height="114" rx="13"`, "#b06c40", "volSuave")}
      ${vol(`rect x="-112" y="-92" width="232" height="32" rx="14"`, "#fbfbf8", "volSuave")}
      ${vol(`ellipse cx="-78" cy="-100" rx="34" ry="17"`, "#ffffff")}
      ${vol(`rect x="-46" y="-104" width="166" height="50" rx="16"`, "#8fc9a9", "volSuave")}
      ${pontos}
      <g class="zzz" font-family="Baloo 2, Trebuchet MS, sans-serif" font-weight="800" fill="#ffffff">
        <text x="-66" y="-130" font-size="26">z</text>
        <text x="-44" y="-158" font-size="32">z</text>
        <text x="-16" y="-188" font-size="40">Z</text>
      </g>`;
  },

  caixa() {
    const U = "#b07a4f", UC = "#e3b98f";
    return `
      <rect x="-80" y="-205" width="160" height="205" fill="#fff" fill-opacity="0"/>
      <g class="urso">
        ${vol(`circle cx="-21" cy="-134" r="11"`, U)}${vol(`circle cx="21" cy="-134" r="11"`, U)}
        <circle cx="-21" cy="-134" r="5" fill="${UC}"/><circle cx="21" cy="-134" r="5" fill="${UC}"/>
        ${vol(`circle cx="0" cy="-110" r="30"`, U)}
        ${vol(`ellipse cx="0" cy="-100" rx="13" ry="10"`, UC)}
        <ellipse cx="0" cy="-105" rx="4.5" ry="3.2" fill="#3a2418"/>
        <path d="M-5 -97 Q0 -92 5 -97" stroke="#3a2418" stroke-width="2" fill="none" stroke-linecap="round"/>
        <circle cx="-10" cy="-117" r="4" fill="#2a1a12"/><circle cx="10" cy="-117" r="4" fill="#2a1a12"/>
        <circle cx="-8.5" cy="-118.5" r="1.4" fill="#fff"/><circle cx="11.5" cy="-118.5" r="1.4" fill="#fff"/>
      </g>
      ${vol(`rect x="-56" y="-100" width="112" height="100" rx="10"`, "#3aa6a0", "volSuave")}
      <circle cx="-34" cy="-70" r="5" fill="#7fd3cb"/><circle cx="34" cy="-30" r="5" fill="#7fd3cb"/>
      <circle cx="-30" cy="-22" r="5" fill="#7fd3cb"/><circle cx="32" cy="-76" r="5" fill="#7fd3cb"/>
      ${vol(`rect x="-9" y="-100" width="18" height="100"`, "#f2b630", "cil")}
      <g class="tampa">
        ${vol(`rect x="-63" y="-124" width="126" height="28" rx="9"`, "#2f8f8a", "volSuave")}
        ${vol(`rect x="-9" y="-124" width="18" height="28"`, "#e0a21f", "cil")}
        ${vol(`ellipse cx="-17" cy="-133" rx="17" ry="10"`, "#f2b630")}${vol(`ellipse cx="17" cy="-133" rx="17" ry="10"`, "#f2b630")}
        ${vol(`circle cx="0" cy="-131" r="7"`, "#e0a21f")}
      </g>`;
  },
};

function fundoQuarto(a) {
  const [L, A] = a.tamanho, c = a.chao;
  // parede e chão passam das bordas: assim, em qualquer formato de tela, não sobra faixa vazia
  const x0 = -L, x1 = 2 * L, y0 = -A, y1 = 2 * A;
  let s = `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y0 * -1}" fill="#e3eefa"/>`;
  s += `<rect x="${x0}" y="0" width="${x1 - x0}" height="${c}" fill="url(#parede)"/>`;
  for (let x = x0 + 30; x < x1; x += 70) s += `<rect x="${x}" y="${y0}" width="30" height="${c - y0}" fill="#fff" fill-opacity=".22"/>`;
  s += `<ellipse cx="${a.janela.x + 110}" cy="${a.janela.y + 110}" rx="${L * .4}" ry="${c * .55}" fill="url(#luzJanela)"/>`;
  s += `<rect x="${x0}" y="${c}" width="${x1 - x0}" height="${A - c}" fill="url(#piso)"/>`;
  s += `<rect x="${x0}" y="${A}" width="${x1 - x0}" height="${y1 - A}" fill="#e8b37a"/>`;
  for (let y = c + 38; y < y1; y += 44) s += `<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="#b97c45" stroke-opacity=".45" stroke-width="3"/>`;
  s += `<rect x="${x0}" y="${c}" width="${x1 - x0}" height="30" fill="#1a0f14" fill-opacity=".08"/>`;
  s += `<rect x="${x0}" y="${c - 14}" width="${x1 - x0}" height="18" fill="#f7f4ef"/>`;
  s += `<rect x="${x0}" y="${c - 14}" width="${x1 - x0}" height="18" fill="url(#cilDeitado)"/>`;

  // varal de bandeirinhas
  const v = a.varal, meio = (v.x1 + v.x2) / 2, curva = v.y + 50, cores = ["#f2b630", "#f08a7e", "#8fc9a9", "#7aa7e0"];
  s += `<path d="M${v.x1} ${v.y} Q${meio} ${curva} ${v.x2} ${v.y}" stroke="#8a6a55" stroke-width="2.5" fill="none"/>`;
  const n = Math.round((v.x2 - v.x1) / 60);
  for (let i = 0; i < n; i++) {
    const t = (i + .5) / n;
    const x = (1 - t) ** 2 * v.x1 + 2 * (1 - t) * t * meio + t * t * v.x2;
    const y = (1 - t) ** 2 * v.y + 2 * (1 - t) * t * curva + t * t * v.y;
    s += vol(`path d="M${n1(x - 15)} ${n1(y)} L${n1(x + 15)} ${n1(y)} L${n1(x)} ${n1(y + 28)} Z"`, cores[i % 4], "volSuave");
  }

  // quadrinho
  const q = a.quadro;
  s += `<g transform="translate(${q.x} ${q.y})">
    <rect x="4" y="8" width="110" height="90" rx="8" fill="#1a0f14" fill-opacity=".1"/>
    ${vol(`rect x="0" y="0" width="110" height="90" rx="8"`, "#c07f50", "volSuave")}
    <rect x="9" y="9" width="92" height="72" rx="4" fill="#fffdf8"/>
    ${vol(`path d="M55 70 C20 46 30 22 47 28 C52 30 55 36 55 36 C55 36 58 30 63 28 C80 22 90 46 55 70 Z"`, "#f08a7e")}
    ${vol(`circle cx="24" cy="24" r="9"`, "#f2b630")}</g>`;

  // tapete
  const t = a.tapete;
  s += vol(`ellipse cx="${t.x}" cy="${t.y}" rx="${t.rx}" ry="${t.ry}"`, "#f08a7e", "volSuave");
  s += `<ellipse cx="${t.x}" cy="${t.y}" rx="${t.rx - 18}" ry="${t.ry - 10}" fill="none" stroke="#fbc4bb" stroke-width="4" stroke-dasharray="10 9"/>`;
  return s;
}

function estrelaCena(cx, cy, r, classe) {
  return `<polygon class="${classe}" points="${pontosEstrela(cx, cy, r)}" fill="#fff2a8"/>`;
}

function janelaQuarto(p) {
  return `<g class="objeto" data-id="janela" transform="translate(${p.x} ${p.y})"><g class="anim">
    <rect x="-8" y="-8" width="236" height="200" fill="#fff" fill-opacity="0"/>
    <rect x="6" y="10" width="220" height="170" rx="14" fill="#1a0f14" fill-opacity=".1"/>
    ${vol(`rect x="0" y="0" width="220" height="170" rx="14"`, "#ffffff", "volSuave")}
    <rect id="ceu" x="12" y="12" width="196" height="146" rx="8"/>
    <circle class="sol" cx="162" cy="50" r="24" fill="#ffd23f"/>
    <circle class="sol" cx="162" cy="50" r="24" fill="url(#vol)"/>
    <g class="nuvem">${vol(`ellipse cx="58" cy="118" rx="30" ry="14"`, "#fff")}${vol(`ellipse cx="78" cy="108" rx="22" ry="14"`, "#fff")}${vol(`ellipse cx="44" cy="108" rx="16" ry="11"`, "#fff")}</g>
    <g class="lua"><circle cx="160" cy="52" r="22" fill="#f6f0c8"/><circle cx="171" cy="45" r="19" fill="#22305e"/></g>
    ${estrelaCena(48, 44, 7, "estrela")}${estrelaCena(86, 92, 5, "estrela")}${estrelaCena(130, 120, 6, "estrela")}
    <rect x="12" y="12" width="196" height="146" rx="8" fill="url(#vidro)"/>
    ${vol(`rect x="107" y="12" width="6" height="146"`, "#ffffff", "cil")}
    <rect x="12" y="82" width="196" height="6" fill="#ffffff"/>
    ${vol(`rect x="-12" y="164" width="244" height="16" rx="7"`, "#f7f4ef", "volSuave")}
  </g></g>`;
}

/* Monta o quarto inteiro, com a personagem desenhada a partir da ficha */
function montarQuarto(nomeArrumacao, ficha) {
  const a = ARRUMACAO[nomeArrumacao];
  const [L, A] = a.tamanho;
  const desenho = id => id === "manu" ? desenharAvatar(ficha, { sombra: false }) : OBJETOS_CENA[id]();

  // quem está mais embaixo na tela é desenhado por último (fica na frente)
  const ordem = ["cama", "caixa", "bolo", "gato", "manu"].sort((x, y) => a[x].y - a[y].y);
  const objetos = ordem.map(id => {
    const p = a[id], [rx, ry] = SOMBRAS[id];
    return `<g class="objeto" data-id="${id}" transform="translate(${p.x} ${p.y}) scale(${p.s})">
      <ellipse cx="0" cy="-2" rx="${rx}" ry="${ry}" fill="url(#sombraChao)"/>
      <g class="anim">${desenho(id)}</g></g>`;
  }).join("");

  return {
    viewBox: `0 0 ${L} ${A}`,
    svg: fundoQuarto(a) + janelaQuarto(a.janela) + objetos +
      `<rect id="escuro" x="${-L}" y="${-A}" width="${3 * L}" height="${3 * A}" fill="#0e1840"/>` +
      a.estrelasTeto.map(([x, y]) => estrelaCena(x, y, 10, "estrela")).join(""),
  };
}
