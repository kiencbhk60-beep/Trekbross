/* Root-only entrance. The existing page and its animations are loaded unchanged. */
(() => {
  const root = document.documentElement;
  const intro = document.getElementById("trekkbross-intro");
  const video = document.getElementById("intro-video");
  const enter = document.getElementById("intro-enter");
  const play = document.getElementById("intro-play");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const background = [...document.body.children].filter(el => el !== intro && !["SCRIPT", "NOSCRIPT"].includes(el.tagName));
  let leaving = false;
  let exitTimeline;

  function loadWebsite() {
    return new Promise(resolve => {
      const script = document.createElement("script");
      script.src = "about.js";
      script.onload = script.onerror = resolve;
      document.body.append(script);
    });
  }

  if (!intro || !root.classList.contains("intro-pending")) {
    intro?.remove();
    loadWebsite();
    return;
  }

  background.forEach(el => { el.inert = true; });
  intro.hidden = false;
  video.muted = true;
  video.autoplay = !reduced.matches;
  video.src = video.dataset.src;

  function syncPlay() {
    play.setAttribute("aria-label", video.paused ? "Phát video" : "Tạm dừng video");
    play.setAttribute("aria-pressed", String(!video.paused));
    play.querySelector("path").setAttribute("d", video.paused ? "M8 5v14l11-7z" : "M7 5h3v14H7zm7 0h3v14h-3z");
  }
  function startVideo() {
    if (reduced.matches || leaving) return;
    video.play().catch(syncPlay);
  }
  video.addEventListener("play", syncPlay);
  video.addEventListener("pause", syncPlay);
  video.addEventListener("error", () => { video.hidden = true; play.hidden = true; });
  play.addEventListener("click", () => {
    if (video.paused) video.play().catch(syncPlay);
    else video.pause();
  });
  function onPreference() {
    if (reduced.matches) {
      video.autoplay = false;
      video.pause();
      exitTimeline?.progress(1);
      if (window.gsap) {
        gsap.killTweensOf(".intro-word, .intro-description > *");
        gsap.set(".intro-word, .intro-description > *", { clearProps: "transform,opacity" });
      }
    }
  }
  reduced.addEventListener("change", onPreference);
  document.addEventListener("visibilitychange", onVisibility);
  function onVisibility() { if (document.hidden) video.pause(); }
  if (reduced.matches) video.pause();
  else startVideo();
  syncPlay();

  if (window.gsap && !reduced.matches) {
    gsap.from(".intro-word", { y: 20, opacity: 0, duration: .6, ease: "expo.out" });
    gsap.from(".intro-description > *", { y: 20, opacity: 0, duration: .8, stagger: .08, ease: "expo.out" });
  }

  function remember() {
    try { sessionStorage.setItem("trekkbross-intro-seen", "true"); }
    catch {
      // Keep refresh safe even when reads work but storage writes are denied.
      try { history.replaceState({ ...history.state, trekkbrossIntroSeen: true }, ""); } catch { /* Navigation remains available. */ }
    }
  }
  // Real links remain normal links, including modified clicks and new tabs.
  intro.querySelectorAll("nav a").forEach(link => link.addEventListener("click", remember));

  enter.addEventListener("click", () => {
    if (leaving) return;
    leaving = true;
    enter.disabled = play.disabled = true;
    intro.querySelector("nav").inert = true;
    const finish = async () => {
      remember();
      video.pause();
      await loadWebsite();
      background.forEach(el => { el.inert = false; });
      root.classList.remove("intro-pending");
      const done = () => {
        reduced.removeEventListener("change", onPreference);
        document.removeEventListener("visibilitychange", onVisibility);
        removeEventListener("pageshow", onRestore);
        intro.remove();
        video.removeAttribute("src");
        video.load();
        document.getElementById("main").focus({ preventScroll: true });
        window.ScrollTrigger?.refresh();
      };
      if (window.gsap && !reduced.matches) gsap.to(intro, { opacity: 0, duration: .3, onComplete: done });
      else done();
    };
    if (!window.gsap || reduced.matches) { finish(); return; }
    gsap.killTweensOf(".intro-word, .intro-description > *");
    exitTimeline = gsap.timeline({ onComplete: finish })
      .to(video, { scale: 1.05, duration: .65, ease: "expo.out" }, 0)
      .to(".intro-content", { y: 30, opacity: 0, duration: .5, ease: "expo.out" }, 0)
      .to(".intro-exit", { scaleY: 1, duration: .65, ease: "power3.inOut" }, 0);
  });

  // A history-restored intro must never strand a visitor on its exiting frame.
  function onRestore(event) {
    if (!event.persisted) return;
    try {
      if (leaving || history.state?.trekkbrossIntroSeen || sessionStorage.getItem("trekkbross-intro-seen") === "true") location.reload();
    } catch { location.reload(); }
  }
  addEventListener("pageshow", onRestore);
})();
