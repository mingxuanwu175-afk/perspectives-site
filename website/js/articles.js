/* Perspectives: published articles on the public pages.
 *
 *   index.html   <div id="ar-home">  lead story + up to 4 featured cards, then the latest
 *   article.html <div id="ar-list">  every published article, newest first, filter by type and issue
 *   read.html    <div id="ar-read">  one article: details, PDF reader, download
 *
 * Layout follows nature.com: one lead story, a row of cards, and a dated list.
 * Reads the articles table with the public key; row level security only returns
 * published rows. PDFs and covers are public files in the "articles" bucket.
 * Featured articles and their order are set by editors in manage.html.
 */
(function () {
  "use strict";

  var API = "https://itnylaavtwmhvzepmxrt.supabase.co";
  var KEY = "sb_publishable_zrfDWNTiHJSEdaK4lxlo3Q_3vz08ZR_"; // public by design
  var I18N = window.PerspectivesI18N;
  var LOCALES = { en: "en-GB", zh: "zh-CN", ja: "ja-JP", ko: "ko-KR" };
  var FIELDS = "id,title,author_name,kind,issue,standfirst,cover_path,pdf_path,featured,featured_rank,published_at";

  var WORDS = {
    en: {
      "ar.articles": "Articles", "ar.latest": "Latest articles", "ar.all": "All articles",
      "ar.type": "Type", "ar.issue": "Issue", "ar.any": "All", "ar.issueN": "Issue {n}",
      "ar.none": "No articles yet.", "ar.noMatch": "No articles match.",
      "ar.error": "The articles could not be loaded. Try again later.", "ar.missing": "This article is not available.",
      "ar.published": "Published {date}", "ar.by": "By {name}",
      "ar.open": "Open PDF", "ar.download": "Download PDF", "ar.pdfHint": "If the PDF does not show here, open it in a new tab.",
      "k.writing": "Writing", "k.art": "Art", "k.photo": "Photography", "k.other": "Other"
    },
    zh: {
      "ar.articles": "文章", "ar.latest": "最新文章", "ar.all": "全部文章",
      "ar.type": "类型", "ar.issue": "期号", "ar.any": "全部", "ar.issueN": "第 {n} 期",
      "ar.none": "还没有文章。", "ar.noMatch": "没有符合条件的文章。",
      "ar.error": "文章加载失败，请稍后再试。", "ar.missing": "这篇文章不存在或已下线。",
      "ar.published": "发表于 {date}", "ar.by": "作者：{name}",
      "ar.open": "打开 PDF", "ar.download": "下载 PDF", "ar.pdfHint": "如果这里显示不出 PDF，请在新标签页打开。",
      "k.writing": "文章", "k.art": "绘画", "k.photo": "摄影", "k.other": "其他"
    },
    ja: {
      "ar.articles": "記事", "ar.latest": "最新の記事", "ar.all": "すべての記事",
      "ar.type": "種類", "ar.issue": "号", "ar.any": "すべて", "ar.issueN": "第{n}号",
      "ar.none": "まだ記事はありません。", "ar.noMatch": "該当する記事はありません。",
      "ar.error": "記事を読み込めませんでした。しばらくしてからもう一度お試しください。", "ar.missing": "この記事は公開されていません。",
      "ar.published": "{date} 公開", "ar.by": "{name}",
      "ar.open": "PDFを開く", "ar.download": "PDFをダウンロード", "ar.pdfHint": "ここにPDFが表示されない場合は、新しいタブで開いてください。",
      "k.writing": "文章", "k.art": "アート", "k.photo": "写真", "k.other": "その他"
    },
    ko: {
      "ar.articles": "기사", "ar.latest": "최신 기사", "ar.all": "전체 기사",
      "ar.type": "종류", "ar.issue": "호", "ar.any": "전체", "ar.issueN": "제{n}호",
      "ar.none": "아직 기사가 없습니다.", "ar.noMatch": "해당하는 기사가 없습니다.",
      "ar.error": "기사를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.", "ar.missing": "이 기사는 공개되어 있지 않습니다.",
      "ar.published": "{date} 게재", "ar.by": "{name}",
      "ar.open": "PDF 열기", "ar.download": "PDF 다운로드", "ar.pdfHint": "여기에 PDF가 보이지 않으면 새 탭에서 여세요.",
      "k.writing": "글", "k.art": "그림", "k.photo": "사진", "k.other": "기타"
    }
  };

  if (I18N && I18N.translations) {
    Object.keys(WORDS).forEach(function (lang) {
      var dict = I18N.translations[lang] || (I18N.translations[lang] = {});
      Object.keys(WORDS[lang]).forEach(function (k) { if (!(k in dict)) dict[k] = WORDS[lang][k]; });
    });
  }
  function lang() { return (I18N && I18N.current) || "en"; }
  function t(key, vars) {
    var all = (I18N && I18N.translations) || WORDS;
    var text = ((all[lang()] || {})[key]) || WORDS.en[key] || key;
    return vars ? text.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; }) : text;
  }
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === "text") n.textContent = v;
      else if (k === "on") Object.keys(v).forEach(function (e) { n.addEventListener(e, v[e]); });
      else n.setAttribute(k, v === true ? "" : v);
    });
    (kids || []).forEach(function (c) { if (c) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return n;
  }
  function day(iso) {
    return iso ? new Date(iso).toLocaleDateString(LOCALES[lang()] || "en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";
  }
  function file(path, download) {
    if (!path) return "";
    var u = API + "/storage/v1/object/public/articles/" + path.split("/").map(encodeURIComponent).join("/");
    return download ? u + "?download=" + encodeURIComponent(download) : u;
  }
  function href(a) { return "read.html?id=" + encodeURIComponent(a.id); }
  function get(query) {
    return fetch(API + "/rest/v1/articles?select=" + FIELDS + "&status=eq.published&" + query, {
      headers: { apikey: KEY, Authorization: "Bearer " + KEY }
    }).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); });
  }

  /* ---------------- shared pieces ---------------- */

  function cover(a, cls) {
    return a.cover_path ? el("img", { class: cls, src: file(a.cover_path), alt: "", loading: "lazy" }) : el("div", { class: cls + " ar-noimg" });
  }
  function typeLine(a) {
    return el("p", { class: "ar-type" }, [
      el("b", { text: t("k." + a.kind) }),
      a.issue ? el("span", { text: t("ar.issueN", { n: a.issue }) }) : null,
      el("span", { text: day(a.published_at) })
    ]);
  }
  function sectionHead(key, link) {
    var h = el("h2", { class: "ar-sec" }, [link ? el("a", { href: link, text: t(key) + " ›" }) : t(key)]);
    return h;
  }
  // One row of the dated list (nature.com "browse articles").
  function row(a) {
    return el("li", { class: "ar-row" }, [
      el("div", { class: "ar-row-meta" }, [
        el("p", { class: "ar-kind", text: t("k." + a.kind) }),
        a.issue ? el("p", { text: t("ar.issueN", { n: a.issue }) }) : null,
        el("p", { text: day(a.published_at) })
      ]),
      el("div", { class: "ar-row-body" }, [
        el("h3", { class: "ar-title" }, [el("a", { href: href(a), text: a.title })]),
        a.standfirst ? el("p", { class: "ar-stand", text: a.standfirst }) : null,
        a.author_name ? el("p", { class: "ar-author", text: a.author_name }) : null
      ]),
      el("a", { class: "ar-row-img", href: href(a), tabindex: "-1", "aria-hidden": "true" }, [cover(a, "ar-thumb")])
    ]);
  }
  function message(root, key) { root.replaceChildren(el("p", { class: "ar-msg", text: t(key) })); }

  /* ---------------- homepage ---------------- */

  function home(root) {
    var data = null;
    function paint() {
      var feat = data.featured.length ? data.featured : data.latest.slice(0, 5);
      if (!feat.length) return message(root, "ar.none");
      var lead = feat[0];
      var parts = [
        el("a", { class: "ar-lead", href: href(lead) }, [
          el("div", { class: "ar-lead-text" }, [
            el("h2", { class: "ar-lead-title" }, [el("span", { text: lead.title })]),
            lead.standfirst ? el("p", { text: lead.standfirst }) : null,
            lead.author_name ? el("p", { class: "ar-lead-by", text: lead.author_name }) : null
          ]),
          cover(lead, "ar-lead-img")
        ])
      ];
      if (feat.length > 1) {
        parts.push(el("ul", { class: "ar-cards" }, feat.slice(1).map(function (a) {
          return el("li", { class: "ar-card" }, [
            el("a", { href: href(a), tabindex: "-1", "aria-hidden": "true" }, [cover(a, "ar-card-img")]),
            el("h3", { class: "ar-title" }, [el("a", { href: href(a), text: a.title })]),
            a.standfirst ? el("p", { class: "ar-stand", text: a.standfirst }) : null,
            el("div", { class: "ar-card-foot" }, [
              a.author_name ? el("p", { class: "ar-author", text: a.author_name }) : null,
              typeLine(a)
            ])
          ]);
        })));
      }
      var shown = {};
      feat.forEach(function (a) { shown[a.id] = 1; });
      var rest = data.latest.filter(function (a) { return !shown[a.id]; }).slice(0, 6);
      if (rest.length) {
        parts.push(sectionHead("ar.latest", "article.html"));
        parts.push(el("ul", { class: "ar-list" }, rest.map(row)));
      }
      root.replaceChildren.apply(root, parts);
    }
    Promise.all([
      get("featured=is.true&order=featured_rank.asc&limit=5"),
      get("order=published_at.desc&limit=11")
    ]).then(function (r) {
      data = { featured: r[0], latest: r[1] };
      paint();
      document.addEventListener("languagechange", paint);
    }, function () { message(root, "ar.error"); });
  }

  /* ---------------- all articles ---------------- */

  function list(root) {
    var all = null, kind = "", issue = "";
    function select(id, labelKey, options, value, onChange) {
      var s = el("select", { id: id, on: { change: function () { onChange(s.value); } } }, options.map(function (o) {
        return el("option", { value: o[0], text: o[1], selected: o[0] === value });
      }));
      return el("div", { class: "ar-filter" }, [el("label", { for: id, text: t(labelKey) }), s]);
    }
    function paint() {
      var kinds = ["writing", "art", "photo", "other"].filter(function (k) { return all.some(function (a) { return a.kind === k; }); });
      var issues = all.map(function (a) { return a.issue; }).filter(function (n, i, arr) { return n && arr.indexOf(n) === i; }).sort(function (x, y) { return y - x; });
      var hits = all.filter(function (a) { return (!kind || a.kind === kind) && (!issue || String(a.issue) === issue); });
      root.replaceChildren(
        el("h1", { class: "ar-h1", text: t("ar.articles") }),
        el("div", { class: "ar-filters" }, [
          select("ar-f-type", "ar.type", [["", t("ar.any") + " (" + all.length + ")"]].concat(kinds.map(function (k) {
            return [k, t("k." + k) + " (" + all.filter(function (a) { return a.kind === k; }).length + ")"];
          })), kind, function (v) { kind = v; paint(); }),
          issues.length ? select("ar-f-issue", "ar.issue", [["", t("ar.any")]].concat(issues.map(function (n) {
            return [String(n), t("ar.issueN", { n: n })];
          })), issue, function (v) { issue = v; paint(); }) : null
        ]),
        hits.length ? el("ul", { class: "ar-list" }, hits.map(row)) : el("p", { class: "ar-msg", text: t(all.length ? "ar.noMatch" : "ar.none") })
      );
    }
    get("order=published_at.desc").then(function (r) {
      all = r;
      paint();
      document.addEventListener("languagechange", paint);
    }, function () { message(root, "ar.error"); });
  }

  /* ---------------- one article ---------------- */

  function read(root) {
    var id = new URLSearchParams(location.search).get("id") || "";
    if (!/^[0-9a-f-]{36}$/i.test(id)) return message(root, "ar.missing");
    var a = null;
    function paint() {
      document.title = a.title + " | Perspectives";
      var pdf = file(a.pdf_path);
      root.replaceChildren(
        el("nav", { class: "ar-crumbs", "aria-label": "Breadcrumb" }, [
          el("a", { href: "index.html", text: "Perspectives" }), " › ",
          el("a", { href: "article.html", text: t("ar.articles") })
        ]),
        el("article", { class: "ar-read" }, [
          el("div", { class: "ar-read-head" }, [
            el("p", { class: "ar-type" }, [
              el("b", { text: t("k." + a.kind) }),
              a.issue ? el("span", { text: t("ar.issueN", { n: a.issue }) }) : null,
              el("span", { text: t("ar.published", { date: day(a.published_at) }) })
            ]),
            el("h1", { class: "ar-read-title", text: a.title }),
            a.author_name ? el("p", { class: "ar-read-by", text: t("ar.by", { name: a.author_name }) }) : null,
            a.standfirst ? el("p", { class: "ar-read-stand", text: a.standfirst }) : null,
            el("p", { class: "ar-actions" }, [
              el("a", { class: "ar-btn", href: pdf, target: "_blank", rel: "noopener", text: t("ar.open") }),
              el("a", { class: "ar-btn ar-btn--ghost", href: file(a.pdf_path, a.title.replace(/[\\/:*?"<>|]+/g, " ") + ".pdf"), text: t("ar.download") })
            ])
          ]),
          // Phones cannot show a PDF inline reliably: there the cover links to it instead.
          el("div", { class: "ar-pdf" }, [
            el("object", { data: pdf + "#view=FitH", type: "application/pdf", "aria-label": a.title }, [
              el("p", { class: "ar-msg" }, [el("a", { href: pdf, target: "_blank", rel: "noopener", text: t("ar.pdfHint") })])
            ])
          ]),
          el("a", { class: "ar-pdf-cover", href: pdf, target: "_blank", rel: "noopener" }, [cover(a, "ar-read-cover")]),
          el("p", { class: "ar-note", text: t("ar.pdfHint") })
        ])
      );
    }
    get("id=eq." + id).then(function (r) {
      if (!r.length) return message(root, "ar.missing");
      a = r[0];
      paint();
      document.addEventListener("languagechange", paint);
    }, function () { message(root, "ar.error"); });
  }

  var n;
  if ((n = document.getElementById("ar-home"))) home(n);
  if ((n = document.getElementById("ar-list"))) list(n);
  if ((n = document.getElementById("ar-read"))) read(n);
})();
