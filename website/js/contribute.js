/* Perspectives: the submission form on contribution.html.
 *
 * Any file type. Files go straight from the browser to Supabase Storage
 * through signed upload URLs from /api/submit; the page then tells the server
 * they arrived. Afterwards the submitter gets a progress link
 * (contribution.html?t=<token>), which shows the submission's status.
 *
 * Words: all four site languages here, merged into lang.js. The Japanese and
 * Korean are a first draft: ask a native speaker to read them.
 */
(function () {
  "use strict";

  var MB = 1024 * 1024;
  var MAX_FILE = 50 * MB, MAX_FILES = 10, MAX_TOTAL = 200 * MB;

  var WORDS = {
    en: {
      "a.ask": "Create an account?",
      "a.text": "Choose a password for {email}. Signed in, you can see all your submissions any time, without keeping links.",
      "a.pass": "Password (at least 8 characters)",
      "a.yes": "Create account",
      "a.signin": "Sign in",
      "a.have": "I already have an account",
      "a.new": "I need a new account",
      "a.no": "No thanks",
      "a.done": "Done. This submission is now in your account.",
      "a.close": "Close",
      "a.err.exists": "This email already has an account. Sign in instead.",
      "a.err.login": "Wrong password for this email.",
      "a.err.short": "The password needs at least 8 characters.",
      "a.err.other": "Something went wrong. You can still use the link above.",
      "s.add": "Add to my account",
      "s.added": "Added to your account.",
      "s.other": "This submission belongs to another account.",
      "c.title": "Submit your work",
      "c.lead": "Writing, art, photos, anything else. Any file type, up to 10 files, 50 MB each. Our editors read everything and write back by email.",
      "c.name": "Name or pen name",
      "c.email": "Email",
      "c.emailHint": "We write back here.",
      "c.contact": "Other contact (optional)",
      "c.contactHint": "WeChat, Instagram, Xiaohongshu, Bilibili…",
      "c.workTitle": "Title of the work",
      "c.kind": "Type",
      "k.writing": "Writing", "k.art": "Art", "k.photo": "Photography", "k.other": "Other",
      "c.note": "Anything we should know (optional)",
      "c.files": "Files",
      "c.filesHint": "Any type. Up to 10 files, 50 MB each, 200 MB in all. For something larger, put a link in the note.",
      "c.consent": "This is my own work. I agree that the Perspectives editors may read it; nothing is published without asking me first.",
      "c.send": "Submit",
      "c.sending": "Uploading…",
      "c.done": "Received. Thank you!",
      "c.doneText": "Keep this link to see where your submission is:",
      "c.copy": "Copy link",
      "c.copied": "Copied",
      "c.another": "Submit another",
      "s.heading": "Your submission",
      "s.status": "Status",
      "s.files": "Files",
      "s.sent": "Sent",
      "st.uploading": "Upload not finished",
      "st.received": "Received, waiting for review",
      "st.reviewing": "Being reviewed",
      "st.revise": "Changes requested, check your email",
      "st.accepted": "Accepted",
      "st.published": "Published",
      "st.declined": "Not selected this time",
      "err.name": "Please give a name or pen name.",
      "err.email": "Please give a valid email address.",
      "err.title": "Please give the work a title.",
      "err.noFiles": "Add at least one file.",
      "err.tooMany": "At most 10 files.",
      "err.empty": "One of the files is empty.",
      "err.size": "Each file can be at most 50 MB.",
      "err.total": "All files together can be at most 200 MB.",
      "err.consent": "Please tick the box to confirm.",
      "err.rate": "Too many submissions from this connection. Try again in 10 minutes.",
      "err.upload": "Some files did not finish uploading. Please try again.",
      "err.network": "Could not reach the server. Check your connection and try again.",
      "err.server": "Something went wrong on our side. Please try again later.",
      "err.unknown": "This link does not match any submission."
    },
    zh: {
      "a.ask": "要不要建个账号？",
      "a.text": "给 {email} 设一个密码就行。登录后随时能看到你所有投稿的进度，不用保存链接。",
      "a.pass": "密码（至少 8 位）",
      "a.yes": "建账号",
      "a.signin": "登录",
      "a.have": "我已经有账号了",
      "a.new": "我要新建账号",
      "a.no": "不用了",
      "a.done": "好了，这篇投稿已经放进你的账号。",
      "a.close": "关闭",
      "a.err.exists": "这个邮箱已经有账号了，请直接登录。",
      "a.err.login": "密码不对。",
      "a.err.short": "密码至少要 8 位。",
      "a.err.other": "出了点问题。你仍然可以用上面的进度链接。",
      "s.add": "放进我的账号",
      "s.added": "已放进你的账号。",
      "s.other": "这篇投稿属于另一个账号。",
      "c.title": "投稿",
      "c.lead": "文章、画、摄影，什么都可以。文件格式不限，最多 10 个，每个 50 MB 以内。编辑会逐一阅读，用邮件回复你。",
      "c.name": "姓名或笔名",
      "c.email": "邮箱",
      "c.emailHint": "我们会回复到这里。",
      "c.contact": "其他联系方式（选填）",
      "c.contactHint": "微信、Instagram、小红书、B站……",
      "c.workTitle": "作品标题",
      "c.kind": "类型",
      "k.writing": "文字", "k.art": "绘画", "k.photo": "摄影", "k.other": "其他",
      "c.note": "想告诉我们的（选填）",
      "c.files": "文件",
      "c.filesHint": "格式不限。最多 10 个文件，每个 50 MB 以内，合计 200 MB 以内。更大的请在上面留下链接。",
      "c.consent": "这是我本人的作品。我同意 Perspectives 编辑阅读它；刊登前会先征得我同意。",
      "c.send": "提交",
      "c.sending": "上传中……",
      "c.done": "已收到，谢谢！",
      "c.doneText": "请保存这个链接，随时查看投稿进度：",
      "c.copy": "复制链接",
      "c.copied": "已复制",
      "c.another": "再投一篇",
      "s.heading": "你的投稿",
      "s.status": "状态",
      "s.files": "文件",
      "s.sent": "提交时间",
      "st.uploading": "上传未完成",
      "st.received": "已收到，等待审阅",
      "st.reviewing": "审阅中",
      "st.revise": "需要修改，请查看邮件",
      "st.accepted": "已录用",
      "st.published": "已发表",
      "st.declined": "这次未入选",
      "err.name": "请填写姓名或笔名。",
      "err.email": "请填写有效的邮箱。",
      "err.title": "请填写作品标题。",
      "err.noFiles": "请至少选一个文件。",
      "err.tooMany": "最多 10 个文件。",
      "err.empty": "有一个文件是空的。",
      "err.size": "每个文件不能超过 50 MB。",
      "err.total": "所有文件合计不能超过 200 MB。",
      "err.consent": "请勾选确认。",
      "err.rate": "这个网络提交太频繁了，请 10 分钟后再试。",
      "err.upload": "有文件没有上传完，请再试一次。",
      "err.network": "连不上服务器，请检查网络后再试。",
      "err.server": "我们这边出了问题，请稍后再试。",
      "err.unknown": "这个链接找不到对应的投稿。"
    },
    ja: {
      "a.ask": "アカウントを作りますか？",
      "a.text": "{email} のパスワードを決めるだけです。ログインすれば、リンクを保存しなくても投稿の状況をいつでも見られます。",
      "a.pass": "パスワード（8文字以上）",
      "a.yes": "作成する",
      "a.signin": "ログイン",
      "a.have": "すでにアカウントがあります",
      "a.new": "新しく作ります",
      "a.no": "今はしない",
      "a.done": "完了しました。この投稿はあなたのアカウントに入りました。",
      "a.close": "閉じる",
      "a.err.exists": "このメールアドレスはすでに登録されています。ログインしてください。",
      "a.err.login": "パスワードが違います。",
      "a.err.short": "パスワードは8文字以上にしてください。",
      "a.err.other": "問題が起きました。上のリンクはそのまま使えます。",
      "s.add": "自分のアカウントに追加",
      "s.added": "アカウントに追加しました。",
      "s.other": "この投稿は別のアカウントのものです。",
      "c.title": "作品を投稿する",
      "c.lead": "文章、絵、写真など、なんでも歓迎します。ファイル形式は自由、最大10個、1つ50MBまで。編集部がすべて読み、メールでお返事します。",
      "c.name": "名前またはペンネーム",
      "c.email": "メールアドレス",
      "c.emailHint": "お返事はこちらに送ります。",
      "c.contact": "その他の連絡先（任意）",
      "c.contactHint": "WeChat、Instagram、小紅書、ビリビリなど",
      "c.workTitle": "作品のタイトル",
      "c.kind": "種類",
      "k.writing": "文章", "k.art": "絵", "k.photo": "写真", "k.other": "その他",
      "c.note": "伝えたいこと（任意）",
      "c.files": "ファイル",
      "c.filesHint": "形式は自由。最大10個、1つ50MBまで、合計200MBまで。それより大きいものはリンクを書いてください。",
      "c.consent": "これは自分の作品です。Perspectives編集部が読むことに同意します。掲載する前に必ず確認があります。",
      "c.send": "投稿する",
      "c.sending": "アップロード中…",
      "c.done": "受け取りました。ありがとうございます！",
      "c.doneText": "このリンクを保存すると、いつでも進み具合を確認できます：",
      "c.copy": "リンクをコピー",
      "c.copied": "コピーしました",
      "c.another": "もう一つ投稿する",
      "s.heading": "あなたの投稿",
      "s.status": "状況",
      "s.files": "ファイル",
      "s.sent": "送信日",
      "st.uploading": "アップロード未完了",
      "st.received": "受付済み、審査待ち",
      "st.reviewing": "審査中",
      "st.revise": "修正のお願いがあります。メールを確認してください",
      "st.accepted": "採用",
      "st.published": "掲載済み",
      "st.declined": "今回は見送り",
      "err.name": "名前またはペンネームを入力してください。",
      "err.email": "正しいメールアドレスを入力してください。",
      "err.title": "作品のタイトルを入力してください。",
      "err.noFiles": "ファイルを1つ以上選んでください。",
      "err.tooMany": "ファイルは最大10個です。",
      "err.empty": "空のファイルがあります。",
      "err.size": "1つのファイルは50MBまでです。",
      "err.total": "ファイルの合計は200MBまでです。",
      "err.consent": "確認のチェックを入れてください。",
      "err.rate": "この回線からの投稿が多すぎます。10分後にもう一度お試しください。",
      "err.upload": "アップロードが終わらなかったファイルがあります。もう一度お試しください。",
      "err.network": "サーバーにつながりません。接続を確認してもう一度お試しください。",
      "err.server": "こちらで問題が起きました。しばらくしてからお試しください。",
      "err.unknown": "このリンクに対応する投稿が見つかりません。"
    },
    ko: {
      "a.ask": "계정을 만들까요?",
      "a.text": "{email}의 비밀번호만 정하면 됩니다. 로그인하면 링크를 저장하지 않아도 모든 투고의 진행 상황을 볼 수 있습니다.",
      "a.pass": "비밀번호 (8자 이상)",
      "a.yes": "계정 만들기",
      "a.signin": "로그인",
      "a.have": "이미 계정이 있어요",
      "a.new": "새 계정을 만들게요",
      "a.no": "괜찮아요",
      "a.done": "완료했습니다. 이 투고가 내 계정에 들어갔습니다.",
      "a.close": "닫기",
      "a.err.exists": "이미 가입된 이메일입니다. 로그인해 주세요.",
      "a.err.login": "비밀번호가 맞지 않습니다.",
      "a.err.short": "비밀번호는 8자 이상이어야 합니다.",
      "a.err.other": "문제가 생겼습니다. 위의 링크는 그대로 쓸 수 있습니다.",
      "s.add": "내 계정에 추가",
      "s.added": "계정에 추가했습니다.",
      "s.other": "이 투고는 다른 계정의 것입니다.",
      "c.title": "작품 투고",
      "c.lead": "글, 그림, 사진 등 무엇이든 좋습니다. 파일 형식은 자유이며 최대 10개, 파일당 50MB까지입니다. 편집부가 모두 읽고 이메일로 답장드립니다.",
      "c.name": "이름 또는 필명",
      "c.email": "이메일",
      "c.emailHint": "이 주소로 답장을 보냅니다.",
      "c.contact": "다른 연락처 (선택)",
      "c.contactHint": "WeChat, Instagram, 샤오훙수, 빌리빌리 등",
      "c.workTitle": "작품 제목",
      "c.kind": "종류",
      "k.writing": "글", "k.art": "그림", "k.photo": "사진", "k.other": "기타",
      "c.note": "전하고 싶은 말 (선택)",
      "c.files": "파일",
      "c.filesHint": "형식은 자유입니다. 최대 10개, 파일당 50MB, 합계 200MB까지. 더 큰 파일은 위에 링크를 남겨 주세요.",
      "c.consent": "본인의 작품입니다. Perspectives 편집부가 읽는 데 동의합니다. 게재 전에는 반드시 먼저 동의를 구합니다.",
      "c.send": "투고하기",
      "c.sending": "업로드 중…",
      "c.done": "잘 받았습니다. 감사합니다!",
      "c.doneText": "이 링크를 저장하면 언제든 진행 상황을 볼 수 있습니다:",
      "c.copy": "링크 복사",
      "c.copied": "복사됨",
      "c.another": "하나 더 투고하기",
      "s.heading": "내 투고",
      "s.status": "상태",
      "s.files": "파일",
      "s.sent": "보낸 날짜",
      "st.uploading": "업로드 미완료",
      "st.received": "접수됨, 검토 대기",
      "st.reviewing": "검토 중",
      "st.revise": "수정 요청이 있습니다. 이메일을 확인해 주세요",
      "st.accepted": "채택",
      "st.published": "게재됨",
      "st.declined": "이번에는 선정되지 않음",
      "err.name": "이름 또는 필명을 입력해 주세요.",
      "err.email": "올바른 이메일 주소를 입력해 주세요.",
      "err.title": "작품 제목을 입력해 주세요.",
      "err.noFiles": "파일을 하나 이상 선택해 주세요.",
      "err.tooMany": "파일은 최대 10개입니다.",
      "err.empty": "빈 파일이 있습니다.",
      "err.size": "파일 하나는 50MB까지입니다.",
      "err.total": "파일 합계는 200MB까지입니다.",
      "err.consent": "확인란에 체크해 주세요.",
      "err.rate": "이 네트워크에서 투고가 너무 많습니다. 10분 후에 다시 시도해 주세요.",
      "err.upload": "업로드가 끝나지 않은 파일이 있습니다. 다시 시도해 주세요.",
      "err.network": "서버에 연결할 수 없습니다. 연결을 확인하고 다시 시도해 주세요.",
      "err.server": "저희 쪽에 문제가 생겼습니다. 잠시 후 다시 시도해 주세요.",
      "err.unknown": "이 링크에 해당하는 투고를 찾을 수 없습니다."
    }
  };

  var I18N = window.PerspectivesI18N;
  if (I18N) {
    Object.keys(WORDS).forEach(function (lang) {
      var dict = I18N.translations[lang] || (I18N.translations[lang] = {});
      Object.keys(WORDS[lang]).forEach(function (k) { dict[k] = WORDS[lang][k]; });
    });
  }
  function t(key) {
    var lang = I18N ? I18N.current : "en";
    var d = (I18N && I18N.translations[lang]) || WORDS[lang] || {};
    return d[key] || WORDS.en[key] || key;
  }
  function apply() { if (I18N) I18N.setLanguage(I18N.current); }

  var root = document.getElementById("contribute");
  if (!root) return;

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "text") n.textContent = attrs[k];
      else if (k === "i18n") { n.setAttribute("data-i18n", attrs[k]); n.textContent = t(attrs[k]); }
      else n.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }

  function put() { root.replaceChildren.apply(root, Array.prototype.filter.call(arguments, Boolean)); }

  function fmtSize(n) {
    return n >= MB ? (n / MB).toFixed(1) + " MB" : Math.max(1, Math.round(n / 1024)) + " KB";
  }

  // A signed-in visitor's Supabase session (supabase-js keeps it in
  // localStorage under sb-<project>-auth-token). Sent along so the submission
  // is linked to their account; without one the submission is anonymous.
  function accessToken() {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (/^sb-.+-auth-token$/.test(k)) {
          var s = JSON.parse(localStorage.getItem(k));
          var tok = s && (s.access_token || (s.currentSession && s.currentSession.access_token));
          if (tok && (!s.expires_at || s.expires_at * 1000 > Date.now())) return tok;
        }
      }
    } catch (e) { /* storage blocked: submit anonymously */ }
    return null;
  }

  function api(path, body) {
    var headers = { "Content-Type": "application/json" };
    var tok = accessToken();
    if (tok) headers.Authorization = "Bearer " + tok;
    return fetch(path, body ? {
      method: "POST", headers: headers, body: JSON.stringify(body)
    } : { cache: "no-store" }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok) throw Object.assign(new Error(data.error || "HTTP " + res.status), { key: data.key || "err.server" });
        return data;
      });
    }, function () { throw Object.assign(new Error("network"), { key: "err.network" }); });
  }

  // PUT one file to its signed URL, reporting progress (0..1).
  function upload(url, file, onProgress) {
    return new Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open("PUT", url);
      xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
      xhr.upload.onprogress = function (e) { if (e.lengthComputable) onProgress(e.loaded / e.total); };
      xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) { onProgress(1); resolve(); }
        else reject(Object.assign(new Error("upload " + xhr.status), { key: "err.upload" }));
      };
      xhr.onerror = function () { reject(Object.assign(new Error("upload"), { key: "err.upload" })); };
      xhr.send(file);
    });
  }

  /* ---------------- progress link view ---------------- */

  function addButton(token) {
    var note = el("span", { class: "c-hint", role: "status" });
    var btn = el("button", { type: "button", class: "c-ghost", i18n: "s.add" });
    btn.addEventListener("click", function () {
      btn.disabled = true;
      claim(token).then(function () {
        btn.remove(); note.setAttribute("data-i18n", "s.added"); note.textContent = t("s.added");
      }, function (err) {
        btn.disabled = false;
        var k = err && err.key === "err.claimed" ? "s.other" : "a.err.other";
        note.setAttribute("data-i18n", k); note.textContent = t(k);
      });
    });
    return el("p", { class: "c-linkrow" }, [btn, note]);
  }

  function statusView(token, notice) {
    root.replaceChildren(el("h2", { i18n: "s.heading" }), el("p", { class: "c-muted", text: "…" }));
    api("/api/status?t=" + encodeURIComponent(token)).then(function (s) {
      var date = new Date(s.created_at);
      put(
        notice ? el("p", { class: "c-notice", i18n: notice }) : null,
        el("h2", { i18n: "s.heading" }),
        el("p", { class: "c-work", text: s.title }),
        el("dl", { class: "c-status" }, [
          el("dt", { i18n: "s.status" }), el("dd", { class: "c-pill c-pill--" + s.status, i18n: "st." + s.status }),
          el("dt", { i18n: "s.files" }), el("dd", { text: String(s.files) }),
          el("dt", { i18n: "s.sent" }), el("dd", { text: date.toLocaleDateString() })
        ]),
        (SB && accessToken() && !s.linked) ? addButton(token) : null,
        el("p", {}, [el("a", { class: "c-link", href: "contribution.html", i18n: "c.another" })])
      );
      apply();
    }, function (err) {
      root.replaceChildren(el("h2", { i18n: "s.heading" }), el("p", { class: "c-error", i18n: err.key }),
        el("p", {}, [el("a", { class: "c-link", href: "contribution.html", i18n: "c.another" })]));
      apply();
    });
  }

  /* ---------------- form view ---------------- */

  function field(id, labelKey, input, hintKey) {
    return el("div", { class: "c-field" }, [
      el("label", { for: id, i18n: labelKey }),
      input,
      hintKey ? el("p", { class: "c-hint", i18n: hintKey }) : null
    ]);
  }

  function formView() {
    var kind = el("select", { id: "c-kind", name: "kind" }, ["writing", "art", "photo", "other"].map(function (k) {
      return el("option", { value: k, i18n: "k." + k });
    }));
    var fileInput = el("input", { id: "c-files", name: "files", type: "file", multiple: "" });
    var list = el("ul", { class: "c-filelist" });
    var consent = el("input", { id: "c-consent", type: "checkbox" });
    var error = el("p", { class: "c-error", role: "alert" });
    var send = el("button", { type: "submit", class: "c-send", i18n: "c.send" });

    var form = el("form", { class: "c-form", novalidate: "" }, [
      field("c-name", "c.name", el("input", { id: "c-name", name: "name", maxlength: "80", autocomplete: "name", required: "" })),
      field("c-email", "c.email", el("input", { id: "c-email", name: "email", type: "email", maxlength: "120", autocomplete: "email", required: "" }), "c.emailHint"),
      field("c-contact", "c.contact", el("input", { id: "c-contact", name: "contact", maxlength: "120" }), "c.contactHint"),
      field("c-title", "c.workTitle", el("input", { id: "c-title", name: "title", maxlength: "200", required: "" })),
      field("c-kind", "c.kind", kind),
      field("c-note", "c.note", el("textarea", { id: "c-note", name: "note", rows: "4", maxlength: "2000" })),
      field("c-files", "c.files", fileInput, "c.filesHint"),
      list,
      el("label", { class: "c-consent", for: "c-consent" }, [consent, el("span", { i18n: "c.consent" })]),
      error,
      send
    ]);

    var bars = [];
    function showFiles() {
      list.replaceChildren();
      bars = [];
      Array.prototype.forEach.call(fileInput.files, function (f) {
        var bar = el("span", { class: "c-bar" });
        bars.push(bar);
        list.appendChild(el("li", {}, [el("span", { class: "c-fname", text: f.name }), el("span", { class: "c-fsize", text: fmtSize(f.size) }), bar]));
      });
    }
    fileInput.addEventListener("change", function () { error.textContent = ""; error.removeAttribute("data-i18n"); showFiles(); });

    function fail(key) {
      error.setAttribute("data-i18n", key);
      error.textContent = t(key);
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = function (id) { return document.getElementById(id).value.trim(); };
      var files = Array.prototype.slice.call(fileInput.files);
      var total = files.reduce(function (n, f) { return n + f.size; }, 0);
      if (!v("c-name")) return fail("err.name");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v("c-email"))) return fail("err.email");
      if (!v("c-title")) return fail("err.title");
      if (!files.length) return fail("err.noFiles");
      if (files.length > MAX_FILES) return fail("err.tooMany");
      if (files.some(function (f) { return f.size === 0; })) return fail("err.empty");
      if (files.some(function (f) { return f.size > MAX_FILE; })) return fail("err.size");
      if (total > MAX_TOTAL) return fail("err.total");
      if (!consent.checked) return fail("err.consent");

      error.textContent = ""; error.removeAttribute("data-i18n");
      send.disabled = true; send.setAttribute("data-i18n", "c.sending"); send.textContent = t("c.sending");
      fileInput.disabled = true;

      var started;
      api("/api/submit", {
        action: "start", name: v("c-name"), email: v("c-email"), contact: v("c-contact"),
        title: v("c-title"), kind: kind.value, note: document.getElementById("c-note").value,
        files: files.map(function (f) { return { name: f.name, size: f.size, type: f.type }; })
      }).then(function (s) {
        started = s;
        // One file at a time keeps phones and school networks happy.
        return s.uploads.reduce(function (p, u, i) {
          return p.then(function () {
            return upload(u.url, files[i], function (x) { if (bars[i]) bars[i].style.setProperty("--p", x); });
          });
        }, Promise.resolve());
      }).then(function () {
        return api("/api/submit", { action: "finish", id: started.id, token: started.token });
      }).then(function () {
        doneView(started.token, v("c-email"));
      }).catch(function (err) {
        fail(err.key || "err.server");
        send.disabled = false; send.setAttribute("data-i18n", "c.send"); send.textContent = t("c.send");
        fileInput.disabled = false;
      });
    });

    root.replaceChildren(el("h2", { i18n: "c.title" }), el("p", { class: "c-lead", i18n: "c.lead" }), form);
    apply();
  }

  /* ---------------- optional account after submitting ---------------- */

  var SB = window.supabase && window.supabase.createClient(
    "https://itnylaavtwmhvzepmxrt.supabase.co",
    "sb_publishable_zrfDWNTiHJSEdaK4lxlo3Q_3vz08ZR_" // public by design
  );
  function fill(key, email) { return t(key).replace("{email}", email); }

  // Shown once on the thank-you screen, to people who are not signed in.
  // Sign-up sends no email: the account is ready at once, and this submission
  // is added to it with its progress-link token as proof that it is theirs.
  function errKey(err) {
    var m = String(err && err.message || err);
    if (/already registered/i.test(m)) return "a.err.exists";
    if (/invalid login/i.test(m)) return "a.err.login";
    if (/password/i.test(m) && /(least|short|characters)/i.test(m)) return "a.err.short";
    console.warn(m);
    return "a.err.other";
  }

  function claim(token) {
    return SB.auth.getSession().then(function (r) {
      var s = r.data && r.data.session;
      if (!s) throw new Error("no session");
      return fetch("/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + s.access_token },
        body: JSON.stringify({ token: token })
      }).then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (d) {
          if (!res.ok) throw Object.assign(new Error(d.error || res.status), { key: d.key });
          return d;
        });
      });
    });
  }

  function askAccount(email, token) {
    if (!SB || accessToken()) return;
    var mode = "new";
    var text = el("p");
    var pass = el("input", { id: "c-pass", type: "password", minlength: "8", autocomplete: "new-password" });
    var passLabel = el("label", { for: "c-pass" });
    var passField = el("div", { class: "c-field" }, [passLabel, pass]);
    var msg = el("p", { class: "c-error", role: "status" });
    var yes = el("button", { type: "button", class: "c-send" });
    var no = el("button", { type: "button", class: "c-ghost" });
    var swap = el("button", { type: "button", class: "c-linkbtn" });
    var dlg = el("dialog", { class: "c-dialog", "aria-labelledby": "c-ask" }, [
      el("h3", { id: "c-ask" }), text, passField, msg, el("div", { class: "c-actions" }, [yes, no]), swap
    ]);
    function words() {
      var done = !!dlg.dataset.done;
      dlg.querySelector("h3").textContent = t(done ? "a.done" : "a.ask");
      text.textContent = done ? "" : fill("a.text", email);
      passLabel.textContent = t("a.pass");
      passField.hidden = done; swap.hidden = done; yes.hidden = done;
      yes.textContent = t(mode === "new" ? "a.yes" : "a.signin");
      swap.textContent = t(mode === "new" ? "a.have" : "a.new");
      no.textContent = t(done ? "a.close" : "a.no");
      msg.textContent = msg.dataset.key ? t(msg.dataset.key) : "";
    }
    function close() { dlg.close(); dlg.remove(); document.removeEventListener("languagechange", words); }
    document.addEventListener("languagechange", words);
    no.addEventListener("click", close);
    swap.addEventListener("click", function () {
      mode = mode === "new" ? "old" : "new";
      pass.setAttribute("autocomplete", mode === "new" ? "new-password" : "current-password");
      msg.dataset.key = "";
      words();
    });
    yes.addEventListener("click", function () {
      if (mode === "new" && pass.value.length < 8) { msg.dataset.key = "a.err.short"; return words(); }
      yes.disabled = true;
      var go = mode === "new"
        ? SB.auth.signUp({ email: email, password: pass.value })
        : SB.auth.signInWithPassword({ email: email, password: pass.value });
      go.then(function (r) {
        if (r.error) throw r.error;
        if (!r.data.session) throw new Error("no session");
        return claim(token);
      }).then(function () {
        dlg.dataset.done = "1"; msg.dataset.key = "";
      }, function (err) {
        msg.dataset.key = err && err.key ? "a.err.other" : errKey(err);
      }).then(function () { yes.disabled = false; words(); });
    });
    words();
    document.body.appendChild(dlg);
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
  }

  function doneView(token, email) {
    var link = location.origin + location.pathname + "?t=" + token;
    var copy = el("button", { type: "button", class: "c-copy", i18n: "c.copy" });
    var out = el("input", { class: "c-out", readonly: "", value: link, "aria-label": "link" });
    copy.addEventListener("click", function () {
      var ok = function () { copy.setAttribute("data-i18n", "c.copied"); copy.textContent = t("c.copied"); };
      if (navigator.clipboard) navigator.clipboard.writeText(link).then(ok, function () { out.select(); });
      else out.select();
    });
    root.replaceChildren(
      el("h2", { i18n: "c.done" }),
      el("p", { i18n: "c.doneText" }),
      el("div", { class: "c-linkrow" }, [out, copy]),
      el("p", {}, [el("a", { class: "c-link", href: "contribution.html", i18n: "c.another" })])
    );
    apply();
    window.scrollTo(0, 0);
    askAccount(email, token);
  }

  var token = new URLSearchParams(location.search).get("t");
  if (token) statusView(token); else formView();
})();
