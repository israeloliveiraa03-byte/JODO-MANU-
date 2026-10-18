/* =========================================================
   falas.js — AS VOZES DA FAMÍLIA

   É aqui que entram as falas que cada pessoa enviar.
   Cada fala pode ser só um texto:
       "Oi, minha netinha!"
   ou um texto com a gravação:
       { texto: "Oi, minha netinha!", arquivo: "audio/vovo/oi_1.mp3" }

   Enquanto não houver gravação, a voz do celular lê o texto.
   Quando há várias falas num momento, o jogo sorteia uma (sem repetir seguido).
   ========================================================= */

/* Quem é quem: nome, voz e onde a pessoa costuma ficar na casa */
const PESSOAS = {
  manu:  { nome: "Manu",  voz: "crianca", casa: 1300 },
  vovo:  { nome: "Vovó",  voz: "vovo",    casa: 2700,
           ficha: { adulto: true, pele: "#7b4a2e", cabelo: "coqueVo", corCabelo: "#8e8a86", enfeite: "nenhum",
                    olhos: "redondos", corOlhos: "#2a170d", boca: "sorriso", oculos: "redondos", barba: "nenhuma",
                    roupa: "avental", corRoupa: "#a98be0", sapatos: "chinelo" } },
  vovoo: { nome: "Vovô",  voz: "vovoo",   casa: 640,
           ficha: { adulto: true, pele: "#5a3420", cabelo: "calvo", corCabelo: "#e9e6e0", enfeite: "nenhum",
                    olhos: "redondos", corOlhos: "#2a170d", boca: "sorriso", oculos: "nenhum", barba: "bigode",
                    roupa: "camisa", corRoupa: "#6aa8e8", sapatos: "sapato" } },
};

const FALAS = {
  vovo: {
    oi:        ["Oi, minha netinha!", "Oxente, olha quem chegou!", "Vem cá, meu amor!"],
    abraco:    ["Que abraço gostoso!", "Ai, que saudade!", "Te amo, Manu!", "Vixe, que abraço arretado!"],
    fruta:     ["Hum, que fruta bonita!", "Umbu dá um suco bom demais!", "Vamos pôr na fruteira?"],
    comida:    ["Obrigada! Vou guardar na geladeira.", "Isso vai na geladeira, viu?"],
    brinquedo: ["Que brinquedo lindo! Vamos guardar no baú?", "Brinquedo mora no baú!"],
    guardou:   ["Pronto, guardadinho!", "Prontinho!", "Cada coisa no seu lugar."],
    engracado: ["Isso na geladeira? Que engraçado!", "Hihi, que bagunça gostosa!"],
    cheio:     ["Ih, aqui já está cheio!"],
    quente:    ["Cuidado, tá quentinho!", "O fogão é da vovó, tá?"],
    agua:      ["Água fresquinha do filtro!"],
    lavar:     ["Isso, lava bem a fruta!"],
    retrato:   ["Olha a vovó aqui!"],
    bolo:      ["Hum, o bolo da vovó! Cuidado, que tá quentinho.", "Bolo de milho, do jeitinho que você gosta!"],
    rede:      ["Balança, balança, minha fulô.", "Rede é bom pra descansar."],
    picole:    ["Picolé! Mas só um, hein?", "Que geladinho!"],
    pijama:    ["Isso! Pijama para dormir.", "Que pijama lindo, meu amor."],
    pulo:      ["Pula, pula, minha fulô!", "Vamos pular juntas!"],
    // de noite
    noite:     ["Já está de noite! Hora de pôr o pijama.", "Olha a lua lá fora, meu amor!"],
    boaNoite:  ["Boa noite, minha netinha. Dorme com os anjinhos.", "Sonha com coisa boa, viu?"],
    bomDia:    ["Bom dia, meu amor! Dormiu bem?", "Bom dia! Vamos tomar café?"],
    historias: [
      ["Era uma vez um gatinho bem preguiçoso.", "Ele dormia o dia inteiro no tapete da vovó.", "E de noite, sabe o que ele fazia?", "Dormia mais um pouquinho! Fim."],
      ["Era uma vez uma galinha que adorava cantar.", "Ela cantava para o sol acordar.", "E quando a lua chegava, ela dizia: boa noite, sol!", "E ia dormir no poleiro. Fim."],
      ["Era uma vez um umbuzeiro bem grandão.", "Mesmo sem chuva, ele guardava água nas raízes.", "E todo ano dava umbu pra menina.", "A menina dizia: obrigada, árvore! Fim."],
      ["Era uma vez um calango que adorava tomar sol no lajedo.", "Quando a pedra esquentava, ele corria pra sombra do mandacaru.", "E quando a lua chegava, ia dormir na toca.", "Boa noite, calango! Fim."],
    ],
    conta:     n => `${["", "Uma", "Duas", "Três", "Quatro"][n]} ${n === 1 ? "fruta" : "frutas"} na fruteira!`,
  },
  vovoo: {
    oi:        ["Ô, minha fulô!", "Chegou a alegria do vovô!", "Oxente, que menina linda!"],
    abraco:    ["Abraço de urso!", "Que menina forte!"],
    fruta:     ["Olha o umbu do nosso pé!", "Que fruta bonita!"],
    comida:    ["Vamos levar pra vovó guardar?", "Hum, que delícia!"],
    brinquedo: ["Vamos brincar depois?", "Esse brinquedo é bom demais!"],
    guardou:   ["Pronto!", "Tá guardado."],
    engracado: ["Ué, que lugar engraçado!"],
    cheio:     ["Ih, não cabe mais!"],
    radio:     ["Essa música é do meu tempo!", "Vamos dançar?"],
    horta:     ["Puxa a cenoura com força!", "A horta do vovô!"],
    retrato:   ["Olha o vovô aqui!"],
    cabra:     ["É a Mimosa, a nossa cabrita!", "Ela gosta de capim."],
    mandacaru: ["Quando o mandacaru flora, a chuva tá chegando.", "O mandacaru guarda água dentro dele."],
    chapeu:    ["Meu chapéu de couro! Protege do sol do sertão.", "Esse chapéu é do vovô!"],
    rede:      ["Balança a rede, minha fulô!"],
    pulo:      ["O vovô também pula!", "Eita, que pulo arretado!"],
    noite:     ["Boa noite, princesa!", "Ih, já escureceu. Hora de dormir!"],
    boaNoite:  ["Dorme bem, minha princesa.", "Amanhã a gente brinca mais, tá?"],
    bomDia:    ["Bom dia, flor do dia!", "Bom dia! O galo já cantou!"],
  },
  // a voz que diz o nome das coisas (pode ser a mãe ou o pai)
  narrador: {
    voz: "mae",
    bolsa:     ["Guardou na bolsinha!"],
    guardou:   ["Guardadinho!", "Prontinho!"],
    engracado: ["Hihi, que lugar engraçado!"],
    cheio:     ["Ih, está cheio!"],
    lavou:     ["Lavadinha!"],
    soneca:    ["Shhh... hora da soneca."],
    acorda:    ["Bom dia!"],
    gato:      ["Miau!"],
    galinha:   ["Có, có, có!"],
    retrato:   ["Olha a Manu!"],
    sofa:      ["Que sofá fofinho!"],
    planta:    ["Que planta bonita!"],
    armario:   ["Quanta roupa!", "Qual roupa você quer?"],
    roupa:     ["Roupa nova!", "Que linda!", "Ficou bonita!"],
    panelas:   ["As panelas da vovó!"],
    janela:    ["Que ventinho bom!", "Olha lá fora!"],
    abajur:    ["Acendeu!", "Apagou!"],
    noite:     ["Olha as estrelas!", "A lua apareceu!"],
    caoBusca:  ["Busca, Caramelo!"],
    calango:   ["Olha o calango! Correu!", "O calango tava tomando sol!"],
    cisterna:  ["A cisterna guarda a água da chuva!"],
    rede:      ["Que rede gostosa!"],
    mandacaru: ["Olha o mandacaru!"],
    // contar os pulos (1, 2, 3...) e os movimentos do corpo
    pulos:     n => ["", "Um!", "Dois!", "Três!", "Quatro!", "Cinco!", "Seis!", "Sete!", "Oito!", "Nove!", "Dez! Que pulão!"][n],
    abaixa:    ["Abaixa...", "Agachou!", "Lá embaixo!"],
    levanta:   ["E levanta!", "Lá em cima!"],
    deita:     ["Deitou na caminha!", "Shhh... a Manu vai dormir."],
    caoVolta:  ["Muito bem, Caramelo!", "Ele trouxe a bola!"],
  },
};

/* ---------- ajudantes ---------- */
const ultimaFala = {};
function escolherFala(quem, momento, ...extra) {
  let lista = FALAS[quem] && FALAS[quem][momento];
  if (!lista) return null;
  if (typeof lista === "function") return { texto: lista(...extra) };
  const chave = quem + momento;
  let i = Math.floor(Math.random() * lista.length);
  if (lista.length > 1 && i === ultimaFala[chave]) i = (i + 1) % lista.length;
  ultimaFala[chave] = i;
  const f = lista[i];
  return typeof f === "string" ? { texto: f } : f;
}
const vozDe = quem => quem === "narrador" ? FALAS.narrador.voz : PESSOAS[quem].voz;
