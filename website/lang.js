/* Perspectives — 语言词典 + 切换逻辑
 *
 * 用普通 <script> 加载（不是 ES module），这样直接双击 index.html 从本地磁盘打开
 * 也能用：浏览器会用 CORS 拦截 file:// 页面里的 ES module，原写法在本地一定失败。
 *
 * 用法（任何页面）：
 *   1. 引入本文件：<script src="lang.js"></script>
 *   2. 需要翻译的元素写 data-i18n="字典里的 key"
 *   3. 切换按钮给 id="langSwitch"（或任意 data-lang-switch 属性）：
 *      点击弹出语言列表，点列表里的语言即切换
 */
(function (global) {
  "use strict";

  var DEFAULT_LANG = "en";          // 默认语言
  var STORAGE_KEY = "siteLang";     // localStorage 里记住选择的键

  // 一种语言一个字典；某个语言留空（{}）时，语言列表里不会出现它。
  var translations = {
    en: {
      "Perspectives Student Magazine": "Perspectives Student Magazine",
      "Perspectives": "Perspectives",
      "Business": "Business",
      "Join Us": "Join Us",
      "Article": "Article",
      "About": "About",
      "Language": "Language",
      "copyright": "© 2027 Perspectives Student Magazine. All rights reserved.",
      "page.business": "Business | Perspectives",
      "page.join_us": "Join Us | Perspectives",
      "page.article": "Article | Perspectives",
      "page.about": "About | Perspectives",
      btnText: "Language"
    },
    zh: {
      "Perspectives Student Magazine": "Perspectives 学生杂志",
      "Perspectives": "Perspectives",
      "Business": "商业",
      "Join Us": "加入我们",
      "Article": "文章",
      "About": "关于我们",
      "Language": "语言",
      "copyright": "© 2027 Perspectives 学生杂志。保留所有权利。",
      "page.business": "商业 | Perspectives",
      "page.join_us": "加入我们 | Perspectives",
      "page.article": "文章 | Perspectives",
      "page.about": "关于我们 | Perspectives",
      btnText: "语言"
    },
    ja: {
      "Perspectives Student Magazine": "Perspectives 学生マガジン",
      "Perspectives": "Perspectives",
      "Business": "ビジネス",
      "Join Us": "参加する",
      "Article": "記事",
      "About": "私たちについて",
      "Language": "言語",
      "copyright": "© 2027 Perspectives 学生マガジン。無断転載を禁じます。",
      "page.business": "ビジネス | Perspectives",
      "page.join_us": "参加する | Perspectives",
      "page.article": "記事 | Perspectives",
      "page.about": "私たちについて | Perspectives",
      btnText: "言語"
    },
    ko: {
      "Perspectives Student Magazine": "Perspectives 학생 잡지",
      "Perspectives": "Perspectives",
      "Business": "비즈니스",
      "Join Us": "참여하기",
      "Article": "기사",
      "About": "소개",
      "Language": "언어",
      "copyright": "© 2027 Perspectives 학생 잡지. 모든 권리 보유.",
      "page.business": "비즈니스 | Perspectives",
      "page.join_us": "참여하기 | Perspectives",
      "page.article": "기사 | Perspectives",
      "page.about": "소개 | Perspectives",
      btnText: "언어"
    }
  };

  // 列表里显示的名字，用各自语言的原生写法，不翻译
  var LANG_NAMES = {
    en: "English",
    zh: "中文",
    ja: "日本語",
    ko: "한국어"
  };

  var currentLang = DEFAULT_LANG;
  var original = new WeakMap();     // 元素 -> 第一次翻译前的原文，用作最后的兜底
  var menu = null;                  // 语言列表（懒创建，全站共用一个）
  var menuOwner = null;             // 当前打开列表的按钮

  function hasOwn(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
  }

  // 有内容的语言（顺序 = 字典里定义的顺序），空字典自动排除
  function languages() {
    return Object.keys(translations).filter(function (code) {
      var dict = translations[code];
      return dict && Object.keys(dict).length > 0;
    });
  }

  function isUsable(lang) {
    return !!lang && hasOwn(translations, lang) && languages().indexOf(lang) !== -1;
  }

  // 取词：当前语言 -> 英文 -> 元素原文
  function textFor(lang, key, el) {
    var dict = translations[lang];
    if (dict && hasOwn(dict, key)) return dict[key];
    var fallback = translations[DEFAULT_LANG];
    if (fallback && hasOwn(fallback, key)) return fallback[key];
    return el && original.has(el) ? original.get(el) : null;
  }

  function readSaved() {
    try {
      var saved = global.localStorage.getItem(STORAGE_KEY);
      return isUsable(saved) ? saved : DEFAULT_LANG;
    } catch (e) {
      return DEFAULT_LANG;          // 隐私模式等情况下 localStorage 会抛错，不要因此中断
    }
  }

  function save(lang) {
    try {
      global.localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) { /* 存不了就算了，不影响页面 */ }
  }

  // 核心：把当前文档里所有 data-i18n 元素换成对应语言
  function setLanguage(lang) {
    if (!isUsable(lang)) lang = DEFAULT_LANG;
    currentLang = lang;

    var nodes = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (!original.has(el)) original.set(el, el.textContent);
      var key = el.getAttribute("data-i18n");
      if (!key) continue;
      var text = textFor(lang, key, el);
      if (text !== null && text !== undefined) el.textContent = text;
    }

    // 告诉浏览器和读屏软件当前语言
    document.documentElement.lang = lang;
    document.documentElement.setAttribute("data-lang", lang);

    save(lang);
    if (menu && !menu.hidden) renderMenu();   // 列表开着就同步勾选状态

    // 其他脚本可以监听，比如以后某个页面要跟着换日期格式
    try {
      document.dispatchEvent(new CustomEvent("languagechange", {
        detail: { lang: lang }
      }));
    } catch (e) { /* 老浏览器没有 CustomEvent，忽略 */ }
  }

  /* ---------------- 语言列表 ---------------- */

  function ensureMenu() {
    if (menu) return menu;

    menu = document.createElement("div");
    menu.className = "lang-menu";
    menu.id = "langMenu";
    menu.setAttribute("role", "menu");
    menu.hidden = true;
    document.body.appendChild(menu);

    document.addEventListener("mousedown", function (event) {
      if (!menu || menu.hidden) return;
      if (menu.contains(event.target)) return;
      if (menuOwner && menuOwner.contains(event.target)) return;  // 按钮自己交给 click 处理
      closeMenu(false);
    }, true);

    document.addEventListener("keydown", onMenuKeydown, true);
    global.addEventListener("resize", function () { closeMenu(false); });
    global.addEventListener("scroll", function () { closeMenu(false); }, true);

    return menu;
  }

  // 每次打开都重建，保证勾选状态和语言数量是最新的
  function renderMenu() {
    var m = ensureMenu();
    var label = (translations[currentLang] && translations[currentLang].Language) || "Language";
    m.setAttribute("aria-label", label);
    m.innerHTML = "";

    languages().forEach(function (code) {
      var item = document.createElement("button");
      item.type = "button";
      item.className = "lang-menu__item";
      item.setAttribute("role", "menuitemradio");
      item.setAttribute("data-lang", code);
      item.setAttribute("aria-checked", code === currentLang ? "true" : "false");

      var name = document.createElement("span");
      name.className = "lang-menu__name";
      name.textContent = LANG_NAMES[code] || code;

      var tick = document.createElement("span");
      tick.className = "lang-menu__tick";
      tick.setAttribute("aria-hidden", "true");
      tick.textContent = code === currentLang ? "✓" : "";

      item.appendChild(name);
      item.appendChild(tick);
      item.addEventListener("click", function () {
        setLanguage(code);
        closeMenu(true);
      });
      m.appendChild(item);
    });
  }

  function placeMenu(owner) {
    var rect = owner.getBoundingClientRect();
    var gap = 8;
    var width = menu.offsetWidth;
    var height = menu.offsetHeight;

    // 默认右边缘和按钮右边缘对齐；超出视口就贴边
    var left = rect.right - width;
    left = Math.max(gap, Math.min(left, global.innerWidth - width - gap));

    var top = rect.bottom + gap;
    if (top + height > global.innerHeight - gap) top = Math.max(gap, rect.top - height - gap);

    menu.style.left = Math.round(left) + "px";
    menu.style.top = Math.round(top) + "px";
  }

  function openMenu(owner) {
    renderMenu();
    menuOwner = owner;
    owner.setAttribute("aria-expanded", "true");
    menu.hidden = false;
    menu.style.visibility = "hidden";   // 先占位再量尺寸，避免跳动
    placeMenu(owner);
    menu.style.visibility = "";

    var checked = menu.querySelector('.lang-menu__item[aria-checked="true"]');
    var first = checked || menu.querySelector(".lang-menu__item");
    if (first) first.focus();
  }

  function closeMenu(restoreFocus) {
    if (!menu || menu.hidden) return;
    menu.hidden = true;
    if (menuOwner) {
      menuOwner.setAttribute("aria-expanded", "false");
      if (restoreFocus) menuOwner.focus();
    }
    menuOwner = null;
  }

  function onMenuKeydown(event) {
    if (!menu || menu.hidden) return;

    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu(true);
      return;
    }
    if (event.key === "Tab") {          // 让 Tab 正常离开，顺手收起
      closeMenu(false);
      return;
    }

    var items = menu.querySelectorAll(".lang-menu__item");
    if (!items.length) return;

    var index = Array.prototype.indexOf.call(items, document.activeElement);
    var next = -1;
    if (event.key === "ArrowDown") next = index < 0 ? 0 : (index + 1) % items.length;
    else if (event.key === "ArrowUp") next = index < 0 ? items.length - 1 : (index - 1 + items.length) % items.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = items.length - 1;

    if (next >= 0) {
      event.preventDefault();
      items[next].focus();
    }
  }

  // 绑定切换按钮（可多处绑定，重复调用无副作用）
  function bindSwitchers() {
    var buttons = document.querySelectorAll("#langSwitch, [data-lang-switch]");
    for (var i = 0; i < buttons.length; i++) {
      var btn = buttons[i];
      if (btn.getAttribute("data-i18n-bound") === "1") continue;
      btn.setAttribute("data-i18n-bound", "1");
      if (btn.tagName === "BUTTON") btn.setAttribute("type", "button");
      btn.setAttribute("aria-haspopup", "menu");
      btn.setAttribute("aria-expanded", "false");
      btn.setAttribute("aria-controls", "langMenu");
      btn.addEventListener("click", function (event) {
        event.stopPropagation();
        if (menu && !menu.hidden) closeMenu(true);
        else openMenu(this);
      });
    }
  }

  // 对外接口
  var api = {
    translations: translations,
    languages: languages,
    getName: function (code) { return LANG_NAMES[code] || code; },
    get current() { return currentLang; },
    setLanguage: setLanguage,
    open: function () {
      var btn = document.querySelector("#langSwitch, [data-lang-switch]");
      if (btn) openMenu(btn);
    },
    close: function () { closeMenu(false); }
  };

  // 兼容旧名字：原来 index.html 写的是 `import { translations }`，lang.js 导出的是 `lang`
  global.translations = translations;
  global.lang = translations;
  global.PerspectivesI18N = api;

  // 立即执行一次（此刻已经解析到的元素先换掉，避免闪烁）
  setLanguage(readSaved());
  bindSwitchers();

  // 文档还没解析完的话，解析完再补一次（页脚、主体里的元素这时才存在）
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      setLanguage(currentLang);
      bindSwitchers();
    });
  }
})(window);
