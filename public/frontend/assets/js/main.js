/*=====================================================================
   TERMINAL PORTFOLIO — interactions
   (menu, accordion, tabs, modal, swiper, scroll) + dynamic terminal FX
=====================================================================*/

const navMenu = document.getElementById("nav-menu"),
  navToggle = document.getElementById("nav-toggle"),
  navClose = document.getElementById("nav-close");

if (navToggle) {
  navToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    navMenu.classList.toggle("show-menu");
  });
}
if (navClose) {
  navClose.addEventListener("click", () =>
    navMenu.classList.remove("show-menu"),
  );
}
/* close the dropdown when tapping outside of it */
document.addEventListener("click", (e) => {
  if (!navMenu) return;
  if (!navMenu.classList.contains("show-menu")) return;
  if (navMenu.contains(e.target) || (navToggle && navToggle.contains(e.target)))
    return;
  navMenu.classList.remove("show-menu");
});

const navLink = document.querySelectorAll(".nav__link");
function linkAction() {
  const navMenu = document.getElementById("nav-menu");
  if (!navMenu) return;
  navMenu.classList.remove("show-menu");
}
navLink.forEach((n) => n.addEventListener("click", linkAction));

const skillsContent = document.getElementsByClassName("skills__content"),
  skillsHeader = document.querySelectorAll(".skills__header");

function toggleSkills() {
  const parent = this.parentNode;
  const wasClosed = parent.classList.contains("skills__close");
  for (let i = 0; i < skillsContent.length; i++) {
    skillsContent[i].classList.remove("skills__open");
    skillsContent[i].classList.add("skills__close");
  }
  if (wasClosed) {
    parent.classList.remove("skills__close");
    parent.classList.add("skills__open");
  }
}
skillsHeader.forEach((el) => el.addEventListener("click", toggleSkills));

const tabs = document.querySelectorAll("[data-target]"),
  tabContents = document.querySelectorAll("[data-content]");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const target = document.querySelector(tab.dataset.target);
    if (!target) return;

    tabContents.forEach((tc) => tc.classList.remove("qualification__active"));
    target.classList.add("qualification__active");

    tabs.forEach((t) => t.classList.remove("qualification__active"));
    tab.classList.add("qualification__active");
  });
});

const modalViews = document.querySelectorAll(".services__modal"),
  modalBtns = document.querySelectorAll(".services__button"),
  modalCloses = document.querySelectorAll(".services__modal-close");

let modal = function (modalClick) {
  modalViews[modalClick].classList.add("active-modal");
};
modalBtns.forEach((modalBtn, i) => {
  modalBtn.addEventListener("click", () => modal(i));
});
modalCloses.forEach((modalClose) => {
  modalClose.addEventListener("click", () => {
    modalViews.forEach((modalView) =>
      modalView.classList.remove("active-modal"),
    );
  });
});
/* close a modal when clicking its dark backdrop (outside the content box) */
modalViews.forEach((modalView) => {
  modalView.addEventListener("click", (e) => {
    if (e.target === modalView) modalView.classList.remove("active-modal");
  });
});

if (typeof Swiper !== "undefined") {
  // ponytail: portfolio sekarang custom swipe-deck (tanpa .swiper-wrapper) — skip Swiper biar gak crash scrollLeft
  if (document.querySelector(".portofolio__container .swiper-wrapper")) {
    new Swiper(".portofolio__container", {
      cssMode: true,
      loop: true,
      navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
      },
      pagination: { el: ".swiper-pagination", clickable: true },
    });
  }

  let testimonial__container = new Swiper(".testimonial__container", {
    loop: true,
    grabCursor: true,
    spaceBetween: 48,
    pagination: {
      el: ".swiper-pagination",
      clickable: true,
      dynamicBullets: true,
    },
    breakpoints: { 568: { slidesPerView: 2 } },
  });
}

let ticking = false;
let lastActive = 0;
function scrollActive() {
  const now = Date.now();
  if (now - lastActive < 100) return; // throttle 100ms
  lastActive = now;
  const y = window.pageYOffset;
  document.querySelectorAll("section[id]").forEach((s) => {
    const h = s.offsetHeight,
      top = s.offsetTop - 72,
      id = s.getAttribute("id");
    const link = document.querySelector('.nav__menu a[href*="' + id + '"]');
    if (!link) return;
    link.classList.toggle("active-link", y > top && y <= top + h);
  });
}
function onScroll() {
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(() => {
      scrollActive();
      scrollHeader();
      ticking = false;
    });
  }
}
const _isCoarseScroll = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
if (!_isCoarseScroll) window.addEventListener("scroll", onScroll, { passive: true });
else { // coarse: throttle lebih jarang pakai timeout
  let t; window.addEventListener("scroll", () => { clearTimeout(t); t=setTimeout(()=>{scrollActive();scrollHeader()},120) }, { passive: true });
}

function scrollHeader() {
  const nav = document.getElementById("header");
  if (!nav) return;
  nav.classList.toggle("scroll-header", window.scrollY >= 12);
}

const themeButton = document.getElementById("theme-button");
const lightTheme = "light-theme";

const setIcon = (isLight) => {
  if (!themeButton) return;
  themeButton.classList.toggle("uil-moon", isLight);
  themeButton.classList.toggle("uil-sun", !isLight);
};

function applyTheme(isLight) {
  document.documentElement.classList.toggle(lightTheme, isLight);
  document.body.classList.toggle(lightTheme, isLight);
  setIcon(isLight);
}
const selectedTheme = localStorage.getItem("selected-theme");
applyTheme(selectedTheme === "light");

function isGameActive() {
  return !!document.querySelector(".gh-game-canvas") || !!document.querySelector(".gh-calendar--game");
}
function showThemeBlockedToast() {
  let el = document.getElementById("theme-block-toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "theme-block-toast";
    el.style.cssText = "position:fixed;top:calc(var(--header-height) + 10px);left:50%;transform:translateX(-50%);z-index:1001;background:#1a1a1a;color:#fff;border:1px solid #333;padding:10px 16px;border-radius:10px;font-family:var(--body-font);font-size:12px;box-shadow:0 4px 16px rgba(0,0,0,.4);pointer-events:none;opacity:0;transition:opacity .25s ease;max-width:90vw;text-align:center";
    document.body.appendChild(el);
  }
  el.textContent = "Game lagi jalan! Matiin / selesaikan gamenya dulu baru bisa ganti tema.";
  el.style.opacity = "1";
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.style.opacity = "0"; }, 2500);
}

function triggerThemeIconAnim() {
  if (!themeButton) return;
  themeButton.classList.remove("is-animating");
  void themeButton.offsetWidth;
  themeButton.classList.add("is-animating");
  clearTimeout(themeButton._animT);
  themeButton._animT = setTimeout(() => themeButton.classList.remove("is-animating"), 680);
  themeButton.addEventListener("animationend", () => themeButton.classList.remove("is-animating"), { once: true });
}
async function toggleThemeWithWipe(e) {
  if (isGameActive()) {
    if (e) e.preventDefault();
    showThemeBlockedToast();
    return;
  }
  const isLight = !document.body.classList.contains(lightTheme);
  triggerThemeIconAnim();

  // Browser gak support View Transition API -> langsung toggle biasa, gak usah animasi
  if (!document.startViewTransition) {
    applyTheme(isLight);
    localStorage.setItem("selected-theme", isLight ? "light" : "dark");
    return;
  }

  const transition = document.startViewTransition(() => {
    applyTheme(isLight);
    localStorage.setItem("selected-theme", isLight ? "light" : "dark");
  });

  await transition.ready;

  // Smooth diagonal wipe — 1900ms super slow (sinkron sama CSS 1.5s/1.9s)
  document.documentElement.animate(
    {
      clipPath: [
        "polygon(-200% -20%, -20% -20%, -100% 120%, -200% 120%)",
        "polygon(-200% -20%, 200% -20%, 120% 120%, -200% 120%)",
      ],
    },
    {
      duration: 1900,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      pseudoElement: "::view-transition-new(root)",
    },
  );
}

if (themeButton) {
  themeButton.addEventListener("click", toggleThemeWithWipe);
}

(function () {
  let t;
  window.addEventListener(
    "scroll",
    () => {
      document.documentElement.classList.add("is-scrolling");
      clearTimeout(t);
      t = setTimeout(
        () => document.documentElement.classList.remove("is-scrolling"),
        220,
      );
    },
    { passive: true },
  );
})();

/*=====================================================================
    DYNAMIC TERMINAL FX
 =====================================================================*/

function typeInto(el, text, speed, done) {
  let i = 0;
  (function step() {
    if (!el) return;
    el.textContent = text.slice(0, i);
    if (i <= text.length) {
      i++;
      setTimeout(step, speed);
    } else if (done) done();
  })();
}

function deleteFrom(el, done) {
  (function step() {
    if (!el) return;
    const t = el.textContent;
    if (t.length) {
      el.textContent = t.slice(0, -1);
      setTimeout(step, 40);
    } else if (done) done();
  })();
}

function rotateRoles(el, roles) {
  let idx = 0;
  function loop() {
    typeInto(el, roles[idx], 65, () => {
      setTimeout(() => {
        deleteFrom(el, () => {
          idx = (idx + 1) % roles.length;
          loop();
        });
      }, 1500);
    });
  }
  loop();
}

(function bootHero() {
  const cmdEl = document.getElementById("hero-cmd");
  const cursorEl = document.getElementById("hero-cursor");
  const outputEl = document.getElementById("hero-output");
  const roleEl = document.getElementById("typed-role");
  const titleEl = document.querySelector(".home__title");
  const descEl = document.querySelector(".home__description");
  if (!cmdEl || !outputEl) return;

  const cmdText = cmdEl.dataset.cmd || "whoami && cat profile.json";
  let roles = ["Fullstack Developer", "DevOps Engineer", "UI/UX Designer"];
  try {
    if (roleEl && roleEl.dataset.roles)
      roles = JSON.parse(roleEl.dataset.roles);
  } catch (e) {
    /* keep fallback roles */
  }

  // isolate "Hi, I'm " text node so it can be typed separately from the name
  const prefixNode =
    titleEl &&
    Array.from(titleEl.childNodes).find(
      (n) => n.nodeType === 3 && n.textContent.trim(),
    );
  const prefixText = prefixNode ? prefixNode.textContent : "";
  if (prefixNode) prefixNode.textContent = "";

  const descText = descEl ? descEl.textContent : "";
  if (descEl) descEl.textContent = "";

  setTimeout(() => {
    typeInto(cmdEl, cmdText, 85, () => {
      if (cursorEl) cursorEl.style.display = "none";
      outputEl.style.display = "block";
      const cat = document.querySelector(".home__cat");
      if (cat) cat.classList.add("is-visible");

      typeInto(prefixNode, prefixText, 45, () => {
        // ponytail: double rAF biar huruf pertama (H/I) kebaca initial state dulu, baru transisi — jadi smooth kayak lainnya
        requestAnimationFrame(() => requestAnimationFrame(() => {
          if (titleEl) titleEl.classList.add("is-typed");
        }));
        if (roleEl) rotateRoles(roleEl, roles);
        typeInto(descEl, descText, 12);
      });
    });
  }, 600);
})();

function initReveal() {
  const selectors = [
    ".term-window",
    ".about__img",
    ".section__title",
    ".section__subtitle",
    ".skills__content",
    ".qualification__data",
    ".services__content",
    ".portofolio__container",
    ".portofolio__content",
    ".contact__information",
    ".contact__form",
    ".project__bg",
  ];
  const els = document.querySelectorAll(selectors.join(","));
  if (!els.length) return false;
  els.forEach((el, i) => {
    if (!el.classList.contains("reveal")) {
      el.classList.add("reveal");
      el.style.transitionDelay = Math.min(i % 6, 6) * 60 + "ms";
    }
  });
  if (!("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("is-visible"));
    return true;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add("is-visible");
        else e.target.classList.remove("is-visible");
      });
    },
    { threshold: 0.12 },
  );
  els.forEach((el) => io.observe(el));
  els.forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.92 && r.bottom > 0)
      el.classList.add("is-visible");
  });
  return true;
}
(function setupReveal() {
  if (initReveal()) return;
  let t = 0;
  const id = setInterval(() => {
    if (initReveal() || ++t > 20) clearInterval(id);
  }, 300);
})();
(function () {
  const prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isCoarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  if (prefersReduced || isCoarse) return; // HP / reduce-motion → native scroll aja, hemat
  if (typeof Lenis === "undefined") {
    console.warn("[LENIS] Library tidak ditemukan, fallback ke native scroll.");
    return;
  }

  try {
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.2,
    });
    lenis.on("scroll", () => {});
    const chatbotBody = document.querySelector(".chatbot-body");
    if (chatbotBody) {
      chatbotBody.setAttribute("data-lenis-prevent", "");
      chatbotBody.addEventListener("wheel", (e) => e.stopPropagation(), {
        passive: true,
      });
      chatbotBody.addEventListener("touchmove", (e) => e.stopPropagation(), {
        passive: true,
      });
    }
    document.addEventListener(
      "wheel",
      (e) => {
        if (
          e.target.closest &&
          e.target.closest(".chatbot-body, .chatbot-panel")
        )
          e.stopPropagation();
      },
      { passive: true, capture: true },
    );

    window.lenis = lenis;

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // smooth-scroll for in-page anchor nav links (#home, #about, etc.)
    document.addEventListener("click", (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;
      const id = link.getAttribute("href");
      if (!id || id === "#") return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el, { offset: 0, duration: 1.1 });
      link.blur();
    });
  } catch (err) {
    console.warn(
      "[LENIS] Error inisialisasi, fallback ke native scroll:",
      err.message,
    );
  }
})();
