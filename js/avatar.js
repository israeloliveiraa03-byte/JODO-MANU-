/* =========================================================
   avatar.js — COMO A PERSONAGEM É DESENHADA

   A personagem é descrita por uma "ficha" (o estado), por exemplo:
     { pele: "#9a6444", cabelo: "coquinhos", roupa: "vestido", ... }
   A função desenharAvatar(ficha) lê a ficha e devolve o desenho.
   Trocar uma escolha no editor = trocar um campo da ficha e
   desenhar de novo. É só isso que o editor faz.
   ========================================================= */

/* ---------- 1. As cores disponíveis ---------- */
const PALETAS = {
  pele:      ["#f6d7c3", "#ecc0a0", "#d9a27e", "#c4855f", "#a8704d", "#9a6444", "#7b4a2e", "#5a3420"],
  corCabelo: ["#1c1410", "#3b2416", "#6b4226", "#a8442a", "#d9a54a", "#e86fa6", "#5b86d9"],
  corOlhos:  ["#2a170d", "#5a3418", "#9a6a2c", "#4f7a3a", "#3f6fa8"],
  corRoupa:  ["#f2b630", "#f39a3c", "#f08a7e", "#e4574b", "#ef7fb0", "#a98be0", "#6aa8e8", "#3fb3a5", "#7cc46a", "#f4f1ea"],
};

/* A Manu como na foto: é a ficha inicial */
const PADRAO = {
  pele: "#9a6444", cabelo: "coquinhos", corCabelo: "#1c1410", enfeite: "borboletas",
  olhos: "redondos", corOlhos: "#2a170d", boca: "sorriso", oculos: "nenhum",
  roupa: "vestido", corRoupa: "#f2b630", sapatos: "descalco",
};

/* ---------- 2. Ferramentas de desenho ---------- */
const n1 = v => +v.toFixed(1);

// Mistura duas cores. Serve para fazer a versão clara e a escura de uma cor.
function misturar(hex, alvo, f) {
  const a = parseInt(hex.slice(1), 16), b = parseInt(alvo.slice(1), 16);
  const canal = s => Math.round(((a >> s) & 255) * (1 - f) + ((b >> s) & 255) * f);
  return "#" + ((1 << 24) | (canal(16) << 16) | (canal(8) << 8) | canal(0)).toString(16).slice(1);
}
const escurecer = (hex, f) => misturar(hex, "#1a0f14", f);
const clarear = (hex, f) => misturar(hex, "#ffffff", f);

/* O segredo do visual "3D": cada forma é desenhada duas vezes.
   Primeiro com a cor; depois, por cima, com um degradê de luz e sombra
   (definido no index.html). Como o degradê é o mesmo para qualquer cor,
   ele funciona para todos os tons de pele, cabelo e roupa. */
function vol(forma, cor, luz = "vol") {
  return `<${forma} fill="${cor}"/><${forma} fill="url(#${luz})"/>`;
}

function pontosEstrela(cx, cy, r, miolo = .45) {
  let p = "";
  for (let i = 0; i < 10; i++) {
    const raio = i % 2 ? r * miolo : r, ang = Math.PI / 5 * i - Math.PI / 2;
    p += `${n1(cx + raio * Math.cos(ang))},${n1(cy + raio * Math.sin(ang))} `;
  }
  return p;
}

function caminhoCoracao(cx, cy, s) {
  return `M${cx} ${n1(cy + s * .7)} C${n1(cx - s * 1.3)} ${n1(cy - s * .1)} ${n1(cx - s * .6)} ${n1(cy - s * 1.1)} ${cx} ${n1(cy - s * .35)} ` +
         `C${n1(cx + s * .6)} ${n1(cy - s * 1.1)} ${n1(cx + s * 1.3)} ${n1(cy - s * .1)} ${cx} ${n1(cy + s * .7)} Z`;
}

// bolinhas espalhadas num arco: é assim que os cachos ganham textura
function anel(cx, cy, R, n, r, cor, de = 0, ate = 360) {
  let s = "";
  const fechado = ate - de >= 360;
  for (let i = 0; i < n; i++) {
    const t = fechado ? i / n : i / (n - 1);
    const a = (de + (ate - de) * t) * Math.PI / 180;
    s += vol(`circle cx="${n1(cx + R * Math.cos(a))}" cy="${n1(cy + R * Math.sin(a))}" r="${r}"`, cor);
  }
  return s;
}

function puff(cx, cy, R, cor) {
  return anel(cx, cy, R * .78, 10, n1(R * .42), cor) + vol(`circle cx="${cx}" cy="${cy}" r="${R}"`, cor);
}

/* ---------- 3. O rosto ---------- */
// A cabeça fica centrada em (0, -238). Os pés da personagem ficam no (0, 0).
function franja(cor, risca = true) {
  let s = vol(`path d="M-56 -236 C-62 -318 62 -318 56 -236 C50 -266 28 -278 0 -276 C-28 -278 -50 -266 -56 -236 Z"`, cor);
  if (risca) s += `<path d="M0 -276 L0 -296" stroke="${clarear(cor, .3)}" stroke-width="2.5" stroke-linecap="round"/>`;
  return s;
}

function olhoAberto(x, e, tam = 1, cilios = false) {
  const y = -236, t = v => n1(v * tam);
  let s = `<ellipse cx="${x}" cy="${y}" rx="${t(11)}" ry="${t(12.5)}" fill="#fff"/>`;
  s += `<circle cx="${x}" cy="${y + 1}" r="${t(8.6)}" fill="${e.corOlhos}"/>`;
  s += `<circle cx="${x}" cy="${y + 1}" r="${t(8.6)}" fill="url(#iris)"/>`;
  s += `<circle cx="${x}" cy="${y + 1}" r="${t(4.4)}" fill="#120a06"/>`;
  s += `<circle cx="${n1(x + 3 * tam)}" cy="${n1(y - 3.5 * tam)}" r="${t(3.3)}" fill="#fff"/>`;
  s += `<circle cx="${n1(x - 3 * tam)}" cy="${n1(y + 4.5 * tam)}" r="${t(1.6)}" fill="#fff" fill-opacity=".85"/>`;
  s += `<path d="M${n1(x - 11.5 * tam)} ${n1(y - 3 * tam)} Q${x} ${n1(y - 24 * tam)} ${n1(x + 11.5 * tam)} ${n1(y - 3 * tam)}" stroke="#2a1a14" stroke-width="2.8" fill="none" stroke-linecap="round"/>`;
  if (cilios) {
    const lado = x < 0 ? -1 : 1;
    s += `<path d="M${n1(x + lado * 10 * tam)} ${n1(y - 8 * tam)} l${lado * 6} -5 M${n1(x + lado * 5 * tam)} ${n1(y - 12 * tam)} l${lado * 4} -6" stroke="#2a1a14" stroke-width="2.6" stroke-linecap="round"/>`;
  }
  return s;
}

const OLHOS = {
  redondos:   { nome: "Redondos",   d: e => olhoAberto(-19, e) + olhoAberto(19, e) },
  cilios:     { nome: "Com cílios", d: e => olhoAberto(-19, e, 1, true) + olhoAberto(19, e, 1, true) },
  brilhantes: { nome: "Brilhantes", d: e => olhoAberto(-20, e, 1.18) + olhoAberto(20, e, 1.18) +
                  `<polygon points="${pontosEstrela(-14, -243, 3.5)}" fill="#fff"/><polygon points="${pontosEstrela(26, -243, 3.5)}" fill="#fff"/>` },
  sorrindo:   { nome: "Sorrindo",   d: () => `<path d="M-30 -232 Q-19 -247 -8 -232 M8 -232 Q19 -247 30 -232" stroke="#2a1a14" stroke-width="4.2" fill="none" stroke-linecap="round"/>` },
};

const BOCAS = {
  sorriso:  { nome: "Sorriso",  d: e => `<path d="M-13 -211 Q0 -197 13 -211" stroke="${escurecer(e.pele, .55)}" stroke-width="3.6" fill="none" stroke-linecap="round"/>` },
  risada:   { nome: "Risada",   d: () => `<path d="M-15 -212 Q0 -213 15 -212 Q13 -192 0 -192 Q-13 -192 -15 -212 Z" fill="#6b2323"/>
                <path d="M-12 -211 L12 -211 L10.5 -206 L-10.5 -206 Z" fill="#fff"/>
                <ellipse cx="0" cy="-196.5" rx="7" ry="3.8" fill="#ef7f8a"/>` },
  beijinho: { nome: "Beijinho", d: () => `<ellipse cx="0" cy="-206" rx="6.5" ry="6" fill="#d9606a"/><ellipse cx="0" cy="-206" rx="2.6" ry="2.2" fill="#7a2a30"/>
                <path d="${caminhoCoracao(30, -202, 6)}" fill="#ff7fa8"/>` },
  surpresa: { nome: "Uau!",     d: () => `<ellipse cx="0" cy="-205" rx="7" ry="9" fill="#6b2323"/><ellipse cx="0" cy="-201" rx="4.5" ry="3.5" fill="#ef7f8a"/>` },
};

function rosto(e) {
  const pele = e.pele, sombra = escurecer(pele, .3), sobr = escurecer(e.corCabelo, .15);
  let s = vol(`circle cx="-53" cy="-232" r="11"`, pele) + vol(`circle cx="53" cy="-232" r="11"`, pele);
  s += vol(`ellipse cx="0" cy="-238" rx="54" ry="56"`, pele);
  s += `<ellipse cx="-32" cy="-215" rx="10" ry="7" fill="#e8706a" fill-opacity=".3"/><ellipse cx="32" cy="-215" rx="10" ry="7" fill="#e8706a" fill-opacity=".3"/>`;
  s += `<ellipse cx="0" cy="-223" rx="6.5" ry="5" fill="${sombra}" fill-opacity=".4"/><ellipse cx="-1.5" cy="-225" rx="2.6" ry="1.8" fill="#fff" fill-opacity=".4"/>`;
  s += OLHOS[e.olhos].d(e);
  s += `<path d="M-29 -259 Q-19 -265 -9 -260 M9 -260 Q19 -265 29 -259" stroke="${sobr}" stroke-width="4.6" fill="none" stroke-linecap="round"/>`;
  s += BOCAS[e.boca].d(e);
  return s;
}

/* ---------- 4. Os cabelos ----------
   Cada cabelo tem uma parte de TRÁS (desenhada antes da cabeça)
   e uma parte da FRENTE (desenhada por cima da testa).
   "enfeites" diz onde ficam as presilhas nesse penteado. */
const CABELOS = {
  coquinhos: {
    nome: "Coquinhos",
    tras: c => puff(-52, -300, 32, c) + puff(52, -300, 32, c),
    frente: c => franja(c),
    enfeites: [[-44, -326, -15], [56, -328, 12]],
  },
  blackpower: {
    nome: "Black power",
    tras: c => anel(0, -258, 72, 18, 21, c) + vol(`circle cx="0" cy="-258" r="76"`, c),
    frente: c => franja(c, false),
    enfeites: [[-60, -316, -30], [60, -316, 30]],
  },
  trancas: {
    nome: "Tranças",
    tras: c => {
      let s = vol(`ellipse cx="0" cy="-244" rx="60" ry="62"`, c);
      for (const lado of [-1, 1]) {
        for (let i = 0; i < 7; i++) s += vol(`ellipse cx="${lado * (50 + i * 1.6)}" cy="${-252 + i * 12}" rx="8.5" ry="8"`, c);
        s += vol(`circle cx="${lado * 61}" cy="-162" r="6"`, "#f2b630") + vol(`circle cx="${lado * 61}" cy="-150" r="5.5"`, "#f08a7e");
      }
      return s;
    },
    frente: c => {
      const l = clarear(c, .28);
      return franja(c) + `<path d="M-20 -276 Q-26 -288 -24 -300 M20 -276 Q26 -288 24 -300 M-40 -266 Q-50 -280 -46 -292 M40 -266 Q50 -280 46 -292" stroke="${l}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    },
    enfeites: [[-42, -300, -15], [42, -300, 15]],
  },
  rabo: {
    nome: "Coque alto",
    tras: c => puff(0, -326, 34, c),
    frente: c => franja(c, false) + `<path d="M-36 -270 Q-24 -288 -10 -294 M36 -270 Q24 -288 10 -294" stroke="${clarear(c, .28)}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`,
    enfeites: [[-24, -296, -20]],
  },
  cachos: {
    nome: "Cachinhos",
    tras: c => {
      let s = vol(`ellipse cx="0" cy="-246" rx="66" ry="66"`, c) + anel(0, -246, 64, 14, 16, c, 150, 390);
      for (const lado of [-1, 1]) for (let i = 0; i < 4; i++) s += vol(`circle cx="${lado * (62 - i)}" cy="${-226 + i * 15}" r="15"`, c);
      return s;
    },
    frente: c => franja(c, false) + [[-38, -270], [-20, -279], [0, -282], [20, -279], [38, -270]]
      .map(([x, y]) => vol(`circle cx="${x}" cy="${y}" r="12"`, c)).join(""),
    enfeites: [[-48, -298, -20], [48, -298, 20]],
  },
  curtinho: {
    nome: "Curtinho",
    tras: c => vol(`ellipse cx="0" cy="-244" rx="58" ry="60"`, c),
    frente: c => franja(c, false) + anel(0, -242, 56, 13, 10, c, 190, 350),
    enfeites: [[-40, -296, -15], [40, -296, 15]],
  },
  chanel: {
    nome: "Chanel",
    tras: c => vol(`path d="M-64 -246 C-66 -322 66 -322 64 -246 L63 -198 Q52 -188 40 -198 L-40 -198 Q-52 -188 -63 -198 Z"`, c),
    frente: c => vol(`path d="M-58 -236 C-62 -318 62 -318 58 -236 C56 -252 50 -266 40 -268 L-40 -268 C-50 -266 -56 -252 -58 -236 Z"`, c) +
      `<path d="M-30 -296 Q-10 -304 12 -300" stroke="#fff" stroke-opacity=".35" stroke-width="4" fill="none" stroke-linecap="round"/>`,
    enfeites: [[-46, -292, -15], [46, -292, 15]],
  },
};

/* ---------- 5. Enfeites de cabelo ---------- */
const ENFEITES = {
  nenhum: { nome: "Nenhum", d: () => "" },
  borboletas: { nome: "Borboletas", d: (x, y, r) => `<g transform="translate(${x} ${y}) rotate(${r})">
      ${vol('path d="M0 0 C-6 -16 -20 -14 -16 -2 C-20 8 -6 12 0 0 Z"', "#d8d2f0")}
      ${vol('path d="M0 0 C6 -16 20 -14 16 -2 C20 8 6 12 0 0 Z"', "#ece8f8")}
      <circle r="2.8" fill="#a99cc9"/></g>` },
  lacos: { nome: "Laços", d: (x, y, r) => `<g transform="translate(${x} ${y}) rotate(${r})">
      ${vol('path d="M0 0 C-6 -11 -21 -12 -19 0 C-21 12 -6 11 0 0 Z"', "#f27d9a")}
      ${vol('path d="M0 0 C6 -11 21 -12 19 0 C21 12 6 11 0 0 Z"', "#f27d9a")}
      ${vol('circle r="5"', "#e45f80")}</g>` },
  flores: { nome: "Flores", d: (x, y, r) => {
      let s = `<g transform="translate(${x} ${y}) rotate(${r})">`;
      for (let i = 0; i < 5; i++) {
        const a = i / 5 * Math.PI * 2 - Math.PI / 2;
        s += vol(`circle cx="${n1(8 * Math.cos(a))}" cy="${n1(8 * Math.sin(a))}" r="7"`, "#fff1f5");
      }
      return s + vol('circle r="5"', "#f6c443") + "</g>";
    } },
  estrelas: { nome: "Estrelas", d: (x, y, r) => `<g transform="translate(${x} ${y}) rotate(${r})">${vol(`polygon points="${pontosEstrela(0, 0, 13, .5)}"`, "#f6c443")}</g>` },
  tiara: { nome: "Tiara", tiara: true, d: () => `
      <path d="M-56 -250 C-60 -320 60 -320 56 -250" stroke="#f27d9a" stroke-width="9" fill="none" stroke-linecap="round"/>
      <path d="M-46 -282 C-30 -306 0 -308 20 -302" stroke="#fff" stroke-opacity=".5" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <g transform="translate(-34 -296) rotate(-30)">${vol('path d="M0 0 C-6 -11 -21 -12 -19 0 C-21 12 -6 11 0 0 Z"', "#f27d9a")}${vol('path d="M0 0 C6 -11 21 -12 19 0 C21 12 6 11 0 0 Z"', "#f27d9a")}${vol('circle r="5"', "#e45f80")}</g>` },
};

/* ---------- 6. Óculos ---------- */
const OCULOS = {
  nenhum:   { nome: "Sem óculos", d: () => "" },
  redondos: { nome: "Redondos", d: () => `
      <g stroke="#3a2a4a" stroke-width="3.6"><circle cx="-19" cy="-236" r="16" fill="#fff" fill-opacity=".15"/><circle cx="19" cy="-236" r="16" fill="#fff" fill-opacity=".15"/></g>
      <path d="M-3 -239 Q0 -243 3 -239 M-35 -238 L-53 -243 M35 -238 L53 -243" stroke="#3a2a4a" stroke-width="3.6" fill="none" stroke-linecap="round"/>` },
  coracao:  { nome: "Coração", d: () => `
      <path d="${caminhoCoracao(-20, -234, 16)}" fill="#ff6fa5" fill-opacity=".55" stroke="#e0457f" stroke-width="3"/>
      <path d="${caminhoCoracao(20, -234, 16)}" fill="#ff6fa5" fill-opacity=".55" stroke="#e0457f" stroke-width="3"/>
      <path d="M-4 -240 L4 -240 M-40 -240 L-53 -243 M40 -240 L53 -243" stroke="#e0457f" stroke-width="3" stroke-linecap="round"/>` },
  estrela:  { nome: "Estrela", d: () => `
      <polygon points="${pontosEstrela(-20, -236, 20, .55)}" fill="#ffd23f" fill-opacity=".6" stroke="#e6a817" stroke-width="3" stroke-linejoin="round"/>
      <polygon points="${pontosEstrela(20, -236, 20, .55)}" fill="#ffd23f" fill-opacity=".6" stroke="#e6a817" stroke-width="3" stroke-linejoin="round"/>
      <path d="M-4 -240 L4 -240" stroke="#e6a817" stroke-width="3" stroke-linecap="round"/>` },
};

/* ---------- 7. Roupas ----------
   manga: que tipo de manga a roupa tem (desenhada junto com o braço)
   pernas: se as pernas aparecem ou ficam cobertas (pijama) */
function furinhos(lista, cor) {
  return lista.map(([x, y]) => [[0, -4], [4, 0], [0, 4], [-4, 0]]
    .map(([dx, dy]) => `<circle cx="${x + dx}" cy="${y + dy}" r="1.9" fill="${cor}"/>`).join("")).join("");
}
function bolinhas(lista, cor, r = 3.2) {
  return lista.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${cor}" fill-opacity=".75"/>`).join("");
}
const corpinho = `path d="M-36 -188 Q0 -196 36 -188 L41 -144 Q0 -150 -41 -144 Z"`;

const ROUPAS = {
  vestido: {
    nome: "Vestido", manga: "babado", pernas: true, corManga: c => clarear(c, .2),
    frente: c => {
      const d = escurecer(c, .25), l = clarear(c, .2);
      let s = vol(`path d="M-40 -146 Q0 -154 40 -146 L80 -82 Q0 -64 -80 -82 Z"`, c, "volSuave");
      s += vol(`path d="M-70 -98 Q0 -84 70 -98 L84 -78 Q0 -58 -84 -78 Z"`, c, "volSuave");
      s += `<path d="M-70 -98 Q0 -84 70 -98" stroke="${d}" stroke-width="2.5" fill="none"/>`;
      s += furinhos([[-44, -124], [-12, -128], [20, -126], [50, -118], [-62, -100], [-28, -106], [8, -104], [44, -100], [-54, -76], [-18, -72], [18, -72], [54, -76]], d);
      s += vol(corpinho, c, "volSuave");
      s += `<path d="M-41 -146 Q0 -152 41 -146" stroke="${d}" stroke-width="3" fill="none"/>`;
      s += furinhos([[-14, -176], [14, -176], [0, -160]], d);
      s += `<path d="M-26 -186 q5 6 0 12 q-5 6 0 12 q5 6 0 12 q-5 6 0 12 M26 -186 q-5 6 0 12 q5 6 0 12 q-5 6 0 12 q5 6 0 12" stroke="${l}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
      s += vol(`ellipse cx="-44" cy="-184" rx="22" ry="11" transform="rotate(-14 -44 -184)"`, l, "volSuave");
      s += vol(`ellipse cx="44" cy="-184" rx="22" ry="11" transform="rotate(14 44 -184)"`, l, "volSuave");
      return s;
    },
  },
  jardineira: {
    nome: "Jardineira", manga: "curta", pernas: true, corManga: () => "#fbfbf8",
    frente: c => {
      const l = clarear(c, .3);
      let s = vol(`path d="M-36 -188 Q0 -196 36 -188 L39 -130 L-39 -130 Z"`, "#fbfbf8", "volSuave");
      s += vol(`path d="M-40 -144 L40 -144 L45 -94 L6 -94 L0 -110 L-6 -94 L-45 -94 Z"`, c, "volSuave");
      s += vol(`path d="M-25 -170 L25 -170 L28 -140 L-28 -140 Z"`, c, "volSuave");
      s += `<path d="M-22 -168 L-32 -188 M22 -168 L32 -188" stroke="${c}" stroke-width="8" stroke-linecap="round"/>`;
      s += vol(`rect x="-12" y="-163" width="24" height="15" rx="4"`, l, "volSuave");
      s += vol(`circle cx="-21" cy="-166" r="4"`, "#f6c443") + vol(`circle cx="21" cy="-166" r="4"`, "#f6c443");
      return s;
    },
  },
  camiseta: {
    nome: "Camiseta e saia", manga: "curta", pernas: true, corManga: c => c,
    frente: c => {
      let s = vol(`path d="M-37 -188 Q0 -196 37 -188 L39 -130 Q0 -126 -39 -130 Z"`, c, "volSuave");
      s += `<path d="${caminhoCoracao(0, -162, 11)}" fill="#fff" fill-opacity=".9"/>`;
      s += vol(`path d="M-42 -138 L42 -138 L70 -100 Q0 -86 -70 -100 Z"`, clarear(c, .6), "volSuave");
      let babado = "M-40 -140 L40 -140 L60 -106";
      for (let i = 0; i < 6; i++) babado += " q-10 9 -20 0";
      s += vol(`path d="${babado} Z"`, clarear(c, .35), "volSuave");
      s += vol(`rect x="-41" y="-144" width="82" height="9" rx="4.5"`, escurecer(c, .15), "volSuave");
      return s;
    },
  },
  pijama: {
    nome: "Pijama", manga: "longa", pernas: false, corManga: c => c,
    frente: c => {
      const pontos = clarear(c, .7);
      let s = vol(`path d="M-38 -134 L38 -134 L37 -14 L6 -14 L0 -104 L-6 -14 L-37 -14 Z"`, c, "volSuave");
      s += bolinhas([[-24, -112], [22, -116], [-28, -80], [26, -84], [-22, -48], [24, -52], [-26, -24], [24, -26]], pontos);
      s += vol(`rect x="-38" y="-24" width="33" height="10" rx="5"`, clarear(c, .4)) + vol(`rect x="5" y="-24" width="33" height="10" rx="5"`, clarear(c, .4));
      s += vol(`path d="M-37 -188 Q0 -196 37 -188 L40 -124 Q0 -118 -40 -124 Z"`, c, "volSuave");
      s += bolinhas([[-20, -172], [16, -176], [-4, -152], [26, -146], [-28, -140]], pontos);
      s += vol(`path d="M-14 -190 Q0 -180 14 -190 Q0 -186 -14 -190 Z"`, clarear(c, .4));
      return s;
    },
  },
  fada: {
    nome: "Fada", manga: "nenhuma", pernas: true, corManga: c => c,
    tras: () => `<g fill="#e9e0ff" fill-opacity=".85" stroke="#fff" stroke-width="3">
        <ellipse cx="-56" cy="-198" rx="42" ry="24" transform="rotate(-28 -56 -198)"/>
        <ellipse cx="56" cy="-198" rx="42" ry="24" transform="rotate(28 56 -198)"/>
        <ellipse cx="-46" cy="-150" rx="27" ry="16" transform="rotate(24 -46 -150)"/>
        <ellipse cx="46" cy="-150" rx="27" ry="16" transform="rotate(-24 46 -150)"/></g>
      <g fill="url(#vol)"><ellipse cx="-56" cy="-198" rx="42" ry="24" transform="rotate(-28 -56 -198)"/><ellipse cx="56" cy="-198" rx="42" ry="24" transform="rotate(28 56 -198)"/></g>`,
    frente: c => {
      let s = vol(`path d="M-40 -146 Q0 -154 40 -146 L78 -86 L58 -74 L40 -86 L20 -72 L0 -84 L-20 -72 L-40 -86 L-58 -74 L-78 -86 Z"`, c, "volSuave");
      s += [[-40, -116], [-6, -124], [30, -112], [-56, -92], [10, -96], [50, -92]]
        .map(([x, y]) => `<polygon points="${pontosEstrela(x, y, 6)}" fill="#fff" fill-opacity=".9"/>`).join("");
      s += vol(corpinho, c, "volSuave");
      s += `<path d="M-30 -188 L-36 -196 M30 -188 L36 -196" stroke="${c}" stroke-width="5" stroke-linecap="round"/>`;
      s += `<polygon points="${pontosEstrela(0, -172, 8)}" fill="#fff6c8"/>`;
      return s;
    },
  },
};

/* ---------- 8. Sapatos ---------- */
const SAPATOS = {
  descalco: { nome: "Descalça", d: e => [-18, 18].map(x => vol(`ellipse cx="${x}" cy="-7" rx="14" ry="8"`, e.pele)).join("") },
  tenis: { nome: "Tênis", d: e => [-18, 18].map(x =>
      vol(`ellipse cx="${x}" cy="-10" rx="16" ry="11"`, "#fbfbf8") +
      `<rect x="${x - 17}" y="-5" width="34" height="5.5" rx="2.7" fill="#e3ded6"/>` +
      `<path d="M${x - 9} -15 L${x + 7} -8" stroke="${e.corRoupa === "#f4f1ea" ? "#6aa8e8" : e.corRoupa}" stroke-width="4" stroke-linecap="round"/>`).join("") },
  sandalia: { nome: "Sandália", d: e => [-18, 18].map(x =>
      vol(`ellipse cx="${x}" cy="-7" rx="14" ry="8"`, e.pele) +
      `<rect x="${x - 15}" y="-3" width="30" height="4" rx="2" fill="#a8643a"/>` +
      vol(`rect x="${x - 12}" y="-13" width="24" height="6" rx="3"`, "#f27d9a")).join("") },
  botinha: { nome: "Botinha", d: () => [-17, 17].map(x =>
      vol(`path d="M${x - 11} -36 L${x + 11} -36 L${x + 12} -12 Q${x + 18} -9 ${x + 17} 0 L${x - 17} 0 Q${x - 18} -9 ${x - 12} -12 Z"`, "#e4574b") +
      vol(`rect x="${x - 13}" y="-40" width="26" height="8" rx="4"`, "#f27166")).join("") },
};

/* ---------- 9. Montar o corpo inteiro ---------- */
function perna(x, e) {
  return vol(`rect x="${x - 10}" y="-98" width="20" height="92" rx="10"`, e.pele, "cil");
}

function braco(e, roupa) {
  const cm = roupa.corManga(e.corRoupa);
  let s = vol(`rect x="-8.5" y="0" width="17" height="80" rx="8.5"`, e.pele, "cil");
  if (roupa.manga === "curta") s += vol(`rect x="-10.5" y="-6" width="21" height="30" rx="10"`, cm, "cil");
  if (roupa.manga === "longa") s += vol(`rect x="-10" y="-6" width="20" height="78" rx="10"`, cm, "cil") +
                                   vol(`rect x="-10.5" y="64" width="21" height="9" rx="4.5"`, clarear(cm, .4), "cil");
  return s + vol(`circle cx="0" cy="80" r="10.5"`, e.pele);
}

/* Desenha a personagem na ordem certa: o que está atrás primeiro,
   o que está na frente por último (como camadas de papel). */
function desenharAvatar(ficha, opcoes = {}) {
  const e = { ...PADRAO, ...ficha };
  const cab = CABELOS[e.cabelo], roupa = ROUPAS[e.roupa], enf = ENFEITES[e.enfeite];
  let s = `<rect x="-95" y="-350" width="190" height="350" fill="#fff" fill-opacity="0"/>`; // área de toque
  if (opcoes.sombra !== false) s += `<ellipse cx="0" cy="-2" rx="58" ry="10" fill="url(#sombraChao)"/>`;
  s += cab.tras(e.corCabelo);
  if (roupa.tras) s += roupa.tras(e.corRoupa);
  if (roupa.pernas) s += perna(-15, e) + perna(15, e);
  s += SAPATOS[e.sapatos].d(e);
  s += `<g transform="translate(-42 -180) rotate(12)">${braco(e, roupa)}</g>`;
  s += `<g transform="translate(42 -180) rotate(-12)"><g class="braco">${braco(e, roupa)}</g></g>`;
  s += vol(`rect x="-10" y="-200" width="20" height="22" rx="8"`, e.pele, "cil");
  s += roupa.frente(e.corRoupa, e);
  s += rosto(e);
  s += cab.frente(e.corCabelo);
  s += enf.tiara ? enf.d() : cab.enfeites.map(([x, y, r]) => enf.d(x, y, r)).join("");
  s += OCULOS[e.oculos].d();
  return s;
}

/* Recortes: que pedaço da personagem cada miniatura do editor mostra */
const RECORTES = {
  inteira: "-120 -372 240 384",
  rosto: "-108 -362 216 216",
  rostoPerto: "-70 -300 140 122",
  corpo: "-112 -236 224 244",
  pes: "-52 -50 104 62",
};

/* As abas do editor */
const CATEGORIAS = [
  { id: "pele",    nome: "Pele",    cores: "pele" },
  { id: "cabelo",  nome: "Cabelo",  cores: "corCabelo", opcoes: CABELOS, recorte: "rosto" },
  { id: "enfeite", nome: "Enfeite", opcoes: ENFEITES, recorte: "rosto" },
  { id: "olhos",   nome: "Olhos",   cores: "corOlhos",  opcoes: OLHOS, recorte: "rostoPerto" },
  { id: "boca",    nome: "Boca",    opcoes: BOCAS, recorte: "rostoPerto" },
  { id: "oculos",  nome: "Óculos",  opcoes: OCULOS, recorte: "rostoPerto" },
  { id: "roupa",   nome: "Roupa",   cores: "corRoupa",  opcoes: ROUPAS, recorte: "corpo" },
  { id: "sapatos", nome: "Sapatos", opcoes: SAPATOS, recorte: "pes" },
];

/* Confere se uma ficha salva ainda é válida (útil quando o jogo ganhar opções novas) */
function fichaValida(f) {
  const ok = { ...PADRAO };
  if (!f || typeof f !== "object") return ok;
  for (const cat of CATEGORIAS) {
    if (cat.opcoes && f[cat.id] in cat.opcoes) ok[cat.id] = f[cat.id];
    if (cat.cores && PALETAS[cat.cores].includes(f[cat.cores])) ok[cat.cores] = f[cat.cores];
  }
  return ok;
}

function fichaSorteada() {
  const sorteia = lista => lista[Math.floor(Math.random() * lista.length)];
  const f = {};
  for (const cat of CATEGORIAS) {
    if (cat.opcoes) f[cat.id] = sorteia(Object.keys(cat.opcoes));
    if (cat.cores) f[cat.cores] = sorteia(PALETAS[cat.cores]);
  }
  if (Math.random() < .6) f.oculos = "nenhum"; // óculos aparecem às vezes, não sempre
  return f;
}
