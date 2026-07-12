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
index.html                  Hauptseite (Feed, Player, Upload-Formular)
css/style.css                Design
js/app.js                    Gesamte Frontend-Logik
netlify/functions/upload.js  POST /api/upload      → Video + Metadaten speichern
netlify/functions/videos.js  GET  /api/videos       → Liste aller Videos
netlify/functions/video-file.js  GET /api/video/:id → Video-Datei ausliefern
netlify/functions/thumbnail.js   GET /api/thumbnail/:id → Vorschaubild
netlify/functions/like.js    POST /api/like/:id     → Like zählen
netlify/functions/view.js    POST /api/view/:id     → Aufruf zählen
netlify/functions/comment.js POST /api/comment/:id  → Kommentar speichern
netlify.toml                 Netlify-Konfiguration
package.json                 Abhängigkeit: @netlify/blobs
```

## Wichtiger Hinweis zur Dateigröße

Serverless Functions haben ein Limit für die Anfragegröße. Deshalb sind
Video-Uploads hier auf **maximal 4 MB** begrenzt (kurze Clips, wie man sie
von TikTok kennt). Das reicht für kurze Video-Clips in guter Kompression.
Für größere Dateien müsste man einen externen Video-/Objektspeicher mit
direktem Client-Upload anbinden – für dieses Projekt reicht die einfache
Variante über Netlify Blobs völlig aus.

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
  aus dem Video)
- 🏠 Feed aller Videos mit Suche
- ▶️ Videoplayer-Ansicht mit Likes, Aufrufen und Kommentaren
- 💾 Alles wird dauerhaft im Backend gespeichert (Netlify Blobs) – Videos
  sind für alle Besucher sichtbar, auch nach einem Neuladen der Seite
- 📱 Responsives, dunkles Design im Social-Media-Stil
