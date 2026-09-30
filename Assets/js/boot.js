/*
  Runs in <head> before first paint (not deferred), so the page never flashes the wrong state.
    .js          JavaScript is available
    .motion-off  the visitor turned motion off, or their device asks for reduced motion
    .intro-play  play the film-leader countdown (home page only, once per session,
                 never with a deep link or with motion off)
*/
(function (doc, win) {
  "use strict";
  var root = doc.documentElement;
  root.classList.add("js");

  var saved = null;
  try {
    saved = win.localStorage.getItem("yb-motion");
  } catch (e) {
    /* storage blocked: fall back to the system setting */
  }
  var reduce = !!(win.matchMedia && win.matchMedia("(prefers-reduced-motion: reduce)").matches);
  if (saved === "off" || (saved === null && reduce)) root.classList.add("motion-off");

  var seen = true;
  try {
    seen = win.sessionStorage.getItem("yb-intro") === "1";
  } catch (e) {
    /* no session storage: skip the intro rather than replay it on every page */
  }
  if (root.hasAttribute("data-intro") && !seen && !win.location.hash && !root.classList.contains("motion-off")) {
    root.classList.add("intro-play");
  }
})(document, window);
