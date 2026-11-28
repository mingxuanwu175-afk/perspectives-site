/* Perspectives admin console, "Articles" tab (manage.html). Editors and admins.
 *
 * Upload a laid-out article (PDF + cover image), publish it, and choose which
 * published articles lead the homepage (at most 5, in order; the first one is
 * the big lead story). Files go to the public "articles" bucket under the
 * article's id. The database enforces the rules too: nothing is published
 * without the PDF, the cover and the author's approval of the final layout,
 * and the homepage holds at most 5 (see the articles_before_write trigger).
 *
 * manage.js calls PerspectivesArticlesAdmin.mount(node, ctx) once and
 * repaint() when the language changes.
 */
(function () {
  "use strict";

  var I18N = window.PerspectivesI18N;
  var MB = 1024 * 1024;
  var KINDS = ["writing", "art", "photo", "other"];
  var MAX_FEATURED = 5;

  var STRINGS = {
    en: {
      "mg.tabArticles": "Articles", "mg.tabPeople": "People and roles",
      "ma.heading": "Articles",
      "ma.hint": "Upload the laid-out PDF and a cover image. Published articles appear on the Articles page, newest first. Tick Homepage to put one on the homepage: the first in the order is the big lead story.",
      "ma.new": "New article",
      "ma.f.all": "All", "ma.f.published": "Published", "ma.f.draft": "Drafts", "ma.f.featured": "Homepage",
      "ma.col.title": "Title", "ma.col.type": "Type", "ma.col.issue": "Issue", "ma.col.date": "Date", "ma.col.status": "Status", "ma.col.home": "Homepage",
      "ma.st.published": "Published", "ma.st.draft": "Draft", "ma.st.archived": "Archived",
      "ma.edit": "Edit", "ma.up": "Move up", "ma.down": "Move down", "ma.remove": "Take off homepage",
      "ma.none": "No articles yet.", "ma.homeNone": "Nothing on the homepage yet. Tick Homepage next to a published article.",
      "ma.homeOrder": "Homepage order ({n} of {max}). The first one is the lead story.",
      "ma.homeFull": "The homepage already has 5. Take one off first.",
      "ma.onlyPublished": "Publish it first.",
      "ma.back": "← All articles",
      "ma.newTitle": "New article",
      "ma.fromSub": "From the submission “{title}”. Its files are in Review; upload the laid-out PDF and a cover here.",
      "ma.title": "Title", "ma.author": "Author (as printed)", "ma.type": "Type", "ma.issue": "Issue number",
      "ma.stand": "Summary (one or two sentences, shown under the title)",
      "ma.cover": "Cover image (JPG, PNG or WebP, up to 10 MB)", "ma.pdf": "Laid-out PDF (up to 50 MB)",
      "ma.current": "Current file:", "ma.view": "open",
      "ma.confirm": "The author has seen and approved this final layout.",
      "ma.confirmedAt": "Approval recorded {when}.",
      "ma.save": "Save draft", "ma.saveChanges": "Save changes", "ma.publish": "Publish", "ma.unpublish": "Unpublish",
      "ma.delete": "Delete", "ma.deleteAsk": "Delete “{title}” and its files? This cannot be undone.",
      "ma.saving": "Saving…", "ma.saved": "Saved.",
      "ma.err.title": "Give it a title.", "ma.err.author": "Add the author's name.",
      "ma.err.cover": "The cover must be a JPG, PNG or WebP image under 10 MB.",
      "ma.err.pdf": "The article must be a PDF under 50 MB.",
      "ma.err.ready": "To publish, it needs the PDF, the cover and the author's approval.",
      "ma.err.other": "Something went wrong: {msg}",
      "k.writing": "Writing", "k.art": "Art", "k.photo": "Photography", "k.other": "Other"
    },
    zh: {
      "mg.tabArticles": "文章", "mg.tabPeople": "成员与角色",
      "ma.heading": "文章",
      "ma.hint": "上传排版好的 PDF 和一张封面图。发布后出现在“文章”页，按时间从新到旧。勾选“首页”就放上首页，排在第一的是首页大图头条。",
      "ma.new": "新建文章",
      "ma.f.all": "全部", "ma.f.published": "已发布", "ma.f.draft": "草稿", "ma.f.featured": "首页",
      "ma.col.title": "标题", "ma.col.type": "类型", "ma.col.issue": "期号", "ma.col.date": "日期", "ma.col.status": "状态", "ma.col.home": "首页",
      "ma.st.published": "已发布", "ma.st.draft": "草稿", "ma.st.archived": "已归档",
      "ma.edit": "编辑", "ma.up": "上移", "ma.down": "下移", "ma.remove": "撤下首页",
      "ma.none": "还没有文章。", "ma.homeNone": "首页还没有文章。在已发布的文章旁边勾选“首页”。",
      "ma.homeOrder": "首页顺序（{n} / {max}）。第一篇是大图头条。",
      "ma.homeFull": "首页已经有 5 篇了，先撤下一篇。",
      "ma.onlyPublished": "先发布才能上首页。",
      "ma.back": "← 全部文章",
      "ma.newTitle": "新建文章",
      "ma.fromSub": "来自投稿“{title}”。原始文件在“审稿”里；这里上传排好版的 PDF 和封面。",
      "ma.title": "标题", "ma.author": "作者（按刊登时的署名）", "ma.type": "类型", "ma.issue": "期号",
      "ma.stand": "摘要（一两句话，显示在标题下面）",
      "ma.cover": "封面图（JPG、PNG 或 WebP，10 MB 以内）", "ma.pdf": "排版好的 PDF（50 MB 以内）",
      "ma.current": "当前文件：", "ma.view": "打开",
      "ma.confirm": "作者已看过并同意这份最终排版。",
      "ma.confirmedAt": "已记录作者同意：{when}。",
      "ma.save": "存为草稿", "ma.saveChanges": "保存修改", "ma.publish": "发布", "ma.unpublish": "撤回发布",
      "ma.delete": "删除", "ma.deleteAsk": "删除“{title}”和它的文件？删除后无法恢复。",
      "ma.saving": "保存中…", "ma.saved": "已保存。",
      "ma.err.title": "请填写标题。", "ma.err.author": "请填写作者。",
      "ma.err.cover": "封面必须是 10 MB 以内的 JPG、PNG 或 WebP 图片。",
      "ma.err.pdf": "文章必须是 50 MB 以内的 PDF。",
      "ma.err.ready": "发布需要 PDF、封面和作者同意三样齐全。",
      "ma.err.other": "出错了：{msg}",
      "k.writing": "文章", "k.art": "绘画", "k.photo": "摄影", "k.other": "其他"
    }
  };
  if (I18N && I18N.translations) {
    Object.keys(STRINGS).forEach(function (lang) {
      var dict = I18N.translations[lang] || (I18N.translations[lang] = {});
      Object.keys(STRINGS[lang]).forEach(function (k) { if (!(k in dict)) dict[k] = STRINGS[lang][k]; });
    });
  }

  var ctx, root, rows = [], filter = "all", editing = null, flash = "";

  function t(k, v) { return ctx.t(k, v); }
  function el(a, b, c) { return ctx.el(a, b, c); }
  function fileUrl(path) {
    return path ? ctx.url + "/storage/v1/object/public/articles/" + path.split("/").map(encodeURIComponent).join("/") : "";
  }
  function errText(err) {
    var m = String((err && (err.message || err.error_description)) || err);
    if (/homepage_full/.test(m)) return t("ma.homeFull");
    if (/articles_publish_ready/.test(m)) return t("ma.err.ready");
    return t("ma.err.other", { msg: m });
  }
  function load() {
    return ctx.sb.from("articles").select("*").order("created_at", { ascending: false }).then(function (r) {
      if (r.error) throw r.error;
      rows = r.data || [];
    });
  }
  function update(id, patch) {
    return ctx.sb.from("articles").update(patch).eq("id", id).select().single().then(function (r) {
      if (r.error) throw r.error;
      return r.data;
    });
  }
  function featuredRows() {
    return rows.filter(function (a) { return a.featured; }).sort(function (x, y) { return (x.featured_rank || 0) - (y.featured_rank || 0); });
  }

  /* ---------------- list ---------------- */

  function homeBox(a, note) {
    var box = el("input", { type: "checkbox", "aria-label": t("ma.col.home") + ": " + a.title });
    box.checked = !!a.featured;
    box.disabled = a.status !== "published";
    if (box.disabled) box.title = t("ma.onlyPublished");
    box.addEventListener("change", function () {
      box.disabled = true;
      update(a.id, { featured: box.checked }).then(function () { return load(); }).then(paint, function (err) {
        box.checked = !box.checked; box.disabled = false; note.textContent = errText(err);
      });
    });
    return box;
  }

  function move(list, i, step, note) {
    var a = list[i], b = list[i + step];
    if (!a || !b) return;
    Promise.all([update(a.id, { featured_rank: b.featured_rank }), update(b.id, { featured_rank: a.featured_rank })])
      .then(load).then(paint, function (err) { note.textContent = errText(err); });
  }

  function listView() {
    var note = el("p", { class: "r-error", role: "alert", text: flash });
    flash = "";
    var counts = {
      all: rows.length,
      published: rows.filter(function (a) { return a.status === "published"; }).length,
      draft: rows.filter(function (a) { return a.status !== "published"; }).length,
      featured: featuredRows().length
    };
    var tabs = el("div", { class: "r-tabs" }, ["all", "published", "draft", "featured"].map(function (f) {
      return el("button", { type: "button", class: "r-tab" + (filter === f ? " is-on" : ""), on: { click: function () { filter = f; paint(); } } }, [
        t("ma.f." + f) + " ", el("b", { text: f === "featured" ? counts.featured + "/" + MAX_FEATURED : String(counts[f]) })
      ]);
    }));

    var body;
    if (filter === "featured") {
      var feat = featuredRows();
      body = feat.length ? el("div", {}, [
        el("p", { class: "r-muted", text: t("ma.homeOrder", { n: feat.length, max: MAX_FEATURED }) }),
        el("ol", { class: "ma-order" }, feat.map(function (a, i) {
          return el("li", {}, [
            a.cover_path ? el("img", { class: "ma-thumb", src: fileUrl(a.cover_path), alt: "" }) : el("span", { class: "ma-thumb" }),
            el("div", { class: "ma-order-title" }, [el("b", { text: a.title }), el("span", { class: "r-muted", text: a.author_name })]),
            el("div", { class: "ma-order-btns" }, [
              el("button", { type: "button", class: "r-btn r-btn--ghost r-btn--small", text: "↑", title: t("ma.up"), "aria-label": t("ma.up"), disabled: i === 0, on: { click: function () { move(feat, i, -1, note); } } }),
              el("button", { type: "button", class: "r-btn r-btn--ghost r-btn--small", text: "↓", title: t("ma.down"), "aria-label": t("ma.down"), disabled: i === feat.length - 1, on: { click: function () { move(feat, i, 1, note); } } }),
              el("button", { type: "button", class: "r-link", text: t("ma.remove"), on: { click: function () {
                update(a.id, { featured: false }).then(load).then(paint, function (err) { note.textContent = errText(err); });
              } } })
            ])
          ]);
        }))
      ]) : el("p", { class: "r-muted", text: t("ma.homeNone") });
    } else {
      var hits = rows.filter(function (a) {
        return filter === "all" || (filter === "published" ? a.status === "published" : a.status !== "published");
      });
      body = hits.length ? el("div", { class: "r-tablewrap" }, [el("table", { class: "r-table ma-table" }, [
        el("thead", {}, [el("tr", {}, ["", t("ma.col.title"), t("ma.col.type"), t("ma.col.issue"), t("ma.col.date"), t("ma.col.status"), t("ma.col.home"), ""].map(function (h) {
          return el("th", { text: h });
        }))]),
        el("tbody", {}, hits.map(function (a) {
          return el("tr", {}, [
            el("td", {}, [a.cover_path ? el("img", { class: "ma-thumb", src: fileUrl(a.cover_path), alt: "" }) : el("span", { class: "ma-thumb" })]),
            el("td", {}, [el("div", { class: "r-title", text: a.title }), el("div", { class: "r-muted", text: a.author_name })]),
            el("td", { text: t("k." + a.kind) }),
            el("td", { text: a.issue ? String(a.issue) : "—" }),
            el("td", { class: "r-nowrap", text: ctx.when(a.published_at || a.created_at) }),
            el("td", {}, [el("span", { class: "r-pill r-pill--" + (a.status === "published" ? "published" : "uploading"), text: t("ma.st." + a.status) })]),
            el("td", {}, [homeBox(a, note)]),
            el("td", {}, [el("button", { type: "button", class: "r-btn r-btn--ghost r-btn--small", text: t("ma.edit"), on: { click: function () { editing = a; paint(); } } })])
          ]);
        }))
      ])]) : el("p", { class: "r-muted", text: t("ma.none") });
    }

    return el("section", { class: "ma" }, [
      el("div", { class: "r-head" }, [
        el("h1", { text: t("ma.heading") }),
        el("button", { type: "button", class: "r-btn", text: t("ma.new"), on: { click: function () { editing = {}; paint(); } } })
      ]),
      el("p", { class: "r-muted", text: t("ma.hint") }),
      tabs, note, body
    ]);
  }

  /* ---------------- edit / new ---------------- */

  function formView(a) {
    var isNew = !a.id;
    var msg = el("p", { class: "r-error", role: "alert" });
    function input(id, value, attrs) {
      var n = el("input", Object.assign({ id: id }, attrs || {}));
      n.value = value == null ? "" : value;
      return n;
    }
    var title = input("ma-title", a.title, { maxlength: "200" });
    var author = input("ma-author", a.author_name, { maxlength: "120" });
    var kind = el("select", { id: "ma-kind" }, KINDS.map(function (k) { return el("option", { value: k, text: t("k." + k), selected: (a.kind || "writing") === k }); }));
    var issue = input("ma-issue", a.issue, { type: "number", min: "1", max: "999", inputmode: "numeric" });
    var stand = el("textarea", { id: "ma-stand", rows: "3", maxlength: "300" });
    stand.value = a.standfirst || "";
    var cover = el("input", { id: "ma-cover", type: "file", accept: "image/jpeg,image/png,image/webp" });
    var pdf = el("input", { id: "ma-pdf", type: "file", accept: "application/pdf" });
    var ok = el("input", { id: "ma-ok", type: "checkbox" });
    ok.checked = !!a.author_confirmed;

    function field(id, key, node, extra) {
      return el("div", { class: "ma-field" }, [el("label", { for: id, text: t(key) }), node, extra || null]);
    }
    function current(path) {
      return path ? el("p", { class: "r-note" }, [t("ma.current") + " ", el("a", { href: fileUrl(path), target: "_blank", rel: "noopener", text: path.split("/").pop() + " (" + t("ma.view") + ")" })]) : null;
    }

    var buttons = [];
    function busy(on) { buttons.forEach(function (b) { b.disabled = on; }); if (on) msg.textContent = t("ma.saving"); }

    function upload(id, file, name) {
      var ext = (file.name.match(/\.[a-z0-9]+$/i) || [""])[0].toLowerCase();
      var path = id + "/" + name + "-" + Date.now() + ext;
      return ctx.sb.storage.from("articles").upload(path, file, { contentType: file.type, upsert: false }).then(function (r) {
        if (r.error) throw r.error;
        return path;
      });
    }

    // The homepage carousel shows the first four pages beside the cover (like
    // the screenshots in Steam's featured box). They are drawn here from the
    // PDF with pdf.js and stored as small JPEGs. If pdf.js is missing or the
    // PDF cannot be read, the article is still saved, just without previews.
    function pagePreviews(id, pdfFile) {
      var lib = window.pdfjsLib;
      if (!lib) return Promise.resolve([]);
      lib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      var stamp = Date.now();
      return pdfFile.arrayBuffer().then(function (buf) {
        return lib.getDocument({ data: buf }).promise;
      }).then(function (doc) {
        var n = Math.min(4, doc.numPages), jobs = [];
        for (var i = 1; i <= n; i++) jobs.push(i);
        return jobs.reduce(function (chain, i) {
          return chain.then(function (out) {
            return doc.getPage(i).then(function (page) {
              var v = page.getViewport({ scale: 1 });
              var scale = 640 / v.width;
              var vp = page.getViewport({ scale: scale });
              var canvas = document.createElement("canvas");
              canvas.width = Math.round(vp.width); canvas.height = Math.round(vp.height);
              var g = canvas.getContext("2d");
              g.fillStyle = "#fff"; g.fillRect(0, 0, canvas.width, canvas.height);
              return page.render({ canvasContext: g, viewport: vp }).promise.then(function () {
                return new Promise(function (res) { canvas.toBlob(res, "image/jpeg", 0.82); });
              }).then(function (blob) {
                var path = id + "/page-" + i + "-" + stamp + ".jpg";
                return ctx.sb.storage.from("articles").upload(path, blob, { contentType: "image/jpeg", upsert: false }).then(function (r) {
                  if (r.error) throw r.error;
                  return out.concat([path]);
                });
              });
            });
          });
        }, Promise.resolve([]));
      }).catch(function (err) { console.warn("page previews", err); return []; });
    }

    function save(status) {
      var c = cover.files[0], p = pdf.files[0];
      if (!title.value.trim()) return (msg.textContent = t("ma.err.title"));
      if (!author.value.trim()) return (msg.textContent = t("ma.err.author"));
      if (c && (!/^image\/(jpeg|png|webp)$/.test(c.type) || c.size > 10 * MB)) return (msg.textContent = t("ma.err.cover"));
      if (p && (p.type !== "application/pdf" || p.size > 50 * MB)) return (msg.textContent = t("ma.err.pdf"));
      if (status === "published" && (!ok.checked || !(c || a.cover_path) || !(p || a.pdf_path))) return (msg.textContent = t("ma.err.ready"));
      busy(true);
      var fields = {
        title: title.value.trim(), author_name: author.value.trim(), kind: kind.value,
        issue: issue.value ? parseInt(issue.value, 10) : null, standfirst: stand.value.trim(),
        author_confirmed: ok.checked
      };
      if (!a.id && a.submission_id) fields.submission_id = a.submission_id;
      var old = { cover: a.cover_path, pdf: a.pdf_path, pages: a.page_paths || [] };
      var id = a.id;
      // A new article gets its row first: its id names the folder for its files.
      var start = id ? Promise.resolve(id) : ctx.sb.from("articles").insert(Object.assign({}, fields, { status: "draft" })).select("id").single().then(function (r) {
        if (r.error) throw r.error;
        return (id = r.data.id);
      });
      start.then(function () {
        return Promise.all([c ? upload(id, c, "cover") : null, p ? upload(id, p, "article") : null, p ? pagePreviews(id, p) : null]);
      }).then(function (paths) {
        if (paths[0]) fields.cover_path = paths[0];
        if (paths[1]) fields.pdf_path = paths[1];
        if (paths[2]) fields.page_paths = paths[2];
        if (status) fields.status = status;
        return update(id, fields);
      }).then(function (saved) {
        var stale = [];
        if (fields.cover_path && old.cover) stale.push(old.cover);
        if (fields.pdf_path && old.pdf) stale.push(old.pdf);
        if (fields.page_paths) stale = stale.concat(old.pages);
        if (stale.length) ctx.sb.storage.from("articles").remove(stale);
        return load().then(function () { editing = saved; flash = ""; paint(); root.querySelector(".ma-form .r-error").textContent = t("ma.saved"); });
      }).catch(function (err) {
        busy(false);
        msg.textContent = errText(err);
        if (id && !a.id) { load().then(function () { a = rows.filter(function (r) { return r.id === id; })[0] || a; editing = a; }); }
      });
    }

    function remove() {
      if (!window.confirm(t("ma.deleteAsk", { title: a.title }))) return;
      busy(true);
      ctx.sb.storage.from("articles").list(a.id).then(function (r) {
        var names = (r.data || []).map(function (f) { return a.id + "/" + f.name; });
        return names.length ? ctx.sb.storage.from("articles").remove(names) : null;
      }).then(function () {
        return ctx.sb.from("articles").delete().eq("id", a.id);
      }).then(function (r) {
        if (r && r.error) throw r.error;
        editing = null;
        return load().then(paint);
      }).catch(function (err) { busy(false); msg.textContent = errText(err); });
    }

    var published = a.status === "published";
    function btn(key, cls, fn) { var b = el("button", { type: "button", class: cls, text: t(key), on: { click: fn } }); buttons.push(b); return b; }
    var actions = published
      ? [btn("ma.saveChanges", "r-btn", function () { save(); }), btn("ma.unpublish", "r-btn r-btn--ghost", function () { save("draft"); })]
      : [btn("ma.publish", "r-btn", function () { save("published"); }), btn("ma.save", "r-btn r-btn--ghost", function () { save("draft"); })];
    if (!isNew) actions.push(btn("ma.delete", "r-link ma-delete", remove));

    return el("section", { class: "ma ma-form" }, [
      el("button", { type: "button", class: "r-link", text: t("ma.back"), on: { click: function () { editing = null; paint(); } } }),
      el("h1", { text: isNew ? t("ma.newTitle") : a.title }),
      a.fromTitle ? el("p", { class: "r-note", text: t("ma.fromSub", { title: a.fromTitle }) }) : null,
      isNew ? null : el("p", {}, [el("span", { class: "r-pill r-pill--" + (published ? "published" : "uploading"), text: t("ma.st." + a.status) })]),
      el("div", { class: "ma-grid" }, [
        field("ma-title", "ma.title", title),
        field("ma-author", "ma.author", author),
        field("ma-kind", "ma.type", kind),
        field("ma-issue", "ma.issue", issue),
        field("ma-stand", "ma.stand", stand),
        field("ma-cover", "ma.cover", cover, el("div", {}, [
          a.cover_path ? el("img", { class: "ma-preview", src: fileUrl(a.cover_path), alt: "" }) : null
        ])),
        field("ma-pdf", "ma.pdf", pdf, current(a.pdf_path))
      ]),
      el("label", { class: "ma-ok", for: "ma-ok" }, [ok, el("span", { text: t("ma.confirm") })]),
      a.author_confirmed && a.confirmed_at ? el("p", { class: "r-note", text: t("ma.confirmedAt", { when: ctx.when(a.confirmed_at) }) }) : null,
      msg,
      el("div", { class: "ma-actions" }, actions)
    ]);
  }

  // manage.html?from=<submission id> (the "Put it on the website" link in
  // Review): open that submission's article if it already has one, otherwise
  // a new article filled in from the submission.
  function fromSubmission(id) {
    if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return null;
    var had = rows.filter(function (a) { return a.submission_id === id; })[0];
    if (had) { editing = had; return null; }
    return ctx.sb.from("submissions").select("id,title,name,kind").eq("id", id).maybeSingle().then(function (r) {
      if (r.error) throw r.error;
      if (r.data) editing = { title: r.data.title, author_name: r.data.name, kind: r.data.kind, submission_id: r.data.id, fromTitle: r.data.title };
    });
  }

  function paint() {
    if (!root) return;
    root.replaceChildren(editing ? formView(editing) : listView());
  }

  window.PerspectivesArticlesAdmin = {
    mount: function (node, c) {
      ctx = c; root = node;
      root.replaceChildren(el("p", { class: "r-muted", text: "…" }));
      load().then(function () { return fromSubmission(c.from); }).then(paint, function (err) { root.replaceChildren(el("p", { class: "r-error", text: errText(err) })); });
    },
    // On a language switch, keep what is being typed: repaint the list only.
    repaint: function () { if (!editing) paint(); }
  };
})();
