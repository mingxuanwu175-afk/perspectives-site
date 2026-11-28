/* About page reveal-on-scroll.
 *
 * The hidden starting state lives in css/about.css under `.ab-js`, and that
 * class is only added here, after IntersectionObserver is confirmed. If the
 * script is blocked or the browser is too old, the page simply stays static
 * and fully visible instead of going blank.
 */
(function () {
  "use strict";

  if (!("IntersectionObserver" in window)) return;

  var root = document.documentElement;
  root.classList.add("ab-js");

  var items = document.querySelectorAll(".ab-reveal");
  if (!items.length) return;

  var io = new IntersectionObserver(function (entries) {
    for (var i = 0; i < entries.length; i++) {
      if (!entries[i].isIntersecting) continue;
      entries[i].target.classList.add("is-in");
      io.unobserve(entries[i].target);
    }
  }, { rootMargin: "0px 0px -48px 0px", threshold: 0 });

  for (var i = 0; i < items.length; i++) io.observe(items[i]);
})();
