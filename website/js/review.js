/* Perspectives review dashboard (review.html), for editors and admins.
 *
 * Signs in with Supabase Auth in the browser and reads the tables directly
 * with the public key. Row level security decides what comes back: only
 * profiles with role editor or admin see submissions, can change their status
 * and download the originals; only admins can change people's roles.
 *
 * 界面文案跟随站内语言（lang.js）：字典键以 rv. 开头，这里合并进
 * PerspectivesI18N.translations，切换语言时整页重绘当前视图。
 */
(function () {
  "use strict";

  var SUPABASE_URL = "https://itnylaavtwmhvzepmxrt.supabase.co";
  var SUPABASE_KEY = "sb_publishable_zrfDWNTiHJSEdaK4lxlo3Q_3vz08ZR_"; // public by design
  var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  var I18N = window.PerspectivesI18N;
  var LOCALES = { en: "en-GB", zh: "zh-CN", ja: "ja-JP", ko: "ko-KR" };

  /* ---------------- 词典（只属于审稿页，见文件头） ---------------- */
  var STRINGS = {
    en: {
      "rv.title": "Review | Perspectives",
      "rv.loading": "Loading…",
      "rv.signin": "Sign in",
      "rv.signup": "Create an account",
      "rv.username": "Username",
      "rv.email": "Email",
      "rv.password": "Password",
      "rv.passwordNew": "Password (at least 8 characters)",
      "rv.create": "Create account",
      "rv.noAccount": "No account yet? Create one",
      "rv.haveAccount": "Already have an account? Sign in",
      "rv.signOut": "Sign out",
      "rv.noteConfirm": "Account created. Open the confirmation link we emailed you, then come back and sign in.",
      "rv.errNotConfirmed": "Your email is not confirmed yet. Open the link we emailed you, then sign in.",
      "rv.errLogin": "Wrong email or password.",
      "rv.errExists": "This email already has an account. Sign in instead.",
      "rv.errRate": "Too many emails sent just now. Wait a few minutes and try again.",
      "rv.errShortPassword": "The password needs at least 8 characters.",
      "rv.submissions": "Submissions",
      "rv.waiting": "{n} waiting for review",
      "rv.noneWaiting": "Nothing waiting for review",
      "rv.refresh": "Refresh",
      "rv.filter": "Filter by status",
      "rv.all": "All",
      "rv.empty": "No submissions here yet.",
      "rv.colSent": "Sent",
      "rv.colTitle": "Title",
      "rv.colType": "Type",
      "rv.colBy": "By",
      "rv.colStatus": "Status",
      "rv.detail": "Submission details",
      "rv.by": "By",
      "rv.emailField": "Email",
      "rv.contact": "Other contact",
      "rv.type": "Type",
      "rv.sent": "Sent",
      "rv.account": "Account",
      "rv.note": "Note",
      "rv.signedIn": "Signed in",
      "rv.noAccountTag": "No account",
      "rv.files": "Files",
      "rv.loadingFiles": "Loading files…",
      "rv.noFiles": "No files.",
      "rv.download": "Download",
      "rv.status": "Status",
      "rv.saveStatus": "Save status",
      "rv.saved": "Saved",
      "rv.notSaved": "Not saved: ",
      "rv.noPermission": "no permission",
      "rv.statusHint": "Changing the status does not notify the author; they see it when they open their progress link. Email them if something needs explaining.",
      "rv.members": "People and roles",
      "rv.membersHint": "Everyone starts as a reader. Editors see submissions, change their status and download the files; admins can also change roles.",
      "rv.colJoined": "Joined",
      "rv.colRole": "Role",
      "rv.searchMembers": "Search by username or email",
      "rv.memberMatches": "{n} of {total}",
      "rv.noMemberMatch": "No member matches that search.",
      "rv.clearSearch": "Clear search",
      "rv.changed": "Changed",
      "rv.roleFor": "Role for {email}",
      "rv.noAccess": "No review access yet",
      "rv.readerNote": "Your account ({email}) is a reader. Ask an admin to make you an editor.",
      "rv.error": "Something went wrong: {msg}",
      "rv.status.received": "Received",
      "rv.status.reviewing": "In review",
      "rv.status.revise": "Changes requested",
      "rv.status.accepted": "Accepted",
      "rv.status.published": "Published",
      "rv.status.declined": "Declined",
      "rv.status.uploading": "Upload unfinished",
      "rv.kind.writing": "Writing",
      "rv.kind.art": "Art",
      "rv.kind.photo": "Photography",
      "rv.kind.other": "Other",
      "rv.role.reader": "Reader",
      "rv.role.writer": "Writer",
      "rv.role.editor": "Editor",
      "rv.role.admin": "Admin"
    },
    zh: {
      "rv.title": "审稿 | Perspectives",
      "rv.loading": "加载中…",
      "rv.signin": "登录",
      "rv.signup": "注册账号",
      "rv.username": "用户名",
      "rv.email": "邮箱",
      "rv.password": "密码",
      "rv.passwordNew": "密码（至少 8 位）",
      "rv.create": "注册",
      "rv.noAccount": "还没有账号？注册",
      "rv.haveAccount": "已有账号？登录",
      "rv.signOut": "退出登录",
      "rv.noteConfirm": "账号已创建。请打开我们邮件里的确认链接，然后回来登录。",
      "rv.errNotConfirmed": "邮箱还没有确认。请打开我们邮件里的链接确认后再登录。",
      "rv.errLogin": "邮箱或密码不正确。",
      "rv.errExists": "这个邮箱已经注册过了，请直接登录。",
      "rv.errRate": "邮件发送太频繁，请过几分钟再试。",
      "rv.errShortPassword": "密码至少需要 8 个字符。",
      "rv.submissions": "投稿",
      "rv.waiting": "有 {n} 份待审",
      "rv.noneWaiting": "暂时没有待审投稿",
      "rv.refresh": "刷新",
      "rv.filter": "按状态筛选",
      "rv.all": "全部",
      "rv.empty": "这里还没有投稿。",
      "rv.colSent": "提交时间",
      "rv.colTitle": "标题",
      "rv.colType": "类型",
      "rv.colBy": "投稿人",
      "rv.colStatus": "状态",
      "rv.detail": "投稿详情",
      "rv.by": "投稿人",
      "rv.emailField": "邮箱",
      "rv.contact": "其他联系方式",
      "rv.type": "类型",
      "rv.sent": "提交时间",
      "rv.account": "账号",
      "rv.note": "备注",
      "rv.signedIn": "已登录",
      "rv.noAccountTag": "无账号",
      "rv.files": "文件",
      "rv.loadingFiles": "正在加载文件…",
      "rv.noFiles": "没有文件。",
      "rv.download": "下载",
      "rv.status": "状态",
      "rv.saveStatus": "保存状态",
      "rv.saved": "已保存",
      "rv.notSaved": "未保存：",
      "rv.noPermission": "没有权限",
      "rv.statusHint": "修改状态不会通知作者；作者打开进度链接时才能看到。如需解释，请单独邮件联系。",
      "rv.members": "成员与角色",
      "rv.membersHint": "每个人默认都是读者。编辑可以查看投稿、修改状态并下载文件；管理员还可以调整角色。",
      "rv.colJoined": "加入时间",
      "rv.colRole": "角色",
      "rv.searchMembers": "搜索用户名或邮箱",
      "rv.memberMatches": "{n} / 共 {total} 人",
      "rv.noMemberMatch": "没有匹配的成员。",
      "rv.clearSearch": "清除搜索",
      "rv.changed": "已更新",
      "rv.roleFor": "{email} 的角色",
      "rv.noAccess": "暂无审稿权限",
      "rv.readerNote": "你的账号（{email}）是读者。请让管理员把你设为编辑。",
      "rv.error": "出错了：{msg}",
      "rv.status.received": "已收到",
      "rv.status.reviewing": "审核中",
      "rv.status.revise": "需要修改",
      "rv.status.accepted": "已接受",
      "rv.status.published": "已发布",
      "rv.status.declined": "已拒绝",
      "rv.status.uploading": "上传未完成",
      "rv.kind.writing": "文字",
      "rv.kind.art": "美术",
      "rv.kind.photo": "摄影",
      "rv.kind.other": "其他",
      "rv.role.reader": "读者",
      "rv.role.writer": "作者",
      "rv.role.editor": "编辑",
      "rv.role.admin": "管理员"
    },
    ja: {
      "rv.title": "レビュー | Perspectives",
      "rv.loading": "読み込み中…",
      "rv.signin": "ログイン",
      "rv.signup": "アカウントを作成",
      "rv.username": "ユーザー名",
      "rv.email": "メールアドレス",
      "rv.password": "パスワード",
      "rv.passwordNew": "パスワード（8文字以上）",
      "rv.create": "作成する",
      "rv.noAccount": "アカウントがない場合は新規登録",
      "rv.haveAccount": "アカウントをお持ちの方はログイン",
      "rv.signOut": "ログアウト",
      "rv.noteConfirm": "アカウントを作成しました。届いた確認メールのリンクを開いてから、戻ってログインしてください。",
      "rv.errNotConfirmed": "メールアドレスが未確認です。確認メールのリンクを開いてからログインしてください。",
      "rv.errLogin": "メールアドレスまたはパスワードが違います。",
      "rv.errExists": "このメールアドレスは登録済みです。ログインしてください。",
      "rv.errRate": "メールの送信が集中しています。数分おいてからお試しください。",
      "rv.errShortPassword": "パスワードは8文字以上必要です。",
      "rv.submissions": "投稿一覧",
      "rv.waiting": "未対応 {n} 件",
      "rv.noneWaiting": "未対応の投稿はありません",
      "rv.refresh": "更新",
      "rv.filter": "ステータスで絞り込む",
      "rv.all": "すべて",
      "rv.empty": "まだ投稿はありません。",
      "rv.colSent": "送信日時",
      "rv.colTitle": "タイトル",
      "rv.colType": "種類",
      "rv.colBy": "投稿者",
      "rv.colStatus": "ステータス",
      "rv.detail": "投稿の詳細",
      "rv.by": "投稿者",
      "rv.emailField": "メールアドレス",
      "rv.contact": "その他の連絡先",
      "rv.type": "種類",
      "rv.sent": "送信日時",
      "rv.account": "アカウント",
      "rv.note": "備考",
      "rv.signedIn": "ログイン済み",
      "rv.noAccountTag": "アカウントなし",
      "rv.files": "ファイル",
      "rv.loadingFiles": "ファイルを読み込み中…",
      "rv.noFiles": "ファイルはありません。",
      "rv.download": "ダウンロード",
      "rv.status": "ステータス",
      "rv.saveStatus": "ステータスを保存",
      "rv.saved": "保存しました",
      "rv.notSaved": "保存できませんでした：",
      "rv.noPermission": "権限がありません",
      "rv.statusHint": "ステータスを変えても作者に通知されません。作者が進捗リンクを開いたときに表示されます。説明が必要なら個別にメールしてください。",
      "rv.members": "メンバーと役割",
      "rv.membersHint": "全員が最初は読者です。編集者は投稿の閲覧・ステータス変更・ファイルのダウンロードができ、管理者は役割も変更できます。",
      "rv.colJoined": "参加日",
      "rv.colRole": "役割",
      "rv.searchMembers": "ユーザー名またはメールで検索",
      "rv.memberMatches": "{n} / {total} 人",
      "rv.noMemberMatch": "該当するメンバーはいません。",
      "rv.clearSearch": "検索をクリア",
      "rv.changed": "変更しました",
      "rv.roleFor": "{email} の役割",
      "rv.noAccess": "レビュー権限がありません",
      "rv.readerNote": "あなたのアカウント（{email}）は読者です。管理者に編集者への変更を依頼してください。",
      "rv.error": "エラーが発生しました：{msg}",
      "rv.status.received": "受信済み",
      "rv.status.reviewing": "レビュー中",
      "rv.status.revise": "修正依頼",
      "rv.status.accepted": "受理",
      "rv.status.published": "公開済み",
      "rv.status.declined": "不採用",
      "rv.status.uploading": "アップロード未完了",
      "rv.kind.writing": "文章",
      "rv.kind.art": "アート",
      "rv.kind.photo": "写真",
      "rv.kind.other": "その他",
      "rv.role.reader": "読者",
      "rv.role.writer": "投稿者",
      "rv.role.editor": "編集者",
      "rv.role.admin": "管理者"
    },
    ko: {
      "rv.title": "검토 | Perspectives",
      "rv.loading": "불러오는 중…",
      "rv.signin": "로그인",
      "rv.signup": "계정 만들기",
      "rv.username": "사용자 이름",
      "rv.email": "이메일",
      "rv.password": "비밀번호",
      "rv.passwordNew": "비밀번호 (8자 이상)",
      "rv.create": "계정 만들기",
      "rv.noAccount": "계정이 없으신가요? 회원가입",
      "rv.haveAccount": "이미 계정이 있으신가요? 로그인",
      "rv.signOut": "로그아웃",
      "rv.noteConfirm": "계정이 만들어졌습니다. 보내드린 확인 메일의 링크를 연 뒤 다시 로그인해 주세요.",
      "rv.errNotConfirmed": "이메일이 아직 확인되지 않았습니다. 확인 메일의 링크를 연 뒤 로그인해 주세요.",
      "rv.errLogin": "이메일 또는 비밀번호가 올바르지 않습니다.",
      "rv.errExists": "이미 가입된 이메일입니다. 로그인해 주세요.",
      "rv.errRate": "메일 발송이 너무 잦습니다. 몇 분 뒤 다시 시도해 주세요.",
      "rv.errShortPassword": "비밀번호는 8자 이상이어야 합니다.",
      "rv.submissions": "투고 목록",
      "rv.waiting": "검토 대기 {n}건",
      "rv.noneWaiting": "검토 대기 중인 투고가 없습니다",
      "rv.refresh": "새로고침",
      "rv.filter": "상태로 필터",
      "rv.all": "전체",
      "rv.empty": "아직 투고가 없습니다.",
      "rv.colSent": "보낸 시각",
      "rv.colTitle": "제목",
      "rv.colType": "유형",
      "rv.colBy": "작성자",
      "rv.colStatus": "상태",
      "rv.detail": "투고 상세",
      "rv.by": "작성자",
      "rv.emailField": "이메일",
      "rv.contact": "기타 연락처",
      "rv.type": "유형",
      "rv.sent": "보낸 시각",
      "rv.account": "계정",
      "rv.note": "비고",
      "rv.signedIn": "로그인됨",
      "rv.noAccountTag": "계정 없음",
      "rv.files": "파일",
      "rv.loadingFiles": "파일 불러오는 중…",
      "rv.noFiles": "파일이 없습니다.",
      "rv.download": "다운로드",
      "rv.status": "상태",
      "rv.saveStatus": "상태 저장",
      "rv.saved": "저장됨",
      "rv.notSaved": "저장하지 못했습니다: ",
      "rv.noPermission": "권한 없음",
      "rv.statusHint": "상태를 바꿔도 작성자에게 알림이 가지 않습니다. 작성자가 진행 링크를 열 때 확인할 수 있습니다. 설명이 필요하면 따로 메일을 보내세요.",
      "rv.members": "멤버와 역할",
      "rv.membersHint": "모든 사용자는 독자로 시작합니다. 편집자는 투고를 보고 상태를 바꾸며 파일을 내려받을 수 있고, 관리자는 역할도 바꿀 수 있습니다.",
      "rv.colJoined": "가입일",
      "rv.colRole": "역할",
      "rv.searchMembers": "사용자 이름 또는 이메일 검색",
      "rv.memberMatches": "{n} / 전체 {total}명",
      "rv.noMemberMatch": "일치하는 멤버가 없습니다.",
      "rv.clearSearch": "검색 지우기",
      "rv.changed": "변경됨",
      "rv.roleFor": "{email}의 역할",
      "rv.noAccess": "검토 권한이 없습니다",
      "rv.readerNote": "회원님의 계정({email})은 독자입니다. 관리자에게 편집자로 변경해 달라고 요청하세요.",
      "rv.error": "문제가 발생했습니다: {msg}",
      "rv.status.received": "접수됨",
      "rv.status.reviewing": "검토 중",
      "rv.status.revise": "수정 요청",
      "rv.status.accepted": "수락됨",
      "rv.status.published": "게시됨",
      "rv.status.declined": "거절됨",
      "rv.status.uploading": "업로드 미완료",
      "rv.kind.writing": "글",
      "rv.kind.art": "미술",
      "rv.kind.photo": "사진",
      "rv.kind.other": "기타",
      "rv.role.reader": "독자",
      "rv.role.writer": "작성자",
      "rv.role.editor": "편집자",
      "rv.role.admin": "관리자"
    }
  };

  // 并进站内词典，让 lang.js 的 setLanguage 也能翻译带 data-i18n 的节点（如标题）。
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

  var STATUS = ["received", "reviewing", "revise", "accepted", "published", "declined", "uploading"];
  var KINDS = ["writing", "art", "photo", "other"];
  var ROLE_CODES = ["reader", "writer", "editor", "admin"];
  var COLS = "id,created_at,name,email,contact,title,kind,note,status,user_id";

  function statusName(code) { return t("rv.status." + code); }
  function kindName(code) { return t("rv.kind." + code); }
  function roleName(code) { return t("rv.role." + code); }

  var app = document.getElementById("app");
  var meEl = document.getElementById("me");
  var state = {
    user: null, role: null, filter: "active", subs: [], open: null,
    view: null, mode: "signin", note: null, lastError: null,
    memberQuery: ""
  };

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
  function size(n) { return n >= 1048576 ? (n / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(n / 1024)) + " KB"; }
  // Supabase's own messages, made plainer.
  function authError(err) {
    var m = String(err && err.message || err);
    if (/not confirmed/i.test(m)) return t("rv.errNotConfirmed");
    if (/invalid login/i.test(m)) return t("rv.errLogin");
    if (/already registered/i.test(m)) return t("rv.errExists");
    if (/rate limit/i.test(m)) return t("rv.errRate");
    if (/password/i.test(m) && /least/i.test(m)) return t("rv.errShortPassword");
    return m;
  }
  function errorBox(msg) { return el("p", { class: "r-error", role: "alert", text: msg }); }

  /* ---------------- sign in / sign up ---------------- */

  function authView(mode, note) {
    state.view = "auth";
    state.mode = mode;
    state.note = note || null;
    var signup = mode === "signup";
    var msg = el("p", { class: "r-error", role: "alert" });
    var form = el("form", { class: "r-auth" }, [
      el("h1", { text: signup ? t("rv.signup") : t("rv.signin") }),
      note ? el("p", { class: "r-note", text: note }) : null,
      signup ? el("label", { for: "a-name", text: t("rv.username") }) : null,
      signup ? el("input", { id: "a-name", maxlength: "40", autocomplete: "nickname" }) : null,
      el("label", { for: "a-email", text: t("rv.email") }),
      el("input", { id: "a-email", type: "email", required: true, autocomplete: "email" }),
      el("label", { for: "a-pass", text: signup ? t("rv.passwordNew") : t("rv.password") }),
      el("input", { id: "a-pass", type: "password", required: true, minlength: signup ? "8" : false, autocomplete: signup ? "new-password" : "current-password" }),
      msg,
      el("button", { type: "submit", class: "r-btn", text: signup ? t("rv.create") : t("rv.signin") }),
      el("button", { type: "button", class: "r-link", text: signup ? t("rv.haveAccount") : t("rv.noAccount"), on: { click: function () { authView(signup ? "signin" : "signup"); } } })
    ]);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = document.getElementById("a-email").value.trim();
      var pass = document.getElementById("a-pass").value;
      var btn = form.querySelector(".r-btn"); btn.disabled = true;
      var done = function (res) {
        btn.disabled = false;
        if (res.error) { msg.textContent = authError(res.error); return; }
        if (signup && !res.data.session) authView("signin", t("rv.noteConfirm"));
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
      el("span", { text: (state.user.email || "") + " · " + roleName(state.role) }),
      el("button", { type: "button", class: "r-link", text: t("rv.signOut"), on: { click: function () {
        sb.auth.signOut().then(function () {
          if (window.PerspectivesAuthNav) window.PerspectivesAuthNav.refresh();
          authView("signin");
        });
      } } })
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
    var items = [["active", t("rv.all"), all]].concat(STATUS.map(function (code) { return [code, statusName(code), count(code)]; }));
    return el("nav", { class: "r-tabs", "aria-label": t("rv.filter") }, items.map(function (it) {
      return el("button", {
        type: "button", class: "r-tab" + (state.filter === it[0] ? " is-on" : ""), "aria-pressed": String(state.filter === it[0]),
        on: { click: function () { state.filter = it[0]; state.open = null; render(); } }
      }, [it[1] + " ", el("b", { text: String(it[2]) })]);
    }));
  }

  function list() {
    var rows = visible();
    if (!rows.length) return el("p", { class: "r-muted", text: t("rv.empty") });
    return el("div", { class: "r-tablewrap" }, [el("table", { class: "r-table" }, [
      el("thead", {}, [el("tr", {}, [t("rv.colSent"), t("rv.colTitle"), t("rv.colType"), t("rv.colBy"), t("rv.colStatus")].map(function (h) { return el("th", { text: h }); }))]),
      el("tbody", {}, rows.map(function (s) {
        var tr = el("tr", { class: state.open === s.id ? "is-open" : "", tabindex: "0", on: {
          click: function () { state.open = state.open === s.id ? null : s.id; render(); },
          keydown: function (e) { if (e.key === "Enter") { state.open = state.open === s.id ? null : s.id; render(); } }
        } }, [
          el("td", { class: "r-nowrap", text: when(s.created_at) }),
          el("td", { class: "r-title", text: s.title }),
          el("td", { text: kindName(s.kind) }),
          el("td", { text: s.name }),
          el("td", {}, [el("span", { class: "r-pill r-pill--" + s.status, text: statusName(s.status) })])
        ]);
        return tr;
      }))
    ])]);
  }

  function detail(s) {
    var box = el("section", { class: "r-detail", "aria-label": t("rv.detail") }, [el("h2", { text: s.title })]);
    var dl = el("dl", { class: "r-fields" });
    [[t("rv.by"), s.name], [t("rv.emailField"), s.email], [t("rv.contact"), s.contact || "—"],
     [t("rv.type"), kindName(s.kind)], [t("rv.sent"), when(s.created_at)],
     [t("rv.account"), s.user_id ? t("rv.signedIn") : t("rv.noAccountTag")], [t("rv.note"), s.note || "—"]]
      .forEach(function (f) { dl.appendChild(el("dt", { text: f[0] })); dl.appendChild(el("dd", { text: f[1] })); });
    box.appendChild(dl);

    var files = el("ul", { class: "r-files" }, [el("li", { class: "r-muted", text: t("rv.loadingFiles") })]);
    box.appendChild(el("h3", { text: t("rv.files") }));
    box.appendChild(files);
    sb.from("submission_files").select("path,name,size,type").eq("submission_id", s.id).order("path").then(function (res) {
      if (res.error) { files.replaceChildren(errorBox(res.error.message)); return; }
      files.replaceChildren.apply(files, res.data.map(function (f) {
        var btn = el("button", { type: "button", class: "r-btn r-btn--small", text: t("rv.download") });
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
      if (!res.data.length) files.replaceChildren(el("li", { class: "r-muted", text: t("rv.noFiles") }));
    });

    var sel = el("select", { id: "r-status" }, STATUS.map(function (code) { return el("option", { value: code, selected: code === s.status, text: statusName(code) }); }));
    var saved = el("span", { class: "r-muted", role: "status" });
    var save = el("button", { type: "button", class: "r-btn", text: t("rv.saveStatus") });
    save.addEventListener("click", function () {
      save.disabled = true; saved.textContent = "";
      sb.from("submissions").update({ status: sel.value }).eq("id", s.id).select("status").then(function (res) {
        save.disabled = false;
        if (res.error || !res.data.length) { saved.textContent = t("rv.notSaved") + (res.error ? res.error.message : t("rv.noPermission")); return; }
        s.status = res.data[0].status; saved.textContent = t("rv.saved");
        render();
      });
    });
    box.appendChild(el("div", { class: "r-statusrow" }, [el("label", { for: "r-status", text: t("rv.status") }), sel, save, saved]));
    box.appendChild(el("p", { class: "r-note", text: t("rv.statusHint") }));
    return box;
  }
  function alertIn(node, msg) { node.appendChild(el("li", {}, [errorBox(msg)])); }

  function memberRow(p) {
    var sel = el("select", { "aria-label": t("rv.roleFor", { email: p.email || p.id }) }, ROLE_CODES.map(function (code) { return el("option", { value: code, selected: code === p.role, text: roleName(code) }); }));
    var note = el("span", { class: "r-muted" });
    sel.addEventListener("change", function () {
      sel.disabled = true;
      sb.rpc("set_role", { target: p.id, new_role: sel.value }).then(function (r) {
        sel.disabled = false;
        if (r.error) { note.textContent = r.error.message; sel.value = p.role; } else { p.role = sel.value; note.textContent = t("rv.changed"); }
      });
    });
    return el("tr", {}, [el("td", { text: p.email || "—" }), el("td", { text: p.username || "—" }), el("td", { class: "r-nowrap", text: when(p.created_at) }), el("td", {}, [sel, " ", note])]);
  }

  function members() {
    var h2 = el("h2", { text: t("rv.members") });
    var box = el("section", { class: "r-members" }, [h2, el("p", { class: "r-muted", text: t("rv.loading") })]);
    sb.from("profiles").select("id,email,username,role,created_at").order("created_at").then(function (res) {
      if (res.error) { box.replaceChildren(h2, errorBox(res.error.message)); return; }
      var people = res.data || [];
      var tbody = el("tbody");
      var count = el("span", { class: "r-muted", "aria-live": "polite" });
      var search = el("input", {
        type: "search", id: "r-member-search", class: "r-search",
        placeholder: t("rv.searchMembers"), "aria-label": t("rv.searchMembers"),
        autocomplete: "off", spellcheck: "false"
      });
      search.value = state.memberQuery;
      var table = el("table", { class: "r-table" }, [
        el("thead", {}, [el("tr", {}, [t("rv.emailField"), t("rv.username"), t("rv.colJoined"), t("rv.colRole")].map(function (h) { return el("th", { text: h }); }))]),
        tbody
      ]);
      var fold = function (value) {
        var s = String(value || "");
        if (s.normalize) s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return s.toLowerCase();
      };
      function paint() {
        var q = fold(search.value.trim());
        state.memberQuery = search.value;
        var hits = !q ? people : people.filter(function (p) {
          return fold(p.username).indexOf(q) >= 0 || fold(p.email).indexOf(q) >= 0;
        });
        tbody.replaceChildren.apply(tbody, hits.length
          ? hits.map(memberRow)
          : [el("tr", {}, [el("td", { colspan: "4", class: "r-muted", text: t("rv.noMemberMatch") })])]);
        count.textContent = q ? t("rv.memberMatches", { n: hits.length, total: people.length }) : "";
      }
      search.addEventListener("input", paint);
      paint();
      box.replaceChildren(h2,
        el("p", { class: "r-muted", text: t("rv.membersHint") }),
        el("div", { class: "r-members-tools" }, [search, count]),
        el("div", { class: "r-tablewrap" }, [table]));
    });
    return box;
  }

  function render() {
    state.view = "dash";
    header();
    var open = state.subs.filter(function (s) { return s.id === state.open; })[0];
    var fresh = state.subs.filter(function (s) { return s.status === "received"; }).length;
    app.replaceChildren(
      el("div", { class: "r-head" }, [
        el("h1", { text: t("rv.submissions") }),
        el("span", { class: "r-muted", text: fresh ? t("rv.waiting", { n: fresh }) : t("rv.noneWaiting") }),
        el("button", { type: "button", class: "r-btn r-btn--ghost", text: t("rv.refresh"), on: { click: function () { load().then(render, fail); } } })
      ]),
      tabs(),
      el("div", { class: "r-split" }, [list(), open ? detail(open) : null]),
      state.role === "admin" ? members() : null
    );
  }

  function fail(err) {
    state.view = "error";
    state.lastError = err;
    app.replaceChildren(errorBox(t("rv.error", { msg: err && err.message ? err.message : String(err) })));
  }

  function boot() {
    sb.auth.getUser().then(function (res) {
      var user = res.data && res.data.user;
      if (!user) { authView("signin"); return; }
      state.user = user;
      // The top bar is the site-wide one (js/auth-nav.js); refresh it now that
      // a session exists on this page.
      if (window.PerspectivesAuthNav) window.PerspectivesAuthNav.refresh();
      return sb.from("profiles").select("role").eq("id", user.id).maybeSingle().then(function (p) {
        state.role = p.data ? p.data.role : "reader";
        // Remember it so the top bar of ordinary pages can show the admin
        // badge and the review link without asking again (see js/auth-nav.js).
        try {
          localStorage.setItem("perspectives:nav-role", JSON.stringify({ id: user.id, role: state.role }));
        } catch (e) { /* storage blocked */ }
        if (state.role !== "editor" && state.role !== "admin") {
          state.view = "noaccess";
          header();
          app.replaceChildren(el("div", { class: "r-auth" }, [
            el("h1", { text: t("rv.noAccess") }),
            el("p", { text: t("rv.readerNote", { email: user.email }) })
          ]));
          return;
        }
        return load().then(render);
      });
    }).catch(fail);
  }

  /* 语言切换：重绘当前视图（表单里已输入的内容会重置，切换语言是主动操作，可接受） */
  document.addEventListener("languagechange", function () {
    if (state.view === "dash") render();
    else if (state.view === "auth") authView(state.mode, state.note);
    else if (state.view === "noaccess") boot();
    else if (state.view === "error") fail(state.lastError);
  });

  // 词典合并后把带 data-i18n 的静态节点（页面标题）换成当前语言
  if (I18N && I18N.setLanguage) I18N.setLanguage(I18N.current || "en");

  boot();
})();
