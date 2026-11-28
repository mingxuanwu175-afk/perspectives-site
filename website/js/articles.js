/* Perspectives: published articles on the public pages.
 *
 *   index.html   <div id="ar-home">  featured carousel (Steam store layout), then after nature.com a row of cards with the current issue and the latest list
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
  var FIELDS = "id,title,author_name,kind,issue,standfirst,cover_path,pdf_path,page_paths,featured,featured_rank,published_at";

  var WORDS = {
    en: {
      "ar.search": "Search", "ar.searchHint": "Title, author or words",
      "ar.secWriting": "Writing", "ar.secVisual": "Art & Photography", "ar.issues": "Issues", "ar.nArticles": "{n} pieces", "ar.stripText": "Students write, students read. Send us your writing, art or photos: every submission gets a reply.", "ar.submit": "Submit your work", "ar.joinTeam": "Join the team",
      "ar.contents": "Contents", "ar.currentIssue": "Current issue",
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
      "ar.search": "搜索", "ar.searchHint": "标题、作者或关键词",
      "ar.secWriting": "文字", "ar.secVisual": "绘画与摄影", "ar.issues": "往期", "ar.nArticles": "{n} 篇", "ar.stripText": "学生写，学生读。文章、画、摄影都可以投给我们，每一篇都会回复。", "ar.submit": "投稿", "ar.joinTeam": "加入我们",
      "ar.contents": "目录", "ar.currentIssue": "本期",
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
      "ar.search": "検索", "ar.searchHint": "題名・作者・言葉",
      "ar.secWriting": "文章", "ar.secVisual": "絵と写真", "ar.issues": "バックナンバー", "ar.nArticles": "{n}本", "ar.stripText": "学生が書き、学生が読む。文章・絵・写真を送ってください。すべての投稿に返事します。", "ar.submit": "投稿する", "ar.joinTeam": "チームに参加",
      "ar.contents": "目次", "ar.currentIssue": "最新号",
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
      "ar.search": "검색", "ar.searchHint": "제목, 작가 또는 단어",
      "ar.secWriting": "글", "ar.secVisual": "그림과 사진", "ar.issues": "지난 호", "ar.nArticles": "{n}편", "ar.stripText": "학생이 쓰고 학생이 읽습니다. 글, 그림, 사진을 보내 주세요. 모든 투고에 답합니다.", "ar.submit": "투고하기", "ar.joinTeam": "팀 합류",
      "ar.contents": "목차", "ar.currentIssue": "이번 호",
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

  /* ---------------- homepage (after nature.com) ---------------- */

  // Front page: the featured carousel (Steam store layout, below), then as on
  // nature.com one row of cards
  // (picture, title, summary, author, type | date) ending with the current
  // issue's cover, then a "Latest" list under a heavy rule.
  // Featured carousel, laid out after the Steam store's "Featured &
  // Recommended" box (measured at 1440 px): one frame, big picture on the left
  // (840 of 1200), a 360 info column on the right with the title, a meta line,
  // a 2 x 2 grid of page previews (hovering one shows it in the big picture)
  // and the summary; big arrows outside the frame, small bars under it.
  // Turns every 6 seconds; pauses under the pointer or keyboard focus, while
  // the tab is hidden, and for readers who ask for less motion.
  var slideAt = 0, timer = null;
  function lead(feat) {
    if (timer) { clearInterval(timer); timer = null; }
    if (slideAt >= feat.length) slideAt = 0;
    var slides = feat.map(function (a, i) {
      var big = cover(a, "st-main-img");
      var pages = (a.page_paths || []).slice(0, 4);
      var shots = pages.length ? el("ul", { class: "st-shots" }, pages.map(function (p) {
        var u = file(p);
        return el("li", { on: { mouseenter: function () { if (big.tagName === "IMG") big.src = u; } } }, [
          el("img", { src: u, alt: "", loading: "lazy" })
        ]);
      })) : null;
      if (shots) shots.addEventListener("mouseleave", function () { if (big.tagName === "IMG") big.src = file(a.cover_path); });
      return el("a", { class: "st-slide", href: href(a), "aria-hidden": i === slideAt ? null : "true", tabindex: i === slideAt ? null : "-1" }, [
        el("div", { class: "st-main" }, [big]),
        el("div", { class: "st-info" }, [
          el("h2", { class: "st-name", text: a.title }),
          el("p", { class: "st-meta" }, [
            el("b", { text: t("k." + a.kind) }),
            a.issue ? el("span", { text: t("ar.issueN", { n: a.issue }) }) : null,
            a.author_name ? el("span", { text: a.author_name }) : null
          ]),
          shots,
          a.standfirst ? el("p", { class: "st-reason", text: a.standfirst }) : null,
          el("p", { class: "st-tag", text: day(a.published_at) })
        ])
      ]);
    });
    var bars = feat.map(function (a, i) {
      return el("button", { type: "button", class: "st-bar", "aria-label": (i + 1) + " / " + feat.length + ": " + a.title, on: { click: function () { go(i); } } });
    });
    var many = feat.length > 1;
    var box = el("section", { class: "st-cap", "aria-roledescription": "carousel", "aria-label": t("ar.featured") }, [
      el("h2", { class: "st-head", text: t("ar.featured") }),
      many ? el("button", { type: "button", class: "st-arrow st-arrow--left", "aria-label": t("ar.prev"), on: { click: function () { go(slideAt - 1); } } }) : null,
      el("div", { class: "st-frame" }, slides),
      many ? el("button", { type: "button", class: "st-arrow st-arrow--right", "aria-label": t("ar.next"), on: { click: function () { go(slideAt + 1); } } }) : null,
      many ? el("div", { class: "st-bars" }, bars) : null
    ]);
    function go(i) {
      slideAt = (i + feat.length) % feat.length;
      slides.forEach(function (s, j) {
        var on = j === slideAt;
        s.classList.toggle("is-on", on);
        if (on) { s.removeAttribute("aria-hidden"); s.removeAttribute("tabindex"); }
        else { s.setAttribute("aria-hidden", "true"); s.setAttribute("tabindex", "-1"); }
      });
      bars.forEach(function (d, j) { d.classList.toggle("is-on", j === slideAt); d.setAttribute("aria-current", j === slideAt ? "true" : "false"); });
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
    if (many && !still) {
      timer = setInterval(function () { if (!paused && !document.hidden) go(slideAt + 1); }, 6000);
    }
    return box;
  }

  function card(a) {
    return el("li", { class: "nt-card" }, [
      el("a", { href: href(a), tabindex: "-1", "aria-hidden": "true" }, [cover(a, "nt-card-img")]),
      el("h3", { class: "nt-card-title" }, [el("a", { href: href(a), text: a.title })]),
      a.standfirst ? el("p", { class: "nt-card-stand", text: a.standfirst }) : null,
      el("div", { class: "nt-card-foot" }, [
        a.author_name ? el("p", { class: "nt-card-by", text: a.author_name }) : null,
        typeLine(a)
      ])
    ]);
  }

  // The last card of the row, as on nature.com: the current issue's cover with
  // a Contents button (to the Articles page filtered to that issue).
  function issueCard(no, a) {
    return el("li", { class: "nt-card nt-issue" }, [
      el("a", { href: "article.html?issue=" + no, tabindex: "-1", "aria-hidden": "true" }, [cover(a, "nt-issue-img")]),
      el("a", { class: "nt-btn", href: "article.html?issue=" + no, text: t("ar.contents") }),
      el("p", { class: "ar-type" }, [el("b", { text: t("ar.currentIssue") }), el("span", { text: t("ar.issueN", { n: no }) })])
    ]);
  }

  /* ---- the rest of the nature.com front page, filled with our articles ---- */

  function secHead(key, link) {
    return el("h2", { class: "ar-sec" }, [link ? el("a", { href: link, text: t(key) + " ›" }) : t(key)]);
  }
  function metaLine(a) {
    return el("div", { class: "nt-card-foot" }, [
      a.author_name ? el("p", { class: "nt-card-by", text: a.author_name }) : null,
      typeLine(a)
    ]);
  }
  function smallCard(a, withImg) {
    return el("li", { class: "nt-card" }, [
      withImg ? el("a", { href: href(a), tabindex: "-1", "aria-hidden": "true" }, [cover(a, "nt-card-img")]) : null,
      el("h3", { class: "nt-card-title" }, [el("a", { href: href(a), text: a.title })]),
      withImg ? null : (a.standfirst ? el("p", { class: "nt-card-stand", text: a.standfirst }) : null),
      metaLine(a)
    ]);
  }

  // "News & Comment": a dark tile on the left (picture strip, title, summary),
  // six picture cards beside it in a 3 x 2 grid.
  function newsBlock(key, link, items) {
    if (!items.length) return [];
    var big = items[0], rest = items.slice(1, 7);
    return [secHead(key, link), el("div", { class: "nt-news" }, [
      el("a", { class: "nt-news-big", href: href(big) }, [
        cover(big, "nt-news-big-img"),
        el("div", { class: "nt-news-big-text" }, [
          el("h3", { class: "nt-news-big-title" }, [el("span", { text: big.title })]),
          big.standfirst ? el("p", { text: big.standfirst }) : null,
          el("div", { class: "nt-news-big-foot" }, [
            big.author_name ? el("p", { text: big.author_name }) : null,
            el("p", { class: "nt-news-big-type" }, [el("b", { text: t("k." + big.kind) }), el("span", { text: day(big.published_at) })])
          ])
        ])
      ]),
      rest.length ? el("ul", { class: "nt-news-grid" }, rest.map(function (a) { return smallCard(a, true); })) : null
    ])];
  }

  // "Latest Reviews & Analysis": a text lead on the left, its picture large in
  // the middle, a column of text items on the right; picture cards under it.
  function reviewBlock(key, link, items) {
    if (!items.length) return [];
    var first = items[0], side = items.slice(1, 4), under = items.slice(4, 8);
    return [secHead(key, link), el("div", { class: "nt-rev" }, [
      el("div", { class: "nt-rev-lead" }, [
        el("h3", { class: "nt-rev-title" }, [el("a", { href: href(first), text: first.title })]),
        first.standfirst ? el("p", { class: "nt-card-stand", text: first.standfirst }) : null,
        metaLine(first)
      ]),
      el("a", { class: "nt-rev-img", href: href(first), tabindex: "-1", "aria-hidden": "true" }, [cover(first, "nt-rev-pic")]),
      el("ul", { class: "nt-rev-side" }, side.map(function (a) { return smallCard(a, false); }))
    ]), under.length ? el("ul", { class: "nt-cards nt-cards--4" }, under.map(function (a) { return smallCard(a, true); })) : null];
  }

  // "Collections": one entry per issue, words on the left, cover on the right.
  function issuesBlock(all) {
    var nos = all.map(function (a) { return a.issue; }).filter(function (n, i, arr) { return n && arr.indexOf(n) === i; }).sort(function (x, y) { return y - x; });
    if (!nos.length) return [];
    return [secHead("ar.issues", "article.html"), el("ul", { class: "nt-coll" }, nos.map(function (n) {
      var inIssue = all.filter(function (a) { return a.issue === n; });
      var withPic = inIssue.filter(function (a) { return a.cover_path; });
      var pic = withPic.filter(function (a) { return /封面|cover/i.test(a.title); })[0] || withPic[0];
      return el("li", {}, [
        el("div", {}, [
          el("h3", { class: "nt-card-title" }, [el("a", { href: "article.html?issue=" + n, text: t("ar.issueN", { n: n }) })]),
          el("p", { class: "nt-card-stand", text: inIssue.slice(0, 4).map(function (a) { return a.title; }).join(" · ") }),
          el("p", { class: "ar-type" }, [el("b", { text: t("ar.nArticles", { n: inIssue.length }) }), el("span", { text: day(inIssue[0].published_at) })])
        ]),
        pic ? el("a", { href: "article.html?issue=" + n, tabindex: "-1", "aria-hidden": "true" }, [cover(pic, "nt-coll-img")]) : null
      ]);
    }))];
  }

  // The Nature Briefing strip at the foot of the page, here the way in for
  // contributors and new team members.
  function joinStrip() {
    return el("section", { class: "nt-strip" }, [
      el("div", { class: "nt-strip-text" }, [
        el("p", { class: "nt-strip-name", text: "Perspectives" }),
        el("p", { text: t("ar.stripText") })
      ]),
      el("div", { class: "nt-strip-actions" }, [
        el("a", { class: "nt-strip-btn", href: "contribution.html", text: t("ar.submit") }),
        el("a", { class: "nt-strip-link", href: "join_us.html", text: t("ar.joinTeam") + " ›" })
      ])
    ]);
  }

  function home(root) {
    var data = null;
    function paint() {
      var all = data.latest;
      if (!all.length) return message(root, "ar.none");
      var feat = data.featured.length ? data.featured : all.slice(0, 1);
      var inLead = {};
      feat.forEach(function (a) { inLead[a.id] = 1; });
      var others = all.filter(function (a) { return !inLead[a.id]; });

      var issueNo = all.reduce(function (m, a) { return Math.max(m, a.issue || 0); }, 0);
      // The issue's own cover art if there is one (a piece titled "...封面" or
      // "... cover"), otherwise the first piece of that issue with a picture.
      var inIssue = all.filter(function (a) { return a.issue === issueNo && a.cover_path; });
      var issueCover = issueNo ? (inIssue.filter(function (a) { return /封面|cover/i.test(a.title); })[0] || inIssue[0]) : null;
      var cards = others.slice(0, issueCover ? 4 : 5).map(card);
      if (issueCover) cards.push(issueCard(issueNo, issueCover));

      var parts = [lead(feat)];
      if (cards.length) parts.push(el("ul", { class: "nt-cards" }, cards));
      // Then, as on nature.com: a "News & Comment" block (writing), a "Reviews &
      // Analysis" block (art and photography), the dated latest list, the
      // issues as collections, and the sign-up strip (here: submit / join).
      var writing = all.filter(function (a) { return a.kind === "writing" || a.kind === "other"; });
      var visual = all.filter(function (a) { return a.kind === "art" || a.kind === "photo"; });
      parts = parts.concat(newsBlock("ar.secWriting", "article.html?kind=writing", writing));
      parts = parts.concat(reviewBlock("ar.secVisual", "article.html?kind=art", visual));
      parts.push(secHead("ar.latest", "article.html"));
      parts.push(el("ul", { class: "ar-list" }, all.slice(0, 5).map(row)));
      parts = parts.concat(issuesBlock(all));
      parts.push(joinStrip());
      root.replaceChildren.apply(root, parts.filter(Boolean));
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
    var qs = new URLSearchParams(location.search);
    var all = null, kind = qs.get("kind") || "", issue = qs.get("issue") || "", q = qs.get("q") || "";
    // Search (the "Search" link in the top bar opens article.html#search):
    // matches title, author and summary, as you type.
    function matches(a) {
      var k = q.trim().toLowerCase();
      if (!k) return true;
      return [a.title, a.author_name, a.standfirst].some(function (v) { return String(v || "").toLowerCase().indexOf(k) >= 0; });
    }
    function select(id, labelKey, options, value, onChange) {
      var s = el("select", { id: id, on: { change: function () { onChange(s.value); } } }, options.map(function (o) {
        return el("option", { value: o[0], text: o[1], selected: o[0] === value });
      }));
      return el("div", { class: "ar-filter" }, [el("label", { for: id, text: t(labelKey) }), s]);
    }
    function paint() {
      var kinds = ["writing", "art", "photo", "other"].filter(function (k) { return all.some(function (a) { return a.kind === k; }); });
      var issues = all.map(function (a) { return a.issue; }).filter(function (n, i, arr) { return n && arr.indexOf(n) === i; }).sort(function (x, y) { return y - x; });
      var hits = all.filter(function (a) { return (!kind || a.kind === kind) && (!issue || String(a.issue) === issue) && matches(a); });
      var box = el("input", { id: "ar-f-q", type: "search", value: q, placeholder: t("ar.searchHint"), autocomplete: "off" });
      box.addEventListener("input", function () {
        q = box.value;
        var at = box.selectionStart;
        paint();
        var again = document.getElementById("ar-f-q");
        again.focus(); try { again.setSelectionRange(at, at); } catch (e) {}
      });
      root.replaceChildren(
        el("h1", { class: "ar-h1", text: t("ar.articles") }),
        el("div", { class: "ar-filters" }, [
          el("div", { class: "ar-filter ar-filter--q", id: "search" }, [el("label", { for: "ar-f-q", text: t("ar.search") }), box]),
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
      if (location.hash === "#search") document.getElementById("ar-f-q").focus();
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
