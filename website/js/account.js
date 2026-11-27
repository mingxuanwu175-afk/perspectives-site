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

  var WORDS = {
    en: {
      "page.account": "Account | Perspectives",
      "ac.signin": "Sign in", "ac.signup": "Create an account", "ac.reset": "Choose a new password",
      "ac.email": "Email", "ac.password": "Password", "ac.newPassword": "New password (at least 8 characters)",
      "ac.username": "Name or pen name", "ac.signinBtn": "Sign in", "ac.signupBtn": "Create account", "ac.saveBtn": "Save",
      "ac.toSignup": "No account yet? Create one", "ac.toSignin": "Already have an account? Sign in",
      "ac.link": "Email me a sign-in link instead (no password)", "ac.forgot": "Forgot your password?",
      "ac.linkSent": "Check your email: we sent you a sign-in link. Open it on this device.",
      "ac.resetSent": "Check your email: we sent you a link to choose a new password.",
      "ac.created": "Account created. Open the confirmation link we emailed you, then sign in.",
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
      "ac.toSignup": "还没有账号？注册", "ac.toSignin": "已有账号？登录",
      "ac.link": "改用邮箱登录链接（不用密码）", "ac.forgot": "忘记密码？",
      "ac.linkSent": "请查看邮箱：登录链接已发出，在这台设备上打开。",
      "ac.resetSent": "请查看邮箱：设置新密码的链接已发出。",
      "ac.created": "账号已建好。请打开邮箱里的验证链接，然后回来登录。",
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
      "ac.toSignup": "アカウントがない方はこちら", "ac.toSignin": "アカウントをお持ちの方はログイン",
      "ac.link": "パスワードなしでメールのリンクからログイン", "ac.forgot": "パスワードを忘れた場合",
      "ac.linkSent": "メールを確認してください。ログイン用のリンクを送りました。この端末で開いてください。",
      "ac.resetSent": "メールを確認してください。新しいパスワードを設定するリンクを送りました。",
      "ac.created": "アカウントを作成しました。メールの確認リンクを開いてから、ログインしてください。",
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
      "ac.toSignup": "계정이 없나요? 만들기", "ac.toSignin": "계정이 있나요? 로그인",
      "ac.link": "비밀번호 없이 이메일 링크로 로그인", "ac.forgot": "비밀번호를 잊으셨나요?",
      "ac.linkSent": "이메일을 확인해 주세요. 로그인 링크를 보냈습니다. 이 기기에서 열어 주세요.",
      "ac.resetSent": "이메일을 확인해 주세요. 새 비밀번호를 설정하는 링크를 보냈습니다.",
      "ac.created": "계정을 만들었습니다. 이메일의 인증 링크를 연 다음 로그인해 주세요.",
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
  function put() { root.replaceChildren.apply(root, Array.prototype.filter.call(arguments, Boolean)); apply(); }
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

  /* ---------------- signed out ---------------- */

  function signinView(note) {
    var msg = el("p", { class: "c-error", role: "alert" });
    var form = el("form", { class: "c-form", novalidate: true }, [
      field("ac-email", "ac.email", { type: "email", autocomplete: "email", required: true }),
      field("ac-pass", "ac.password", { type: "password", autocomplete: "current-password", required: true }),
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
        signedIn(r.data.user);
      });
    });
    var link = el("button", { type: "button", class: "a-link", i18n: "ac.link", on: { click: function () {
      if (!val("ac-email")) return say(msg, "ac.needEmail");
      sb.auth.signInWithOtp({ email: val("ac-email"), options: { emailRedirectTo: HERE } }).then(function (r) {
        say(msg, r.error ? errKey(r.error) : "ac.linkSent");
      });
    } } });
    var forgot = el("button", { type: "button", class: "a-link", i18n: "ac.forgot", on: { click: function () {
      if (!val("ac-email")) return say(msg, "ac.needEmail");
      sb.auth.resetPasswordForEmail(val("ac-email"), { redirectTo: HERE }).then(function (r) {
        say(msg, r.error ? errKey(r.error) : "ac.resetSent");
      });
    } } });
    put(
      el("h2", { i18n: "ac.signin" }),
      note ? el("p", { class: "c-notice", i18n: note }) : null,
      form,
      el("div", { class: "a-more" }, [link, forgot,
        el("button", { type: "button", class: "a-link", i18n: "ac.toSignup", on: { click: function () { signupView(); } } })])
    );
  }

  function signupView() {
    var msg = el("p", { class: "c-error", role: "alert" });
    var form = el("form", { class: "c-form", novalidate: true }, [
      field("ac-name", "ac.username", { maxlength: "40", autocomplete: "nickname" }),
      field("ac-email", "ac.email", { type: "email", autocomplete: "email", required: true }),
      field("ac-pass", "ac.newPassword", { type: "password", autocomplete: "new-password", minlength: "8", required: true }),
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
        if (r.data.session) signedIn(r.data.user); else signinView("ac.created");
      });
    });
    put(el("h2", { i18n: "ac.signup" }), form,
      el("div", { class: "a-more" }, [el("button", { type: "button", class: "a-link", i18n: "ac.toSignin", on: { click: function () { signinView(); } } })]));
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
    put(el("h2", { i18n: "ac.reset" }), form);
  }

  function busy(form, on) { Array.prototype.forEach.call(form.querySelectorAll("button, input"), function (n) { n.disabled = on; }); }

  /* ---------------- signed in ---------------- */

  function signedIn(user, note) {
    // Link submissions made earlier with this (verified) email, then show them.
    sb.auth.getSession().then(function (r) {
      var tok = r.data.session && r.data.session.access_token;
      var claim = tok ? fetch("/api/claim", { method: "POST", headers: { Authorization: "Bearer " + tok } }).catch(function () {}) : Promise.resolve();
      return claim;
    }).then(function () {
      return Promise.all([
        sb.from("profiles").select("username,role").eq("id", user.id).maybeSingle(),
        sb.from("submissions").select("title,status,created_at,token").eq("user_id", user.id).order("created_at", { ascending: false })
      ]);
    }).then(function (res) {
      var prof = res[0].data || {};
      var subs = res[1].data || [];
      var name = el("input", { id: "ac-uname", maxlength: "40", value: prof.username || "" });
      var saved = el("span", { class: "c-hint", role: "status" });
      var saveName = el("button", { type: "button", class: "c-ghost", i18n: "ac.saveBtn", on: { click: function () {
        sb.from("profiles").update({ username: name.value.trim() }).eq("id", user.id).then(function (r) {
          say(saved, r.error ? "ac.err.other" : "ac.saved");
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
    if (location.hash) history.replaceState(null, "", location.pathname);
    if (s && recovering) return resetView();
    if (s) return signedIn(s.user);
    signinView();
  });
})();
