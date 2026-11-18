(() => {
  const root = document.documentElement;
  const storageKey = "trekkbross-page-transition";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let leaving = false;
  let navigationTimer;
  let recoveryTimer;

  function motionAllowed() {
    if (reduced.matches || root.classList.contains("motion-paused")) return false;
    try { return localStorage.getItem("trekbross-motion") !== "off"; }
    catch { return true; }
  }

  // Run in the head so the incoming page is covered before its first paint.
  try {
    const pending = JSON.parse(sessionStorage.getItem(storageKey) || "null");
    sessionStorage.removeItem(storageKey);
    if (pending?.url === location.href && Date.now() - pending.time < 15000 && motionAllowed()) {
      root.classList.add("page-entering");
    }
  } catch { /* Navigation also works when storage is unavailable. */ }

  function reveal() {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      root.classList.remove("page-entering");
    }));
  }
  document.addEventListener("DOMContentLoaded", reveal, { once: true });

  // A history-restored document must never retain its outgoing cover.
  addEventListener("pageshow", event => {
    if (!event.persisted) return;
    clearTimeout(navigationTimer);
    clearTimeout(recoveryTimer);
    leaving = false;
    root.classList.remove("page-leaving", "page-entering");
  });

  const pageURLs = ["./", "index.html", "about.html", "shop.html"].map(path => new URL(path, location.href));
  document.addEventListener("click", event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest?.("a[href]");
    if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
    const destination = new URL(link.href, location.href);
    if (!pageURLs.some(url => url.origin === destination.origin && url.pathname === destination.pathname)) return;
    // Section links within a page retain their native scrolling behavior.
    if (destination.pathname === location.pathname || !motionAllowed()) return;
    event.preventDefault();
    if (leaving) return;
    leaving = true;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({ url: destination.href, time: Date.now() }));
    } catch { /* The outgoing dissolve does not depend on storage. */ }
    root.classList.add("page-leaving");
    navigationTimer = setTimeout(() => {
      location.assign(destination.href);
      // Recover if a browser prompt or a failed navigation keeps this page open.
      recoveryTimer = setTimeout(() => {
        leaving = false;
        root.classList.remove("page-leaving");
      }, 2000);
    }, 180);
  });
})();
