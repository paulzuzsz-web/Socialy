# Socialy 🎬

Socialy ist eine kleine Video-Sharing-Plattform (im Stil von TikTok/YouTube):
Nutzer erstellen ein Konto, melden sich an und können Videos mit Titel,
Beschreibung und eigenem Thumbnail hochladen. Alle angemeldeten Besucher
können die Videos ansehen, liken und kommentieren, täglich Coins abholen,
sich Premium freischalten und Videos für immer offline speichern.

Die Seite ist eine **statische Webseite (HTML/CSS/JS)** mit einem echten
**Backend aus Netlify Functions**. Gespeichert wird alles dauerhaft in
**Netlify Blobs** (Konten, Coins, Video-Dateien, Thumbnails, Titel/
Beschreibung, Likes, Views und Kommentare) – es ist keine externe Datenbank
nötig.

## Projektstruktur

```
index.html                          Hauptseite (Login/Registrierung, Feed, Player, Upload, Einstellungen, Studio)
sw.js                                Service Worker – cached die App-Oberfläche für echtes Offline-Laden
css/style.css                        Glass-Design inkl. aller Themes
js/app.js                            Gesamte Frontend-Logik
js/auth.js                           Frontend-Anmeldestatus (Login/Registrierung/Logout/Coins/Premium)
js/offline.js                        IndexedDB-Speicher für offline gespeicherte Videos
js/i18n.js                           Übersetzungen (DE/EN/FR/ES)
js/themes.js                         Design-Definitionen
netlify/functions/auth-register.js   POST /api/auth/register    → Konto erstellen
netlify/functions/auth-login.js      POST /api/auth/login       → Anmelden
netlify/functions/auth-logout.js     POST /api/auth/logout      → Abmelden
netlify/functions/auth-me.js         GET  /api/auth/me          → aktuelle Sitzung prüfen
netlify/functions/auth-utils.js      Gemeinsame Hilfsfunktionen (Passwort-Hashing, Sessions, Cookies, Coin-Konstanten)
netlify/functions/coins-claim.js     POST /api/coins/claim      → tägliche Coins abholen
netlify/functions/premium-unlock.js  POST /api/premium/unlock   → Premium mit Coins freischalten
netlify/functions/upload-chunk.js    POST /api/upload-chunk     → einzelnes Video-Chunk speichern
netlify/functions/upload-finalize.js POST /api/upload-finalize  → Chunks zusammenfügen + Metadaten speichern
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

Socialy verlangt ein echtes Konto: Beim ersten Besuch landet man auf einer
Anmelde-/Registrierungsseite und muss sich registrieren oder anmelden, bevor
die App nutzbar wird.

- **Registrierung**: Benutzername (3–24 Zeichen: Buchstaben, Zahlen, `_`) und
  Passwort (mind. 6 Zeichen). Passwörter werden serverseitig mit Node's
  `crypto.scrypt` gehasht und gesalzen gespeichert – niemals im Klartext.
- **Anmeldung**: Erstellt eine Sitzung, die als sicheres, `HttpOnly`-Cookie
  (`socialy_session`) im Browser gespeichert wird.
- **Uploads, Likes und Kommentare** werden serverseitig immer dem
  angemeldeten Konto zugeordnet – niemand kann sich als jemand anderes
  ausgeben. Ein Like pro Konto und Video wird serverseitig durchgesetzt.

## Glass-Design

Die komplette Oberfläche nutzt echtes Glassmorphism: Header, Modals,
Dropdowns und die mobile Navigation sind halbtransparente, weichgezeichnete
Flächen (`backdrop-filter: blur() saturate()`), die den farbigen
Hintergrund-Glow durchscheinen lassen, mit einem feinen hellen Rand
("Lichtkante") und weichem Schatten für echte Tiefe – für jedes der fünf
Themes eigens abgestimmt (inklusive eines eigenen, aufgehellten Scrims fürs
helle Design, damit es nicht grau wirkt).

## Coins & Premium

- Jedes neue Konto startet mit **100 Coins**.
- Einmal am Tag können **50 Coins** kostenlos abgeholt werden (Cooldown:
  20 Stunden, mit Live-Countdown in den Einstellungen).
- Ab **1000 Coins** lässt sich **Premium** einmalig freischalten.
- Premium schaltet frei: Videos **für immer offline speichern** (siehe
  unten) und ein Premium-Abzeichen neben dem Namen.

Alle Beträge sind zentrale Konstanten in `netlify/functions/auth-utils.js`
(serverseitig verbindlich) und gespiegelt in `js/app.js` (nur für die
Anzeige/Countdown) – bei Änderung bitte beide Stellen anpassen.

## Videos für immer offline ansehen

Premium-Mitglieder können auf der Video-Ansicht auf **"Offline speichern"**
klicken. Die Videodatei (und das Thumbnail) werden dabei komplett in den
Browser geladen und lokal in **IndexedDB** gespeichert – dauerhaft, ganz
ohne erneuten Netzwerkzugriff. Über den Filter **"Offline"** lässt sich die
eigene Offline-Bibliothek jederzeit ansehen, auch ganz ohne Internet.

Ein **Service Worker** (`sw.js`) cached zusätzlich die App-Oberfläche
selbst (HTML/CSS/JS), sodass Socialy auch dann noch startet, wenn gar keine
Internetverbindung besteht: Beim Start wird zunächst versucht, die Sitzung
online zu bestätigen; schlägt das mangels Netzwerk fehl, wird automatisch
die zuletzt bekannte, lokal zwischengespeicherte Sitzung verwendet und
direkt die Offline-Bibliothek geöffnet.

## Studio-Statistiken

Sobald ein Konto mindestens ein Video hochgeladen hat, lässt sich über
**Einstellungen → Konto → "Studio-Statistiken ansehen"** ein Dashboard im
Stil von YouTube Studio öffnen: Gesamtzahlen (Videos, Aufrufe, Likes,
Kommentare) sowie eine Liste aller eigenen Videos mit Einzelwerten und
einem Balken, der die Aufrufe im Verhältnis zum erfolgreichsten Video
zeigt.

## Eigene Video-Thumbnails

Beim Hochladen wird automatisch ein Vorschaubild aus dem Video erzeugt.
Zusätzlich lässt sich mit einem Schieberegler ein anderes Bild aus dem
Video auswählen, oder komplett ein **eigenes Bild hochladen** (z. B. ein
selbst gestaltetes Cover) – genau wie bei großen Video-Plattformen.

## Einstellungen

Über das Zahnrad-Icon (oder den Konto-Chip) oben rechts öffnet sich ein
Einstellungen-Fenster mit vier Bereichen:

- **Konto** – Avatar, Benutzername, Mitglied-seit-Datum, Zugang zu den
  Studio-Statistiken und der Abmelden-Button.
- **Coins** – Kontostand, tägliche Abholung mit Countdown, Premium-Karte.
- **Design** – Auswahl-Raster mit Live-Vorschau aller fünf Themes.
- **Sprache** – Auswahl der Oberflächensprache.

## Sprachen

Zwischen **Deutsch, Englisch, Französisch und Spanisch** wechseln
(Spracheinstellungen), gespeichert in `localStorage`, mit automatischer
Erkennung der Browsersprache beim ersten Besuch.

## Designs

Ein zurückhaltenderes, an native System-Designs (Apple) angelehntes
Farbkonzept: neutrale Grundtöne mit jeweils genau einem prägnanten Akzentpaar
statt eines durchgängig satten Neon-Hintergrunds.

- **Graphite** – neutrales Anthrazit mit Blau/Indigo-Akzent (Standard)
- **Sand** – warmes Anthrazit mit Amber/Terrakotta-Akzent
- **Lagoon** – tiefes Petrol mit Cyan/Türkis-Akzent
- **Bloom** – gedecktes Aubergine mit Pink/Violett-Akzent
- **Daylight** – helles, luftiges Design mit klassischem Systemblau

Jedes Design ist über CSS-Variablen definiert (`css/style.css`, Abschnitt
"Themes") – weitere eigene Designs lassen sich ergänzen, indem man dort
einen neuen `[data-theme="..."]`-Block hinzufügt und ihn in `js/themes.js`
in der `THEMES`-Liste einträgt.

## Logo

Die Wortmarke ist ein eigenständiges Icon: ein durchgezogener, gradientfarbener
"S"-Schriftzug (SVG, `#ic-brand` im Icon-Sprite) in einem App-Icon-artigen
abgerundeten Quadrat – automatisch farblich passend zum aktiven Design, da
der Verlauf `--accent1`/`--accent2` referenziert.

## Profilbild

Im Konto-Tab der Einstellungen kann jede:r Nutzer:in ein eigenes Profilbild
hochladen (wird clientseitig auf 256×256 zugeschnitten). Es erscheint überall,
wo bisher nur die Initialen zu sehen waren: Header, Kommentare, Video-Karten,
Wiedergabe-Ansicht und Studio – mit automatischem Rückfall auf die Initialen,
falls kein Bild gesetzt ist.

## Einstellungen & Studio als echte Seiten

Einstellungen und Studio sind über eigene URL-Fragmente erreichbar
(`#/settings/<tab>`, `#/studio`) statt reiner Overlay-Dialoge: ein Reload
bleibt auf derselben Ansicht, der Zurück-Button des Browsers verlässt die
Seite, und beide sind als eigenständige, vollflächige Seiten mit
Zurück-Pfeil im Kopfbereich gestaltet statt als zentrierte Dialoge.

## Datenschutz, Impressum & Nutzungsbedingungen

Im Footer der Seite gibt es Links zu Datenschutz, Impressum und
Nutzungsbedingungen, die als Info-Fenster geöffnet werden (Texte in
`js/i18n.js`, Schlüssel `legal.*`). Das Impressum ist bewusst ein
**Platzhalter** ([Name], [Adresse] usw.) – bitte vor einem öffentlichen
Betrieb mit echten Kontaktdaten ausfüllen.

## Größere Video-Uploads (Chunk-Upload)

Serverless Functions haben ein Limit für die Größe einer einzelnen Anfrage
(ca. 6 MB). Die Datei wird im Browser automatisch in **3-MB-Häppchen**
zerlegt und hochgeladen (`/api/upload-chunk`); `/api/upload-finalize` fügt
alle Chunks serverseitig wieder zusammen. Aktuelles Limit: **50 MB pro
Video** (einstellbar über `MAX_TOTAL_BYTES` in
`netlify/functions/upload-finalize.js` sowie `MAX_TOTAL_MB` in `js/app.js`).

## Deployment auf Netlify

### Variante A – Über GitHub (empfohlen)

1. Projekt in ein eigenes GitHub-Repository hochladen.
2. Auf [app.netlify.com](https://app.netlify.com) → **"Add new site"** →
   **"Import an existing project"**.
3. GitHub-Repository auswählen.
4. Build-Einstellungen: Build command leer lassen, Publish directory `.`
   (die `netlify.toml` ist schon korrekt eingerichtet).
5. **"Deploy site"** klicken – Netlify installiert automatisch
   `@netlify/blobs` und aktiviert Functions und Service Worker.

### Variante B – Drag & Drop (schneller Test)

1. Auf [app.netlify.com/drop](https://app.netlify.com/drop) gehen.
2. Den **gesamten Projektordner** in das Upload-Feld ziehen.

> Netlify Blobs benötigt keine zusätzliche Konfiguration. Das
> Session-Cookie setzt das `Secure`-Flag automatisch nur dann, wenn die
> Anfrage tatsächlich über HTTPS kam (bei jeder Netlify-Domain der Fall) –
> so bleibt man auch bei lokalen HTTP-Testservern nach einem Reload
> angemeldet, statt dass der Browser das Cookie stillschweigend verwirft.

### Lokal testen (optional)

```bash
npm install
npx netlify-cli dev
```

## Funktionen

- 🔐 Echte Konten mit gehashtem Passwort und `HttpOnly`-Sitzungs-Cookie (bleibt nach Reload angemeldet)
- 🥃 Durchgängiges Glass-Design mit Blur, Lichtkanten und Tiefe
- 🖼️ Eigenes Profilbild, überall sichtbar (Header, Kommentare, Karten, Studio)
- 🪙 Tägliche Coins, Premium-Freischaltung, Fortschritts-Countdown
- 📴 Videos für immer offline speichern (IndexedDB + Service Worker)
- 📊 Studio-Statistik-Dashboard als eigene Seite, sobald ein Video hochgeladen wurde
- 🎬 Eigene Video-Thumbnails wählen oder hochladen
- ⚙️ Einstellungen als eigene, URL-adressierbare Seite mit Konto, Coins, Design und Sprache
- 📤 Videos hochladen bis 50 MB dank Chunk-Upload mit Fortschrittsanzeige
- 🏠 Feed mit Suche und Filtern (Alle/Neu/Beliebt/Meistgesehen/Meine/Offline)
- ▶️ Videoplayer mit Likes, Aufrufen und Kommentaren
- 🌐 Vier Sprachen: Deutsch, Englisch, Französisch, Spanisch
- 🎨 Fünf zurückhaltende, an native System-Designs angelehnte Farbwelten: Graphite, Sand, Lagoon, Bloom, Daylight
- 🅢 Eigenes Gradient-Logo als App-Icon-Kachel
- 📄 Footer mit Datenschutz, Impressum und Nutzungsbedingungen
- 💾 Alles dauerhaft im Backend gespeichert (Netlify Blobs)
- 📱 Responsives Design mit mobiler Bottom-Navigation
