(() => {
  "use strict";

  const API = {
    register: "/api/auth/register",
    login: "/api/auth/login",
    logout: "/api/auth/logout",
    me: "/api/auth/me",
    claimCoins: "/api/coins/claim",
    unlockPremium: "/api/premium/unlock",
  };

  const CACHE_KEY = "socialy_cached_user";

  let currentUser = null;
  let isOffline = false;

  function cacheUser(user) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(user));
    } catch {
      /* ignore storage errors */
    }
  }

  function getCachedUser() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function clearCachedUser() {
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch {
      /* ignore storage errors */
    }
  }

  // Distinguishes "the server said you're logged out" from "we couldn't
  // reach the server at all" (e.g. actually offline). In the latter case we
  // fall back to the last known session so a Premium member can still reach
  // their downloaded videos without a network round-trip.
  async function fetchMe() {
    try {
      const res = await fetch(API.me);
      if (res.status === 401) {
        currentUser = null;
        isOffline = false;
        clearCachedUser();
        return null;
      }
      if (!res.ok) throw new Error("unexpected response");
      const data = await res.json();
      currentUser = data.user;
      isOffline = false;
      cacheUser(currentUser);
      return currentUser;
    } catch {
      currentUser = getCachedUser();
      isOffline = !!currentUser;
      return currentUser;
    }
  }

  async function register(username, password) {
    const res = await fetch(API.register, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Registrierung fehlgeschlagen");
    currentUser = data.user;
    isOffline = false;
    cacheUser(currentUser);
    return currentUser;
  }

  async function login(username, password) {
    const res = await fetch(API.login, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Anmeldung fehlgeschlagen");
    currentUser = data.user;
    isOffline = false;
    cacheUser(currentUser);
    return currentUser;
  }

  async function logout() {
    try {
      await fetch(API.logout, { method: "POST" });
    } catch {
      /* ignore network errors on logout */
    }
    currentUser = null;
    isOffline = false;
    clearCachedUser();
  }

  async function claimDailyCoins() {
    const res = await fetch(API.claimCoins, { method: "POST" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Coins konnten nicht abgeholt werden");
    currentUser = data.user;
    cacheUser(currentUser);
    return data;
  }

  async function unlockPremium() {
    const res = await fetch(API.unlockPremium, { method: "POST" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Premium konnte nicht freigeschaltet werden");
    currentUser = data.user;
    cacheUser(currentUser);
    return currentUser;
  }

  function getUser() {
    return currentUser;
  }

  function setAvatarVersion(version) {
    if (!currentUser) return;
    currentUser.avatarVersion = version;
    cacheUser(currentUser);
  }

  function isOfflineSession() {
    return isOffline;
  }

  window.SocialyAuth = {
    fetchMe,
    register,
    login,
    logout,
    claimDailyCoins,
    unlockPremium,
    getUser,
    setAvatarVersion,
    isOfflineSession,
  };
})();
