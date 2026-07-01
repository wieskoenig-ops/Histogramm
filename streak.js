/**
 * Histogramm — Streak Counter
 * Speichert Spielfortschritt lokal im Browser (localStorage).
 * Kein Server, kein Tracking, keine Datenweitergabe.
 *
 * Einbinden in jede Szenario-Seite:
 *   <script src="streak.js"></script>
 * Aufrufen wenn ein Szenario abgeschlossen ist:
 *   Streak.markPlayed('titanic');
 */

const Streak = (() => {

  const KEY_LAST_PLAYED = 'histogramm_last_played';
  const KEY_STREAK      = 'histogramm_streak';
  const KEY_PLAYED      = 'histogramm_played_ids';
  const KEY_TOTAL       = 'histogramm_total_played';

  // Datum als YYYY-MM-DD String
  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function yesterday() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  }

  // Streak berechnen und ggf. aktualisieren
  function updateStreak() {
    const last    = localStorage.getItem(KEY_LAST_PLAYED);
    let   streak  = parseInt(localStorage.getItem(KEY_STREAK) || '0', 10);
    const todayStr = today();

    if (last === todayStr) {
      // Heute schon gespielt — Streak bleibt
      return streak;
    } else if (last === yesterday()) {
      // Gestern gespielt — Streak wächst
      streak += 1;
    } else {
      // Lücke — Streak bricht
      streak = 1;
    }

    localStorage.setItem(KEY_STREAK, streak.toString());
    localStorage.setItem(KEY_LAST_PLAYED, todayStr);
    return streak;
  }

  // Gespielte Szenarien verwalten
  function getPlayedIds() {
    try {
      return JSON.parse(localStorage.getItem(KEY_PLAYED) || '[]');
    } catch {
      return [];
    }
  }

  function addPlayedId(id) {
    const played = getPlayedIds();
    if (!played.includes(id)) {
      played.push(id);
      localStorage.setItem(KEY_PLAYED, JSON.stringify(played));
    }
    const total = (parseInt(localStorage.getItem(KEY_TOTAL) || '0', 10)) + 1;
    localStorage.setItem(KEY_TOTAL, total.toString());
  }

  // Öffentliche Funktion: vom Szenario aufrufen wenn abgeschlossen
  function markPlayed(scenarioId) {
    addPlayedId(scenarioId);
    const streak = updateStreak();
    renderBadge(streak);
    return streak;
  }

  // Badge in die Seite rendern
  function renderBadge(streak) {
    // Bestehenden Badge entfernen falls vorhanden
    const existing = document.getElementById('streak-badge');
    if (existing) existing.remove();

    const played = getPlayedIds().length;
    const label  = streak === 1
      ? 'Erstes Histogramm heute'
      : streak + ' Tage in Folge';

    const badge = document.createElement('div');
    badge.id = 'streak-badge';
    badge.innerHTML = `
      <div class="streak-inner">
        <span class="streak-flame">🔥</span>
        <div class="streak-text">
          <span class="streak-count">${streak}</span>
          <span class="streak-label">${streak === 1 ? 'Tag' : 'Tage'} Streak</span>
        </div>
        <div class="streak-divider"></div>
        <div class="streak-text">
          <span class="streak-count">${played}</span>
          <span class="streak-label">gespielt</span>
        </div>
      </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      #streak-badge {
        position: fixed;
        bottom: 1.5rem;
        right: 1.5rem;
        z-index: 100;
        animation: streakIn 0.4s ease;
      }
      @keyframes streakIn {
        from { opacity: 0; transform: translateY(12px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .streak-inner {
        background: #1a1814;
        color: #f7f4ef;
        border-radius: 3px;
        padding: 0.7rem 1.1rem;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        box-shadow: 0 4px 16px rgba(0,0,0,0.25);
        font-family: 'Georgia', serif;
      }
      .streak-flame {
        font-size: 1.4rem;
        line-height: 1;
      }
      .streak-text {
        display: flex;
        flex-direction: column;
        align-items: center;
        line-height: 1.2;
      }
      .streak-count {
        font-size: 1.25rem;
        color: #c4780a;
        letter-spacing: -0.02em;
      }
      .streak-label {
        font-size: 0.65rem;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        opacity: 0.6;
      }
      .streak-divider {
        width: 1px;
        height: 2rem;
        background: rgba(247,244,239,0.15);
      }
      @media (max-width: 480px) {
        #streak-badge { bottom: 1rem; right: 1rem; }
        .streak-inner { padding: 0.6rem 0.9rem; gap: 0.6rem; }
        .streak-count { font-size: 1.1rem; }
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(badge);

    // Nach 6 Sekunden leicht verblassen — bleibt aber sichtbar
    setTimeout(() => {
      badge.style.transition = 'opacity 1s ease';
      badge.style.opacity = '0.75';
    }, 6000);
  }

  // Beim Laden: Badge zeigen wenn schon Streak vorhanden
  function init() {
    const streak = parseInt(localStorage.getItem(KEY_STREAK) || '0', 10);
    const last   = localStorage.getItem(KEY_LAST_PLAYED);
    const played = getPlayedIds().length;

    // Nur anzeigen wenn heute oder gestern gespielt wurde
    if (streak > 0 && (last === today() || last === yesterday()) && played > 0) {
      // Kleiner, passiver Badge — kein Feuerelement beim reinen Besuch
      const badge = document.createElement('div');
      badge.id = 'streak-badge';
      badge.innerHTML = `
        <div class="streak-inner">
          <span class="streak-flame">🔥</span>
          <div class="streak-text">
            <span class="streak-count">${streak}</span>
            <span class="streak-label">${streak === 1 ? 'Tag' : 'Tage'}</span>
          </div>
          <div class="streak-divider"></div>
          <div class="streak-text">
            <span class="streak-count">${played}</span>
            <span class="streak-label">gespielt</span>
          </div>
        </div>
      `;
      document.body.appendChild(badge);
    }
  }

  // Auto-init wenn DOM bereit
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { markPlayed, getPlayedIds };

})();
