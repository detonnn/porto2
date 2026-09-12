<template>
  <div>
    <transition name="notif-mute-enter">
      <button
        v-if="showMute"
        class="notif-mute-btn"
        :class="{ muted: isMuted }"
         :title="isMuted ? 'Aktifkan notifikasi' : 'Do Not Disturb'"
         :aria-label="isMuted ? 'Aktifkan notifikasi' : 'Do Not Disturb'"
        @click="toggleMute"
      >
        <transition name="mute-icon" mode="out-in">
           <i
             :key="String(isMuted)"
             class="uil"
             :class="isMuted ? 'uil-volume-mute' : 'uil-bell'"
           ></i>
        </transition>
      </button>
    </transition>
    <div class="live-notif-wrap">
      <transition name="notif-pop">
        <div
          v-if="current"
          :key="current.id"
          class="live-notif"
          :class="{
            'live-notif--nav': current.type === 'nav',
            'live-notif--expanded': isExpanded,
          }"
          @click="handleClick(current)"
        >
          <div
            class="live-notif__avatar"
            :style="{ background: current.color }"
          >
            <svg
              v-if="current.type === 'nav'"
              class="live-notif__icon"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M9 6l6 6-6 6"
                stroke="#fff"
                stroke-width="2.4"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <svg
              v-else
              class="live-notif__icon"
              viewBox="0 0 24 24"
              fill="#fff"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" />
            </svg>
          </div>
          <div class="live-notif__body">
            <p class="live-notif__name">
              <span class="live-notif__title">{{ current.name }}</span>
              <span class="live-notif__dot">·</span>
              <span class="live-notif__time">{{ current.time }}</span>
            </p>
            <p class="live-notif__msg">{{ current.message }}</p>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script>
const RANDOM_NAMES = [
  "Windah Habatusauda",
  "Luthfi Kotak",
  "Agung Knalpot",
  "Budi Martabak",
  "Slamet Kopling",
  "Joko Sambel",
  "Udin Cilok",
  "Mamat Racing",
  "Dadang Tamvan",
  "Cecep Sosis",
  "Siti Gorengan",
  "Bambang Kewer",
  "Sugeng Parkir",
  "Dexton KW",
  "Rizal Panci",
  "Agus Plastik",
  "Yanto Karbu",
  "Supri Sendal",
  "dani onepiece",
  "Wawan Helm",
];

const RANDOM_MESSAGES = [
  "keren banget portfolionya",
  "eh ini animasinya smooth banget",
  "gw baru liat, mantap dev-nya",
  "boleh tau tech stack yang dipake?",
  "ini react apa vue sih?",
  "web-nya cepet banget loadingnya",
  "wih terminal themenya unik",
  "gass kontak buat kerja bareng",
  "dark mode nya enak di mata",
  "baru pertama liat portfolio se-niche ini",
  "ini web apa warteg? rame amat 😭",
  "spill gorengan dong bang dexton",
  "portfolio rasa nasi padang, lengkap bet",
  "kapan open joki tugas bang? wkwk",
  "ini mah bukan portfolio, ini galeri seni",
  "info loker dong bang, ikut kerja?",
  "lah kok bisa se smooth ini scrollnya",
  "pinjem 100 bang, abis liat portfolio jadi minder",
  "keren cuy, inspirasi buat tugas gw nih",
  "mantap kali designnya, auto contek",
  "bang tutor bikin web kek gini dong 🙏",
  "inspirasi designnya dari mana bang?",
  "ini hosting dimana? kenceng bener",
  "boleh minta file figmanya ga bang?",
  "gilak ini warna nya cakep bet",
  "otw jadiin referensi skripsi gw",
  "bang lu pake AI apa ngoding manual?",
  "sumpah ini portofolio paling niat yg pernah gw liat",
  "ajarin ngoding dong bang sepuh",
  "spill harga bikin web kayak gini bang",
  "ini beneran lu yang bikin? GOKIL",
  "kok bisa kepikiran terminal di portfolio 😭 keren",
  "tau 9router ga bang? gw mau bikin web kek gini",
  "up code di github bg",
  "Gw udah level 4 nih di game nya",
];

const DEXTON_MESSAGES = [
  "lagi ngoding fitur baru nih 👨‍💻",
  "kalo ada bug wa gw",
  "makasih udah mampir",
  "lagi benerin performance web ini",
  "coba scroll terus, banyak easter egg",
  "Tanya ai aja jangan tanya gw ",
  "bukan  cowo bingung",
  "lagi ngulik animasi baru nih",
  "santai, enjoy aja scrollnya",
];

const NAV_ITEMS = [
  { id: "about", label: "Scroll ke bawah, liat about gw" },
  { id: "skills", label: "Cek skill-skill yang gw kuasai" },
  { id: "github", label: "Liat aktivitas GitHub gw" },
  { id: "portfolio", label: "Scroll ke bawah liat project-nya" },
  { id: "testimonial", label: "Ada testimoni juga lho di bawah" },
  { id: "contact", label: "Mau kontak gw? ada di bawah" },
];

const AVATAR_COLORS = [
  "#00C9A7",
  "#FFB800",
  "#FF3D71",
  "#1E86FF",
  "#8C7CF0",
  "#FF7A45",
  "#2EC4B6",
  "#E84393",
];

const TIME_LABELS = ["baru saja", "1m lalu", "2m lalu", "5m lalu", "10m lalu"];
const NOTIF_SOUND = "/frontend/assets/audio/iphone.MP3";
const SOUND_DURATION_MS = 1780;

function randomOf(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ponytail: pool shuffle — tiap pesan/nama ga ngulang sebelum semua kepake 1x
let _poolMsg = [];
let _poolName = [];
let _poolDexton = [];
let _poolNav = [];
let _lastMsg = "";
let _lastName = "";
function pull(pool, source, last) {
  if (pool.length === 0) pool.push(...shuffle([...source]));
  // hindari ngulang di boundary shuffle (last item shuffle lama == first item shuffle baru)
  if (last && pool[pool.length - 1] === last && pool.length > 1) {
    // swap last dengan random tengah
    const k = Math.floor(Math.random() * (pool.length - 1));
    [pool[pool.length - 1], pool[k]] = [pool[k], pool[pool.length - 1]];
  }
  // kalau pool berisi object (NAV), bandingkan by label/id
  return pool.pop();
}

function makeNotification() {
  const roll = Math.random();
  let type = "chat";
  if (roll < 0.25) type = "nav";
  else if (roll < 0.4) type = "dexton";

  const id = Date.now() + Math.random();
  const time = randomOf(TIME_LABELS);

  if (type === "nav") {
    const nav = pull(_poolNav, NAV_ITEMS, _lastMsg);
    _lastMsg = nav.label;
    _lastName = "Navigasi";
    return {
      id,
      type: "nav",
      targetId: nav.id,
      name: "Navigasi",
      message: nav.label,
      color: "#333333",
      time,
    };
  }

  if (type === "dexton") {
    const msg = pull(_poolDexton, DEXTON_MESSAGES, _lastMsg);
    _lastMsg = msg;
    _lastName = "Dxtnn";
    return {
      id,
      type: "dexton",
      name: "Dxtnn",
      message: msg,
      color: randomOf(AVATAR_COLORS),
      initial: "D",
      time,
    };
  }

  const name = pull(_poolName, RANDOM_NAMES, _lastName);
  const msg = pull(_poolMsg, RANDOM_MESSAGES, _lastMsg);
  _lastName = name;
  _lastMsg = msg;
  return {
    id,
    type: "chat",
    name,
    message: msg,
    color: randomOf(AVATAR_COLORS),
    initial: name.charAt(0),
    time,
  };
}

export default {
  name: "LiveNotifications",
  data() {
    return {
      current: null,
      spawnTimer: null,
      hideTimer: null,
      isExpanded: false,
      isMuted: false,
      showMute: false,
    };
  },
  mounted() {
    try {
      this.isMuted = localStorage.getItem("live_notif_muted") === "1";
    } catch (e) {}
    // mute btn masuk barengan nav (setelah loader hilang, sama timing kayak notif)
    const revealMute = () => {
      this.showMute = true;
    };
    // jangan spawn saat loader "hello" masih nutupin layar (~4.5-7s)
    const tryStart = () => {
      this.scheduleNext(2000 + Math.random() * 1500);
      revealMute();
    };
    const loader = document.getElementById("app-loader");
    const app = document.getElementById("app");
    const loaderGone = () =>
      !loader ||
      loader.dataset.done === "1" ||
      loader.style.display === "none" ||
      (app && app.classList.contains("is-ready"));
    if (loaderGone()) tryStart();
    else {
      let waited = 0;
      const iv = setInterval(() => {
        waited += 200;
        if (loaderGone() || waited > 7000) {
          clearInterval(iv);
          tryStart();
        }
      }, 200);
    }
    // unlock audio HP: singleton + prime biar next play ga ke-block autoplay
    // ponytail: reuse satu Audio biar ga bikin new Audio tiap notif (iOS block per-element)
    this._notifAudio = new Audio(NOTIF_SOUND);
    this._notifAudio.volume = 0.6;
    this._notifAudio.preload = "auto";
    try { this._notifAudio.load(); } catch (e) {}
    // dummy untuk keep-alive tanpa ganggu _notifAudio yang lagi play
    this._primeDummy = new Audio(NOTIF_SOUND);
    this._primeDummy.volume = 0;
    this._primeDummy.preload = "auto";
    try { this._primeDummy.load(); } catch(e) {}
    this._primed = false;
    this._unlockAudio = () => {
      try {
        if (!this._primed) {
          const a = this._notifAudio;
          a.volume = 0;
          a.play().then(() => { a.pause(); a.currentTime = 0; a.volume = 0.6; this._primed = true; }).catch(() => { a.volume = 0.6; this._primed = true; });
        }
        // keep-alive pakai dummy, jangan sentuh _notifAudio lagi biar gak kepause pas lagi bunyi
        const d = this._primeDummy;
        d.currentTime = 0;
        d.play().then(() => { d.pause(); d.currentTime = 0; }).catch(()=>{});
        if (window._portoAudioCtx && window._portoAudioCtx.state === "suspended") window._portoAudioCtx.resume();
      } catch (e) {}
    };
    // ponytail: jangan once:true — transient activation expire setelah idle, perlu re-prime
    ["click", "touchstart", "keydown", "pointerdown"].forEach((ev) =>
      window.addEventListener(ev, this._unlockAudio, { capture: true }),
    );
    // prime immediately if user already interacted (e.g. HMR)
    if (navigator.userActivation && navigator.userActivation.hasBeenActive) this._unlockAudio();
    this._onDocClick = (e) => {
      if (!this.isExpanded || !this.current) return;
      if (!e.target.closest || !e.target.closest(".live-notif")) this.dismiss();
    };
    document.addEventListener("click", this._onDocClick);
  },
  beforeUnmount() {
    clearTimeout(this.spawnTimer);
    clearTimeout(this.hideTimer);
    if (this._onDocClick)
      document.removeEventListener("click", this._onDocClick);
    if (this._unlockAudio)
      ["click", "touchstart", "keydown", "pointerdown"].forEach((ev) =>
        window.removeEventListener(ev, this._unlockAudio, { capture: true }),
      );
  },
  methods: {
    scheduleNext(delay) {
      clearTimeout(this.spawnTimer);
      let wait;
      if (delay != null) wait = delay;
      else {
        // 30% burst: jeda pendek 1.2-3s (kesan dobel), 70% jeda normal 4-14s
        const isBurst = Math.random() < 0.3;
        wait = isBurst
          ? 1200 + Math.random() * 1800
          : 4000 + Math.random() * 10000;
        // jitter ±20% biar ga beritme
        wait *= 0.8 + Math.random() * 0.4;
      }
      this.spawnTimer = setTimeout(this.spawn, wait);
    },
     spawn() {
       if (this.isMuted) {
         this.scheduleNext();
         return;
       }
       clearTimeout(this.hideTimer);
       clearTimeout(this.spawnTimer);
       this.isExpanded = false;
       this.current = makeNotification();
       this.playSound();
       // durasi tampil random 4.5-6s — tiap notif timer sendiri, ga ngikutin yang awal
       const visibleMs = 4500 + Math.random() * 1500;
       this.hideTimer = setTimeout(this.dismiss, visibleMs);
     },
    playSound() {
      if (this.isMuted) return;
      try {
        const a = this._notifAudio || new Audio(NOTIF_SOUND);
        // reuse singleton — iOS hanya allow play untuk element yang sudah di-prime
        if (!this._notifAudio) { this._notifAudio = a; a.preload = "auto"; }
        a.volume = 0.6;
        a.currentTime = 0;
        const p = a.play();
        if (p && p.catch) p.catch(() => {
          // autoplay blocked (transient activation habis) — retry di gesture berikutnya
          const retry = () => { a.currentTime = 0; a.play().catch(() => {}); };
          ["click", "touchstart", "pointerdown"].forEach((ev) =>
            window.addEventListener(ev, retry, { capture: true, once: true }),
          );
        });
      } catch (e) {
        // ignore
      }
    },
    toggleMute() {
      this.isMuted = !this.isMuted;
      try {
        localStorage.setItem("live_notif_muted", this.isMuted ? "1" : "0");
      } catch (e) {}
    },
    dismiss() {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
      this.isExpanded = false;
      this.current = null;
      this.scheduleNext();
    },
    handleClick(notif) {
      // klik pertama: pause + expand biar baca full chat (auto-hide 7s kalau dicuekin)
      if (!this.isExpanded) {
        clearTimeout(this.hideTimer);
        clearTimeout(this.spawnTimer);
        this.isExpanded = true;
        this.hideTimer = setTimeout(this.dismiss, 7000);
        return;
      }
      // klik kedua saat expanded: kalau nav → scroll, lalu dismiss
      if (notif.type === "nav") {
        const target = document.getElementById(notif.targetId);
        if (target) {
          if (window.lenis && typeof window.lenis.scrollTo === "function") {
            window.lenis.scrollTo(target, { offset: -70 });
          } else {
            target.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }
      }
      clearTimeout(this.hideTimer);
      this.dismiss();
    },
  },
};
</script>

<style scoped>
.live-notif-wrap {
  position: fixed;
  top: 5.5rem;
  left: 1.25rem;
  z-index: var(--z-fixed, 100);
  pointer-events: none;
}

.live-notif {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 0.85rem;
  width: 17rem;
  padding: 0.85rem 1rem;
  border-radius: 1.1rem;
  background: #17181b;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35), 0 12px 28px rgba(0, 0, 0, 0.25);
  cursor: pointer;
  font-family: var(--body-font);
  transform: translateZ(0);
  transition: all 0.2s ease-in-out;
}

.live-notif:hover {
  transform: scale(1.03) translateZ(0);
}

body.light-theme .live-notif {
  background: #ffffff;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.03), 0 2px 4px rgba(0, 0, 0, 0.05),
    0 12px 24px rgba(0, 0, 0, 0.05);
}

.live-notif--nav {
  box-shadow: 0 0 0 1.5px var(--accent, #fff), 0 4px 12px rgba(0, 0, 0, 0.35);
}
body.light-theme .live-notif--nav {
  box-shadow: 0 0 0 1.5px var(--accent, #000), 0 2px 4px rgba(0, 0, 0, 0.05),
    0 12px 24px rgba(0, 0, 0, 0.05);
}

.live-notif__avatar {
  flex-shrink: 0;
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.25);
}

.live-notif__icon {
  width: 1.15rem;
  height: 1.15rem;
}

.live-notif__body {
  min-width: 0;
}

.live-notif__name {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 700;
  color: #ffffff;
  display: flex;
  align-items: baseline;
  gap: 0.3rem;
}

body.light-theme .live-notif__name {
  color: #1a1a1a;
}

.live-notif__dot {
  color: var(--text-dim, #6b7a92);
  font-weight: 400;
}

.live-notif__time {
  font-weight: 400;
  font-size: 0.7rem;
  color: var(--text-dim, #6b7a92);
}

.live-notif__msg {
  margin: 0.1rem 0 0;
  font-size: 0.78rem;
  line-height: 1.3;
  color: var(--text-dim, #8a8a8e);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
}
.live-notif--expanded {
  align-items: flex-start;
}
.live-notif--expanded .live-notif__msg {
  display: block;
  -webkit-line-clamp: unset;
  white-space: normal;
  overflow: visible;
  text-overflow: clip;
}

body.light-theme .live-notif__msg {
  color: #555;
}

/* mute toggle — kiri atas, masuk barengan nav (fixed) */
.notif-mute-btn {
  position: fixed;
  top: calc(var(--header-height) / 2 - 16px);
  left: 1.25rem;
  z-index: 101;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: #17181b;
  color: var(--text-dim);
  display: grid;
  place-items: center;
  cursor: pointer;
  font-size: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  transition: all 0.2s ease;
}
.notif-mute-btn:hover {
  color: var(--text);
  border-color: var(--text-dim);
  transform: scale(1.07);
}
.notif-mute-btn:active {
  transform: scale(0.92);
}
.notif-mute-btn.muted {
  color: var(--red);
  border-color: rgba(255, 107, 107, 0.4);
  background: rgba(255, 107, 107, 0.12);
  animation: mutePulse 1.6s ease infinite;
}
@keyframes mutePulse {
  0%,
  100% {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25), 0 0 0 0 rgba(255, 107, 107, 0);
  }
  50% {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25),
      0 0 0 6px rgba(255, 107, 107, 0.18);
  }
}
body.light-theme .notif-mute-btn {
  background: #ffffff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}
body.light-theme .notif-mute-btn.muted {
  background: rgba(214, 69, 63, 0.1);
}
.notif-mute-enter-active {
  transition: all 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.notif-mute-enter-from {
  opacity: 0;
  transform: translateX(-20px) scale(0.85);
}
.mute-icon-enter-active {
  transition: all 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.mute-icon-leave-active {
  transition: all 0.18s ease-in;
}
.mute-icon-enter-from {
  opacity: 0;
  transform: scale(0.4) rotate(-20deg);
}
.mute-icon-leave-to {
  opacity: 0;
  transform: scale(0.4) rotate(20deg);
}

/* transition */
.notif-pop-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.notif-pop-leave-active {
  transition: all 0.3s ease-in;
}
.notif-pop-enter-from {
  opacity: 0;
  transform: translateY(-12px) scale(0.9);
}
.notif-pop-leave-to {
  opacity: 0;
  transform: translateX(-16px) scale(0.95);
}

@media (max-width: 1112px) {
  .notif-mute-btn {
    top: calc(var(--header-height) + 0.6rem);
    left: 1rem;
  }
}
@media (max-width: 768px) {
  .live-notif-wrap {
    top: 4.5rem;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    display: flex;
    justify-content: center;
  }
  .live-notif {
    width: 90vw;
    max-width: 20rem;
  }
}
</style>
