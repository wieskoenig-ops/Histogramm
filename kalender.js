// Kalender für das „Histogramm des Tages“: findet Anlässe, die zu einem Szenario passen.
// Seit 17.11.2026 bestimmen Anlässe nicht mehr die Auswahl, sie erscheinen nur als „Übrigens: …“ unter dem Rätsel des Tages.
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
    { m: 10, d: 16, name: 'der Welternährungstag', s: ['norman-borlaug'] },
    { m: 10, d: 31, name: 'der Reformationstag', s: ['martin-luther'] },
    { m: 12, d: 10, name: 'der Tag der Nobelpreisverleihung', s: ['alfred-nobel', 'marie-curie', 'daniel-kahneman', 'wangari-maathai', 'mandela', 'norman-borlaug'] }
  ];

  // Planbare Ereignisse mit festem Zeitraum (von/bis als JJJJ-MM-TT). Die Wochenaufgabe ergänzt neue,
  // sobald Termine feststehen (Nobelpreis-Bekanntgaben, Olympia, Weltmeisterschaften, Klimakonferenzen …).
  // Mehrtägige zählen nur am ersten und letzten Tag.
  // Optional: text (eigener Satz statt „Heute beginnt/endet …“), s (passende Szenarien, darf fehlen) und punkte (Standard 80).
  // Seit 17.11.2026 wählen Anlässe nicht mehr das Tagesrätsel, sie erscheinen nur als „Übrigens: …“.
  const EREIGNISSE = [
    { von: '2026-11-09', bis: '2026-11-20', name: 'die Weltklimakonferenz COP31 in Antalya', s: ['paris-2015', 'wangari-maathai', 'rachel-carson', 'james-lovelock'] }
  ];

  // Geburts- und Todestage von Persönlichkeiten OHNE eigenes Histogramm, nur für „Übrigens: …“.
  // Nur gut belegte Daten (gregorianisch, keine Julianischen Daten). wer = kurze Einordnung.
  // geb/tod als 'JJJJ-MM-TT'; tod darf fehlen (dann nur Geburtstag). Nur Verstorbene aufnehmen.
  const PERSONEN = [
    { name: 'Albert Einstein', wer: 'Physiker', geb: '1879-03-14', tod: '1955-04-18' },
    { name: 'Johann Wolfgang von Goethe', wer: 'Dichter', geb: '1749-08-28', tod: '1832-03-22' },
    { name: 'Friedrich Schiller', wer: 'Dichter', geb: '1759-11-10' },
    { name: 'Charles Darwin', wer: 'Naturforscher', geb: '1809-02-12', tod: '1882-04-19' },
    { name: 'Immanuel Kant', wer: 'Philosoph', geb: '1724-04-22', tod: '1804-02-12' },
    { name: 'Hannah Arendt', wer: 'politische Denkerin', geb: '1906-10-14', tod: '1975-12-04' },
    { name: 'Anne Frank', wer: 'Tagebuchschreiberin', geb: '1929-06-12' },
    { name: 'Martin Luther King', wer: 'Bürgerrechtler', geb: '1929-01-15', tod: '1968-04-04' },
    { name: 'Charlie Chaplin', wer: 'Filmemacher', geb: '1889-04-16', tod: '1977-12-25' },
    { name: 'John Lennon', wer: 'Musiker', geb: '1940-10-09', tod: '1980-12-08' },
    { name: 'Ada Lovelace', wer: 'Mathematikerin', geb: '1815-12-10' },
    { name: 'Franz Kafka', wer: 'Schriftsteller', geb: '1883-07-03', tod: '1924-06-03' },
    { name: 'Alexander von Humboldt', wer: 'Naturforscher', geb: '1769-09-14', tod: '1859-05-06' },
    { name: 'Marlene Dietrich', wer: 'Schauspielerin', geb: '1901-12-27', tod: '1992-05-06' },
    { name: 'Konrad Zuse', wer: 'Computerpionier', geb: '1910-06-22', tod: '1995-12-18' },
    { name: 'Stephen Hawking', wer: 'Physiker', geb: '1942-01-08', tod: '2018-03-14' },
    { name: 'John F. Kennedy', wer: 'US-Präsident', geb: '1917-05-29', tod: '1963-11-22' },
    { name: 'Pablo Picasso', wer: 'Maler', geb: '1881-10-25', tod: '1973-04-08' },
    { name: 'Vincent van Gogh', wer: 'Maler', geb: '1853-03-30', tod: '1890-07-29' },
    { name: 'Neil Armstrong', wer: 'Astronaut', geb: '1930-08-05', tod: '2012-08-25' },
    { name: 'Bertha von Suttner', wer: 'Friedensnobelpreisträgerin', geb: '1843-06-09', tod: '1914-06-21' },
    { name: 'Bertolt Brecht', wer: 'Dramatiker', geb: '1898-02-10', tod: '1956-08-14' },
    { name: 'Thomas Edison', wer: 'Erfinder', geb: '1847-02-11', tod: '1931-10-18' },
    { name: 'Simone de Beauvoir', wer: 'Philosophin', geb: '1908-01-09', tod: '1986-04-14' },
    { name: 'Heinrich Heine', wer: 'Dichter', geb: '1797-12-13', tod: '1856-02-17' },
    { name: 'Karl Marx', wer: 'Philosoph und Ökonom', geb: '1818-05-05', tod: '1883-03-14' },
    { name: 'Charles Dickens', wer: 'Schriftsteller', geb: '1812-02-07', tod: '1870-06-09' },
    { name: 'Jane Austen', wer: 'Schriftstellerin', geb: '1775-12-16', tod: '1817-07-18' },
    { name: 'Albert Schweitzer', wer: 'Arzt und Theologe', geb: '1875-01-14', tod: '1965-09-04' },
    { name: 'Steve Jobs', wer: 'Apple-Gründer', geb: '1955-02-24', tod: '2011-10-05' }
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
      liste.push({ s: e.s, t: e.t, name: e.name || '', text: text, punkte: punkte + rundBonus(n) });
    });

    // Persönlichkeiten ohne Histogramm: schwächer als alles mit Szenariobezug.
    PERSONEN.forEach(function(pe) {
      [['geburt', pe.geb], ['tod', pe.tod]].forEach(function(x) {
        if (!x[1]) return;
        const q = x[1].split('-').map(Number);
        if (q[1] !== monat || q[2] !== tag) return;
        const n = jahr - q[0];
        if (n < 1) return;
        const text = x[0] === 'geburt'
          ? 'Heute vor ' + n + ' Jahren wurde ' + pe.name + ' geboren, ' + pe.wer + '.'
          : 'Heute vor ' + n + ' Jahren starb ' + pe.name + ', ' + pe.wer + '.';
        liste.push({ s: '_' + pe.name + x[0], t: x[0], name: pe.name, text: text, punkte: 30 + rundBonus(n) });
      });
    });

    function ausThema(s, text, punkte, t) {
      const passend = (s || []).filter(function(x) { return da.has(x); });
      // Ohne passendes Szenario trotzdem als „Übrigens“-Anlass verwendbar.
      if (!passend.length) { liste.push({ s: '_' + text, t: t, text: text, punkte: punkte }); return; }
      // Innerhalb eines Themas wechselt das Szenario von Jahr zu Jahr bzw. Tag zu Tag.
      passend.sort(function(a, b) { return hash(day + a) - hash(day + b); });
      passend.forEach(function(x, i) { liste.push({ s: x, t: t, text: text, punkte: punkte - i }); });
    }
    AKTIONSTAGE.forEach(function(a) {
      if (a.m === monat && a.d === tag) ausThema(a.s, 'Heute ist ' + a.name + '.', 50, 'tag');
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
      ausThema(ev.s, text, ev.punkte || 80, 'ereignis');
    });

    liste.sort(function(a, b) { return (b.punkte - a.punkte) || (hash(day + a.s) - hash(day + b.s)); });
    const gesehen = new Set();
    return liste.filter(function(a) { if (gesehen.has(a.s)) return false; gesehen.add(a.s); return true; });
  }

  return { anlaesse: anlaesse, MONATE: MONATE };
})();
