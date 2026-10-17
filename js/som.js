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

function falarTexto(texto, voz) {
  return new Promise(pronto => {
    let feito = false;
    const fim = () => { if (!feito) { feito = true; pronto(); } };
    if (!("speechSynthesis" in window)) { sininho(); setTimeout(fim, 700); return; }
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = "pt-BR";
    const br = vozesPt.find(v => v.lang.replace("_", "-").toLowerCase() === "pt-br") || vozesPt[0];
    if (br) u.voice = br;
    u.pitch = voz === "pai" ? .7 : 1.4;   // grave para o pai, agudo para a mãe
    u.rate = .9;
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
const pop = () => nota(420, 0, .18, .2);
const plim = () => nota(780, 0, .16, .12);
const sininho = () => { nota(660, 0, .3, .15); nota(990, .12, .4, .12); };
