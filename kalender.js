// Kalender für das „Histogramm des Tages“: findet Anlässe, die zu einem Szenario passen.
// Automatische Jahrestage (Szenendaten, Geburts- und Todestage) kommen aus kalender-daten.js,
// erzeugt von histogramm-tools/kalender_bauen.py. Die Listen unten werden von Hand gepflegt.
const Kalender = (function() {

  // Wiederkehrende Aktions- und Gedenktage mit Themenbezug (Monat, Tag).
  // Ernste Gedenktage (z. B. 27. Januar, 9. November) bewusst NICHT aufnehmen.
  const AKTIONSTAGE = [
    { m: 2,  d: 11, name: 'der Internationale Tag der Frauen und Mädchen in der Wissenschaft', s: ['marie-curie', 'lise-meitner', 'rosalind-franklin', 'rachel-carson'] },
    { m: 3,  d: 8,  name: 'der Internationale Frauentag', s: ['rosa-parks', 'wangari-maathai', 'marie-curie', 'rosa-luxemburg', 'astrid-lindgren', 'frida-kahlo', 'lise-meitner', 'rosalind-franklin', 'rachel-carson'] },
    { m: 3,  d: 21, name: 'der Internationale Tag gegen Rassismus', s: ['rosa-parks', 'mandela', 'peter-norman', 'cassius-clay'] },
    { m: 4,  d: 7,  name: 'der Weltgesundheitstag', s: ['semmelweis', 'robert-koch', 'alexander-fleming'] },
    { m: 4,  d: 22, name: 'der Tag der Erde', s: ['rachel-carson', 'james-lovelock', 'wangari-maathai', 'paris-2015'] },
    { m: 4,  d: 23, name: 'der Welttag des Buches', s: ['astrid-lindgren', 'mark-twain', 'thomas-mann', 'duerrenmatt', 'gutenberg'] },
    { m: 5,  d: 3,  name: 'der Internationale Tag der Pressefreiheit', s: ['enthuellungsplattform', 'emil-zatopek', 'zappa'] },
    { m: 6,  d: 5,  name: 'der Weltumwelttag', s: ['wangari-maathai', 'rachel-carson', 'paris-2015', 'james-lovelock'] },
    { m: 6,  d: 20, name: 'der Weltflüchtlingstag', s: ['thomas-mann', 'lise-meitner', 'freud', 'fritz-haber'] },
    { m: 6,  d: 21, name: 'die Fête de la Musique', s: ['beethoven', 'mozart', 'miles-davis', 'zappa'] },
    { m: 9,  d: 21, name: 'der Internationale Tag des Friedens', s: ['gandhi', 'willy-brandt', 'alfred-nobel', 'kuba-krise'] },
    { m: 10, d: 2,  name: 'der Internationale Tag der Gewaltlosigkeit', s: ['gandhi'] },
    { m: 10, d: 31, name: 'der Reformationstag', s: ['martin-luther'] },
    { m: 12, d: 10, name: 'der Tag der Nobelpreisverleihung', s: ['alfred-nobel', 'marie-curie', 'daniel-kahneman', 'wangari-maathai', 'mandela'] }
  ];

  // Planbare Ereignisse mit festem Zeitraum (von/bis als JJJJ-MM-TT). Die Wochenaufgabe ergänzt neue,
  // sobald Termine feststehen (Nobelpreis-Bekanntgaben, Olympia, Weltmeisterschaften, Klimakonferenzen …).
  // Mehrtägige zählen nur am ersten und letzten Tag.
  // Optional: text (eigener Satz statt „Heute beginnt/endet …“) und punkte (Standard 80). Für ein Szenario,
  // das eigens für einen Termin geschrieben wurde: von = bis = Termin, s = [slug], punkte: 500.
  const EREIGNISSE = [
    { von: '2026-11-09', bis: '2026-11-20', name: 'die Weltklimakonferenz COP31 in Antalya', s: ['paris-2015', 'wangari-maathai', 'rachel-carson', 'james-lovelock'] }
  ];

  const RAENDER_AB = '2026-11-13';

  const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  function rundBonus(n) {
    if (n % 100 === 0) return 100;
    if (n % 50 === 0) return 60;
    if (n % 25 === 0) return 40;
    if (n % 10 === 0) return 15;
    return 0;
  }

  // day: 'JJJJ-MM-TT'; slugs: vorhandene Szenarien. Liefert Anlässe, stärkster zuerst, je Szenario einer.
  function anlaesse(day, slugs) {
    const p = day.split('-').map(Number);
    const jahr = p[0], monat = p[1], tag = p[2];
    const da = new Set(slugs);
    const daten = window.KALENDER_DATEN || [];
    const verstorben = new Set(daten.filter(function(e) { return e.t === 'tod'; }).map(function(e) { return e.s; }));
    const liste = [];

    daten.forEach(function(e) {
      if (e.m !== monat || e.d !== tag || !da.has(e.s)) return;
      const n = jahr - e.y;
      if (n < 1) return;
      let text, punkte;
      if (e.t === 'moment') {
        text = 'Am ' + e.txt + ', heute vor ' + n + ' Jahren, spielt ' + (e.n ? 'Moment ' + e.n + ' dieses Histogramms.' : 'dieses Histogramm.');
        punkte = 100;
      } else if (e.t === 'geburt') {
        text = verstorben.has(e.s) ? 'Heute vor ' + n + ' Jahren wurde ' + e.name + ' geboren.' : e.name + ' wird heute ' + n + ' Jahre alt.';
        punkte = 60;
      } else {
        text = 'Heute vor ' + n + ' Jahren starb ' + e.name + '.';
        punkte = 60;
      }
      liste.push({ s: e.s, text: text, punkte: punkte + rundBonus(n) });
    });

    function ausThema(s, text, punkte) {
      const passend = s.filter(function(x) { return da.has(x); });
      if (!passend.length) return;
      // Innerhalb eines Themas wechselt das Szenario von Jahr zu Jahr bzw. Tag zu Tag.
      passend.sort(function(a, b) { return hash(day + a) - hash(day + b); });
      passend.forEach(function(x, i) { liste.push({ s: x, text: text, punkte: punkte - i }); });
    }
    AKTIONSTAGE.forEach(function(a) {
      if (a.m === monat && a.d === tag) ausThema(a.s, 'Heute ist ' + a.name + '.', 50);
    });
    // Mehrtägige Ereignisse zählen nur am ersten und am letzten Tag („Heute beginnt …“, „Heute endet …“),
    // damit nicht tagelang derselbe Anlass die Auswahl bestimmt. Vor RAENDER_AB galt: jeder Tag zählt.
    EREIGNISSE.forEach(function(ev) {
      if (day < ev.von || day > ev.bis) return;
      let text = ev.text;
      if (ev.von === ev.bis) text = text || ('Heute ist ' + ev.name + '.');
      else if (day < RAENDER_AB) text = text || ('Gerade läuft ' + ev.name + '.');
      else if (day === ev.von) text = text || ('Heute beginnt ' + ev.name + '.');
      else if (day === ev.bis) text = text || ('Heute endet ' + ev.name + '.');
      else return;
      ausThema(ev.s, text, ev.punkte || 80);
    });

    liste.sort(function(a, b) { return (b.punkte - a.punkte) || (hash(day + a.s) - hash(day + b.s)); });
    const gesehen = new Set();
    return liste.filter(function(a) { if (gesehen.has(a.s)) return false; gesehen.add(a.s); return true; });
  }

  return { anlaesse: anlaesse, MONATE: MONATE };
})();
