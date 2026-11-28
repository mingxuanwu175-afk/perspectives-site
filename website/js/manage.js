/* Perspectives admin console (manage.html): people and roles.
 *
 * Only admins get here. Signs in with Supabase Auth in the browser and reads
 * profiles with the public key; row level security is what actually decides
 * whether the rows come back. Changing a role goes through the set_role RPC,
 * which is admin-only on the database side too.
 *
 * 界面文案跟随站内语言（lang.js）：字典键以 mg. 开头，这里合并进
 * PerspectivesI18N.translations，切换语言时整页重绘。
 */
(function () {
  "use strict";

  var SUPABASE_URL = "https://itnylaavtwmhvzepmxrt.supabase.co";
  var SUPABASE_KEY = "sb_publishable_zrfDWNTiHJSEdaK4lxlo3Q_3vz08ZR_"; // public by design
  var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  var I18N = window.PerspectivesI18N;
  var LOCALES = { en: "en-GB", zh: "zh-CN", ja: "ja-JP", ko: "ko-KR" };

  var STRINGS = {
    en: {
      "mg.title": "Manage | Perspectives",
      "mg.heading": "People and roles",
      "mg.hint": "Everyone starts as a reader. Editors see submissions, change their status and download the files; admins can also change roles.",
      "mg.colEmail": "Email",
      "mg.colUsername": "Username",
      "mg.colJoined": "Joined",
      "mg.colRole": "Role",
      "mg.search": "Search by username or email",
      "mg.matches": "{n} of {total}",
      "mg.noMatch": "No member matches that search.",
      "mg.changed": "Changed",
      "mg.roleFor": "Role for {email}",
      "mg.signOut": "Sign out",
      "mg.loading": "Loading…",
      "mg.error": "Something went wrong: {msg}",
      "mg.role.reader": "Reader",
      "mg.role.writer": "Writer",
      "mg.role.editor": "Editor",
      "mg.role.admin": "Admin"
    },
    zh: {
      "mg.title": "管理 | Perspectives",
      "mg.heading": "成员与角色",
      "mg.hint": "每个人默认都是读者。编辑可以查看投稿、修改状态并下载文件；管理员还可以调整角色。",
      "mg.colEmail": "邮箱",
      "mg.colUsername": "用户名",
      "mg.colJoined": "加入时间",
      "mg.colRole": "角色",
      "mg.search": "搜索用户名或邮箱",
      "mg.matches": "{n} / 共 {total} 人",
      "mg.noMatch": "没有匹配的成员。",
      "mg.changed": "已更新",
      "mg.roleFor": "{email} 的角色",
      "mg.signOut": "退出登录",
      "mg.loading": "加载中…",
      "mg.error": "出错了：{msg}",
      "mg.role.reader": "读者",
      "mg.role.writer": "作者",
      "mg.role.editor": "编辑",
      "mg.role.admin": "管理员"
    },
    ja: {
      "mg.title": "管理 | Perspectives",
      "mg.heading": "メンバーと役割",
      "mg.hint": "全員が最初は読者です。編集者は投稿の閲覧・ステータス変更・ファイルのダウンロードができ、管理者は役割も変更できます。",
      "mg.colEmail": "メールアドレス",
      "mg.colUsername": "ユーザー名",
      "mg.colJoined": "参加日",
      "mg.colRole": "役割",
      "mg.search": "ユーザー名またはメールで検索",
      "mg.matches": "{n} / {total} 人",
      "mg.noMatch": "該当するメンバーはいません。",
      "mg.changed": "変更しました",
      "mg.roleFor": "{email} の役割",
      "mg.signOut": "ログアウト",
      "mg.loading": "読み込み中…",
      "mg.error": "エラーが発生しました：{msg}",
      "mg.role.reader": "読者",
      "mg.role.writer": "投稿者",
      "mg.role.editor": "編集者",
      "mg.role.admin": "管理者"
    },
    ko: {
      "mg.title": "관리 | Perspectives",
      "mg.heading": "멤버와 역할",
      "mg.hint": "모든 사용자는 독자로 시작합니다. 편집자는 투고를 보고 상태를 바꾸며 파일을 내려받을 수 있고, 관리자는 역할도 바꿀 수 있습니다.",
      "mg.colEmail": "이메일",
      "mg.colUsername": "사용자 이름",
      "mg.colJoined": "가입일",
      "mg.colRole": "역할",
      "mg.search": "사용자 이름 또는 이메일 검색",
      "mg.matches": "{n} / 전체 {total}명",
      "mg.noMatch": "일치하는 멤버가 없습니다.",
      "mg.changed": "변경됨",
      "mg.roleFor": "{email}의 역할",
      "mg.signOut": "로그아웃",
      "mg.loading": "불러오는 중…",
      "mg.error": "문제가 발생했습니다: {msg}",
      "mg.role.reader": "독자",
      "mg.role.writer": "작성자",
      "mg.role.editor": "편집자",
      "mg.role.admin": "관리자"
    }
  };

  (function mergeStrings() {
    if (!I18N || !I18N.translations) return;
    Object.keys(STRINGS).forEach(function (lang) {
      var dict = I18N.translations[lang] || (I18N.translations[lang] = {});
      Object.keys(STRINGS[lang]).forEach(function (key) {
        if (!Object.prototype.hasOwnProperty.call(dict, key)) dict[key] = STRINGS[lang][key];
      });
    });
  })();

  function lang() { return (I18N && I18N.current) || "en"; }

  function t(key, vars) {
    var all = (I18N && I18N.translations) || {};
    var dict = all[lang()] || {};
    var fallback = all.en || STRINGS.en;
    var text = Object.prototype.hasOwnProperty.call(dict, key) ? dict[key]
      : (Object.prototype.hasOwnProperty.call(fallback, key) ? fallback[key] : (STRINGS.en[key] || key));
    if (vars) {
      text = String(text).replace(/\{(\w+)\}/g, function (m, name) {
        return vars[name] != null ? vars[name] : m;
      });
    }
    return text;
  }

  var ROLE_CODES = ["reader", "writer", "editor", "admin"];

  function roleName(code) { return t("mg.role." + code); }

  var app = document.getElementById("app");
  var meEl = document.getElementById("me");
  var state = { user: null, role: null, people: null, query: "" };

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "text") n.textContent = attrs[k];
      else if (k === "on") Object.keys(attrs.on).forEach(function (ev) { n.addEventListener(ev, attrs.on[ev]); });
      else if (attrs[k] !== false && attrs[k] != null) n.setAttribute(k, attrs[k] === true ? "" : attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return n;
  }

  function when(iso) {
    var d = new Date(iso);
    var locale = LOCALES[lang()] || "en-GB";
    return d.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" }) + " " +
      d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  }

  function errorBox(msg) {
    return el("p", { class: "r-error", role: "alert", text: msg });
  }

  function fold(value) {
    var s = String(value || "");
    if (s.normalize) s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return s.toLowerCase();
  }

  /* ---------------- header line (email · role, sign out) ---------------- */

  function header() {
    meEl.replaceChildren(
      el("span", { text: (state.user.email || "") + " · " + roleName(state.role) }),
      el("button", { type: "button", class: "r-link", text: t("mg.signOut"), on: { click: function () {
        sb.auth.signOut().then(function () {
          if (window.PerspectivesAuthNav) window.PerspectivesAuthNav.refresh();
          window.location.replace("index.html");
        });
      } } })
    );
  }

  /* ---------------- people and roles ---------------- */

  function memberRow(p) {
    var sel = el("select", { "aria-label": t("mg.roleFor", { email: p.email || p.id }) }, ROLE_CODES.map(function (code) {
      return el("option", { value: code, selected: code === p.role, text: roleName(code) });
    }));
    var note = el("span", { class: "r-muted" });
    sel.addEventListener("change", function () {
      sel.disabled = true;
      sb.rpc("set_role", { target: p.id, new_role: sel.value }).then(function (r) {
        sel.disabled = false;
        if (r.error) { note.textContent = r.error.message; sel.value = p.role; }
        else { p.role = sel.value; note.textContent = t("mg.changed"); }
      });
    });
    return el("tr", {}, [
      el("td", { text: p.email || "—" }),
      el("td", { text: p.username || "—" }),
      el("td", { class: "r-nowrap", text: when(p.created_at) }),
      el("td", {}, [sel, " ", note])
    ]);
  }

  function rolesView() {
    var people = state.people || [];
    var tbody = el("tbody");
    var count = el("span", { class: "r-muted", "aria-live": "polite" });
    var search = el("input", {
      type: "search", id: "m-member-search", class: "r-search",
      placeholder: t("mg.search"), "aria-label": t("mg.search"),
      autocomplete: "off", spellcheck: "false"
    });
    search.value = state.query;

    function paint() {
      state.query = search.value;
      if (!people.length) {
        tbody.replaceChildren(el("tr", {}, [el("td", { colspan: "4", class: "r-muted", text: "—" })]));
        count.textContent = "";
        return;
      }
      var q = fold(state.query.trim());
      var hits = !q ? people : people.filter(function (p) {
        return fold(p.username).indexOf(q) >= 0 || fold(p.email).indexOf(q) >= 0;
      });
      tbody.replaceChildren.apply(tbody, hits.length
        ? hits.map(memberRow)
        : [el("tr", {}, [el("td", { colspan: "4", class: "r-muted", text: t("mg.noMatch") })])]);
      count.textContent = q ? t("mg.matches", { n: hits.length, total: people.length }) : "";
    }

    search.addEventListener("input", paint);

    var table = el("table", { class: "r-table" }, [
      el("thead", {}, [el("tr", {}, [t("mg.colEmail"), t("mg.colUsername"), t("mg.colJoined"), t("mg.colRole")].map(function (h) {
        return el("th", { text: h });
      }))]),
      tbody
    ]);

    paint();
    return el("section", { class: "r-members" }, [
      el("h1", { text: t("mg.heading") }),
      el("p", { class: "r-muted", text: t("mg.hint") }),
      el("div", { class: "r-members-tools" }, [search, count]),
      el("div", { class: "r-tablewrap" }, [table])
    ]);
  }

  function render() {
    header();
    app.replaceChildren(rolesView());
  }

  function fail(err) {
    meEl.replaceChildren();
    app.replaceChildren(errorBox(t("mg.error", { msg: err && err.message ? err.message : String(err) })));
  }

  function boot() {
    sb.auth.getUser().then(function (res) {
      var user = res.data && res.data.user;
      if (!user) {
        // Manage is an admin tool; send signed-out visitors through the account
        // page so they come back here after signing in.
        window.location.replace("account.html?next=manage.html");
        return;
      }
      state.user = user;
      if (window.PerspectivesAuthNav) window.PerspectivesAuthNav.refresh();
      return sb.from("profiles").select("role").eq("id", user.id).maybeSingle().then(function (p) {
        if (p.error) { fail(p.error); return; }
        state.role = p.data ? p.data.role : "reader";
        if (state.role !== "admin") { window.location.replace("index.html"); return; }
        try {
          localStorage.setItem("perspectives:nav-role", JSON.stringify({ id: user.id, role: state.role }));
        } catch (e) { /* storage blocked */ }
        return sb.from("profiles").select("id,email,username,role,created_at").order("created_at").then(function (res) {
          if (res.error) { fail(res.error); return; }
          state.people = res.data || [];
          render();
        });
      });
    }).catch(fail);
  }

  /* 语言切换：整页重绘，搜索框中已输入的内容保留 */
  document.addEventListener("languagechange", function () {
    if (state.people) render();
  });

  if (I18N && I18N.setLanguage) I18N.setLanguage(I18N.current || "en");

  boot();
})();
