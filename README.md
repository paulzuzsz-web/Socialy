# Socialy 🎬

Socialy ist eine kleine Video-Sharing-Plattform (im Stil von TikTok/YouTube):
Nutzer können Videos mit Titel, Beschreibung und Namen hochladen, alle
Besucher der Seite können die Videos ansehen, liken und kommentieren.

Die Seite ist eine **statische Webseite (HTML/CSS/JS)** mit einem echten
**Backend aus Netlify Functions**. Gespeichert wird alles dauerhaft in
**Netlify Blobs** (Video-Dateien, Thumbnails, Titel/Beschreibung, Likes,
Views und Kommentare) – es ist keine externe Datenbank nötig.

## Projektstruktur

```
index.html                          Hauptseite (Feed, Player, Upload-Formular)
css/style.css                        Design inkl. aller Themes
js/app.js                            Gesamte Frontend-Logik
js/i18n.js                           Übersetzungen (DE/EN/FR/ES)
js/themes.js                         Design-Definitionen
netlify/functions/upload-chunk.js    POST /api/upload-chunk    → einzelnes Video-Chunk speichern
netlify/functions/upload-finalize.js POST /api/upload-finalize → Chunks zusammenfügen + Metadaten speichern
netlify/functions/videos.js          GET  /api/videos           → Liste aller Videos
netlify/functions/video-file.js      GET  /api/video/:id        → Video-Datei ausliefern
netlify/functions/thumbnail.js       GET  /api/thumbnail/:id    → Vorschaubild
netlify/functions/like.js            POST /api/like/:id         → Like zählen
netlify/functions/view.js            POST /api/view/:id         → Aufruf zählen
netlify/functions/comment.js         POST /api/comment/:id      → Kommentar speichern
netlify.toml                         Netlify-Konfiguration
package.json                         Abhängigkeit: @netlify/blobs
```

## Sprachen

Über das Globus-Icon oben rechts kann zwischen **Deutsch, Englisch,
Französisch und Spanisch** gewechselt werden. Die Auswahl wird im Browser
gespeichert (`localStorage`) und bleibt beim nächsten Besuch erhalten. Beim
ersten Aufruf wird automatisch die Browsersprache erkannt.

## Designs

Über das Paletten-Icon oben rechts lässt sich das Design der Seite ändern:

- **Neon** – der Standard: dunkel, Pink/Violett (TikTok-Stil)
- **Berg** – Tannengrün, Fels-Grau und warmes Amber, wie eine Bergseenacht
- **Ozean** – tiefes Blau mit türkisen Akzenten
- **Sonnenuntergang** – warmes Dunkelrot/Orange
- **Hell** – klassisches, helles Design

Jedes Design ist rein über CSS-Variablen definiert (`css/style.css`,
Abschnitt "Themes") – weitere eigene Designs lassen sich einfach ergänzen,
indem man dort einen neuen `[data-theme="..."]`-Block hinzufügt und ihn in
`js/themes.js` in der `THEMES`-Liste einträgt.

## Größere Video-Uploads (Chunk-Upload)

Serverless Functions haben ein Limit für die Größe einer einzelnen Anfrage
(ca. 6 MB). Damit trotzdem größere Videos hochgeladen werden können, wird
die Datei im Browser automatisch in **3-MB-Häppchen (Chunks)** zerlegt und
nacheinander/parallel hochgeladen (`/api/upload-chunk`). Ist die Datei
komplett übertragen, fügt `/api/upload-finalize` alle Chunks serverseitig
wieder zu einer Datei zusammen und speichert sie dauerhaft in Netlify Blobs.

Dadurch liegt das aktuelle Limit bei **50 MB pro Video** (einstellbar über
`MAX_TOTAL_BYTES` in `netlify/functions/upload-finalize.js` sowie
`MAX_TOTAL_MB` in `js/app.js` – beide Werte müssen übereinstimmen). Ein
Fortschrittsbalken im Upload-Formular zeigt den Live-Status an.

## Deployment auf Netlify

### Variante A – Über GitHub (empfohlen, funktioniert garantiert mit den Functions)

1. Lade dieses Projekt in ein eigenes GitHub-Repository hoch (z. B. über
   GitHub Desktop oder `git push`).
2. Gehe auf [app.netlify.com](https://app.netlify.com) → **"Add new site"**
   → **"Import an existing project"**.
3. Wähle dein GitHub-Repository aus.
4. Build-Einstellungen: **Build command leer lassen**, **Publish directory:
   `.`** (Netlify erkennt die `netlify.toml` automatisch, dort ist schon
   alles richtig eingestellt).
5. Auf **"Deploy site"** klicken – fertig! Netlify installiert automatisch
   `@netlify/blobs` und aktiviert die Functions.

### Variante B – Drag & Drop (schneller Test)

1. Gehe auf [app.netlify.com/drop](https://app.netlify.com/drop).
2. Ziehe den **gesamten Projektordner** (mit `netlify.toml`,
   `netlify/functions`, `index.html` usw.) in das Upload-Feld.
3. Netlify baut die Seite inkl. Functions automatisch.

> Netlify Blobs benötigt keine zusätzliche Konfiguration – sobald die Seite
> über Netlify läuft, funktioniert das Speichern automatisch.

### Lokal testen (optional)

```bash
npm install
npx netlify-cli dev
```

Das startet die Seite inkl. Functions und Blobs-Speicher lokal (Netlify CLI
und ein verknüpftes Netlify-Projekt vorausgesetzt).

## Funktionen

- 📤 Videos hochladen (Titel, Beschreibung, Name, automatisches Thumbnail
  aus dem Video, bis 50 MB dank Chunk-Upload mit Fortschrittsanzeige)
- 🏠 Feed aller Videos mit Suche
- ▶️ Videoplayer-Ansicht mit Likes, Aufrufen und Kommentaren
- 🌐 Umschaltbare Sprache: Deutsch, Englisch, Französisch, Spanisch
- 🎨 Umschaltbares Design: Neon, Berg, Ozean, Sonnenuntergang, Hell
- 💾 Alles wird dauerhaft im Backend gespeichert (Netlify Blobs) – Videos
  sind für alle Besucher sichtbar, auch nach einem Neuladen der Seite
- 📱 Responsives Design im Social-Media-Stil
