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
    ["received", "Received"], ["reviewing", "In review"], ["revise", "Changes requested"], ["accepted", "Accepted"],
    ["published", "Published"], ["declined", "Declined"], ["uploading", "Upload unfinished"]
  ];
  var STATUS_NAME = {}; STATUS.forEach(function (s) { STATUS_NAME[s[0]] = s[1]; });
  var KIND = { writing: "Writing", art: "Art", photo: "Photography", other: "Other" };
  var ROLES = [["reader", "Reader"], ["writer", "Writer"], ["editor", "Editor"], ["admin", "Admin"]];
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
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) + " " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  }
  function size(n) { return n >= 1048576 ? (n / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(n / 1024)) + " KB"; }
  // Supabase's own messages, made plainer.
  function authError(err) {
    var m = String(err && err.message || err);
    if (/not confirmed/i.test(m)) return "Your email is not confirmed yet. Open the link we emailed you, then sign in.";
    if (/invalid login/i.test(m)) return "Wrong email or password.";
    if (/already registered/i.test(m)) return "This email already has an account. Sign in instead.";
    if (/rate limit/i.test(m)) return "Too many emails sent just now. Wait a few minutes and try again.";
    if (/password/i.test(m) && /least/i.test(m)) return "The password needs at least 8 characters.";
    return m;
  }
  function errorBox(msg) { return el("p", { class: "r-error", role: "alert", text: msg }); }

  /* ---------------- sign in / sign up ---------------- */

  function authView(mode, note) {
    var signup = mode === "signup";
    var msg = el("p", { class: "r-error", role: "alert" });
    var form = el("form", { class: "r-auth" }, [
      el("h1", { text: signup ? "Create an account" : "Sign in" }),
      note ? el("p", { class: "r-note", text: note }) : null,
      signup ? el("label", { for: "a-name", text: "Username" }) : null,
      signup ? el("input", { id: "a-name", maxlength: "40", autocomplete: "nickname" }) : null,
      el("label", { for: "a-email", text: "Email" }),
      el("input", { id: "a-email", type: "email", required: true, autocomplete: "email" }),
      el("label", { for: "a-pass", text: "Password" + (signup ? " (at least 8 characters)" : "") }),
      el("input", { id: "a-pass", type: "password", required: true, minlength: signup ? "8" : false, autocomplete: signup ? "new-password" : "current-password" }),
      msg,
      el("button", { type: "submit", class: "r-btn", text: signup ? "Create account" : "Sign in" }),
      el("button", { type: "button", class: "r-link", text: signup ? "Already have an account? Sign in" : "No account yet? Create one", on: { click: function () { authView(signup ? "signin" : "signup"); } } })
    ]);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = document.getElementById("a-email").value.trim();
      var pass = document.getElementById("a-pass").value;
      var btn = form.querySelector(".r-btn"); btn.disabled = true;
      var done = function (res) {
        btn.disabled = false;
        if (res.error) { msg.textContent = authError(res.error); return; }
        if (signup && !res.data.session) authView("signin", "Account created. Open the confirmation link we emailed you, then come back and sign in.");
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
      el("button", { type: "button", class: "r-link", text: "Sign out", on: { click: function () { sb.auth.signOut().then(function () { authView("signin"); }); } } })
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
    var items = [["active", "All", all]].concat(STATUS.map(function (s) { return [s[0], s[1], count(s[0])]; }));
    return el("nav", { class: "r-tabs", "aria-label": "Filter by status" }, items.map(function (it) {
      return el("button", {
        type: "button", class: "r-tab" + (state.filter === it[0] ? " is-on" : ""), "aria-pressed": String(state.filter === it[0]),
        on: { click: function () { state.filter = it[0]; state.open = null; render(); } }
      }, [it[1] + " ", el("b", { text: String(it[2]) })]);
    }));
  }

  function list() {
    var rows = visible();
    if (!rows.length) return el("p", { class: "r-muted", text: "No submissions here yet." });
    return el("div", { class: "r-tablewrap" }, [el("table", { class: "r-table" }, [
      el("thead", {}, [el("tr", {}, ["Sent", "Title", "Type", "By", "Status"].map(function (h) { return el("th", { text: h }); }))]),
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
    var box = el("section", { class: "r-detail", "aria-label": "Submission details" }, [el("h2", { text: s.title })]);
    var dl = el("dl", { class: "r-fields" });
    [["By", s.name], ["Email", s.email], ["Other contact", s.contact || "—"], ["Type", KIND[s.kind] || s.kind],
     ["Sent", when(s.created_at)], ["Account", s.user_id ? "Signed in" : "No account"], ["Note", s.note || "—"]]
      .forEach(function (f) { dl.appendChild(el("dt", { text: f[0] })); dl.appendChild(el("dd", { text: f[1] })); });
    box.appendChild(dl);

    var files = el("ul", { class: "r-files" }, [el("li", { class: "r-muted", text: "Loading files…" })]);
    box.appendChild(el("h3", { text: "Files" }));
    box.appendChild(files);
    sb.from("submission_files").select("path,name,size,type").eq("submission_id", s.id).order("path").then(function (res) {
      if (res.error) { files.replaceChildren(errorBox(res.error.message)); return; }
      files.replaceChildren.apply(files, res.data.map(function (f) {
        var btn = el("button", { type: "button", class: "r-btn r-btn--small", text: "Download" });
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
      if (!res.data.length) files.replaceChildren(el("li", { class: "r-muted", text: "No files." }));
    });

    var sel = el("select", { id: "r-status" }, STATUS.map(function (st) { return el("option", { value: st[0], selected: st[0] === s.status, text: st[1] }); }));
    var saved = el("span", { class: "r-muted", role: "status" });
    var save = el("button", { type: "button", class: "r-btn", text: "Save status" });
    save.addEventListener("click", function () {
      save.disabled = true; saved.textContent = "";
      sb.from("submissions").update({ status: sel.value }).eq("id", s.id).select("status").then(function (res) {
        save.disabled = false;
        if (res.error || !res.data.length) { saved.textContent = "Not saved: " + (res.error ? res.error.message : "no permission"); return; }
        s.status = res.data[0].status; saved.textContent = "Saved";
        render();
      });
    });
    box.appendChild(el("div", { class: "r-statusrow" }, [el("label", { for: "r-status", text: "Status" }), sel, save, saved]));
    box.appendChild(el("p", { class: "r-note", text: "Changing the status does not notify the author; they see it when they open their progress link. Email them if something needs explaining." }));
    return box;
  }
  function alertIn(node, msg) { node.appendChild(el("li", {}, [errorBox(msg)])); }

  function members() {
    var box = el("section", { class: "r-members" }, [el("h2", { text: "People and roles" }), el("p", { class: "r-muted", text: "Loading…" })]);
    sb.from("profiles").select("id,email,username,role,created_at").order("created_at").then(function (res) {
      if (res.error) { box.replaceChildren(el("h2", { text: "People and roles" }), errorBox(res.error.message)); return; }
      var table = el("table", { class: "r-table" }, [
        el("thead", {}, [el("tr", {}, ["Email", "Username", "Joined", "Role"].map(function (h) { return el("th", { text: h }); }))]),
        el("tbody", {}, res.data.map(function (p) {
          var sel = el("select", { "aria-label": "Role for " + (p.email || p.id) }, ROLES.map(function (r) { return el("option", { value: r[0], selected: r[0] === p.role, text: r[1] }); }));
          var note = el("span", { class: "r-muted" });
          sel.addEventListener("change", function () {
            sel.disabled = true;
            sb.rpc("set_role", { target: p.id, new_role: sel.value }).then(function (r) {
              sel.disabled = false;
              if (r.error) { note.textContent = r.error.message; sel.value = p.role; } else { p.role = sel.value; note.textContent = "Changed"; }
            });
          });
          return el("tr", {}, [el("td", { text: p.email || "—" }), el("td", { text: p.username || "—" }), el("td", { class: "r-nowrap", text: when(p.created_at) }), el("td", {}, [sel, " ", note])]);
        }))
      ]);
      box.replaceChildren(el("h2", { text: "People and roles" }),
        el("p", { class: "r-muted", text: "Everyone starts as a reader. Editors see submissions, change their status and download the files; admins can also change roles." }),
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
        el("h1", { text: "Submissions" }),
        el("span", { class: "r-muted", text: fresh ? fresh + " waiting for review" : "Nothing waiting for review" }),
        el("button", { type: "button", class: "r-btn r-btn--ghost", text: "Refresh", on: { click: function () { load().then(render, fail); } } })
      ]),
      tabs(),
      el("div", { class: "r-split" }, [list(), open ? detail(open) : null]),
      state.role === "admin" ? members() : null
    );
  }

  function fail(err) { app.replaceChildren(errorBox("Something went wrong: " + (err && err.message ? err.message : err))); }

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
            el("h1", { text: "No review access yet" }),
            el("p", { text: "Your account (" + user.email + ") is a reader. Ask an admin to make you an editor." })
          ]));
          return;
        }
        return load().then(render);
      });
    }).catch(fail);
  }

  boot();
})();
