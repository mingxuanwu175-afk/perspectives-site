/* Adds "Sign in" (or the reader's name when signed in) to the top bar of every page.
 * Light on purpose: it only looks for the Supabase session that supabase-js
 * keeps in localStorage, so ordinary pages do not load the Supabase library.
 * account.html hands over the name from the profiles table via setName(), so a
 * name changed there appears in the bar at once (and is remembered for later
 * pages). Editors and admins also get a coloured role tag after their name
 * (yellow "Editor", blue "Admin") and a link to review.html; that role comes
 * from a cached copy (written by account.html and review.html) and, when the
 * stored session is still fresh, one profiles read.
 * Load it after lang.js.
 */
(function () {
  "use strict";
  var WORDS = {
    en: { "nav.signin": "Sign in", "nav.account": "My account", "nav.review": "Review", "nav.manage": "Manage", "nav.admin": "Admin", "nav.editor": "Editor" },
    zh: { "nav.signin": "登录", "nav.account": "我的账号", "nav.review": "审稿", "nav.manage": "管理", "nav.admin": "管理员", "nav.editor": "编辑" },
    ja: { "nav.signin": "ログイン", "nav.account": "マイアカウント", "nav.review": "レビュー", "nav.manage": "管理", "nav.admin": "管理者", "nav.editor": "編集者" },
    ko: { "nav.signin": "로그인", "nav.account": "내 계정", "nav.review": "검토", "nav.manage": "관리", "nav.admin": "관리자", "nav.editor": "편집자" }
  };
  var NAME_KEY = "perspectives:nav-name";
  var ROLE_KEY = "perspectives:nav-role";
  // The public Supabase settings (the key is publishable by design; the same
  // pair is in review.js). Used only to ask for the signed-in reader's role.
  var SUPABASE_URL = "https://itnylaavtwmhvzepmxrt.supabase.co";
  var SUPABASE_KEY = "sb_publishable_zrfDWNTiHJSEdaK4lxlo3Q_3vz08ZR_";
  var roles = {};   // profile id -> role, as read on this page
  var asking = {};  // ids whose role request is still in flight
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

  // The role is not in the auth session, so it is read from profiles. A cached
  // copy paints the bar at once; the request below corrects it. Only cosmetic:
  // row level security is what actually protects review.html.
  function cachedRole(id) {
    try {
      var v = JSON.parse(localStorage.getItem(ROLE_KEY) || "null");
      if (v && v.id === id && typeof v.role === "string" && v.role) return v.role;
    } catch (e) { /* storage blocked */ }
    return "";
  }

  function rememberRole(id, role) {
    try {
      localStorage.setItem(ROLE_KEY, JSON.stringify({ id: id, role: role }));
    } catch (e) { /* storage blocked */ }
  }

  function roleOf(user, session) {
    if (roles[user.id] != null) return roles[user.id];
    var cached = cachedRole(user.id);
    if (cached) return cached;
    askRole(user.id, session);
    return "";
  }

  // Plain pages never refresh the Supabase session, so an old access token
  // would only earn a 401. Ask only while it still looks valid; otherwise the
  // cached role (written by account.html and review.html) has to do.
  function tokenFresh(session) {
    try {
      var part = String(session.access_token).split(".")[1];
      if (!part) return false;
      var json = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
      var exp = JSON.parse(json).exp;
      return !exp || exp * 1000 > Date.now() + 30000;
    } catch (e) { return false; }
  }

  function askRole(id, session) {
    if (asking[id] || !session || !session.access_token || !window.fetch) return;
    if (!tokenFresh(session)) return;
    asking[id] = true;
    var url = SUPABASE_URL + "/rest/v1/profiles?select=role&id=eq." + encodeURIComponent(id);
    fetch(url, { headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + session.access_token } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (rows) {
        if (!rows) return; // no answer (expired token, offline): keep the cache
        var role = rows[0] && rows[0].role ? rows[0].role : "reader";
        roles[id] = role;
        rememberRole(id, role);
        render();
      })
      .catch(function () { /* offline: the cache, if any, still stands */ })
      .then(function () { asking[id] = false; });
  }

  function divider(attr) {
    var d = document.createElement("div");
    d.className = "nav-sep";
    d.setAttribute("aria-hidden", "true");
    d.textContent = "|";
    d.setAttribute(attr, "");
    return d;
  }

  function render() {
    var nav = document.querySelector(".nav_links");
    if (!nav) return;
    ["data-auth-link", "data-auth-divider", "data-review-link", "data-review-divider",
      "data-manage-link", "data-manage-divider"].forEach(function (attr) {
      var old = document.querySelector("header [" + attr + "]");
      if (old) old.parentNode.removeChild(old);
    });

    var s = readSession();
    var user = s && s.user;
    var name = user ? displayName(user) : "";
    var role = user ? roleOf(user, s) : "";
    var admin = role === "admin";
    var editor = role === "editor";
    var before = nav.querySelector("#langSwitch");
    var out = [];

    // Editors and admins both review submissions, so both get the way in.
    if (admin || editor) {
      out.push(divider("data-review-divider"));
      var review = document.createElement("a");
      review.href = "review.html";
      review.setAttribute("data-review-link", "");
      review.setAttribute("data-i18n", "nav.review");
      review.textContent = WORDS.en["nav.review"];
      out.push(review);
    }

    // Manage: articles for editors and admins; people and roles for admins only.
    if (admin || editor) {
      out.push(divider("data-manage-divider"));
      var manage = document.createElement("a");
      manage.href = "manage.html";
      manage.setAttribute("data-manage-link", "");
      manage.setAttribute("data-i18n", "nav.manage");
      manage.textContent = WORDS.en["nav.manage"];
      out.push(manage);
    }

    out.push(divider("data-auth-divider"));
    var a = document.createElement("a");
    a.href = "account.html";
    a.setAttribute("data-auth-link", "");
    if (user && name) {
      // No data-i18n on the name: a name must not be replaced by the "My
      // account" label when the reader switches language.
      a.className = "nav-user";
      a.title = name;
      var label = document.createElement("span");
      label.className = "nav-name";
      label.textContent = name;
      a.appendChild(label);
      var badgeKey = admin ? "nav.admin" : editor ? "nav.editor" : "";
      if (badgeKey) {
        var badge = document.createElement("span");
        badge.className = "nav-badge " + (admin ? "nav-badge--admin" : "nav-badge--editor");
        badge.setAttribute("data-i18n", badgeKey);
        badge.textContent = WORDS.en[badgeKey];
        a.appendChild(badge);
      }
    } else {
      var key = user ? "nav.account" : "nav.signin";
      a.setAttribute("data-i18n", key);
      a.textContent = WORDS.en[key];
    }
    out.push(a);
    // The sign-in / account link sits in the quick-link row (after nature.com)
    // when the page has one; Review and Manage stay in the main links.
    var util = document.querySelector("header .nav-util");
    out.forEach(function (n) {
      if (util && (n.hasAttribute("data-auth-link") || n.hasAttribute("data-auth-divider"))) {
        if (n.hasAttribute("data-auth-link")) util.appendChild(n);
      } else nav.insertBefore(n, before);
    });
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

  // account.html already has the profile row in hand; hand its role over so the
  // bar does not need a second request (and stays right when serving offline).
  function setRole(id, role) {
    var v = typeof role === "string" ? role.trim() : "";
    if (v) {
      roles[id] = v;
      rememberRole(id, v);
    }
    var s = readSession();
    if (s && s.user && s.user.id === id) render();
  }

  window.PerspectivesAuthNav = { refresh: render, setName: setName, setRole: setRole };
  window.addEventListener("storage", function (e) {
    if (!e.key || e.key === NAME_KEY || e.key === ROLE_KEY || /^sb-.+-auth-token$/.test(e.key)) render();
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", render); else render();
})();
