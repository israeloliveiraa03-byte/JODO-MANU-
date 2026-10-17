# A Casa da Vovó

Jogo calmo de casinha para a Manu (e, depois, para os primos), com a família de verdade e as vozes dela.

**Jogar:** https://israeloliveiraa03-byte.github.io/JODO-MANU-/ (melhor com o celular deitado)

A ideia completa, o que a criança aprende e o plano da sala dos primos estão em [PROJETO.md](PROJETO.md).

## Como se joga

- Toque no chão e a Manu anda até lá.
- Toque numa coisa e ela vai até a coisa e pega.
- Com algo na mão, toque na geladeira, na fruteira ou no baú para guardar. O lugar certo brilha de leve.
- Toque na vovó ou no vovô: com a mão vazia, ganha um abraço; com algo na mão, entrega, e a pessoa leva até o lugar certo.
- A bolsinha (canto de baixo) guarda coisas para levar pela casa.
- Toque na própria Manu para soltar o que ela está segurando.
- Para sair, segure a casinha no canto por 1 segundo.

## Como o projeto está organizado

| Arquivo | O que faz |
|---|---|
| `index.html` | As telas (início, casa, ateliê) e a luz/sombra dos desenhos |
| `estilo.css` | A aparência e as animações |
| `js/falas.js` | **As falas da família** — é aqui que entram as gravações |
| `js/itens.js` | As coisas que dá para pegar |
| `js/casa.js` | Os desenhos da casa e onde fica cada coisa |
| `js/avatar.js` | Como as pessoas são desenhadas e as opções do ateliê |
| `js/editor.js` | O ateliê de personagem |
| `js/som.js` | Vozes, sons e o rádio |
| `js/jogo.js` | O motor: andar, pegar, guardar, reações, salvar |
| `audio/` | As gravações da família |
