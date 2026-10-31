// Decides, before the app loads, whether the branded intro plays (src/components/IntroReveal.tsx).
// Once per browser session; never with reduced motion. Kept as a file because the site's
// security policy doesn't allow inline scripts.
(function () {
  var intro = document.getElementById("cc-intro");
  if (!intro) return;
  try {
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches || localStorage.getItem("cc-motion") === "reduced";
    if (reduced || sessionStorage.getItem("cc-intro-seen")) {
      intro.remove();
      return;
    }
    sessionStorage.setItem("cc-intro-seen", "1");
  } catch (e) {
    // Storage blocked: still show it, the app removes it once ready.
  }
  window.__ccIntroStart = performance.now();
})();
