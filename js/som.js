/* =========================================================
   som.js — TODOS OS SONS DO JOGO

   Agora: a voz do celular lê o texto das falas.
   Depois: quando uma fala tiver "arquivo", toca a gravação de vocês.
   ========================================================= */
let audioCtx = null, audioAtual = null, vozesPt = [];

function carregarVozes() {
  if (!("speechSynthesis" in window)) return;
  vozesPt = speechSynthesis.getVoices().filter(v => (v.lang || "").toLowerCase().startsWith("pt"));
}
if ("speechSynthesis" in window) {
  carregarVozes();
  speechSynthesis.onvoiceschanged = carregarVozes;
}

// Os celulares só deixam tocar som depois de um toque na tela.
// Esta função é chamada no primeiro toque para "destravar" o áudio.
async function destravarSom() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    await audioCtx.resume();
  } catch (e) { /* sem som de efeitos, o jogo continua */ }
}

// Enquanto não há gravação, cada pessoa ganha um "jeito" diferente da voz do celular
const JEITOS_DE_VOZ = {
  mae:     { tom: 1.35, ritmo: .9 },
  pai:     { tom: .7,  ritmo: .9 },
  vovo:    { tom: 1.15, ritmo: .82 },
  vovoo:   { tom: .6,  ritmo: .8 },
  crianca: { tom: 1.7, ritmo: .95 },
};

function falarTexto(texto, voz) {
  return new Promise(pronto => {
    let feito = false;
    const fim = () => { if (!feito) { feito = true; pronto(); } };
    if (!("speechSynthesis" in window)) { sininho(); setTimeout(fim, 700); return; }
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = "pt-BR";
    const br = vozesPt.find(v => v.lang.replace("_", "-").toLowerCase() === "pt-br") || vozesPt[0];
    if (br) u.voice = br;
    const jeito = JEITOS_DE_VOZ[voz] || JEITOS_DE_VOZ.mae;
    u.pitch = jeito.tom;
    u.rate = jeito.ritmo;
    u.onend = fim;
    u.onerror = fim;
    setTimeout(fim, 900 + texto.length * 130); // segurança, caso o celular não avise que terminou
    speechSynthesis.speak(u);
  });
}

function tocarArquivo(caminho) {
  return new Promise(pronto => {
    audioAtual = new Audio(caminho);
    audioAtual.onended = pronto;
    audioAtual.onerror = pronto;
    audioAtual.play().catch(pronto);
  });
}

function falar(fala) {
  return fala.arquivo ? tocarArquivo(fala.arquivo) : falarTexto(fala.texto, fala.voz);
}

function pararSons() {
  if ("speechSynthesis" in window) speechSynthesis.cancel();
  if (audioAtual) { audioAtual.pause(); audioAtual = null; }
}

// Pequenos sons feitos na hora pelo próprio navegador (sem arquivo)
function nota(freq, inicio, dur, vol) {
  if (!audioCtx) return;
  const t = audioCtx.currentTime + inicio;
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(freq, t);
  o.frequency.exponentialRampToValueAtTime(freq * 2, t + .09);
  g.gain.setValueAtTime(.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + .01);
  g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g).connect(audioCtx.destination);
  o.start(t);
  o.stop(t + dur + .02);
}
// sons baixinhos e curtos: o jogo é calmo
const pop = () => nota(380, 0, .14, .08);
const plim = () => nota(700, 0, .16, .07);
const sininho = () => { nota(620, 0, .3, .07); nota(930, .14, .4, .06); };
const guardado = () => { nota(520, 0, .18, .07); nota(780, .1, .26, .06); };

/* O rádio da vovó: uma melodia simples e lenta, tocada pelo próprio navegador */
let radioLigado = false, radioTimer = null;
const MELODIA = [392, 440, 494, 440, 392, 330, 349, 392, 440, 392, 349, 330, 294, 330, 392, 0];
function tocarRadio(ligar) {
  radioLigado = ligar;
  clearTimeout(radioTimer);
  if (!ligar || !audioCtx) return;
  let i = 0;
  const passo = () => {
    if (!radioLigado) return;
    const f = MELODIA[i % MELODIA.length];
    if (f) { suave(f, .55, .045); suave(f / 2, .55, .03); }
    i++;
    radioTimer = setTimeout(passo, 520);
  };
  passo();
}
function suave(freq, dur, vol) {
  const t = audioCtx.currentTime;
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = "triangle";
  o.frequency.value = freq;
  g.gain.setValueAtTime(.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + .04);
  g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g).connect(audioCtx.destination);
  o.start(t);
  o.stop(t + dur + .05);
}
