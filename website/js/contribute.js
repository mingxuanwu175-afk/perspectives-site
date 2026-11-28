/* Perspectives: the submission form on contribution.html.
 *
 * Any file type. No sign-in page first: the form's email and password sign
 * the person in, or create the account on the spot (no email is sent).
 * Files go straight from the browser to Supabase Storage through signed upload
 * URLs from /api/submit; the page then tells the server they arrived, and shows
 * "My submissions" with each one's status. Old progress links
 * (contribution.html?t=<token>) still show their submission.
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
      "c.addFiles": "+ Add files", "c.dropHint": "Pick as many times as you like, or drag files here. Pictures and documents both go here.", "c.remove": "Remove",
      "c.lead": "Writing, art, photos, anything else. Any file type, up to 10 files, 50 MB each. Your email and a password make your account, so you can follow your submissions here any time.",
      "c.password": "Password",
      "c.passwordHint": "First time: choose one (at least 8 characters) and your account is made. Been here before: use the same one.",
      "c.signout": "Not you? Sign out",
      "c.done": "Received. Thank you!",
      "c.mine": "My submissions",
      "c.none": "Nothing here yet.",
      "c.mineHint": "Sign in any time (My account, top right) to see where each one is.",
      "err.password": "The password needs at least 8 characters.",
      "err.login": "This email already has an account, and that password is not right.",
      "err.signin": "Please sign in first.",
      "s.add": "Add to my account",
      "s.added": "Added to your account.",
      "s.other": "This submission belongs to another account.",
      "c.title": "Submit your work",
      "c.name": "Name or pen name",
      "c.email": "Email",
      "c.emailHint": "We write back here.",
      "c.contact": "Other contact (optional)",
      "c.contactHint": "WeChat, Instagram, Xiaohongshu, Bilibili…",
      "c.channelPick": "Choose a platform (optional)",
      "ch.wechat": "WeChat", "ch.xiaohongshu": "Xiaohongshu", "ch.instagram": "Instagram", "ch.whatsapp": "WhatsApp",
      "c.dial": "Country code",
      "ph.wechat": "Phone number (with country code) or WeChat ID",
      "ph.instagram": "Username",
      "ph.xiaohongshu": "Xiaohongshu ID",
      "ph.whatsapp": "Phone number",
      "err.contact": "Fill in your contact detail, or leave the platform blank.",
      "c.workTitle": "Title of the work",
      "c.kind": "Type",
      "k.writing": "Writing", "k.art": "Art", "k.photo": "Photography", "k.other": "Other",
      "c.note": "Anything we should know (optional)",
      "c.files": "Files",
      "c.filesHint": "Any type. Up to 10 files, 50 MB each, 200 MB in all. For something larger, put a link in the note.",
      "c.consent": "This is my own work. I agree that the Perspectives editors may read it; nothing is published without asking me first.",
      "c.send": "Submit",
      "c.sending": "Uploading…",
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
      "c.addFiles": "+ 添加文件", "c.dropHint": "可以多次添加，也可以把文件拖进来。图片和文档都放这里。", "c.remove": "移除",
      "c.lead": "文章、画、摄影，什么都可以。文件格式不限，最多 10 个，每个 50 MB 以内。邮箱加密码就是你的账号，随时能在这里看投稿进度。",
      "c.password": "密码",
      "c.passwordHint": "第一次来：设一个密码（至少 8 位），账号就建好了。来过的：用原来的密码。",
      "c.signout": "不是你？退出登录",
      "c.done": "已收到，谢谢！",
      "c.mine": "我的投稿",
      "c.none": "还没有投稿。",
      "c.mineHint": "以后随时登录（右上角\"我的账号\"）就能看到每篇的进度。",
      "err.password": "密码至少要 8 位。",
      "err.login": "这个邮箱已经有账号了，密码不对。",
      "err.signin": "请先登录。",
      "s.add": "放进我的账号",
      "s.added": "已放进你的账号。",
      "s.other": "这篇投稿属于另一个账号。",
      "c.title": "投稿",
      "c.name": "姓名或笔名",
      "c.email": "邮箱",
      "c.emailHint": "我们会回复到这里。",
      "c.contact": "其他联系方式（选填）",
      "c.contactHint": "微信、Instagram、小红书、B站……",
      "c.channelPick": "请选择平台（选填）",
      "ch.wechat": "微信", "ch.xiaohongshu": "小红书", "ch.instagram": "Instagram", "ch.whatsapp": "WhatsApp",
      "c.dial": "国家电话区号",
      "ph.wechat": "请填入手机号(需加国家区号)/微信号",
      "ph.instagram": "请填入用户名",
      "ph.xiaohongshu": "请填入小红书ID",
      "ph.whatsapp": "请填入电话号码",
      "err.contact": "请填入联系方式，或把上面的平台留空。",
      "c.workTitle": "作品标题",
      "c.kind": "类型",
      "k.writing": "文字", "k.art": "绘画", "k.photo": "摄影", "k.other": "其他",
      "c.note": "想告诉我们的（选填）",
      "c.files": "文件",
      "c.filesHint": "格式不限。最多 10 个文件，每个 50 MB 以内，合计 200 MB 以内。更大的请在上面留下链接。",
      "c.consent": "这是我本人的作品。我同意 Perspectives 编辑阅读它；刊登前会先征得我同意。",
      "c.send": "提交",
      "c.sending": "上传中……",
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
      "c.addFiles": "+ ファイルを追加", "c.dropHint": "何回でも追加できます。ここにドラッグしてもかまいません。画像も文書もここに入れてください。", "c.remove": "削除",
      "c.lead": "文章、絵、写真など、なんでも歓迎します。形式は自由、最大10個、1つ50MBまで。メールアドレスとパスワードがあなたのアカウントになり、ここでいつでも投稿の状況を見られます。",
      "c.password": "パスワード",
      "c.passwordHint": "初めての方：パスワード（8文字以上）を決めるとアカウントができます。2回目以降：同じパスワードを使ってください。",
      "c.signout": "別の人ですか？ログアウト",
      "c.done": "受け取りました。ありがとうございます！",
      "c.mine": "自分の投稿",
      "c.none": "まだ投稿はありません。",
      "c.mineHint": "いつでもログイン（右上の「マイアカウント」）すると、それぞれの状況を確認できます。",
      "err.password": "パスワードは8文字以上にしてください。",
      "err.login": "このメールアドレスはすでに登録されていて、パスワードが違います。",
      "err.signin": "先にログインしてください。",
      "s.add": "自分のアカウントに追加",
      "s.added": "アカウントに追加しました。",
      "s.other": "この投稿は別のアカウントのものです。",
      "c.title": "作品を投稿する",
      "c.name": "名前またはペンネーム",
      "c.email": "メールアドレス",
      "c.emailHint": "お返事はこちらに送ります。",
      "c.contact": "その他の連絡先（任意）",
      "c.contactHint": "WeChat、Instagram、小紅書、ビリビリなど",
      "c.channelPick": "プラットフォームを選ぶ（任意）",
      "ch.wechat": "WeChat", "ch.xiaohongshu": "小紅書", "ch.instagram": "Instagram", "ch.whatsapp": "WhatsApp",
      "c.dial": "国番号",
      "ph.wechat": "電話番号（国番号付き）またはWeChat ID",
      "ph.instagram": "ユーザー名",
      "ph.xiaohongshu": "小紅書ID",
      "ph.whatsapp": "電話番号",
      "err.contact": "連絡先を入力するか、上の選択を空にしてください。",
      "c.workTitle": "作品のタイトル",
      "c.kind": "種類",
      "k.writing": "文章", "k.art": "絵", "k.photo": "写真", "k.other": "その他",
      "c.note": "伝えたいこと（任意）",
      "c.files": "ファイル",
      "c.filesHint": "形式は自由。最大10個、1つ50MBまで、合計200MBまで。それより大きいものはリンクを書いてください。",
      "c.consent": "これは自分の作品です。Perspectives編集部が読むことに同意します。掲載する前に必ず確認があります。",
      "c.send": "投稿する",
      "c.sending": "アップロード中…",
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
      "c.addFiles": "+ 파일 추가", "c.dropHint": "여러 번 추가할 수 있고, 여기로 끌어다 놓아도 됩니다. 이미지와 문서 모두 여기에 넣으세요.", "c.remove": "삭제",
      "c.lead": "글, 그림, 사진 등 무엇이든 좋습니다. 형식은 자유, 최대 10개, 파일당 50MB까지. 이메일과 비밀번호가 곧 계정이 되어, 여기서 언제든 투고 진행 상황을 볼 수 있습니다.",
      "c.password": "비밀번호",
      "c.passwordHint": "처음이라면 비밀번호(8자 이상)를 정하면 계정이 만들어집니다. 전에 온 적이 있다면 같은 비밀번호를 쓰세요.",
      "c.signout": "본인이 아닌가요? 로그아웃",
      "c.done": "잘 받았습니다. 감사합니다!",
      "c.mine": "내 투고",
      "c.none": "아직 투고가 없습니다.",
      "c.mineHint": "언제든 로그인하면(오른쪽 위 \"내 계정\") 각 투고의 진행 상황을 볼 수 있습니다.",
      "err.password": "비밀번호는 8자 이상이어야 합니다.",
      "err.login": "이미 가입된 이메일인데 비밀번호가 맞지 않습니다.",
      "err.signin": "먼저 로그인해 주세요.",
      "s.add": "내 계정에 추가",
      "s.added": "계정에 추가했습니다.",
      "s.other": "이 투고는 다른 계정의 것입니다.",
      "c.title": "작품 투고",
      "c.name": "이름 또는 필명",
      "c.email": "이메일",
      "c.emailHint": "이 주소로 답장을 보냅니다.",
      "c.contact": "다른 연락처 (선택)",
      "c.contactHint": "WeChat, Instagram, 샤오훙수, 빌리빌리 등",
      "c.channelPick": "플랫폼 선택 (선택)",
      "ch.wechat": "WeChat", "ch.xiaohongshu": "샤오훙수", "ch.instagram": "Instagram", "ch.whatsapp": "WhatsApp",
      "c.dial": "국가 번호",
      "ph.wechat": "전화번호(국가 번호 포함) 또는 WeChat ID",
      "ph.instagram": "사용자 이름",
      "ph.xiaohongshu": "샤오훙수 ID",
      "ph.whatsapp": "전화번호",
      "err.contact": "연락처를 입력하거나 위의 플랫폼을 비워 두세요.",
      "c.workTitle": "작품 제목",
      "c.kind": "종류",
      "k.writing": "글", "k.art": "그림", "k.photo": "사진", "k.other": "기타",
      "c.note": "전하고 싶은 말 (선택)",
      "c.files": "파일",
      "c.filesHint": "형식은 자유입니다. 최대 10개, 파일당 50MB, 합계 200MB까지. 더 큰 파일은 위에 링크를 남겨 주세요.",
      "c.consent": "본인의 작품입니다. Perspectives 편집부가 읽는 데 동의합니다. 게재 전에는 반드시 먼저 동의를 구합니다.",
      "c.send": "투고하기",
      "c.sending": "업로드 중…",
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
      else if (k === "on") Object.keys(attrs.on).forEach(function (e) { n.addEventListener(e, attrs.on[e]); });
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
        var k = err && err.key === "err.claimed" ? "s.other" : "err.server";
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

  /* ---------------- other contact: platform first ---------------- */

  // 先选平台，再填对应账号；WhatsApp 是电话号码，所以前面带国家区号
  var CHANNELS = [
    { key: "wechat", label: "WeChat", dial: false, type: "text" },
    { key: "xiaohongshu", label: "Xiaohongshu", dial: false, type: "text" },
    { key: "instagram", label: "Instagram", dial: false, type: "text" },
    { key: "whatsapp", label: "WhatsApp", dial: true, type: "tel" }
  ];

  // 常用国家电话区号。中国排在最前，作为默认值
  var DIAL = [
    ["+86", "China"], ["+852", "Hong Kong"], ["+853", "Macao"], ["+886", "Taiwan"],
    ["+81", "Japan"], ["+82", "Korea"], ["+65", "Singapore"], ["+60", "Malaysia"],
    ["+62", "Indonesia"], ["+63", "Philippines"], ["+66", "Thailand"], ["+84", "Vietnam"],
    ["+855", "Cambodia"], ["+856", "Laos"], ["+95", "Myanmar"], ["+91", "India"],
    ["+92", "Pakistan"], ["+94", "Sri Lanka"], ["+880", "Bangladesh"], ["+976", "Mongolia"],
    ["+1", "US / Canada"], ["+44", "UK"], ["+61", "Australia"], ["+64", "New Zealand"],
    ["+33", "France"], ["+49", "Germany"], ["+39", "Italy"], ["+34", "Spain"],
    ["+31", "Netherlands"], ["+32", "Belgium"], ["+41", "Switzerland"], ["+43", "Austria"],
    ["+46", "Sweden"], ["+47", "Norway"], ["+45", "Denmark"], ["+358", "Finland"],
    ["+353", "Ireland"], ["+351", "Portugal"], ["+30", "Greece"], ["+48", "Poland"],
    ["+420", "Czechia"], ["+36", "Hungary"], ["+40", "Romania"], ["+7", "Russia"],
    ["+380", "Ukraine"], ["+90", "Türkiye"], ["+972", "Israel"], ["+971", "UAE"],
    ["+966", "Saudi Arabia"], ["+20", "Egypt"], ["+27", "South Africa"], ["+234", "Nigeria"],
    ["+254", "Kenya"], ["+55", "Brazil"], ["+52", "Mexico"], ["+54", "Argentina"],
    ["+56", "Chile"], ["+57", "Colombia"], ["+51", "Peru"]
  ];

  function channelAt(key) {
    for (var i = 0; i < CHANNELS.length; i++) if (CHANNELS[i].key === key) return CHANNELS[i];
    return null;
  }

  /* ---------------- form view ---------------- */

  function field(id, labelKey, input, hintKey) {
    return el("div", { class: "c-field" }, [
      el("label", { for: id, i18n: labelKey }),
      input,
      hintKey ? el("p", { class: "c-hint", i18n: hintKey }) : null
    ]);
  }

  function formView(sess) {
    var kind = el("select", { id: "c-kind", name: "kind" }, ["writing", "art", "photo", "other"].map(function (k) {
      return el("option", { value: k, i18n: "k." + k });
    }));
    // The browser's own file box replaces its choice each time it is used, so
    // the form keeps its own list: every pick (or drop) adds to it, and each
    // file has a remove button. Pictures and documents go in the same list.
    var fileInput = el("input", { id: "c-files", name: "files", type: "file", multiple: "", class: "c-fileinput" });
    var picked = [];
    var drop = el("label", { for: "c-files", class: "c-drop" }, [
      el("span", { class: "c-drop-btn", i18n: "c.addFiles" }),
      el("span", { class: "c-hint", i18n: "c.dropHint" })
    ]);
    var list = el("ul", { class: "c-filelist" });
    var consent = el("input", { id: "c-consent", type: "checkbox" });
    var error = el("p", { class: "c-error", role: "alert" });
    var send = el("button", { type: "submit", class: "c-send", i18n: "c.send" });

    // 已登录：邮箱就是账号邮箱（不能改），下面给一行"不是你？退出登录"。
    // 没登录：表单里多一个密码栏，提交时登录或当场建账号，不先跳登录页。
    var emailInput = el("input", { id: "c-email", name: "email", type: "email", maxlength: "120", autocomplete: "email", required: "" });
    if (sess) { emailInput.value = sess.user.email; emailInput.readOnly = true; }
    var who = sess
      ? el("p", { class: "c-hint c-who" }, [
          el("span", { text: sess.user.email + " · " }),
          el("button", { type: "button", class: "c-linkbtn", i18n: "c.signout", on: { click: function () {
            SB.auth.signOut().then(function () { location.reload(); });
          } } })
        ])
      : field("c-pass", "c.password", el("input", { id: "c-pass", name: "password", type: "password", minlength: "8", autocomplete: "current-password", required: "" }), "c.passwordHint");

    // 其他联系方式：平台下拉 -> 出现对应的填空（WhatsApp 前面多一个国家区号）
    var channel = el("select", { id: "c-channel" }, [el("option", { value: "", i18n: "c.channelPick" })].concat(
      CHANNELS.map(function (c) { return el("option", { value: c.key, i18n: "ch." + c.key }); })
    ));
    var dial = el("select", { id: "c-dial", "aria-label": t("c.dial") }, DIAL.map(function (d) {
      return el("option", { value: d[0], text: d[0] + " " + d[1] });
    }));
    var contact = el("input", { id: "c-contact", maxlength: "120", autocomplete: "off" });
    var contactRow = el("div", { class: "c-contact-row", hidden: "" }, [dial, contact]);
    var contactField = el("div", { class: "c-field" }, [
      el("label", { for: "c-channel", i18n: "c.contact" }),
      channel,
      contactRow
    ]);

    // 换了平台：提示词、是否显示区号、键盘类型都跟着换；换平台时清空旧内容
    var lastChannel = null;
    function syncChannel() {
      var c = channelAt(channel.value);
      if (channel.value !== lastChannel) { contact.value = ""; lastChannel = channel.value; }
      contactRow.hidden = !c;
      dial.hidden = !(c && c.dial);
      if (!c) {
        contact.removeAttribute("data-i18n-ph");
        contact.removeAttribute("placeholder");
        contact.setAttribute("type", "text");
        return;
      }
      contact.setAttribute("data-i18n-ph", "ph." + c.key);
      contact.setAttribute("placeholder", t("ph." + c.key));
      contact.setAttribute("type", c.type);
    }
    channel.addEventListener("change", function () {
      syncChannel();
      if (channel.value) contact.focus();
    });
    syncChannel();
    function contactValue() {
      var c = channelAt(channel.value);
      var raw = contact.value.trim();
      if (!c || !raw) return "";
      return c.label + ": " + (c.dial ? dial.value + " " : "") + raw;
    }

    var form = el("form", { class: "c-form", novalidate: "" }, [
      field("c-name", "c.name", el("input", { id: "c-name", name: "name", maxlength: "80", autocomplete: "name", required: "" })),
      field("c-email", "c.email", emailInput, sess ? null : "c.emailHint"),
      who,
      contactField,
      field("c-title", "c.workTitle", el("input", { id: "c-title", name: "title", maxlength: "200", required: "" })),
      field("c-kind", "c.kind", kind),
      field("c-note", "c.note", el("textarea", { id: "c-note", name: "note", rows: "4", maxlength: "2000" })),
      el("div", { class: "c-field" }, [
        el("span", { class: "c-label", i18n: "c.files" }),
        fileInput, drop,
        el("p", { class: "c-hint", i18n: "c.filesHint" })
      ]),
      list,
      el("label", { class: "c-consent", for: "c-consent" }, [consent, el("span", { i18n: "c.consent" })]),
      error,
      send
    ]);

    var bars = [];
    function showFiles() {
      list.replaceChildren();
      bars = [];
      picked.forEach(function (f, i) {
        var bar = el("span", { class: "c-bar" });
        bars.push(bar);
        list.appendChild(el("li", {}, [
          el("span", { class: "c-fname", text: f.name }),
          el("span", { class: "c-fsize", text: fmtSize(f.size) }),
          el("button", { type: "button", class: "c-remove", "aria-label": t("c.remove") + " " + f.name, text: "×", on: { click: function () {
            if (fileInput.disabled) return;
            picked.splice(i, 1); showFiles();
          } } }),
          bar
        ]));
      });
    }
    function addFiles(fileList) {
      error.textContent = ""; error.removeAttribute("data-i18n");
      Array.prototype.forEach.call(fileList, function (f) {
        var dup = picked.some(function (g) { return g.name === f.name && g.size === f.size && g.lastModified === f.lastModified; });
        if (!dup) picked.push(f);
      });
      fileInput.value = "";
      showFiles();
    }
    fileInput.addEventListener("change", function () { addFiles(fileInput.files); });
    ["dragenter", "dragover"].forEach(function (ev) {
      drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("is-over"); });
    });
    ["dragleave", "drop"].forEach(function (ev) {
      drop.addEventListener(ev, function () { drop.classList.remove("is-over"); });
    });
    drop.addEventListener("drop", function (e) {
      e.preventDefault();
      if (!fileInput.disabled && e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files);
    });

    function fail(key) {
      error.setAttribute("data-i18n", key);
      error.textContent = t(key);
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = function (id) { return document.getElementById(id).value.trim(); };
      var files = picked.slice();
      var total = files.reduce(function (n, f) { return n + f.size; }, 0);
      if (!v("c-name")) return fail("err.name");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v("c-email"))) return fail("err.email");
      if (!sess && document.getElementById("c-pass").value.length < 8) return fail("err.password");
      if (!v("c-title")) return fail("err.title");
      if (channel.value && !contact.value.trim()) return fail("err.contact");
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
      (sess ? Promise.resolve(sess) : ensureAccount(v("c-email"), document.getElementById("c-pass").value))
        .catch(function (err) {
          throw Object.assign(err, { key: err.key || (/password/i.test(String(err.message)) ? "err.password" : "err.server") });
        })
        .then(function () {
          return api("/api/submit", {
        action: "start", name: v("c-name"), email: v("c-email"), contact: contactValue(),
        title: v("c-title"), kind: kind.value, note: document.getElementById("c-note").value,
        files: files.map(function (f) { return { name: f.name, size: f.size, type: f.type }; })
          });
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
        mineView("c.done");
      }).catch(function (err) {
        fail(err.key || "err.server");
        send.disabled = false; send.setAttribute("data-i18n", "c.send"); send.textContent = t("c.send");
        fileInput.disabled = false;
      });
    });

    root.replaceChildren(el("h2", { i18n: "c.title" }), el("p", { class: "c-lead", i18n: "c.lead" }), form);
    apply();
  }

  /* ---------------- accounts ---------------- */

  var SB = window.supabase && window.supabase.createClient(
    "https://itnylaavtwmhvzepmxrt.supabase.co",
    "sb_publishable_zrfDWNTiHJSEdaK4lxlo3Q_3vz08ZR_" // public by design
  );
  function session() {
    return SB ? SB.auth.getSession().then(function (r) { return r.data && r.data.session; }) : Promise.resolve(null);
  }

  // Sign in; if the email has no account yet, create one. No email is sent:
  // sign-up is instant, so the submission form doubles as the sign-up form.
  function ensureAccount(email, password) {
    if (!SB) return Promise.reject(Object.assign(new Error("no auth"), { key: "err.server" }));
    return SB.auth.signInWithPassword({ email: email, password: password }).then(function (r) {
      if (!r.error) return r.data.session;
      if (!/invalid login/i.test(r.error.message)) throw r.error;
      return SB.auth.signUp({ email: email, password: password }).then(function (s) {
        if (s.error && /already registered/i.test(s.error.message)) throw Object.assign(new Error("login"), { key: "err.login" });
        if (s.error) throw s.error;
        if (!s.data.session) throw Object.assign(new Error("login"), { key: "err.login" });
        return s.data.session;
      });
    });
  }

  // Old progress links: add that submission to the signed-in account.
  function claim(token) {
    return session().then(function (s) {
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

  /* ---------------- my submissions ---------------- */

  function mineView(notice) {
    session().then(function (sess) {
      if (!sess) return formView(null);
      return SB.from("submissions").select("title,status,created_at")
        .eq("user_id", sess.user.id).order("created_at", { ascending: false })
        .then(function (r) {
          var rows = r.data || [];
          put(
            notice ? el("h2", { i18n: notice }) : null,
            el("h3", { i18n: "c.mine" }),
            rows.length ? el("ul", { class: "c-mine" }, rows.map(function (s) {
              return el("li", {}, [
                el("span", { class: "c-mine-title", text: s.title }),
                el("span", { class: "c-pill c-pill--" + s.status, i18n: "st." + s.status }),
                el("span", { class: "c-hint", text: new Date(s.created_at).toLocaleDateString() })
              ]);
            })) : el("p", { class: "c-hint", i18n: "c.none" }),
            el("p", { class: "c-hint", i18n: "c.mineHint" }),
            el("p", {}, [el("a", { class: "c-link", href: "contribution.html", i18n: "c.another" })])
          );
          apply();
          window.scrollTo(0, 0);
        });
    });
  }

  /* ---------------- start ---------------- */

  var token = new URLSearchParams(location.search).get("t");
  if (token) statusView(token);
  else session().then(formView, function () { formView(null); });
})();
