/* Adds "Sign in" (or "My account" when signed in) to the top bar of every page.
 * Light on purpose: it only looks for the Supabase session that supabase-js
 * keeps in localStorage, so ordinary pages do not load the Supabase library.
 * Load it after lang.js.
 */
(function () {
  "use strict";
  var WORDS = {
    en: { "nav.signin": "Sign in", "nav.account": "My account" },
    zh: { "nav.signin": "登录", "nav.account": "我的账号" },
    ja: { "nav.signin": "ログイン", "nav.account": "マイアカウント" },
    ko: { "nav.signin": "로그인", "nav.account": "내 계정" }
  };
  var I18N = window.PerspectivesI18N;
  if (I18N) Object.keys(WORDS).forEach(function (l) {
    var d = I18N.translations[l] || (I18N.translations[l] = {});
    Object.keys(WORDS[l]).forEach(function (k) { d[k] = WORDS[l][k]; });
  });

  function signedIn() {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (/^sb-.+-auth-token$/.test(k)) {
          var s = JSON.parse(localStorage.getItem(k));
          if (s && (s.refresh_token || (s.currentSession && s.currentSession.refresh_token))) return true;
        }
      }
    } catch (e) { /* storage blocked */ }
    return false;
  }

  function add() {
    var nav = document.querySelector(".nav_links");
    if (!nav || nav.querySelector("[data-auth-link]")) return;
    var key = signedIn() ? "nav.account" : "nav.signin";
    var bar = document.createElement("div");
    bar.style.color = "#fff";
    bar.textContent = "|";
    var a = document.createElement("a");
    a.href = "account.html";
    a.setAttribute("data-auth-link", "");
    a.setAttribute("data-i18n", key);
    a.textContent = WORDS.en[key];
    var before = nav.querySelector("#langSwitch");
    nav.insertBefore(bar, before);
    nav.insertBefore(a, before);
    if (I18N) I18N.setLanguage(I18N.current);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", add); else add();
})();
