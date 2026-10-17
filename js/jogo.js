/* =========================================================
   jogo.js — O MOTOR DA CASA DA VOVÓ

   Como tudo funciona, em quatro ideias:
   1. O MUNDO é uma lista do que existe e onde está
      (a bola está no chão do quintal, o leite está na geladeira...).
   2. Tocar em algo = a Manu ANDA até lá e, ao chegar, FAZ a ação.
   3. Depois de cada mudança, o jogo DESENHA de novo só o que mudou
      e GUARDA o mundo no celular.
   4. Um "relógio" roda o tempo todo (várias vezes por segundo)
      movendo as pessoas e a câmera.
   ========================================================= */

/* ---------- 1. Guardar no celular ---------- */
const GAVETA_MUNDO = "casa-vovo-mundo-v1";
const GAVETA_FAMILIA = "casa-vovo-familia-v1";
const ler = chave => { try { return JSON.parse(localStorage.getItem(chave)); } catch (e) { return null; } };
const gravar = (chave, valor) => { try { localStorage.setItem(chave, JSON.stringify(valor)); } catch (e) { /* segue sem salvar */ } };

function mundoInicial() {
  let n = 0;
  const it = (tipo, onde, extra) => ({ id: "i" + (++n), tipo, onde, ...extra });
  const itens = [
    it("bola", "chao", { x: 130 }),
    it("cubo", "chao", { x: 1440 }),
    it("laranja", "chao", { x: 2440 }),
    it("pao", "chao", { x: 2530 }),
    it("urso", "chao", { x: 3260 }),
    it("banana", "fruteira", { vaga: 0 }),
    it("leite", "geladeira", { vaga: 0 }),
    it("queijo", "geladeira", { vaga: 3 }),
  ];
  return { itens, proximo: n + 1, arvore: 3, horta: [true, true, true], forno: true, freezer: 2 };
}

function carregarMundo() {
  const m = ler(GAVETA_MUNDO);
  if (!m || !Array.isArray(m.itens)) return mundoInicial();
  m.itens = m.itens.filter(i => ITENS[i.tipo]);
  // se a vovó estava levando algo quando o jogo fechou, a coisa fica no chão perto dela
  for (const i of m.itens) if (i.onde.startsWith("mao:") && i.onde !== "mao:manu") { const quem = i.onde.slice(4); i.onde = "chao"; i.x = PESSOAS[quem]?.casa || 1300; }
  for (const i of m.itens) if (i.onde === "cao") { i.onde = "chao"; i.x = -150; }
  if (typeof m.forno !== "boolean") m.forno = true;
  if (typeof m.freezer !== "number") m.freezer = 2;
  return m;
}

function carregarFamilia() {
  const salvo = ler(GAVETA_FAMILIA) || {};
  const manuAntiga = ler("manu-personagem-v1"); // a Manu montada na versão anterior do jogo
  return {
    manu: fichaValida(salvo.manu || manuAntiga, PADRAO),
    vovo: fichaValida(salvo.vovo, PESSOAS.vovo.ficha),
    vovoo: fichaValida(salvo.vovoo, PESSOAS.vovoo.ficha),
  };
}

let mundo = carregarMundo();
let familia = carregarFamilia();
let timerSalvar;
function salvar() {
  clearTimeout(timerSalvar);
  timerSalvar = setTimeout(() => gravar(GAVETA_MUNDO, mundo), 300);
}

/* ---------- 2. Ajudantes do mundo ---------- */
const item = id => mundo.itens.find(i => i.id === id);
const itensEm = onde => mundo.itens.filter(i => i.onde === onde);
const naMao = quem => mundo.itens.find(i => i.onde === "mao:" + quem);
const VAGAS_BOLSA = 6;
const vagasDe = lugar => lugar === "bolsa" ? VAGAS_BOLSA : LUGARES[lugar].vagas;
function vagaLivre(lugar) {
  const usadas = new Set(itensEm(lugar).map(i => i.vaga));
  for (let v = 0; v < vagasDe(lugar); v++) if (!usadas.has(v)) return v;
  return -1;
}
function novoItem(tipo, onde, extra) {
  const i = { id: "i" + (mundo.proximo++), tipo, onde, ...extra };
  mundo.itens.push(i);
  return i;
}
// para onde cada coisa "deveria" ir
function lugarCerto(tipo) {
  const t = ITENS[tipo].tipo;
  if (t === "fruta") return vagaLivre("fruteira") >= 0 ? "fruteira" : "geladeira";
  if (t === "comida") return "geladeira";
  return "bau";
}
const combina = (tipo, lugar) => lugar === "bolsa" ||
  (lugar === "bau" ? ITENS[tipo].tipo === "brinquedo" : lugar === "fruteira" ? ITENS[tipo].tipo === "fruta" : ehComida(tipo));
const sinal = v => v > 0 ? 1 : v < 0 ? -1 : 0;
const limitar = (v, a, b) => Math.max(a, Math.min(b, v));
const esperar = ms => new Promise(r => setTimeout(r, ms));

/* ---------- 3. A tela ---------- */
const svg = document.getElementById("mundo");
const balao = document.getElementById("balao");
const cam = { x: 900, y: 0, vw: 1000, vh: 620, s: 1, rect: null };
const gente = {};

/* A cena 3D (casa, móveis, céu) fica num "canvas" atrás; a camada 2D (pessoas, bichos, coisas no chão) fica por cima */
const tela3d = document.getElementById("cena3d");
let tem3D = false;
try { iniciar3D(tela3d); tem3D = true; } catch (e) { console.warn("Sem 3D neste aparelho", e); }

function montarMundo() {
  svg.innerHTML = `<g id="g-bichos">${desenharBichos()}</g><g id="g-itens-chao"></g><g id="g-animais"></g><g id="g-pessoas"></g>`;
  svg.classList.toggle("e-noite", noite);
  if (tem3D) retratos3D(familia);
  criarCachorro();
  for (const id of ["vovoo", "vovo", "manu"]) criarPessoa(id);
  desenharTudo();
  medirTela();
}

function criarPessoa(id) {
  const ficha = familia[id];
  const anterior = gente[id];
  const p = anterior || { id, x: PESSOAS[id].casa, dir: 1, alvo: null, aoChegar: null, ocupado: false, ultimoOi: 0, emocao: "feliz" };
  p.velocidade = ficha.adulto ? 170 : 220;
  p.altura = (ficha.adulto ? (372 + ADULTO.alt) * ADULTO.escala : 372) * ESCALA_PESSOA;
  document.getElementById("g-pessoas").insertAdjacentHTML("beforeend", `
    <g class="pessoa" id="p-${id}" data-pessoa="${id}">
      <ellipse cx="0" cy="0" rx="${ficha.adulto ? 36 : 30}" ry="6" fill="url(#sombraChao)"/>
      <g class="vira"><g class="bob">${desenharAvatar(ficha, { sombra: false })}</g></g>
    </g>`);
  p.el = document.getElementById("p-" + id);
  p.elVira = p.el.querySelector(".vira");
  p.el.style.setProperty("--atraso", (-Math.random() * 5).toFixed(2) + "s"); // cada um pisca num tempo
  if (p.emocao && p.emocao !== "feliz") mostrarEmocao(p, p.emocao);
  gente[id] = p;
  posicionar(p);
}

function posicionar(p) {
  const k = p.escala || ESCALA_PESSOA;
  p.el.setAttribute("transform", `translate(${n1(p.x)} ${MUNDO.piso})`);
  p.elVira.setAttribute("transform", `scale(${p.dir * k} ${k})`);
}

/* O cachorro Caramelo: anda pelo quintal como as pessoas, mas no tamanho dele */
const cao = { id: "cao", x: -140, dir: 1, alvo: null, aoChegar: null, velocidade: 300, escala: 1, ocupado: false };
function criarCachorro() {
  document.getElementById("g-animais").innerHTML =
    `<g id="cao" class="cao" data-coisa="cachorro"><g class="vira-cao">${desenharCachorro()}</g></g>`;
  cao.el = document.getElementById("cao");
  cao.elVira = cao.el.querySelector(".vira-cao");
  posicionar(cao);
  desenharBocaCao();
}
function desenharBocaCao() {
  const bola = mundo.itens.find(i => i.onde === "cao");
  cao.el.querySelector(".boca-cao").innerHTML = bola ? `<g transform="translate(4 18) scale(.62)">${ITENS.bola.d()}</g>` : "";
}

function desenharTudo() {
  desenharChao();
  for (const l of Object.keys(LUGARES)) desenharLugar(l);
  for (const id of Object.keys(gente)) desenharMao(id);
  if (tem3D) arvore3D(mundo.arvore);
  document.getElementById("cenouras").innerHTML = desenharCenouras(mundo.horta);
  desenharForno();
  desenharBolsa();
  mostrarDica();
}

function desenharForno() {
  if (!tem3D) return;
  forno3D(mundo.forno);
  freezer3D(mundo.freezer);
}

function desenharChao(caiu) {
  document.getElementById("g-itens-chao").innerHTML = itensEm("chao").sort((a, b) => a.x - b.x).map(i =>
    `<g transform="translate(${n1(i.x)} 530)"><g class="${i.id === caiu ? "caindo" : ""}">${desenharItem(i.tipo, `data-item="${i.id}"`)}</g></g>`).join("");
}
function desenharLugar(l) {
  if (tem3D) conteudo3D(l, itensEm(l));
}
function desenharMao(quem) {
  const i = naMao(quem), alvo = gente[quem]?.el.querySelector(".mao");
  if (alvo) alvo.innerHTML = i ? `<g transform="translate(0 30) scale(1.45)">${ITENS[i.tipo].d()}</g>` : "";
}

/* Quando a Manu segura algo, o lugar certo dele brilha de leve (uma dica, sem pressa) */
function mostrarDica() {
  const i = naMao("manu");
  if (tem3D) dica3D(i ? lugarCerto(i.tipo) : null);
}

/* ---------- 4. Câmera ---------- */
function medirTela() {
  const r = svg.getBoundingClientRect();
  cam.rect = r;
  cam.s = Math.min(r.height / 620, r.width / 560);
  cam.vw = r.width / cam.s;
  cam.vh = r.height / cam.s;
  cam.y = (cam.vh > 800 ? 290 : 330) - cam.vh / 2; // em pé, mostra mais céu e o jardim
  cam.x = alvoDaCamera();
  aplicarCamera(true);
}
function alvoDaCamera() {
  const total = MUNDO.largura - MUNDO.inicio;
  if (cam.vw >= total) return MUNDO.inicio + (total - cam.vw) / 2;
  return limitar(gente.manu.x - cam.vw / 2, MUNDO.inicio - 60, MUNDO.largura + 60 - cam.vw);
}
/* Paralaxe: o que está longe anda menos, o que está perto anda mais */
function aplicarCamera(mudouTamanho) {
  svg.setAttribute("viewBox", `${n1(cam.x)} ${n1(cam.y)} ${n1(cam.vw)} ${n1(cam.vh)}`);
  // a câmera 3D copia o mesmo enquadramento (a perspectiva cuida da profundidade)
  if (tem3D) definirCamera3D(cam.x, cam.y, cam.vw, cam.vh, mudouTamanho ? cam.rect.width : 0, cam.rect.height);
}
const mundoX = clientX => cam.x + (clientX - cam.rect.left) / cam.s;
const telaXY = (x, y) => [cam.rect.left + (x - cam.x) * cam.s, cam.rect.top + (y - cam.y) * cam.s];

/* ---------- 5. Andar ---------- */
function irAte(p, x, aoChegar) {
  x = limitar(x, MUNDO.inicio + 60, MUNDO.largura - 60);
  if (Math.abs(x - p.x) < 6) { p.alvo = null; p.aoChegar = null; aoChegar && aoChegar(); return; }
  p.alvo = x;
  p.aoChegar = aoChegar || null;
}
function virarPara(p, x) {
  const d = sinal(x - p.x);
  if (d) { p.dir = d; posicionar(p); }
}
// fica do lado de uma coisa, sem ficar em cima dela
const ladoDe = (x, distancia) => x - sinal(x - gente.manu.x || 1) * distancia;

function mover(dt) {
  for (const p of [...Object.values(gente), cao]) {
    if (p.alvo === null) { p.el.classList.remove("andando"); continue; }
    const dx = p.alvo - p.x, passo = p.velocidade * dt;
    p.dir = sinal(dx) || p.dir;
    p.el.classList.add("andando");
    if (Math.abs(dx) <= passo) {
      p.x = p.alvo;
      p.alvo = null;
      p.el.classList.remove("andando");
      posicionar(p);
      const cb = p.aoChegar;
      p.aoChegar = null;
      cb && cb();
    } else {
      p.x += sinal(dx) * passo;
      posicionar(p);
      if (p.id === "manu") { p.andou = (p.andou || 0) + passo; if (p.andou > 34) { p.andou = 0; SONS.passo(); } }
    }
  }
}

/* ---------- Emoções ----------
   sentir(quem, emoção): o rosto muda por um tempinho e depois volta ao jeito de sempre.
   olhar(quem, x, y): as pupilas se viram para o ponto do mundo. */
function mostrarEmocao(p, emocao) {
  const alvo = p.el.querySelector(".expressao");
  if (!alvo) return;
  alvo.innerHTML = expressao({ ...PADRAO, ...familia[p.id] }, emocao);
  if (p.olhar) aplicarOlhar(p);
}
function sentir(id, emocao, ms = 2200) {
  const p = gente[id];
  if (!p) return;
  p.emocao = emocao;
  mostrarEmocao(p, emocao);
  clearTimeout(p.timerEmocao);
  p.timerEmocao = setTimeout(() => { p.emocao = "feliz"; mostrarEmocao(p, "feliz"); }, ms);
}
function olhar(id, x, y) {
  const p = gente[id];
  if (!p) return;
  const cabeca = MUNDO.piso - p.altura * .78;
  p.olhar = [limitar((x - p.x) * p.dir / 40, -2.6, 2.6), limitar((y - cabeca) / 50, -2.4, 2.6)];
  aplicarOlhar(p);
}
function aplicarOlhar(p) {
  const [dx, dy] = p.olhar;
  p.el.querySelectorAll(".pupila").forEach(g => { g.style.transform = `translate(${n1(dx)}px, ${n1(dy)}px)`; });
}

function animar(p, classe, ms) {
  p.el.classList.remove(classe);
  void p.el.getBoundingClientRect();
  p.el.classList.add(classe);
  setTimeout(() => p.el.classList.remove(classe), ms);
}
function animarEl(el, classe, ms) {
  if (!el) return;
  el.classList.remove(classe);
  void el.getBoundingClientRect();
  el.classList.add(classe);
  if (ms) setTimeout(() => el.classList.remove(classe), ms);
}

/* ---------- 6. Falar ---------- */
let falandoQuem = null, falouEm = 0, timerBalao;
async function dizer(quem, momento, ...extra) {
  const f = escolherFala(quem, momento, ...extra);
  if (!f) return;
  return dizerFala(quem, f);
}
let falaVez = 0;
function mostrarBalao(texto, quem, onde) {
  falandoQuem = onde || (quem === "narrador" ? "manu" : quem);
  falouEm = performance.now();
  balao.textContent = texto;
  balao.dataset.quem = quem;
  balao.classList.add("visivel");
  posicionarBalao();
  clearTimeout(timerBalao);
  timerBalao = setTimeout(() => balao.classList.remove("visivel"), Math.max(1800, texto.length * 90));
}
// devolve true se a fala chegou ao fim sem ser interrompida por outra
async function dizerFala(quem, f, onde) {
  pararSons();
  const minha = ++falaVez;
  mostrarBalao(f.texto, quem, onde);
  await falar({ ...f, voz: vozDe(quem) });
  return minha === falaVez;
}
// bicho não usa a voz do celular: toca o som dele e mostra o balão
function somDeBicho(som, texto, x, y) {
  SONS[som]();
  mostrarBalao(texto, "bicho", { x, y });
}
function posicionarBalao() {
  if (!balao.classList.contains("visivel")) return;
  const alvo = typeof falandoQuem === "object" ? falandoQuem
    : gente[falandoQuem] && { x: gente[falandoQuem].x, y: MUNDO.piso - gente[falandoQuem].altura - 8 };
  if (!alvo) return;
  const [x, y] = telaXY(alvo.x, alvo.y);
  balao.style.left = limitar(x, 90, innerWidth - 90) + "px";
  balao.style.top = Math.max(60, y) + "px";
}
const nomeBonito = tipo => ITENS[tipo].nome[0].toUpperCase() + ITENS[tipo].nome.slice(1) + "!";
const dizerNome = tipo => dizerFala("narrador", (FALAS.narrador.nomes && FALAS.narrador.nomes[tipo]) || { texto: nomeBonito(tipo) });

// quem da família está perto da Manu (para responder)
function quemEstaPerto(dist = 520) {
  let melhor = null, menor = dist;
  for (const id of ["vovo", "vovoo"]) {
    const d = Math.abs(gente[id].x - gente.manu.x);
    if (d < menor && !gente[id].ocupado) { menor = d; melhor = id; }
  }
  return melhor;
}

/* ---------- 7. Pegar, soltar e guardar ---------- */
let toqueAtual = 0; // cada toque novo cancela o que o anterior ainda ia fazer

function pegar(i, quem = "manu") {
  const anterior = naMao(quem);
  if (anterior && anterior !== i) {
    // troca: o que estava na mão vai para onde o novo estava
    if (i.onde === "chao") { anterior.onde = "chao"; anterior.x = i.x + 34; }
    else if (i.onde in LUGARES || i.onde === "bolsa") { anterior.onde = i.onde; anterior.vaga = i.vaga; }
    else { anterior.onde = "chao"; anterior.x = gente[quem].x; }
  }
  const veioDe = i.onde;
  SONS.pegar();
  i.onde = "mao:" + quem;
  delete i.x; delete i.vaga;
  desenharChao();
  if (veioDe in LUGARES) desenharLugar(veioDe);
  if (veioDe === "bolsa" || anterior?.onde === "bolsa") desenharBolsa();
  desenharMao(quem);
  mostrarDica();
  salvar();
}

function soltar(quem = "manu") {
  const i = naMao(quem);
  if (!i) return;
  const p = gente[quem];
  i.onde = "chao";
  i.x = limitar(p.x + p.dir * 38, MUNDO.inicio + 40, MUNDO.largura - 40);
  desenharChao(i.id);
  setTimeout(SONS.soltar, 420);
  sentir(quem, "surpresa", 900);
  olhar(quem, i.x, 520);
  desenharMao(quem);
  mostrarDica();
  salvar();
}

function guardar(i, lugar, quem = "manu") {
  const v = vagaLivre(lugar);
  if (v < 0) return false;
  i.onde = lugar;
  i.vaga = v;
  desenharMao(quem);
  if (lugar === "bolsa") desenharBolsa(); else desenharLugar(lugar);
  SONS.guardar();
  mostrarDica();
  salvar();
  return true;
}

function abrir(lugar) {
  if (lugar === "fruteira") return;
  abrirPor(lugar, 6000, lugar === "bau" ? SONS.tampa : SONS.porta);
}

/* Abre uma porta/tampa 3D por um tempo e fecha sozinha depois, com som nas duas vezes */
const timersAbertos = {};
function abrirPor(nome, ms, som) {
  if (!tem3D) return;
  if (!aberto3D(nome)) { som(); abrir3D(nome, true); }
  clearTimeout(timersAbertos[nome]);
  timersAbertos[nome] = setTimeout(() => { abrir3D(nome, false); som(); }, ms);
}
function alternar(nome, ms, som) {
  if (!tem3D) return false;
  if (aberto3D(nome)) { clearTimeout(timersAbertos[nome]); abrir3D(nome, false); som(); return false; }
  abrirPor(nome, ms, som);
  return true;
}

async function reagirAoGuardar(i, lugar) {
  const quem = quemEstaPerto() || "narrador";
  if (lugar === "fruteira" && ITENS[i.tipo].tipo === "fruta") {
    const n = itensEm("fruteira").filter(x => ITENS[x.tipo].tipo === "fruta").length;
    sentir("manu", "alegre");
    sentir("vovo", "alegre");
    return dizer("vovo", "conta", n);
  }
  if (!combina(i.tipo, lugar)) { sentir("manu", "rindo"); if (quem !== "narrador") sentir(quem, "rindo"); return dizer(quem, "engracado"); }
  sentir("manu", "alegre");
  if (quem !== "narrador") sentir(quem, "alegre");
  return dizer(quem, "guardou");
}

/* ---------- 8. O que acontece em cada toque ---------- */
function aoTocar(ev) {
  ev.preventDefault();
  if (!cam.rect) return;
  marcarToque(ev.clientX, ev.clientY);
  pop();
  const t = ev.target, x = mundoX(ev.clientX);
  const y = cam.y + (ev.clientY - cam.rect.top) / cam.s;
  const itemPerto = dist => itensEm("chao").map(i => [i, Math.abs(i.x - x)]).filter(([, d]) => d < dist).sort((a, b) => a[1] - b[1])[0]?.[0];
  const toque = ++toqueAtual;
  const valeAinda = () => toque === toqueAtual;

  // um toque perto do chão, nos pés de alguém, vale para o objeto que estiver ali
  const elPessoa = t.closest("[data-pessoa]");
  if (elPessoa && y > 445 && itemPerto(45)) return tocarItem(itemPerto(45), valeAinda);
  const do3D = () => tem3D ? tocar3D(ev.clientX, ev.clientY, cam.rect) : null;
  let el2d = t.closest("[data-item],[data-coisa]");
  if (elPessoa) {
    if (elPessoa.dataset.pessoa !== "manu" || naMao("manu")) return tocarPessoa(elPessoa.dataset.pessoa, valeAinda);
    // tocou na Manu de mãos vazias, mas tem algo atrás dela (o rádio, a janela...)? vale o que está atrás
    const atras = document.elementsFromPoint(ev.clientX, ev.clientY).find(e => !e.closest("[data-pessoa]") && e.closest("[data-item],[data-coisa]"));
    if (atras) el2d = atras.closest("[data-item],[data-coisa]");
    else {
      const t3 = do3D();
      if (t3 && t3.tipo !== "chao") return agirNo3D(t3, valeAinda);
      return tocarPessoa("manu", valeAinda);
    }
  }
  // primeiro o que está desenhado em 2D (bichos, coisas no chão, cenouras)...
  if (el2d?.dataset.item) return tocarItem(item(el2d.dataset.item), valeAinda);
  if (el2d?.dataset.coisa) return tocarCoisa(el2d.dataset.coisa, valeAinda, { el: el2d, alvo: t });
  if (y > 470) { const perto = itemPerto(60); if (perto) return tocarItem(perto, valeAinda); }
  // ...depois os objetos 3D (móveis, portas, roupas, o que tem dentro da geladeira)
  const t3 = do3D();
  if (t3 && t3.tipo !== "chao") return agirNo3D(t3, valeAinda);
  // tocou no chão (ou na parede): só anda até lá
  irAte(gente.manu, t3 ? t3.x : x);
}

function agirNo3D(t3, valeAinda) {
  if (t3.tipo === "item") return tocarItem(item(t3.valor), valeAinda);
  if (t3.tipo === "roupa") return vestir(t3.valor, valeAinda);
  if (t3.tipo === "lugar") return tocarLugar(t3.valor, valeAinda);
  if (t3.tipo === "coisa") return tocarCoisa(t3.valor, valeAinda, t3);
}

function tocarItem(i, valeAinda) {
  if (!i) return;
  const manu = gente.manu;
  if (i.onde === "mao:manu") return soltar();
  if (i.onde === "chao") {
    return irAte(manu, ladoDe(i.x, 30), () => {
      if (!valeAinda()) return;
      virarPara(manu, i.x);
      animar(manu, "agacha", 500);
      olhar("manu", i.x, 520);
      setTimeout(() => { pegar(i); dizerNome(i.tipo); sentir("manu", ITENS[i.tipo].tipo === "brinquedo" ? "rindo" : "alegre"); }, 220);
    });
  }
  if (i.onde in LUGARES) {
    const lugar = i.onde;
    return irAte(manu, LUGARES[lugar].x, () => {
      if (!valeAinda()) return;
      abrir(lugar);
      setTimeout(() => { pegar(i); dizerNome(i.tipo); sentir("manu", "alegre"); }, 350);
    });
  }
}

function tocarLugar(lugar, valeAinda) {
  const manu = gente.manu;
  irAte(manu, LUGARES[lugar].x, () => {
    if (!valeAinda()) return;
    virarPara(manu, LUGARES[lugar].x + (lugar === "geladeira" ? -100 : lugar === "bau" ? 100 : -100));
    abrir(lugar);
    const i = naMao("manu");
    if (!i) return;
    setTimeout(() => {
      if (guardar(i, lugar)) reagirAoGuardar(i, lugar);
      else dizer(quemEstaPerto() || "narrador", "cheio");
    }, 380);
  });
}

function tocarPessoa(id, valeAinda) {
  const manu = gente.manu;
  if (id === "manu") {
    if (naMao("manu")) return soltar();
    animar(manu, "pulinho", 650);
    sentir("manu", "rindo", 1500);
    return falarTexto("Hihi!", "crianca");
  }
  const p = gente[id];
  if (p.ocupado) return dizer(id, "oi");
  irAte(manu, ladoDe(p.x, 78), () => {
    if (!valeAinda()) return;
    virarPara(manu, p.x);
    virarPara(p, manu.x);
    const i = naMao("manu");
    if (i) return entregar(i, id);
    animar(manu, "abraco", 1300);
    animar(p, "abraco", 1300);
    sentir("manu", "carinho", 1800);
    sentir(id, "carinho", 1800);
    if (!noite) return dizer(id, "abraco");
    if (id === "vovo" && performance.now() - historiaEm > 90000) return contarHistoria();
    dizer(id, "boaNoite");
  });
}

/* Vestir uma roupa do guarda-roupa: a ficha da Manu muda e ela é desenhada de novo */
const CORES_DAS_ROUPAS = { vestido: "#f2b630", pijama: "#6aa8e8", fada: "#3fb3a5" };
function vestir(roupa, valeAinda) {
  const manu = gente.manu;
  irAte(manu, COISAS.armario + 110, () => {
    if (!valeAinda()) return;
    virarPara(manu, COISAS.armario);
    familia.manu = { ...familia.manu, roupa, corRoupa: CORES_DAS_ROUPAS[roupa] };
    gravar(GAVETA_FAMILIA, familia);
    manu.el.remove();
    criarPessoa("manu");
    desenharMao("manu");
    SONS.brilho();
    brilhinhos(manu.x, MUNDO.piso - manu.altura / 2);
    animar(manu, "pulinho", 650);
    sentir("manu", "alegre", 2600);
    if (noite && roupa === "pijama") dizer("vovo", "pijama");
    else dizer("narrador", "roupa");
  });
}
function brilhinhos(x, y) {
  const g = document.getElementById("g-pessoas");
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * Math.PI * 2;
    g.insertAdjacentHTML("beforeend", `<polygon class="brilhinho" style="transform-box:fill-box;transform-origin:center"
      points="${pontosEstrela(n1(x + Math.cos(a) * 70), n1(y + Math.sin(a) * 90), 9)}" fill="#fff6c8"/>`);
  }
  setTimeout(() => g.querySelectorAll(".brilhinho").forEach(e => e.remove()), 950);
}

/* De noite, a vovó conta uma historinha curta (uma frase de cada vez) */
let historiaEm = -1e9;
async function contarHistoria() {
  historiaEm = performance.now();
  const historias = FALAS.vovo.historias;
  const h = historias[Math.floor(Math.random() * historias.length)];
  for (const frase of h) {
    const f = typeof frase === "string" ? { texto: frase } : frase;
    sentir("vovo", "carinho", 4000);
    sentir("manu", "curiosa", 4000);
    if (!(await dizerFala("vovo", f))) return; // parou se alguém tocou em outra coisa
    await esperar(450);
  }
}

/* A vovó (ou o vovô) recebe, comenta e leva até o lugar certo, mostrando como se faz */
async function entregar(i, quem) {
  const p = gente[quem];
  p.ocupado = true;
  i.onde = "mao:" + quem;
  desenharMao("manu");
  desenharMao(quem);
  mostrarDica();
  salvar();
  sentir(quem, "alegre", 2500);
  sentir("manu", "carinho");
  await dizer(quem, ITENS[i.tipo].tipo);
  await esperar(300);
  const destino = lugarCerto(i.tipo);
  await new Promise(r => irAte(p, LUGARES[destino].x + (quem === "vovo" ? 0 : 30), r));
  virarPara(p, LUGARES[destino].x - 100);
  abrir(destino);
  await esperar(400);
  if (guardar(i, destino, quem)) {
    if (destino === "fruteira") await dizer("vovo", "conta", itensEm("fruteira").filter(x => ITENS[x.tipo].tipo === "fruta").length);
    else await dizer(quem, "guardou");
  } else {
    soltar(quem);
    await dizer(quem, "cheio");
  }
  await esperar(600);
  await new Promise(r => irAte(p, PESSOAS[quem].casa, r));
  p.ocupado = false;
  virarPara(p, gente.manu.x);
}

/* info: de onde veio o toque. Num bicho 2D, traz o elemento (info.el);
   num objeto 3D, traz detalhes como qual janela (info.qual) ou quem está no retrato (info.quem). */
function tocarCoisa(nome, valeAinda, info = {}) {
  const manu = gente.manu;
  const el2d = info.el || svg.querySelector(`[data-coisa="${nome}"]`);
  const chegar = (x, fazer) => irAte(manu, x, () => { if (valeAinda()) fazer(); });

  switch (nome) {
    case "arvore":
      return chegar(COISAS.arvore, () => {
        virarPara(manu, 262);
        if (tem3D) sacudirArvore3D();
        SONS.vento();
        olhar("manu", 262, 240);
        sentir("manu", "curiosa", 900);
        if (mundo.arvore <= 0) return dizer(quemEstaPerto() || "narrador", quemEstaPerto() ? "fruta" : "planta");
        mundo.arvore--;
        const caiu = novoItem("manga", "chao", { x: 190 + Math.random() * 130 });
        setTimeout(() => {
          if (tem3D) arvore3D(mundo.arvore);
          desenharChao(caiu.id);
          SONS.cair();
          sentir("manu", "surpresa", 1200);
          olhar("manu", caiu.x, 520);
          dizerNome("manga");
          salvar();
        }, 450);
      });

    case "horta": {
      const elVaga = info.alvo?.closest?.("[data-vaga]");
      let v = elVaga ? +elVaga.dataset.vaga : mundo.horta.indexOf(true);
      const x = v >= 0 ? CENOURAS_HORTA[v] : COISAS.horta;
      return chegar(ladoDe(x, 34), () => {
        virarPara(manu, x);
        if (v < 0 || !mundo.horta[v]) return dizer("vovoo", "horta");
        animar(manu, "agacha", 600);
        mundo.horta[v] = false;
        document.getElementById("cenouras").innerHTML = desenharCenouras(mundo.horta);
        const c = novoItem("cenoura", "chao", { x });
        pegar(c);
        dizerNome("cenoura");
      });
    }

    case "galinha":
      return chegar(COISAS.galinha, () => {
        virarPara(manu, 880);
        animarEl(el2d, "cacareja", 700);
        if (noite) return mudarCeu(false); // de noite, a galinha canta e amanhece
        somDeBicho("cocoro", "Có, có, có!", 880, 410);
        sentir("manu", "surpresa", 1400);
        const ovosNoQuintal = itensEm("chao").filter(i => i.tipo === "ovo" && i.x < 1000).length;
        if (ovosNoQuintal < 2) {
          const ovo = novoItem("ovo", "chao", { x: 836 - ovosNoQuintal * 30 });
          setTimeout(() => { desenharChao(ovo.id); setTimeout(SONS.soltar, 450); salvar(); }, 500);
        }
      });

    case "quadro": {
      const quem = info.quem || "manu";
      return chegar(COISAS.quadro + (quem === "manu" ? -94 : quem === "vovoo" ? 94 : 0), () => {
        animar(manu, "pulinho", 650);
        olhar("manu", manu.x, 230);
        dizer(quem === "manu" ? "narrador" : quem, "retrato");
      });
    }

    case "radio":
      return chegar(COISAS.radio, () => {
        const ligar = !radioLigado;
        SONS.clique();
        tocarRadio(ligar, noite);
        if (tem3D) radio3D(ligar);
        if (ligar) { dizer("vovoo", "radio"); sentir("manu", "alegre", 3000); }
      });

    case "gato":
      return chegar(ladoDe(1700, 80), () => {
        virarPara(manu, 1700);
        animarEl(el2d, "acordado", 2600);
        somDeBicho("miau", "Miau!", 1680, 450);
        sentir("manu", "alegre");
        setTimeout(SONS.ronrom, 900);
      });

    case "filtro":
      return chegar(COISAS.filtro + 40, () => {
        virarPara(manu, COISAS.filtro);
        if (tem3D) { gota3D(); setTimeout(gota3D, 1200); }
        SONS.gota(); setTimeout(SONS.gota, 1200);
        dizer("vovo", "agua");
      });

    case "pia":
      return chegar(COISAS.pia, () => {
        if (tem3D) agua3D(1800);
        SONS.agua(1.6);
        olhar("manu", COISAS.pia, 420);
        const i = naMao("manu");
        if (i && ehComida(i.tipo)) setTimeout(() => dizer("narrador", "lavou"), 900);
        else if (quemEstaPerto()) dizer("vovo", "lavar");
      });

    case "fogao":
      return chegar(COISAS.fogao - 70, () => {
        virarPara(manu, COISAS.fogao);
        if (tem3D) vapor3D();
        SONS.panela();
        sentir("manu", "atenta", 2000);
        sentir("vovo", "atenta", 2000);
        dizer("vovo", "quente");
      });

    case "cama":
      return chegar(COISAS.cama, () => mudarCeu(!noite)); // a cama faz a noite chegar (e acordar)

    case "abajur":
      return chegar(COISAS.abajur - 60, () => {
        abajurAceso = !abajurAceso;
        if (tem3D) abajur3D(abajurAceso);
        SONS.clique();
        dizerFala("narrador", { texto: FALAS.narrador.abajur[abajurAceso ? 0 : 1] });
      });

    case "janela": {
      const cx = info.x || manu.x;
      return chegar(cx, () => {
        const aberta = alternar("janela-" + info.qual, 20000, SONS.janela);
        olhar("manu", cx, 250);
        if (aberta) { SONS.vento(); setTimeout(SONS.piu, 700); sentir("manu", "alegre"); dizer("narrador", "janela"); }
      });
    }

    case "freezer":
      return chegar(LUGARES.geladeira.x, () => {
        abrirPor("freezer", 5000, SONS.porta);
        olhar("manu", 2190, 260);
        if (mundo.freezer <= 0) return sentir("manu", "curiosa");
        setTimeout(() => {
          mundo.freezer--;
          desenharForno();
          pegar(novoItem("picole", "chao", { x: 2300 }));
          dizerNome("picole");
          sentir("manu", "surpresa", 900);
          setTimeout(() => { sentir("manu", "alegre"); dizer("vovo", "picole"); }, 1200);
        }, 550);
      });

    case "forno":
      return chegar(COISAS.fogao - 70, () => {
        virarPara(manu, COISAS.fogao);
        const aberto = alternar("forno", 6000, SONS.forno);
        olhar("manu", COISAS.fogao, 460);
        if (!aberto) return;
        sentir("manu", "surpresa", 1200);
        if (!mundo.forno) return dizer("vovo", "quente");
        setTimeout(() => {
          mundo.forno = false;
          desenharForno();
          pegar(novoItem("bolo", "chao", { x: COISAS.fogao }));
          sentir("manu", "alegre", 2400);
          sentir("vovo", "alegre", 2400);
          dizer("vovo", "bolo");
        }, 750);
      });

    case "armarioPia":
      return chegar(COISAS.armarioPia, () => {
        const aberta = alternar("pia", 6000, SONS.porta);
        olhar("manu", COISAS.armarioPia, 470);
        if (!aberta) return;
        sentir("manu", "curiosa");
        dizer("narrador", "panelas");
      });

    case "armario":
      return chegar(COISAS.armario + 110, () => {
        virarPara(manu, COISAS.armario);
        const aberto = alternar("armario", 14000, SONS.rangido);
        olhar("manu", COISAS.armario, 330);
        if (!aberto) return;
        sentir("manu", "curiosa", 2500);
        dizer("narrador", "armario");
      });

    case "cachorro":
      return chegar(ladoDe(cao.x, 95), () => {
        virarPara(manu, cao.x);
        if (cao.alvo === null) virarPara(cao, manu.x);
        const i = naMao("manu");
        if (i && i.tipo === "bola" && !cao.ocupado) return brincarDeBuscar(i);
        animarEl(cao.el, "feliz", 1200);
        somDeBicho("auau", "Au, au!", cao.x, 420);
        sentir("manu", "rindo");
      });

    case "pato":
      return chegar(COISAS.pato + 150, () => {
        virarPara(manu, COISAS.pato);
        animarEl(svg.querySelector('[data-coisa="pato"]'), "nadando", 4000);
        somDeBicho("quem", "Quém, quém!", -440, 440);
        sentir("manu", "rindo");
      });

    case "passaros":
      return chegar(COISAS.passaros + 90, () => {
        virarPara(manu, COISAS.passaros);
        animarEl(el2d, "voando", 4200);
        somDeBicho("piu", "Piu, piu!", -40, 360);
        sentir("manu", "curiosa", 3000);
        olhar("manu", -40, 200);
        setTimeout(SONS.piu, 2400);
      });

    case "coruja":
      return chegar(COISAS.coruja + 90, () => {
        virarPara(manu, COISAS.coruja);
        animarEl(el2d, "pisca", 900);
        somDeBicho("uhuh", "Uh, uh!", 300, 222);
        sentir("manu", "surpresa");
        olhar("manu", 300, 240);
      });

    default:
      return chegar(COISAS[nome] || manu.x, () => dizer("narrador", nome));
  }
}
let abajurAceso = false;

/* O Caramelo busca a bola: a Manu joga, ele corre, pega e traz de volta */
async function brincarDeBuscar(bola) {
  const manu = gente.manu;
  cao.ocupado = true;
  const lado = manu.x - 330 > MUNDO.inicio + 80 ? -1 : 1;
  const longe = limitar(manu.x + lado * 330, MUNDO.inicio + 80, 940);
  animar(manu, "pulinho", 650);
  bola.onde = "chao";
  bola.x = longe;
  desenharMao("manu");
  desenharChao(bola.id);
  mostrarDica();
  SONS.cair();
  dizer("narrador", "caoBusca");
  await esperar(350);
  SONS.auau();
  await new Promise(r => irAte(cao, longe, r));
  bola.onde = "cao";
  delete bola.x;
  desenharChao();
  desenharBocaCao();
  SONS.pegar();
  await esperar(250);
  await new Promise(r => irAte(cao, limitar(manu.x - lado * -70, MUNDO.inicio + 60, 960), r));
  virarPara(cao, manu.x);
  bola.onde = "chao";
  bola.x = limitar(cao.x + cao.dir * 34, MUNDO.inicio + 40, 980);
  desenharBocaCao();
  desenharChao();
  SONS.soltar();
  animarEl(cao.el, "feliz", 1200);
  somDeBicho("auau", "Au, au!", cao.x, 420);
  sentir("manu", "rindo", 2500);
  await esperar(900);
  dizer("narrador", "caoVolta");
  cao.ocupado = false;
  salvar();
}

/* ---------- Dia e noite ----------
   De noite: o céu escurece devagar, aparecem a lua, as estrelas e a coruja,
   os grilos cantam baixinho e a família dá boa-noite. */
let noite = false, vezDoCeu = 0;
async function mudarCeu(paraNoite) {
  if (paraNoite === noite) return;
  noite = paraNoite;
  const vez = ++vezDoCeu, ainda = () => vez === vezDoCeu;
  svg.classList.toggle("e-noite", noite);
  document.getElementById("ceu").dataset.noite = noite ? "sim" : "";
  abajurAceso = noite;
  if (tem3D) noite3D(noite);
  grilos(noite);
  if (radioLigado) tocarRadio(true, noite);
  for (const id of Object.keys(gente)) sentir(id, noite ? "sono" : "alegre", 2600);
  if (noite) {
    SONS.bocejo(1.4);
    if ((await dizer("narrador", "noite")) === false || !ainda()) return;
    await esperar(400);
    if ((await dizer("vovo", "noite")) === false || !ainda()) return;
    await esperar(400);
    await dizer("vovoo", "noite");
    await esperar(1200);
    if (ainda() && noite) somDeBicho("uhuh", "Uh, uh!", 300, 222);
  } else {
    somDeBicho("cocorico", "Cocoricó!", 880, 410);
    await esperar(1500);
    if (!ainda()) return;
    if ((await dizer("vovo", "bomDia")) === false || !ainda()) return;
    await esperar(400);
    await dizer("vovoo", "bomDia");
  }
}
// de noite, alguém boceja de vez em quando
setInterval(() => {
  if (!noite || !inicio.hidden) return;
  const ids = Object.keys(gente), id = ids[Math.floor(Math.random() * ids.length)];
  sentir(id, "sono", 2200);
  SONS.bocejo(id === "manu" ? 1.4 : id === "vovo" ? 1.1 : .8);
}, 15000);
// de noite, a coruja canta sozinha de vez em quando
setInterval(() => { if (noite && inicio.hidden && performance.now() - falouEm > 6000) SONS.uhuh(); }, 26000);

/* ---------- Tela cheia e trava ----------
   1. O botão põe o jogo em tela cheia (some a barra do navegador).
   2. Se a criança sair da tela cheia sem querer, o próximo toque na casa volta para ela.
   3. O botão "voltar" do celular não tira ninguém da casa.
   No iPhone a tela cheia não existe para páginas: lá, use "Acesso Guiado". */
const botaoTela = document.getElementById("telacheia");
const raiz = document.documentElement;
const podeTelaCheia = !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
const emTelaCheia = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
let querTelaCheia = false;
async function entrarTelaCheia() {
  querTelaCheia = true;
  try { await (raiz.requestFullscreen ? raiz.requestFullscreen({ navigationUI: "hide" }) : raiz.webkitRequestFullscreen?.()); } catch (e) {}
  try { await screen.orientation?.lock?.("landscape"); } catch (e) {}
  atualizarBotaoTela();
}
function atualizarBotaoTela() {
  botaoTela.hidden = !podeTelaCheia || emTelaCheia() || !inicio.hidden;
}
botaoTela.addEventListener("click", entrarTelaCheia);
document.addEventListener("fullscreenchange", atualizarBotaoTela);
document.addEventListener("webkitfullscreenchange", atualizarBotaoTela);
svg.addEventListener("pointerup", () => { if (querTelaCheia && podeTelaCheia && !emTelaCheia()) entrarTelaCheia(); });

function prenderVoltarDoCelular() { try { history.pushState({ casa: true }, ""); } catch (e) {} }
addEventListener("popstate", () => { if (inicio.hidden) prenderVoltarDoCelular(); });

document.getElementById("ceu").addEventListener("click", () => { SONS.clique(); mudarCeu(!noite); });

/* ---------- 9. A bolsinha (guarda coisas para levar pela casa) ---------- */
const botaoBolsa = document.getElementById("bolsa");
const bandeja = document.getElementById("bandeja");

function desenharBolsa() {
  const dentro = itensEm("bolsa");
  botaoBolsa.dataset.qtd = dentro.length || "";
  bandeja.innerHTML = Array.from({ length: VAGAS_BOLSA }, (_, v) => {
    const i = dentro.find(x => x.vaga === v);
    return i ? `<button type="button" class="vaga" data-item="${i.id}" aria-label="${ITENS[i.tipo].nome}">
        <svg viewBox="-34 -68 68 72" aria-hidden="true">${ITENS[i.tipo].d()}</svg></button>`
      : `<span class="vaga vazia" aria-hidden="true"></span>`;
  }).join("");
}

botaoBolsa.addEventListener("click", () => {
  pop();
  const i = naMao("manu");
  if (i) {
    if (guardar(i, "bolsa")) { SONS.ziper(); dizer("narrador", "bolsa"); animarEl(botaoBolsa, "recebeu", 600); }
    else dizer("narrador", "cheio");
    return;
  }
  SONS.ziper();
  bandeja.hidden = !bandeja.hidden;
});
bandeja.addEventListener("click", e => {
  const b = e.target.closest("[data-item]");
  if (!b) return;
  const i = item(b.dataset.item);
  pegar(i);
  dizerNome(i.tipo);
  desenharBolsa();
  bandeja.hidden = true;
});

/* ---------- 10. O relógio do jogo ---------- */
let antes = performance.now();
function relogio(agora) {
  const dt = Math.min(.12, (agora - antes) / 1000); // em aparelho lento, os passos ficam maiores (não em câmera lenta)
  antes = agora;
  if (!document.getElementById("inicio").hidden) { requestAnimationFrame(relogio); return; }
  mover(dt);

  // câmera acompanha a Manu, devagar
  const alvo = alvoDaCamera();
  if (Math.abs(alvo - cam.x) > .3) { cam.x += (alvo - cam.x) * (1 - Math.exp(-dt * 3)); aplicarCamera(); }
  posicionarBalao();

  const manu = gente.manu;
  // a porta da frente abre quando alguém (ou o Caramelo) passa por ela
  const perto = [...Object.values(gente), cao].some(p => Math.abs(p.x - 1000) < 120);
  if (tem3D && perto !== aberto3D("porta")) { porta3D(perto); SONS.rangido(); }

  // de vez em quando, todos olham: a família para a Manu, a Manu para onde vai
  if (agora - (relogio.ultimoOlhar || 0) > 350) {
    relogio.ultimoOlhar = agora;
    for (const id of ["vovo", "vovoo"]) olhar(id, manu.x, MUNDO.piso - manu.altura * .8);
    if (manu.alvo !== null) olhar("manu", manu.alvo, 500);
    // com o rádio ligado, quem está na sala dança
    for (const p of Object.values(gente)) {
      const dancar = radioLigado && p.x > 1000 && p.x < 2000 && p.alvo === null && !p.ocupado;
      p.el.classList.toggle("dancando", dancar);
    }
  }

  // a família cumprimenta quando a Manu chega perto (e olha para ela)
  for (const id of ["vovo", "vovoo"]) {
    const p = gente[id];
    if (p.ocupado || p.alvo !== null) continue;
    const d = Math.abs(p.x - manu.x);
    if (d < 700 && sinal(manu.x - p.x) !== p.dir && sinal(manu.x - p.x)) virarPara(p, manu.x);
    if (d < 300 && agora - p.ultimoOi > 60000 && agora - falouEm > 3000 && manu.alvo === null) {
      p.ultimoOi = agora;
      animar(p, "acenando", 1700);
      sentir(id, "alegre", 2400);
      sentir("manu", "alegre", 2400);
      dizer(id, noite ? "noite" : "oi");
    }
  }
  if (tem3D) desenhar3D(agora);
  requestAnimationFrame(relogio);
}

// a árvore e a horta voltam a dar frutos com o tempo
setInterval(() => {
  let mudou = false;
  if (mundo.arvore < FRUTAS_ARVORE.length) { mundo.arvore++; mudou = true; }
  const v = mundo.horta.indexOf(false);
  if (v >= 0) { mundo.horta[v] = true; mudou = true; }
  if (!mundo.forno) { mundo.forno = true; mudou = true; }
  if (mundo.freezer < 2) { mundo.freezer++; mudou = true; }
  if (mudou) {
    desenharForno();
    if (tem3D) arvore3D(mundo.arvore);
    document.getElementById("cenouras").innerHTML = desenharCenouras(mundo.horta);
    salvar();
  }
}, 45000);

/* Um círculo suave mostra onde o dedo tocou (sem confete: o jogo é calmo) */
function marcarToque(x, y) {
  const d = document.createElement("div");
  d.className = "toque";
  d.style.left = x + "px";
  d.style.top = y + "px";
  document.body.appendChild(d);
  setTimeout(() => d.remove(), 700);
}

/* ---------- 11. Telas: início, família e casa ---------- */
const inicio = document.getElementById("inicio");
const voltar = document.getElementById("voltar");

function desenharFamilia() {
  document.getElementById("familia").innerHTML = ["manu", "vovo", "vovoo"].map(id => `
    <button type="button" class="membro" data-quem="${id}" aria-label="Mudar o jeito de ${PESSOAS[id].nome}">
      <svg viewBox="${recorteDe("inteira", familia[id])}" aria-hidden="true">${desenharAvatar(familia[id])}</svg>
      <span class="nome">${PESSOAS[id].nome}</span>
      <span class="lapis" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg></span>
    </button>`).join("");
}

document.getElementById("familia").addEventListener("click", async e => {
  const b = e.target.closest(".membro");
  if (!b) return;
  await destravarSom();
  plim();
  const id = b.dataset.quem;
  inicio.hidden = true;
  Editor.abrir(familia[id], (ficha, salvou) => {
    if (salvou) {
      familia[id] = ficha;
      gravar(GAVETA_FAMILIA, familia);
      montarMundo();
    }
    inicio.hidden = false;
    desenharFamilia();
  }, `Montar ${id === "manu" ? "a Manu" : id === "vovo" ? "a Vovó" : "o Vovô"}`);
});

document.getElementById("entrar").addEventListener("click", async () => {
  falarTexto("Vamos para a casa da vovó!", "mae"); // falar logo no toque destrava a voz no iPhone
  await destravarSom();
  if (podeTelaCheia) await entrarTelaCheia();
  try { await navigator.wakeLock?.request("screen"); } catch (e) {}
  prenderVoltarDoCelular();
  inicio.hidden = true;
  voltar.hidden = false;
  botaoBolsa.hidden = false;
  document.getElementById("ceu").hidden = false;
  atualizarBotaoTela();
  requestAnimationFrame(() => { medirTela(); sininho(); });
  if (noite) grilos(true);
});

function irParaInicio() {
  pararSons();
  tocarRadio(false);
  if (tem3D) radio3D(false);
  grilos(false);
  querTelaCheia = false;
  voltar.hidden = true;
  botaoBolsa.hidden = true;
  bandeja.hidden = true;
  document.getElementById("ceu").hidden = true;
  inicio.hidden = false;
  atualizarBotaoTela();
  desenharFamilia();
}

/* O botão de voltar precisa ser SEGURADO por 1 segundo,
   para um toque sem querer da criança não tirar ela da casa. */
let timerVoltar;
voltar.addEventListener("pointerdown", e => {
  e.preventDefault();
  voltar.classList.add("segurando");
  timerVoltar = setTimeout(() => { voltar.classList.remove("segurando"); irParaInicio(); }, 1000);
});
for (const ev of ["pointerup", "pointerleave", "pointercancel"]) {
  voltar.addEventListener(ev, () => { clearTimeout(timerVoltar); voltar.classList.remove("segurando"); });
}
voltar.addEventListener("contextmenu", e => e.preventDefault());

svg.addEventListener("pointerdown", aoTocar);
svg.addEventListener("contextmenu", e => e.preventDefault());
addEventListener("resize", () => medirTela());
document.addEventListener("visibilitychange", () => {
  if (document.hidden) { pararSons(); tocarRadio(false); grilos(false); if (tem3D) radio3D(false); }
  else if (noite && inicio.hidden) grilos(true);
});

Editor.iniciar();
montarMundo();
desenharFamilia();
requestAnimationFrame(relogio);
