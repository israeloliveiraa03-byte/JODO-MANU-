# A Casa da Vovó

Um jogo calmo de casinha, feito para a Manu e, depois, para os primos. A casa é a da vovó, as pessoas são da família de verdade, e as vozes são as delas.

## A ideia em uma frase

A criança passeia pela casa da vovó, pega coisas, guarda cada coisa no seu lugar e conversa com a família, sem pressa, sem pontos e sem perder.

## Para quem

- Primeiro: a Manu (2 anos e meio), jogando com um adulto do lado.
- Depois: primos e primas, cada um no seu celular, numa sala fechada que só a família acessa.

## Princípios

1. **Pouco estímulo.** Cores suaves, movimentos lentos, sons baixinhos. Nada pisca, nada corre atrás da criança, não há contador, moeda, prêmio ou "fase".
2. **Nada dá errado.** Não existe erro. Se a bola for parar na geladeira, a vovó acha graça e pronto.
3. **A família é a voz do jogo.** Toda fala pode ser trocada pela gravação da pessoa real.
4. **O mundo lembra.** O que a criança guardou continua guardado quando ela voltar.
5. **Brincar junto.** O jogo é feito para ser jogado no colo, com conversa.

## A casa

A casa aparece "em corte", como uma casinha de bonecas aberta. A criança toca no chão e a personagem anda até lá.

| Cômodo | O que tem | O que dá para fazer |
|---|---|---|
| Quintal | Mangueira, horta, galinha, laguinho com pato, passarinhos, o cachorro Caramelo | Sacudir a árvore e a fruta cai; puxar cenoura; a galinha bota ovo; jogar a bola para o Caramelo buscar |
| Sala | Sofá, rádio, baú de brinquedos, gato, retratos da família | Guardar brinquedos no baú; ligar o rádio; acordar o gato |
| Cozinha | Geladeira, fogão com panela, pia, filtro de barro, mesa com fruteira | Guardar comida na geladeira; pôr fruta na fruteira; lavar a fruta na pia |
| Quarto | Cama com colcha de crochê, abajur, ursinho | Hora da soneca; acender e apagar o abajur |

## O que a criança aprende brincando

- **Nomes das coisas.** Ao pegar um objeto, uma voz diz o nome dele ("Manga!").
- **Cada coisa no seu lugar.** Comida na geladeira, fruta na fruteira, brinquedo no baú.
- **Contar.** Quando uma fruta vai para a fruteira, a vovó conta quantas tem.
- **Cuidado e higiene.** Lavar a fruta antes de comer; o fogão "tá quentinho".
- **Afeto e convivência.** Abraçar, entregar coisas, ouvir histórias da família.

A vovó também **mostra como se faz**: quando a criança entrega algo para ela, ela mesma leva até o lugar certo e guarda, falando o que está fazendo.

## Personagens

São pessoas reais da família, montadas no ateliê de personagem (pele, cabelo, roupa, óculos, bigode…).

- Manu (a jogadora)
- Vovó, que fica mais na cozinha
- Vovô, que fica mais no quintal
- Depois: tios, tias, irmãos, primos

## As falas da família

Cada pessoa grava pequenas falas pelo celular e envia. Elas entram no arquivo `js/falas.js`, organizadas por momento:

| Momento | Exemplos |
|---|---|
| Quando a criança chega perto | "Oi, minha netinha!" |
| Abraço | "Que abraço gostoso!" |
| Recebe uma comida | "Hum, que manga bonita!" |
| Recebe um brinquedo | "Vamos guardar no baú?" |
| Coisa no lugar "errado" | "Bola na geladeira? Que engraçado!" |
| Contar | "Agora tem três frutas!" |
| Reações | risada, "Uau!", "Ai, que lindo!" |

Enquanto a gravação não chega, a voz do celular lê o texto. Quando o arquivo chega, basta escrever o nome dele ao lado da fala.

## Próxima etapa: a sala dos primos

Para que várias crianças joguem juntas na mesma casa, o jogo precisa de um servidor que repasse, em tempo real, onde cada uma está e o que pegou. A proposta:

- **Sala fechada.** A sala é criada por você e tem um código. Ninguém entra só por ter o link.
- **Aprovação dos pais.** Cada celular novo precisa ser aprovado por você (ou por outro adulto escolhido) antes de entrar.
- **Sem conversa escrita.** As crianças não digitam nada. Elas se comunicam pelas ações e por reações prontas (acenar, abraçar, rir).
- **Poucos dados.** Só o apelido e o boneco de cada criança; nenhuma foto, endereço ou idade.
- **Horário.** Os pais podem definir quando a sala fica aberta.

Serviços com plano gratuito que fazem isso bem: Firebase (Google) ou Supabase. Para seguir, é preciso escolher um deles e criar uma conta em nome da família.

## O que já existe

- A casa com quatro cômodos, câmera que acompanha a personagem, toque para andar.
- Pegar, carregar, soltar e guardar objetos (geladeira, fruteira, baú e a bolsinha).
- Vovó e vovô com reações, abraço, e a vovó guardando o que recebe.
- Ateliê para montar cada pessoa da família.
- O mundo fica salvo no celular.
- Sons feitos pelo próprio navegador: bichos (gato, cachorro, galinha, galo, pato, passarinhos, coruja, grilos)
  e coisas (pegar, cair, guardar, porta da geladeira, tampa do baú, zíper da bolsinha, passos, água, panela).
- Quintal maior, com o Caramelo, que busca a bola, o pato no laguinho e passarinhos na cerca.
- Dia e noite: de noite, lua, estrelas, coruja e grilos; a família dá boa-noite e a vovó conta historinhas; a galinha faz amanhecer.
- Tela cheia que volta sozinha e botão "voltar" do celular travado, para a criança não sair sem querer.
