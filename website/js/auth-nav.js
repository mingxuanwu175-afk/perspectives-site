/* Adds "Sign in" (or the reader's name when signed in) to the top bar of every page.
 * Light on purpose: it only looks for the Supabase session that supabase-js
 * keeps in localStorage, so ordinary pages do not load the Supabase library.
 * account.html hands over the name from the profiles table via setName(), so a
 * name changed there appears in the bar at once (and is remembered for later
 * pages). Load it after lang.js.
 */
(function () {
  "use strict";
  var WORDS = {
    en: { "nav.signin": "Sign in", "nav.account": "My account" },
    zh: { "nav.signin": "登录", "nav.account": "我的账号" },
    ja: { "nav.signin": "ログイン", "nav.account": "マイアカウント" },
    ko: { "nav.signin": "로그인", "nav.account": "내 계정" }
  };
  var NAME_KEY = "perspectives:nav-name";
  var I18N = window.PerspectivesI18N;
  if (I18N) Object.keys(WORDS).forEach(function (l) {
    var d = I18N.translations[l] || (I18N.translations[l] = {});
    Object.keys(WORDS[l]).forEach(function (k) { d[k] = WORDS[l][k]; });
  });

  // The Supabase session, or null when signed out. Older supabase-js wraps it
  // in currentSession; both shapes are read here.
  function readSession() {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (!/^sb-.+-auth-token$/.test(k)) continue;
        var s = JSON.parse(localStorage.getItem(k) || "null");
        if (!s) continue;
        if (s.currentSession) s = s.currentSession;
        if (s && s.user && (s.refresh_token || s.access_token)) return s;
      }
    } catch (e) { /* storage blocked */ }
    return null;
  }

  // A name the account page read from profiles (fresher than user metadata).
  function cachedName(id) {
    try {
      var v = JSON.parse(localStorage.getItem(NAME_KEY) || "null");
      if (v && v.id === id && typeof v.name === "string" && v.name) return v.name.trim();
    } catch (e) { /* storage blocked */ }
    return "";
  }

  function metadataName(user) {
    var md = (user && user.user_metadata) || {};
    var keys = ["username", "name", "full_name", "display_name"];
    for (var i = 0; i < keys.length; i++) {
      var v = md[keys[i]];
      if (typeof v === "string" && v.trim()) return v.trim();
    }
    return "";
  }

  function displayName(user) {
    if (!user) return "";
    return cachedName(user.id) || metadataName(user) || (user.email ? String(user.email).split("@")[0] : "");
  }

  function render() {
    var nav = document.querySelector(".nav_links");
    if (!nav) return;
    var old = nav.querySelector("[data-auth-link]");
    if (old) old.parentNode.removeChild(old);
    var oldBar = nav.querySelector("[data-auth-divider]");
    if (oldBar) oldBar.parentNode.removeChild(oldBar);

    var s = readSession();
    var name = s && displayName(s.user);
    var bar = document.createElement("div");
    bar.style.color = "#fff";
    bar.textContent = "|";
    bar.setAttribute("data-auth-divider", "");
    var a = document.createElement("a");
    a.href = "account.html";
    a.setAttribute("data-auth-link", "");
    if (s && name) {
      // No data-i18n: a name must not be replaced by the "My account" label
      // when the reader switches language.
      a.className = "nav-user";
      a.textContent = name;
      a.title = name;
      a.setAttribute("aria-label", name);
      a.setAttribute("data-nav-user", "");
    } else {
      var key = s ? "nav.account" : "nav.signin";
      a.setAttribute("data-i18n", key);
      a.textContent = WORDS.en[key];
    }
    var before = nav.querySelector("#langSwitch");
    nav.insertBefore(bar, before);
    nav.insertBefore(a, before);
    if (I18N) I18N.setLanguage(I18N.current);
  }

  // The account page calls this with the profiles.username it just read or
  // saved. An empty name clears the cache so metadata/email is used instead.
  function setName(id, name) {
    var v = String(name == null ? "" : name).trim();
    try {
      if (v) {
        localStorage.setItem(NAME_KEY, JSON.stringify({ id: id, name: v }));
      } else {
        var old = JSON.parse(localStorage.getItem(NAME_KEY) || "null");
        if (!old || old.id === id) localStorage.removeItem(NAME_KEY);
      }
    } catch (e) { /* storage blocked */ }
    var s = readSession();
    if (s && s.user && s.user.id === id) render();
  }

  window.PerspectivesAuthNav = { refresh: render, setName: setName };
  window.addEventListener("storage", function (e) {
    if (!e.key || e.key === NAME_KEY || /^sb-.+-auth-token$/.test(e.key)) render();
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", render); else render();
})();
