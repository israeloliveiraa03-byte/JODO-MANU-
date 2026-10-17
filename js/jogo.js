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
  return { itens, proximo: n + 1, arvore: 3, horta: [true, true, true] };
}

function carregarMundo() {
  const m = ler(GAVETA_MUNDO);
  if (!m || !Array.isArray(m.itens)) return mundoInicial();
  m.itens = m.itens.filter(i => ITENS[i.tipo]);
  // se a vovó estava levando algo quando o jogo fechou, a coisa fica no chão perto dela
  for (const i of m.itens) if (i.onde.startsWith("mao:") && i.onde !== "mao:manu") { const quem = i.onde.slice(4); i.onde = "chao"; i.x = PESSOAS[quem]?.casa || 1300; }
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

function montarMundo() {
  svg.innerHTML = `<g id="g-casa">${desenharCasa(familia)}</g><g id="g-itens-chao"></g><g id="g-pessoas"></g>`;
  for (const id of ["vovoo", "vovo", "manu"]) criarPessoa(id);
  desenharTudo();
  medirTela();
}

function criarPessoa(id) {
  const ficha = familia[id];
  const anterior = gente[id];
  const p = anterior || { id, x: PESSOAS[id].casa, dir: 1, alvo: null, aoChegar: null, ocupado: false, ultimoOi: 0 };
  p.velocidade = ficha.adulto ? 170 : 220;
  p.altura = (ficha.adulto ? (372 + ADULTO.alt) * ADULTO.escala : 372) * ESCALA_PESSOA;
  document.getElementById("g-pessoas").insertAdjacentHTML("beforeend", `
    <g class="pessoa" id="p-${id}" data-pessoa="${id}">
      <ellipse cx="0" cy="0" rx="${ficha.adulto ? 36 : 30}" ry="6" fill="url(#sombraChao)"/>
      <g class="vira"><g class="bob">${desenharAvatar(ficha, { sombra: false })}</g></g>
    </g>`);
  p.el = document.getElementById("p-" + id);
  p.elVira = p.el.querySelector(".vira");
  gente[id] = p;
  posicionar(p);
}

function posicionar(p) {
  p.el.setAttribute("transform", `translate(${n1(p.x)} ${MUNDO.piso})`);
  p.elVira.setAttribute("transform", `scale(${p.dir * ESCALA_PESSOA} ${ESCALA_PESSOA})`);
}

function desenharTudo() {
  desenharChao();
  for (const l of Object.keys(LUGARES)) desenharLugar(l);
  for (const id of Object.keys(gente)) desenharMao(id);
  document.getElementById("frutas-arvore").innerHTML = desenharFrutasArvore(mundo.arvore);
  document.getElementById("cenouras").innerHTML = desenharCenouras(mundo.horta);
  desenharBolsa();
  mostrarDica();
}

function desenharChao(caiu) {
  document.getElementById("g-itens-chao").innerHTML = itensEm("chao").sort((a, b) => a.x - b.x).map(i =>
    `<g transform="translate(${n1(i.x)} 530)"><g class="${i.id === caiu ? "caindo" : ""}">${desenharItem(i.tipo, `data-item="${i.id}"`)}</g></g>`).join("");
}
function desenharLugar(l) {
  document.getElementById("dentro-" + l).innerHTML = desenharDentro(l, itensEm(l));
}
function desenharMao(quem) {
  const i = naMao(quem), alvo = gente[quem]?.el.querySelector(".mao");
  if (alvo) alvo.innerHTML = i ? `<g transform="translate(0 30) scale(1.45)">${ITENS[i.tipo].d()}</g>` : "";
}

/* Quando a Manu segura algo, o lugar certo dele brilha de leve (uma dica, sem pressa) */
function mostrarDica() {
  document.querySelectorAll(".dica").forEach(e => e.classList.remove("dica"));
  const i = naMao("manu");
  if (i) document.getElementById(lugarCerto(i.tipo))?.classList.add("dica");
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
  aplicarCamera();
}
function alvoDaCamera() {
  if (cam.vw >= MUNDO.largura) return (MUNDO.largura - cam.vw) / 2;
  return limitar(gente.manu.x - cam.vw / 2, -60, MUNDO.largura + 60 - cam.vw);
}
function aplicarCamera() {
  svg.setAttribute("viewBox", `${n1(cam.x)} ${n1(cam.y)} ${n1(cam.vw)} ${n1(cam.vh)}`);
}
const mundoX = clientX => cam.x + (clientX - cam.rect.left) / cam.s;
const telaXY = (x, y) => [cam.rect.left + (x - cam.x) * cam.s, cam.rect.top + (y - cam.y) * cam.s];

/* ---------- 5. Andar ---------- */
function irAte(p, x, aoChegar) {
  x = limitar(x, 60, MUNDO.largura - 60);
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
  for (const p of Object.values(gente)) {
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
    }
  }
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
async function dizerFala(quem, f) {
  pararSons();
  falandoQuem = quem === "narrador" ? "manu" : quem;
  falouEm = performance.now();
  balao.textContent = f.texto;
  balao.dataset.quem = quem;
  balao.classList.add("visivel");
  posicionarBalao();
  clearTimeout(timerBalao);
  timerBalao = setTimeout(() => balao.classList.remove("visivel"), Math.max(1800, f.texto.length * 90));
  await falar({ ...f, voz: vozDe(quem) });
}
function posicionarBalao() {
  if (!balao.classList.contains("visivel") || !gente[falandoQuem]) return;
  const p = gente[falandoQuem];
  const [x, y] = telaXY(p.x, MUNDO.piso - p.altura - 8);
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
  i.x = limitar(p.x + p.dir * 38, 40, MUNDO.largura - 40);
  desenharChao(i.id);
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
  guardado();
  mostrarDica();
  salvar();
  return true;
}

function abrir(lugar) {
  const el = document.getElementById(lugar);
  if (!el) return;
  el.classList.add(lugar === "bau" ? "aberto" : "aberta");
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove("aberto", "aberta"), 6000);
}

async function reagirAoGuardar(i, lugar) {
  const quem = quemEstaPerto() || "narrador";
  if (lugar === "fruteira" && ITENS[i.tipo].tipo === "fruta") {
    const n = itensEm("fruteira").filter(x => ITENS[x.tipo].tipo === "fruta").length;
    return dizer("vovo", "conta", n);
  }
  if (!combina(i.tipo, lugar)) return dizer(quem, "engracado");
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
  if (elPessoa) return tocarPessoa(elPessoa.dataset.pessoa, valeAinda);
  const elItem = t.closest("[data-item]");
  if (elItem) return tocarItem(item(elItem.dataset.item), valeAinda);
  const elLugar = t.closest("[data-lugar]");
  if (elLugar) return tocarLugar(elLugar.dataset.lugar, valeAinda);
  const elCoisa = t.closest("[data-coisa]");
  if (elCoisa) return tocarCoisa(elCoisa.dataset.coisa, t, valeAinda);

  // tocou no chão: se tiver alguma coisa pertinho, pega; senão, só anda
  const perto = itemPerto(60);
  if (perto) return tocarItem(perto, valeAinda);
  irAte(gente.manu, x);
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
      setTimeout(() => { pegar(i); dizerNome(i.tipo); }, 220);
    });
  }
  if (i.onde in LUGARES) {
    const lugar = i.onde;
    return irAte(manu, LUGARES[lugar].x, () => {
      if (!valeAinda()) return;
      abrir(lugar);
      setTimeout(() => { pegar(i); dizerNome(i.tipo); }, 350);
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
    dizer(id, "abraco");
  });
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

function tocarCoisa(nome, alvo, valeAinda) {
  const manu = gente.manu;
  const el = alvo.closest("[data-coisa]");
  const chegar = (x, fazer) => irAte(manu, x, () => { if (valeAinda()) fazer(); });

  switch (nome) {
    case "arvore":
      return chegar(COISAS.arvore, () => {
        virarPara(manu, 262);
        animarEl(el, "sacode", 1000);
        if (mundo.arvore <= 0) return dizer(quemEstaPerto() || "narrador", quemEstaPerto() ? "fruta" : "planta");
        mundo.arvore--;
        const caiu = novoItem("manga", "chao", { x: 190 + Math.random() * 130 });
        setTimeout(() => {
          document.getElementById("frutas-arvore").innerHTML = desenharFrutasArvore(mundo.arvore);
          desenharChao(caiu.id);
          dizerNome("manga");
          salvar();
        }, 450);
      });

    case "horta": {
      const elVaga = alvo.closest("[data-vaga]");
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
        animarEl(el, "cacareja", 700);
        dizer("narrador", "galinha");
        const ovosNoQuintal = itensEm("chao").filter(i => i.tipo === "ovo" && i.x < 1000).length;
        if (ovosNoQuintal < 2) {
          const ovo = novoItem("ovo", "chao", { x: 836 - ovosNoQuintal * 30 });
          setTimeout(() => { desenharChao(ovo.id); salvar(); }, 500);
        }
      });

    case "quadro": {
      const quem = alvo.closest("[data-quem]")?.dataset.quem || "manu";
      return chegar(COISAS.quadro + (quem === "manu" ? -94 : quem === "vovoo" ? 94 : 0), () => {
        animar(manu, "pulinho", 650);
        dizer(quem === "manu" ? "narrador" : quem, "retrato");
      });
    }

    case "radio":
      return chegar(COISAS.radio, () => {
        const ligar = !radioLigado;
        tocarRadio(ligar);
        el.classList.toggle("tocando", ligar);
        if (ligar) dizer("vovoo", "radio");
      });

    case "gato":
      return chegar(ladoDe(1700, 80), () => {
        virarPara(manu, 1700);
        animarEl(el, "acordado", 2600);
        dizer("narrador", "gato");
      });

    case "filtro":
      return chegar(COISAS.filtro + 40, () => {
        virarPara(manu, COISAS.filtro);
        animarEl(el, "pingando", 2600);
        dizer("vovo", "agua");
      });

    case "pia":
      return chegar(COISAS.pia, () => {
        animarEl(el, "correndo", 1800);
        const i = naMao("manu");
        if (i && ehComida(i.tipo)) setTimeout(() => dizer("narrador", "lavou"), 900);
        else if (quemEstaPerto()) dizer("vovo", "lavar");
      });

    case "fogao":
      return chegar(COISAS.fogao - 70, () => {
        virarPara(manu, COISAS.fogao);
        animarEl(el, "fervendo", 2200);
        dizer("vovo", "quente");
      });

    case "cama":
      return chegar(COISAS.cama, async () => {
        const noite = document.getElementById("soneca");
        noite.classList.add("visivel");
        await dizer("narrador", "soneca");
        await esperar(1800);
        noite.classList.remove("visivel");
        await esperar(700);
        dizer("narrador", "acorda");
      });

    case "abajur":
      return chegar(COISAS.abajur - 60, () => {
        const acesa = el.classList.toggle("acesa");
        dizerFala("narrador", { texto: FALAS.narrador.abajur[acesa ? 0 : 1] });
      });

    default:
      return chegar(COISAS[nome] || manu.x, () => dizer("narrador", nome));
  }
}

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
    if (guardar(i, "bolsa")) { dizer("narrador", "bolsa"); animarEl(botaoBolsa, "recebeu", 600); }
    else dizer("narrador", "cheio");
    return;
  }
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
  const dt = Math.min(.05, (agora - antes) / 1000);
  antes = agora;
  if (!document.getElementById("inicio").hidden) { requestAnimationFrame(relogio); return; }
  mover(dt);

  // câmera acompanha a Manu, devagar
  const alvo = alvoDaCamera();
  if (Math.abs(alvo - cam.x) > .3) { cam.x += (alvo - cam.x) * (1 - Math.exp(-dt * 3)); aplicarCamera(); }
  posicionarBalao();

  // a família cumprimenta quando a Manu chega perto (e olha para ela)
  const manu = gente.manu;
  for (const id of ["vovo", "vovoo"]) {
    const p = gente[id];
    if (p.ocupado || p.alvo !== null) continue;
    const d = Math.abs(p.x - manu.x);
    if (d < 700 && sinal(manu.x - p.x) !== p.dir && sinal(manu.x - p.x)) virarPara(p, manu.x);
    if (d < 300 && agora - p.ultimoOi > 60000 && agora - falouEm > 3000 && manu.alvo === null) {
      p.ultimoOi = agora;
      animar(p, "acenando", 1700);
      dizer(id, "oi");
    }
  }
  requestAnimationFrame(relogio);
}

// a árvore e a horta voltam a dar frutos com o tempo
setInterval(() => {
  let mudou = false;
  if (mundo.arvore < FRUTAS_ARVORE.length) { mundo.arvore++; mudou = true; }
  const v = mundo.horta.indexOf(false);
  if (v >= 0) { mundo.horta[v] = true; mudou = true; }
  if (mudou && document.getElementById("frutas-arvore")) {
    document.getElementById("frutas-arvore").innerHTML = desenharFrutasArvore(mundo.arvore);
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
  await destravarSom();
  try { await document.documentElement.requestFullscreen?.(); } catch (e) {}
  try { await screen.orientation?.lock?.("landscape"); } catch (e) {}
  try { await navigator.wakeLock?.request("screen"); } catch (e) {}
  inicio.hidden = true;
  voltar.hidden = false;
  botaoBolsa.hidden = false;
  requestAnimationFrame(() => { medirTela(); sininho(); });
});

function irParaInicio() {
  pararSons();
  tocarRadio(false);
  document.querySelector("[data-coisa='radio']")?.classList.remove("tocando");
  voltar.hidden = true;
  botaoBolsa.hidden = true;
  bandeja.hidden = true;
  inicio.hidden = false;
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
document.addEventListener("visibilitychange", () => { if (document.hidden) { pararSons(); tocarRadio(false); } });

Editor.iniciar();
montarMundo();
desenharFamilia();
requestAnimationFrame(relogio);
