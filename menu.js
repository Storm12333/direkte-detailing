/* Mobilmenu: bygges ud fra navigationens egne links, så den altid passer.
   Vises under 1100 px, hvor de almindelige links er skjult. */
(() => {
  const nav = document.getElementById('nav');
  if (!nav) return;
  const links = [...nav.querySelectorAll('.nav-links a')];

  const knap = document.createElement('button');
  knap.className = 'menu-knap'; knap.type = 'button';
  knap.setAttribute('aria-label', 'Åbn menu'); knap.setAttribute('aria-expanded', 'false'); knap.setAttribute('aria-controls', 'menuPanel');
  knap.innerHTML = '<span></span><span></span>';
  nav.querySelector('.nav-hoejre').appendChild(knap);

  const panel = document.createElement('div');
  panel.className = 'menu-panel'; panel.id = 'menuPanel'; panel.setAttribute('aria-hidden', 'true');
  panel.innerHTML =
    '<nav aria-label="Mobilmenu">' +
      links.map(a => `<a href="${a.getAttribute('href')}">${a.textContent}</a>`).join('') +
      '<a href="services.html">Alle services</a>' +
    '</nav>' +
    '<div class="menu-bund">' +
      '<a href="tel:+4529729695" class="knap kant">Ring 29 72 96 95</a>' +
      '<a href="https://direkte-detailing.planway.com/" class="knap">Book nu</a>' +
    '</div>';
  document.body.appendChild(panel);
  [...panel.querySelectorAll('nav a')].forEach((a, i) => { a.style.transitionDelay = (60 + i * 45) + 'ms'; });

  const saet = aaben => {
    document.documentElement.classList.toggle('menu-aaben', aaben);
    knap.setAttribute('aria-expanded', aaben);
    knap.setAttribute('aria-label', aaben ? 'Luk menu' : 'Åbn menu');
    panel.setAttribute('aria-hidden', !aaben);
  };
  knap.addEventListener('click', () => saet(!document.documentElement.classList.contains('menu-aaben')));
  panel.addEventListener('click', e => { if (e.target.closest('a')) saet(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape') saet(false); });
  addEventListener('resize', () => { if (innerWidth > 1100) saet(false); });
})();
