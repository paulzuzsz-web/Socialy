(() => {
  "use strict";

  const THEMES = [
    { code: "neon", labelKey: "theme.neon", swatch: ["#ff2d78", "#7c3aed"] },
    { code: "berg", labelKey: "theme.berg", swatch: ["#d97742", "#3f7d5c"] },
    { code: "ocean", labelKey: "theme.ocean", swatch: ["#22d3ee", "#2563eb"] },
    { code: "sunset", labelKey: "theme.sunset", swatch: ["#fb923c", "#e11d48"] },
    { code: "light", labelKey: "theme.light", swatch: ["#ff2d78", "#7c3aed"] },
  ];

  function getTheme() {
    const saved = localStorage.getItem("socialy_theme");
    return THEMES.some((th) => th.code === saved) ? saved : "neon";
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
