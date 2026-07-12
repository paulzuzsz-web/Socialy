(() => {
  "use strict";

  const { t, tp, applyI18n, getLanguage, setLanguage, LANGUAGES } = window.SocialyI18n;
  const { THEMES, getTheme, setTheme, applyTheme } = window.SocialyThemes;

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

  const els = {
    videoGrid: document.getElementById("videoGrid"),
    emptyState: document.getElementById("emptyState"),
    videoCountLabel: document.getElementById("videoCountLabel"),
    searchInput: document.getElementById("searchInput"),

    userChipBtn: document.getElementById("userChipBtn"),
    userAvatar: document.getElementById("userAvatar"),
    userNameLabel: document.getElementById("userNameLabel"),

    themeBtn: document.getElementById("themeBtn"),
    themePanel: document.getElementById("themePanel"),
    langBtn: document.getElementById("langBtn"),
    langPanel: document.getElementById("langPanel"),

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
    usernameInput: document.getElementById("usernameInput"),
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

    onboardBanner: document.getElementById("onboardBanner"),
    onboardNameInput: document.getElementById("onboardNameInput"),
    onboardSaveBtn: document.getElementById("onboardSaveBtn"),

    toastStack: document.getElementById("toastStack"),
  };

  let allVideos = [];
  let currentVideoId = null;
  let selectedFile = null;
  let selectedThumbnailDataUrl = null;

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

  function getLikedIds() {
    try {
      return new Set(JSON.parse(localStorage.getItem("socialy_liked") || "[]"));
    } catch {
      return new Set();
    }
  }

  function addLikedId(id) {
    const set = getLikedIds();
    set.add(id);
    localStorage.setItem("socialy_liked", JSON.stringify([...set]));
  }

  function getUsername() {
    return localStorage.getItem("socialy_username") || "";
  }

  function setUsername(name) {
    localStorage.setItem("socialy_username", name);
    refreshUserChip();
  }

  function refreshUserChip() {
    const name = getUsername();
    els.userAvatar.textContent = initials(name || t("nav.guest"));
    els.userNameLabel.textContent = name || t("nav.guest");
    els.usernameInput.value = name;
  }

  // ---------- Language & Theme dropdowns ----------

  function closeAllDropdowns() {
    els.themePanel.classList.add("hidden");
    els.langPanel.classList.add("hidden");
  }

  function renderThemePanel() {
    const current = getTheme();
    els.themePanel.innerHTML = "";
    THEMES.forEach((theme) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "dropdown-item" + (theme.code === current ? " active" : "");
      const gradient = `linear-gradient(135deg, ${theme.swatch[0]}, ${theme.swatch[1]})`;
      btn.innerHTML = `
        <span class="theme-swatch" style="background:${gradient}"></span>
        <span>${escapeHtml(t(theme.labelKey))}</span>
        <span class="check">✓</span>
      `;
      btn.addEventListener("click", () => {
        setTheme(theme.code);
        renderThemePanel();
        closeAllDropdowns();
      });
      els.themePanel.appendChild(btn);
    });
  }

  function renderLangPanel() {
    const current = getLanguage();
    els.langPanel.innerHTML = "";
    LANGUAGES.forEach((lang) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "dropdown-item" + (lang.code === current ? " active" : "");
      btn.innerHTML = `
        <span class="lang-flag">${lang.flag}</span>
        <span>${escapeHtml(lang.label)}</span>
        <span class="check">✓</span>
      `;
      btn.addEventListener("click", () => {
        setLanguage(lang.code);
        refreshAllText();
        closeAllDropdowns();
      });
      els.langPanel.appendChild(btn);
    });
  }

  function refreshAllText() {
    applyI18n();
    refreshUserChip();
    renderThemePanel();
    renderLangPanel();
    renderGrid();
    els.dropzoneHint.textContent = t("upload.dropzoneHint", { max: MAX_TOTAL_MB });
    if (currentVideoId) {
      const video = allVideos.find((v) => v.id === currentVideoId);
      if (video) renderComments(video.comments || []);
    }
  }

  // ---------- Feed ----------

  async function loadVideos() {
    try {
      const res = await fetch(API.videos);
      if (!res.ok) throw new Error("load failed");
      const data = await res.json();
      allVideos = Array.isArray(data.videos) ? data.videos : [];
      renderGrid();
    } catch (err) {
      console.error(err);
      toast(t("upload.loadError"), "error");
    }
  }

  function renderGrid() {
    const query = els.searchInput.value.trim().toLowerCase();
    const filtered = query
      ? allVideos.filter(
          (v) =>
            v.title.toLowerCase().includes(query) ||
            v.username.toLowerCase().includes(query)
        )
      : allVideos;

    els.videoCountLabel.textContent = allVideos.length ? tp("feed.count", allVideos.length) : "";

    els.videoGrid.innerHTML = "";

    if (!filtered.length) {
      els.emptyState.classList.remove("hidden");
      return;
    }
    els.emptyState.classList.add("hidden");

    const frag = document.createDocumentFragment();
    filtered.forEach((video) => frag.appendChild(buildCard(video)));
    els.videoGrid.appendChild(frag);
  }

  function buildCard(video) {
    const card = document.createElement("div");
    card.className = "video-card";
    card.dataset.id = video.id;

    const thumbHtml = video.hasThumbnail
      ? `<img class="thumb" loading="lazy" src="${API.thumbnail(video.id)}" alt="${escapeHtml(video.title)}" />`
      : `<div class="thumb-fallback">
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
             <rect x="2" y="5" width="15" height="14" rx="2"></rect>
             <path d="M17 9l5-3v12l-5-3"></path>
           </svg>
         </div>`;

    card.innerHTML = `
      ${thumbHtml}
      <div class="card-overlay">
        <div class="card-stats">
          <span class="card-pill">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            ${formatCount(video.views)}
          </span>
          <span class="card-pill">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"></path>
            </svg>
            ${formatCount(video.likes)}
          </span>
        </div>
        <div class="card-bottom">
          <p class="card-title">${escapeHtml(video.title)}</p>
          <div class="card-user">
            <span class="avatar" style="width:18px;height:18px;font-size:10px;">${initials(video.username)}</span>
            ${escapeHtml(video.username)}
          </div>
        </div>
      </div>
    `;

    card.addEventListener("click", () => openWatch(video.id));
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

    const liked = getLikedIds().has(id);
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
    els.commentCountLabel.textContent = t("watch.commentsCount", { n: comments.length });
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
    const likedIds = getLikedIds();
    if (likedIds.has(id)) {
      toast(t("watch.alreadyLiked"));
      return;
    }
    try {
      const res = await fetch(API.like(id), { method: "POST" });
      if (!res.ok) throw new Error("like failed");
      const data = await res.json();
      addLikedId(id);
      els.likeBtn.classList.add("liked");
      els.likeCount.textContent = formatCount(data.likes);
      const video = allVideos.find((v) => v.id === id);
      if (video) video.likes = data.likes;
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

    const author = getUsername() || "Anonym";

    try {
      const res = await fetch(API.comment(currentVideoId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author, text }),
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
    els.usernameInput.value = getUsername();
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
    const username = els.usernameInput.value.trim();

    if (!selectedFile) {
      showUploadError(t("upload.errNeedFile"));
      return;
    }
    if (!title) {
      showUploadError(t("upload.errNeedTitle"));
      return;
    }
    if (!username) {
      showUploadError(t("upload.errNeedUsername"));
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
          username,
          videoType: selectedFile.type || "video/mp4",
          thumbnailBase64: selectedThumbnailDataUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "finalize failed");
      }

      setUsername(username);
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

  // ---------- Onboarding ----------

  function maybeShowOnboarding() {
    if (!getUsername()) {
      els.onboardBanner.classList.remove("hidden");
    }
  }

  function saveOnboardName() {
    const name = els.onboardNameInput.value.trim();
    if (!name) return;
    setUsername(name);
    els.onboardBanner.classList.add("hidden");
  }

  // ---------- Event bindings ----------

  els.searchInput.addEventListener("input", renderGrid);

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

  els.userChipBtn.addEventListener("click", () => {
    const current = getUsername();
    const name = prompt(t("nav.changeNamePrompt"), current || "");
    if (name && name.trim()) setUsername(name.trim());
  });

  els.themeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const willOpen = els.themePanel.classList.contains("hidden");
    closeAllDropdowns();
    if (willOpen) els.themePanel.classList.remove("hidden");
  });

  els.langBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const willOpen = els.langPanel.classList.contains("hidden");
    closeAllDropdowns();
    if (willOpen) els.langPanel.classList.remove("hidden");
  });

  document.addEventListener("click", closeAllDropdowns);

  els.onboardSaveBtn.addEventListener("click", saveOnboardName);
  els.onboardNameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") saveOnboardName();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (!els.watchOverlay.classList.contains("hidden")) closeWatch();
      if (!els.uploadModalOverlay.classList.contains("hidden")) closeUploadModal();
      closeAllDropdowns();
    }
  });

  // ---------- Init ----------

  applyTheme(getTheme());
  applyI18n();
  refreshUserChip();
  renderThemePanel();
  renderLangPanel();
  els.dropzoneHint.textContent = t("upload.dropzoneHint", { max: MAX_TOTAL_MB });
  maybeShowOnboarding();
  loadVideos();
})();
