(() => {
  "use strict";

  const { t, tp, applyI18n, getLanguage, setLanguage, LANGUAGES } = window.SocialyI18n;
  const { THEMES, getTheme, setTheme, applyTheme } = window.SocialyThemes;
  const Auth = window.SocialyAuth;
  const Offline = window.SocialyOffline;

  const API = {
    videos: "/api/videos",
    uploadChunk: "/api/upload-chunk",
    uploadFinalize: "/api/upload-finalize",
    video: (id) => `/api/video/${id}`,
    thumbnail: (id) => `/api/thumbnail/${id}`,
    like: (id) => `/api/like/${id}`,
    view: (id) => `/api/view/${id}`,
    comment: (id) => `/api/comment/${id}`,
    avatarUpload: "/api/avatar-upload",
    avatar: (username) => `/api/avatar/${encodeURIComponent((username || "").toLowerCase())}`,
  };

  const MAX_TOTAL_MB = 50;
  const MAX_TOTAL_BYTES = MAX_TOTAL_MB * 1024 * 1024;
  const CHUNK_SIZE = 3 * 1024 * 1024; // 3 MB pro Chunk (Rohdaten)
  const CHUNK_CONCURRENCY = 3;
  const NEW_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // "Neu"-Filter: letzte 7 Tage

  // Muss mit netlify/functions/auth-utils.js übereinstimmen.
  const DAILY_CLAIM_COINS = 50;
  const DAILY_CLAIM_COOLDOWN_MS = 20 * 60 * 60 * 1000;
  const PREMIUM_COST_COINS = 1000;

  const els = {
    authGate: document.getElementById("authGate"),
    authTabs: document.getElementById("authTabs"),
    loginForm: document.getElementById("loginForm"),
    loginUsername: document.getElementById("loginUsername"),
    loginPassword: document.getElementById("loginPassword"),
    loginError: document.getElementById("loginError"),
    loginSubmitBtn: document.getElementById("loginSubmitBtn"),
    registerForm: document.getElementById("registerForm"),
    registerUsername: document.getElementById("registerUsername"),
    registerPassword: document.getElementById("registerPassword"),
    registerPasswordConfirm: document.getElementById("registerPasswordConfirm"),
    registerError: document.getElementById("registerError"),
    registerSubmitBtn: document.getElementById("registerSubmitBtn"),

    appRoot: document.getElementById("appRoot"),

    videoGrid: document.getElementById("videoGrid"),
    emptyState: document.getElementById("emptyState"),
    emptyStateTitle: document.getElementById("emptyStateTitle"),
    emptyStateDesc: document.getElementById("emptyStateDesc"),
    videoCountLabel: document.getElementById("videoCountLabel"),
    searchInput: document.getElementById("searchInput"),
    searchBtn: document.getElementById("searchBtn"),
    filterRow: document.getElementById("filterRow"),

    coinChipBtn: document.getElementById("coinChipBtn"),
    coinBalanceLabel: document.getElementById("coinBalanceLabel"),

    userChipBtn: document.getElementById("userChipBtn"),
    userAvatar: document.getElementById("userAvatar"),
    userAvatarImg: document.getElementById("userAvatarImg"),
    userAvatarFallback: document.getElementById("userAvatarFallback"),
    userNameLabel: document.getElementById("userNameLabel"),
    userChipPremiumBadge: document.getElementById("userChipPremiumBadge"),
    settingsBtn: document.getElementById("settingsBtn"),

    settingsModalOverlay: document.getElementById("settingsModalOverlay"),
    closeSettingsBtn: document.getElementById("closeSettingsBtn"),
    settingsTabs: document.getElementById("settingsTabs"),
    settingsAvatarBtn: document.getElementById("settingsAvatarBtn"),
    settingsAvatarImg: document.getElementById("settingsAvatarImg"),
    settingsAvatarFallback: document.getElementById("settingsAvatarFallback"),
    avatarFileInput: document.getElementById("avatarFileInput"),
    settingsUsername: document.getElementById("settingsUsername"),
    settingsMemberSince: document.getElementById("settingsMemberSince"),
    settingsLogoutBtn: document.getElementById("settingsLogoutBtn"),
    settingsDesignPanel: document.getElementById("settingsDesignPanel"),
    settingsLanguagePanel: document.getElementById("settingsLanguagePanel"),
    openStudioBtn: document.getElementById("openStudioBtn"),

    coinsBalanceNumber: document.getElementById("coinsBalanceNumber"),
    coinsDailyDesc: document.getElementById("coinsDailyDesc"),
    claimCoinsBtn: document.getElementById("claimCoinsBtn"),
    premiumCard: document.getElementById("premiumCard"),
    unlockPremiumBtn: document.getElementById("unlockPremiumBtn"),

    studioOverlay: document.getElementById("studioOverlay"),
    closeStudioBtn: document.getElementById("closeStudioBtn"),
    studioStatsGrid: document.getElementById("studioStatsGrid"),
    studioEmpty: document.getElementById("studioEmpty"),
    studioVideoListWrap: document.getElementById("studioVideoListWrap"),
    studioVideoList: document.getElementById("studioVideoList"),

    legalModalOverlay: document.getElementById("legalModalOverlay"),
    legalModalTitle: document.getElementById("legalModalTitle"),
    legalModalBody: document.getElementById("legalModalBody"),
    closeLegalBtn: document.getElementById("closeLegalBtn"),
    footerCopyright: document.getElementById("footerCopyright"),

    openUploadBtn: document.getElementById("openUploadBtn"),
    uploadModalOverlay: document.getElementById("uploadModalOverlay"),
    closeUploadBtn: document.getElementById("closeUploadBtn"),
    cancelUploadBtn: document.getElementById("cancelUploadBtn"),
    uploadForm: document.getElementById("uploadForm"),
    dropzone: document.getElementById("dropzone"),
    dropzoneLabel: document.getElementById("dropzoneLabel"),
    dropzoneHint: document.getElementById("dropzoneHint"),
    fileInput: document.getElementById("fileInput"),
    videoPreviewWrap: document.getElementById("videoPreviewWrap"),
    videoPreview: document.getElementById("videoPreview"),
    thumbCanvas: document.getElementById("thumbCanvas"),
    thumbnailPicker: document.getElementById("thumbnailPicker"),
    thumbnailPreviewImg: document.getElementById("thumbnailPreviewImg"),
    thumbScrubRange: document.getElementById("thumbScrubRange"),
    thumbnailUploadBtn: document.getElementById("thumbnailUploadBtn"),
    thumbnailFileInput: document.getElementById("thumbnailFileInput"),
    titleInput: document.getElementById("titleInput"),
    descriptionInput: document.getElementById("descriptionInput"),
    uploadError: document.getElementById("uploadError"),
    submitUploadBtn: document.getElementById("submitUploadBtn"),
    uploadProgress: document.getElementById("uploadProgress"),
    uploadProgressFill: document.getElementById("uploadProgressFill"),
    uploadProgressLabel: document.getElementById("uploadProgressLabel"),

    watchOverlay: document.getElementById("watchOverlay"),
    closeWatchBtn: document.getElementById("closeWatchBtn"),
    watchVideo: document.getElementById("watchVideo"),
    watchTitle: document.getElementById("watchTitle"),
    watchAvatar: document.getElementById("watchAvatar"),
    watchAvatarImg: document.getElementById("watchAvatarImg"),
    watchAvatarFallback: document.getElementById("watchAvatarFallback"),
    watchUsername: document.getElementById("watchUsername"),
    watchMeta: document.getElementById("watchMeta"),
    watchDescription: document.getElementById("watchDescription"),
    likeBtn: document.getElementById("likeBtn"),
    likeCount: document.getElementById("likeCount"),
    viewCount: document.getElementById("viewCount"),
    offlineSaveBtn: document.getElementById("offlineSaveBtn"),
    offlineSaveLabel: document.getElementById("offlineSaveLabel"),
    commentForm: document.getElementById("commentForm"),
    commentInput: document.getElementById("commentInput"),
    commentList: document.getElementById("commentList"),
    commentCountLabel: document.getElementById("commentCountLabel"),

    toastStack: document.getElementById("toastStack"),

    bottomNav: document.getElementById("bottomNav"),
    bottomHomeBtn: document.getElementById("bottomHomeBtn"),
    bottomSearchBtn: document.getElementById("bottomSearchBtn"),
    bottomUploadBtn: document.getElementById("bottomUploadBtn"),
    bottomThemeBtn: document.getElementById("bottomThemeBtn"),
    bottomProfileBtn: document.getElementById("bottomProfileBtn"),
  };

  let allVideos = [];
  let currentVideoId = null;
  let selectedFile = null;
  let selectedThumbnailDataUrl = null;
  let currentFilter = "all";

  // ---------- Helpers ----------

  function toast(message, type = "info") {
    const el = document.createElement("div");
    el.className = "toast" + (type === "error" ? " error" : "");
    el.textContent = message;
    els.toastStack.appendChild(el);
    setTimeout(() => el.remove(), 3800);
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str ?? "";
    return div.innerHTML;
  }

  function initials(name) {
    if (!name) return "?";
    return name.trim().slice(0, 1).toUpperCase();
  }

  function avatarHtml(username, extraClass = "") {
    return `<span class="avatar${extraClass ? " " + extraClass : ""}"><img class="avatar-img" src="${API.avatar(username)}" alt="" loading="lazy" /><span class="avatar-fallback">${escapeHtml(initials(username))}</span></span>`;
  }

  function setAvatarEl(wrapperEl, imgEl, fallbackEl, username, cacheBust) {
    if (!wrapperEl || !imgEl || !fallbackEl) return;
    wrapperEl.classList.remove("img-error");
    fallbackEl.textContent = initials(username);
    imgEl.src = API.avatar(username) + (cacheBust ? `?v=${cacheBust}` : "");
  }

  function formatCount(n) {
    n = n || 0;
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".0", "") + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace(".0", "") + "K";
    return String(n);
  }

  function formatCountdown(ms) {
    if (ms <= 0) return "";
    const totalMin = Math.ceil(ms / 60000);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return h > 0 ? `${h}h ${m}min` : `${m}min`;
  }

  function timeAgo(iso) {
    const diffMs = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diffMs / 60000);
    if (min < 1) return t("time.now");
    if (min < 60) return t("time.minutes", { n: min });
    const hrs = Math.floor(min / 60);
    if (hrs < 24) return t("time.hours", { n: hrs });
    const days = Math.floor(hrs / 24);
    if (days < 30) return tp("time.days", days);
    const months = Math.floor(days / 30);
    if (months < 12) return tp("time.months", months);
    const years = Math.floor(months / 12);
    return tp("time.years", years);
  }

  function getUsername() {
    const user = Auth.getUser();
    return user ? user.username : "";
  }

  function getMyVideos() {
    const me = getUsername().toLowerCase();
    return allVideos.filter((v) => v.username.toLowerCase() === me);
  }

  function refreshUserChip() {
    const user = Auth.getUser();
    const name = user ? user.username : "";
    setAvatarEl(els.userAvatar, els.userAvatarImg, els.userAvatarFallback, name || t("nav.guest"), user?.avatarVersion);
    els.userNameLabel.textContent = name || t("nav.guest");
    els.userChipPremiumBadge.classList.toggle("hidden", !(user && user.isPremium));
  }

  function checkIcon() {
    return `<span class="check"><svg class="ico"><use href="#ic-check"></use></svg></span>`;
  }

  // ---------- Coins & Premium ----------

  function getNextClaimMs(user) {
    if (!user.lastDailyClaim) return 0;
    return new Date(user.lastDailyClaim).getTime() + DAILY_CLAIM_COOLDOWN_MS - Date.now();
  }

  function refreshCoinsUI() {
    const user = Auth.getUser();
    if (!user) return;

    els.coinBalanceLabel.textContent = formatCount(user.coins);
    els.coinsBalanceNumber.textContent = formatCount(user.coins);
    els.coinsDailyDesc.textContent = t("coins.dailyDesc", { amount: DAILY_CLAIM_COINS });

    const remaining = getNextClaimMs(user);
    if (remaining > 0) {
      els.claimCoinsBtn.disabled = true;
      els.claimCoinsBtn.textContent = t("coins.nextClaim", { time: formatCountdown(remaining) });
    } else {
      els.claimCoinsBtn.disabled = false;
      els.claimCoinsBtn.textContent = t("coins.claimButton", { amount: DAILY_CLAIM_COINS });
    }

    if (user.isPremium) {
      els.premiumCard.classList.add("is-premium");
      els.unlockPremiumBtn.textContent = t("premium.active");
      els.unlockPremiumBtn.disabled = true;
    } else {
      els.premiumCard.classList.remove("is-premium");
      const missing = Math.max(0, PREMIUM_COST_COINS - user.coins);
      els.unlockPremiumBtn.disabled = missing > 0;
      els.unlockPremiumBtn.textContent =
        missing > 0 ? t("premium.notEnough", { missing }) : t("premium.unlockButton", { cost: PREMIUM_COST_COINS });
    }
  }

  async function handleClaimCoins() {
    els.claimCoinsBtn.disabled = true;
    try {
      const data = await Auth.claimDailyCoins();
      toast(t("coins.claimSuccess", { amount: data.claimed }));
    } catch (err) {
      toast(err.message || t("coins.claimError"), "error");
    } finally {
      refreshCoinsUI();
    }
  }

  async function handleUnlockPremium() {
    try {
      await Auth.unlockPremium();
      toast(t("premium.unlockSuccess"));
      refreshCoinsUI();
      refreshUserChip();
    } catch (err) {
      toast(err.message || t("premium.unlockError"), "error");
    }
  }

  // ---------- Settings modal ----------

  function renderSettingsAccount() {
    const user = Auth.getUser();
    if (!user) return;
    setAvatarEl(els.settingsAvatarBtn, els.settingsAvatarImg, els.settingsAvatarFallback, user.username, user.avatarVersion);
    els.settingsUsername.textContent = user.username;
    const date = user.createdAt ? new Date(user.createdAt).toLocaleDateString(getLanguage()) : "";
    els.settingsMemberSince.textContent = t("settings.memberSince", { date });
  }

  function renderSettingsDesignPanel() {
    const current = getTheme();
    els.settingsDesignPanel.innerHTML = "";
    const grid = document.createElement("div");
    grid.className = "theme-grid";
    THEMES.forEach((theme) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "theme-card" + (theme.code === current ? " active" : "");
      const gradient = `linear-gradient(135deg, ${theme.swatch[0]}, ${theme.swatch[1]})`;
      card.innerHTML = `
        <span class="theme-preview" style="background:${gradient}"></span>
        <span class="theme-card-label">
          <span>${escapeHtml(t(theme.labelKey))}</span>
          ${checkIcon()}
        </span>
      `;
      card.addEventListener("click", () => {
        setTheme(theme.code);
        renderSettingsDesignPanel();
      });
      grid.appendChild(card);
    });
    els.settingsDesignPanel.appendChild(grid);
  }

  function renderSettingsLanguagePanel() {
    const current = getLanguage();
    els.settingsLanguagePanel.innerHTML = "";
    LANGUAGES.forEach((lang) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "dropdown-item" + (lang.code === current ? " active" : "");
      btn.innerHTML = `
        <span class="lang-flag">${lang.flag}</span>
        <span>${escapeHtml(lang.label)}</span>
        ${checkIcon()}
      `;
      btn.addEventListener("click", () => {
        setLanguage(lang.code);
        refreshAllText();
      });
      els.settingsLanguagePanel.appendChild(btn);
    });
  }

  // ---------- Routing ----------
  // Settings and Studio are real pages: reachable via a URL hash, so a
  // reload keeps you on the same page and the browser back button leaves it.

  function navigateToPage(path) {
    if (location.hash !== path) history.pushState({ socialyPage: path }, "", path);
  }

  // Updates the hash without creating a new history entry — used when
  // switching tabs inside an already-open page, so the back button leaves
  // the page in one step instead of stepping back through each tab.
  function updatePageHash(path) {
    if (location.hash !== path) history.replaceState({ socialyPage: path }, "", path);
  }

  function navigateAwayFromPage(prefix) {
    if (location.hash.startsWith(prefix)) {
      history.pushState({}, "", location.pathname + location.search);
    }
  }

  function routeFromHash() {
    if (els.appRoot.classList.contains("hidden")) return;
    const hash = location.hash;
    if (hash.startsWith("#/settings")) {
      openSettingsModal(hash.split("/")[2] || "account", true);
    } else if (hash.startsWith("#/studio")) {
      openStudio(true);
    } else {
      if (!els.settingsModalOverlay.classList.contains("hidden")) closeSettingsModal(true);
      if (!els.studioOverlay.classList.contains("hidden")) closeStudio(true);
    }
  }

  function switchSettingsTab(tabName) {
    [...els.settingsTabs.querySelectorAll(".settings-tab")].forEach((b) =>
      b.classList.toggle("active", b.dataset.settingstab === tabName)
    );
    els.settingsModalOverlay.querySelectorAll(".settings-panel").forEach((panel) => {
      panel.classList.toggle("hidden", panel.dataset.panel !== tabName);
    });
  }

  function openSettingsModal(tabName = "account", fromRoute = false) {
    if (!fromRoute) navigateToPage(`#/settings/${tabName}`);
    renderSettingsAccount();
    refreshCoinsUI();
    switchSettingsTab(tabName);
    els.settingsModalOverlay.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeSettingsModal(fromRoute = false) {
    if (!fromRoute) navigateAwayFromPage("#/settings");
    els.settingsModalOverlay.classList.add("hidden");
    document.body.style.overflow = "";
  }

  function refreshAllText() {
    applyI18n();
    refreshUserChip();
    refreshCoinsUI();
    renderSettingsAccount();
    renderSettingsDesignPanel();
    renderSettingsLanguagePanel();
    renderGrid();
    els.dropzoneHint.textContent = t("upload.dropzoneHint", { max: MAX_TOTAL_MB });
    if (currentVideoId) {
      const video = allVideos.find((v) => v.id === currentVideoId);
      if (video) renderComments(video.comments || []);
    }
  }

  // ---------- Studio ----------

  function studioTile(number, label) {
    return `<div class="studio-stat-tile"><div class="studio-stat-number">${number}</div><div class="studio-stat-label">${escapeHtml(label)}</div></div>`;
  }

  function renderStudio() {
    const myVideos = getMyVideos();

    if (!myVideos.length) {
      els.studioStatsGrid.innerHTML = "";
      els.studioEmpty.classList.remove("hidden");
      els.studioVideoListWrap.classList.add("hidden");
      return;
    }
    els.studioEmpty.classList.add("hidden");
    els.studioVideoListWrap.classList.remove("hidden");

    const totalViews = myVideos.reduce((sum, v) => sum + (v.views || 0), 0);
    const totalLikes = myVideos.reduce((sum, v) => sum + (v.likes || 0), 0);
    const totalComments = myVideos.reduce((sum, v) => sum + (v.comments ? v.comments.length : 0), 0);

    els.studioStatsGrid.innerHTML = [
      studioTile(formatCount(myVideos.length), t("studio.totalVideos")),
      studioTile(formatCount(totalViews), t("studio.totalViews")),
      studioTile(formatCount(totalLikes), t("studio.totalLikes")),
      studioTile(formatCount(totalComments), t("studio.totalComments")),
    ].join("");

    const sorted = [...myVideos].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const maxViews = Math.max(1, ...sorted.map((v) => v.views || 0));

    els.studioVideoList.innerHTML = "";
    const frag = document.createDocumentFragment();
    sorted.forEach((video) => {
      const row = document.createElement("div");
      row.className = "studio-video-row";
      row.style.cursor = "pointer";
      const thumbHtml = video.hasThumbnail
        ? `<img class="studio-video-thumb" src="${API.thumbnail(video.id)}" alt="" />`
        : `<div class="studio-video-thumb thumb-fallback"><svg class="ico"><use href="#ic-video"></use></svg></div>`;
      const pct = Math.round(((video.views || 0) / maxViews) * 100);
      row.innerHTML = `
        ${thumbHtml}
        <div class="studio-video-info">
          <p class="studio-video-title">${escapeHtml(video.title)}</p>
          <span class="studio-video-date">${timeAgo(video.createdAt)}</span>
          <div class="studio-video-bar-track"><div class="studio-video-bar-fill" style="width:${pct}%"></div></div>
        </div>
        <div class="studio-video-metrics">
          <div class="studio-video-metric">
            <div class="studio-video-metric-number">${formatCount(video.views)}</div>
            <div class="studio-video-metric-label">${escapeHtml(t("studio.totalViews"))}</div>
          </div>
          <div class="studio-video-metric">
            <div class="studio-video-metric-number">${formatCount(video.likes)}</div>
            <div class="studio-video-metric-label">${escapeHtml(t("studio.totalLikes"))}</div>
          </div>
          <div class="studio-video-metric">
            <div class="studio-video-metric-number">${formatCount(video.comments ? video.comments.length : 0)}</div>
            <div class="studio-video-metric-label">${escapeHtml(t("studio.totalComments"))}</div>
          </div>
        </div>
      `;
      row.addEventListener("click", () => {
        closeStudio();
        openWatch(video.id);
      });
      frag.appendChild(row);
    });
    els.studioVideoList.appendChild(frag);
  }

  function openStudio(fromRoute = false) {
    closeSettingsModal(true);
    if (!fromRoute) navigateToPage("#/studio");
    renderStudio();
    els.studioOverlay.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeStudio(fromRoute = false) {
    if (!fromRoute) navigateAwayFromPage("#/studio");
    els.studioOverlay.classList.add("hidden");
    document.body.style.overflow = "";
  }

  // ---------- Legal modal ----------

  function openLegalModal(type) {
    els.legalModalTitle.textContent = t(`legal.${type}Title`);
    els.legalModalBody.innerHTML = "";
    t(`legal.${type}Body`)
      .split("\n\n")
      .forEach((para) => {
        const p = document.createElement("p");
        p.textContent = para;
        els.legalModalBody.appendChild(p);
      });
    els.legalModalOverlay.classList.remove("hidden");
  }

  function closeLegalModal() {
    els.legalModalOverlay.classList.add("hidden");
  }

  // ---------- Filters ----------

  function setFilter(filter) {
    currentFilter = filter;
    [...els.filterRow.querySelectorAll(".filter-pill")].forEach((pill) => {
      pill.classList.toggle("active", pill.dataset.filter === filter);
    });
    [...els.bottomNav.querySelectorAll(".bottom-nav-item")].forEach((item) => {
      item.classList.toggle("active", item.dataset.nav === "home" && filter === "all");
    });
    renderGrid();
  }

  function getFilteredVideos() {
    let list = allVideos;
    if (currentFilter === "new") {
      const cutoff = Date.now() - NEW_WINDOW_MS;
      list = list.filter((v) => new Date(v.createdAt).getTime() >= cutoff);
    } else if (currentFilter === "popular") {
      list = [...list].sort((a, b) => (b.likes || 0) - (a.likes || 0));
    } else if (currentFilter === "mostViewed") {
      list = [...list].sort((a, b) => (b.views || 0) - (a.views || 0));
    } else if (currentFilter === "mine") {
      list = getMyVideos();
    }
    return list;
  }

  // ---------- Feed ----------

  function renderSkeletons(count = 10) {
    els.emptyState.classList.add("hidden");
    els.videoGrid.innerHTML = "";
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const card = document.createElement("div");
      card.innerHTML = `
        <div class="skeleton-thumb"></div>
        <div class="skeleton-meta">
          <div class="skeleton-avatar"></div>
          <div class="skeleton-lines">
            <div class="skeleton-bar"></div>
            <div class="skeleton-bar short"></div>
          </div>
        </div>
      `;
      frag.appendChild(card);
    }
    els.videoGrid.appendChild(frag);
  }

  async function loadVideos() {
    renderSkeletons();
    try {
      const res = await fetch(API.videos);
      if (!res.ok) throw new Error("load failed");
      const data = await res.json();
      allVideos = Array.isArray(data.videos) ? data.videos : [];
      renderGrid();
    } catch (err) {
      console.error(err);
      els.videoGrid.innerHTML = "";
      toast(t("upload.loadError"), "error");
    }
  }

  async function renderGrid() {
    if (currentFilter === "offline") {
      await renderOfflineGrid();
      return;
    }

    els.emptyStateTitle.textContent = t("empty.title");
    els.emptyStateDesc.textContent = t("empty.desc");

    const query = els.searchInput.value.trim().toLowerCase();
    let filtered = getFilteredVideos();
    if (query) {
      filtered = filtered.filter(
        (v) => v.title.toLowerCase().includes(query) || v.username.toLowerCase().includes(query)
      );
    }

    els.videoCountLabel.textContent = allVideos.length ? tp("feed.count", allVideos.length) : "";

    els.videoGrid.innerHTML = "";

    if (!filtered.length) {
      els.emptyState.classList.remove("hidden");
      return;
    }
    els.emptyState.classList.add("hidden");

    const frag = document.createDocumentFragment();
    filtered.forEach((video, i) => frag.appendChild(buildCard(video, i)));
    els.videoGrid.appendChild(frag);
  }

  function buildCard(video, index = 0) {
    const card = document.createElement("div");
    card.className = "video-card";
    card.dataset.id = video.id;
    card.style.animationDelay = `${Math.min(index, 14) * 35}ms`;
    card.tabIndex = 0;

    const thumbHtml = video.hasThumbnail
      ? `<img class="thumb" loading="lazy" src="${API.thumbnail(video.id)}" alt="${escapeHtml(video.title)}" />`
      : `<div class="thumb-fallback"><svg class="ico"><use href="#ic-video"></use></svg></div>`;

    card.innerHTML = `
      <div class="thumb-wrap">
        ${thumbHtml}
        <div class="play-hint"><svg class="ico ico--filled"><use href="#ic-logo"></use></svg></div>
      </div>
      <div class="card-meta">
        ${avatarHtml(video.username)}
        <div class="card-meta-text">
          <p class="card-title">${escapeHtml(video.title)}</p>
          <p class="card-sub">${escapeHtml(video.username)}</p>
          <p class="card-sub">${t("card.meta", { views: formatCount(video.views), time: timeAgo(video.createdAt) })}</p>
        </div>
      </div>
    `;

    card.addEventListener("click", () => openWatch(video.id));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openWatch(video.id);
      }
    });
    return card;
  }

  // ---------- Offline library ----------

  async function renderOfflineGrid() {
    const query = els.searchInput.value.trim().toLowerCase();
    let list = await Offline.listVideos();
    list.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
    if (query) {
      list = list.filter(
        (v) => (v.title || "").toLowerCase().includes(query) || (v.username || "").toLowerCase().includes(query)
      );
    }

    els.videoCountLabel.textContent = "";
    els.videoGrid.innerHTML = "";

    if (!list.length) {
      els.emptyStateTitle.textContent = t("offline.emptyTitle");
      els.emptyStateDesc.textContent = t("offline.emptyDesc");
      els.emptyState.classList.remove("hidden");
      return;
    }
    els.emptyState.classList.add("hidden");

    const frag = document.createDocumentFragment();
    list.forEach((video, i) => frag.appendChild(buildOfflineCard(video, i)));
    els.videoGrid.appendChild(frag);
  }

  function buildOfflineCard(video, index = 0) {
    const card = document.createElement("div");
    card.className = "video-card";
    card.dataset.id = video.id;
    card.style.animationDelay = `${Math.min(index, 14) * 35}ms`;
    card.tabIndex = 0;

    const thumbHtml = video.thumbnailBlob
      ? `<img class="thumb" src="${URL.createObjectURL(video.thumbnailBlob)}" alt="${escapeHtml(video.title)}" />`
      : `<div class="thumb-fallback"><svg class="ico"><use href="#ic-video"></use></svg></div>`;

    card.innerHTML = `
      <div class="thumb-wrap">
        ${thumbHtml}
        <div class="play-hint"><svg class="ico ico--filled"><use href="#ic-logo"></use></svg></div>
      </div>
      <div class="card-meta">
        ${avatarHtml(video.username)}
        <div class="card-meta-text">
          <p class="card-title">${escapeHtml(video.title)}</p>
          <p class="card-sub">${escapeHtml(video.username)}</p>
          <p class="card-sub">${escapeHtml(t("offline.saved"))}</p>
        </div>
      </div>
    `;

    card.addEventListener("click", () => openOfflineWatch(video.id));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openOfflineWatch(video.id);
      }
    });
    return card;
  }

  async function refreshOfflineButton(id) {
    const saved = await Offline.isSaved(id);
    els.offlineSaveBtn.classList.toggle("liked", saved);
    els.offlineSaveLabel.textContent = saved ? t("offline.saved") : t("offline.save");
    els.offlineSaveBtn.dataset.saved = saved ? "1" : "0";
  }

  async function handleOfflineSave() {
    if (!currentVideoId) return;
    const user = Auth.getUser();
    if (!user || !user.isPremium) {
      toast(t("offline.premiumOnly"));
      closeWatch();
      openSettingsModal("coins");
      return;
    }

    const id = currentVideoId;
    const alreadySaved = els.offlineSaveBtn.dataset.saved === "1";

    if (alreadySaved) {
      await Offline.removeVideo(id);
      toast(t("offline.removeSuccess"));
      await refreshOfflineButton(id);
      if (currentFilter === "offline") renderGrid();
      return;
    }

    const video = allVideos.find((v) => v.id === id);
    els.offlineSaveBtn.disabled = true;
    try {
      const videoRes = await fetch(API.video(id));
      if (!videoRes.ok) throw new Error();
      const blob = await videoRes.blob();

      let thumbnailBlob = null;
      if (video && video.hasThumbnail) {
        try {
          const thumbRes = await fetch(API.thumbnail(id));
          if (thumbRes.ok) thumbnailBlob = await thumbRes.blob();
        } catch {
          thumbnailBlob = null;
        }
      }

      await Offline.saveVideo(
        {
          id,
          title: video ? video.title : els.watchTitle.textContent,
          username: video ? video.username : els.watchUsername.textContent,
          description: video ? video.description : "",
          createdAt: video ? video.createdAt : new Date().toISOString(),
          thumbnailBlob,
        },
        blob
      );

      toast(t("offline.saveSuccess"));
      await refreshOfflineButton(id);
      if (currentFilter === "offline") renderGrid();
    } catch (err) {
      console.error(err);
      toast(t("offline.saveError"), "error");
    } finally {
      els.offlineSaveBtn.disabled = false;
    }
  }

  async function openOfflineWatch(id) {
    const video = await Offline.getVideo(id);
    if (!video) return;

    currentVideoId = id;
    els.watchVideo.src = URL.createObjectURL(video.blob);
    els.watchTitle.textContent = video.title;
    setAvatarEl(els.watchAvatar, els.watchAvatarImg, els.watchAvatarFallback, video.username);
    els.watchUsername.textContent = video.username;
    els.watchMeta.textContent = t("offline.saved");
    els.watchDescription.textContent = video.description || "";
    els.likeCount.textContent = "–";
    els.viewCount.textContent = "–";
    els.likeBtn.classList.remove("liked");
    renderComments([]);
    await refreshOfflineButton(id);

    els.watchOverlay.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  // ---------- Watch view ----------

  async function openWatch(id) {
    const video = allVideos.find((v) => v.id === id);
    if (!video) return;

    currentVideoId = id;
    els.watchVideo.src = API.video(id);
    els.watchTitle.textContent = video.title;
    setAvatarEl(els.watchAvatar, els.watchAvatarImg, els.watchAvatarFallback, video.username);
    els.watchUsername.textContent = video.username;
    els.watchMeta.textContent = timeAgo(video.createdAt);
    els.watchDescription.textContent = video.description || "";
    els.likeCount.textContent = formatCount(video.likes);
    els.viewCount.textContent = formatCount(video.views);

    const likedBy = Array.isArray(video.likedBy) ? video.likedBy : [];
    const liked = likedBy.includes(getUsername().toLowerCase());
    els.likeBtn.classList.toggle("liked", liked);

    renderComments(video.comments || []);
    await refreshOfflineButton(id);

    els.watchOverlay.classList.remove("hidden");
    document.body.style.overflow = "hidden";

    fetch(API.view(id), { method: "POST" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        video.views = data.views;
        els.viewCount.textContent = formatCount(data.views);
        const gridCard = els.videoGrid.querySelector(`[data-id="${id}"]`);
        if (gridCard) renderGrid();
      })
      .catch(() => {});
  }

  function closeWatch() {
    els.watchOverlay.classList.add("hidden");
    els.watchVideo.pause();
    if (els.watchVideo.src.startsWith("blob:")) URL.revokeObjectURL(els.watchVideo.src);
    els.watchVideo.removeAttribute("src");
    els.watchVideo.load();
    document.body.style.overflow = "";
    currentVideoId = null;
  }

  function renderComments(comments) {
    els.commentCountLabel.innerHTML = `<svg class="ico"><use href="#ic-comment"></use></svg><span>${escapeHtml(t("watch.commentsCount", { n: comments.length }))}</span>`;
    els.commentList.innerHTML = "";

    if (!comments.length) {
      els.commentList.innerHTML = `<p class="no-comments">${escapeHtml(t("watch.noComments"))}</p>`;
      return;
    }

    const frag = document.createDocumentFragment();
    [...comments].reverse().forEach((c) => {
      const item = document.createElement("div");
      item.className = "comment-item";
      item.innerHTML = `
        ${avatarHtml(c.author, "comment-avatar")}
        <div class="comment-body">
          <span class="comment-author">${escapeHtml(c.author)}</span>${escapeHtml(c.text)}
          <span class="comment-time">${timeAgo(c.createdAt)}</span>
        </div>
      `;
      frag.appendChild(item);
    });
    els.commentList.appendChild(frag);
  }

  async function handleLike() {
    if (!currentVideoId) return;
    const id = currentVideoId;

    try {
      const res = await fetch(API.like(id), { method: "POST" });
      if (!res.ok) throw new Error("like failed");
      const data = await res.json();

      if (data.alreadyLiked) {
        toast(t("watch.alreadyLiked"));
        return;
      }

      els.likeBtn.classList.add("liked");
      els.likeCount.textContent = formatCount(data.likes);
      const video = allVideos.find((v) => v.id === id);
      if (video) {
        video.likes = data.likes;
        video.likedBy = [...(Array.isArray(video.likedBy) ? video.likedBy : []), getUsername().toLowerCase()];
      }
    } catch (err) {
      console.error(err);
      toast(t("watch.likeError"), "error");
    }
  }

  async function handleCommentSubmit(e) {
    e.preventDefault();
    if (!currentVideoId) return;
    const text = els.commentInput.value.trim();
    if (!text) return;

    try {
      const res = await fetch(API.comment(currentVideoId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("comment failed");
      const data = await res.json();
      els.commentInput.value = "";
      renderComments(data.comments);
      const video = allVideos.find((v) => v.id === currentVideoId);
      if (video) video.comments = data.comments;
    } catch (err) {
      console.error(err);
      toast(t("watch.commentError"), "error");
    }
  }

  // ---------- Upload ----------

  function openUploadModal() {
    resetUploadForm();
    els.uploadModalOverlay.classList.remove("hidden");
  }

  function closeUploadModal() {
    els.uploadModalOverlay.classList.add("hidden");
    resetUploadForm();
  }

  function resetUploadForm() {
    els.uploadForm.reset();
    selectedFile = null;
    selectedThumbnailDataUrl = null;
    els.videoPreviewWrap.classList.add("hidden");
    els.videoPreview.removeAttribute("src");
    els.thumbnailPicker.classList.add("hidden");
    els.thumbnailPreviewImg.removeAttribute("src");
    els.dropzoneLabel.textContent = t("upload.dropzoneLabel");
    els.uploadError.classList.remove("show");
    els.uploadError.textContent = "";
    setUploadProgress(null);
    setSubmitLoading(false);
  }

  function showUploadError(msg) {
    els.uploadError.textContent = msg;
    els.uploadError.classList.add("show");
  }

  function setSubmitLoading(loading) {
    els.submitUploadBtn.disabled = loading;
    if (!loading) els.submitUploadBtn.textContent = t("upload.submit");
  }

  function setUploadProgress(percent) {
    if (percent === null) {
      els.uploadProgress.classList.add("hidden");
      return;
    }
    els.uploadProgress.classList.remove("hidden");
    const clamped = Math.max(0, Math.min(100, Math.round(percent)));
    els.uploadProgressFill.style.width = clamped + "%";
    els.uploadProgressLabel.textContent = clamped + "%";
    els.submitUploadBtn.textContent =
      clamped >= 100 ? t("upload.finalizing") : t("upload.uploading", { percent: clamped });
  }

  function captureThumbnailFrame() {
    try {
      const canvas = els.thumbCanvas;
      const ratio = els.videoPreview.videoWidth / els.videoPreview.videoHeight;
      let w = canvas.width;
      let h = canvas.height;
      if (ratio > w / h) {
        h = Math.round(w / ratio);
      } else {
        w = Math.round(h * ratio);
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(els.videoPreview, 0, 0, w, h);
      selectedThumbnailDataUrl = canvas.toDataURL("image/jpeg", 0.75);
      els.thumbnailPreviewImg.src = selectedThumbnailDataUrl;
    } catch (err) {
      console.warn("Thumbnail-Erstellung fehlgeschlagen", err);
    }
  }

  function handleFileSelected(file) {
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      showUploadError(t("upload.errNotVideo"));
      return;
    }
    if (file.size > MAX_TOTAL_BYTES) {
      showUploadError(
        t("upload.errTooBig", {
          size: (file.size / 1024 / 1024).toFixed(1),
          max: MAX_TOTAL_MB,
        })
      );
      return;
    }

    els.uploadError.classList.remove("show");
    selectedFile = file;
    selectedThumbnailDataUrl = null;
    els.dropzoneLabel.textContent = file.name;

    const objectUrl = URL.createObjectURL(file);
    els.videoPreview.src = objectUrl;
    els.videoPreviewWrap.classList.remove("hidden");

    els.videoPreview.addEventListener(
      "loadedmetadata",
      () => {
        try {
          const duration = els.videoPreview.duration || 1;
          els.thumbScrubRange.max = String(Math.max(1, Math.floor(duration * 10)));
          els.thumbScrubRange.value = "0";
          els.videoPreview.currentTime = Math.min(0.5, duration / 4);
          els.thumbnailPicker.classList.remove("hidden");
        } catch {
          /* ignore */
        }
      },
      { once: true }
    );

    els.videoPreview.addEventListener("seeked", captureThumbnailFrame);
  }

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",").pop());
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async function uploadFileInChunks(file, uploadId, onProgress) {
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    let completed = 0;

    async function uploadOne(index) {
      const start = index * CHUNK_SIZE;
      const end = Math.min(file.size, start + CHUNK_SIZE);
      const chunkBase64 = await blobToBase64(file.slice(start, end));

      const res = await fetch(API.uploadChunk, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: uploadId, index, chunkBase64 }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "chunk upload failed");
      }

      completed += 1;
      onProgress(completed / totalChunks);
    }

    const queue = Array.from({ length: totalChunks }, (_, i) => i);
    const workers = Array.from({ length: Math.min(CHUNK_CONCURRENCY, totalChunks) }, async () => {
      while (queue.length) {
        const index = queue.shift();
        await uploadOne(index);
      }
    });

    await Promise.all(workers);
    return totalChunks;
  }

  async function handleUploadSubmit(e) {
    e.preventDefault();
    els.uploadError.classList.remove("show");

    const title = els.titleInput.value.trim();
    const description = els.descriptionInput.value.trim();

    if (!selectedFile) {
      showUploadError(t("upload.errNeedFile"));
      return;
    }
    if (!title) {
      showUploadError(t("upload.errNeedTitle"));
      return;
    }

    setSubmitLoading(true);
    setUploadProgress(0);

    try {
      const uploadId = crypto.randomUUID();

      const totalChunks = await uploadFileInChunks(selectedFile, uploadId, (fraction) =>
        setUploadProgress(fraction * 100)
      );

      const res = await fetch(API.uploadFinalize, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: uploadId,
          totalChunks,
          title,
          description,
          videoType: selectedFile.type || "video/mp4",
          thumbnailBase64: selectedThumbnailDataUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "finalize failed");
      }

      toast(t("upload.success"));
      closeUploadModal();
      await loadVideos();
      if (data.id) openWatch(data.id);
    } catch (err) {
      console.error(err);
      showUploadError(err.message && err.message !== "finalize failed" ? err.message : t("upload.errFailed"));
    } finally {
      setSubmitLoading(false);
      setUploadProgress(null);
    }
  }

  // ---------- Auth ----------

  function switchAuthTab(tabName) {
    [...els.authTabs.querySelectorAll(".auth-tab")].forEach((b) =>
      b.classList.toggle("active", b.dataset.authtab === tabName)
    );
    els.loginForm.classList.toggle("hidden", tabName !== "login");
    els.registerForm.classList.toggle("hidden", tabName !== "register");
  }

  function showFieldError(el, msg) {
    el.textContent = msg;
    el.classList.add("show");
  }

  async function enterApp() {
    els.authGate.classList.add("hidden");
    els.appRoot.classList.remove("hidden");
    applyTheme(getTheme());
    refreshUserChip();
    refreshCoinsUI();

    if (Auth.isOfflineSession()) {
      toast(t("offline.sessionRestored"));
      setFilter("offline");
    } else {
      await loadVideos();
    }

    routeFromHash();
  }

  function showAuthGate() {
    els.appRoot.classList.add("hidden");
    els.authGate.classList.remove("hidden");
    switchAuthTab("login");
  }

  async function handleLoginSubmit(e) {
    e.preventDefault();
    els.loginError.classList.remove("show");

    const username = els.loginUsername.value.trim();
    const password = els.loginPassword.value;

    if (!username) return showFieldError(els.loginError, t("auth.errUsernameRequired"));
    if (!password) return showFieldError(els.loginError, t("auth.errPasswordRequired"));

    els.loginSubmitBtn.disabled = true;
    els.loginSubmitBtn.textContent = t("auth.loggingIn");

    try {
      const user = await Auth.login(username, password);
      els.loginForm.reset();
      toast(t("auth.welcomeBack", { username: user.username }));
      await enterApp();
    } catch (err) {
      showFieldError(els.loginError, err.message);
    } finally {
      els.loginSubmitBtn.disabled = false;
      els.loginSubmitBtn.textContent = t("auth.loginSubmit");
    }
  }

  async function handleRegisterSubmit(e) {
    e.preventDefault();
    els.registerError.classList.remove("show");

    const username = els.registerUsername.value.trim();
    const password = els.registerPassword.value;
    const confirmPassword = els.registerPasswordConfirm.value;

    if (!username) return showFieldError(els.registerError, t("auth.errUsernameRequired"));
    if (!password) return showFieldError(els.registerError, t("auth.errPasswordRequired"));
    if (password.length < 6) return showFieldError(els.registerError, t("auth.errPasswordTooShort"));
    if (password !== confirmPassword) return showFieldError(els.registerError, t("auth.errPasswordMismatch"));

    els.registerSubmitBtn.disabled = true;
    els.registerSubmitBtn.textContent = t("auth.registering");

    try {
      const user = await Auth.register(username, password);
      els.registerForm.reset();
      toast(t("auth.welcomeNew", { username: user.username }));
      await enterApp();
    } catch (err) {
      showFieldError(els.registerError, err.message);
    } finally {
      els.registerSubmitBtn.disabled = false;
      els.registerSubmitBtn.textContent = t("auth.registerSubmit");
    }
  }

  async function handleLogout() {
    await Auth.logout();
    closeSettingsModal();
    allVideos = [];
    currentVideoId = null;
    currentFilter = "all";
    els.searchInput.value = "";
    toast(t("auth.loggedOut"));
    showAuthGate();
  }

  function togglePasswordVisibility(btn) {
    const target = document.getElementById(btn.dataset.target);
    if (!target) return;
    const showing = target.type === "text";
    target.type = showing ? "password" : "text";
    btn.innerHTML = showing
      ? `<svg class="ico"><use href="#ic-eye"></use></svg>`
      : `<svg class="ico"><use href="#ic-eye-off"></use></svg>`;
  }

  // ---------- Event bindings ----------

  els.authTabs.addEventListener("click", (e) => {
    const btn = e.target.closest(".auth-tab");
    if (btn) switchAuthTab(btn.dataset.authtab);
  });
  els.loginForm.addEventListener("submit", handleLoginSubmit);
  els.registerForm.addEventListener("submit", handleRegisterSubmit);
  document.querySelectorAll(".auth-eye-toggle").forEach((btn) => {
    btn.addEventListener("click", () => togglePasswordVisibility(btn));
  });

  els.searchInput.addEventListener("input", renderGrid);
  els.searchBtn.addEventListener("click", () => els.searchInput.focus());

  els.filterRow.addEventListener("click", (e) => {
    const pill = e.target.closest(".filter-pill");
    if (pill) setFilter(pill.dataset.filter);
  });

  els.openUploadBtn.addEventListener("click", openUploadModal);
  els.closeUploadBtn.addEventListener("click", closeUploadModal);
  els.cancelUploadBtn.addEventListener("click", closeUploadModal);
  els.uploadModalOverlay.addEventListener("click", (e) => {
    if (e.target === els.uploadModalOverlay) closeUploadModal();
  });
  els.uploadForm.addEventListener("submit", handleUploadSubmit);

  els.dropzone.addEventListener("click", () => els.fileInput.click());
  els.fileInput.addEventListener("change", (e) => handleFileSelected(e.target.files[0]));
  els.dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    els.dropzone.classList.add("dragover");
  });
  els.dropzone.addEventListener("dragleave", () => els.dropzone.classList.remove("dragover"));
  els.dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    els.dropzone.classList.remove("dragover");
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelected(file);
  });

  els.thumbScrubRange.addEventListener("input", () => {
    try {
      els.videoPreview.currentTime = Number(els.thumbScrubRange.value) / 10;
    } catch {
      /* ignore */
    }
  });
  els.thumbnailUploadBtn.addEventListener("click", () => els.thumbnailFileInput.click());
  els.thumbnailFileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      selectedThumbnailDataUrl = String(reader.result);
      els.thumbnailPreviewImg.src = selectedThumbnailDataUrl;
    };
    reader.readAsDataURL(file);
  });

  function resizeImageForAvatar(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const size = 256;
          const minSide = Math.min(img.width, img.height);
          const sx = (img.width - minSide) / 2;
          const sy = (img.height - minSide) / 2;
          const canvas = document.createElement("canvas");
          canvas.width = size;
          canvas.height = size;
          canvas.getContext("2d").drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
          resolve(canvas.toDataURL("image/jpeg", 0.85));
        };
        img.onerror = () => reject(new Error("image decode failed"));
        img.src = String(reader.result);
      };
      reader.onerror = () => reject(new Error("file read failed"));
      reader.readAsDataURL(file);
    });
  }

  els.settingsAvatarBtn.addEventListener("click", () => els.avatarFileInput.click());
  els.avatarFileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;
    try {
      const dataUrl = await resizeImageForAvatar(file);
      const res = await fetch(API.avatarUpload, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: dataUrl, contentType: "image/jpeg" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t("settings.avatarError"));
      Auth.setAvatarVersion(data.avatarVersion);
      renderSettingsAccount();
      refreshUserChip();
      toast(t("settings.avatarSuccess"));
    } catch (err) {
      toast(err.message || t("settings.avatarError"), "error");
    }
  });

  // Avatar <img> tags 404 whenever a user has no profile picture yet; fall
  // back to the initials badge underneath instead of showing a broken image.
  document.addEventListener(
    "error",
    (e) => {
      if (e.target?.classList?.contains("avatar-img")) {
        e.target.closest(".avatar")?.classList.add("img-error");
      }
    },
    true
  );

  els.closeWatchBtn.addEventListener("click", closeWatch);
  els.watchOverlay.addEventListener("click", (e) => {
    if (e.target === els.watchOverlay) closeWatch();
  });
  els.likeBtn.addEventListener("click", handleLike);
  els.offlineSaveBtn.addEventListener("click", handleOfflineSave);
  els.commentForm.addEventListener("submit", handleCommentSubmit);

  els.userChipBtn.addEventListener("click", () => openSettingsModal("account"));
  els.settingsBtn.addEventListener("click", () => openSettingsModal("account"));
  els.coinChipBtn.addEventListener("click", () => openSettingsModal("coins"));
  els.closeSettingsBtn.addEventListener("click", () => closeSettingsModal());
  els.settingsModalOverlay.addEventListener("click", (e) => {
    if (e.target === els.settingsModalOverlay) closeSettingsModal();
  });
  els.settingsTabs.addEventListener("click", (e) => {
    const btn = e.target.closest(".settings-tab");
    if (btn) {
      switchSettingsTab(btn.dataset.settingstab);
      updatePageHash(`#/settings/${btn.dataset.settingstab}`);
      refreshCoinsUI();
    }
  });
  els.settingsLogoutBtn.addEventListener("click", handleLogout);
  els.claimCoinsBtn.addEventListener("click", handleClaimCoins);
  els.unlockPremiumBtn.addEventListener("click", handleUnlockPremium);
  els.openStudioBtn.addEventListener("click", () => openStudio());
  els.closeStudioBtn.addEventListener("click", () => closeStudio());
  els.studioOverlay.addEventListener("click", (e) => {
    if (e.target === els.studioOverlay) closeStudio();
  });
  window.addEventListener("popstate", routeFromHash);

  document.querySelectorAll(".app-footer-link").forEach((btn) => {
    btn.addEventListener("click", () => openLegalModal(btn.dataset.legal));
  });
  els.closeLegalBtn.addEventListener("click", closeLegalModal);
  els.legalModalOverlay.addEventListener("click", (e) => {
    if (e.target === els.legalModalOverlay) closeLegalModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (!els.watchOverlay.classList.contains("hidden")) closeWatch();
      if (!els.uploadModalOverlay.classList.contains("hidden")) closeUploadModal();
      if (!els.settingsModalOverlay.classList.contains("hidden")) closeSettingsModal();
      if (!els.studioOverlay.classList.contains("hidden")) closeStudio();
      if (!els.legalModalOverlay.classList.contains("hidden")) closeLegalModal();
    }
  });

  // ---------- Bottom navigation (mobile) ----------

  els.bottomHomeBtn.addEventListener("click", () => {
    els.searchInput.value = "";
    setFilter("all");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  els.bottomSearchBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    els.searchInput.focus();
  });

  els.bottomUploadBtn.addEventListener("click", openUploadModal);
  els.bottomThemeBtn.addEventListener("click", () => openSettingsModal("design"));
  els.bottomProfileBtn.addEventListener("click", () => openSettingsModal("account"));

  // ---------- Init ----------

  async function init() {
    applyTheme(getTheme());
    applyI18n();
    renderSettingsDesignPanel();
    renderSettingsLanguagePanel();
    els.dropzoneHint.textContent = t("upload.dropzoneHint", { max: MAX_TOTAL_MB });
    els.footerCopyright.textContent = `© ${new Date().getFullYear()} Socialy`;

    const user = await Auth.fetchMe();
    if (user) {
      await enterApp();
    } else {
      showAuthGate();
    }

    setInterval(() => {
      if (Auth.getUser()) refreshCoinsUI();
    }, 60000);
  }

  init();
})();
