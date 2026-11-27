/* Perspectives: the submission form on contribution.html.
 *
 * Any file type. Files go straight from the browser to Supabase Storage
 * through signed upload URLs from /api/submit; the page then tells the server
 * they arrived. Afterwards the submitter gets a progress link
 * (contribution.html?t=<token>), which shows the submission's status.
 *
 * Words: English and Chinese here, merged into lang.js; Japanese and Korean
 * fall back to English until someone translates them.
 */
(function () {
  "use strict";

  var MB = 1024 * 1024;
  var MAX_FILE = 50 * MB, MAX_FILES = 10, MAX_TOTAL = 200 * MB;

  var WORDS = {
    en: {
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

  function fmtSize(n) {
    return n >= MB ? (n / MB).toFixed(1) + " MB" : Math.max(1, Math.round(n / 1024)) + " KB";
  }

  function api(path, body) {
    return fetch(path, body ? {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
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

  function statusView(token) {
    root.replaceChildren(el("h2", { i18n: "s.heading" }), el("p", { class: "c-muted", text: "…" }));
    api("/api/status?t=" + encodeURIComponent(token)).then(function (s) {
      var date = new Date(s.created_at);
      root.replaceChildren(
        el("h2", { i18n: "s.heading" }),
        el("p", { class: "c-work", text: s.title }),
        el("dl", { class: "c-status" }, [
          el("dt", { i18n: "s.status" }), el("dd", { class: "c-pill c-pill--" + s.status, i18n: "st." + s.status }),
          el("dt", { i18n: "s.files" }), el("dd", { text: String(s.files) }),
          el("dt", { i18n: "s.sent" }), el("dd", { text: date.toLocaleDateString() })
        ]),
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
        doneView(started.token);
      }).catch(function (err) {
        fail(err.key || "err.server");
        send.disabled = false; send.setAttribute("data-i18n", "c.send"); send.textContent = t("c.send");
        fileInput.disabled = false;
      });
    });

    root.replaceChildren(el("h2", { i18n: "c.title" }), el("p", { class: "c-lead", i18n: "c.lead" }), form);
    apply();
  }

  function doneView(token) {
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
  }

  var token = new URLSearchParams(location.search).get("t");
  if (token) statusView(token); else formView();
})();
