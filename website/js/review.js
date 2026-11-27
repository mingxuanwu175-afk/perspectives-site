/* Perspectives review dashboard (review.html), for editors and admins.
 *
 * Signs in with Supabase Auth in the browser and reads the tables directly
 * with the public key. Row level security decides what comes back: only
 * profiles with role editor or admin see submissions, can change their status
 * and download the originals; only admins can change people's roles.
 */
(function () {
  "use strict";

  var SUPABASE_URL = "https://itnylaavtwmhvzepmxrt.supabase.co";
  var SUPABASE_KEY = "sb_publishable_zrfDWNTiHJSEdaK4lxlo3Q_3vz08ZR_"; // public by design
  var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  var STATUS = [
    ["received", "已收到"], ["reviewing", "审阅中"], ["revise", "需修改"], ["accepted", "已录用"],
    ["published", "已发表"], ["declined", "未入选"], ["uploading", "上传未完成"]
  ];
  var STATUS_NAME = {}; STATUS.forEach(function (s) { STATUS_NAME[s[0]] = s[1]; });
  var KIND = { writing: "文字", art: "绘画", photo: "摄影", other: "其他" };
  var ROLES = [["reader", "读者"], ["writer", "作者"], ["editor", "编辑"], ["admin", "管理员"]];
  var COLS = "id,created_at,name,email,contact,title,kind,note,status,user_id";

  var app = document.getElementById("app");
  var meEl = document.getElementById("me");
  var state = { user: null, role: null, filter: "active", subs: [], open: null };

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
    return d.toLocaleDateString("zh-CN") + " " + d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  }
  function size(n) { return n >= 1048576 ? (n / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(n / 1024)) + " KB"; }
  function errorBox(msg) { return el("p", { class: "r-error", role: "alert", text: msg }); }

  /* ---------------- sign in / sign up ---------------- */

  function authView(mode, note) {
    var signup = mode === "signup";
    var msg = el("p", { class: "r-error", role: "alert" });
    var form = el("form", { class: "r-auth" }, [
      el("h1", { text: signup ? "注册账号" : "登录" }),
      note ? el("p", { class: "r-note", text: note }) : null,
      signup ? el("label", { for: "a-name", text: "用户名" }) : null,
      signup ? el("input", { id: "a-name", maxlength: "40", autocomplete: "nickname" }) : null,
      el("label", { for: "a-email", text: "邮箱" }),
      el("input", { id: "a-email", type: "email", required: true, autocomplete: "email" }),
      el("label", { for: "a-pass", text: "密码" + (signup ? "（至少 8 位）" : "") }),
      el("input", { id: "a-pass", type: "password", required: true, minlength: signup ? "8" : false, autocomplete: signup ? "new-password" : "current-password" }),
      msg,
      el("button", { type: "submit", class: "r-btn", text: signup ? "注册" : "登录" }),
      el("button", { type: "button", class: "r-link", text: signup ? "已有账号？去登录" : "还没有账号？注册", on: { click: function () { authView(signup ? "signin" : "signup"); } } })
    ]);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = document.getElementById("a-email").value.trim();
      var pass = document.getElementById("a-pass").value;
      var btn = form.querySelector(".r-btn"); btn.disabled = true;
      var done = function (res) {
        btn.disabled = false;
        if (res.error) { msg.textContent = res.error.message; return; }
        if (signup && !res.data.session) authView("signin", "注册成功。请打开邮箱里的验证链接，验证后回来登录。");
        else boot();
      };
      if (signup) {
        sb.auth.signUp({ email: email, password: pass, options: {
          data: { username: document.getElementById("a-name").value.trim() },
          emailRedirectTo: location.origin + location.pathname
        } }).then(done);
      } else {
        sb.auth.signInWithPassword({ email: email, password: pass }).then(done);
      }
    });
    meEl.replaceChildren();
    app.replaceChildren(form);
  }

  /* ---------------- dashboard ---------------- */

  function header() {
    meEl.replaceChildren(
      el("span", { text: (state.user.email || "") + " · " + (ROLES.filter(function (r) { return r[0] === state.role; })[0] || ["", state.role])[1] }),
      el("button", { type: "button", class: "r-link", text: "退出", on: { click: function () { sb.auth.signOut().then(function () { authView("signin"); }); } } })
    );
  }

  function load() {
    return sb.from("submissions").select(COLS).order("created_at", { ascending: false }).limit(500).then(function (res) {
      if (res.error) throw res.error;
      state.subs = res.data;
    });
  }

  function visible() {
    if (state.filter === "active") return state.subs.filter(function (s) { return s.status !== "uploading"; });
    return state.subs.filter(function (s) { return s.status === state.filter; });
  }

  function tabs() {
    var count = function (st) { return state.subs.filter(function (s) { return s.status === st; }).length; };
    var all = state.subs.filter(function (s) { return s.status !== "uploading"; }).length;
    var items = [["active", "全部", all]].concat(STATUS.map(function (s) { return [s[0], s[1], count(s[0])]; }));
    return el("nav", { class: "r-tabs", "aria-label": "按状态筛选" }, items.map(function (it) {
      return el("button", {
        type: "button", class: "r-tab" + (state.filter === it[0] ? " is-on" : ""), "aria-pressed": String(state.filter === it[0]),
        on: { click: function () { state.filter = it[0]; state.open = null; render(); } }
      }, [it[1] + " ", el("b", { text: String(it[2]) })]);
    }));
  }

  function list() {
    var rows = visible();
    if (!rows.length) return el("p", { class: "r-muted", text: "这里还没有投稿。" });
    return el("div", { class: "r-tablewrap" }, [el("table", { class: "r-table" }, [
      el("thead", {}, [el("tr", {}, ["时间", "标题", "类型", "署名", "状态"].map(function (h) { return el("th", { text: h }); }))]),
      el("tbody", {}, rows.map(function (s) {
        var tr = el("tr", { class: state.open === s.id ? "is-open" : "", tabindex: "0", on: {
          click: function () { state.open = state.open === s.id ? null : s.id; render(); },
          keydown: function (e) { if (e.key === "Enter") { state.open = state.open === s.id ? null : s.id; render(); } }
        } }, [
          el("td", { class: "r-nowrap", text: when(s.created_at) }),
          el("td", { class: "r-title", text: s.title }),
          el("td", { text: KIND[s.kind] || s.kind }),
          el("td", { text: s.name }),
          el("td", {}, [el("span", { class: "r-pill r-pill--" + s.status, text: STATUS_NAME[s.status] || s.status })])
        ]);
        return tr;
      }))
    ])]);
  }

  function detail(s) {
    var box = el("section", { class: "r-detail", "aria-label": "投稿详情" }, [el("h2", { text: s.title })]);
    var dl = el("dl", { class: "r-fields" });
    [["署名", s.name], ["邮箱", s.email], ["其他联系方式", s.contact || "—"], ["类型", KIND[s.kind] || s.kind],
     ["提交时间", when(s.created_at)], ["账号", s.user_id ? "已登录用户投稿" : "未登录投稿"], ["备注", s.note || "—"]]
      .forEach(function (f) { dl.appendChild(el("dt", { text: f[0] })); dl.appendChild(el("dd", { text: f[1] })); });
    box.appendChild(dl);

    var files = el("ul", { class: "r-files" }, [el("li", { class: "r-muted", text: "读取文件……" })]);
    box.appendChild(el("h3", { text: "文件" }));
    box.appendChild(files);
    sb.from("submission_files").select("path,name,size,type").eq("submission_id", s.id).order("path").then(function (res) {
      if (res.error) { files.replaceChildren(errorBox(res.error.message)); return; }
      files.replaceChildren.apply(files, res.data.map(function (f) {
        var btn = el("button", { type: "button", class: "r-btn r-btn--small", text: "下载" });
        btn.addEventListener("click", function () {
          btn.disabled = true;
          sb.storage.from("submissions").createSignedUrl(f.path, 300, { download: f.name }).then(function (r) {
            btn.disabled = false;
            if (r.error) { alertIn(files, r.error.message); return; }
            location.href = r.data.signedUrl;
          });
        });
        return el("li", {}, [el("span", { class: "r-fname", text: f.name }), el("span", { class: "r-muted", text: size(f.size) }), btn]);
      }));
      if (!res.data.length) files.replaceChildren(el("li", { class: "r-muted", text: "没有文件。" }));
    });

    var sel = el("select", { id: "r-status" }, STATUS.map(function (st) { return el("option", { value: st[0], selected: st[0] === s.status, text: st[1] }); }));
    var saved = el("span", { class: "r-muted", role: "status" });
    var save = el("button", { type: "button", class: "r-btn", text: "保存状态" });
    save.addEventListener("click", function () {
      save.disabled = true; saved.textContent = "";
      sb.from("submissions").update({ status: sel.value }).eq("id", s.id).select("status").then(function (res) {
        save.disabled = false;
        if (res.error || !res.data.length) { saved.textContent = "没保存成功：" + (res.error ? res.error.message : "没有权限"); return; }
        s.status = res.data[0].status; saved.textContent = "已保存";
        render();
      });
    });
    box.appendChild(el("div", { class: "r-statusrow" }, [el("label", { for: "r-status", text: "状态" }), sel, save, saved]));
    box.appendChild(el("p", { class: "r-note", text: "改状态不会自动通知投稿人；投稿人打开进度链接时能看到新状态。需要说明的话请发邮件给对方。" }));
    return box;
  }
  function alertIn(node, msg) { node.appendChild(el("li", {}, [errorBox(msg)])); }

  function members() {
    var box = el("section", { class: "r-members" }, [el("h2", { text: "成员和角色" }), el("p", { class: "r-muted", text: "读取中……" })]);
    sb.from("profiles").select("id,email,username,role,created_at").order("created_at").then(function (res) {
      if (res.error) { box.replaceChildren(el("h2", { text: "成员和角色" }), errorBox(res.error.message)); return; }
      var table = el("table", { class: "r-table" }, [
        el("thead", {}, [el("tr", {}, ["邮箱", "用户名", "注册时间", "角色"].map(function (h) { return el("th", { text: h }); }))]),
        el("tbody", {}, res.data.map(function (p) {
          var sel = el("select", { "aria-label": "角色：" + (p.email || p.id) }, ROLES.map(function (r) { return el("option", { value: r[0], selected: r[0] === p.role, text: r[1] }); }));
          var note = el("span", { class: "r-muted" });
          sel.addEventListener("change", function () {
            sel.disabled = true;
            sb.rpc("set_role", { target: p.id, new_role: sel.value }).then(function (r) {
              sel.disabled = false;
              if (r.error) { note.textContent = r.error.message; sel.value = p.role; } else { p.role = sel.value; note.textContent = "已改"; }
            });
          });
          return el("tr", {}, [el("td", { text: p.email || "—" }), el("td", { text: p.username || "—" }), el("td", { class: "r-nowrap", text: when(p.created_at) }), el("td", {}, [sel, " ", note])]);
        }))
      ]);
      box.replaceChildren(el("h2", { text: "成员和角色" }),
        el("p", { class: "r-muted", text: "新注册的人都是读者。编辑能看投稿、改状态、下载原件；管理员另外能改角色。" }),
        el("div", { class: "r-tablewrap" }, [table]));
    });
    return box;
  }

  function render() {
    header();
    var open = state.subs.filter(function (s) { return s.id === state.open; })[0];
    var fresh = state.subs.filter(function (s) { return s.status === "received"; }).length;
    app.replaceChildren(
      el("div", { class: "r-head" }, [
        el("h1", { text: "投稿" }),
        el("span", { class: "r-muted", text: fresh ? fresh + " 篇等待审阅" : "没有待审阅的投稿" }),
        el("button", { type: "button", class: "r-btn r-btn--ghost", text: "刷新", on: { click: function () { load().then(render, fail); } } })
      ]),
      tabs(),
      el("div", { class: "r-split" }, [list(), open ? detail(open) : null]),
      state.role === "admin" ? members() : null
    );
  }

  function fail(err) { app.replaceChildren(errorBox("出错了：" + (err && err.message ? err.message : err))); }

  function boot() {
    sb.auth.getUser().then(function (res) {
      var user = res.data && res.data.user;
      if (!user) { authView("signin"); return; }
      state.user = user;
      return sb.from("profiles").select("role").eq("id", user.id).maybeSingle().then(function (p) {
        state.role = p.data ? p.data.role : "reader";
        if (state.role !== "editor" && state.role !== "admin") {
          header();
          app.replaceChildren(el("div", { class: "r-auth" }, [
            el("h1", { text: "还没有审稿权限" }),
            el("p", { text: "你的账号（" + user.email + "）现在是读者。请让管理员把你设成编辑。" })
          ]));
          return;
        }
        return load().then(render);
      });
    }).catch(fail);
  }

  boot();
})();
