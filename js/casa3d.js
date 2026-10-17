/* =========================================================
   casa3d.js — A CASA DA VOVÓ EM 3D

   A casa, os móveis, o quintal e o céu são objetos 3D (feitos com a
   biblioteca three.js). As pessoas, os bichos e as coisas soltas no chão
   continuam desenhados em 2D, numa camada transparente por cima.

   O truque que junta as duas camadas: a câmera 3D olha reto para a frente,
   e o "plano" onde as pessoas andam (profundidade z = 0) fica exatamente
   alinhado com o desenho 2D. Tudo o que está atrás desse plano (paredes,
   móveis) aparece em perspectiva de verdade, e muda de ângulo quando a
   câmera anda pela casa.

   Coordenadas: x igual ao 2D; altura 3D = −(altura 2D); z = profundidade
   (negativo = mais para o fundo, positivo = mais perto da tela).
   ========================================================= */
const T = THREE;
const C3 = {
  cena: null, camera: null, render: null, sol: null, ceu: null, luzes: {},
  sujo: true, tweens: [], pivos: {}, abertos: {}, grupos: {}, dica: null, notas: null,
};
const D_CAM = 1400;              // distância da câmera até o plano das pessoas
const ZP = { fundo: -260, frente: 190 };
const A = y => -y;               // altura 2D → altura 3D

/* ---------- materiais com sombreamento de desenho (toon) ---------- */
let GRADIENTE = null;
const cacheMat = {};
function mat(cor, op = {}) {
  const chave = cor + JSON.stringify(op);
  if (cacheMat[chave]) return cacheMat[chave];
  if (!GRADIENTE) {
    GRADIENTE = new T.DataTexture(new Uint8Array([178, 226, 255]), 3, 1, T.RedFormat);
    GRADIENTE.minFilter = GRADIENTE.magFilter = T.NearestFilter;
    GRADIENTE.needsUpdate = true;
  }
  return (cacheMat[chave] = new T.MeshToonMaterial({ color: cor, gradientMap: GRADIENTE, ...op }));
}

/* ---------- formas básicas (com o "pé" no y = 0) ---------- */
function geoBloco(w, h, d, r) {
  r = Math.max(.5, Math.min(r, w / 2 - 1, h / 2 - 1, d / 2 - 1));
  const iw = w - 2 * r, ih = h - 2 * r, cr = Math.max(.05, Math.min(r * .6, iw / 2 - .05, ih / 2 - .05));
  const x0 = -iw / 2, x1 = iw / 2, y0 = r, y1 = h - r;
  const s = new T.Shape();
  s.moveTo(x0 + cr, y0); s.lineTo(x1 - cr, y0); s.quadraticCurveTo(x1, y0, x1, y0 + cr);
  s.lineTo(x1, y1 - cr); s.quadraticCurveTo(x1, y1, x1 - cr, y1);
  s.lineTo(x0 + cr, y1); s.quadraticCurveTo(x0, y1, x0, y1 - cr);
  s.lineTo(x0, y0 + cr); s.quadraticCurveTo(x0, y0, x0 + cr, y0);
  const g = new T.ExtrudeGeometry(s, { depth: Math.max(.5, d - 2 * r), bevelEnabled: true, bevelThickness: r, bevelSize: r, bevelSegments: 3, curveSegments: 3 });
  g.translate(0, 0, -Math.max(.5, d - 2 * r) / 2);
  return g;
}
const malha = (geo, m) => { const o = new T.Mesh(geo, m); o.castShadow = true; o.receiveShadow = true; return o; };
const bloco = (w, h, d, cor, r = 6) => malha(geoBloco(w, h, d, r), typeof cor === "string" ? mat(cor) : cor);
function caixa(w, h, d, cor) { const g = new T.BoxGeometry(w, h, d); g.translate(0, h / 2, 0); return malha(g, typeof cor === "string" ? mat(cor) : cor); }
function cilindro(rt, rb, h, cor, seg = 22, aberto = false) { const g = new T.CylinderGeometry(rt, rb, h, seg, 1, aberto); g.translate(0, h / 2, 0); return malha(g, typeof cor === "string" ? mat(cor) : cor); }
function bola(r, cor, seg = 18) { return malha(new T.SphereGeometry(r, seg, Math.round(seg * .7)), typeof cor === "string" ? mat(cor) : cor); }
function por(pai, obj, x, y2d, z) { obj.position.set(x, A(y2d), z); pai.add(obj); return obj; }
function tocavel(obj, tipo, valor, extra) { obj.userData.toque = { tipo, valor, ...extra }; return obj; }
const semToque = obj => { obj.traverse(o => { o.raycast = () => {}; }); return obj; };

/* ---------- texturas pintadas na hora (num "papel" invisível: o canvas) ---------- */
function pintar(w, h, desenho, repetir) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  desenho(c.getContext("2d"), w, h);
  const t = new T.CanvasTexture(c);
  if (repetir) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(repetir[0], repetir[1]); }
  t.anisotropy = 4;
  return t;
}
/* Um desenho 2D (SVG) vira textura: usado para os retratos, as coisas e as roupas */
const cacheSvg = {};
function texturaSvg(chave, miolo, viewBox, w, h) {
  if (cacheSvg[chave]) return cacheSvg[chave];
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const t = new T.CanvasTexture(c);
  const defs = document.querySelector("svg.defs defs").outerHTML;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${viewBox}">` +
    `<style>.palpebra{display:none}</style>${defs}${miolo}</svg>`;
  const img = new Image();
  img.onload = () => { c.getContext("2d").drawImage(img, 0, 0, w, h); t.needsUpdate = true; C3.sujo = true; };
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  return (cacheSvg[chave] = t);
}
const cacheMatItem = {};
function figurinha(tipo, k = 1) {
  // figurinhas não recebem luz (ficam com as cores do desenho); de noite, só escurecem um pouco
  const m = cacheMatItem[tipo] || (cacheMatItem[tipo] = new T.MeshBasicMaterial({
    map: texturaSvg("item-" + tipo, ITENS[tipo].d(), "-34 -68 68 72", 136, 144), transparent: true, alphaTest: .35,
    color: C3.ehNoite ? "#8f96b8" : "#ffffff" }));
  const g = new T.PlaneGeometry(68 * k, 72 * k);
  g.translate(0, 32 * k, 0);
  return new T.Mesh(g, m);
}

/* =========================================================
   1. CENA, CÂMERA E LUZES
   ========================================================= */
function iniciar3D(canvas) {
  const r = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: "low-power" });
  r.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  r.shadowMap.enabled = true;
  r.shadowMap.type = T.PCFSoftShadowMap;
  C3.render = r;
  C3.cena = new T.Scene();
  C3.camera = new T.PerspectiveCamera(30, 1, 20, 9000);

  C3.ceuDia = pintar(8, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, "#6fa7db"); gr.addColorStop(.55, "#b5d5ec"); gr.addColorStop(1, "#f4e2bf");
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  C3.ceuNoite = pintar(8, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, "#141b42"); gr.addColorStop(.7, "#2a3466"); gr.addColorStop(1, "#3d4377");
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  C3.cena.background = C3.ceuDia;

  C3.hemi = new T.HemisphereLight("#fff4e0", "#d6b48a", .5);
  C3.cena.add(C3.hemi);
  const sol = new T.DirectionalLight("#fff1d6", .56);
  sol.castShadow = true;
  // celular: sombra um pouco menos detalhada, para o jogo ficar leve
  const pequeno = Math.min(screen.width, screen.height) < 600;
  sol.shadow.mapSize.set(pequeno ? 1024 : 2048, pequeno ? 512 : 1024);
  Object.assign(sol.shadow.camera, { left: -1100, right: 1100, top: 700, bottom: -500, near: 50, far: 3200 });
  sol.shadow.bias = -.0006;
  sol.shadow.radius = 3;
  C3.cena.add(sol, sol.target);
  C3.sol = sol;

  construirMundo3D();
  return C3;
}

/* A câmera 3D copia exatamente o enquadramento da camada 2D */
function definirCamera3D(cx, cy, vw, vh, larguraPx, alturaPx) {
  const cam = C3.camera;
  cam.position.set(cx + vw / 2, A(cy + vh / 2), D_CAM);
  cam.fov = 2 * Math.atan(vh / 2 / D_CAM) * 180 / Math.PI;
  cam.aspect = vw / vh;
  cam.updateProjectionMatrix();
  if (larguraPx) C3.render.setSize(larguraPx, alturaPx, false);
  // o sol acompanha a câmera, para a sombra ficar sempre nítida onde a gente está olhando
  const alvo = cx + vw / 2;
  C3.sol.target.position.set(alvo, -380, -80);
  C3.sol.position.set(alvo - 650, 700, 1100);
  C3.sujo = true;
}

/* =========================================================
   2. O MUNDO
   ========================================================= */
function construirMundo3D() {
  const c = C3.cena;
  construirLonge(c);
  construirQuintal(c);
  construirCasaEstrutura(c);
  construirSala(c);
  construirCozinha(c);
  construirQuarto(c);
  construirNoite(c);
  // brilho suave que marca o lugar certo do que a Manu está segurando
  const brilho = new T.Mesh(new T.CircleGeometry(110, 32), new T.MeshBasicMaterial({
    map: pintar(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, "rgba(255,240,170,.85)"); gr.addColorStop(1, "rgba(255,240,170,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }),
    transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
  brilho.visible = false;
  semToque(brilho);
  c.add(brilho);
  C3.dica = brilho;
}

/* =========================================================
   A CAATINGA: plantas e pedras do sertão, feitas de formas simples
   ========================================================= */
const COR = {
  terra: "#dcae79", terraEscura: "#c99662", capim: "#d8c27c", cacto: "#6f9a6b", cactoClaro: "#86ad7c",
  folhaSeca: "#a3ad7f", folhaVerde: "#93a86c", ipe: "#f2c94c", pedra: "#cbb9aa", pedraEscura: "#b9a596",
  vara: "#9c8466", serra: "#aab6c6", morro: "#cdbb8e",
};
// mandacaru: o cacto alto, de braços para cima
function mandacaru(h, k = 1, flor = false) {
  const g = new T.Group();
  const coluna = (r, alt) => { const o = new T.Group(); o.add(cilindro(r, r * 1.08, alt, COR.cacto, 10)); const topo = bola(r, COR.cacto, 10); topo.position.y = alt; o.add(topo); return o; };
  g.add(coluna(15 * k, h));
  for (const [lado, y, alt] of [[-1, h * .42, h * .38], [1, h * .55, h * .3], [1, h * .3, h * .22]]) {
    const braco = new T.Group();
    const cotovelo = cilindro(11 * k, 11 * k, 30 * k, COR.cacto, 8);
    cotovelo.rotation.z = -lado * Math.PI / 2;
    braco.add(cotovelo);
    const sobe = coluna(11 * k, alt);
    sobe.position.x = lado * 30 * k;
    braco.add(sobe);
    braco.position.set(0, y, 0);
    g.add(braco);
  }
  if (flor) { const f = bola(7 * k, "#f3b8c8", 8); f.position.y = h + 14 * k; g.add(f); }
  return g;
}
// xique-xique: cactinhos baixos, em tufo
function xiqueXique(k = 1) {
  const g = new T.Group();
  [[0, 50, 0], [-14, 34, -.3], [14, 40, .3], [6, 26, .5]].forEach(([x, h, r]) => {
    const c = cilindro(7 * k, 8 * k, h * k, COR.cactoClaro, 8);
    c.position.x = x * k; c.rotation.z = r; g.add(c);
  });
  return g;
}
// coroa-de-frade: cacto redondinho com "chapéu" vermelho
function coroaDeFrade(k = 1) {
  const g = new T.Group();
  const corpo = bola(16 * k, COR.cacto, 12); corpo.scale.y = .8; corpo.position.y = 12 * k; g.add(corpo);
  const coroa = cilindro(9 * k, 10 * k, 10 * k, "#c9574b", 10); coroa.position.y = 22 * k; g.add(coroa);
  return g;
}
// arbusto da caatinga: tronco torto e copa miúda
function arbusto(k = 1, cor = COR.folhaSeca) {
  const g = new T.Group();
  const t1 = cilindro(4 * k, 6 * k, 50 * k, "#8c7258", 6); t1.rotation.z = .25; g.add(t1);
  const t2 = cilindro(3 * k, 4 * k, 40 * k, "#8c7258", 6); t2.rotation.z = -.4; t2.position.y = 20 * k; g.add(t2);
  [[-14, 56, 22], [14, 62, 20], [0, 70, 24], [22, 50, 16]].forEach(([x, y, r]) => {
    const b = bola(r * k, cor, 9); b.scale.y = .7; b.position.set(x * k, y * k, 0); g.add(b);
  });
  return g;
}
function capim(k = 1) {
  const g = new T.Group();
  for (let i = 0; i < 5; i++) {
    const f = new T.Mesh(new T.ConeGeometry(2.5 * k, 26 * k, 4), mat(COR.capim));
    f.position.set((i - 2) * 4 * k, 12 * k, (i % 2) * 3);
    f.rotation.z = (i - 2) * .22;
    g.add(f);
  }
  return g;
}
function lajedo(w, h, d, cor = COR.pedra) {
  const g = new T.Group();
  const a = bola(1, cor, 14); a.scale.set(w / 2, h, d / 2); g.add(a);
  const b = bola(1, COR.pedraEscura, 12); b.scale.set(w / 4, h * .7, d / 3); b.position.set(w * .35, 0, d * .1); g.add(b);
  return g;
}

function construirLonge(c) {
  // chão de terra batida, com capim seco espalhado
  const terra = pintar(128, 128, (g, w, h) => {
    g.fillStyle = COR.terra; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 320; i++) { g.fillStyle = ["#d3a36d", "#e6c08f", "#d8b080"][i % 3]; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    g.strokeStyle = "#cdb46a"; g.lineWidth = 1;
    for (let i = 0; i < 26; i++) { const x = Math.random() * w, y = Math.random() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 3, y - 6); g.moveTo(x + 2, y); g.lineTo(x - 2, y - 5); g.stroke(); }
  }, [140, 60]);
  const chao = new T.Mesh(new T.PlaneGeometry(18000, 7000), new T.MeshLambertMaterial({ map: terra, color: new T.Color(1.06, 1.06, 1.06) }));
  chao.rotation.x = -Math.PI / 2;
  chao.position.set(2000, A(522), -2000);
  chao.receiveShadow = true;
  tocavel(chao, "chao");
  c.add(chao);

  // serras azuladas lá longe e morros cor de palha mais perto
  for (let i = 0; i < 12; i++) {
    const s = bola(1, i % 2 ? COR.serra : "#b7c1cf", 16);
    s.scale.set(900 + (i % 3) * 300, 380 + (i % 4) * 120, 300);
    s.position.set(-4200 + i * 900, A(522), -3400 - (i % 2) * 200);
    s.castShadow = false; semToque(s); c.add(s);
  }
  for (let i = 0; i < 14; i++) {
    const m = bola(1, i % 2 ? COR.morro : "#c4bd8f", 18);
    m.scale.set(620 + (i % 4) * 150, 200 + (i % 3) * 70, 320);
    m.position.set(-3500 + i * 680, A(522), -2300 - (i % 3) * 250);
    m.castShadow = false; semToque(m); c.add(m);
  }
  // lajedos (grandes pedras arredondadas)
  for (const [x, z, w, h] of [[-1500, -1300, 420, 90], [600, -1500, 300, 70], [2600, -1350, 520, 110], [4600, -1250, 380, 80]]) {
    const l = lajedo(w, h, w * .6); l.position.set(x, A(522), z); semToque(l); c.add(l);
  }
  // vegetação da caatinga ao longe: arbustos, mandacarus e alguns ipês amarelos
  for (let i = 0; i < 40; i++) {
    const x = -3200 + i * 220 + (i % 5) * 37, z = -800 - (i % 6) * 120;
    let o;
    if (i % 7 === 3) o = arbusto(2.2, COR.ipe);
    else if (i % 4 === 1) o = mandacaru(170 + (i % 3) * 40, .9);
    else o = arbusto(1.8 + (i % 3) * .3, i % 2 ? COR.folhaSeca : COR.folhaVerde);
    o.position.set(x, A(522), z);
    o.traverse(m => { m.castShadow = false; });
    semToque(o);
    c.add(o);
  }
  // na beirada da frente do quintal: cactinhos, capim e pedrinhas
  // (só fora da casa, para não tampar os cômodos)
  for (let x = -1200, i = 0; x < 5000; x += 190, i++) {
    if (x > 900 && x < 4100) continue;
    const z = 250 + (i % 3) * 45;
    let o = i % 5 === 0 ? coroaDeFrade(1.4) : i % 5 === 2 ? xiqueXique(1.3) : i % 5 === 4 ? lajedo(60, 18, 40) : capim(1.6);
    o.position.set(x + (i % 3) * 30, A(522), z);
    o.traverse(m => { m.castShadow = false; });
    semToque(o);
    c.add(o);
  }
  // poucas nuvens: o céu do sertão é aberto
  for (let i = 0; i < 4; i++) {
    const g = new T.Group();
    for (let j = 0; j < 3; j++) {
      const b = bola(55 + (j % 2) * 25, mat("#ffffff", { emissive: "#f3f1ea", emissiveIntensity: .35 }), 14);
      b.position.set(j * 70 - 70, (j % 2) * 26, 0);
      b.castShadow = false;
      g.add(b);
    }
    g.position.set(-2400 + i * 2100, 640 + (i % 2) * 200, -3600);
    semToque(g);
    c.add(g);
  }
  // o sol forte do sertão
  const sol = new T.Mesh(new T.CircleGeometry(110, 32), new T.MeshBasicMaterial({ color: "#fff1b8" }));
  sol.position.set(-1200, 760, -3800);
  semToque(sol);
  c.add(sol);
  C3.discoSol = sol;
}

/* ---------- quintal ---------- */
function construirQuintal(c) {
  // cerca de varas, tortinhas e de alturas diferentes
  for (let x = -748, i = 0; x < 990; x += 22, i++) {
    const h = 78 + ((i * 37) % 23);
    const v = cilindro(3, 4, h, i % 3 ? COR.vara : "#8d765b", 5);
    v.rotation.z = ((i * 13) % 7 - 3) * .02;
    por(c, v, x, 522, -250);
  }
  for (const y of [468, 430]) {
    const t = cilindro(3.5, 3.5, 1750, "#8d765b", 6);
    t.rotation.z = Math.PI / 2;
    t.position.set(1000, A(y), -246);
    t.geometry.translate(0, 0, 0);
    c.add(t);
    t.position.x = -752 + 1750 / 2;
    t.geometry.center();
  }

  // umbuzeiro: tronco baixo e torto, copa larga como um guarda-chuva
  const arvore = tocavel(new T.Group(), "coisa", "arvore");
  const tronco = cilindro(20, 30, 120, "#8c6a4c", 10); tronco.rotation.z = .08; arvore.add(tronco);
  for (const [rz, h, x] of [[.7, 110, 0], [-.6, 120, 0], [.15, 100, 6]]) {
    const g = cilindro(9, 14, h, "#8c6a4c", 8); g.rotation.z = rz; g.position.set(x, 100, 0); arvore.add(g);
  }
  const copa = new T.Group();
  for (const [x, y, r, z] of [[-130, -10, 70, -20], [130, -6, 74, -10], [-60, 20, 82, -40], [60, 22, 84, -30], [0, 0, 96, 0], [0, 30, 80, -70], [-170, -26, 50, 10], [175, -24, 52, 0]]) {
    const b = bola(r, x % 3 ? COR.folhaVerde : "#a3b679", 14);
    b.scale.y = .55;
    b.position.set(x, y, z);
    copa.add(b);
  }
  copa.position.set(0, 230, 0);
  arvore.add(copa);
  const frutas = new T.Group();
  arvore.add(frutas);
  por(c, arvore, 262, 522, -60);
  C3.grupos.copa = copa;
  C3.grupos.frutasArvore = frutas;

  // rede de dormir, amarrada no umbuzeiro e num esteio
  const rede = tocavel(new T.Group(), "coisa", "rede");
  por(rede, cilindro(7, 9, 150, "#8c6a4c", 8), 238, 0, 0);
  const listras = pintar(128, 16, (q, W, H) => { ["#d9735f", "#f0c561", "#6f9fbf", "#8fb07a", "#f3ead8"].forEach((cor, i) => { q.fillStyle = cor; q.fillRect(i * W / 5, 0, W / 5, H); }); }, [3, 1]);
  const curva = new T.CatmullRomCurve3([[0, 122], [50, 82], [120, 66], [190, 82], [238, 128]].map(([x, y]) => new T.Vector3(x, y, 0)));
  const pano = new T.Mesh(new T.TubeGeometry(curva, 32, 13, 8), new T.MeshLambertMaterial({ map: listras }));
  pano.scale.z = 1.7;
  pano.castShadow = true;
  const balanco = new T.Group();
  balanco.add(pano);
  rede.add(balanco);
  por(c, rede, 300, 522, -24);
  C3.rede = balanco;

  // roça de milho atrás da horta
  const roca = tocavel(new T.Group(), "coisa", "horta");
  for (let i = 0; i < 6; i++) {
    const pe = new T.Group();
    const h = 130 + (i % 3) * 18;
    pe.add(cilindro(2.5, 3.5, h, "#a3ad62", 6));
    for (const [y, lado] of [[h * .4, 1], [h * .6, -1], [h * .8, 1]]) {
      const f = bola(1, "#9fb164", 6); f.scale.set(26, 3, 7); f.position.set(lado * 22, y, 0); f.rotation.z = lado * .5; pe.add(f);
    }
    const espiga = bola(1, "#e8c45a", 8); espiga.scale.set(5, 14, 5); espiga.position.set(5, h * .55, 4); pe.add(espiga);
    pe.position.set(-90 + i * 36, 0, (i % 2) * 14);
    roca.add(pe);
  }
  por(c, roca, 674, 522, -110);
  // horta
  por(c, tocavel(bloco(220, 22, 70, "#a0744e", 6), "coisa", "horta"), 674, 522, -30);
  // açude pequeno (o pato mora aqui)
  const lago = tocavel(new T.Group(), "coisa", "pato");
  const borda = cilindro(132, 140, 6, "#b48f63", 32); borda.scale.z = .45; lago.add(borda);
  const agua = cilindro(118, 118, 7, mat("#8fbcc9", { emissive: "#a0cad6", emissiveIntensity: .25 }), 32); agua.scale.z = .42; lago.add(agua);
  for (const [x, h] of [[-118, 50], [-104, 64], [112, 46]]) por(lago, cilindro(2.5, 3.5, h, "#a9a35e", 6), x, 0, -16);
  por(c, lago, -430, 522, -24);
  por(c, coroaDeFrade(1.2), -300, 522, -70);
  // lajedo onde o calango toma sol
  const pedra = tocavel(lajedo(130, 46, 90), "coisa", "calango");
  por(c, pedra, -690, 522, -60);
  // cisterna (guarda a água da chuva)
  const cisterna = tocavel(new T.Group(), "coisa", "cisterna");
  cisterna.add(cilindro(70, 74, 110, "#f1ebe0", 24));
  const tampa = new T.Mesh(new T.ConeGeometry(74, 26, 24), mat("#e6dccb")); tampa.position.y = 123; cisterna.add(tampa);
  const bica = cilindro(3, 3, 22, "#9fb3c3", 8); bica.rotation.x = Math.PI / 2; bica.position.set(0, 20, 72); cisterna.add(bica);
  por(c, cisterna, -580, 522, -170);
  // casinha do Caramelo (de taipa, com telhado de telha)
  const casinha = new T.Group();
  por(casinha, bloco(120, 70, 90, "#d8b07c", 6), 0, 0, 0);
  const tel = new T.Shape(); tel.moveTo(-74, 0); tel.lineTo(0, 56); tel.lineTo(74, 0); tel.lineTo(-74, 0);
  const telhado = malha(new T.ExtrudeGeometry(tel, { depth: 100, bevelEnabled: false }), mat("#c98a6e"));
  telhado.position.set(0, 66, -50);
  casinha.add(telhado);
  const porta = new T.Mesh(new T.CircleGeometry(24, 20, 0, Math.PI), mat("#6b4a36"));
  porta.position.set(0, 30, 45.5); casinha.add(porta);
  const portaBase = new T.Mesh(new T.PlaneGeometry(48, 30), mat("#6b4a36")); portaBase.position.set(0, 15, 45.5); casinha.add(portaBase);
  const placa = new T.Mesh(new T.PlaneGeometry(56, 14), new T.MeshLambertMaterial({ map: pintar(224, 56, (g, w, h) => {
    g.fillStyle = "#fbf6ee"; g.fillRect(0, 0, w, h); g.fillStyle = "#8a6a55"; g.font = "800 34px 'Baloo 2', sans-serif"; g.textAlign = "center"; g.fillText("CARAMELO", w / 2, 41);
  }) }));
  placa.position.set(0, 86, 51); casinha.add(placa);
  por(c, casinha, -250, 522, -120);
  // banquinho onde os passarinhos pousam
  const banco = new T.Group();
  por(banco, bloco(130, 8, 26, "#b58a62", 3), 0, 0, 0).position.y = 112;
  for (const x of [-50, 50]) por(banco, cilindro(5, 6, 112, "#9c7a56", 8), x, 0, 0);
  por(c, banco, -36, 522, -2);
  // mandacaru grande perto da casa (de noite, a coruja pousa nele)
  por(c, tocavel(mandacaru(290, 1.15, true), "coisa", "mandacaru"), 925, 522, -170);
  // capim e cactinhos pelo terreiro
  for (const [x, z, f] of [[-520, -30, capim], [40, -150, xiqueXique], [180, -20, capim], [470, -170, capim], [820, -60, xiqueXique], [-120, -200, capim], [560, -40, capim]]) {
    const o = f(1.2); o.position.set(x, A(522), z); c.add(o);
  }
}

/* ---------- a casa: piso, paredes, teto, telhado ---------- */
function papelDeParede(tipo) {
  // parede caiada (branca de cal) com barrado pintado embaixo, como nas casas do sertão
  const barrado = { sala: "#9fbfd3", cozinha: "#e2b66c", quarto: "#d9a497" }[tipo];
  return pintar(1000, 408, (g, w, h) => {
    g.fillStyle = "#f6f0e2"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) { g.fillStyle = "rgba(200,180,150,.06)"; g.fillRect(Math.random() * w, Math.random() * h, 3, 2); }
    const yb = 258;
    g.fillStyle = barrado; g.fillRect(0, yb, w, h - yb);
    g.fillStyle = "rgba(255,255,255,.18)"; g.fillRect(0, yb, w, 8);
    g.fillStyle = barrado; g.fillRect(0, yb - 14, w, 4);
    // estêncil: florzinhas de quatro pétalas em cima do barrado
    for (let x = 26; x < w; x += 52) {
      g.fillStyle = barrado;
      for (const [dx, dy] of [[0, -7], [7, 0], [0, 7], [-7, 0]]) { g.beginPath(); g.arc(x + dx, yb - 30 + dy, 4.5, 0, 7); g.fill(); }
      g.fillStyle = "#f6f0e2"; g.beginPath(); g.arc(x, yb - 30, 2.5, 0, 7); g.fill();
    }
    const gr = g.createLinearGradient(0, 0, 0, 40); gr.addColorStop(0, "rgba(26,15,20,.12)"); gr.addColorStop(1, "rgba(26,15,20,0)");
    g.fillStyle = gr; g.fillRect(0, 0, w, 40);
  });
}

function construirCasaEstrutura(c) {
  const fundo = ZP.fundo, prof = ZP.frente - ZP.fundo, zMeio = (ZP.frente + ZP.fundo) / 2;
  // paredes do fundo
  ["sala", "cozinha", "quarto"].forEach((t, i) => {
    const p = new T.Mesh(new T.PlaneGeometry(1000, 410), new T.MeshLambertMaterial({ map: papelDeParede(t), color: new T.Color(1.14, 1.14, 1.14) }));
    p.position.set(1500 + i * 1000, A(112 + 205), fundo);
    p.receiveShadow = true;
    tocavel(p, "chao");
    c.add(p);
  });
  por(c, caixa(3000, 16, 8, "#f6f2ea"), 2500, 520, fundo + 4);
  // piso de tábuas
  // piso de cimento queimado vermelho, com as juntas em quadrados
  const tabuas = pintar(256, 256, (g, w, h) => {
    g.fillStyle = "#b85d4b"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 1400; i++) { g.fillStyle = ["rgba(140,60,45,.18)", "rgba(220,140,120,.14)", "rgba(110,45,35,.12)"][i % 3]; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, 1 + Math.random() * 5, 0, 7); g.fill(); }
    g.fillStyle = "rgba(255,230,210,.1)"; g.fillRect(0, 0, w, h / 2);
    g.fillStyle = "#9b4a3b"; g.fillRect(0, 0, w, 2); g.fillRect(0, 0, 2, h);
  }, [24, 3.5]);
  const piso = new T.Mesh(new T.BoxGeometry(3000, 22, prof), [mat("#a65242"), mat("#a65242"), new T.MeshLambertMaterial({ map: tabuas, color: new T.Color(1.08, 1.08, 1.08) }), mat("#a65242"), mat("#a65242"), mat("#a65242")]);
  piso.position.set(2500, A(520) - 11, zMeio);
  piso.receiveShadow = true;
  tocavel(piso, "chao");
  c.add(piso);
  // alicerce de pedra
  por(c, bloco(3030, 70, prof - 20, "#c46f55", 6), 2500, 610, zMeio - 6).receiveShadow = true;
  // laje do teto
  const laje = por(c, bloco(3036, 26, prof + 20, "#e9d3b0", 4), 2500, 114, zMeio);
  laje.castShadow = false;
  for (let x = 1030; x < 4000; x += 78) { const viga = caixa(10, 12, prof, "#8c6a4c"); viga.castShadow = false; por(c, viga, x, 102, zMeio); }
  // paredes cortadas (com os vãos das portas)
  const parede = (x, w, z0, z1, yTopo, yBase) => { const o = por(c, bloco(w, yBase - yTopo, z1 - z0, "#efd29b", 4), x, yBase, (z0 + z1) / 2); o.castShadow = false; return o; };
  parede(1001, 30, fundo, -64, 92, 566);         // parede do quintal, atrás da porta
  parede(1001, 30, 74, ZP.frente, 92, 566);       // e na frente da porta
  parede(1001, 30, -64, 74, 92, 248);            // em cima da porta
  for (const x of [2000, 3000]) parede(x, 22, fundo, -170, 112, 520); // só um pedacinho de parede separa os cômodos
  parede(3999, 30, fundo, ZP.frente, 92, 566);
  // porta da frente (gira na dobradiça)
  const pivo = new T.Group();
  const folha = bloco(10, 266, 138, "#6f93b8", 4);
  folha.position.set(0, 0, 69);
  pivo.add(folha);
  for (const [y, h] of [[150, 96], [30, 100]]) { const almofada = bloco(4, h, 100, "#83a6c8", 3); almofada.position.set(6, y, 69); pivo.add(almofada); }
  const macaneta = bola(6, "#f2c46a", 10); macaneta.position.set(9, 130, 120); pivo.add(macaneta);
  por(c, pivo, 1001, 520, -64);
  C3.pivos.porta = [{ obj: pivo, eixo: "y", aberto: 1.35 }];

  // telhado
  const corte = new T.Shape();
  corte.moveTo(-240, 0); corte.lineTo(60, 136); corte.lineTo(310, 0); corte.lineTo(-240, 0);
  const telhas = pintar(128, 64, (g, w, h) => {
    g.fillStyle = "#c98a6e"; g.fillRect(0, 0, w, h);
    g.strokeStyle = "#b5755a"; g.lineWidth = 3;
    for (let y = 8; y < h; y += 22) { g.beginPath(); for (let x = -16 + (y % 44 ? 16 : 0); x < w + 32; x += 32) g.arc(x, y, 16, 0, Math.PI); g.stroke(); }
  }, [1 / 64, 1 / 30]);
  const geoTelhado = new T.ExtrudeGeometry(corte, { depth: 3100, bevelEnabled: false });
  geoTelhado.rotateY(Math.PI / 2);
  const telhado = malha(geoTelhado, new T.MeshToonMaterial({ map: telhas, gradientMap: mat("#fff").gradientMap }));
  telhado.position.set(950, A(92), 0);
  telhado.castShadow = false;
  c.add(telhado);
  const chamine = new T.Group();
  por(chamine, bloco(64, 150, 64, "#b8735a", 4), 0, 0, 0);
  por(chamine, bloco(80, 16, 80, "#a8664e", 4), 0, -150, 0);
  por(c, chamine, 2632, 0, -140);
  chamine.traverse(o => { o.castShadow = false; });

  // luminárias de teto (acendem de noite)
  for (const [x, nome] of [[1500, "sala"], [2600, "cozinha"]]) {
    por(c, cilindro(1.5, 1.5, 40, "#8d7a68", 6), x, 154, -60).castShadow = false;
    const cupula = cilindro(16, 34, 30, mat("#f6e7c8", { emissive: "#ffd98a", emissiveIntensity: 0 }), 20, true);
    cupula.material = cupula.material.clone();
    por(c, cupula, x, 184, -60).castShadow = false;
    const luz = new T.PointLight("#ffd9a0", 0, 900, 2);
    luz.position.set(x, A(196), -40);
    c.add(luz);
    C3.luzes[nome] = { luz, cupula };
  }
}

/* ---------- janelas que abrem de verdade ---------- */
/* Folha de janela de madeira, pintada de verde-água, com ripas */
let _ripas = null;
const TEX_RIPAS = () => _ripas || (_ripas = pintar(64, 128, (q, W, H) => {
  q.fillStyle = "#6aa7a2"; q.fillRect(0, 0, W, H);
  for (let y = 4; y < H; y += 10) { q.fillStyle = "#5b958f"; q.fillRect(4, y, W - 8, 3); q.fillStyle = "#7db8b2"; q.fillRect(4, y + 3, W - 8, 1); }
  q.strokeStyle = "#4f857f"; q.lineWidth = 4; q.strokeRect(2, 2, W - 4, H - 4);
}));
/* Chita: o tecido florido das casas do Nordeste (em tons calmos) */
const _chitas = {};
function TEX_CHITA(fundo = "#d9735f") {
  return _chitas[fundo] || (_chitas[fundo] = pintar(128, 128, (q, W, H) => {
    q.fillStyle = fundo; q.fillRect(0, 0, W, H);
    const flor = (x, y, r, cor) => {
      q.fillStyle = cor;
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; q.beginPath(); q.ellipse(x + Math.cos(a) * r * .6, y + Math.sin(a) * r * .6, r * .45, r * .3, a, 0, 7); q.fill(); }
      q.fillStyle = "#f6e7b8"; q.beginPath(); q.arc(x, y, r * .28, 0, 7); q.fill();
    };
    q.fillStyle = "#7f9f6a"; for (const [x, y] of [[20, 60], [90, 20], [100, 100], [52, 108]]) { q.beginPath(); q.ellipse(x, y, 9, 4, .6, 0, 7); q.fill(); }
    flor(32, 32, 22, "#f3efe2"); flor(96, 70, 26, "#f0c561"); flor(30, 98, 16, "#e8a3a3"); flor(104, 12, 12, "#9fc3dd");
  }, [1, 1]));
}

function construirJanela(c, nome, x, y, w, h, corCortina) {
  const g = tocavel(new T.Group(), "coisa", "janela", { qual: nome, x: x + w / 2 });
  const z = ZP.fundo + 2;
  // a vista lá fora (dia e noite)
  const vistaDia = pintar(256, 256, (q, W, H) => {
    const gr = q.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "#7fb2df"); gr.addColorStop(1, "#f1dfbd");
    q.fillStyle = gr; q.fillRect(0, 0, W, H);
    q.fillStyle = "#b9c3cf"; q.beginPath(); q.ellipse(W * .75, H * .82, W * .5, H * .2, 0, 0, 7); q.fill();
    q.fillStyle = "#d9b787"; q.beginPath(); q.ellipse(W * .3, H, W * .6, H * .28, 0, 0, 7); q.fill();
    q.fillStyle = "#6f9a6b"; q.fillRect(W * .22, H * .45, 12, H * .4); q.fillRect(W * .16, H * .58, 8, H * .12); q.fillRect(W * .16, H * .58, 20, 7); q.fillRect(W * .27, H * .52, 8, H * .14); q.fillRect(W * .24, H * .62, 14, 7);
    q.fillStyle = "#a3ad7f"; q.beginPath(); q.ellipse(W * .72, H * .78, 26, 16, 0, 0, 7); q.fill();
  });
  const vistaNoite = pintar(256, 256, (q, W, H) => {
    q.fillStyle = "#1d2758"; q.fillRect(0, 0, W, H);
    q.fillStyle = "#fff4c4"; for (let i = 0; i < 14; i++) { q.beginPath(); q.arc(Math.random() * W, Math.random() * H * .7, 1.5 + Math.random() * 2, 0, 7); q.fill(); }
    q.fillStyle = "#2c3a63"; q.beginPath(); q.ellipse(W * .3, H, W * .55, H * .3, 0, 0, 7); q.fill();
  });
  const vista = new T.Mesh(new T.PlaneGeometry(w - 12, h - 12), new T.MeshBasicMaterial({ map: vistaDia }));
  vista.position.set(x + w / 2, A(y + h / 2), z);
  g.add(vista);
  (C3.vistas = C3.vistas || []).push({ m: vista.material, dia: vistaDia, noite: vistaNoite });
  // moldura com volume
  const moldura = "#fbf8f2";
  for (const [bx, by, bw, bh] of [[x, y, w, 10], [x, y + h - 10, w, 10], [x, y, 10, h], [x + w - 10, y, 10, h], [x + w / 2 - 3, y, 6, h]]) {
    if (bw === 6) continue;
    por(g, caixa(bw, bh, 14, moldura), bx + bw / 2, by + bh, z + 7);
  }
  por(g, bloco(w + 30, 10, 34, "#f7f4ef", 3), x + w / 2, y + h + 10, z + 17);
  // as duas folhas de vidro, cada uma na sua dobradiça
  const folhas = [];
  for (const lado of [-1, 1]) {
    const pivo = new T.Group();
    const fw = (w - 20) / 2;
    const vidro = new T.Mesh(new T.PlaneGeometry(fw, h - 20), new T.MeshLambertMaterial({ map: TEX_RIPAS(), side: T.DoubleSide }));
    vidro.position.set(-lado * fw / 2, 0, 0);
    pivo.add(vidro);
    for (const [bx, bw] of [[-lado * fw + lado * 2, 5], [-lado * 2, 5]]) {
      const barra = caixa(bw, h - 20, 6, moldura); barra.position.set(bx, -(h - 20) / 2, 0); pivo.add(barra);
    }
    for (const by of [-(h - 20) / 2, (h - 20) / 2 - 5]) { const barra = caixa(fw, 5, 6, moldura); barra.position.set(-lado * fw / 2, by, 0); pivo.add(barra); }
    pivo.position.set(lado > 0 ? x + w - 10 : x + 10, A(y + h / 2), z + 8);
    g.add(pivo);
    folhas.push({ obj: pivo, eixo: "y", aberto: lado < 0 ? -1.25 : 1.25 });
  }
  C3.pivos["janela-" + nome] = folhas;
  // cortinas
  for (const lado of [-1, 1]) {
    const cortina = malha(geoBloco(26, h + 20, 8, 4), new T.MeshLambertMaterial({ map: TEX_CHITA(corCortina) }));
    cortina.position.set(lado < 0 ? x - 6 : x + w + 6, A(y + h + 12), z + 22);
    g.add(cortina);
    (C3.cortinas = C3.cortinas || {})[nome] = (C3.cortinas[nome] || []).concat(cortina);
  }
  por(g, cilindro(3, 3, w + 60, "#b58a62", 8), x - 30, y - 10, z + 22).rotation.z = -Math.PI / 2;
  // raio de sol entrando pela janela
  const raio = new T.Mesh(new T.PlaneGeometry(w * 1.3, 220), new T.MeshBasicMaterial({
    map: pintar(64, 128, (q, W, H) => {
      const gr = q.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, "rgba(255,244,210,.0)"); gr.addColorStop(.25, "rgba(255,244,210,.28)"); gr.addColorStop(1, "rgba(255,244,210,0)");
      q.fillStyle = gr; q.beginPath(); q.moveTo(W * .2, 0); q.lineTo(W * .8, 0); q.lineTo(W, H); q.lineTo(0, H); q.fill();
    }),
    transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
  raio.rotation.x = -Math.PI / 2;
  raio.position.set(x + w / 2 + 50, A(519), ZP.fundo + 120);
  semToque(raio);
  c.add(raio);
  (C3.raios = C3.raios || []).push(raio);
  c.add(g);
}

/* Um móvel "oco" (com a frente aberta), para ver o que tem dentro quando a porta abre */
function carcaca(w, h, d, cor, esp = 8) {
  const g = new T.Group();
  const add = (o, x, y, z) => { o.position.set(x, y, z); g.add(o); return o; };
  add(caixa(w, h, esp, cor), 0, 0, -d / 2 + esp / 2);
  add(caixa(esp, h, d, cor), -w / 2 + esp / 2, 0, 0);
  add(caixa(esp, h, d, cor), w / 2 - esp / 2, 0, 0);
  add(caixa(w, esp, d, cor), 0, h - esp, 0);
  add(caixa(w, esp, d, cor), 0, 0, 0);
  return g;
}
function portaGiratoria(w, h, cor, lado, r = 5) {
  // lado = -1: dobradiça na esquerda; +1: na direita
  const pivo = new T.Group();
  const folha = bloco(w, h, 8, cor, r);
  folha.position.set(-lado * w / 2, 0, 4);
  pivo.add(folha);
  return pivo;
}

/* ---------- sala ---------- */
function construirSala(c) {
  construirJanela(c, "sala", 1494, 168, 150, 156, "#d9735f");
  construirRetratos(c);
  // sofá
  const sofa = tocavel(new T.Group(), "coisa", "sofa");
  const az = "#b8a58a";
  por(sofa, bloco(256, 40, 104, az, 10), 0, -18, 0);
  por(sofa, bloco(252, 92, 34, "#a99678", 14), 0, -40, -38);
  por(sofa, bloco(36, 70, 108, "#a99678", 14), -128, -18, 0);
  por(sofa, bloco(36, 70, 108, "#a99678", 14), 128, -18, 0);
  por(sofa, bloco(108, 20, 88, "#c7b597", 8), -56, -58, 6);
  por(sofa, bloco(108, 20, 88, "#c7b597", 8), 56, -58, 6);
  const alm1 = malha(geoBloco(60, 46, 18, 9), new T.MeshLambertMaterial({ map: TEX_CHITA("#d9735f") })); alm1.rotation.z = .12; por(sofa, alm1, -80, -78, -20);
  const alm2 = malha(geoBloco(60, 46, 18, 9), new T.MeshLambertMaterial({ map: TEX_CHITA("#6f9fbf") })); alm2.rotation.z = -.12; por(sofa, alm2, 80, -78, -20);
  for (const x of [-114, 114]) por(sofa, cilindro(5, 4, 18, "#8d6a4c", 8), x, 0, 30);
  por(c, sofa, 1290, 520, -195);
  // chapéu de couro do vovô, pendurado num prego
  const chapeu = tocavel(new T.Group(), "coisa", "chapeu");
  const aba = cilindro(46, 46, 5, "#8a5a35", 24); aba.rotation.x = Math.PI / 2; chapeu.add(aba);
  const copaC = bola(26, "#9a683f", 14); copaC.scale.z = .5; copaC.position.z = 8; chapeu.add(copaC);
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; const est = bola(3, "#e3c48a", 6); est.position.set(Math.cos(a) * 36, Math.sin(a) * 36, 4); chapeu.add(est); }
  por(c, chapeu, 1100, 250, ZP.fundo + 12);
  // tapete
  const tapete = cilindro(170, 170, 2, "#e8cdb6", 40); tapete.scale.z = .5;
  por(c, tapete, 1500, 520, -10);
  const anel = cilindro(150, 150, 2.5, "#f3e2d3", 40); anel.scale.z = .45;
  por(c, anel, 1500, 520, -10);
  const miolo = cilindro(132, 132, 3, "#e8cdb6", 40); miolo.scale.z = .42;
  por(c, miolo, 1500, 520, -10);
  // mesinha e rádio
  const radio = tocavel(new T.Group(), "coisa", "radio");
  por(radio, bloco(92, 12, 60, "#b58a62", 3), 0, -72, 0);
  for (const [x, z] of [[-36, -20], [36, -20], [-36, 20], [36, 20]]) por(radio, cilindro(4, 4, 72, "#a87d56", 8), x, 0, z);
  por(radio, bloco(70, 48, 40, "#c98a6e", 10), 0, -84, -4);
  const alto = cilindro(14, 14, 3, "#e9d6b9", 24); alto.rotation.x = Math.PI / 2; por(radio, alto, -12, -108, 17);
  for (const y of [-118, -100]) por(radio, bola(5, "#f3e7c9", 10), 18, y, 17);
  const antena = cilindro(1.6, 1.6, 50, "#8d6a4c", 6); antena.rotation.z = -.4; por(radio, antena, 10, -132, -6);
  por(c, radio, 1580, 520, -205);
  C3.notas = [];
  for (let i = 0; i < 2; i++) {
    const nota = new T.Mesh(new T.PlaneGeometry(26, 30), new T.MeshBasicMaterial({ transparent: true, depthWrite: false,
      map: pintar(64, 72, (q) => { q.fillStyle = "#8a7bb8"; q.font = "64px serif"; q.fillText(i ? "♫" : "♪", 4, 60); }) }));
    nota.position.set(1620 + i * 26, A(380 - i * 26), -180);
    nota.visible = false;
    semToque(nota);
    c.add(nota);
    C3.notas.push(nota);
  }
  // baú de brinquedos (tampa com dobradiça atrás)
  const bau = tocavel(new T.Group(), "lugar", "bau");
  bau.add(carcaca(144, 58, 92, "#b98458", 8));
  const fundoBau = caixa(128, 2, 76, "#7a5236"); fundoBau.position.y = 8; bau.add(fundoBau);
  const frenteBau = caixa(144, 58, 8, "#b98458"); frenteBau.position.set(0, 0, 42); bau.add(frenteBau);
  const fecho = bloco(24, 18, 6, "#e8c46a", 3); fecho.position.set(0, 30, 47); bau.add(fecho);
  const tampa = new T.Group();
  const tampaM = bloco(150, 20, 96, "#c48f62", 8); tampaM.position.set(0, 0, 48); tampa.add(tampaM);
  tampa.position.set(0, 58, -48);
  bau.add(tampa);
  const dentro = new T.Group(); dentro.visible = false; bau.add(dentro);
  por(c, bau, 1880, 520, -150);
  C3.pivos.bau = [{ obj: tampa, eixo: "x", aberto: -1.7 }];
  C3.grupos.bau = { grupo: dentro, origem: bau };
}

function construirRetratos(c) {
  C3.grupos.retratos = new T.Group();
  c.add(C3.grupos.retratos);
}
function retratos3D(familia) {
  const g = C3.grupos.retratos;
  while (g.children.length) g.remove(g.children[0]);
  ["manu", "vovo", "vovoo"].forEach((id, i) => {
    const x = 1196 + i * 94;
    const quadro = tocavel(new T.Group(), "coisa", "quadro", { quem: id });
    por(quadro, bloco(78, 88, 8, "#c49a6c", 4), 0, 0, 0);
    const chave = "retrato-" + id + JSON.stringify(familia[id]);
    const foto = new T.Mesh(new T.PlaneGeometry(60, 70), new T.MeshLambertMaterial({
      map: texturaSvg(chave, `<rect x="-200" y="-500" width="400" height="600" fill="#f7efe2"/>` + desenharAvatar(familia[id], { sombra: false }), recorteDe("rosto", familia[id]), 180, 210) }));
    foto.position.set(0, 44, 4.5);
    quadro.add(foto);
    por(g, quadro, x, 274, ZP.fundo + 6);
  });
  C3.sujo = true;
}

/* ---------- cozinha ---------- */
function construirCozinha(c) {
  construirJanela(c, "cozinha", 2330, 178, 140, 136, "#6f9fbf");
  // filtro de barro
  const filtro = tocavel(new T.Group(), "coisa", "filtro");
  por(filtro, bloco(76, 10, 50, "#b58a62", 3), 0, -66, 0);
  for (const [x, z] of [[-28, -16], [28, -16], [-28, 16], [28, 16]]) por(filtro, cilindro(4, 4, 66, "#a87d56", 8), x, 0, z);
  const pote = bola(30, "#c47a58", 18); pote.position.y = 104; filtro.add(pote);
  const pote2 = bola(25, "#cc8462", 18); pote2.position.y = 150; filtro.add(pote2);
  por(filtro, cilindro(13, 15, 8, "#b8714f", 14), 0, -170, 0);
  const torneira = bloco(16, 7, 14, "#9fb3c3", 2); torneira.position.set(22, 100, 26); filtro.add(torneira);
  const gota = bola(3.5, mat("#8fc3e6", { emissive: "#8fc3e6", emissiveIntensity: .3 }), 8);
  gota.position.set(28, 94, 30); gota.visible = false; filtro.add(gota);
  por(c, filtro, 2066, 520, -215);
  C3.gota = gota;

  // geladeira (oca por dentro, com prateleiras, e duas portas)
  const gel = tocavel(new T.Group(), "lugar", "geladeira");
  gel.add(carcaca(140, 270, 104, "#c9e2d7", 9));
  const forro = caixa(122, 252, 2, mat("#f6fbf9", { emissive: "#eef8f4", emissiveIntensity: .35 })); forro.position.set(0, 9, -42); gel.add(forro);
  for (const y of [72, 140, 198]) { const p = caixa(122, 4, 80, "#d5e7df"); p.position.set(0, y, 0); gel.add(p); }
  for (const [x] of [[-40], [40]]) { const pe = cilindro(5, 5, 6, "#9aa9a2", 8); pe.position.set(x, -6, 30); gel.add(pe); }
  gel.position.y = 6;
  const portaGel = portaGiratoria(140, 194, "#cfe6dc", 1, 10);
  const pux = bloco(9, 70, 10, "#eef6f2", 4); pux.position.set(-126, 80, 12); portaGel.add(pux);
  portaGel.position.set(70, 2, 52); gel.add(portaGel);
  const portaFr = tocavel(portaGiratoria(140, 72, "#cfe6dc", 1, 10), "coisa", "freezer");
  const pux2 = bloco(9, 34, 10, "#eef6f2", 4); pux2.position.set(-126, 20, 12); portaFr.add(pux2);
  portaFr.position.set(70, 198, 52); gel.add(portaFr);
  const dentroGel = new T.Group(); gel.add(dentroGel);
  const dentroFr = tocavel(new T.Group(), "coisa", "freezer"); gel.add(dentroFr);
  por(c, gel, 2190, 520, -205);
  C3.pivos.geladeira = [{ obj: portaGel, eixo: "y", aberto: 1.85 }];
  C3.pivos.freezer = [{ obj: portaFr, eixo: "y", aberto: 1.85 }];
  C3.grupos.geladeira = { grupo: dentroGel, origem: gel };
  C3.grupos.freezer = dentroFr;

  // pia e armário
  const pia = tocavel(new T.Group(), "coisa", "pia");
  const arm = tocavel(carcaca(200, 82, 100, "#efe4d1", 7), "coisa", "armarioPia");
  pia.add(arm);
  const panela = cilindro(22, 22, 24, "#a9bccb", 18); panela.position.set(-50, 8, -6); arm.add(panela);
  const forma = bloco(56, 22, 40, "#f2c46a", 5); forma.position.set(40, 8, -6); arm.add(forma);
  const pE = tocavel(portaGiratoria(96, 70, "#e6d8c1", -1, 5), "coisa", "armarioPia");
  const pD = tocavel(portaGiratoria(96, 70, "#e6d8c1", 1, 5), "coisa", "armarioPia");
  for (const [p, x] of [[pE, -98], [pD, 98]]) {
    const b = bola(4, "#c4a882", 8); b.position.set(p === pE ? 86 : -86, 36, 10); p.add(b);
    p.position.set(x, 6, 50); arm.add(p);
  }
  por(pia, bloco(214, 14, 108, "#f7f4ef", 4), 0, -82, 0);
  por(pia, caixa(84, 4, 54, "#d8dfe2"), 4, -96, 4);
  por(pia, cilindro(4, 4, 40, "#b9c4ca", 8), -8, -96, -34);
  const bico = cilindro(3.5, 3.5, 30, "#b9c4ca", 8); bico.rotation.x = Math.PI / 2; por(pia, bico, -8, -136, -34).position.z = -20;
  const agua = cilindro(3, 3, 36, mat("#a8d4ef", { transparent: true, opacity: .85, emissive: "#a8d4ef", emissiveIntensity: .3 }), 8);
  agua.position.set(-8, A(-96) + 0, -6); agua.visible = false; pia.add(agua);
  por(c, pia, 2400, 520, -205);
  C3.pivos.pia = [{ obj: pE, eixo: "y", aberto: -1.8 }, { obj: pD, eixo: "y", aberto: 1.8 }];
  C3.agua = agua;

  // fogão com forno (porta que abre para baixo)
  const fogao = tocavel(new T.Group(), "coisa", "fogao");
  const corF = "#f1e7d6";
  por(fogao, caixa(120, 102, 50, corF), 0, 0, -25);
  por(fogao, caixa(12, 102, 100, corF), -54, 0, 0);
  por(fogao, caixa(12, 102, 100, corF), 54, 0, 0);
  por(fogao, bloco(124, 14, 106, "#4e4440", 3), 0, -88, 0);
  por(fogao, caixa(120, 26, 100, corF), 0, 0, 0);
  const brasa = caixa(96, 60, 2, mat("#5a3f34", { emissive: "#f39a4a", emissiveIntensity: 0 }));
  brasa.material = brasa.material.clone();
  por(fogao, brasa, 0, -26, -0);
  for (const [x, z] of [[-30, 0], [30, 0]]) { por(fogao, cilindro(20, 20, 3, "#3a3330", 18), x, -102, z); por(fogao, cilindro(13, 13, 3.5, "#5a504b", 16), x, -102, z); }
  const panelaF = new T.Group();
  por(panelaF, cilindro(30, 24, 32, "#b8714f", 22), 0, 0, 0);
  por(panelaF, cilindro(31, 31, 5, "#a8634a", 22), 0, -32, 0);
  por(panelaF, bola(6, "#8f523d", 10), 0, -40, 0);
  por(fogao, panelaF, 0, -106, 4);
  const portaForno = tocavel(new T.Group(), "coisa", "forno");
  const pf = bloco(98, 64, 8, "#5a5550", 6); pf.position.set(0, 0, 4); portaForno.add(pf);
  for (let i = 0; i < 4; i++) { const fresta = caixa(60, 3, 2, "#3a3532"); fresta.position.set(0, 16 + i * 9, 8.5); portaForno.add(fresta); }
  const alca = cilindro(3.5, 3.5, 64, "#c9c2b8", 8); alca.rotation.z = Math.PI / 2; alca.position.set(-32, 54, 12); portaForno.add(alca);
  portaForno.position.set(0, A(-26), 50);
  fogao.add(portaForno);
  const dentroForno = tocavel(new T.Group(), "coisa", "forno"); fogao.add(dentroForno);
  const vapor = new T.Group();
  for (let i = 0; i < 3; i++) { const v = bola(9 + i * 2, mat("#ffffff", { transparent: true, opacity: 0, depthWrite: false }), 10); v.material = v.material.clone(); v.position.set(-12 + i * 12, 150 + i * 10, 4); vapor.add(v); }
  fogao.add(vapor);
  // chaminé do fogão a lenha subindo pela parede
  por(fogao, caixa(40, 210, 30, corF), 0, -102, -32);
  por(c, fogao, 2590, 520, -205);
  // prateleira com potes de barro
  const prateleira = new T.Group();
  por(prateleira, bloco(150, 8, 34, "#a87d56", 2), 0, 0, 0);
  for (const [x, r, h, cor] of [[-50, 16, 30, "#c47a58"], [-10, 20, 38, "#b8714f"], [32, 14, 26, "#d08c66"], [62, 12, 22, "#c47a58"]]) {
    const pote = bola(r, cor, 14); pote.scale.y = h / (2 * r); pote.position.set(x, 8 + h / 2, 0); prateleira.add(pote);
    const boca = cilindro(r * .55, r * .5, 6, cor, 12); boca.position.set(x, 8 + h - 2, 0); prateleira.add(boca);
  }
  por(c, prateleira, 2730, 300, ZP.fundo + 18);
  C3.pivos.forno = [{ obj: portaForno, eixo: "x", aberto: 1.45 }];
  C3.grupos.forno = dentroForno;
  C3.brasa = brasa;
  C3.vapor = vapor;

  // mesa com toalha xadrez e fruteira
  const xadrez = pintar(128, 128, (q, W, H) => {
    q.fillStyle = "#fbf6ee"; q.fillRect(0, 0, W, H);
    q.fillStyle = "rgba(231,169,154,.6)"; for (let x = 0; x < W; x += 16) for (let y = 0; y < H; y += 16) if (((x + y) / 16) % 2 === 0) q.fillRect(x, y, 16, 16);
  }, [3, 2]);
  const toalha = new T.MeshToonMaterial({ map: xadrez, gradientMap: mat("#fff").gradientMap });
  const mesa = tocavel(new T.Group(), "lugar", "fruteira");
  for (const [x, z] of [[-74, -40], [74, -40], [-74, 40], [74, 40]]) por(mesa, cilindro(5, 5, 82, "#a87d56", 8), x, 0, z);
  por(mesa, malha(geoBloco(190, 12, 116, 3), toalha), 0, -80, 0);
  por(mesa, malha(new T.BoxGeometry(190, 34, 2).translate(0, 17, 0), toalha), 0, -58, 59);
  for (const x of [-96, 96]) { const lado = malha(new T.BoxGeometry(2, 34, 116).translate(0, 17, 0), toalha); por(mesa, lado, x, -58, 0); }
  const tigela = malha(new T.SphereGeometry(40, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat("#f1ece2", { side: T.DoubleSide }));
  tigela.scale.y = .45;
  por(mesa, tigela, 0, -110, 0);
  const dentroMesa = new T.Group(); mesa.add(dentroMesa);
  por(c, mesa, 2850, 520, -100);
  C3.grupos.fruteira = { grupo: dentroMesa, origem: mesa };
}

/* ---------- quarto ---------- */
function construirQuarto(c) {
  construirJanela(c, "quarto", 3404, 176, 140, 128, "#e2b66c");
  // guarda-roupa com roupas para vestir
  const armario = tocavel(new T.Group(), "coisa", "armario");
  armario.add(carcaca(150, 264, 90, "#dcb894", 8));
  const fundoA = caixa(134, 248, 2, "#8c6a4c"); fundoA.position.set(0, 8, -36); armario.add(fundoA);
  const cabide = cilindro(2.5, 2.5, 130, "#d9c3a3", 8); cabide.rotation.z = Math.PI / 2; cabide.position.set(0, 228, -8); armario.add(cabide);
  for (const [i, roupa, cor] of [[0, "vestido", "#f2b630"], [1, "pijama", "#6aa8e8"], [2, "fada", "#3fb3a5"]]) {
    const x = -39 + i * 39;
    const tex = texturaSvg("roupa-" + roupa, roupaNoCabide(0, roupa, cor), "-30 258 60 130", 120, 260);
    const r = tocavel(new T.Mesh(new T.PlaneGeometry(60, 130), new T.MeshLambertMaterial({ map: tex, transparent: true, alphaTest: .35 })), "roupa", roupa);
    r.position.set(x, 166, -10 + i * 3);
    armario.add(r);
  }
  const portaE = portaGiratoria(75, 262, "#dcb894", -1, 8);
  const portaD = portaGiratoria(75, 262, "#d6b18b", 1, 8);
  for (const [p, x, bx] of [[portaE, -75, 64], [portaD, 75, -64]]) {
    const b = bola(5, "#f3e7c9", 10); b.position.set(bx, 134, 9); p.add(b);
    p.position.set(x, 1, 45); armario.add(p);
  }
  por(armario, bloco(162, 14, 100, "#c9a47e", 4), 0, -264, 0);
  por(c, armario, 3125, 520, -210);
  C3.pivos.armario = [{ obj: portaE, eixo: "y", aberto: -1.85 }, { obj: portaD, eixo: "y", aberto: 1.85 }];
  // planta
  const planta = tocavel(new T.Group(), "coisa", "planta");
  por(planta, cilindro(24, 17, 54, "#c98a6e", 16), 0, 0, 0);
  for (const [rz, cor, h] of [[.35, "#7fae6a", 100], [-.4, "#8fb97a", 110], [0, "#86b072", 124], [.15, "#7fae6a", 90]]) {
    const folha = bola(1, cor, 10); folha.scale.set(14, h / 2, 8);
    folha.position.set(Math.sin(rz) * 40, 54 + h / 2 - 10, (rz * 20));
    folha.rotation.z = -rz;
    planta.add(folha);
  }
  por(c, planta, 3234, 520, -215);
  // tapete
  const tapete = cilindro(150, 150, 2, "#e9d2cf", 40); tapete.scale.z = .5;
  por(c, tapete, 3470, 520, -20);
  // cama com colcha de crochê
  const croche = pintar(256, 128, (q, W, H) => {
    q.fillStyle = "#f6eedc"; q.fillRect(0, 0, W, H);
    const cores = ["#f2c2b6", "#bfd8c4", "#f3dc9a", "#c8d3ea"];
    for (let x = 12, i = 0; x < W; x += 28, i++) for (let y = 12, j = 0; y < H; y += 26, j++) {
      q.fillStyle = cores[(i + j) % 4]; q.beginPath(); q.arc(x + (j % 2) * 14, y, 9, 0, 7); q.fill();
      q.fillStyle = "#fffaf0"; q.beginPath(); q.arc(x + (j % 2) * 14, y, 3, 0, 7); q.fill();
    }
  });
  const cama = tocavel(new T.Group(), "coisa", "cama");
  por(cama, bloco(42, 170, 150, "#b98458", 12), -160, 0, 0);
  por(cama, bloco(40, 102, 150, "#b98458", 12), 160, 0, 0);
  por(cama, bloco(300, 30, 140, "#c48f62", 8), 0, -36, 0);
  por(cama, bloco(290, 26, 134, "#fbfbf8", 10), 0, -64, 0);
  por(cama, malha(geoBloco(240, 16, 140, 6), new T.MeshToonMaterial({ map: croche, gradientMap: mat("#fff").gradientMap })), 26, -84, 2);
  por(cama, bloco(76, 26, 96, "#ffffff", 12), -104, -84, -10);
  por(c, cama, 3470, 520, -175);
  // criado-mudo e abajur
  const abajur = tocavel(new T.Group(), "coisa", "abajur");
  por(abajur, bloco(80, 68, 64, "#c48f62", 6), 0, 0, 0);
  por(abajur, caixa(64, 3, 2, "#a87d56"), 0, -40, 32.5);
  por(abajur, cilindro(9, 12, 6, "#e8d9c2", 14), 0, -68, 0);
  por(abajur, cilindro(3, 3, 30, "#e8d9c2", 8), 0, -74, 0);
  const cupula = cilindro(15, 28, 42, mat("#f6d9a8", { emissive: "#ffcf7a", emissiveIntensity: 0 }), 20, true);
  cupula.material = cupula.material.clone();
  por(abajur, cupula, 0, -100, 0);
  por(c, abajur, 3730, 520, -222);
  const luzAbajur = new T.PointLight("#ffcf8a", 0, 650, 2);
  luzAbajur.position.set(3730, A(380), -170);
  c.add(luzAbajur);
  C3.luzes.abajur = { luz: luzAbajur, cupula };
}

/* ---------- a noite: lua, estrelas e coruja ficam guardadas até escurecer ---------- */
function construirNoite(c) {
  const g = new T.Group();
  const lua = new T.Mesh(new T.CircleGeometry(70, 32), new T.MeshBasicMaterial({ color: "#fbf3cf" }));
  lua.position.set(600, 600, -3500);
  g.add(lua);
  const pos = [];
  for (let i = 0; i < 520; i++) pos.push(-5000 + Math.random() * 12000, 50 + Math.random() * 2200, -3700);
  for (let i = 0; i < 700; i++) { const t = Math.random(); pos.push(-4000 + t * 10000 + (Math.random() - .5) * 500, 300 + t * 1300 + (Math.random() - .5) * 360, -3700); }
  const geo = new T.BufferGeometry();
  geo.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
  g.add(new T.Points(geo, new T.PointsMaterial({ color: "#fff4c4", size: 3, sizeAttenuation: false })));
  // vaga-lumes bem quietinhos no quintal
  const vaga = [];
  for (let i = 0; i < 24; i++) vaga.push(-700 + Math.random() * 1650, A(400 + Math.random() * 100), -200 + Math.random() * 260);
  const geoV = new T.BufferGeometry();
  geoV.setAttribute("position", new T.Float32BufferAttribute(vaga, 3));
  g.add(new T.Points(geoV, new T.PointsMaterial({ color: "#fff2a0", size: 4, sizeAttenuation: false, transparent: true, opacity: .85 })));
  g.visible = false;
  semToque(g);
  c.add(g);
  C3.noite = g;
}

/* =========================================================
   3. MOVIMENTOS (portas, tampas, janelas, partículas)
   ========================================================= */
const suaveIO = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
function tween3D(ms, passo, fim) {
  C3.tweens.push({ t0: performance.now(), ms, passo, fim });
  C3.sujo = true;
}
function abrir3D(nome, aberto) {
  const lista = C3.pivos[nome];
  if (!lista) return;
  C3.abertos[nome] = aberto;
  for (const p of lista) {
    const de = p.obj.rotation[p.eixo], para = aberto ? p.aberto : 0;
    tween3D(650, t => { p.obj.rotation[p.eixo] = de + (para - de) * suaveIO(t); });
  }
  if (nome === "bau") C3.grupos.bau.grupo.visible = aberto;
  if (nome === "forno") {
    const m = C3.brasa.material, de = m.emissiveIntensity;
    tween3D(700, t => { m.emissiveIntensity = de + ((aberto ? .9 : 0) - de) * t; });
  }
  if (nome.startsWith("janela-") && aberto) {
    const cortinas = C3.cortinas[nome.slice(7)] || [];
    tween3D(2600, t => cortinas.forEach((c, i) => { c.rotation.z = Math.sin(t * Math.PI * 4 + i) * .05 * (1 - t); }));
  }
}
const aberto3D = nome => !!C3.abertos[nome];

function sacudirArvore3D() {
  const copa = C3.grupos.copa;
  tween3D(900, t => { copa.rotation.z = Math.sin(t * Math.PI * 5) * .045 * (1 - t); });
}
/* a rede balança devagarinho e vai parando */
function rede3D() {
  const r = C3.rede;
  tween3D(4200, t => { r.rotation.x = Math.sin(t * Math.PI * 6) * .28 * (1 - t); });
}
function agua3D(ms) {
  C3.agua.visible = true; C3.sujo = true;
  setTimeout(() => { C3.agua.visible = false; C3.sujo = true; }, ms);
}
function gota3D() {
  const g = C3.gota;
  g.visible = true;
  tween3D(900, t => { g.position.y = 94 - t * 70; g.scale.setScalar(1 - t * .3); }, () => { g.visible = false; g.position.y = 94; });
}
function vapor3D() {
  C3.vapor.children.forEach((v, i) => {
    const y0 = 150 + i * 10;
    tween3D(2000 + i * 200, t => { v.position.y = y0 + t * 70; v.material.opacity = Math.sin(t * Math.PI) * .7; v.scale.setScalar(1 + t); });
  });
}
function radio3D(ligado) {
  C3.notas.forEach(n => { n.visible = ligado; });
  C3.radioLigado = ligado;
  C3.sujo = true;
}
function abajur3D(aceso) {
  const { luz, cupula } = C3.luzes.abajur;
  const de = luz.intensity;
  tween3D(600, t => { luz.intensity = de + ((aceso ? .8 : 0) - de) * t; cupula.material.emissiveIntensity = luz.intensity; });
}
function porta3D(aberta) { if (aberta !== aberto3D("porta")) abrir3D("porta", aberta); }

/* Dica: o brilho fica na frente do lugar certo */
const LUGAR_DICA = { geladeira: [2190, 360, -140], fruteira: [2850, 430, -30], bau: [1880, 470, -90] };
function dica3D(lugar) {
  const d = C3.dica;
  d.visible = !!lugar;
  if (lugar) { const [x, y, z] = LUGAR_DICA[lugar]; d.position.set(x, A(y), z); }
  C3.sujo = true;
}

/* ---------- o que tem dentro de cada lugar ---------- */
const VAGAS3D = {
  geladeira: [[-30, 198], [30, 198], [-30, 140], [30, 140], [-30, 72], [30, 72]].map(([x, y]) => [x, y + 4, -6, .6]),
  fruteira: [[-27, 102], [-9, 104], [9, 104], [27, 102]].map(([x, y], i) => [x, y, i % 2 ? 6 : -6, .56]),
  bau: [[-50, 14], [-25, 12], [0, 14], [25, 12], [50, 14]].map(([x, y], i) => [x, y, i % 2 ? 8 : -8, .62]),
};
function conteudo3D(lugar, itens) {
  const { grupo } = C3.grupos[lugar];
  while (grupo.children.length) grupo.remove(grupo.children[0]);
  for (const it of itens) {
    const [x, y, z, k] = VAGAS3D[lugar][it.vaga];
    const f = tocavel(figurinha(it.tipo, k), "item", it.id);
    f.position.set(x, y, z);
    grupo.add(f);
  }
  C3.sujo = true;
}
function forno3D(temBolo) {
  const g = C3.grupos.forno;
  while (g.children.length) g.remove(g.children[0]);
  if (temBolo) { const b = figurinha("bolo", .7); b.position.set(0, 30, 20); g.add(b); }
  C3.sujo = true;
}
function freezer3D(n) {
  const g = C3.grupos.freezer;
  while (g.children.length) g.remove(g.children[0]);
  for (let i = 0; i < n; i++) { const p = figurinha("picole", .6); p.position.set(-30 + i * 40, 212, 0); g.add(p); }
  C3.sujo = true;
}
function arvore3D(n) {
  const g = C3.grupos.frutasArvore;
  while (g.children.length) g.remove(g.children[0]);
  FRUTAS_ARVORE.slice(0, n).forEach(([x, y]) => {
    const m = figurinha("umbu", .9);
    m.position.set(x - 262, A(y + 40) + 522, 70);
    g.add(m);
  });
  C3.sujo = true;
}

/* ---------- dia e noite ---------- */
function noite3D(sim) {
  const l = C3.luzes;
  const de = { hemi: C3.hemi.intensity, sol: C3.sol.intensity, teto: l.sala.luz.intensity };
  const para = sim ? { hemi: .26, sol: .14, teto: .9 } : { hemi: .5, sol: .56, teto: 0 };
  C3.sol.color.set(sim ? "#9fb2ff" : "#fff1d6");
  C3.hemi.color.set(sim ? "#9fb0e8" : "#fff8ec");
  tween3D(1800, t => {
    C3.hemi.intensity = de.hemi + (para.hemi - de.hemi) * t;
    C3.sol.intensity = de.sol + (para.sol - de.sol) * t;
    for (const n of ["sala", "cozinha"]) { l[n].luz.intensity = de.teto + (para.teto - de.teto) * t; l[n].cupula.material.emissiveIntensity = l[n].luz.intensity * .9; }
    if (t > .5) {
      C3.ehNoite = sim;
      Object.values(cacheMatItem).forEach(m => m.color.set(sim ? "#8f96b8" : "#ffffff"));
      C3.cena.background = sim ? C3.ceuNoite : C3.ceuDia;
      C3.noite.visible = sim;
      C3.discoSol.visible = !sim;
      (C3.vistas || []).forEach(v => { v.m.map = sim ? v.noite : v.dia; });
      (C3.raios || []).forEach(r => { r.visible = !sim; });
    }
  });
  abajur3D(sim);
}

/* =========================================================
   4. TOQUE: qual objeto 3D está debaixo do dedo?
   ========================================================= */
const raio3D = new T.Raycaster();
function tocar3D(clientX, clientY, rect) {
  const v = new T.Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
  raio3D.setFromCamera(v, C3.camera);
  const visivel = o => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
  for (const hit of raio3D.intersectObjects(C3.cena.children, true)) {
    if (!visivel(hit.object)) continue;
    let o = hit.object;
    while (o && !o.userData.toque) o = o.parent;
    if (!o) return { tipo: "chao", x: hit.point.x };
    let t = o.userData.toque;
    // roupas só valem com o guarda-roupa aberto; o resto do armário vale como "armario"
    if (t.tipo === "roupa" && !aberto3D("armario")) { do { o = o.parent; } while (o && !o.userData.toque); t = o ? o.userData.toque : null; }
    return t ? { ...t, x: t.tipo === "chao" ? hit.point.x : t.x } : null;
  }
  return null;
}

/* =========================================================
   5. DESENHAR (só quando algo mudou)
   ========================================================= */
function desenhar3D(agora) {
  const tw = C3.tweens;
  for (let i = tw.length - 1; i >= 0; i--) {
    const p = Math.min(1, (agora - tw[i].t0) / tw[i].ms);
    tw[i].passo(p);
    if (p >= 1) { const fim = tw[i].fim; tw.splice(i, 1); fim && fim(); }
  }
  const animando = tw.length > 0 || C3.dica.visible || C3.radioLigado;
  if (C3.dica.visible) C3.dica.material.opacity = .55 + Math.sin(agora / 420) * .4;
  if (C3.radioLigado) C3.notas.forEach((n, i) => { n.position.y = A(380 - i * 26) + Math.sin(agora / 500 + i) * 8; });
  if (!C3.sujo && !animando) return;
  C3.render.render(C3.cena, C3.camera);
  C3.sujo = false;
}
