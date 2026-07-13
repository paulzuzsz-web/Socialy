(() => {
  "use strict";

  const THEMES = [
    { code: "graphite", labelKey: "theme.graphite", swatch: ["#0a84ff", "#5e5ce6"] },
    { code: "sand", labelKey: "theme.sand", swatch: ["#ff9f0a", "#d97a3d"] },
    { code: "lagoon", labelKey: "theme.lagoon", swatch: ["#64d2ff", "#00c7be"] },
    { code: "bloom", labelKey: "theme.bloom", swatch: ["#ff375f", "#bf5af2"] },
    { code: "daylight", labelKey: "theme.daylight", swatch: ["#007aff", "#5856d6"] },
  ];

  function getTheme() {
    const saved = localStorage.getItem("socialy_theme");
    return THEMES.some((th) => th.code === saved) ? saved : "graphite";
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
  }

  function setTheme(theme) {
    if (!THEMES.some((th) => th.code === theme)) return;
    localStorage.setItem("socialy_theme", theme);
    applyTheme(theme);
  }

  window.SocialyThemes = { THEMES, getTheme, setTheme, applyTheme };
})();
