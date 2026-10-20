/* HNO-Praxis am Goetheplatz: Kopfzeile, Menü, Einblenden, Leistungsvorschau, Galerie, Inhaltsverzeichnis, Glossar, Sprechzeiten-Status */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const body = document.body;

  // Mobiles Menü
  const burger = $('[data-burger]'), menu = $('[data-menu]');
  if (burger && menu) {
    const set = open => {
      burger.setAttribute('aria-expanded', open);
      const l = burger.querySelector('.sr'); if (l) l.textContent = open ? 'Schließen' : 'Menü';
      menu.hidden = !open;
      body.classList.toggle('menu-open', open);
    };
    burger.addEventListener('click', () => set(burger.getAttribute('aria-expanded') !== 'true'));
    addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
    $$('a', menu).forEach(a => a.addEventListener('click', () => set(false)));
    matchMedia('(min-width: 981px)').addEventListener('change', e => { if (e.matches) set(false); });
  }

  // Inhaltsverzeichnis: aktiven Abschnitt markieren
  const tocLinks = $$('.toc a');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    const map = new Map(tocLinks.map(a => [decodeURIComponent(a.hash.slice(1)), a]));
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      tocLinks.forEach(a => a.classList.remove('is-active'));
      map.get(e.target.id)?.classList.add('is-active');
    }), { rootMargin: '-20% 0px -70% 0px' });
    map.forEach((_, id) => { const h = document.getElementById(id); if (h) io.observe(h); });
  }

  // Glossar: Reiter und Suche
  const tabs = $$('[data-tab]');
  if (tabs.length) {
    const panels = $$('[data-panel]');
    const search = $('[data-gl-search]'), empty = $('[data-gl-empty]');
    const show = key => {
      tabs.forEach(t => t.setAttribute('aria-selected', t.dataset.tab === key));
      panels.forEach(p => p.hidden = p.dataset.panel !== key);
    };
    tabs.forEach(t => t.addEventListener('click', () => { search.value = ''; filter(); show(t.dataset.tab); history.replaceState(null, '', '#' + t.dataset.tab); }));
    const filter = () => {
      const q = search.value.trim().toLowerCase();
      let n = 0;
      $$('.gl-item').forEach(it => {
        const hit = !q || it.dataset.term.includes(q) || it.textContent.toLowerCase().includes(q);
        it.hidden = !hit; if (hit) n++;
      });
      if (q) { panels.forEach(p => p.hidden = !$$('.gl-item', p).some(i => !i.hidden)); tabs.forEach(t => t.setAttribute('aria-selected', 'false')); }
      else show(($$('[data-tab]').find(t => t.getAttribute('aria-selected') === 'true') || tabs[0]).dataset.tab);
      empty.hidden = n > 0;
    };
    search.addEventListener('input', filter);
    const fromHash = () => {
      const h = decodeURIComponent(location.hash.slice(1));
      const el = h && document.getElementById(h);
      if (el && el.matches('.gl-item')) { show(el.closest('[data-panel]').dataset.panel); el.open = true; el.scrollIntoView({ block: 'center' }); }
      else show(tabs.some(t => t.dataset.tab === h) ? h : tabs[0].dataset.tab);
    };
    fromHash(); addEventListener('hashchange', fromHash);
  }

  // Sprechzeiten: geöffnet oder geschlossen (Zeit in Frankfurt)
  const hours = [[8.5, 13], [14.5, 19]];
  $$('[data-status]').forEach(el => {
    const txt = $('[data-status-text]', el);
    const upd = () => {
      const parts = Object.fromEntries(new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' })
        .formatToParts(new Date()).map(p => [p.type, p.value]));
      const day = parts.weekday.replace('.', ''), h = +parts.hour + +parts.minute / 60;
      const workday = !['Sa', 'So'].includes(day);
      const open = workday && hours.some(([a, b]) => h >= a && h < b);
      el.classList.toggle('is-open', open);
      const fmt = x => `${Math.floor(x)}:${String(Math.round((x % 1) * 60)).padStart(2, '0')}`;
      if (open) {
        const end = hours.find(([a, b]) => h >= a && h < b)[1];
        txt.textContent = `Jetzt geöffnet bis ${fmt(end)} Uhr`;
      } else if (workday && h < 8.5) txt.textContent = 'Geschlossen, öffnet heute um 8:30 Uhr';
      else if (workday && h >= 13 && h < 14.5) txt.textContent = 'Mittagspause bis 14:30 Uhr';
      else txt.textContent = (day === 'Fr' || !workday) ? 'Geschlossen, wieder ab Montag 8:30 Uhr' : 'Geschlossen, wieder ab morgen 8:30 Uhr';
    };
    upd(); setInterval(upd, 60000);
  });
})();
