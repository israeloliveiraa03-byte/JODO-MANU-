# Jogo da Manu — A Casa de Todas as Histórias

Jogo de casinha para a Manu (2 anos), feito para o celular, com as vozes reais da mãe e do pai.

**Jogar:** https://israeloliveiraa03-byte.github.io/JODO-MANU-/

## O que tem agora

- **Montar a Manu**: ateliê para montar a personagem (pele, cabelo, enfeite, olhos, boca, óculos, roupa e sapatos).
  A escolha fica guardada no celular.
- **O quarto**: seis coisas para tocar (a Manu, o gato, o bolo, a cama, a caixa surpresa e a janela).
  Cada toque faz o objeto se mexer e dizer uma fala. Não existe erro: tocar em qualquer lugar solta confetes.
- Para sair do quarto, segure a casinha no canto da tela por 1 segundo.

## Como o projeto está organizado

| Arquivo | O que faz |
|---|---|
| `index.html` | O esqueleto: as três telas (início, quarto, ateliê) e a luz/sombra dos desenhos |
| `estilo.css` | A aparência: cores, botões, animações |
| `js/som.js` | Os sons e as vozes |
| `js/avatar.js` | Como a personagem é desenhada e todas as opções do ateliê |
| `js/editor.js` | O ateliê de personagem |
| `js/cena.js` | Os desenhos do quarto |
| `js/jogo.js` | O que acontece em cada toque, e as falas (lista `CENA`) |
| `audio/` | Onde entram as gravações da família |

Para mudar ou acrescentar falas, mexa na lista `CENA`, no começo de `js/jogo.js`.
Para acrescentar uma opção nova no ateliê (um penteado, uma roupa), acrescente um item em `js/avatar.js`.

## Dica

No celular, abra o link e use "Adicionar à tela inicial": o jogo passa a abrir em tela cheia, como um app.
