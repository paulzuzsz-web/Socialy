(() => {
  "use strict";

  const API = {
    register: "/api/auth/register",
    login: "/api/auth/login",
    logout: "/api/auth/logout",
    me: "/api/auth/me",
  };

  let currentUser = null;

  async function fetchMe() {
    try {
      const res = await fetch(API.me);
      if (!res.ok) {
        currentUser = null;
        return null;
      }
      const data = await res.json();
      currentUser = data.user;
      return currentUser;
    } catch {
      currentUser = null;
      return null;
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
    return currentUser;
  }

  async function logout() {
    try {
      await fetch(API.logout, { method: "POST" });
    } catch {
      /* ignore network errors on logout */
    }
    currentUser = null;
  }

  function getUser() {
    return currentUser;
  }

  window.SocialyAuth = { fetchMe, register, login, logout, getUser };
})();
