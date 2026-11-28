/* Top bar behaviour, in two halves that never run at the same time:
 *
 *   narrow screens (<= 768px)  every nav item moves into one dropdown behind a
 *                             hamburger button, so the bar never wraps or squeezes;
 *   wide screens  (> 768px)   the bar stays inline, and a chevron button can
 *                             fold it away and bring it back (the choice is
 *                             remembered for the next page).
 *
 * The two buttons are created here rather than written into eleven pages, and
 * css/style.css decides which one is visible. Load after lang.js (and
 * auth-nav.js) so their words can be translated like every other label.
 */
(function () {
  "use strict";
  var BREAKPOINT = 768;   // keep in sync with the media queries in css/style.css
  var STORE = "perspectives:nav-collapsed";
  var I18N = window.PerspectivesI18N;
  var WORDS = {
    en: { "nav.menu": "Menu" },
    zh: { "nav.menu": "菜单" },
    ja: { "nav.menu": "メニュー" },
    ko: { "nav.menu": "메뉴" }
  };
  if (I18N) {
    Object.keys(WORDS).forEach(function (l) {
      var d = I18N.translations[l] || (I18N.translations[l] = {});
      Object.keys(WORDS[l]).forEach(function (k) { d[k] = WORDS[l][k]; });
    });
  }

  var BARS = "M4 7h16M4 12h16M4 17h16";   // hamburger
  var CHEVRON = "M14 6l-6 6 6 6";         // "<", flipped by CSS when folded

  function icon(d) {
    var NS = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    var path = document.createElementNS(NS, "path");
    path.setAttribute("d", d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "2");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    svg.appendChild(path);
    return svg;
  }

  // Screen-reader name only: the button itself is an icon.
  function label() {
    var s = document.createElement("span");
    s.className = "sr-only";
    s.setAttribute("data-i18n", "nav.menu");
    s.textContent = "Menu";
    return s;
  }

  function readFolded() {
    try { return localStorage.getItem(STORE) === "1"; } catch (e) { return false; }
  }

  function saveFolded(v) {
    try { localStorage.setItem(STORE, v ? "1" : "0"); } catch (e) { /* storage blocked */ }
  }

  function build() {
    var header = document.querySelector("header");
    var nav = header && header.querySelector(".nav_links");
    if (!header || !nav || header.getAttribute("data-nav-ready") === "1") return;
    header.setAttribute("data-nav-ready", "1");
    if (!nav.id) nav.id = "navLinks";

    var toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "nav-toggle";
    toggle.setAttribute("aria-controls", nav.id);
    toggle.setAttribute("aria-expanded", "false");
    toggle.appendChild(label());
    toggle.appendChild(icon(BARS));

    var fold = document.createElement("button");
    fold.type = "button";
    fold.className = "nav-collapse";
    fold.setAttribute("aria-controls", nav.id);
    fold.setAttribute("aria-expanded", "true");
    fold.appendChild(label());
    fold.appendChild(icon(CHEVRON));

    header.appendChild(toggle);
    header.appendChild(fold);

    function setOpen(open) {
      header.classList.toggle("nav-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    }

    function setFolded(v) {
      header.classList.toggle("nav-collapsed", v);
      fold.setAttribute("aria-expanded", v ? "false" : "true");
      saveFolded(v);
    }

    toggle.addEventListener("click", function (e) {
      e.stopPropagation();
      setOpen(!header.classList.contains("nav-open"));
    });

    fold.addEventListener("click", function () {
      setFolded(!header.classList.contains("nav-collapsed"));
    });

    // Tap anywhere else to close the dropdown. The language list lives on
    // <body>, outside the header, so a click inside it must not count.
    document.addEventListener("mousedown", function (e) {
      if (!header.classList.contains("nav-open")) return;
      if (header.contains(e.target)) return;
      var menu = document.getElementById("langMenu");
      if (menu && menu.contains(e.target)) return;
      setOpen(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape" && e.key !== "Esc") return;
      if (!header.classList.contains("nav-open")) return;
      setOpen(false);
      toggle.focus();
    });

    // Growing past the breakpoint puts the inline bar back; start closed again
    // if the window shrinks.
    window.addEventListener("resize", function () {
      if (window.innerWidth > BREAKPOINT && header.classList.contains("nav-open")) setOpen(false);
    });

    // The homepage always opens with the links showing; other pages keep the
    // reader's last choice.
    var onHome = /(^|\/)(index\.html)?$/.test(location.pathname);
    if (onHome) saveFolded(false);
    else if (readFolded()) setFolded(true);
    if (I18N) I18N.setLanguage(I18N.current);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build);
  else build();

  // Exposed so a page can reset the bar after changing the DOM if it ever needs to.
  window.PerspectivesNav = { refresh: build };
})();
