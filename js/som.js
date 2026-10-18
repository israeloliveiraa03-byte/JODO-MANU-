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
  mae:     { tom: 1.25, ritmo: .9,  genero: "f" },
  pai:     { tom: .8,  ritmo: .9,  genero: "m" },
  vovo:    { tom: 1.1, ritmo: .8,  genero: "f" },
  vovoo:   { tom: .7,  ritmo: .78, genero: "m" },
  crianca: { tom: 1.6, ritmo: .95, genero: "f" },
};
// Os celulares trazem vozes com nomes diferentes; tentamos achar uma de mulher e uma de homem
const PISTAS_F = /luciana|francisca|fernanda|vit[oó]ria|helena|raquel|thalita|leila|maria|joana|female|femin|afs|pte/i;
const PISTAS_M = /daniel|felipe|ant[oô]nio|ricardo|f[aá]bio|humberto|j[uú]lio|male|mascul|ptd/i;
function escolherVoz(genero) {
  const br = vozesPt.filter(v => v.lang.replace("_", "-").toLowerCase() === "pt-br");
  const lista = br.length ? br : vozesPt;
  if (!lista.length) return null;
  const pista = genero === "m" ? PISTAS_M : PISTAS_F;
  return lista.find(v => pista.test(v.name) || pista.test(v.voiceURI)) || lista.find(v => /google/i.test(v.name)) || lista[0];
}

function falarTexto(texto, voz) {
  return new Promise(pronto => {
    let feito = false;
    const fim = () => { if (!feito) { feito = true; pronto(); } };
    if (!("speechSynthesis" in window)) { sininho(); setTimeout(fim, 700); return; }
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = "pt-BR";
    const jeito = JEITOS_DE_VOZ[voz] || JEITOS_DE_VOZ.mae;
    const escolhida = escolherVoz(jeito.genero);
    if (escolhida) u.voice = escolhida;
    u.pitch = jeito.tom;
    u.rate = jeito.ritmo;
    u.onend = fim;
    u.onerror = fim;
    setTimeout(fim, 1200 + texto.length * 130); // segurança, caso o celular não avise que terminou
    setTimeout(() => speechSynthesis.speak(u), 60); // um instante depois de calar a fala anterior
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
// baião calminho, inventado para o jogo (escala de sol com o fá natural, bem nordestina)
const MELODIA = [392, 494, 587, 523, 494, 440, 392, 349, 392, 494, 587, 698, 659, 587, 523, 494,
                 440, 523, 659, 587, 523, 494, 440, 392, 349, 440, 523, 494, 440, 392, 392, 0];
const ZABUMBA = [1, 0, 0, 1, 1, 0, 0, 0]; // a batida do baião: tum . . tum tum . . .
function tocarRadio(ligar, devagar = false) {
  radioLigado = ligar;
  clearTimeout(radioTimer);
  if (!ligar || !audioCtx) return;
  let i = 0;
  const passo = () => {
    if (!radioLigado) return;
    const f = MELODIA[i % MELODIA.length];
    if (f) suave(f, devagar ? .7 : .32, .04);
    if (!devagar) {
      if (ZABUMBA[i % 8]) tom("sine", 0, .18, [[0, 110], [1, 60]], .09);
      tom("triangle", 0, .08, [[0, 2800], [1, 2800]], i % 2 ? .006 : .012);
    } else if (i % 4 === 0) suave(f / 2 || 196, 1.2, .025);
    i++;
    radioTimer = setTimeout(passo, devagar ? 760 : 270);
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

/* =========================================================
   SONS DO JOGO, FEITOS NA HORA
   Cada som é uma "receita": um tom (oscilador) ou um chiado (ruído),
   passando por um filtro que dá a cor do som, e um volume que
   sobe e desce (o "envelope"). Mudando a receita, muda o bicho.
   ========================================================= */
let somLigado = true;
function tom(tipo, inicio, dur, freqs, vol, filtro) {
  if (!audioCtx || !somLigado) return;
  const t = audioCtx.currentTime + inicio;
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = tipo;
  // freqs: lista de [tempo relativo 0..1, frequência] para a voz do bicho "subir e descer"
  o.frequency.setValueAtTime(freqs[0][1], t);
  for (const [r, f] of freqs.slice(1)) o.frequency.linearRampToValueAtTime(f, t + r * dur);
  g.gain.setValueAtTime(.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + Math.min(.03, dur * .2));
  g.gain.setValueAtTime(vol, t + dur * .6);
  g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  let saida = o;
  if (filtro) {
    const f = audioCtx.createBiquadFilter();
    f.type = filtro.tipo || "bandpass";
    f.frequency.setValueAtTime(filtro.f, t);
    if (filtro.ate) f.frequency.linearRampToValueAtTime(filtro.ate, t + dur);
    f.Q.value = filtro.q || 1;
    o.connect(f); saida = f;
  }
  saida.connect(g).connect(audioCtx.destination);
  o.start(t);
  o.stop(t + dur + .05);
}
let bufferRuido = null;
function chiado(inicio, dur, vol, filtro) {
  if (!audioCtx || !somLigado) return;
  if (!bufferRuido) {
    bufferRuido = audioCtx.createBuffer(1, audioCtx.sampleRate * 2, audioCtx.sampleRate);
    const d = bufferRuido.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t = audioCtx.currentTime + inicio;
  const src = audioCtx.createBufferSource(), g = audioCtx.createGain(), f = audioCtx.createBiquadFilter();
  src.buffer = bufferRuido;
  f.type = filtro.tipo || "bandpass";
  f.frequency.setValueAtTime(filtro.f, t);
  if (filtro.ate) f.frequency.exponentialRampToValueAtTime(filtro.ate, t + dur);
  f.Q.value = filtro.q || 1;
  g.gain.setValueAtTime(.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + Math.min(.04, dur * .3));
  g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  src.connect(f).connect(g).connect(audioCtx.destination);
  src.start(t, Math.random());
  src.stop(t + dur + .05);
}

const SONS = {
  // objetos
  pegar:   () => tom("sine", 0, .14, [[0, 320], [1, 640]], .07),
  soltar:  () => { tom("sine", 0, .16, [[0, 240], [1, 110]], .08); chiado(.02, .06, .03, { f: 700, tipo: "lowpass" }); },
  cair:    () => { chiado(0, .45, .025, { f: 2200, ate: 400, q: .8 }); tom("sine", .45, .2, [[0, 150], [1, 55]], .12); chiado(.45, .08, .05, { f: 500, tipo: "lowpass" }); },
  guardar: () => { tom("sine", 0, .16, [[0, 520], [1, 520]], .06); tom("sine", .11, .26, [[0, 780], [1, 780]], .05); },
  porta:   () => { tom("triangle", 0, .22, [[0, 130], [1, 90]], .07); chiado(0, .04, .04, { f: 1500 }); },
  tampa:   () => { tom("sawtooth", 0, .32, [[0, 170], [.5, 230], [1, 190]], .03, { f: 900, q: 3 }); },
  ziper:   () => { for (let i = 0; i < 6; i++) chiado(i * .045, .04, .035, { f: 3500, q: 2 }); },
  passo:   () => chiado(0, .06, .018, { f: 260, tipo: "lowpass" }),
  agua:    (dur = 1.6) => { chiado(0, dur, .035, { f: 1300, q: .6 }); for (let i = 0; i < 6; i++) tom("sine", Math.random() * dur, .05, [[0, 900 + Math.random() * 900], [1, 1800]], .015); },
  gota:    () => tom("sine", 0, .12, [[0, 1400], [1, 500]], .05),
  panela:  () => { for (let i = 0; i < 9; i++) tom("sine", i * .18 + Math.random() * .08, .06, [[0, 280 + Math.random() * 260], [1, 600]], .025); },
  clique:  () => { tom("square", 0, .02, [[0, 1800], [1, 1800]], .02); chiado(0, .02, .03, { f: 3000 }); },
  vento:   () => chiado(0, .8, .02, { f: 600, ate: 1400, q: .5 }),

  rangido: () => tom("sawtooth", 0, .55, [[0, 150], [.3, 210], [.6, 175], [1, 240]], .022, { f: 1100, q: 6 }),
  janela:  () => { chiado(0, .35, .03, { f: 2400, ate: 900, q: 1.2 }); tom("sine", .3, .08, [[0, 600], [1, 420]], .03); },
  forno:   () => { tom("triangle", 0, .3, [[0, 110], [1, 80]], .08); chiado(0, .05, .05, { f: 900 }); },
  brilho:  () => { [880, 1175, 1480, 1760].forEach((f, i) => tom("sine", i * .08, .35, [[0, f], [1, f]], .035)); },
  pulo:    () => tom("sine", 0, .24, [[0, 300], [1, 640]], .045),
  pouso:   () => { tom("sine", 0, .14, [[0, 170], [1, 70]], .08); chiado(0, .05, .03, { f: 500, tipo: "lowpass" }); },
  abaixa:  () => tom("sine", 0, .3, [[0, 440], [1, 250]], .035),
  levanta: () => tom("sine", 0, .3, [[0, 250], [1, 440]], .035),
  colchao: () => { chiado(0, .35, .03, { f: 420, tipo: "lowpass" }); tom("sawtooth", .05, .4, [[0, 160], [.5, 200], [1, 175]], .015, { f: 900, q: 6 }); },
  bocejo:  (k = 1) => { tom("sine", 0, 1.1, [[0, 420 * k], [.3, 520 * k], [1, 260 * k]], .045, { f: 900 * k, tipo: "lowpass" }); chiado(0, 1, .015, { f: 700, tipo: "lowpass" }); },

  // bichos do sertão
  mee:     () => tom("sawtooth", 0, .75, [[0, 330], [.15, 380], [.3, 340], [.45, 385], [.6, 345], [.75, 380], [1, 320]], .05, { f: 1000, q: 4 }),
  fufu:    () => { tom("sine", 0, .22, [[0, 520], [1, 500]], .05); tom("sine", .3, .6, [[0, 500], [.4, 520], [1, 440]], .05); },
  campina: () => { for (let i = 0; i < 5; i++) tom("sine", .1 + i * .09, .07, [[0, 2900 - i * 120], [1, 3400 - i * 120]], .03); },
  calango: () => { for (let i = 0; i < 7; i++) chiado(i * .06, .05, .03, { f: 2600, q: 1.5 }); },

  // bichos
  miau:    () => tom("sawtooth", 0, .7, [[0, 480], [.25, 880], [.6, 760], [1, 540]], .06, { f: 1100, ate: 1700, q: 5 }),
  ronrom:  () => { for (let i = 0; i < 8; i++) tom("sawtooth", i * .11, .1, [[0, 28], [1, 26]], .05, { f: 220, tipo: "lowpass" }); },
  auau:    () => { for (const t of [0, .26]) { tom("sawtooth", t, .13, [[0, 230], [.4, 300], [1, 160]], .1, { f: 650, q: 1.5 }); chiado(t, .1, .05, { f: 900, q: 1 }); } },
  cocoro:  () => { for (const t of [0, .16, .32]) tom("square", t, .08, [[0, 420], [1, 320]], .035, { f: 950, q: 3 }); },
  cocorico: () => tom("sawtooth", 0, 1.1, [[0, 520], [.15, 720], [.3, 680], [.45, 820], [.85, 760], [1, 520]], .05, { f: 1400, q: 4 }),
  quem:    () => { for (const t of [0, .24]) tom("sawtooth", t, .17, [[0, 270], [1, 220]], .07, { f: 1150, q: 7 }); },
  piu:     () => { for (const t of [0, .14, .3]) tom("sine", t, .09, [[0, 2600], [1, 3900]], .035); },
  uhuh:    () => { tom("sine", 0, .38, [[0, 390], [1, 370]], .06, { f: 800, tipo: "lowpass" }); tom("sine", .52, .7, [[0, 360], [.5, 375], [1, 330]], .06, { f: 800, tipo: "lowpass" }); },
};

/* Grilos de noite: bem baixinho, de vez em quando */
let grilosTimer = null;
function grilos(ligar) {
  clearInterval(grilosTimer);
  if (!ligar) return;
  grilosTimer = setInterval(() => {
    for (let i = 0; i < 3; i++) tom("sine", i * .05, .03, [[0, 4400], [1, 4400]], .01);
  }, 1400);
}
