/* TREKKBROSS About Us — Lumenis GSAP 3.15 + ScrollTrigger + SplitText + Observer */
(() => {
  const menuBtn = document.getElementById("about-menu-btn");
  const navMenu = document.getElementById("about-nav-menu");

  if (menuBtn && navMenu) {
    menuBtn.addEventListener("click", (event) => {
      const open = navMenu.classList.toggle("is-open");
      menuBtn.setAttribute("aria-expanded", String(open));
      if (open && event.detail === 0) navMenu.querySelector("a")?.focus();
    });
    navMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navMenu.classList.remove("is-open");
        menuBtn.setAttribute("aria-expanded", "false");
      });
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && navMenu.classList.contains("is-open")) {
        navMenu.classList.remove("is-open");
        menuBtn.setAttribute("aria-expanded", "false");
        menuBtn.focus();
      }
    });
  }

  if (typeof window.gsap === "undefined") return;

  const plugins = [];
  if (typeof window.ScrollTrigger !== "undefined") plugins.push(window.ScrollTrigger);
  if (typeof window.SplitText !== "undefined") plugins.push(window.SplitText);
  if (typeof window.Observer !== "undefined") plugins.push(window.Observer);
  if (plugins.length) gsap.registerPlugin(...plugins);

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) {
    gsap.set([".animate-on-load", ".logo-hero-text", ".navbar", ".nav-link", ".fade-in-on-scroll"], {
      opacity: 1,
      y: 0,
      clearProps: "all"
    });
    return;
  }

  // 1. HERO LOAD TIMELINE (Lumenis IX3 t-d1409585)
  const heroLogo = document.querySelector(".logo-hero-text");
  const loadTimeline = gsap.timeline({ defaults: { ease: "expo.out" } });

  if (heroLogo) {
    loadTimeline.fromTo(heroLogo, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6 }, 0);
  }

  const animateOnLoadItems = gsap.utils.toArray(".animate-on-load");
  if (animateOnLoadItems.length) {
    loadTimeline.fromTo(
      animateOnLoadItems,
      { opacity: 0, y: 65 },
      { opacity: 1, y: 0, duration: 0.8, stagger: { amount: 0.35 } },
      0.3
    );
  }

  // 2. HERO 11-IMAGE COLLAGE INTRO + MOUSE TRAIL (Lumenis Observer)
  const hero = document.querySelector(".hero");
  const wrap = hero && hero.querySelector(".image_wrap");
  const items = wrap ? gsap.utils.toArray(".content_img-wrap", wrap) : [];

  if (hero && wrap && items.length) {
    const D = 90, IN = 0.2, MOVE = 0.45, OUT = 0.2, SCALE = 0.6;
    gsap.set(wrap, { position: "absolute", inset: 0, overflow: "hidden" });
    gsap.set(items, { position: "absolute", left: 0, top: 0, opacity: 0, willChange: "transform,opacity" });

    let rect = wrap.getBoundingClientRect();
    let over = false, first = true, i = -1, z = 1;
    let last = { x: 0, y: 0 }, curr = { x: 0, y: 0 };

    const refreshRect = () => {
      if (over) rect = wrap.getBoundingClientRect();
    };
    gsap.ticker.add(refreshRect);

    const toLocal = (e) => ({ x: e.clientX - rect.left, y: e.clientY - rect.top });

    function spawn(fromX, fromY, toX, toY) {
      i = (i + 1) % items.length;
      const el = items[i];
      const img = el.querySelector(".content_img") || el;

      gsap.set(el, { left: 0, top: 0, zIndex: ++z });
      gsap.set(img, { opacity: 1, scale: 1 });
      gsap.killTweensOf([el, img]);

      const w = el.offsetWidth || 180, h = el.offsetHeight || 230;
      const fx = fromX - w / 2, fy = fromY - h / 2;
      const tx = toX - w / 2, ty = toY - h / 2;

      const tl = gsap.timeline();
      tl.fromTo(el, { opacity: 0, x: fx, y: fy }, { opacity: 1, duration: IN });
      tl.to(el, { x: tx, y: ty, duration: MOVE }, "<");
      tl.to(img, { opacity: 0, scale: SCALE, duration: OUT });
      tl.set(el, { opacity: 0 });
    }

    if (typeof window.Observer !== "undefined") {
      Observer.create({
        target: hero,
        type: "pointer,touch",
        onHover: (self) => {
          over = self.isActive();
          first = over;
          if (over && self.event) {
            rect = wrap.getBoundingClientRect();
            last = curr = toLocal(self.event);
          }
        },
        onMove: (self) => {
          if (!self.event) return;
          rect = wrap.getBoundingClientRect();
          curr = toLocal(self.event);
          if (first) {
            first = false;
            spawn(curr.x, curr.y, curr.x, curr.y);
            last = { ...curr };
            return;
          }
          const dx = curr.x - last.x, dy = curr.y - last.y;
          if (dx * dx + dy * dy >= D * D) {
            spawn(last.x, last.y, curr.x, curr.y);
            last = { ...curr };
          }
        }
      });
    }
  }

  // 3. NAV LINK & BUTTON HOVER INTERACTIONS (Lumenis a-88 / a-89 & a-84 / a-96)
  document.querySelectorAll(".nav-link-wrapper").forEach((wrapper) => {
    const line = wrapper.querySelector(".nav-line");
    if (!line) return;
    gsap.set(line, { scaleX: 0 });
    wrapper.addEventListener("mouseenter", () => {
      gsap.killTweensOf(line);
      gsap.to(line, { scaleX: 1, duration: 0.3, ease: "power2.out" });
    });
    wrapper.addEventListener("mouseleave", () => {
      gsap.killTweensOf(line);
      gsap.to(line, {
        scaleX: 0,
        duration: 0.25,
        ease: "power2.out"
      });
    });
  });

  document.querySelectorAll(".button").forEach((btn) => {
    const texts = btn.querySelectorAll(".button-text");
    const icon = btn.querySelector(".button-icon");
    if (icon) gsap.set(icon, { rotationZ: 45, x: -2, y: 1 });
    btn.addEventListener("mouseenter", () => {
      if (texts.length) gsap.to(texts, { yPercent: -100, duration: 0.7, ease: "expo.out" });
      if (icon) gsap.to(icon, { rotationZ: 0, x: 2, y: -2, duration: 0.7, ease: "expo.out" });
    });
    btn.addEventListener("mouseleave", () => {
      if (texts.length) gsap.to(texts, { yPercent: 0, duration: 0.7, ease: "expo.out" });
      if (icon) gsap.to(icon, { rotationZ: 45, x: 0, y: 0, duration: 0.7, ease: "expo.out" });
    });
  });

  if (typeof window.ScrollTrigger === "undefined") return;

  // 4. SPLITTEXT WORD SCRUB REVEAL & FADE-IN-ON-SCROLL (Lumenis t-5cbe52cc & a-76)
  if (typeof window.SplitText !== "undefined") {
    document.querySelectorAll(".title-animation h2, .split-reveal").forEach((el) => {
      const split = new SplitText(el, { type: "words" });
      gsap.fromTo(
        split.words,
        { opacity: 0.2 },
        {
          opacity: 1,
          duration: 0.05,
          stagger: { amount: 0.5, from: "start" },
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top 92%",
            end: "bottom 60%",
            scrub: 0.8
          }
        }
      );
    });
  }

  gsap.utils.toArray(".fade-in-on-scroll").forEach((el) => {
    gsap.fromTo(
      el,
      { opacity: 0, y: 36 },
      {
        opacity: 1,
        y: 0,
        duration: 0.85,
        ease: "expo.out",
        scrollTrigger: {
          trigger: el,
          start: "top 88%",
          toggleActions: "play none none none"
        }
      }
    );
  });

  // 5. PROJECTS SCROLL PARALLAX & HOVER (Lumenis a-81 & a-82 / a-97)
  gsap.utils.toArray(".project-list-item").forEach((item) => {
    const titleHolder = item.querySelector(".project-title-holder");
    const mainImageHolder = item.querySelector(".project-main-image-holderr");
    const categoryWrapper = item.querySelector(".project-category-wrapper");
    const linkWrapper = item.querySelector(".project-link-wrapper");
    const bgImage = item.querySelector(".project-image");
    const overlay = item.querySelector(".overlay");

    if (overlay) gsap.set(overlay, { opacity: 0.25 });

    const scrollTl = gsap.timeline({
      scrollTrigger: {
        trigger: item,
        start: "top bottom",
        end: "top 15%",
        scrub: 0.8
      }
    });

    if (titleHolder) scrollTl.fromTo(titleHolder, { yPercent: 80 }, { yPercent: 0, ease: "none" }, 0);
    if (mainImageHolder) scrollTl.fromTo(mainImageHolder, { yPercent: 45 }, { yPercent: 0, ease: "none" }, 0.05);
    if (categoryWrapper) scrollTl.fromTo(categoryWrapper, { y: 120 }, { y: 0, ease: "none" }, 0.1);

    if (linkWrapper) {
      linkWrapper.addEventListener("mouseenter", () => {
        if (overlay) gsap.to(overlay, { opacity: 0.6, duration: 0.7, ease: "expo.out" });
        if (bgImage) gsap.to(bgImage, { scale: 1.1, duration: 0.7, ease: "expo.out" });
        if (mainImageHolder) gsap.to(mainImageHolder, { scale: 1.08, duration: 0.7, ease: "expo.out" });
      });
      linkWrapper.addEventListener("mouseleave", () => {
        if (overlay) gsap.to(overlay, { opacity: 0.25, duration: 0.8, ease: "expo.out" });
        if (bgImage) gsap.to(bgImage, { scale: 1, duration: 0.8, ease: "expo.out" });
        if (mainImageHolder) gsap.to(mainImageHolder, { scale: 1, duration: 0.8, ease: "expo.out" });
      });
    }
  });

  // 6. STICKY SERVICES SCROLL TIMELINE (Lumenis a-93)
  const stickyHolder = document.querySelector(".sticky-services-holder");
  if (stickyHolder) {
    const textContainer = stickyHolder.querySelector(".services-text-container");
    const t1 = stickyHolder.querySelector(".services-text._1");
    const t2 = stickyHolder.querySelector(".services-text._2");
    const t3 = stickyHolder.querySelector(".services-text._3");
    const t4 = stickyHolder.querySelector(".services-text._4");
    const serviceImgs = gsap.utils.toArray(".services-images", stickyHolder);

    if (t1 && t2 && t3 && t4 && serviceImgs.length === 4) {
      gsap.set(t1, { opacity: 1 });
      gsap.set(t2, { opacity: 0.2 });
      gsap.set(t3, { opacity: 0.1 });
      gsap.set(t4, { opacity: 0.05 });
      if (textContainer) gsap.set(textContainer, { y: 80 });
      gsap.set(serviceImgs, { yPercent: 0 });

      const servicesTl = gsap.timeline({
        scrollTrigger: {
          trigger: stickyHolder,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.6
        }
      });

      // Stage 1 -> Stage 2 (02. TINH THẦN CHINH PHỤC)
      servicesTl
        .to(t1, { opacity: 0.2, duration: 1 }, 0)
        .to(t2, { opacity: 1, duration: 1 }, 0)
        .to(t3, { opacity: 0.2, duration: 1 }, 0)
        .to(t4, { opacity: 0.15, duration: 1 }, 0)
        .to(textContainer, { y: 25, duration: 1 }, 0)
        .to(serviceImgs, { yPercent: -100, duration: 1, ease: "power1.inOut" }, 0)

        // Stage 2 -> Stage 3 (03. LUÔN TRONG CHUYỂN ĐỘNG)
        .to(t1, { opacity: 0.15, duration: 1 }, 1)
        .to(t2, { opacity: 0.2, duration: 1 }, 1)
        .to(t3, { opacity: 1, duration: 1 }, 1)
        .to(t4, { opacity: 0.2, duration: 1 }, 1)
        .to(textContainer, { y: -40, duration: 1 }, 1)
        .to(serviceImgs, { yPercent: -200, duration: 1, ease: "power1.inOut" }, 1)

        // Stage 3 -> Stage 4 (04. SẴN SÀNG LÊN ĐƯỜNG)
        .to(t1, { opacity: 0.08, duration: 1 }, 2)
        .to(t2, { opacity: 0.12, duration: 1 }, 2)
        .to(t3, { opacity: 0.2, duration: 1 }, 2)
        .to(t4, { opacity: 1, duration: 1 }, 2)
        .to(textContainer, { y: -105, duration: 1 }, 2)
        .to(serviceImgs, { yPercent: -300, duration: 1, ease: "power1.inOut" }, 2);
    }
  }

  // 7. FOOTER WORDMARK REVEAL
  const footerWord = document.querySelector(".footer-giant-word");
  if (footerWord && typeof window.SplitText !== "undefined") {
    const splitFooter = new SplitText(footerWord, { type: "chars" });
    gsap.fromTo(
      splitFooter.chars,
      { opacity: 0, y: 60 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: { amount: 0.35 },
        ease: "expo.out",
        scrollTrigger: {
          trigger: footerWord,
          start: "top 92%",
          toggleActions: "play none none none"
        }
      }
    );
  }

  window.addEventListener("load", () => {
    ScrollTrigger.refresh();
  });
})();
