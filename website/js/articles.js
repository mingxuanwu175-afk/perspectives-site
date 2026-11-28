/* Perspectives: published articles on the public pages.
 *
 *   index.html   <div id="ar-home">  front page after science.org: featured carousel as the lead story, cards, a Latest rail, the current issue
 *   article.html <div id="ar-list">  every published article, newest first, filter by type and issue
 *   read.html    <div id="ar-read">  one article: details, PDF reader, download
 *
 * Layout follows nature.com (lead story, dated list); the lead slot rotates through the featured articles.
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
      "ar.more": "More articles", "ar.byShort": "By {name}",
      "ar.featured": "Featured", "ar.prev": "Previous", "ar.next": "Next",
      "ar.articles": "Articles", "ar.latest": "Latest articles", "ar.all": "All articles",
      "ar.type": "Type", "ar.issue": "Issue", "ar.any": "All", "ar.issueN": "Issue {n}",
      "ar.none": "No articles yet.", "ar.noMatch": "No articles match.",
      "ar.error": "The articles could not be loaded. Try again later.", "ar.missing": "This article is not available.",
      "ar.published": "Published {date}", "ar.by": "By {name}",
      "ar.open": "Open PDF", "ar.download": "Download PDF", "ar.pdfHint": "If the PDF does not show here, open it in a new tab.",
      "k.writing": "Writing", "k.art": "Art", "k.photo": "Photography", "k.other": "Other"
    },
    zh: {
      "ar.more": "更多文章", "ar.byShort": "作者 {name}",
      "ar.featured": "精选", "ar.prev": "上一篇", "ar.next": "下一篇",
      "ar.articles": "文章", "ar.latest": "最新文章", "ar.all": "全部文章",
      "ar.type": "类型", "ar.issue": "期号", "ar.any": "全部", "ar.issueN": "第 {n} 期",
      "ar.none": "还没有文章。", "ar.noMatch": "没有符合条件的文章。",
      "ar.error": "文章加载失败，请稍后再试。", "ar.missing": "这篇文章不存在或已下线。",
      "ar.published": "发表于 {date}", "ar.by": "作者：{name}",
      "ar.open": "打开 PDF", "ar.download": "下载 PDF", "ar.pdfHint": "如果这里显示不出 PDF，请在新标签页打开。",
      "k.writing": "文章", "k.art": "绘画", "k.photo": "摄影", "k.other": "其他"
    },
    ja: {
      "ar.more": "記事一覧", "ar.byShort": "{name}",
      "ar.featured": "注目の記事", "ar.prev": "前へ", "ar.next": "次へ",
      "ar.articles": "記事", "ar.latest": "最新の記事", "ar.all": "すべての記事",
      "ar.type": "種類", "ar.issue": "号", "ar.any": "すべて", "ar.issueN": "第{n}号",
      "ar.none": "まだ記事はありません。", "ar.noMatch": "該当する記事はありません。",
      "ar.error": "記事を読み込めませんでした。しばらくしてからもう一度お試しください。", "ar.missing": "この記事は公開されていません。",
      "ar.published": "{date} 公開", "ar.by": "{name}",
      "ar.open": "PDFを開く", "ar.download": "PDFをダウンロード", "ar.pdfHint": "ここにPDFが表示されない場合は、新しいタブで開いてください。",
      "k.writing": "文章", "k.art": "アート", "k.photo": "写真", "k.other": "その他"
    },
    ko: {
      "ar.more": "기사 더 보기", "ar.byShort": "{name}",
      "ar.featured": "추천 기사", "ar.prev": "이전", "ar.next": "다음",
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

  /* ---------------- homepage (after science.org) ---------------- */

  // Small pieces of the science.org front page: a red type label with the
  // date, a bold sans title, an upper-case by-line.
  function label(a, light) {
    return el("p", { class: "sc-label" + (light ? " sc-label--light" : "") }, [
      el("span", { class: "sc-kind", text: t("k." + a.kind) }),
      a.issue ? el("span", { class: "sc-date", text: t("ar.issueN", { n: a.issue }) }) : null,
      el("span", { class: "sc-date", text: day(a.published_at) })
    ]);
  }
  function byline(a, cls) {
    return a.author_name ? el("p", { class: cls || "sc-by", text: t("ar.byShort", { name: a.author_name }) }) : null;
  }
  function textCard(a) {
    return el("li", { class: "sc-card" }, [
      label(a),
      el("h3", { class: "sc-title" }, [el("a", { href: href(a), text: a.title })]),
      byline(a)
    ]);
  }
  function imageCard(a) {
    return el("li", { class: "sc-card sc-card--img" }, [
      el("a", { href: href(a), tabindex: "-1", "aria-hidden": "true" }, [cover(a, "sc-card-img")]),
      label(a),
      el("h3", { class: "sc-title" }, [el("a", { href: href(a), text: a.title })]),
      byline(a)
    ]);
  }

  // The lead story box. Science shows one story there; ours takes turns
  // through the featured articles (up to 5, in the order set in Manage): one
  // every 6 seconds with a fade, paused under the pointer or keyboard focus,
  // while the tab is hidden, and for readers who ask for less motion.
  var slideAt = 0, timer = null;
  function lead(feat) {
    if (timer) { clearInterval(timer); timer = null; }
    if (slideAt >= feat.length) slideAt = 0;
    var slides = feat.map(function (a, i) {
      return el("a", { class: "sc-slide", href: href(a), "aria-hidden": i === slideAt ? null : "true", tabindex: i === slideAt ? null : "-1" }, [
        cover(a, "sc-slide-img"),
        el("div", { class: "sc-slide-text" }, [
          label(a, true),
          el("h2", { class: "sc-slide-title", text: a.title }),
          byline(a, "sc-by sc-by--light"),
          a.standfirst ? el("p", { class: "sc-slide-stand", text: a.standfirst }) : null
        ])
      ]);
    });
    var dots = feat.map(function (a, i) {
      return el("button", { type: "button", class: "sc-dot", "aria-label": (i + 1) + " / " + feat.length + ": " + a.title, on: { click: function () { go(i); } } });
    });
    var box = el("div", { class: "sc-lead", "aria-roledescription": "carousel", "aria-label": t("ar.featured") }, [
      el("div", { class: "sc-slides" }, slides),
      feat.length > 1 ? el("button", { type: "button", class: "sc-arrow sc-arrow--prev", "aria-label": t("ar.prev"), on: { click: function () { go(slideAt - 1); } } }) : null,
      feat.length > 1 ? el("button", { type: "button", class: "sc-arrow sc-arrow--next", "aria-label": t("ar.next"), on: { click: function () { go(slideAt + 1); } } }) : null,
      feat.length > 1 ? el("div", { class: "sc-dots" }, dots) : null
    ]);
    function go(i) {
      slideAt = (i + feat.length) % feat.length;
      slides.forEach(function (s, j) {
        var on = j === slideAt;
        s.classList.toggle("is-on", on);
        if (on) { s.removeAttribute("aria-hidden"); s.removeAttribute("tabindex"); }
        else { s.setAttribute("aria-hidden", "true"); s.setAttribute("tabindex", "-1"); }
      });
      dots.forEach(function (d, j) { d.classList.toggle("is-on", j === slideAt); d.setAttribute("aria-current", j === slideAt ? "true" : "false"); });
    }
    go(slideAt);
    var still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var paused = false;
    box.addEventListener("mouseenter", function () { paused = true; });
    box.addEventListener("mouseleave", function () { paused = false; });
    box.addEventListener("focusin", function () { paused = true; });
    box.addEventListener("focusout", function () { paused = false; });
    var x0 = null;
    box.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; paused = true; }, { passive: true });
    box.addEventListener("touchend", function (e) {
      if (x0 != null) { var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) go(slideAt + (dx < 0 ? 1 : -1)); }
      x0 = null; paused = false;
    });
    if (feat.length > 1 && !still) {
      timer = setInterval(function () { if (!paused && !document.hidden) go(slideAt + 1); }, 6000);
    }
    return box;
  }

  // The science.org front page top block: the lead story (here the carousel)
  // with a row of three text cards under it, a narrow column of two picture
  // cards, and a "Latest" rail on the right. Under it, the current issue: its
  // cover beside its table of contents.
  function home(root) {
    var data = null;
    function paint() {
      var all = data.latest;
      if (!all.length) return message(root, "ar.none");
      var feat = data.featured.length ? data.featured : all.slice(0, 1);
      var inLead = {};
      feat.forEach(function (a) { inLead[a.id] = 1; });
      var others = all.filter(function (a) { return !inLead[a.id]; });
      var pics = others.slice(0, 2), texts = others.slice(2, 5);

      // The lead story runs the full width of the page; the cards and the
      // "Latest" rail sit under it in Science's column widths.
      var shape = (texts.length ? "t" : "") + (pics.length ? "p" : "");
      var top = el("section", { class: "sc-top sc-top--" + (shape || "rail") }, [
        texts.length ? el("ul", { class: "sc-row" }, texts.map(textCard)) : null,
        pics.length ? el("ul", { class: "sc-mid" }, pics.map(imageCard)) : null,
        el("aside", { class: "sc-rail" }, [
          el("h2", { class: "sc-head", text: t("ar.latest") }),
          el("ul", { class: "sc-latest" }, all.slice(0, 6).map(function (a) {
            return el("li", {}, [
              el("p", { class: "sc-date", text: day(a.published_at) }),
              el("a", { class: "sc-latest-title", href: href(a), text: a.title })
            ]);
          })),
          el("a", { class: "sc-more", href: "article.html", text: t("ar.more") + " ›" })
        ])
      ]);

      var parts = [lead(feat), top];
      var issueNo = all.reduce(function (m, a) { return Math.max(m, a.issue || 0); }, 0);
      if (issueNo) {
        var inIssue = all.filter(function (a) { return a.issue === issueNo; });
        var withCover = inIssue.filter(function (a) { return a.cover_path; })[0];
        parts.push(el("section", { class: "sc-issue" }, [
          el("h2", { class: "sc-issue-head" }, [
            el("span", { class: "sc-issue-name", text: "Perspectives" }),
            el("span", { class: "sc-issue-meta", text: t("ar.issueN", { n: issueNo }) })
          ]),
          el("div", { class: "sc-issue-body" }, [
            withCover ? el("a", { class: "sc-issue-cover", href: href(withCover), tabindex: "-1", "aria-hidden": "true" }, [cover(withCover, "sc-issue-img")]) : null,
            el("ul", { class: "sc-toc" }, inIssue.map(function (a) {
              return el("li", {}, [
                el("p", { class: "sc-label" }, [
                  el("span", { class: "sc-kind", text: t("k." + a.kind) }),
                  a.author_name ? el("span", { class: "sc-date", text: t("ar.byShort", { name: a.author_name }) }) : null
                ]),
                el("a", { class: "sc-toc-title", href: href(a), text: a.title })
              ]);
            }))
          ])
        ]));
      }
      root.replaceChildren.apply(root, parts);
    }
    Promise.all([
      get("featured=is.true&order=featured_rank.asc&limit=5"),
      get("order=published_at.desc&limit=60")
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
