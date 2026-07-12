(() => {
  "use strict";

  const TRANSLATIONS = {
    de: {
      "app.title": "Socialy – Teile deine Videos",
      "nav.searchPlaceholder": "Videos durchsuchen...",
      "nav.upload": "Hochladen",
      "nav.guest": "Gast",
      "nav.changeNamePrompt": "Wie sollen wir dich nennen?",
      "nav.theme": "Design ändern",
      "nav.language": "Sprache ändern",
      "feed.heading": "Für dich",
      "feed.count.one": "{n} Video",
      "feed.count.other": "{n} Videos",
      "empty.title": "Noch keine Videos",
      "empty.desc": "Sei die/der Erste und lade ein Video hoch!",
      "watch.close": "Schließen",
      "watch.commentsCount": "Kommentare ({n})",
      "watch.commentPlaceholder": "Kommentar schreiben...",
      "watch.send": "Senden",
      "watch.noComments": "Noch keine Kommentare. Sei die/der Erste!",
      "watch.alreadyLiked": "Du hast dieses Video bereits geliked.",
      "watch.likeError": "Like konnte nicht gespeichert werden.",
      "watch.commentError": "Kommentar konnte nicht gesendet werden.",
      "time.now": "gerade eben",
      "time.minutes": "vor {n} Min.",
      "time.hours": "vor {n} Std.",
      "time.days.one": "vor {n} Tag",
      "time.days.other": "vor {n} Tagen",
      "time.months.one": "vor {n} Monat",
      "time.months.other": "vor {n} Monaten",
      "time.years.one": "vor {n} Jahr",
      "time.years.other": "vor {n} Jahren",
      "upload.title": "Video hochladen",
      "upload.dropzoneLabel": "Video auswählen oder hierher ziehen",
      "upload.dropzoneHint": "MP4, WebM oder MOV – max. {max} MB",
      "upload.titleLabel": "Titel *",
      "upload.titlePlaceholder": "Wie heißt dein Video?",
      "upload.descLabel": "Beschreibung",
      "upload.descPlaceholder": "Erzähl etwas über dein Video...",
      "upload.usernameLabel": "Dein Name *",
      "upload.usernamePlaceholder": "Benutzername",
      "upload.cancel": "Abbrechen",
      "upload.submit": "Veröffentlichen",
      "upload.uploading": "Wird hochgeladen... {percent}%",
      "upload.finalizing": "Wird fertiggestellt...",
      "upload.errNeedFile": "Bitte zuerst ein Video auswählen.",
      "upload.errNeedTitle": "Bitte einen Titel eingeben.",
      "upload.errNeedUsername": "Bitte einen Namen eingeben.",
      "upload.errNotVideo": "Bitte eine Videodatei auswählen.",
      "upload.errTooBig": "Die Datei ist zu groß ({size} MB). Maximal {max} MB erlaubt.",
      "upload.errFailed": "Upload fehlgeschlagen. Bitte erneut versuchen.",
      "upload.success": "Video wurde veröffentlicht! 🎉",
      "upload.loadError": "Videos konnten nicht geladen werden.",
      "onboard.text": "Wie sollen wir dich nennen?",
      "onboard.placeholder": "Dein Name",
      "onboard.save": "OK",
      "theme.neon": "Neon",
      "theme.berg": "Berg",
      "theme.ocean": "Ozean",
      "theme.sunset": "Sonnenuntergang",
      "theme.light": "Hell",
    },
    en: {
      "app.title": "Socialy – Share your videos",
      "nav.searchPlaceholder": "Search videos...",
      "nav.upload": "Upload",
      "nav.guest": "Guest",
      "nav.changeNamePrompt": "What should we call you?",
      "nav.theme": "Change design",
      "nav.language": "Change language",
      "feed.heading": "For you",
      "feed.count.one": "{n} video",
      "feed.count.other": "{n} videos",
      "empty.title": "No videos yet",
      "empty.desc": "Be the first to upload a video!",
      "watch.close": "Close",
      "watch.commentsCount": "Comments ({n})",
      "watch.commentPlaceholder": "Write a comment...",
      "watch.send": "Send",
      "watch.noComments": "No comments yet. Be the first!",
      "watch.alreadyLiked": "You already liked this video.",
      "watch.likeError": "Could not save like.",
      "watch.commentError": "Could not send comment.",
      "time.now": "just now",
      "time.minutes": "{n} min ago",
      "time.hours": "{n}h ago",
      "time.days.one": "{n} day ago",
      "time.days.other": "{n} days ago",
      "time.months.one": "{n} month ago",
      "time.months.other": "{n} months ago",
      "time.years.one": "{n} year ago",
      "time.years.other": "{n} years ago",
      "upload.title": "Upload video",
      "upload.dropzoneLabel": "Choose a video or drop it here",
      "upload.dropzoneHint": "MP4, WebM or MOV – max. {max} MB",
      "upload.titleLabel": "Title *",
      "upload.titlePlaceholder": "What's your video called?",
      "upload.descLabel": "Description",
      "upload.descPlaceholder": "Tell us about your video...",
      "upload.usernameLabel": "Your name *",
      "upload.usernamePlaceholder": "Username",
      "upload.cancel": "Cancel",
      "upload.submit": "Publish",
      "upload.uploading": "Uploading... {percent}%",
      "upload.finalizing": "Finalizing...",
      "upload.errNeedFile": "Please choose a video first.",
      "upload.errNeedTitle": "Please enter a title.",
      "upload.errNeedUsername": "Please enter a name.",
      "upload.errNotVideo": "Please choose a video file.",
      "upload.errTooBig": "The file is too large ({size} MB). Maximum {max} MB allowed.",
      "upload.errFailed": "Upload failed. Please try again.",
      "upload.success": "Video published! 🎉",
      "upload.loadError": "Videos could not be loaded.",
      "onboard.text": "What should we call you?",
      "onboard.placeholder": "Your name",
      "onboard.save": "OK",
      "theme.neon": "Neon",
      "theme.berg": "Mountain",
      "theme.ocean": "Ocean",
      "theme.sunset": "Sunset",
      "theme.light": "Light",
    },
    fr: {
      "app.title": "Socialy – Partage tes vidéos",
      "nav.searchPlaceholder": "Rechercher des vidéos...",
      "nav.upload": "Publier",
      "nav.guest": "Invité",
      "nav.changeNamePrompt": "Comment devons-nous t'appeler ?",
      "nav.theme": "Changer de design",
      "nav.language": "Changer de langue",
      "feed.heading": "Pour toi",
      "feed.count.one": "{n} vidéo",
      "feed.count.other": "{n} vidéos",
      "empty.title": "Pas encore de vidéos",
      "empty.desc": "Sois le premier à publier une vidéo !",
      "watch.close": "Fermer",
      "watch.commentsCount": "Commentaires ({n})",
      "watch.commentPlaceholder": "Écrire un commentaire...",
      "watch.send": "Envoyer",
      "watch.noComments": "Pas encore de commentaires. Sois le premier !",
      "watch.alreadyLiked": "Tu as déjà aimé cette vidéo.",
      "watch.likeError": "Impossible d'enregistrer le like.",
      "watch.commentError": "Impossible d'envoyer le commentaire.",
      "time.now": "à l'instant",
      "time.minutes": "il y a {n} min",
      "time.hours": "il y a {n} h",
      "time.days.one": "il y a {n} jour",
      "time.days.other": "il y a {n} jours",
      "time.months.one": "il y a {n} mois",
      "time.months.other": "il y a {n} mois",
      "time.years.one": "il y a {n} an",
      "time.years.other": "il y a {n} ans",
      "upload.title": "Publier une vidéo",
      "upload.dropzoneLabel": "Choisir une vidéo ou la glisser ici",
      "upload.dropzoneHint": "MP4, WebM ou MOV – max. {max} Mo",
      "upload.titleLabel": "Titre *",
      "upload.titlePlaceholder": "Quel est le titre de ta vidéo ?",
      "upload.descLabel": "Description",
      "upload.descPlaceholder": "Raconte-nous en plus sur ta vidéo...",
      "upload.usernameLabel": "Ton nom *",
      "upload.usernamePlaceholder": "Nom d'utilisateur",
      "upload.cancel": "Annuler",
      "upload.submit": "Publier",
      "upload.uploading": "Envoi en cours... {percent}%",
      "upload.finalizing": "Finalisation...",
      "upload.errNeedFile": "Merci de choisir une vidéo d'abord.",
      "upload.errNeedTitle": "Merci d'indiquer un titre.",
      "upload.errNeedUsername": "Merci d'indiquer un nom.",
      "upload.errNotVideo": "Merci de choisir un fichier vidéo.",
      "upload.errTooBig": "Le fichier est trop volumineux ({size} Mo). Maximum {max} Mo autorisé.",
      "upload.errFailed": "Échec de l'envoi. Merci de réessayer.",
      "upload.success": "Vidéo publiée ! 🎉",
      "upload.loadError": "Impossible de charger les vidéos.",
      "onboard.text": "Comment devons-nous t'appeler ?",
      "onboard.placeholder": "Ton nom",
      "onboard.save": "OK",
      "theme.neon": "Néon",
      "theme.berg": "Montagne",
      "theme.ocean": "Océan",
      "theme.sunset": "Coucher de soleil",
      "theme.light": "Clair",
    },
    es: {
      "app.title": "Socialy – Comparte tus vídeos",
      "nav.searchPlaceholder": "Buscar vídeos...",
      "nav.upload": "Subir",
      "nav.guest": "Invitado",
      "nav.changeNamePrompt": "¿Cómo debemos llamarte?",
      "nav.theme": "Cambiar diseño",
      "nav.language": "Cambiar idioma",
      "feed.heading": "Para ti",
      "feed.count.one": "{n} vídeo",
      "feed.count.other": "{n} vídeos",
      "empty.title": "Todavía no hay vídeos",
      "empty.desc": "¡Sé el primero en subir un vídeo!",
      "watch.close": "Cerrar",
      "watch.commentsCount": "Comentarios ({n})",
      "watch.commentPlaceholder": "Escribe un comentario...",
      "watch.send": "Enviar",
      "watch.noComments": "Todavía no hay comentarios. ¡Sé el primero!",
      "watch.alreadyLiked": "Ya te ha gustado este vídeo.",
      "watch.likeError": "No se pudo guardar el like.",
      "watch.commentError": "No se pudo enviar el comentario.",
      "time.now": "justo ahora",
      "time.minutes": "hace {n} min",
      "time.hours": "hace {n} h",
      "time.days.one": "hace {n} día",
      "time.days.other": "hace {n} días",
      "time.months.one": "hace {n} mes",
      "time.months.other": "hace {n} meses",
      "time.years.one": "hace {n} año",
      "time.years.other": "hace {n} años",
      "upload.title": "Subir vídeo",
      "upload.dropzoneLabel": "Elige un vídeo o arrástralo aquí",
      "upload.dropzoneHint": "MP4, WebM o MOV – máx. {max} MB",
      "upload.titleLabel": "Título *",
      "upload.titlePlaceholder": "¿Cómo se llama tu vídeo?",
      "upload.descLabel": "Descripción",
      "upload.descPlaceholder": "Cuéntanos sobre tu vídeo...",
      "upload.usernameLabel": "Tu nombre *",
      "upload.usernamePlaceholder": "Nombre de usuario",
      "upload.cancel": "Cancelar",
      "upload.submit": "Publicar",
      "upload.uploading": "Subiendo... {percent}%",
      "upload.finalizing": "Finalizando...",
      "upload.errNeedFile": "Por favor, elige primero un vídeo.",
      "upload.errNeedTitle": "Por favor, introduce un título.",
      "upload.errNeedUsername": "Por favor, introduce un nombre.",
      "upload.errNotVideo": "Por favor, elige un archivo de vídeo.",
      "upload.errTooBig": "El archivo es demasiado grande ({size} MB). Máximo {max} MB permitido.",
      "upload.errFailed": "Error al subir. Por favor, inténtalo de nuevo.",
      "upload.success": "¡Vídeo publicado! 🎉",
      "upload.loadError": "No se pudieron cargar los vídeos.",
      "onboard.text": "¿Cómo debemos llamarte?",
      "onboard.placeholder": "Tu nombre",
      "onboard.save": "OK",
      "theme.neon": "Neón",
      "theme.berg": "Montaña",
      "theme.ocean": "Océano",
      "theme.sunset": "Atardecer",
      "theme.light": "Claro",
    },
  };

  const LANGUAGES = [
    { code: "de", label: "Deutsch", flag: "🇩🇪" },
    { code: "en", label: "English", flag: "🇬🇧" },
    { code: "fr", label: "Français", flag: "🇫🇷" },
    { code: "es", label: "Español", flag: "🇪🇸" },
  ];

  function getLanguage() {
    const saved = localStorage.getItem("socialy_lang");
    if (saved && TRANSLATIONS[saved]) return saved;
    const browserLang = (navigator.language || "de").slice(0, 2);
    return TRANSLATIONS[browserLang] ? browserLang : "de";
  }

  function setLanguage(lang) {
    if (!TRANSLATIONS[lang]) return;
    localStorage.setItem("socialy_lang", lang);
    document.documentElement.lang = lang;
  }

  function interpolate(str, vars) {
    if (!vars) return str;
    return str.replace(/\{(\w+)\}/g, (_, key) => (key in vars ? String(vars[key]) : `{${key}}`));
  }

  function t(key, vars) {
    const lang = getLanguage();
    const dict = TRANSLATIONS[lang] || TRANSLATIONS.de;
    const str = dict[key] ?? TRANSLATIONS.de[key] ?? key;
    return interpolate(str, vars);
  }

  function tp(baseKey, n, vars = {}) {
    const suffix = n === 1 ? "one" : "other";
    return t(`${baseKey}.${suffix}`, { n, ...vars });
  }

  function applyI18n(root) {
    const scope = root || document;
    scope.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(el.dataset.i18n);
    });
    scope.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      el.setAttribute("placeholder", t(el.dataset.i18nPlaceholder));
    });
    scope.querySelectorAll("[data-i18n-title]").forEach((el) => {
      el.setAttribute("title", t(el.dataset.i18nTitle));
    });
    document.documentElement.lang = getLanguage();
  }

  window.SocialyI18n = { TRANSLATIONS, LANGUAGES, getLanguage, setLanguage, t, tp, applyI18n };
})();
