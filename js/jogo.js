/* =========================================================
   jogo.js — O QUE ACONTECE QUANDO ELA TOCA

   1. CENA: o que cada objeto faz e fala. É a parte que vocês vão mexer mais.
      Quando gravarem os áudios, troquem "arquivo: null" pelo nome do arquivo,
      por exemplo: arquivo: "audio/oi_manu.mp3"
   ========================================================= */
const CENA = {
  manu:   { acao: "acenar",   falas: [ { texto: "Oi, Manu!",         voz: "mae", arquivo: null },
                                       { texto: "Te amo!",           voz: "pai", arquivo: null } ] },
  gato:   { acao: "pular",    falas: [ { texto: "Miau!",             voz: "pai", arquivo: null } ] },
  bolo:   { acao: "balancar", falas: [ { texto: "Hum, que gostoso!", voz: "mae", arquivo: null },
                                       { texto: "Ebaaa!",            voz: "pai", arquivo: null } ] },
  cama:   { acao: "dormir",   falas: [ { texto: "Boa noite...",      voz: "pai", arquivo: null } ] },
  caixa:  { acao: "surpresa", sequencia: true,
                              falas: [ { texto: "Cadê?",             voz: "mae", arquivo: null },
                                       { texto: "Achou!",            voz: "mae", arquivo: null } ] },
  janela: { acao: "brilhar",  falas: [ { texto: "Uau!",              voz: "mae", arquivo: null },
                                       { texto: "Que legal!",        voz: "pai", arquivo: null } ] },
};

/* ---------- 2. A ficha da personagem, guardada no celular ----------
   localStorage é uma "gavetinha" do navegador: o que se guarda nela
   continua lá quando o jogo é aberto de novo, no mesmo celular. */
const GAVETA = "manu-personagem-v1";

function carregarFicha() {
  try { return fichaValida(JSON.parse(localStorage.getItem(GAVETA))); }
  catch (e) { return { ...PADRAO }; }
}
function guardarFicha(f) {
  try { localStorage.setItem(GAVETA, JSON.stringify(f)); } catch (e) { /* sem gaveta, segue o jogo */ }
}

let ficha = carregarFicha();

/* ---------- 3. Montar o quarto na tela ---------- */
const palco = document.getElementById("palco");
const balao = document.getElementById("balao");
let arrumacaoAtual = null;

function montar(forcar) {
  const nome = palco.clientHeight > palco.clientWidth ? "empe" : "deitado";
  if (nome === arrumacaoAtual && !forcar) return;
  arrumacaoAtual = nome;
  const q = montarQuarto(nome, ficha);
  palco.setAttribute("viewBox", q.viewBox);
  palco.innerHTML = q.svg;
}

/* ---------- 4. Os toques ---------- */
let rodada = 0;          // cada toque novo "vence" o anterior
const vez = {};          // qual fala cada objeto diz da próxima vez
const esperar = ms => new Promise(r => setTimeout(r, ms));

function reiniciar(el, ...classes) {
  el.classList.remove(...classes);
  void el.getBoundingClientRect(); // faz o navegador "esquecer" a animação anterior
  el.classList.add(...classes);
}

function fecharCaixa() {
  const c = palco.querySelector('[data-id="caixa"] .anim');
  if (c) c.classList.remove("aberta");
}

let timerBalao;
function mostrarBalao(id, fala) {
  const alvo = palco.querySelector(`[data-id="${id}"] .anim`);
  if (!alvo) return;
  const r = alvo.getBoundingClientRect();
  balao.textContent = fala.texto;
  balao.classList.toggle("pai", fala.voz === "pai");
  const meia = Math.min(140, innerWidth / 2 - 10);
  balao.style.left = Math.max(meia, Math.min(innerWidth - meia, r.left + r.width / 2)) + "px";
  balao.style.top = Math.max(70, r.top + 10) + "px";
  balao.classList.remove("visivel");
  void balao.offsetWidth;
  balao.classList.add("visivel");
  clearTimeout(timerBalao);
  timerBalao = setTimeout(() => balao.classList.remove("visivel"), 2000);
}

function confete(x, y) {
  const cores = ["#f2b630", "#f08a7e", "#8fc9a9", "#7aa7e0", "#ffffff"];
  for (let i = 0; i < 9; i++) {
    const d = document.createElement("div");
    d.className = "confete";
    const ang = Math.PI * 2 * i / 9 + Math.random() * .4, dist = 50 + Math.random() * 40;
    d.style.left = x + "px";
    d.style.top = y + "px";
    d.style.setProperty("--c", cores[i % cores.length]);
    d.style.setProperty("--dx", Math.cos(ang) * dist + "px");
    d.style.setProperty("--dy", Math.sin(ang) * dist + "px");
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 750);
  }
}

async function tocar(id) {
  const minhaRodada = ++rodada;
  pararSons();
  const obj = CENA[id];
  const el = palco.querySelector(`[data-id="${id}"] .anim`);
  if (id !== "cama") palco.classList.remove("noite");
  if (id !== "caixa") fecharCaixa();

  if (obj.acao === "acenar") reiniciar(el, "pula", "acenando");
  if (obj.acao === "pular") reiniciar(el, "pula");
  if (obj.acao === "balancar") reiniciar(el, "balanca");
  if (obj.acao === "brilhar") reiniciar(el, "brilha");
  if (obj.acao === "dormir") { reiniciar(el, "afunda"); palco.classList.add("noite"); }
  if (obj.acao === "surpresa") { el.classList.remove("aberta"); reiniciar(el, "treme"); }

  if (obj.sequencia) {
    // a caixa fala "Cadê?", abre a tampa e fala "Achou!"
    for (let i = 0; i < obj.falas.length; i++) {
      if (minhaRodada !== rodada) return;
      if (i > 0) el.classList.add("aberta");
      mostrarBalao(id, obj.falas[i]);
      await falar(obj.falas[i]);
      if (i === 0) await esperar(250);
    }
    await esperar(2500);
    if (minhaRodada === rodada) fecharCaixa();
    return;
  }

  // os outros objetos alternam entre as falas que têm
  const n = vez[id] || 0;
  vez[id] = n + 1;
  const fala = obj.falas[n % obj.falas.length];
  mostrarBalao(id, fala);
  await falar(fala);
  if (obj.acao === "dormir") {
    await esperar(1500);
    if (minhaRodada === rodada) palco.classList.remove("noite");
  }
}

palco.addEventListener("pointerdown", e => {
  e.preventDefault();
  confete(e.clientX, e.clientY);
  pop();
  const alvo = e.target.closest(".objeto");
  if (alvo) tocar(alvo.dataset.id);
});
palco.addEventListener("contextmenu", e => e.preventDefault());

/* ---------- 5. Telas: início, quarto e ateliê ---------- */
const inicio = document.getElementById("inicio");
const voltar = document.getElementById("voltar");

function mostrarRetrato() {
  document.getElementById("retrato").innerHTML = desenharAvatar(ficha);
}

function irParaInicio() {
  pararSons();
  palco.classList.remove("noite");
  voltar.hidden = true;
  inicio.hidden = false;
  mostrarRetrato();
}

document.getElementById("brincar").addEventListener("click", async () => {
  await destravarSom();
  try { await document.documentElement.requestFullscreen?.(); } catch (e) {}
  try { await navigator.wakeLock?.request("screen"); } catch (e) {}
  inicio.hidden = true;
  voltar.hidden = false;
  montar(true);
  sininho();
  falarTexto("Vamos brincar!", "mae");
});

document.getElementById("montar").addEventListener("click", async () => {
  await destravarSom();
  plim();
  inicio.hidden = true;
  Editor.abrir(ficha, (fichaNova, salvou) => {
    if (salvou) { ficha = fichaNova; guardarFicha(ficha); }
    inicio.hidden = false;
    mostrarRetrato();
  });
});

/* O botão de voltar precisa ser SEGURADO por 1 segundo.
   Assim um toque sem querer da criança não tira ela do quarto. */
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

document.addEventListener("visibilitychange", () => { if (document.hidden) pararSons(); });
addEventListener("resize", () => montar());

Editor.iniciar();
mostrarRetrato();
montar(true);
