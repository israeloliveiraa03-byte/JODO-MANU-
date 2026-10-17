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
- No quintal: o Caramelo (cachorro) busca a bola se a Manu estiver com ela; o pato nada; os passarinhos voam.
- O sol/lua no canto de cima traz a noite: a família dá boa-noite, a vovó conta historinha, a coruja aparece.
  A cama também faz a noite chegar, e a galinha faz amanhecer.
- O botão de tela cheia esconde a barra do navegador. Se a criança sair dela sem querer, o próximo toque volta.
  O botão "voltar" do celular não tira ninguém da casa.
- Muita coisa abre e fecha, com som: geladeira e congelador (tem picolé), forno (tem bolo), armário da pia,
  guarda-roupa (tocar numa roupa veste a Manu), baú, janelas e a porta da frente, que abre sozinha.
- As pessoas sentem: piscam, olham para as coisas, ficam surpresas, riem, fazem carinho, bocejam de noite
  e dançam quando o rádio toca.
- Para sair, segure a casinha no canto por 1 segundo.

**Dica para travar o celular:** no Android, use "Fixar app" (Configurações → Segurança). No iPhone, onde a tela cheia
não existe para sites, use "Acesso Guiado" (Ajustes → Acessibilidade → Acesso Guiado) e clique três vezes no botão lateral.

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
| `js/som.js` | Vozes, sons dos bichos e das coisas (feitos pelo próprio navegador) e o rádio |
| `js/jogo.js` | O motor: andar, pegar, guardar, reações, salvar |
| `audio/` | As gravações da família |
