/**
 * raetsel.js — Rätselmodus „Wer war's?“ (Prototyp)
 *
 * Aktiv nur mit ?raetsel in der Adresse. Dann wird der Name der Person bis zur Auflösung
 * geschwärzt (Titel, Szenen, Rolle, Erzähltexte nach jeder Entscheidung, Teilen-Text).
 * Nach Moment 3 kommt statt „Epilog lesen“ die Frage „Wer war das?“ mit vier Namen.
 * Danach wird alles aufgedeckt und der normale Epilog gezeigt.
 *
 * Zählt über dieselbe API, Schlüssel PREFIX-erkannt-A|B|C|D (A = richtig, B–D = die
 * Falschnamen in der Reihenfolge der Konfiguration). Eine Antwort pro Gerät.
 *
 * Einbindung (am Ende der Seite, nach known.js), die Daten stehen in raetsel-daten.js:
 *   <script src="raetsel-daten.js"></script>
 *   <script src="raetsel.js"></script>
 * Startet von selbst, wenn es für den Dateinamen der Seite einen Eintrag gibt.
 * Optional zusatz: [Wörter, die praktisch ein Name sind, z. B. 'Fliegeberg'] werden ebenfalls geschwärzt
 * und beim Aufdecken wieder im Original gezeigt.
 * Nach einer falschen Antwort: „Hattest du von … schon gehört?“, Schlüssel PREFIX-gehoert-J|N.
 * Raetsel.schwaerzer(slug) liefert eine Funktion, die Namen in einem Text schwärzt (für die Startseite).
 */
const Raetsel = (() => {
  const API = 'https://histogrammapi.wieskoenig.workers.dev';
  const MIN_ANSWERS = 10;
  const BALKEN = '▇▇▇▇▇';

  const CSS = `
  .raetsel-banner { max-width: 640px; margin: 2rem auto 0; padding: 0.6rem 1rem; text-align: center; font-size: 0.78rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--amber-dark, #7a4906); background: var(--amber-light, #faeeda); border: 1px solid var(--amber, #c4780a); border-radius: 2px; }
  .raetsel-box { display: none; text-align: center; padding: 2.5rem 1.5rem; margin-top: 1.5rem; border: 1px solid var(--amber, #c4780a); border-radius: 2px; background: white; }
  .raetsel-box.visible { display: block; }
  .raetsel-kicker { font-size: 0.7rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--ink-faint, #a09d94); margin-bottom: 0.8rem; }
  .raetsel-q { font-size: 1.5rem; line-height: 1.3; margin-bottom: 1.4rem; color: var(--ink, #1a1814); }
  .raetsel-opts { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; max-width: 460px; margin: 0 auto; }
  .raetsel-opts button { background: white; border: 1px solid var(--border-strong, rgba(26,24,20,0.28)); border-radius: 2px; padding: 0.85rem 0.6rem; font-family: Georgia, serif; font-size: 0.95rem; cursor: pointer; color: var(--ink, #1a1814); transition: all 0.15s; }
  .raetsel-opts button:hover:not(:disabled) { border-color: var(--amber, #c4780a); background: var(--amber-light, #faeeda); }
  .raetsel-opts button:disabled { cursor: default; transition: none; }
  .raetsel-opts button.richtig { background: var(--ink, #1a1814); color: var(--paper, #f7f4ef); border-color: var(--ink, #1a1814); }
  .raetsel-opts button.falsch { border-color: var(--amber, #c4780a); color: var(--amber-dark, #7a4906); text-decoration: line-through; }
  .raetsel-opts button.blass { opacity: 0.4; }
  .raetsel-urteil { font-size: 1.15rem; margin-top: 1.4rem; color: var(--ink, #1a1814); }
  .raetsel-quote { font-size: 0.9rem; font-style: italic; color: var(--ink-muted, #5a574f); margin-top: 0.4rem; }
  .raetsel-weiter { margin-top: 1.4rem; }
  .raetsel-gehoert { max-width: 420px; margin: 1.4rem auto 0; padding: 1rem; background: var(--amber-light, #faeeda); border-radius: 2px; }
  .raetsel-gehoert-q { font-size: 1rem; margin-bottom: 0.7rem; color: var(--ink, #1a1814); }
  .raetsel-gehoert-btns { display: flex; gap: 0.4rem; justify-content: center; flex-wrap: wrap; }
  .raetsel-gehoert-btns button { background: white; border: 1px solid var(--border-strong, rgba(26,24,20,0.28)); border-radius: 2px; padding: 0.5rem 0.9rem; font-family: Georgia, serif; font-size: 0.88rem; cursor: pointer; color: var(--ink, #1a1814); }
  .raetsel-gehoert-btns button:disabled { cursor: default; opacity: 0.45; }
  .raetsel-gehoert-btns button.mein { opacity: 1; border-color: var(--ink, #1a1814); }
  .raetsel-gehoert-z { font-size: 0.85rem; font-style: italic; color: var(--ink-muted, #5a574f); margin-top: 0.6rem; }
  .raetsel-auf { background: var(--amber-light, #faeeda); transition: background 2.5s; }
  @media (max-width: 480px) { .raetsel-opts { grid-template-columns: 1fr; } }`;

  function storageGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function storageSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* egal */ } }
  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  // Namen als ganze Wörter, mit Genitiv („Semmelweis'“, „Mozarts“). Längste Form zuerst.
  function namensRegex(namen) {
    const n = namen.slice().sort((a, b) => b.length - a.length);
    return new RegExp("(?<!\\p{L})(" + n.map(escRe).join('|') + ")(?:['’]s?|s)?(?!\\p{L})", 'gu');
  }
  function schwaerzer(slug) {
    const d = (window.RAETSEL_DATEN || {})[slug];
    if (!d) return null;
    const re = namensRegex(d.namen.concat(d.zusatz || []));
    return t => t.replace(re, BALKEN);
  }

  function init(cfg) {
    if (!/[?&]raetsel\b/.test(location.search)) return;
    const epilog = document.getElementById('epilog');
    if (!epilog) return;

    // Lange Namensformen zuerst, damit „Ignaz Semmelweis“ nicht als „Ignaz ▇▇▇▇▇“ übrig bleibt.
    const namen = cfg.namen.slice().sort((a, b) => b.length - a.length);
    const re = namensRegex(cfg.namen.concat(cfg.zusatz || []));
    const original = new Map(); // Textknoten → Originaltext, zum Aufdecken

    function schwaerzen(root) {
      const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (w.nextNode()) nodes.push(w.currentNode);
      nodes.forEach(n => {
        if (epilog.contains(n) || box.contains(n)) return;
        if (re.test(n.nodeValue)) {
          re.lastIndex = 0;
          if (!original.has(n)) original.set(n, n.nodeValue);
          n.nodeValue = n.nodeValue.replace(re, BALKEN);
        }
        re.lastIndex = 0;
      });
    }
    function aufdecken() {
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (w.nextNode()) nodes.push(w.currentNode);
      nodes.forEach(n => {
        if (n.nodeValue.indexOf(BALKEN) === -1) return;
        n.nodeValue = original.has(n) ? original.get(n) : n.nodeValue.split(BALKEN).join(cfg.kurz || namen[namen.length - 1]);
        if (n.parentElement) n.parentElement.classList.add('raetsel-auf');
      });
      setTimeout(() => document.querySelectorAll('.raetsel-auf').forEach(e => e.classList.remove('raetsel-auf')), 50);
      document.title = document.title.replace('Wer war’s?', cfg.name);
    }

    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    // Rolle ohne Namen: „Ignaz Semmelweis, Assistenzarzt“ → „Assistenzarzt“
    document.querySelectorAll('.scene-role span:not(.role-label)').forEach(s => {
      namen.forEach(nm => { s.textContent = s.textContent.replace(new RegExp('^' + escRe(nm) + ',\\s*'), ''); });
    });

    // Antwortbox vor dem Epilog
    const box = document.createElement('div');
    box.className = 'raetsel-box';
    epilog.parentNode.insertBefore(box, epilog);

    const hero = document.querySelector('.hero');
    if (hero) {
      const b = document.createElement('div');
      b.className = 'raetsel-banner';
      b.textContent = 'Rätselmodus · Wer war’s? Drei Entscheidungen, dann rätst du die Person';
      hero.appendChild(b);
    }
    document.title = 'Histogramm — Wer war’s?';
    schwaerzen(document.body);

    // Nach jeder Entscheidung die neu eingesetzten Texte schwärzen.
    const origSubmit = window.submitDay;
    window.submitDay = async function (day) { await origSubmit(day); schwaerzen(document.querySelector('main')); };

    const btn3 = document.getElementById('nextDay3');
    if (btn3) btn3.textContent = 'Wer war das? →';
    const origEpilog = window.showEpilog;
    window.showEpilog = function () {
      if (box.dataset.fertig) return origEpilog();
      zeigeFrage();
    };

    // Kanntest-du-Frage passt im Rätselmodus nicht.
    const known = document.getElementById('known');
    if (known) known.style.display = 'none';

    const KEY = 'histogramm_raetsel_' + cfg.prefix;

    function zeigeFrage() {
      // Reihenfolge je Seite fest, aber gemischt (sonst stünde die richtige Antwort immer vorn).
      const opts = [['A', cfg.name]].concat(cfg.falsch.map((f, i) => ['BCD'[i], f]));
      const hash = s => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
      opts.sort((a, b) => hash(cfg.prefix + a[1]) - hash(cfg.prefix + b[1]));
      box.innerHTML = '<div class="raetsel-kicker">Die Auflösung</div><div class="raetsel-q">Wer hat diese drei Entscheidungen getroffen?</div><div class="raetsel-opts"></div><div class="raetsel-erg"></div>';
      const wrap = box.querySelector('.raetsel-opts');
      opts.forEach(([k, n]) => {
        const b = document.createElement('button');
        b.type = 'button'; b.textContent = n; b.dataset.k = k;
        b.addEventListener('click', () => antworten(k));
        wrap.appendChild(b);
      });
      box.classList.add('visible');
      setTimeout(() => box.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
      const frueher = storageGet(KEY);
      if (frueher) antworten(frueher, true);
    }

    // Nach falscher Antwort: Name schon mal gehört? Unterscheidet „zu schwache Hinweise“ von „echte Entdeckung“.
    function gehoert(el) {
      const GKEY = 'histogramm_raetsel_gehoert_' + cfg.prefix;
      el.innerHTML = '<div class="raetsel-gehoert-q"></div><div class="raetsel-gehoert-btns"></div><div class="raetsel-gehoert-z"></div>';
      el.querySelector('.raetsel-gehoert-q').textContent = 'Hattest du von ' + cfg.name + ' schon gehört?';
      const wrap = el.querySelector('.raetsel-gehoert-btns');
      const z = el.querySelector('.raetsel-gehoert-z');
      const opts = [['J', 'Ja, aber nicht erkannt'], ['N', 'Nein, noch nie']];
      async function waehle(g, schon) {
        wrap.querySelectorAll('button').forEach(b => { b.disabled = true; if (b.dataset.g === g) b.classList.add('mein'); });
        if (!schon) {
          storageSet(GKEY, g);
          try { await fetch(`${API}/vote?key=${cfg.prefix}-gehoert-${g}`, { method: 'POST' }); } catch (e) { /* offline */ }
        }
        z.textContent = g === 'N' ? 'Dann war das heute eine Entdeckung.' : 'Danke!';
        try {
          const res = await fetch(`${API}/results?prefix=${cfg.prefix}-gehoert&_=${Date.now()}`);
          const d = await res.json();
          const t = (d.J || 0) + (d.N || 0);
          if (t >= MIN_ANSWERS) z.textContent += ' So ging es ' + Math.round((d[g] || 0) / t * 100) + ' % von ' + t + ' Spielenden, die falsch lagen.';
        } catch (e) { /* ohne Zahlen */ }
      }
      opts.forEach(([g, l]) => {
        const b = document.createElement('button');
        b.type = 'button'; b.textContent = l; b.dataset.g = g;
        b.addEventListener('click', () => waehle(g));
        wrap.appendChild(b);
      });
      const frueher = storageGet(GKEY);
      if (frueher) waehle(frueher, true);
    }

    async function antworten(k, schonGezaehlt) {
      box.querySelectorAll('.raetsel-opts button').forEach(b => {
        b.disabled = true;
        if (b.dataset.k === 'A') b.classList.add('richtig');
        else if (b.dataset.k === k) b.classList.add('falsch');
        else b.classList.add('blass');
      });
      const erg = box.querySelector('.raetsel-erg');
      const richtig = k === 'A';
      erg.innerHTML = '<div class="raetsel-urteil"></div><div class="raetsel-quote"></div>' + (richtig ? '' : '<div class="raetsel-gehoert"></div>') + '<button class="next-day-btn visible raetsel-weiter" type="button">Epilog lesen →</button>';
      erg.querySelector('.raetsel-urteil').textContent = richtig ? 'Richtig — es war ' + cfg.name + '.' : 'Nicht ganz — es war ' + cfg.name + '.';
      erg.querySelector('.raetsel-weiter').addEventListener('click', () => { box.dataset.fertig = '1'; origEpilog(); });
      aufdecken();
      if (!richtig) gehoert(erg.querySelector('.raetsel-gehoert'));
      if (!schonGezaehlt) {
        storageSet(KEY, k);
        try { await fetch(`${API}/vote?key=${cfg.prefix}-erkannt-${k}`, { method: 'POST' }); } catch (e) { /* offline */ }
      }
      try {
        const res = await fetch(`${API}/results?prefix=${cfg.prefix}-erkannt&_=${Date.now()}`);
        const d = await res.json();
        const t = (d.A || 0) + (d.B || 0) + (d.C || 0) + (d.D || 0);
        if (t >= MIN_ANSWERS) {
          const p = Math.round((d.A || 0) / t * 100);
          erg.querySelector('.raetsel-quote').textContent = p + ' % von ' + t + ' Spielenden haben richtig getippt.';
        }
      } catch (e) { /* ohne Zahlen weiter */ }
    }
  }

  // Selbststart auf Szenarioseiten
  document.addEventListener('DOMContentLoaded', () => {
    if (typeof SCENARIO_PREFIX === 'undefined') return;
    const slug = location.pathname.split('/').pop().replace(/\.html$/, '');
    const d = (window.RAETSEL_DATEN || {})[slug];
    if (d) init(Object.assign({ prefix: SCENARIO_PREFIX }, d));
  });

  return { init, schwaerzer, BALKEN };
})();
