(() => {
  "use strict";

  const { t, tp, applyI18n, getLanguage, setLanguage, LANGUAGES } = window.SocialyI18n;
  const { THEMES, getTheme, setTheme, applyTheme } = window.SocialyThemes;
  const Auth = window.SocialyAuth;

  const API = {
    videos: "/api/videos",
    uploadChunk: "/api/upload-chunk",
    uploadFinalize: "/api/upload-finalize",
    video: (id) => `/api/video/${id}`,
    thumbnail: (id) => `/api/thumbnail/${id}`,
    like: (id) => `/api/like/${id}`,
    view: (id) => `/api/view/${id}`,
    comment: (id) => `/api/comment/${id}`,
  };

  const MAX_TOTAL_MB = 50;
  const MAX_TOTAL_BYTES = MAX_TOTAL_MB * 1024 * 1024;
  const CHUNK_SIZE = 3 * 1024 * 1024; // 3 MB pro Chunk (Rohdaten)
  const CHUNK_CONCURRENCY = 3;
  const NEW_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // "Neu"-Filter: letzte 7 Tage

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
    videoCountLabel: document.getElementById("videoCountLabel"),
    searchInput: document.getElementById("searchInput"),
    searchBtn: document.getElementById("searchBtn"),
    filterRow: document.getElementById("filterRow"),

    userChipBtn: document.getElementById("userChipBtn"),
    userAvatar: document.getElementById("userAvatar"),
    userNameLabel: document.getElementById("userNameLabel"),
    settingsBtn: document.getElementById("settingsBtn"),

    settingsModalOverlay: document.getElementById("settingsModalOverlay"),
    closeSettingsBtn: document.getElementById("closeSettingsBtn"),
    settingsTabs: document.getElementById("settingsTabs"),
    settingsAvatar: document.getElementById("settingsAvatar"),
    settingsUsername: document.getElementById("settingsUsername"),
    settingsMemberSince: document.getElementById("settingsMemberSince"),
    settingsLogoutBtn: document.getElementById("settingsLogoutBtn"),
    settingsDesignPanel: document.getElementById("settingsDesignPanel"),
    settingsLanguagePanel: document.getElementById("settingsLanguagePanel"),

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
    watchUsername: document.getElementById("watchUsername"),
    watchMeta: document.getElementById("watchMeta"),
    watchDescription: document.getElementById("watchDescription"),
    likeBtn: document.getElementById("likeBtn"),
    likeCount: document.getElementById("likeCount"),
    viewCount: document.getElementById("viewCount"),
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

  function formatCount(n) {
    n = n || 0;
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".0", "") + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace(".0", "") + "K";
    return String(n);
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

  function refreshUserChip() {
    const name = getUsername();
    els.userAvatar.textContent = initials(name || t("nav.guest"));
    els.userNameLabel.textContent = name || t("nav.guest");
  }

  function checkIcon() {
    return `<span class="check"><svg class="ico"><use href="#ic-check"></use></svg></span>`;
  }

  // ---------- Settings modal ----------

  function renderSettingsAccount() {
    const user = Auth.getUser();
    if (!user) return;
    els.settingsAvatar.textContent = initials(user.username);
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

  function switchSettingsTab(tabName) {
    [...els.settingsTabs.querySelectorAll(".settings-tab")].forEach((b) =>
      b.classList.toggle("active", b.dataset.settingstab === tabName)
    );
    els.settingsModalOverlay.querySelectorAll(".settings-panel").forEach((panel) => {
      panel.classList.toggle("hidden", panel.dataset.panel !== tabName);
    });
  }

  function openSettingsModal(tabName = "account") {
    renderSettingsAccount();
    switchSettingsTab(tabName);
    els.settingsModalOverlay.classList.remove("hidden");
  }

  function closeSettingsModal() {
    els.settingsModalOverlay.classList.add("hidden");
  }

  function refreshAllText() {
    applyI18n();
    refreshUserChip();
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
      const me = getUsername().toLowerCase();
      list = list.filter((v) => v.username.toLowerCase() === me);
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

  function renderGrid() {
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
        <span class="avatar">${initials(video.username)}</span>
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

  // ---------- Watch view ----------

  async function openWatch(id) {
    const video = allVideos.find((v) => v.id === id);
    if (!video) return;

    currentVideoId = id;
    els.watchVideo.src = API.video(id);
    els.watchTitle.textContent = video.title;
    els.watchAvatar.textContent = initials(video.username);
    els.watchUsername.textContent = video.username;
    els.watchMeta.textContent = timeAgo(video.createdAt);
    els.watchDescription.textContent = video.description || "";
    els.likeCount.textContent = formatCount(video.likes);
    els.viewCount.textContent = formatCount(video.views);

    const likedBy = Array.isArray(video.likedBy) ? video.likedBy : [];
    const liked = likedBy.includes(getUsername().toLowerCase());
    els.likeBtn.classList.toggle("liked", liked);

    renderComments(video.comments || []);

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
        <span class="avatar" style="width:30px;height:30px;font-size:13px;">${initials(c.author)}</span>
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
          els.videoPreview.currentTime = Math.min(0.5, (els.videoPreview.duration || 1) / 4);
        } catch {
          /* ignore */
        }
      },
      { once: true }
    );

    els.videoPreview.addEventListener(
      "seeked",
      () => {
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
        } catch (err) {
          console.warn("Thumbnail-Erstellung fehlgeschlagen", err);
        }
      },
      { once: true }
    );
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
    await loadVideos();
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

  els.closeWatchBtn.addEventListener("click", closeWatch);
  els.watchOverlay.addEventListener("click", (e) => {
    if (e.target === els.watchOverlay) closeWatch();
  });
  els.likeBtn.addEventListener("click", handleLike);
  els.commentForm.addEventListener("submit", handleCommentSubmit);

  els.userChipBtn.addEventListener("click", () => openSettingsModal("account"));
  els.settingsBtn.addEventListener("click", () => openSettingsModal("account"));
  els.closeSettingsBtn.addEventListener("click", closeSettingsModal);
  els.settingsModalOverlay.addEventListener("click", (e) => {
    if (e.target === els.settingsModalOverlay) closeSettingsModal();
  });
  els.settingsTabs.addEventListener("click", (e) => {
    const btn = e.target.closest(".settings-tab");
    if (btn) switchSettingsTab(btn.dataset.settingstab);
  });
  els.settingsLogoutBtn.addEventListener("click", handleLogout);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (!els.watchOverlay.classList.contains("hidden")) closeWatch();
      if (!els.uploadModalOverlay.classList.contains("hidden")) closeUploadModal();
      if (!els.settingsModalOverlay.classList.contains("hidden")) closeSettingsModal();
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

    const user = await Auth.fetchMe();
    if (user) {
      await enterApp();
    } else {
      showAuthGate();
    }
  }

  init();
})();
