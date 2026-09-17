// Thin wrapper around Firebase Auth (compat SDK). Safe to include on every
// page: if shared/firebase-config.js hasn't been filled in yet, everything
// here becomes a no-op instead of throwing.
window.PuzzleAuth = (function () {
  const configured = window.FIREBASE_CONFIG
    && window.FIREBASE_CONFIG.apiKey !== "REPLACE_ME"
    && window.FIREBASE_CONFIG.databaseURL !== "REPLACE_ME";
  let app = null;

  if (configured && window.firebase) {
    app = firebase.initializeApp(window.FIREBASE_CONFIG);
  }

  function isConfigured() { return configured; }

  function onChange(cb) {
    if (!configured) { cb(null); return; }
    firebase.auth().onAuthStateChanged(cb);
  }

  function signUp(email, password) {
    if (!configured) return Promise.reject(new Error("Firebase isn't configured yet (see shared/firebase-config.js)."));
    return firebase.auth().createUserWithEmailAndPassword(email, password);
  }

  function logIn(email, password) {
    if (!configured) return Promise.reject(new Error("Firebase isn't configured yet (see shared/firebase-config.js)."));
    return firebase.auth().signInWithEmailAndPassword(email, password);
  }

  function logOut() {
    if (!configured) return Promise.resolve();
    return firebase.auth().signOut();
  }

  function currentUser() {
    if (!configured) return null;
    return firebase.auth().currentUser;
  }

  function isAdmin(user) {
    return !!user && Array.isArray(window.ADMIN_EMAILS) && window.ADMIN_EMAILS.includes(user.email);
  }

  // Renders the little "Log in" / "you@x.com · Log out" widget used in every
  // page header. Call this once per page; it's safe to call even when
  // Firebase isn't configured (it just explains that).
  function renderAuthWidget(elId) {
    const el = document.getElementById(elId);
    if (!el) return;
    if (!configured) {
      el.innerHTML = '<span title="Add your Firebase keys to shared/firebase-config.js to enable this">Log in (not set up)</span>';
      return;
    }
    onChange((user) => {
      if (user) {
        const adminLink = isAdmin(user) ? ' &middot; <a href="' + rootPath() + 'admin.html">Admin</a>' : '';
        el.innerHTML = '<span>' + escapeHtml(user.email) + '</span>' + adminLink +
          ' &middot; <button class="link-btn" id="logoutBtn">Log out</button>';
        document.getElementById("logoutBtn").addEventListener("click", () => logOut());
      } else {
        el.innerHTML = '<a href="' + rootPath() + 'login.html">Log in / Sign up</a>';
      }
    });
  }

  function rootPath() {
    // Game pages live one folder below the site root; the hub/admin/login
    // pages live at the root. Figure out which so links work from either.
    return location.pathname.includes("/wordle/") || location.pathname.includes("/strands/") || location.pathname.includes("/crossword/")
      ? "../" : "";
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  return { isConfigured, onChange, signUp, logIn, logOut, currentUser, isAdmin, renderAuthWidget };
})();

document.addEventListener("DOMContentLoaded", () => window.PuzzleAuth.renderAuthWidget("authWidget"));
