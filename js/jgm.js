// Acabados e Inversiones J.G.M. · rediseño 16/17-nov-2026
// Titulares que entran línea a línea (como Loam), apariciones suaves, paralaje leve, portada con varias fotos,
// obras con ficha editorial y visor a pantalla completa, persiana de lamas del antes/después y formulario → WhatsApp.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js-ok');
  const esc =(s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

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

  /* ---------- titulares partidos en líneas ---------- */
  const titulares = $$('[data-lineas]');
  function parte(el) {
    if (!el.dataset.orig) el.dataset.orig = el.innerHTML; else el.innerHTML = el.dataset.orig;
    const palabras = [];
    const recorre = (nodo, it) => nodo.childNodes.forEach((n) => {
      if (n.nodeType === 3) n.textContent.split(/\s+/).forEach((w) => { if (w) palabras.push({ t: w, it }); });
      else if (n.nodeType === 1) recorre(n, it || n.tagName === 'EM');
    });
    recorre(el, false);
    const html = (w) => (w.it ? `<em>${esc(w.t)}</em>` : esc(w.t));
    el.innerHTML = palabras.map((w) => `<span class="pal">${html(w)}</span>`).join(' ');
    const lineas = []; let arriba = null;
    $$('.pal', el).forEach((p, i) => { const y = p.offsetTop; if (arriba === null || Math.abs(y - arriba) > 3) { lineas.push([]); arriba = y; } lineas.at(-1).push(palabras[i]); });
    el.innerHTML = lineas.map((ws, l) => `<span class="linea" style="--l:${l}"><span>${ws.map(html).join(' ')}</span></span>`).join('');
    el.classList.add('partido');
  }
  const parteTodo = () => titulares.forEach(parte);
  let partidos = false;
  const alPartir = () => {
    if (partidos) return; partidos = true;
    parteTodo();
    observa(titulares);
  };
  // se parte con las letras ya cargadas (si no, las líneas salen con las medidas de la letra de reserva)
  const cargas = document.fonts && document.fonts.load
    ? Promise.all(['300 40px Cormorant', 'italic 300 40px Cormorant', '400 16px "DM Sans"'].map((f) => document.fonts.load(f))).catch(() => {})
    : Promise.resolve();
  cargas.then(() => (document.fonts ? document.fonts.ready : null)).then(alPartir);
  setTimeout(alPartir, 2500);
  let ancho = innerWidth, tRes = 0;
  addEventListener('resize', () => { clearTimeout(tRes); tRes = setTimeout(() => { if (Math.abs(innerWidth - ancho) > 40) { ancho = innerWidth; parteTodo(); } }, 250); });

  /* ---------- apariciones al bajar ---------- */
  function observa(els) {
    if (!('IntersectionObserver' in window) || reduce) { els.forEach((e) => e.classList.add('visto')); return; }
    const io = new IntersectionObserver((es) => es.forEach((x) => { if (x.isIntersecting) { x.target.classList.add('visto'); io.unobserve(x.target); } }), { rootMargin: '0px 0px -10% 0px', threshold: .05 });
    els.forEach((e) => io.observe(e));
  }

  observa($$('[data-r]'));   // los bloques aparecen sin esperar a las letras

  /* ---------- paralaje leve en las fotos a sangre ---------- */
  // solo en ordenador: en el móvil el paralaje hace el scroll menos fluido
  const paras = matchMedia('(min-width: 801px) and (pointer: fine)').matches ? $$('[data-paralaje] img') : [];
  if (paras.length && !reduce) {
    let pend = false;
    const mueve = () => {
      pend = false;
      paras.forEach((im) => {
        const r = im.parentElement.closest('[data-paralaje]').getBoundingClientRect();
        if (r.bottom < -100 || r.top > innerHeight + 100) return;
        const k = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
        im.style.setProperty('--py', `${(-7 - k * 6).toFixed(2)}%`);
      });
    };
    addEventListener('scroll', () => { if (!pend) { pend = true; requestAnimationFrame(mueve); } }, { passive: true });
    mueve();
  }

  /* ---------- portada: pasa entre sus mejores fotos (las demás se cargan después de la primera) ---------- */
  const portada = $('[data-portada]'), cuenta = $('[data-cuenta]');
  if (portada && !reduce) {
    const diapos = $$('.portada__diapo', portada);
    // solo se descarga la siguiente foto, y cuando la página ya ha cargado (no compite con lo que se ve)
    const carga = (d) => { if (!d || !d.hasAttribute('data-diapo')) return; d.querySelectorAll('source').forEach((so) => { so.srcset = so.dataset.srcset; }); const im = d.querySelector('img'); im.src = im.dataset.src; d.removeAttribute('data-diapo'); };
    const empieza = () => setTimeout(() => carga(diapos[1]), 3000);
    if (document.readyState === 'complete') empieza(); else addEventListener('load', empieza, { once: true });
    let n = 0;
    setInterval(() => {
      if (document.hidden || scrollY > innerHeight) return;
      const sig = diapos[(n + 1) % diapos.length], im = sig.querySelector('img');
      if (!im.complete || !im.naturalWidth) { carga(sig); return; }
      diapos[n].classList.remove('es-actual'); n = (n + 1) % diapos.length; sig.classList.add('es-actual');
      carga(diapos[(n + 1) % diapos.length]);
      if (cuenta) cuenta.textContent = String(n + 1).padStart(2, '0');
    }, 6500);
  }

  /* ---------- fotos con avance borroso: fundido suave al llegar ---------- */
  $$('[data-lqip] img').forEach((im) => {
    const ya = () => im.classList.add('cargada');
    if (im.complete && im.naturalWidth) ya(); else { im.addEventListener('load', ya, { once: true }); im.addEventListener('error', ya, { once: true }); }
  });

  /* ---------- obras: filtros, ficha de obra y visor ---------- */
  const lista = $('[data-obras]'), ficha = $('[data-ficha]'), caja = $('[data-caja]');
  const datosEl = $('#datos-obras');
  if (ficha && datosEl) {
    // los datos de las fichas (todas las fotos) se piden aparte: al abrir una obra, o cuando la página ya está tranquila
    let D = null;
    const datos = () => (D ? Promise.resolve(D) : fetch(datosEl.dataset.url).then((r) => r.json()).then((j) => (D = j)));
    addEventListener('load', () => setTimeout(() => datos().catch(() => {}), 4000), { once: true });
    const filtros = $$('.filtro');
    filtros.forEach((b) => b.addEventListener('click', () => {
      const c = b.dataset.cat;
      filtros.forEach((x) => x.setAttribute('aria-pressed', x === b));
      lista.classList.toggle('filtrada', c !== 'todo');
      $$('.obra', lista).forEach((li) => { const si = c === 'todo' || li.dataset.cat === c; li.hidden = !si; if (si) li.classList.add('visto'); });
    }));

    const cuerpo = $('[data-ficha-cuerpo]', ficha);
    const pon = (sel, txt) => { const e = $(sel, ficha); if (e) e.textContent = txt; };
    let actual = null, desde = null, ioF = null;
    const srcImg = (f, sizes) => `srcset="${f.s}" sizes="${sizes}" src="${f.j}"`;
    function pinta(id) {
      const p = D.obras.find((x) => x.id === id); if (!p) return;
      actual = p;
      const im = $('[data-ficha-portada]', ficha);
      im.removeAttribute('src'); im.srcset = p.fotos[0].s; im.sizes = '100vw'; im.src = p.fotos[0].j; im.alt = p.t;
      pon('[data-ficha-cat]', p.cat); pon('[data-ficha-t]', p.t); pon('[data-ficha-mini]', p.t);
      pon('[data-ficha-lugar]', p.lugar); $('[data-fila-lugar]', ficha).hidden = !p.lugar;
      pon('[data-ficha-tipo]', p.cat); pon('[data-ficha-of]', p.of.join(' · ')); $('[data-fila-of]', ficha).hidden = !p.of.length;
      pon('[data-ficha-n]', String(p.fotos.length));
      // fotos: apaisadas a todo el ancho, verticales por parejas; una vertical suelta, centrada
      const resto = p.fotos.map((f, i) => ({ ...f, i })).slice(1);
      const items = []; let par = [];
      const suelta = () => { if (par.length === 1) items.push({ f: par[0], c: 'sola' }); else par.forEach((f) => items.push({ f, c: '' })); par = []; };
      resto.forEach((f) => { if (f.w > f.h * 1.05) { suelta(); items.push({ f, c: 'ancha' }); } else { par.push(f); if (par.length === 2) suelta(); } });
      suelta();
      const ul = $('[data-ficha-fotos]', ficha);
      ul.innerHTML = items.map(({ f, c }) => `<li class="${c}"><button type="button" data-f="${f.i}" aria-label="${esc(D.ampliar)} · ${f.i + 1}/${p.fotos.length}"><img ${srcImg(f, c === 'ancha' ? '(min-width: 1400px) 1320px, 100vw' : '(min-width: 900px) 50vw, 100vw')} alt="${esc(p.t)} · ${f.i + 1}" loading="lazy" decoding="async"></button></li>`).join('');
      if (ioF) ioF.disconnect();
      if ('IntersectionObserver' in window && !reduce) {
        ioF = new IntersectionObserver((es) => es.forEach((x) => { if (x.isIntersecting) { x.target.classList.add('visto'); ioF.unobserve(x.target); } }), { root: cuerpo, rootMargin: '0px 0px -6% 0px' });
        $$('li', ul).forEach((li) => ioF.observe(li));
      } else $$('li', ul).forEach((li) => li.classList.add('visto'));
      const k = D.obras.indexOf(p), sig = D.obras[(k + 1) % D.obras.length];
      pon('[data-ficha-sig-t]', sig.t); $('[data-ficha-sig]', ficha).dataset.id = sig.id;
      cuerpo.scrollTop = 0; ficha.classList.remove('con-scroll');
    }
    function abre(id, boton) {
      desde = boton || null;
      datos().then(() => {
        pinta(id);
        if (!ficha.open) { ficha.showModal(); document.body.classList.add('sin-scroll'); }
      });
    }
    $$('[data-obra-abrir]').forEach((b) => b.addEventListener('click', () => abre(b.dataset.obraAbrir, b)));
    $$('[data-ficha-cerrar]', ficha).forEach((b) => b.addEventListener('click', () => ficha.close()));
    $('[data-ficha-sig]', ficha).addEventListener('click', (e) => pinta(e.currentTarget.dataset.id));
    ficha.addEventListener('close', () => { document.body.classList.remove('sin-scroll'); desde?.focus(); });
    cuerpo.addEventListener('scroll', () => ficha.classList.toggle('con-scroll', cuerpo.scrollTop > 320), { passive: true });

    // visor a pantalla completa de las fotos de la obra
    const img = $('[data-caja-img]', caja), num = $('[data-caja-n]', caja);
    let i = 0, x0 = null;
    const pintaCaja = () => {
      const f = actual.fotos[i];
      img.removeAttribute('src'); img.srcset = f.s; img.sizes = '(min-width: 900px) 80vw, 100vw'; img.src = f.j;
      img.alt = `${actual.t} · ${i + 1}`; num.textContent = `${actual.t} · ${i + 1} ${D.de} ${actual.fotos.length}`;
    };
    const mueve = (d) => { i = (i + d + actual.fotos.length) % actual.fotos.length; pintaCaja(); };
    $('[data-ficha-fotos]', ficha).addEventListener('click', (e) => { const b = e.target.closest('[data-f]'); if (!b) return; i = +b.dataset.f; pintaCaja(); caja.showModal(); });
    $('[data-ficha-portada]', ficha).addEventListener('click', () => { i = 0; pintaCaja(); caja.showModal(); });
    $('[data-caja-ant]', caja).addEventListener('click', () => mueve(-1));
    $('[data-caja-sig]', caja).addEventListener('click', () => mueve(1));
    $('[data-caja-cerrar]', caja).addEventListener('click', () => caja.close());
    caja.addEventListener('click', (e) => { if (e.target === caja || e.target.classList.contains('caja__foto')) caja.close(); });
    caja.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') mueve(1); if (e.key === 'ArrowLeft') mueve(-1); });
    img.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    img.addEventListener('touchend', (e) => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) mueve(dx < 0 ? 1 : -1); x0 = null; });
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
    function coloca() {
      if (!actual) return;
      const marco = $('[data-marco]', actual);
      const W = marco.clientWidth, H = marco.clientHeight;
      lamas.forEach((l) => { const x = l.offsetLeft; l.querySelectorAll('.lama__cara').forEach((c) => { c.style.backgroundSize = `${W}px ${H}px`; c.style.backgroundPosition = `${-x}px 0`; }); });
    }
    function pinta() {
      lamas.forEach((l, i) => {
        const t = Math.min(1, Math.max(0, p * (N + 1.2) - i * 1.05));
        const e = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        l.style.setProperty('--f', e.toFixed(4));
      });
      if (actual) $('[data-marco]', actual).style.setProperty('--p', p);
      rango.value = Math.round(p * 100); rango.style.setProperty('--p', p);
    }
    async function monta(fig) {
      actual = fig;
      const marco = $('[data-marco]', fig), capa = $('.persiana__lamas', fig);
      const pa = $('.persiana__antes', fig), pd = $('.persiana__despues', fig);
      [pa, pd].forEach((x) => (x.querySelector('img').loading = 'eager'));
      await Promise.all([listo(pa.querySelector('img')), listo(pd.querySelector('img'))]);
      const ua = src(pa), ud = src(pd);
      capa.innerHTML = '';
      lamas = Array.from({ length: N }, () => {
        const l = document.createElement('div'); l.className = 'lama';
        l.innerHTML = `<div class="lama__cara lama__cara--antes" style="background-image:url('${ua}')"></div><div class="lama__cara lama__cara--despues" style="background-image:url('${ud}')"></div>`;
        capa.appendChild(l); return l;
      });
      coloca(); marco.dataset.listo = '';
    }
    function ola(desde, hasta, ms) {
      cancelAnimationFrame(anim);
      if (reduce) { p = hasta; pinta(); return; }
      const t0 = performance.now();
      const paso = (now) => { const k = Math.min(1, (now - t0) / ms); p = desde + (hasta - desde) * (1 - Math.pow(1 - k, 3)); pinta(); if (k < 1) anim = requestAnimationFrame(paso); };
      anim = requestAnimationFrame(paso);
    }
    let visto = false;
    async function elige(id, animar) {
      tabs.forEach((b) => { const si = b.dataset.tab === id; b.setAttribute('aria-selected', si); b.tabIndex = si ? 0 : -1; });
      $$('.persiana', visor).forEach((f) => (f.hidden = f.dataset.obra !== id));
      await monta($(`.persiana[data-obra="${id}"]`, visor));
      if (animar) { p = 0; pinta(); ola(0, 1, 1700); } else pinta();
    }
    tabs.forEach((b, i) => {
      b.addEventListener('click', () => { elige(b.dataset.tab, true); b.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduce ? 'auto' : 'smooth' }); });
      b.addEventListener('keydown', (e) => { const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]; if (!d) return; e.preventDefault(); const n = tabs[(i + d + tabs.length) % tabs.length]; n.focus(); n.click(); });
    });
    rango.addEventListener('input', () => { cancelAnimationFrame(anim); p = rango.value / 100; pinta(); });
    let arrastre = null;
    visor.addEventListener('pointerdown', (e) => { const marco = e.target.closest('[data-marco]'); if (!marco) return; arrastre = marco.getBoundingClientRect(); cancelAnimationFrame(anim); marco.setPointerCapture(e.pointerId); mueveP(e); });
    const mueveP = (e) => { if (!arrastre) return; p = Math.min(1, Math.max(0, (e.clientX - arrastre.left) / arrastre.width)); pinta(); };
    visor.addEventListener('pointermove', mueveP);
    visor.addEventListener('pointerup', () => (arrastre = null));
    visor.addEventListener('pointercancel', () => (arrastre = null));
    addEventListener('resize', coloca);
    // la persiana se prepara cuando el antes/después se acerca (sus fotos no compiten con la portada)
    const arranca = () => elige(tabs[0].dataset.tab, false).then(() => {
      p = 0; pinta();
      const io = new IntersectionObserver((es) => { if (es.some((x) => x.isIntersecting) && !visto) { visto = true; ola(0, 1, 1900); io.disconnect(); } }, { threshold: .45 });
      io.observe($('[data-marco]', actual));
    });
    if ('IntersectionObserver' in window) {
      const cerca = new IntersectionObserver((es) => { if (es.some((x) => x.isIntersecting)) { cerca.disconnect(); arranca(); } }, { rootMargin: '700px 0px' });
      cerca.observe(visor);
    } else arranca();
  }

  /* ---------- vídeo: la imagen de portada se carga al acercarse ---------- */
  $$('video[data-poster]').forEach((v) => {
    const pon = () => { v.poster = v.dataset.poster; v.removeAttribute('data-poster'); };
    if (!('IntersectionObserver' in window)) return pon();
    const io = new IntersectionObserver((es) => { if (es.some((x) => x.isIntersecting)) { io.disconnect(); pon(); } }, { rootMargin: '800px 0px' });
    io.observe(v);
  });

  /* ---------- formulario → correo del cliente (FormSubmit) ----------
     17-nov: las solicitudes llegan a su correo, en castellano, con el correo del visitante como «responder a».
     Si FormSubmit falla (o aún no está activado), se abre el correo del visitante con la solicitud escrita. */
  const f = $('[data-form]');
  if (f) {
    const err = $('[data-error]', f), ok = $('[data-ok]', f), btn = $('button[type="submit"]', f), btnT = $('.boton__t', btn);
    const IDIOMA = { es: 'Español', nb: 'Noruego', en: 'Inglés' };
    let enviando = false;
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (enviando) return;
      const v = (n) => (f.elements[n]?.value || '').trim();
      const tipo = f.querySelector('input[name="tipo"]:checked'), cuando = f.querySelector('input[name="cuando"]:checked');
      const mail = v('email');
      if (!tipo || v('lugar').length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) { err.hidden = false; ok.hidden = true; return; }
      err.hidden = true;
      if (v('_honey')) return;   // trampa para robots
      const txt = f.dataset.plantilla.replace('{tipo}', tipo.value).replace('{lugar}', v('lugar')).replace('{cuando}', cuando ? cuando.value : '—')
        .replace('{nombre}', v('nombre') || '—').replace('{correo}', mail).replace('{tel}', v('tel') || '—');
      const correo = f.dataset.correo;
      const porCorreo = () => { location.href = `mailto:${correo}?subject=${encodeURIComponent(f.dataset.asunto)}&body=${encodeURIComponent(txt)}`; };
      const antes = btnT.textContent;
      enviando = true; btn.disabled = true; btnT.textContent = f.dataset.enviando; ok.hidden = true;
      try {
        const r = await fetch(`https://formsubmit.co/ajax/${correo}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            _subject: `Nueva solicitud desde la web: ${tipo.dataset.es} en ${v('lugar')}`, _template: 'table', _replyto: mail,
            Nombre: v('nombre') || '—', email: mail, 'Teléfono': v('tel') || '—', Obra: tipo.dataset.es, Lugar: v('lugar'),
            'Para cuándo': cuando ? cuando.dataset.es : '—', 'Idioma de la web': IDIOMA[document.documentElement.lang] || document.documentElement.lang,
          }),
        });
        const d = await r.json().catch(() => ({}));
        if (!r.ok || String(d.success) !== 'true') throw new Error(d.message || String(r.status));
        f.reset(); ok.textContent = f.dataset.ok; ok.hidden = false;
      } catch (_) {
        ok.textContent = f.dataset.fallo; ok.hidden = false;
        setTimeout(porCorreo, 900);
      } finally {
        enviando = false; btn.disabled = false; btnT.textContent = antes;
      }
    });
  }

  /* móvil: la barra de contacto aparece cuando los botones de la portada ya no se ven */
  const barra = $('.barra'), acciones = $('.portada__acciones');
  if (barra && acciones && 'IntersectionObserver' in window) new IntersectionObserver((es) => barra.classList.toggle('es-visible', !es[0].isIntersecting)).observe(acciones);
  else if (barra) barra.classList.add('es-visible');

  const anio = $('[data-anio]'); if (anio) anio.textContent = new Date().getFullYear();
})();
