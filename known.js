/**
 * known.js — Frage „Kanntest du … vorher?“ im Epilog.
 *
 * Zählt über dieselbe API wie die Entscheidungen, Schlüssel: PREFIX-kannte-A|B|C|D
 *   A = gut gekannt, D = Person ja, diese Episode nicht
 *   (nur bei Personen, story: false), B = nur den Namen / ungefähr, C = gar nicht.
 * Eine Antwort pro Gerät (localStorage). Prozente erst ab MIN_ANSWERS Antworten.
 *
 * Einbindung (am Ende der Seite):
 *   <script src="known.js"></script>
 *   <script>Known.init({ prefix: SCENARIO_PREFIX, q: 'Kanntest du …, bevor du gespielt hast?', story: false });</script>
 * und im Epilog ganz oben: <div class="known" id="known"></div>
 */
const Known = (() => {
  const API = 'https://histogrammapi.wieskoenig.workers.dev';
  const MIN_ANSWERS = 20;

  const CSS = `
  .known { max-width: 460px; margin: 0 auto 2rem; padding: 1rem 1.1rem; border: 1px dashed var(--border-strong, rgba(26,24,20,0.28)); border-radius: 2px; text-align: center; }
  .known-q { font-size: 1rem; line-height: 1.4; margin-bottom: 0.75rem; color: var(--ink, #1a1814); }
  .known-btns { display: flex; gap: 0.4rem; justify-content: center; flex-wrap: wrap; }
  .known-btns button { background: white; border: 1px solid var(--border-strong, rgba(26,24,20,0.28)); border-radius: 2px; padding: 0.5rem 0.9rem; font-family: Georgia, serif; font-size: 0.88rem; cursor: pointer; color: var(--ink, #1a1814); }
  .known-btns button:hover:not(:disabled) { border-color: var(--amber, #c4780a); }
  .known-btns button:disabled { opacity: 0.5; cursor: default; }
  .known-stack { display: flex; height: 26px; border-radius: 1px; overflow: hidden; margin: 0.2rem 0 0.4rem; }
  .known-stack div { display: flex; align-items: center; justify-content: center; color: white; font-family: 'Courier New', monospace; font-size: 0.72rem; white-space: nowrap; overflow: hidden; }
  .known-seg-A { background: var(--ink, #1a1814); }
  .known-seg-D { background: var(--ink-muted, #5a574f); }
  .known-seg-B { background: var(--ink-faint, #a09d94); }
  .known-seg-C { background: var(--amber, #c4780a); }
  .known-stack div.mine { box-shadow: inset 0 0 0 2px var(--amber-dark, #7a4906); }
  .known-legend { display: flex; justify-content: center; gap: 0.9rem; font-size: 0.7rem; color: var(--ink-faint, #a09d94); flex-wrap: wrap; }
  .known-legend span::before { content: ''; display: inline-block; width: 8px; height: 8px; margin-right: 0.3rem; }
  .known-legend .l-A::before { background: var(--ink, #1a1814); }
  .known-legend .l-D::before { background: var(--ink-muted, #5a574f); }
  .known-legend .l-B::before { background: var(--ink-faint, #a09d94); }
  .known-legend .l-C::before { background: var(--amber, #c4780a); }
  .known-line { font-size: 0.88rem; line-height: 1.5; color: var(--ink-muted, #5a574f); font-style: italic; margin-top: 0.5rem; }`;

  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  function storageGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function storageSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* egal */ } }

  async function fetchCounts(key) {
    const res = await fetch(`${API}/results?prefix=${key}&_=${Date.now()}`);
    const d = await res.json();
    return { A: d.A || 0, B: d.B || 0, C: d.C || 0, D: d.D || 0 };
  }

  function line(k, pct, t, story) {
    if (k === 'A') return pct < 50
      ? `Das können nur ${pct} % von ${t} Spielenden von sich sagen.`
      : `Wie ${pct} % von ${t} Spielenden.`;
    if (k === 'B' || k === 'D') return `So ging es ${pct} % von ${t} Spielenden.`;
    return pct >= 40
      ? `Du bist in guter Gesellschaft: ${pct} % von ${t} Spielenden ging es genauso.`
      : `Dann war das heute eine Entdeckung, wie für ${pct} % von ${t} Spielenden.`;
  }

  function renderResult(box, counts, mine, labels, story, revisit, ORDER) {
    const t = ORDER.reduce((sum, k) => sum + counts[k], 0);
    const res = box.querySelector('.known-res');
    if (t < MIN_ANSWERS) {
      res.innerHTML = revisit
        ? `<div class="known-line">Deine Antwort: ${esc(labels[mine])}. Die Verteilung zeigen wir, sobald ${MIN_ANSWERS} Antworten da sind.</div>`
        : `<div class="known-line">Danke! Du bist unter den ersten ${MIN_ANSWERS}, die geantwortet haben. Die Verteilung zeigen wir, sobald ${MIN_ANSWERS} Antworten da sind.</div>`;
      return;
    }
    const pct = {};
    ORDER.forEach(k => { pct[k] = Math.round(counts[k] / t * 100); });
    const segs = ORDER.map(k => pct[k]
      ? `<div class="known-seg-${k}${k === mine ? ' mine' : ''}" style="width:${pct[k]}%">${pct[k] >= 15 ? pct[k] + ' %' : ''}</div>` : '').join('');
    const legend = ORDER.map(k => `<span class="l-${k}">${esc(labels[k])} ${pct[k]} %</span>`).join('');
    res.innerHTML = `<div class="known-stack">${segs}</div><div class="known-legend">${legend}</div>`
      + (mine ? `<div class="known-line">${line(mine, pct[mine], t, story)}</div>` : '');
  }

  function init(opts) {
    const box = document.getElementById('known');
    if (!box || !opts || !opts.prefix) return;
    if (!document.getElementById('known-css')) {
      const st = document.createElement('style'); st.id = 'known-css'; st.textContent = CSS;
      document.head.appendChild(st);
    }
    const key = opts.prefix + '-kannte';
    const storeKey = 'histogramm_kannte_' + opts.prefix;
    const labels = opts.story
      ? { A: 'Ja, gut', B: 'Nur ungefähr', C: 'Gar nicht' }
      : { A: 'Ja, gut', D: 'Ja, aber diese Episode nicht', B: 'Nur den Namen', C: 'Gar nicht' };
    const ORDER = opts.story ? ['A', 'B', 'C'] : ['A', 'D', 'B', 'C'];

    box.innerHTML = `<div class="known-q">${esc(opts.q)}</div>`
      + `<div class="known-btns">${ORDER.map(k => `<button type="button" data-k="${k}">${esc(labels[k])}</button>`).join('')}</div>`
      + `<div class="known-res"></div>`;
    const btns = box.querySelector('.known-btns');

    const prev = storageGet(storeKey);
    if (ORDER.includes(prev)) {
      // Schon beantwortet: Ergebnis zeigen, nicht erneut zählen.
      btns.remove();
      box.querySelector('.known-res').innerHTML = `<div class="known-line">Deine Antwort: ${esc(labels[prev])}</div>`;
      fetchCounts(key).then(c => {
        if (ORDER.every(k => !c[k])) c[prev] = 1; // Zähler hinkt bis zu einer Minute hinterher
        renderResult(box, c, prev, labels, opts.story, true, ORDER);
      }).catch(() => {});
      return;
    }

    btns.addEventListener('click', async e => {
      const b = e.target.closest('button[data-k]');
      if (!b) return;
      const k = b.dataset.k;
      btns.querySelectorAll('button').forEach(x => { x.disabled = true; });
      storageSet(storeKey, k);
      let counts = null;
      try {
        // Erst lesen, dann zählen: so steckt die eigene Stimme genau einmal im Ergebnis,
        // auch wenn der Zähler mit Verzögerung nachzieht.
        counts = await fetchCounts(key);
        counts[k] += 1;
        await fetch(`${API}/vote?key=${key}-${k}`, { method: 'POST' });
      } catch (err) {
        console.error('known.js: API nicht erreichbar', err);
      }
      btns.remove();
      if (counts) renderResult(box, counts, k, labels, opts.story, false, ORDER);
      else box.querySelector('.known-res').innerHTML = '<div class="known-line">Danke für deine Antwort!</div>';
    });
  }

  return { init };
})();
