/*=====================================================================
   TERMINAL PORTFOLIO — interactions
   (menu, accordion, tabs, modal, swiper, scroll) + dynamic terminal FX
=====================================================================*/

/* ponytail: nav delegated — works even if #nav-menu belum render saat main.js dieksekusi */
document.addEventListener("click", (e) => {
  const toggle = e.target.closest && e.target.closest("#nav-toggle");
  if (toggle) {
    e.stopPropagation();
    const menu = document.getElementById("nav-menu");
    if (menu) menu.classList.toggle("show-menu");
    return;
  }
  const closer = e.target.closest && e.target.closest("#nav-close");
  if (closer) {
    const menu = document.getElementById("nav-menu");
    if (menu) menu.classList.remove("show-menu");
    return;
  }
  const link = e.target.closest && e.target.closest(".nav__link");
  if (link) {
    const menu = document.getElementById("nav-menu");
    if (menu) menu.classList.remove("show-menu");
    return;
  }
  const navMenu = document.getElementById("nav-menu");
  const navToggle = document.getElementById("nav-toggle");
  if (!navMenu || !navMenu.classList.contains("show-menu")) return;
  if (navMenu.contains(e.target) || (navToggle && navToggle.contains(e.target))) return;
  navMenu.classList.remove("show-menu");
});

/* ponytail: delegated — semua section Vue belum ada saat main.js load, jadi pakai delegation */
document.addEventListener("click", (e) => {
  const header = e.target.closest && e.target.closest(".skills__header");
  if (header) {
    const parent = header.parentNode;
    const wasClosed = parent.classList.contains("skills__close");
    document.querySelectorAll(".skills__content").forEach((c) => { c.classList.remove("skills__open"); c.classList.add("skills__close"); });
    if (wasClosed) { parent.classList.remove("skills__close"); parent.classList.add("skills__open"); }
    return;
  }
  const tab = e.target.closest && e.target.closest("[data-target]");
  if (tab) {
    const target = document.querySelector(tab.dataset.target);
    if (!target) return;
    document.querySelectorAll("[data-content]").forEach((tc) => tc.classList.remove("qualification__active"));
    target.classList.add("qualification__active");
    document.querySelectorAll("[data-target]").forEach((t) => t.classList.remove("qualification__active"));
    tab.classList.add("qualification__active");
    return;
  }
  const btn = e.target.closest && e.target.closest(".services__button");
  if (btn) {
    const allBtns = Array.from(document.querySelectorAll(".services__button"));
    const idx = allBtns.indexOf(btn);
    const views = document.querySelectorAll(".services__modal");
    if (views[idx]) views[idx].classList.add("active-modal");
    return;
  }
  const closer = e.target.closest && e.target.closest(".services__modal-close");
  if (closer) {
    document.querySelectorAll(".services__modal").forEach((v) => v.classList.remove("active-modal"));
    return;
  }
  const backdrop = e.target.closest && e.target.closest(".services__modal");
  if (backdrop && e.target === backdrop) backdrop.classList.remove("active-modal");
});

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

const lightTheme = "light-theme";
const getThemeButton = () => document.getElementById("theme-button");
const setIcon = (isLight) => {
  const btn = getThemeButton();
  if (!btn) return;
  btn.classList.toggle("uil-moon", isLight);
  btn.classList.toggle("uil-sun", !isLight);
};
function applyTheme(isLight) {
  document.documentElement.classList.toggle(lightTheme, isLight);
  document.body.classList.toggle(lightTheme, isLight);
  setIcon(isLight);
}
const selectedTheme = localStorage.getItem("selected-theme");
applyTheme(selectedTheme === "light");
/* retry icon after Vue mounts (button belum ada saat main.js dieksekusi) */
setTimeout(() => setIcon(document.body.classList.contains(lightTheme)), 800);
let _iconTries = 0;
const _iconIv = setInterval(() => {
  const b = getThemeButton();
  if (b || ++_iconTries > 20) { clearInterval(_iconIv); if (b) setIcon(document.body.classList.contains(lightTheme)); }
}, 300);

// Browser gak support View Transition API -> nyalain fallback CSS color transition.
// Kalo browser support, JANGAN nyalain ini, biar gak double-animate bareng clip-path wipe.
if (!document.startViewTransition) {
  document.documentElement.classList.add("no-view-transition");
}

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
  const btn = getThemeButton();
  if (!btn) return;
  btn.classList.remove("is-animating");
  void btn.offsetWidth;
  btn.classList.add("is-animating");
  clearTimeout(btn._animT);
  btn._animT = setTimeout(() => btn.classList.remove("is-animating"), 680);
  btn.addEventListener("animationend", () => btn.classList.remove("is-animating"), { once: true });
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

  // Smooth diagonal wipe — 1100ms (sinkron sama CSS ::view-transition-group 1.1s)
  document.documentElement.animate(
    {
      clipPath: [
        "polygon(-200% -20%, -20% -20%, -100% 120%, -200% 120%)",
        "polygon(-200% -20%, 200% -20%, 120% 120%, -200% 120%)",
      ],
    },
    {
      duration: 1100,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      pseudoElement: "::view-transition-new(root)",
    },
  );
}

/* ponytail: delegated — #theme-button mungkin belum ada saat main.js load (Vue mount belakangan) */
document.addEventListener("click", (e) => {
  const btn = e.target.closest && e.target.closest("#theme-button");
  if (btn) toggleThemeWithWipe(e);
});

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

/* Vertical cut reveal (vanilla port of the React/framer-motion template):
   every character slides up out of a clipped line, staggered. */
const VCR_REDUCED = false; // text reveal is cheap (transform only), keep it on phones too

function vcrOrder(i, total, from) {
  if (from === "last") return total - 1 - i;
  if (from === "center") return Math.abs(Math.floor(total / 2) - i);
  return i;
}

// builds the clipped, hidden characters (layout is final, nothing visible yet)
function cutBuild(el, text, o) {
  o = o || {};
  const stagger = o.stagger != null ? o.stagger : 0.025;
  const base = o.delay || 0;
  el.textContent = "";
  const token = (el.__vcr = (el.__vcr || 0) + 1); // lets a stale run notice it was replaced
  const words = [];
  const chars = [];
  text.split(" ").forEach((tok, t, all) => {
    if (tok) {
      const w = document.createElement("span");
      w.className = "vcr-word" + (o.reverse ? " is-rev" : "");
      Array.from(tok).forEach((ch) => {
        const c = document.createElement("span");
        c.className = "vcr-char";
        c.textContent = ch;
        w.appendChild(c);
        chars.push(c);
      });
      el.appendChild(w);
      words.push(w);
    }
    if (t < all.length - 1) el.appendChild(document.createTextNode(" "));
  });
  chars.forEach((c, i) => {
    c.style.transitionDelay = (base + vcrOrder(i, chars.length, o.from) * stagger).toFixed(3) + "s";
  });
  return { words, chars, token, total: base + Math.max(0, chars.length - 1) * stagger + 0.75 };
}

function cutIn(el, text, o) {
  o = o || {};
  return new Promise((resolve) => {
    if (!el) return resolve();
    if (VCR_REDUCED) { el.textContent = text; return resolve(); }
    const b = cutBuild(el, text, o);
    void el.offsetWidth; // commit the hidden state, then let it transition
    requestAnimationFrame(() => b.words.forEach((w) => w.classList.add("is-in")));
    setTimeout(() => {
      if (o.plain && el.__vcr === b.token) el.textContent = text; // flatten: fewer DOM nodes once it is done
      resolve();
    }, b.total * 1000);
  });
}
window.cutBuild = cutBuild;
window.cutIn = cutIn;

function cutOut(el, o) {
  o = o || {};
  const stagger = o.stagger != null ? o.stagger : 0.02;
  return new Promise((resolve) => {
    if (!el) return resolve();
    const chars = Array.from(el.querySelectorAll(".vcr-char"));
    if (VCR_REDUCED || !chars.length) { el.textContent = ""; return resolve(); }
    chars.forEach((c, i) => {
      c.style.transitionDelay = (vcrOrder(i, chars.length, o.from) * stagger).toFixed(3) + "s";
    });
    el.querySelectorAll(".vcr-word").forEach((w) => { w.classList.remove("is-in"); w.classList.add("is-out"); });
    setTimeout(() => { el.textContent = ""; resolve(); }, (Math.max(0, chars.length - 1) * stagger + 0.7) * 1000);
  });
}

function rotateRoles(el, roles) {
  let idx = 0;
  (function loop() {
    cutIn(el, roles[idx], { stagger: 0.03 }).then(() => {
      setTimeout(() => {
        cutOut(el, { stagger: 0.02, from: "last" }).then(() => {
          idx = (idx + 1) % roles.length;
          loop();
        });
      }, 1600);
    });
  })();
}

(function bootHero() {
  const cmdEl = document.getElementById("hero-cmd");
  const cursorEl = document.getElementById("hero-cursor");
  const outputEl = document.getElementById("hero-output");
  const roleEl = document.getElementById("typed-role");
  const titleEl = document.querySelector(".home__title");
  const descEl = document.querySelector(".home__description");
  if (!cmdEl || !outputEl) { setTimeout(bootHero, 300); return; }

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

  // "Hi, I'm " gets its own span in front of the name (the original text node stays untouched for Vue)
  let preEl = null;
  if (prefixNode && prefixNode.parentNode) {
    preEl = document.createElement("span");
    prefixNode.parentNode.insertBefore(preEl, prefixNode);
  }
  // the prompt line is static now: only the output below it animates
  cmdEl.textContent = cmdText;
  if (cursorEl) cursorEl.style.display = "none";
  const catEl = document.querySelector(".home__cat");
  let gen = 0; // bumped on every play/reset so an interrupted run stops itself
  let shown = false;
  let rolesStarted = false;

  // hidden but fully laid out: the terminal window keeps its final height, nothing jumps while the text animates
  function prepHidden() {
    if (preEl) cutBuild(preEl, prefixText, { stagger: 0.03 });
    if (descEl) cutBuild(descEl, descText, { stagger: 0.008, delay: 0.15 });
  }
  prepHidden();

  function resetHero() {
    gen++;
    shown = false;
    outputEl.style.visibility = "hidden";
    if (catEl) catEl.classList.remove("is-visible");
    if (titleEl) titleEl.classList.remove("is-typed"); // name letters drop back, ready for the next wave
    prepHidden();
  }

  function playHero(first) {
    const g = ++gen;
    shown = true;
    const alive = () => g === gen;
    setTimeout(() => {
      if (!alive()) return;
      Promise.resolve().then(() => {
        if (!alive()) return;
        outputEl.style.visibility = "visible";
        if (catEl) catEl.classList.add("is-visible");
        cutIn(preEl, prefixText, { stagger: 0.03 }).then(() => {
          if (!alive()) return;
          // ponytail: double rAF biar huruf pertama (H/I) kebaca initial state dulu, baru transisi — jadi smooth kayak lainnya
          requestAnimationFrame(() => requestAnimationFrame(() => {
            if (alive() && titleEl) titleEl.classList.add("is-typed");
          }));
          if (roleEl && !rolesStarted) { rolesStarted = true; rotateRoles(roleEl, roles); }
          cutIn(descEl, descText, { stagger: 0.008, delay: 0.15 });
        });
      });
    }, first ? 600 : 150);
  }

  // play when the home section comes into view, rewind when it is left, so coming back replays the opening
  const homeEl = outputEl.closest("#home") || outputEl.parentNode;
  const whenReady = window.onSiteReady || ((f) => f());
  whenReady(() => {
    if ("IntersectionObserver" in window) {
      let firstRun = true;
      new IntersectionObserver((entries) => {
        const e = entries[entries.length - 1];
        if (e.isIntersecting && e.intersectionRatio >= 0.2) {
          if (!shown) { playHero(firstRun); firstRun = false; }
        } else if (!e.isIntersecting && shown) {
          resetHero();
        }
      }, { threshold: [0, 0.2] }).observe(homeEl);
    } else {
      playHero(true);
    }
  });
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
  let ready = !!window.__siteReady; // sections stay hidden (skeleton) behind the hello screen
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && ready) e.target.classList.add("is-visible");
        else e.target.classList.remove("is-visible");
      });
    },
    { threshold: 0.12 },
  );
  els.forEach((el) => io.observe(el));
  const kick = () => {
    ready = true;
    els.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.92 && r.bottom > 0)
        el.classList.add("is-visible");
    });
  };
  if (ready) kick();
  else window.addEventListener("site:ready", kick, { once: true });
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
