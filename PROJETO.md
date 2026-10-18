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
| Quintal | Umbuzeiro, rede, roça de milho, horta, açude com pato, cisterna, mandacaru, lajedo com calango, cabrita, galinha, asa-branca e galo-de-campina, o cachorro Caramelo | Sacudir o umbuzeiro e o umbu cai; balançar a rede; puxar cenoura; a galinha bota ovo; jogar a bola para o Caramelo buscar |
| Sala | Sofá com almofadas de chita, rádio, baú, gato, retratos, chapéu de couro do vovô | Guardar brinquedos no baú; ligar o rádio (baião); acordar o gato |
| Cozinha | Geladeira, fogão a lenha com panela de barro, potes de barro, pia, filtro de barro, mesa com fruteira | Guardar comida na geladeira; pôr fruta na fruteira; lavar a fruta na pia |
| Quarto | Cama com colcha de crochê, abajur, ursinho | Hora da soneca; acender e apagar o abajur |

## Identidade: a caatinga

A casa da vovó fica no sertão nordestino, e o jogo mostra a caatinga como ela é: um bioma que só existe no Brasil,
de céu aberto, sol forte, chão de terra clara e plantas que sabem guardar água.

| Elemento | Onde aparece | O que ensina |
|---|---|---|
| Mandacaru, xique-xique, coroa-de-frade | Quintal e paisagem | Cactos guardam água; "quando o mandacaru flora, a chuva chega" |
| Umbuzeiro e umbu | A árvore do quintal | A árvore que guarda água nas raízes e dá fruta na seca |
| Ipê-amarelo, arbustos secos e verdes | Paisagem ao fundo | A caatinga muda de cor com a chuva |
| Serras, lajedos, açude, cisterna | Fundo e quintal | Como o sertão guarda a água da chuva |
| Asa-branca, galo-de-campina, calango, cabrita | Bichos do quintal | Os bichos da região e os seus sons |
| Casa caiada com barrado, cimento queimado, fogão a lenha, potes de barro, chita, rede, chapéu de couro | Dentro da casa | O jeito da casa de vó do interior |
| Baião no rádio; "oxente", "arretado", "minha fulô" | Sons e falas | A música e o falar nordestino |

## O que a criança aprende brincando

- **Nomes das coisas.** Ao pegar um objeto, uma voz diz o nome dele ("Manga!").
- **Cada coisa no seu lugar.** Comida na geladeira, fruta na fruteira, brinquedo no baú.
- **Contar.** Quando uma fruta vai para a fruteira, a vovó conta quantas tem. Cada pulo também é contado.
- **O próprio corpo.** Agachar e levantar, pular, deitar e acordar: "em cima" e "embaixo", imitando a Manu.
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
- Visual mais suave e com profundidade: luz fosca, móveis com tampo e lateral, raios de sol, céu e morros que
  andam mais devagar e plantas na frente que andam mais rápido (paralaxe).
- Coisas que abrem e fecham com som: congelador com picolé, forno com bolo, armário da pia, guarda-roupa com
  roupas para vestir, janelas com cortina ao vento e porta da frente automática.
- **Cenário em 3D**: casa em corte com perspectiva de verdade, móveis com volume e sombreamento de desenho,
  sol com sombras, nuvens e morros ao fundo, jardim na frente, lâmpadas que acendem à noite e vaga-lumes.
  Portas, tampas e janelas giram nas dobradiças. As pessoas e os bichos continuam em 2D por cima da cena.
- Movimentos do corpo: agachar, pular (com a contagem dos pulos, e a família pulando junto) e deitar na cama
  para dormir. São movimentos que a criança imita de verdade, no chão, enquanto brinca.
- **Identidade da caatinga** em todo o cenário, nos bichos, nos sons (baião, cabrita, calango, asa-branca)
  e nas falas da família (veja a seção acima).
- Emoções: as pessoas piscam, olham para o que acontece e mudam o rosto (alegre, rindo, surpresa, carinho,
  sono, curiosa, atenta) conforme a brincadeira; dançam com o rádio e bocejam de noite.
