# Histogramm — Konzeptdokument
*Erstellt Juni 2026 — aus Prototyping-Session mit Epitorials/Organelle Edu*

---

## I. Grundidee

Ein tägliches Entscheidungsmedium. Kein Lernprodukt — ein Ritual.

> Jeden Tag ein historischer Moment. Eine Seite lesen. Drei Entscheidungen treffen. Abends sehen, wie die Welt entschieden hat.

Die Referenz ist Wordle: nicht wegen des Inhalts, sondern wegen der Mechanik. Täglich, alle spielen dasselbe, Ergebnis teilbar, 5 Minuten. Der soziale Vergleich ist der Sog.

Der Unterschied zu einem Quiz: Es gibt keine richtige Antwort. Nur die eigene — und die aller anderen.

---

## II. Kernmechanik

**Tagesrhythmus:** Ein Moment pro Tag. Alle Nutzer spielen denselben Moment zur gleichen Zeit. Kein individueller Pfad, keine Persistenz — die Geschichte gehört allen.

**Ablauf:**
1. Kurze Situationsbeschreibung (Rolle, Ort, Zeitpunkt, Lage)
2. Drei Entscheidungsoptionen — keine eindeutig richtig
3. Nach Klick: Balkendiagramm mit Weltverteilung + kurzer Kommentar
4. Teilbarer Ergebnistext (WhatsApp, Signal, Social)

**Begründungspflicht:** Optional in der Demo, aber als Produktelement prüfenswert — ohne sie verliert die Entscheidung didaktisches Gewicht. Für den reinen Consumer-Kontext möglicherweise zu viel Reibung.

**Freier Zug:** Nutzer können eine eigene, nicht vorgegebene Option eintippen — wenn sie begründen können warum. Noch nicht implementiert, aber konzeptuell wertvoll.

---

## III. Verhältnis zu Organelle Edu

Histogramm ist ein **Vorprodukt** — kein Konkurrenzprodukt.

Wer Histogramm täglich spielt, kennt das Format. Wenn der Lehrer dann Organelle Edu vorschlägt, braucht es keine Erklärung. Oder der Schüler schlägt es dem Lehrer vor.

Der Übergang funktioniert in beide Richtungen:
- Schüler kennt Histogramm → ist begeistert wenn Lehrer Organelle vorschlägt
- Lehrer zeigt Histogramm der Klasse → natürlicher Einstieg ins Format

Histogramm ist B2C, viral, kostenlos. Organelle Edu ist B2B, Schule, DSGVO. Beide teilen das Grundprinzip: *Entscheidungen haben Konsequenzen.*

---

## IV. Erstes Demo-Szenario: Titanic

**14. April 1912, Nordatlantik.** Rolle: Zweiter Offizier, RMS Titanic.

Drei Entscheidungsmomente über drei "Tage" (in der Demo komprimiert):

- **Nacht 1, 23:40 Uhr:** Stoß wahrgenommen, Schaden unklar. Kapitän wecken / abwarten / still Boote vorbereiten?
- **Nacht 2, 00:20 Uhr:** Schiff sinkt sicher. Boote reichen für die Hälfte. Protokoll / Zwischendeck benachrichtigen / erstes Boot sofort ablassen?
- **Nacht 3, 02:10 Uhr:** Letztes Boot, ein Platz. Einsteigen / Platz abgeben / bleiben ohne Kalkulation?

Stärke des Szenarios: Keine Entscheidung ist eindeutig falsch. Alle haben historische Entsprechungen. Kein Vorwissen nötig.

**Demo live:** https://wieskoenig-ops.github.io/Histogramm/
**GitHub:** wieskoenig-ops/Histogramm

---

## V. Erweiterungsideen

**Knotenpunkte:** Entscheidungen *vor* dem bekannten Moment. Die Titanic-Katastrophe beginnt nicht um 23:40 — Eiswarnungen kamen Tage früher. Ein 5-Tage-Format das rückwärts aufbaut: an welchem Punkt hätte die Mehrheit das Schiff gerettet?

Allgemeines Prinzip: "Verändere die Weltgeschichte" als stärkstes Versprechen. Nicht nur *wie hättest du entschieden* — sondern *was wäre passiert, wenn die Mehrheit anders entschieden hätte.*

**Szenarien-Pool (erste Ideen):**
- Titanic 1912 (Demo, fertig)
- Sarajevo, 28. Juni 1914 — der Fahrer biegt falsch ab
- Kuba-Krise Oktober 1962 — Vasili Arkhipov verweigert den Torpedo
- Tschernobyl, 25. April 1986 — der Testleiter zögert
- Weitere: offen

**Mehrsprachigkeit:** Deutsch zuerst, Englisch für Reichweite. Strukturell von Anfang an mitdenken.

---

## VI. Design

Farbraum bewusst von Epitorials abgesetzt:
- Warmes Cremeweiß statt dunklem Hintergrund
- Bernstein-Amber als einziger Akzent
- Typografisches Datum als einziges visuelles Element — kein Foto, kein Klischee
- Georgia Serif, Telegraph-Linien als Hintergrundtextur

Geschwisterprodukte: erkennbar verwandt, eigenständig in Identität.

---

## VII. Technik

**Demo (aktuell):** Vollständig statisches HTML, simulierte Prozentzahlen, kein Backend. GitHub Pages, manueller Upload.

**Produktversion (später):**
- Echte Abstimmungsdaten statt simulierter Prozente → kleine Datenbank nötig
- Tagessteuerung: welcher Moment erscheint wann
- Teilfunktion mit echten Zahlen ("Du warst unter den ersten 1.200 die entschieden haben")
- Mögliches Backend: Cloudflare Workers + KV (analog zu Epitorials Session 2)

---

## VIII. Offene Entscheidungen

- Eigenes Projekt ("Histogramm") oder unter Epitorials-Dach?
- Begründungspflicht: Pflicht, optional, oder weglassen für Consumer-Kontext?
- Freier Zug: implementieren oder erst in Schulversion?
- Mehrsprachigkeit: von Anfang an oder nach erstem Pilot?
- Namensgebung: "Histogramm" als Endname? (Hat wissenschaftliche Eleganz, aber Erkennbarkeit prüfen)
- Wann braucht es echte Abstimmungsdaten — ab wie vielen Nutzern wird die Simulation unglaubwürdig?
