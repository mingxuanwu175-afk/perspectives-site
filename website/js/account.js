/* Perspectives: account.html. Sign in, create an account, sign out, reset a
 * password, and see your own submissions. Supabase Auth in the browser with
 * the public key; row level security means a signed-in person only ever gets
 * their own submissions back.
 *
 * Two ways in: email + password, or a one-time sign-in link by email (no
 * password). Both lead to the same account.
 */
(function () {
  "use strict";

  var sb = window.supabase.createClient(
    "https://itnylaavtwmhvzepmxrt.supabase.co",
    "sb_publishable_zrfDWNTiHJSEdaK4lxlo3Q_3vz08ZR_" // public by design
  );
  var HERE = location.origin + location.pathname;
  // A page that needs a signed-in reader (contribution.html) sends
  // ?next=contribution.html, so sign-in can hand the reader straight back.
  // Only a local page name is accepted: no absolute URL, no "//", no "..".
  var NEXT = (function () {
    var v = new URLSearchParams(location.search).get("next") || "";
    return /^[A-Za-z0-9._-]+\.html(\?[^#]*)?$/.test(v) ? v : "";
  })();


  var WORDS = {
    en: {
      "page.account": "Account | Perspectives",
      "ac.signin": "Sign in", "ac.signup": "Create an account", "ac.reset": "Choose a new password",
      "ac.email": "Email", "ac.password": "Password", "ac.newPassword": "New password (8+ characters)",
      "ac.username": "Name or pen name", "ac.signinBtn": "Sign in", "ac.signupBtn": "Create account", "ac.saveBtn": "Save",
      "ac.tabSignup": "Register", "ac.tabSignin": "Sign in",
      "ac.link": "Email me a sign-in link instead (no password)", "ac.forgot": "Forgot your password?",
      "ac.linkSent": "Check your email: we sent you a sign-in link. Open it on this device.",
      "ac.resetSent": "Check your email: we sent you a link to choose a new password.",
      "ac.created": "Account created. Open the confirmation link we emailed you, then sign in.",
      "ac.toSubmit": "Sign in to submit your work. After signing in you will land back on the submission form.",
      "ac.toManage": "Sign in to manage people and roles. After signing in you will land back on the management page.",
      "ac.needEmail": "Please give your email address.",
      "ac.hello": "Hello", "ac.mine": "My submissions", "ac.none": "You have not submitted anything with this account yet.",
      "ac.submit": "Submit your work", "ac.review": "Open the review dashboard", "ac.signout": "Sign out",
      "ac.nameLabel": "Name shown to the editors", "ac.saved": "Saved", "ac.passwordSaved": "Password changed. You are signed in.",
      "ac.err.confirm": "Your email is not confirmed yet. Open the link we emailed you, then sign in.",
      "ac.err.login": "Wrong email or password.",
      "ac.err.exists": "This email already has an account. Sign in instead.",
      "ac.err.rate": "Too many emails sent just now. Wait a few minutes and try again.",
      "ac.err.short": "The password needs at least 8 characters.",
      "ac.err.other": "Something went wrong. Please try again."
    },
    zh: {
      "page.account": "账号 | Perspectives",
      "ac.signin": "登录", "ac.signup": "注册账号", "ac.reset": "设置新密码",
      "ac.email": "邮箱", "ac.password": "密码", "ac.newPassword": "新密码（至少 8 位）",
      "ac.username": "姓名或笔名", "ac.signinBtn": "登录", "ac.signupBtn": "注册", "ac.saveBtn": "保存",
      "ac.tabSignup": "注册", "ac.tabSignin": "登录",
      "ac.link": "改用邮箱登录链接（不用密码）", "ac.forgot": "忘记密码？",
      "ac.linkSent": "请查看邮箱：登录链接已发出，在这台设备上打开。",
      "ac.resetSent": "请查看邮箱：设置新密码的链接已发出。",
      "ac.created": "账号已建好。请打开邮箱里的验证链接，然后回来登录。",
      "ac.toSubmit": "登录后即可投稿。登录成功会直接回到投稿页面。",
      "ac.toManage": "登录后即可管理成员与角色。登录成功会直接回到管理页面。",
      "ac.needEmail": "请填写邮箱。",
      "ac.hello": "你好", "ac.mine": "我的投稿", "ac.none": "这个账号还没有投过稿。",
      "ac.submit": "去投稿", "ac.review": "打开审稿后台", "ac.signout": "退出登录",
      "ac.nameLabel": "编辑看到的名字", "ac.saved": "已保存", "ac.passwordSaved": "密码已修改，你已登录。",
      "ac.err.confirm": "邮箱还没验证。请打开邮件里的链接，然后再登录。",
      "ac.err.login": "邮箱或密码不对。",
      "ac.err.exists": "这个邮箱已经注册过了，请直接登录。",
      "ac.err.rate": "刚才发的邮件太多了，请过几分钟再试。",
      "ac.err.short": "密码至少要 8 位。",
      "ac.err.other": "出了点问题，请再试一次。"
    },
    ja: {
      "page.account": "アカウント | Perspectives",
      "ac.signin": "ログイン", "ac.signup": "アカウントを作成", "ac.reset": "新しいパスワード",
      "ac.email": "メールアドレス", "ac.password": "パスワード", "ac.newPassword": "新しいパスワード（8文字以上）",
      "ac.username": "名前またはペンネーム", "ac.signinBtn": "ログイン", "ac.signupBtn": "作成する", "ac.saveBtn": "保存",
      "ac.tabSignup": "新規登録", "ac.tabSignin": "ログイン",
      "ac.link": "パスワードなしでメールのリンクからログイン", "ac.forgot": "パスワードを忘れた場合",
      "ac.linkSent": "メールを確認してください。ログイン用のリンクを送りました。この端末で開いてください。",
      "ac.resetSent": "メールを確認してください。新しいパスワードを設定するリンクを送りました。",
      "ac.created": "アカウントを作成しました。メールの確認リンクを開いてから、ログインしてください。",
      "ac.toSubmit": "ログインすると投稿できます。ログイン後は投稿ページに戻ります。",
      "ac.toManage": "ログインするとメンバーと役割を管理できます。ログイン後は管理ページに戻ります。",
      "ac.needEmail": "メールアドレスを入力してください。",
      "ac.hello": "こんにちは", "ac.mine": "自分の投稿", "ac.none": "このアカウントからの投稿はまだありません。",
      "ac.submit": "作品を投稿する", "ac.review": "審査ページを開く", "ac.signout": "ログアウト",
      "ac.nameLabel": "編集部に表示される名前", "ac.saved": "保存しました", "ac.passwordSaved": "パスワードを変更しました。ログイン済みです。",
      "ac.err.confirm": "メールアドレスがまだ確認されていません。メールのリンクを開いてからログインしてください。",
      "ac.err.login": "メールアドレスかパスワードが違います。",
      "ac.err.exists": "このメールアドレスはすでに登録されています。ログインしてください。",
      "ac.err.rate": "メールの送信が多すぎます。数分後にもう一度お試しください。",
      "ac.err.short": "パスワードは8文字以上にしてください。",
      "ac.err.other": "問題が起きました。もう一度お試しください。"
    },
    ko: {
      "page.account": "계정 | Perspectives",
      "ac.signin": "로그인", "ac.signup": "계정 만들기", "ac.reset": "새 비밀번호 설정",
      "ac.email": "이메일", "ac.password": "비밀번호", "ac.newPassword": "새 비밀번호 (8자 이상)",
      "ac.username": "이름 또는 필명", "ac.signinBtn": "로그인", "ac.signupBtn": "계정 만들기", "ac.saveBtn": "저장",
      "ac.tabSignup": "회원가입", "ac.tabSignin": "로그인",
      "ac.link": "비밀번호 없이 이메일 링크로 로그인", "ac.forgot": "비밀번호를 잊으셨나요?",
      "ac.linkSent": "이메일을 확인해 주세요. 로그인 링크를 보냈습니다. 이 기기에서 열어 주세요.",
      "ac.resetSent": "이메일을 확인해 주세요. 새 비밀번호를 설정하는 링크를 보냈습니다.",
      "ac.created": "계정을 만들었습니다. 이메일의 인증 링크를 연 다음 로그인해 주세요.",
      "ac.toSubmit": "로그인하면 투고할 수 있습니다. 로그인 후 투고 페이지로 돌아갑니다.",
      "ac.toManage": "로그인하면 멤버와 역할을 관리할 수 있습니다. 로그인 후 관리 페이지로 돌아갑니다.",
      "ac.needEmail": "이메일을 입력해 주세요.",
      "ac.hello": "안녕하세요", "ac.mine": "내 투고", "ac.none": "이 계정으로 보낸 투고가 아직 없습니다.",
      "ac.submit": "작품 투고하기", "ac.review": "검토 페이지 열기", "ac.signout": "로그아웃",
      "ac.nameLabel": "편집부에 보이는 이름", "ac.saved": "저장됨", "ac.passwordSaved": "비밀번호를 바꿨습니다. 로그인되어 있습니다.",
      "ac.err.confirm": "이메일 인증이 아직 안 됐습니다. 이메일의 링크를 연 다음 로그인해 주세요.",
      "ac.err.login": "이메일 또는 비밀번호가 맞지 않습니다.",
      "ac.err.exists": "이미 가입된 이메일입니다. 로그인해 주세요.",
      "ac.err.rate": "방금 이메일을 너무 많이 보냈습니다. 몇 분 후에 다시 시도해 주세요.",
      "ac.err.short": "비밀번호는 8자 이상이어야 합니다.",
      "ac.err.other": "문제가 생겼습니다. 다시 시도해 주세요."
    }
  };
  // Status names come from js/contribute.js's words when present; ours if not.
  var STATUS = { uploading: "Upload unfinished", received: "Received", reviewing: "In review", revise: "Changes requested",
                 accepted: "Accepted", published: "Published", declined: "Not selected" };

  var I18N = window.PerspectivesI18N;
  if (I18N) Object.keys(WORDS).forEach(function (l) {
    var d = I18N.translations[l] || (I18N.translations[l] = {});
    Object.keys(WORDS[l]).forEach(function (k) { d[k] = WORDS[l][k]; });
  });
  function t(k) {
    var l = I18N ? I18N.current : "en";
    var d = (I18N && I18N.translations[l]) || {};
    return d[k] || WORDS.en[k] || k;
  }
  function apply() { if (I18N) I18N.setLanguage(I18N.current); }
  // Keep the top-bar name in step with the name from the profiles table.
  function navName(id, name) {
    if (window.PerspectivesAuthNav && window.PerspectivesAuthNav.setName) {
      window.PerspectivesAuthNav.setName(id, name);
    }
  }
  // Same for the role, so the bar can show the admin badge and the review link.
  function navRole(id, role) {
    if (window.PerspectivesAuthNav && window.PerspectivesAuthNav.setRole) {
      window.PerspectivesAuthNav.setRole(id, role);
    }
  }

  var root = document.getElementById("account");
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v === false || v == null) return;
      if (k === "text") n.textContent = v;
      else if (k === "i18n") { n.setAttribute("data-i18n", v); n.textContent = t(v); }
      else if (k === "on") Object.keys(v).forEach(function (ev) { n.addEventListener(ev, v[ev]); });
      else n.setAttribute(k, v === true ? "" : v);
    });
    (kids || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }
  function put() {
    panel.replaceChildren.apply(panel, Array.prototype.filter.call(arguments, Boolean));
    if (panel.parentNode !== root) root.appendChild(panel);
    apply();
  }
  function say(node, key) { node.setAttribute("data-i18n", key); node.textContent = t(key); }
  function errKey(err) {
    var m = String(err && err.message || err);
    if (/not confirmed/i.test(m)) return "ac.err.confirm";
    if (/invalid login/i.test(m)) return "ac.err.login";
    if (/already registered/i.test(m)) return "ac.err.exists";
    if (/rate limit|security purposes/i.test(m)) return "ac.err.rate";
    if (/password/i.test(m) && /(least|short|characters)/i.test(m)) return "ac.err.short";
    console.warn(m);
    return "ac.err.other";
  }
  function field(id, key, attrs) {
    return el("div", { class: "c-field" }, [el("label", { for: id, i18n: key }), el("input", Object.assign({ id: id }, attrs))]);
  }
  function val(id) { var n = document.getElementById(id); return n ? n.value.trim() : ""; }

  /* ---------------- sign-in / sign-up switch ---------------- */

  // The switch is built once and kept in place while the panel below it is
  // replaced, so the black pill slides between two halves of fixed size: the
  // buttons and their labels never move or change size.
  var panel = el("div", { class: "a-panel" });
  var switchBar = el("div", { class: "a-switch", role: "group" });
  var tabButtons = {};
  var mode = null;

  [["signin", "ac.tabSignin"], ["signup", "ac.tabSignup"]].forEach(function (pair) {
    var which = pair[0];
    tabButtons[which] = el("button", {
      type: "button", class: "a-tab", i18n: pair[1],
      on: { click: function () {
        if (mode === which) return;
        if (which === "signin") signinView(); else signupView();
      } }
    });
    switchBar.appendChild(tabButtons[which]);
  });

  // active: "signin" | "signup"; null hides the switch on reset / signed-in views.
  function setMode(active) {
    if (!active) { switchBar.hidden = true; return; }
    mode = active;
    switchBar.hidden = false;
    switchBar.setAttribute("data-mode", active);
    Object.keys(tabButtons).forEach(function (which) {
      var on = which === active;
      tabButtons[which].classList.toggle("is-active", on);
      tabButtons[which].setAttribute("aria-pressed", on ? "true" : "false");
    });
    if (switchBar.parentNode !== root) root.insertBefore(switchBar, root.firstChild);
  }

  /* ---------------- signed out ---------------- */

  // "Continue with Google": Supabase sends the reader to Google and back to
  // this same page, which then sees the session.
  function googleButton(client, msgNode) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "g-btn";
    b.innerHTML = '<svg class="g-logo" aria-hidden="true" width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';
    var label = document.createElement("span");
    label.setAttribute("data-i18n", "g.continue");
    label.textContent = (I18N && I18N.translations[I18N.current] && I18N.translations[I18N.current]["g.continue"]) || "Continue with Google";
    b.appendChild(label);
    b.addEventListener("click", function () {
      b.disabled = true;
      client.auth.signInWithOAuth({ provider: "google", options: { redirectTo: location.href } }).then(function (r) {
        if (r.error) { b.disabled = false; if (msgNode) msgNode.textContent = r.error.message; }
      });
    });
    return b;
  }
  function orLine() {
    var p = document.createElement("p");
    p.className = "g-or";
    var s = document.createElement("span");
    s.setAttribute("data-i18n", "g.or");
    s.textContent = (I18N && I18N.translations[I18N.current] && I18N.translations[I18N.current]["g.or"]) || "or";
    p.appendChild(s);
    return p;
  }

  function signinView(note) {
    var msg = el("p", { class: "c-error", role: "alert" });
    var forgot = el("button", { type: "button", class: "a-link", i18n: "ac.forgot", on: { click: function () {
      if (!val("ac-email")) return say(msg, "ac.needEmail");
      sb.auth.resetPasswordForEmail(val("ac-email"), { redirectTo: HERE }).then(function (r) {
        say(msg, r.error ? errKey(r.error) : "ac.resetSent");
      });
    } } });
    var link = el("button", { type: "button", class: "a-link", i18n: "ac.link", on: { click: function () {
      if (!val("ac-email")) return say(msg, "ac.needEmail");
      sb.auth.signInWithOtp({ email: val("ac-email"), options: { emailRedirectTo: HERE } }).then(function (r) {
        say(msg, r.error ? errKey(r.error) : "ac.linkSent");
      });
    } } });
    // The e-mail-link option and "forgot password" share the row that the
    // sign-up form uses for "Name", so both modes keep the same height and the
    // primary button never moves.
    var alt = el("div", { class: "a-alt" }, [link, forgot]);
    var form = el("form", { class: "c-form", novalidate: true }, [
      field("ac-email", "ac.email", { type: "email", autocomplete: "email", required: true }),
      field("ac-pass", "ac.password", { type: "password", autocomplete: "current-password", required: true }),
      alt,
      msg,
      el("button", { type: "submit", class: "c-send", i18n: "ac.signinBtn" })
    ]);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!val("ac-email")) return say(msg, "ac.needEmail");
      busy(form, true);
      sb.auth.signInWithPassword({ email: val("ac-email"), password: document.getElementById("ac-pass").value }).then(function (r) {
        busy(form, false);
        if (r.error) return say(msg, errKey(r.error));
        afterAuth(r.data.user);
      });
    });
    setMode("signin");
    put(note ? el("p", { class: "c-notice", i18n: note }) : null, googleButton(sb, msg), orLine(), form);
  }

  function signupView() {
    var msg = el("p", { class: "c-error", role: "alert" });
    var form = el("form", { class: "c-form", novalidate: true }, [
      field("ac-email", "ac.email", { type: "email", autocomplete: "email", required: true }),
      field("ac-pass", "ac.newPassword", { type: "password", autocomplete: "new-password", minlength: "8", required: true }),
      field("ac-name", "ac.username", { maxlength: "40", autocomplete: "nickname" }),
      msg,
      el("button", { type: "submit", class: "c-send", i18n: "ac.signupBtn" })
    ]);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!val("ac-email")) return say(msg, "ac.needEmail");
      if (document.getElementById("ac-pass").value.length < 8) return say(msg, "ac.err.short");
      busy(form, true);
      sb.auth.signUp({
        email: val("ac-email"), password: document.getElementById("ac-pass").value,
        options: { data: { username: val("ac-name") }, emailRedirectTo: HERE }
      }).then(function (r) {
        busy(form, false);
        if (r.error) return say(msg, errKey(r.error));
        if (r.data.session) afterAuth(r.data.user); else signinView("ac.created");
      });
    });
    setMode("signup");
    put(form);
  }

  function resetView() {
    var msg = el("p", { class: "c-error", role: "alert" });
    var form = el("form", { class: "c-form", novalidate: true }, [
      field("ac-pass", "ac.newPassword", { type: "password", autocomplete: "new-password", minlength: "8", required: true }),
      msg, el("button", { type: "submit", class: "c-send", i18n: "ac.saveBtn" })
    ]);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var p = document.getElementById("ac-pass").value;
      if (p.length < 8) return say(msg, "ac.err.short");
      busy(form, true);
      sb.auth.updateUser({ password: p }).then(function (r) {
        busy(form, false);
        if (r.error) return say(msg, errKey(r.error));
        signedIn(r.data.user, "ac.passwordSaved");
      });
    });
    setMode(null);
    put(el("h2", { i18n: "ac.reset" }), form);
  }

  function busy(form, on) { Array.prototype.forEach.call(form.querySelectorAll("button, input"), function (n) { n.disabled = on; }); }

  /* ---------------- signed in ---------------- */

  // Sign-in just succeeded on this page. When a guarded page sent us here,
  // leave at once for that page instead of showing the account overview.
  function afterAuth(user, note) {
    if (NEXT) { location.replace(NEXT); return; }
    signedIn(user, note);
  }

  function signedIn(user, note) {
    if (window.PerspectivesAuthNav) window.PerspectivesAuthNav.refresh();
    Promise.resolve().then(function () {
      return Promise.all([
        sb.from("profiles").select("username,role").eq("id", user.id).maybeSingle(),
        sb.from("submissions").select("title,status,created_at,token").eq("user_id", user.id).order("created_at", { ascending: false })
      ]);
    }).then(function (res) {
      var prof = res[0].data || {};
      navName(user.id, prof.username || "");
      navRole(user.id, prof.role || "");
      var subs = res[1].data || [];
      var name = el("input", { id: "ac-uname", maxlength: "40", value: prof.username || "" });
      var saved = el("span", { class: "c-hint", role: "status" });
      var saveName = el("button", { type: "button", class: "c-ghost", i18n: "ac.saveBtn", on: { click: function () {
        var v = name.value.trim();
        sb.from("profiles").update({ username: v }).eq("id", user.id).then(function (r) {
          if (r.error) return say(saved, "ac.err.other");
          navName(user.id, v);
          say(saved, "ac.saved");
          // Mirror the name into the auth session so other pages (and other
          // devices) can show it without querying profiles first.
          sb.auth.updateUser({ data: { username: v } }).then(function () {}, function () {});
        });
      } } });
      var list = subs.length
        ? el("ul", { class: "a-subs" }, subs.map(function (s) {
            var st = "st." + s.status;
            var label = I18N && I18N.translations[I18N.current] && I18N.translations[I18N.current][st] ? null : STATUS[s.status];
            return el("li", {}, [
              el("a", { href: "contribution.html?t=" + s.token, text: s.title }),
              label ? el("span", { class: "c-pill c-pill--" + s.status, text: label }) : el("span", { class: "c-pill c-pill--" + s.status, i18n: st }),
              el("span", { class: "c-hint", text: new Date(s.created_at).toLocaleDateString() })
            ]);
          }))
        : el("p", { class: "c-hint", i18n: "ac.none" });
      setMode(null);
      put(
        note ? el("p", { class: "c-notice", i18n: note }) : null,
        el("h2", {}, [el("span", { i18n: "ac.hello" }), document.createTextNode(", " + (prof.username || user.email))]),
        el("p", { class: "c-hint", text: user.email }),
        el("h3", { i18n: "ac.mine" }),
        list,
        el("p", {}, [el("a", { class: "c-link", href: "contribution.html", i18n: "ac.submit" })]),
        (prof.role === "editor" || prof.role === "admin") ? el("p", {}, [el("a", { class: "c-link", href: "review.html", i18n: "ac.review" })]) : null,
        el("div", { class: "c-field a-name" }, [el("label", { for: "ac-uname", i18n: "ac.nameLabel" }),
          el("div", { class: "c-linkrow" }, [name, saveName]), saved]),
        el("button", { type: "button", class: "c-ghost", i18n: "ac.signout", on: { click: function () {
          sb.auth.signOut().then(function () { location.href = HERE; });
        } } })
      );
    });
  }

  /* ---------------- start ---------------- */

  var recovering = /type=recovery/.test(location.hash);
  sb.auth.onAuthStateChange(function (event) { if (event === "PASSWORD_RECOVERY") recovering = true; });
  sb.auth.getSession().then(function (r) {
    var s = r.data && r.data.session;
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
    if (s && recovering) return resetView();
    if (s) return afterAuth(s.user);
    signinView(NEXT ? (/^manage\.html/.test(NEXT) ? "ac.toManage" : "ac.toSubmit") : undefined);
  });
})();
