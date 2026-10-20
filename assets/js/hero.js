/* Startseite: Kamerafahrt um die Skulptur am Empfang (Higgsfield/Kling aus dem echten Praxisfoto).
   Der Kopfbereich rastet ein, beim Scrollen läuft die Fahrt als Bildfolge auf einem Canvas ab, danach geht es normal weiter.
   Bildfolgen: assets/frames/d (Desktop) und assets/frames/m (Handy), Anzahl aus data-frames. */
(() => {
  const hero = document.querySelector('[data-hero]');
  const cv = hero && hero.querySelector('[data-canvas]');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const base = hero.dataset.base;
  const mobile = matchMedia('(max-width: 1020px)').matches;
  const N = +(mobile ? hero.dataset.framesM : hero.dataset.framesD);
  const dir = mobile ? 'm' : 'd';
  const imgs = new Array(N);
  let cur = -1, want = 0;

  const src = i => `${base}assets/frames/${dir}/f_${String(i + 1).padStart(3, '0')}.webp`;
  // Höchstens 6 Bilder gleichzeitig laden, bei Fehlern bis zu zweimal neu versuchen
  const queue = [], tries = {};
  let active = 0;
  const pump = () => {
    while (active < 6 && queue.length) {
      const i = queue.shift(), im = imgs[i];
      active++;
      im.onload = () => { active--; if (Math.abs(Math.round(want) - i) < 2 || cur < 0) draw(); pump(); };
      im.onerror = () => { active--; tries[i] = (tries[i] || 0) + 1; if (tries[i] < 3) setTimeout(() => { queue.push(i); pump(); }, 400); pump(); };
      im.src = src(i) + (tries[i] ? `?r=${tries[i]}` : '');
    }
  };
  const load = (i, first) => {
    if (imgs[i]) return imgs[i];
    const im = new Image(); im.decoding = 'async';
    imgs[i] = im;
    first ? queue.unshift(i) : queue.push(i);
    pump();
    return im;
  };

  function size() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const r = cv.getBoundingClientRect();
    cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
    cur = -1; draw();
  }

  // Nächstes geladenes Bild in der Nähe suchen, falls das gewünschte noch lädt
  function pick(i) {
    for (let d = 0; d < N; d++) {
      for (const j of [i - d, i + d]) if (j >= 0 && j < N && imgs[j] && imgs[j].complete && imgs[j].naturalWidth) return j;
    }
    return -1;
  }

  function draw() {
    const i = pick(Math.round(want));
    if (i < 0) return;
    cur = i;
    const im = imgs[i], W = cv.width, H = cv.height;
    // Zusätzlich zur Kamerafahrt im Video: leichter Schwenk nach links und sanftes Herauszoomen
    const t = N > 1 ? want / (N - 1) : 0, e = t * t * (3 - 2 * t);
    const s = Math.max(W / im.naturalWidth, H / im.naturalHeight) * (1.08 - 0.08 * e);
    const w = im.naturalWidth * s, h = im.naturalHeight * s;
    const fx = +(hero.dataset.focus || 0.8) - 0.42 * e;
    ctx.drawImage(im, (W - w) * fx, (H - h) * 0.35, w, h);
  }

  // Erst das erste Bild, dann alle in Reihenfolge laden
  load(0);
  const all = () => { for (let i = 1; i < N; i++) load(i); };
  if (document.readyState === 'complete') setTimeout(all, 50); else addEventListener('load', all);
  size();
  addEventListener('resize', size);
  hero.classList.add('has-motion');

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  const onUpdate = st => {
    // Fahrt bis 88 %, danach kurz stehen lassen
    want = Math.min(1, st.progress / 0.88) * (N - 1);
    load(Math.round(want), true); draw();
  };
  if (mobile) {
    // Handy: Foto liegt unter dem Text, deshalb kein Einrasten; die Fahrt läuft, während das Foto durchs Bild scrollt
    ScrollTrigger.create({ trigger: cv, start: 'top 85%', end: 'bottom 15%', scrub: 0.5, onUpdate });
  } else {
    ScrollTrigger.create({
      trigger: hero, start: 'top top+=' + (document.querySelector('[data-head]')?.offsetHeight || 0),
      end: () => '+=' + Math.round(innerHeight * 1.5),
      pin: true, pinSpacing: true, scrub: 0.6, anticipatePin: 1, onUpdate,
    });
  }
})();
