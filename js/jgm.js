// Acabados e Inversiones J.G.M. · rediseño 16-nov-2026: cabecera, menú del móvil, apariciones suaves,
// paralaje leve del local, persiana de lamas del antes/después (la que le gustó al cliente) y formulario → WhatsApp.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- cabecera: sólida al bajar; menú del móvil ---------- */
  const cab = $('[data-cab]'), menu = $('[data-menu]');
  const solida = () => cab.classList.toggle('es-solida', scrollY > 40);
  solida(); addEventListener('scroll', solida, { passive: true });
  if (menu) {
    const txt = menu.querySelector('.cab__menu-txt');
    const pon = (abierto) => { cab.classList.toggle('menu-abierto', abierto); menu.setAttribute('aria-expanded', abierto); txt.textContent = abierto ? menu.dataset.cerrar : menu.dataset.abrir; };
    menu.addEventListener('click', () => pon(menu.getAttribute('aria-expanded') !== 'true'));
    $$('[data-nav] > a').forEach((a) => a.addEventListener('click', () => pon(false)));
    addEventListener('keydown', (e) => { if (e.key === 'Escape') pon(false); });
  }

  /* ---------- apariciones suaves al bajar ---------- */
  const rs = $$('[data-r]');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((es) => es.forEach((x) => { if (x.isIntersecting) { x.target.classList.add('visto'); io.unobserve(x.target); } }), { rootMargin: '0px 0px -10% 0px', threshold: .06 });
    rs.forEach((e) => io.observe(e));
  } else rs.forEach((e) => e.classList.add('visto'));

  /* ---------- paralaje leve en la foto del local ---------- */
  const local = $('.local__foto img');
  if (local && !reduce) {
    let pend = false;
    const mueve = () => {
      pend = false;
      const r = local.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const k = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;   // -1 … 1
      local.style.setProperty('--py', `${(-6 - k * 5).toFixed(2)}%`);
    };
    addEventListener('scroll', () => { if (!pend) { pend = true; requestAnimationFrame(mueve); } }, { passive: true });
    mueve();
  }

  /* ---------- antes y después: la persiana de lamas ---------- */
  const visor = $('[data-visor]');
  if (visor) {
    const N = 7;
    const rango = $('[data-p]', visor);
    const tabs = $$('[role="tab"]', visor);
    let actual = null, lamas = [], p = 1, anim = 0;

    const src = (pic) => { const i = pic.querySelector('img'); return i.currentSrc || i.src; };
    const listo = (img) => (img.complete && img.naturalWidth ? Promise.resolve() : new Promise((r) => { img.addEventListener('load', r, { once: true }); img.addEventListener('error', r, { once: true }); }));

    // reparte la foto entre las lamas: cada cara muestra su franja exacta
    function coloca() {
      if (!actual) return;
      const marco = $('[data-marco]', actual);
      const W = marco.clientWidth, H = marco.clientHeight;
      lamas.forEach((l) => {
        const x = l.offsetLeft;
        l.querySelectorAll('.lama__cara').forEach((c) => { c.style.backgroundSize = `${W}px ${H}px`; c.style.backgroundPosition = `${-x}px 0`; });
      });
    }
    function pinta() {
      // cada lama gira cuando la ola llega a ella; la ola cruza las 7 con solape
      lamas.forEach((l, i) => {
        const t = Math.min(1, Math.max(0, p * (N + 1.2) - i * 1.05));
        const e = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        l.style.setProperty('--f', e.toFixed(4));
      });
      if (actual) $('[data-marco]', actual).style.setProperty('--p', p);
      rango.value = Math.round(p * 100);
      rango.style.setProperty('--p', p);
    }
    async function monta(fig) {
      actual = fig;
      const marco = $('[data-marco]', fig);
      const capa = $('.persiana__lamas', fig);
      const pa = $('.persiana__antes', fig), pd = $('.persiana__despues', fig);
      // las fotos de la persiana se cargan ya (con loading=lazy dentro de un panel oculto no llegarían nunca)
      [pa, pd].forEach((x) => x.querySelector('img').loading = 'eager');
      await Promise.all([listo(pa.querySelector('img')), listo(pd.querySelector('img'))]);
      const ua = src(pa), ud = src(pd);
      capa.innerHTML = '';
      lamas = Array.from({ length: N }, () => {
        const l = document.createElement('div'); l.className = 'lama';
        l.innerHTML = `<div class="lama__cara lama__cara--antes" style="background-image:url('${ua}')"></div><div class="lama__cara lama__cara--despues" style="background-image:url('${ud}')"></div>`;
        capa.appendChild(l); return l;
      });
      coloca();
      marco.dataset.listo = '';
    }
    function ola(desde, hasta, ms) {
      cancelAnimationFrame(anim);
      if (reduce) { p = hasta; pinta(); return; }
      const t0 = performance.now();
      const paso = (now) => {
        const k = Math.min(1, (now - t0) / ms);
        p = desde + (hasta - desde) * (1 - Math.pow(1 - k, 3));
        pinta();
        if (k < 1) anim = requestAnimationFrame(paso);
      };
      anim = requestAnimationFrame(paso);
    }
    let visto = false;
    async function elige(id, animar) {
      tabs.forEach((b) => { const si = b.dataset.tab === id; b.setAttribute('aria-selected', si); b.tabIndex = si ? 0 : -1; });
      $$('.persiana', visor).forEach((f) => (f.hidden = f.dataset.obra !== id));
      await monta($(`.persiana[data-obra="${id}"]`, visor));
      if (animar) { p = 0; pinta(); ola(0, 1, 1700); } else { pinta(); }
    }
    tabs.forEach((b, i) => {
      b.addEventListener('click', () => { elige(b.dataset.tab, true); b.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduce ? 'auto' : 'smooth' }); });
      b.addEventListener('keydown', (e) => {
        const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (!d) return;
        e.preventDefault();
        const n = tabs[(i + d + tabs.length) % tabs.length]; n.focus(); n.click();
      });
    });
    rango.addEventListener('input', () => { cancelAnimationFrame(anim); p = rango.value / 100; pinta(); });
    // arrastrar sobre la foto mueve la ola
    let arrastre = null;
    visor.addEventListener('pointerdown', (e) => {
      const marco = e.target.closest('[data-marco]'); if (!marco) return;
      arrastre = marco.getBoundingClientRect(); cancelAnimationFrame(anim);
      marco.setPointerCapture(e.pointerId); mueve(e);
    });
    const mueve = (e) => { if (!arrastre) return; p = Math.min(1, Math.max(0, (e.clientX - arrastre.left) / arrastre.width)); pinta(); };
    visor.addEventListener('pointermove', mueve);
    visor.addEventListener('pointerup', () => (arrastre = null));
    visor.addEventListener('pointercancel', () => (arrastre = null));
    addEventListener('resize', coloca);

    elige(tabs[0].dataset.tab, false).then(() => {
      p = 0; pinta();
      const io = new IntersectionObserver((es) => {
        if (es.some((x) => x.isIntersecting) && !visto) { visto = true; ola(0, 1, 1900); io.disconnect(); }
      }, { threshold: .45 });
      io.observe($('[data-marco]', actual));
    });
  }

  /* ---------- formulario → WhatsApp ---------- */
  const f = $('[data-form]');
  if (f) {
    const err = $('[data-error]', f);
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const v = (n) => (f.elements[n]?.value || '').trim();
      const tipo = (f.querySelector('input[name="tipo"]:checked') || {}).value || '';
      const cuando = (f.querySelector('input[name="cuando"]:checked') || {}).value || '';
      if (!tipo || v('lugar').length < 2) { err.hidden = false; return; }
      err.hidden = true;
      const txt = f.dataset.plantilla.replace('{tipo}', tipo).replace('{lugar}', v('lugar')).replace('{cuando}', cuando).replace('{nombre}', v('nombre') || '—');
      window.open(`https://wa.me/${f.dataset.tel}?text=${encodeURIComponent(txt)}`, '_blank', 'noopener');
    });
  }

  /* móvil: la barra de WhatsApp aparece cuando los botones de la portada ya no se ven */
  const barra = $('.barra'), acciones = $('.portada__acciones');
  if (barra && acciones && 'IntersectionObserver' in window) {
    new IntersectionObserver((es) => barra.classList.toggle('es-visible', !es[0].isIntersecting)).observe(acciones);
  } else if (barra) barra.classList.add('es-visible');

  const anio = $('[data-anio]'); if (anio) anio.textContent = new Date().getFullYear();
})();
