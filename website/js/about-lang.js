(function () {
  "use strict";

  var global = window;
  var page = document.documentElement.getAttribute("data-page-lang");
  if (page !== "en" && page !== "zh") return;

  function go(file) {
    var here = global.location.pathname.split("/").pop();
    if (here === file) return;
    global.location.replace(file);
  }

  // Switching to Chinese from the English edition opens the Chinese page, and
  // switching to any other language from the Chinese edition returns to it.
  document.addEventListener("languagechange", function (event) {
    var lang = event && event.detail && event.detail.lang;
    if (!lang) return;
    if (page === "en" && lang === "zh") go("about-zh.html");
    else if (page === "zh" && lang !== "zh") go("about.html");
  });

  // A returning visitor whose saved language is Chinese should land on the
  // Chinese edition even when about.html was opened directly.
  if (page === "en" && document.documentElement.lang === "zh") go("about-zh.html");
})(window);
