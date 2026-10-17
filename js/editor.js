/* =========================================================
   editor.js — O ATELIÊ DE PERSONAGEM

   Funciona assim:
   1. Ao abrir, guarda uma cópia da ficha (para poder desistir).
   2. Cada toque numa opção muda UM campo da ficha.
   3. Depois de cada mudança, tudo é desenhado de novo:
      a prévia grande e as miniaturas (que mostram a personagem
      já com cada opção, como num provador).
   4. "Pronto" entrega a ficha nova; "Voltar" devolve a cópia.
   ========================================================= */
const Editor = (() => {
  const ICONES = {
    pele: '<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 0 0 16z" fill="currentColor" stroke="none"/>',
    cabelo: '<path d="M5 15c-1-6 2-11 7-11s8 5 7 11"/><path d="M8 14c0-3 1.5-5 4-5s4 2 4 5"/><circle cx="5" cy="5" r="2.5"/><circle cx="19" cy="5" r="2.5"/>',
    enfeite: '<path d="M12 12 5 7v10zM12 12l7-5v10z"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/>',
    olhos: '<path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    boca: '<path d="M6 10c2 5 10 5 12 0z"/>',
    oculos: '<circle cx="7" cy="13" r="4"/><circle cx="17" cy="13" r="4"/><path d="M11 13h2M3 13 2 9M21 13l1-4"/>',
    roupa: '<path d="M9 3 5 6l2 3 1-1v3l-4 9h16l-4-9V8l1 1 2-3-4-3c0 2-1.5 3-3 3S9 5 9 3z"/>',
    barba: '<path d="M12 11c-3-3-7-2-9 1 3-1 6 0 9 1 3-1 6-2 9-1-2-3-6-4-9-1z"/><path d="M6 15c1 4 4 6 6 6s5-2 6-6"/>',
    sapatos: '<path d="M3 15c0-3 1-7 3-7l2 3c2 1 6 1 9 2s4 2 4 4H3z"/><path d="M3 18h18"/>',
  };

  let ficha, copia, abaAtual = "cabelo", aoTerminar = null;
  const $ = id => document.getElementById(id);

  function abrir(fichaAtual, terminar, titulo = "Montar a Manu") {
    document.getElementById("editor-titulo").textContent = titulo;
    copia = { ...fichaAtual };
    ficha = { ...fichaAtual };
    aoTerminar = terminar;
    $("editor").hidden = false;
    desenharAbas();
    desenharTudo();
  }

  function fechar(salvar) {
    $("editor").hidden = true;
    pararSons();
    if (aoTerminar) aoTerminar(salvar ? ficha : copia, salvar);
  }

  function desenharAbas() {
    $("abas").innerHTML = CATEGORIAS.map(c => `
      <button type="button" class="aba" role="tab" id="aba-${c.id}" data-aba="${c.id}" aria-selected="${c.id === abaAtual}">
        <svg viewBox="0 0 24 24" aria-hidden="true">${ICONES[c.id]}</svg><span>${c.nome}</span>
      </button>`).join("");
  }

  function desenharTudo() {
    $("previa").setAttribute("viewBox", recorteDe("inteira", ficha));
    $("previa").innerHTML = desenharAvatar(ficha);
    const cat = CATEGORIAS.find(c => c.id === abaAtual);

    // linha de cores (quando a aba tem cores)
    const cores = $("cores");
    cores.hidden = !cat.cores;
    cores.classList.toggle("grandes", !cat.opcoes);
    if (cat.cores) {
      cores.innerHTML = PALETAS[cat.cores].map((cor, i) => `
        <button type="button" class="cor" data-cor="${cor}" style="--c:${cor}" aria-label="Cor ${i + 1}"
          aria-pressed="${ficha[cat.cores] === cor}"></button>`).join("");
    }

    // grade de miniaturas (quando a aba tem modelos)
    const grade = $("opcoes");
    grade.hidden = !cat.opcoes;
    if (cat.opcoes) {
      grade.innerHTML = Object.entries(cat.opcoes).map(([id, op]) => `
        <button type="button" class="opcao" data-opcao="${id}" aria-label="${op.nome}" title="${op.nome}"
          aria-pressed="${ficha[cat.id] === id}">
          <svg viewBox="${recorteDe(cat.recorte, ficha)}" aria-hidden="true">${desenharAvatar({ ...ficha, [cat.id]: id }, { sombra: false })}</svg>
          <span class="marca" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m6 12 4 4 8-8"/></svg></span>
        </button>`).join("");
    }
  }

  function comemorar() {
    const v = $("vitrine");
    v.classList.remove("pulou");
    void v.offsetWidth;
    v.classList.add("pulou");
    pop();
  }

  function iniciar() {
    $("abas").addEventListener("click", e => {
      const b = e.target.closest(".aba");
      if (!b) return;
      abaAtual = b.dataset.aba;
      plim();
      desenharAbas();
      desenharTudo();
      $("painel-rolagem").scrollTop = 0;
      b.scrollIntoView({ inline: "nearest", block: "nearest", behavior: "smooth" });
    });

    $("cores").addEventListener("click", e => {
      const b = e.target.closest(".cor");
      if (!b) return;
      const cat = CATEGORIAS.find(c => c.id === abaAtual);
      ficha[cat.cores] = b.dataset.cor;
      desenharTudo();
      comemorar();
    });

    $("opcoes").addEventListener("click", e => {
      const b = e.target.closest(".opcao");
      if (!b) return;
      ficha[abaAtual] = b.dataset.opcao;
      const rolagem = $("painel-rolagem").scrollTop;
      desenharTudo();
      $("painel-rolagem").scrollTop = rolagem;
      comemorar();
    });

    $("sortear").addEventListener("click", () => {
      ficha = fichaSorteada(ficha.adulto);
      desenharTudo();
      comemorar();
      sininho();
    });

    $("pronto").addEventListener("click", () => {
      falarTexto("Que bonito!", "mae");
      fechar(true);
    });
    $("desistir").addEventListener("click", () => fechar(false));
  }

  return { abrir, iniciar };
})();
