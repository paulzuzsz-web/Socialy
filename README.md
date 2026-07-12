# Socialy 🎬

Socialy ist eine kleine Video-Sharing-Plattform (im Stil von TikTok/YouTube):
Nutzer erstellen ein Konto, melden sich an und können Videos mit Titel und
Beschreibung hochladen. Alle angemeldeten Besucher können die Videos ansehen,
liken und kommentieren.

Die Seite ist eine **statische Webseite (HTML/CSS/JS)** mit einem echten
**Backend aus Netlify Functions**. Gespeichert wird alles dauerhaft in
**Netlify Blobs** (Konten, Video-Dateien, Thumbnails, Titel/Beschreibung,
Likes, Views und Kommentare) – es ist keine externe Datenbank nötig.

## Projektstruktur

```
index.html                          Hauptseite (Login/Registrierung, Feed, Player, Upload, Einstellungen)
css/style.css                        Design inkl. aller Themes
js/app.js                            Gesamte Frontend-Logik
js/auth.js                           Frontend-Anmeldestatus (Login/Registrierung/Logout)
js/i18n.js                           Übersetzungen (DE/EN/FR/ES)
js/themes.js                         Design-Definitionen
netlify/functions/auth-register.js   POST /api/auth/register    → Konto erstellen
netlify/functions/auth-login.js      POST /api/auth/login       → Anmelden
netlify/functions/auth-logout.js     POST /api/auth/logout      → Abmelden
netlify/functions/auth-me.js         GET  /api/auth/me          → aktuelle Sitzung prüfen
netlify/functions/auth-utils.js      Gemeinsame Hilfsfunktionen (Passwort-Hashing, Sessions, Cookies)
netlify/functions/upload-chunk.js    POST /api/upload-chunk    → einzelnes Video-Chunk speichern
netlify/functions/upload-finalize.js POST /api/upload-finalize → Chunks zusammenfügen + Metadaten speichern
netlify/functions/videos.js          GET  /api/videos           → Liste aller Videos
netlify/functions/video-file.js      GET  /api/video/:id        → Video-Datei ausliefern
netlify/functions/thumbnail.js       GET  /api/thumbnail/:id    → Vorschaubild
netlify/functions/like.js            POST /api/like/:id         → Like zählen (pro Konto einmalig)
netlify/functions/view.js            POST /api/view/:id         → Aufruf zählen
netlify/functions/comment.js         POST /api/comment/:id      → Kommentar speichern
netlify.toml                         Netlify-Konfiguration
package.json                         Abhängigkeit: @netlify/blobs
```

## Konten & Anmeldung

Socialy verlangt jetzt ein echtes Konto: Beim ersten Besuch landet man auf
einer Anmelde-/Registrierungsseite und muss sich registrieren oder anmelden,
bevor die App nutzbar wird. Kein Konto, kein Zugriff.

- **Registrierung**: Benutzername (3–24 Zeichen: Buchstaben, Zahlen, `_`) und
  Passwort (mind. 6 Zeichen). Passwörter werden serverseitig mit Node's
  `crypto.scrypt` gehasht und gesalzen gespeichert – niemals im Klartext.
- **Anmeldung**: Erstellt eine Sitzung, die als sicheres, `HttpOnly`-Cookie
  (`socialy_session`) im Browser gespeichert wird. Dadurch bleibt man auch
  nach einem Neuladen der Seite angemeldet, ohne dass JavaScript auf das
  Cookie zugreifen kann.
- **Uploads, Likes und Kommentare** werden serverseitig immer dem
  angemeldeten Konto zugeordnet (nicht mehr einem frei eingetippten Namen) –
  niemand kann sich mehr als jemand anderes ausgeben. Ein Like pro Konto und
  Video wird zusätzlich serverseitig durchgesetzt.

## Einstellungen

Über das Zahnrad-Icon (oder den Konto-Chip) oben rechts öffnet sich ein
Einstellungen-Fenster mit drei Bereichen:

- **Konto** – zeigt Avatar, Benutzername, Mitglied-seit-Datum und den
  Abmelden-Button.
- **Design** – Auswahl-Raster mit Live-Vorschau aller fünf Themes.
- **Sprache** – Auswahl der Oberflächensprache.

## Sprachen

Über die Sprach-Einstellungen kann zwischen **Deutsch, Englisch, Französisch
und Spanisch** gewechselt werden. Die Auswahl wird im Browser gespeichert
(`localStorage`) und bleibt beim nächsten Besuch erhalten. Beim ersten
Aufruf wird automatisch die Browsersprache erkannt.

## Designs

In den Design-Einstellungen lässt sich das Erscheinungsbild der Seite
ändern:

- **Neon** – der Standard: dunkel, Pink/Violett (TikTok-Stil)
- **Berg** – Tannengrün, Fels-Grau und warmes Amber, wie eine Bergseenacht
- **Ozean** – tiefes Blau mit türkisen Akzenten
- **Sonnenuntergang** – warmes Dunkelrot/Orange
- **Hell** – klassisches, helles Design

Jedes Design ist rein über CSS-Variablen definiert (`css/style.css`,
Abschnitt "Themes") – weitere eigene Designs lassen sich einfach ergänzen,
indem man dort einen neuen `[data-theme="..."]`-Block hinzufügt und ihn in
`js/themes.js` in der `THEMES`-Liste einträgt.

## Logo

Die Wortmarke ist ein eigenes "S"-Zeichen im TikTok-artigen Duotone/Glitch-
Stil: zwei leicht versetzte, farbige Kopien des Buchstabens hinter einer
weißen Hauptversion erzeugen den bekannten Schichteffekt – umgesetzt in
reinem CSS (`.s-glitch` in `css/style.css`), keine Bilddatei nötig, und
automatisch farblich passend zum aktiven Design.

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
> über Netlify läuft, funktioniert das Speichern automatisch. Die
> Session-Cookies benötigen HTTPS (`Secure`-Flag) – das ist bei jeder
> Netlify-Domain automatisch gegeben.

### Lokal testen (optional)

```bash
npm install
npx netlify-cli dev
```

Das startet die Seite inkl. Functions und Blobs-Speicher lokal (Netlify CLI
und ein verknüpftes Netlify-Projekt vorausgesetzt).

## Funktionen

- 🔐 Echte Konten: Registrierung und Anmeldung mit sicher gehashtem Passwort,
  Sitzung per `HttpOnly`-Cookie – die App ist ohne Konto nicht nutzbar
- ⚙️ Einstellungen-Fenster mit Konto-Übersicht, Design- und Sprachauswahl
- 📤 Videos hochladen (Titel, Beschreibung, automatisches Thumbnail aus dem
  Video, bis 50 MB dank Chunk-Upload mit Fortschrittsanzeige)
- 🏠 Feed aller Videos mit Suche und Filtern (Alle/Neu/Beliebt/Meistgesehen/
  Meine Videos)
- ▶️ Videoplayer-Ansicht mit Likes (ein Like pro Konto, serverseitig
  durchgesetzt), Aufrufen und Kommentaren
- 🌐 Umschaltbare Sprache: Deutsch, Englisch, Französisch, Spanisch
- 🎨 Umschaltbares Design: Neon, Berg, Ozean, Sonnenuntergang, Hell
- 🅢 Eigenes Logo im TikTok-artigen Duotone-"S"-Stil
- 💾 Alles wird dauerhaft im Backend gespeichert (Netlify Blobs) – Videos
  und Konten bleiben über Neuladen und Sitzungen hinweg erhalten
- 📱 Responsives Design im Social-Media-Stil mit mobiler Bottom-Navigation
