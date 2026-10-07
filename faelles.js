/* ==========================================================================
   Fælles script for undersiderne i Motion Lab.
   Forsiden har sit eget (inline) script; det her er de samme greb,
   pakket så hver underside kun skal have markuppen.
   ========================================================================== */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fin = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const kr = n => n.toLocaleString('da-DK');

  /* ── Navigation ──────────────────────────────────────────────────── */
  const nav = $('#nav');
  addEventListener('scroll', () => nav && nav.classList.toggle('fast', scrollY > 40), { passive: true });

  /* ── Indtoning ───────────────────────────────────────────────────── */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .12 });
  $$('.vis').forEach(el => io.observe(el));

  /* ── Hero: ordmærket fylder bredden, lys der følger musen ────────── */
  const om = $('#ordmaerke'), omLys = $('#omLys'), hero = $('#hero');
  if (om && hero) {
    const tilpas = () => {
      const t = $('#omTekst'); t.setAttribute('font-size', 120);
      const w = t.getComputedTextLength(); if (!w) return;
      // Korte ord (OM OS) ville blive kæmpehøje — loft over højden, så de ikke rammer teksten
      const fs = Math.min(120 * 996 / w, +(om.dataset.maks || 175));
      $$('#ordmaerke text').forEach(x => { x.setAttribute('font-size', fs); x.setAttribute('y', fs * .86); });
      om.setAttribute('viewBox', `0 0 1000 ${Math.round(fs * .9)}`);
    };
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(tilpas);
    let sidst = 0;
    const lys = (cx, cy) => {
      const r = om.getBoundingClientRect(), vb = om.viewBox.baseVal;
      omLys.setAttribute('cx', (cx - r.left) / r.width * vb.width);
      omLys.setAttribute('cy', (cy - r.top) / r.height * vb.height);
    };
    hero.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') { lys(e.clientX, e.clientY); sidst = performance.now(); } });
    if (!reduce) (function drift(t){
      if (t - sidst > 2400 && scrollY < innerHeight) {
        const r = om.getBoundingClientRect();
        lys(r.left + r.width * (.5 + Math.sin(t / 3000) * .55), r.top + r.height * (.5 + Math.cos(t / 4000) * .3));
      }
      requestAnimationFrame(drift);
    })(0);
    const spot = $('#spot');
    if (fin && spot) hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      spot.style.setProperty('--mx', (e.clientX - r.left) + 'px'); spot.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
    const filmEl = $('#heroVideo');
    addEventListener('scroll', () => {
      if (reduce) return;
      const y = scrollY, h = hero.offsetHeight; if (y > h) return;
      if (filmEl) filmEl.style.transform = `translate3d(0,${y * .22}px,0)`;
      om.style.transform = `translate3d(-50%,${y * .38}px,0)`;
      om.style.opacity = Math.max(0, 1 - y / (h * .6));
    }, { passive: true });
  }

  /* ── Hero-film: klippene står i data-klip="a.mp4,b.mp4,…" ────────── */
  const filmWrap = $('#heroVideo');
  if (filmWrap) {
    const klip = (filmWrap.dataset.klip || '').split(',').map(x => x.trim()).filter(Boolean);
    const film = $$('video', filmWrap);
    const start = v => { v.playbackRate = .75; const p = v.play(); if (p) p.catch(() => {}); };
    let ki = 0, front = film[0], timer = null, synlig = true;
    if (klip.length) { front.src = klip[0]; start(front); }
    const naeste = () => {
      ki = (ki + 1) % klip.length;
      const bag = film.find(v => v !== front);
      bag.preload = 'auto'; bag.src = klip[ki]; bag.currentTime = 0; start(bag);
      const skift = () => {
        bag.classList.add('aktiv'); front.classList.remove('aktiv'); front = bag;
        setTimeout(() => film.forEach(v => { if (v !== front) v.pause(); }), 1700);
      };
      if (bag.readyState >= 2) skift(); else bag.addEventListener('loadeddata', skift, { once: true });
    };
    const koer = () => {
      clearInterval(timer);
      if (!reduce && synlig && !document.hidden && klip.length > 1) { timer = setInterval(naeste, 7000); start(front); }
    };
    new IntersectionObserver(es => {
      synlig = es[0].isIntersecting;
      if (synlig) koer(); else { clearInterval(timer); film.forEach(v => v.pause()); }
    }, { threshold: .05 }).observe(hero);
    document.addEventListener('visibilitychange', koer);
    koer();
  }

  /* ── Prisvælger (Full Detail-siden) ──────────────────────────────── */
  const seg = $('#segment');
  if (seg) {
    const PRIS = JSON.parse(seg.dataset.priser);          // { lille: 1060, … }
    const MOD = seg.dataset.premium ? JSON.parse(seg.dataset.premium) : null;
    const NAVN = { lille:'Lille bil', mellem:'Mellem bil', stor:'Stor bil', syv:'7-personers' };
    const EKS = {
      lille:'VW Polo, Fiat 500, Toyota Aygo, Mini Cooper',
      mellem:'VW Golf, Skoda Octavia, Toyota Corolla, BMW 3-serie, Audi A4',
      stor:'BMW 5-serie, Mercedes E-klasse, VW Passat stationcar, Tesla Model Y, Skoda Enyaq',
      syv:'alle biler med 7 sæder, f.eks. VW Touran, Ford Galaxy, Mercedes EQV',
    };
    const ORDEN = ['lille','mellem','stor','syv'];
    let str = 'mellem';
    const vis = () => {
      $$('button', seg).forEach(b => b.setAttribute('aria-checked', b.dataset.s === str));
      seg.style.setProperty('--i', ORDEN.indexOf(str));
      const b = $('#prisTal'); b.classList.add('skift');
      setTimeout(() => { b.textContent = kr(PRIS[str]) + ' kr'; b.classList.remove('skift'); }, reduce ? 0 : 160);
      $('#prisFor').textContent = NAVN[str];
      $('#eks').innerHTML = `<b>${NAVN[str]}:</b> f.eks. ${EKS[str]}.`;
      $$('[data-str]').forEach(r => r.classList.toggle('valgt', r.dataset.str === str));
      if (MOD) {
        const d = MOD[str] - PRIS[str];
        $('#premiumPris').textContent = kr(MOD[str]) + ' kr';
        $('#premiumDelta').textContent = `${kr(d)} kr mere end ${seg.dataset.navn || 'Full Detail'} for en ${NAVN[str].toLowerCase()}`;
      }
    };
    seg.addEventListener('click', e => { const b = e.target.closest('button'); if (b) { str = b.dataset.s; vis(); } });
    seg.addEventListener('keydown', e => {
      if (!['ArrowRight','ArrowLeft'].includes(e.key)) return;
      e.preventDefault();
      str = ORDEN[(ORDEN.indexOf(str) + (e.key === 'ArrowRight' ? 1 : -1) + 4) % 4];
      vis(); $(`[data-s=${str}]`, seg).focus();
    });
    $$('[data-str]').forEach(r => r.addEventListener('click', () => { str = r.dataset.str; vis(); }));
    vis();
  }

  /* ── Footer: ordmærket og lyset ──────────────────────────────────── */
  const fodOrd = $('#fodOrd');
  if (fodOrd) {
    const tilpas = () => {
      const t1 = $('#ordTekst'); t1.setAttribute('font-size', 150);
      const w = t1.getComputedTextLength(); if (!w) return;
      const fs = 150 * 1190 / w;
      $$('#fodOrd text').forEach(t => { t.setAttribute('font-size', fs); t.setAttribute('y', fs * .78 + 8); });
      $('#fodOrd svg').setAttribute('viewBox', `0 0 1200 ${Math.round(fs * .82 + 10)}`);
    };
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(tilpas);
    const ordLys = $('#ordLys'), ordLysTekst = $('#ordLysTekst'), svg = $('svg', fodOrd);
    const flyt = (cx, cy) => {
      const r = svg.getBoundingClientRect();
      ordLys.setAttribute('cx', (cx - r.left) / r.width * 1200);
      ordLys.setAttribute('cy', (cy - r.top) / r.height * svg.viewBox.baseVal.height);
    };
    if (fin) {
      $('#fod').addEventListener('pointermove', e => { flyt(e.clientX, e.clientY); ordLysTekst.setAttribute('opacity', 1); });
      $('#fod').addEventListener('pointerleave', () => ordLysTekst.setAttribute('opacity', 0));
    } else if (!reduce) {
      let koer = false;
      new IntersectionObserver(es => { koer = es[0].isIntersecting; ordLysTekst.setAttribute('opacity', koer ? 1 : 0); }).observe(fodOrd);
      (function drift(t){ if (koer) { ordLys.setAttribute('cx', 600 + Math.sin(t / 2200) * 520); ordLys.setAttribute('cy', 80); } requestAnimationFrame(drift); })(0);
    }
  }

  /* ── Telefontid: i dag og åbent/lukket (footer og kontaktsiden) ──── */
  const nu = new Date(), dag = nu.getDay(), time = nu.getHours();
  const aaben = dag >= 1 && dag <= 5 && time >= 14 && time < 20;
  const idag = $(`#tider [data-d="${dag}"]`);
  if (idag) { idag.style.color = 'var(--kridt)'; idag.firstElementChild.textContent += ' · i dag'; }
  $$('.nu-aaben').forEach(na => {
    na.classList.toggle('aaben', aaben);
    na.lastElementChild.textContent = aaben ? 'Ring nu, vi tager telefonen' : 'Telefonen er lukket lige nu, men du kan altid booke online';
  });
  $$('[data-status]').forEach(el => { el.textContent = aaben ? 'Åbent nu' : 'Lukket nu · hverdage 14–20'; el.classList.toggle('aaben', aaben); });
})();
