# Pasta das vozes

Coloque aqui as gravações da mãe e do pai (um arquivo por fala, em .mp3 ou .m4a).

Depois, no `index.html`, procure a lista `CENA` e troque `arquivo: null`
pelo caminho do arquivo. Exemplo:

    { texto: "Oi, Manu!", voz: "mae", arquivo: "audio/oi_manu.mp3" }

Enquanto o campo estiver `null`, o jogo usa a voz do celular para ler o texto.
