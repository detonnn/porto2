<template>
  <div class="chatbot-widget" :class="{ open: isOpen }" id="chatbotWidget">
    <div
      class="chatbot-panel"
      :class="{ 'menu-open': menuOpen }"
      id="chatbotPanel"
    >
      <div class="chatbot-header">
        <div class="chatbot-avatar">
          <img
            src="/frontend/assets/img/raccon.gif"
            class="chatbot-avatar-img"
            alt="Assistant"
          />
        </div>
        <div class="chatbot-header-info">
          <strong>Dexton Assistant</strong>
          <span class="chatbot-status" :class="{ typing: typing }">
            <span class="chatbot-status-dot"></span>
            <span>{{ typing ? "mengetik..." : "Online" }}</span>
          </span>
        </div>
        <button
          class="chatbot-music-toggle"
          :class="{ active: musicPlaying }"
          type="button"
          :aria-label="musicPlaying ? 'Pause musik' : 'Putar musik'"
          :title="musicPlaying ? 'Pause musik' : 'Putar musik'"
          @click.stop="handleMusicToggleClick"
        >
          <i class="uil" :class="musicPlaying ? 'uil-pause' : 'uil-music'"></i>
        </button>

        <div
          class="chatbot-menu-wrap"
          :class="{ open: menuOpen }"
          id="chatbotMenuWrap"
          ref="menuWrap"
        >
          <button
            class="chatbot-menu-btn"
            aria-label="Menu Chat"
            @click.stop="menuOpen = !menuOpen"
          >
            <i class="uil uil-ellipsis-h"></i>
          </button>
          <div class="chatbot-menu-dropdown">
            <button
              class="chatbot-menu-item"
              @click="
                closeMenu();
                startFreshChat();
              "
            >
              <i class="uil uil-edit"></i> <span>Mulai Chat Baru</span>
            </button>
            <button
              class="chatbot-menu-item"
              @click="
                closeMenu();
                endChat();
              "
            >
              <i class="uil uil-multiply"></i> <span>Akhiri Chat</span>
            </button>
            <button class="chatbot-menu-item" @click="showHistory">
              <i class="uil uil-history"></i> <span>Lihat Riwayat Chat</span>
            </button>
          </div>
        </div>
        <button class="chatbot-close" aria-label="Close" @click="closeChat">
          <i class="uil uil-multiply"></i>
        </button>
      </div>

      <div class="chatbot-scrim" @click="closeMenu"></div>

      <div class="chatbot-body" ref="body" @scroll.passive="onBodyScroll">
        <div
          v-for="(m, i) in messages"
          :key="i"
          class="chatbot-msg-row"
          :class="[
            m.sender,
            {
              focused: activeReact === i,
              dimmed: activeReact !== null && activeReact !== i,
            },
          ]"
          @click="onBotMsgClick($event, i)"
        >
          <div class="chatbot-msg" :class="m.sender">
            {{ m.text }}
            <span
              v-if="m.sender === 'bot' && m.reaction"
              class="chatbot-react-badge"
              >{{ reactionEmoji(m.reaction) }}</span
            >
            <div
              v-if="m.sender === 'bot' && activeReact === i"
              class="chatbot-react-bar"
              :class="{ 'chatbot-react-bar--below': activeReactBelow }"
            >
              <button
                v-for="r in reactions"
                :key="r.key"
                class="chatbot-react-btn"
                :class="{ selected: m.reaction === r.key }"
                type="button"
                :title="r.key"
                @click.stop="setReaction(i, r.key)"
              >
                {{ r.emoji }}
              </button>
            </div>
            <div v-if="m.links && m.links.length" class="chatbot-link-row">
              <a
                v-for="(l, j) in m.links"
                :key="j"
                :href="l.url"
                target="_blank"
                rel="noopener noreferrer"
                class="chatbot-link-btn"
              >
                <i :class="l.iconClass"></i> {{ l.label }}
              </a>
            </div>
            <div
              v-if="m.playlist && m.playlist.length"
              class="chatbot-playlist"
            >
              <div
                v-for="opt in m.playlist"
                :key="opt.index"
                class="pl-row"
                :class="{ 'pl-row--playing': isTrackPlaying(opt.index) }"
                @click.stop="selectTrack(opt.index)"
              >
                <div class="pl-row__index">
                  <span class="pl-num">{{ opt.index + 1 }}</span>
                  <span class="pl-bars"
                    ><span></span><span></span><span></span
                  ></span>
                  <span class="pl-play"></span>
                </div>
                <div class="pl-row__main">
                  <img
                    class="pl-row__art"
                    :src="opt.cover"
                    :alt="opt.title"
                    loading="lazy"
                  />
                  <div class="pl-row__text">
                    <div class="pl-row__title">{{ opt.title }}</div>
                    <div class="pl-row__artist">{{ opt.artist }}</div>
                  </div>
                </div>
                <div class="pl-row__duration">{{ opt.duration }}</div>
              </div>
            </div>
          </div>
        </div>
        <div v-if="historyView" class="chatbot-msg bot chatbot-history-list">
          <div v-if="!historyList.length">
            Belum ada riwayat chat sebelumnya.
          </div>
          <div
            v-for="(h, k) in historyList"
            :key="k"
            class="chatbot-history-item"
          >
            {{ h.text }}
          </div>
        </div>
        <div v-if="typing" class="chatbot-typing">
          <span></span><span></span><span></span>
          <em class="chatbot-typing-label">Assistant Is Typing...</em>
        </div>
      </div>

      <div class="chatbot-input-bar-wrap">
        <div class="chatbot-input-bar" @click="focusInput">
          <div
            class="chatbot-quick-collapse"
            :class="{ collapsed: !showQuickInside }"
          >
            <div class="chatbot-quick-collapse-inner">
              <div v-if="showQuick" class="chatbot-quick-inside">
                <button
                  v-for="q in quickReplies"
                  :key="q.key"
                  class="chatbot-quick-btn"
                  type="button"
                  @click.stop="handleUserInput(q.label, q.answer)"
                >
                  {{ q.label }}
                </button>
              </div>
            </div>
          </div>
          <div class="chatbot-textarea-wrap">
            <textarea
              ref="input"
              class="chatbot-input"
              v-model="inputText"
              placeholder="Tulis pesan..."
              autocomplete="off"
              rows="1"
              @keydown.enter.exact.prevent="handleUserInput(inputText)"
              @input="autoGrow"
            />
          </div>
          <div class="chatbot-actions-row">
            <div class="chatbot-actions-left">
              <span class="chatbot-hint"
                >Enter kirim · Shift+Enter baris baru</span
              >
            </div>
            <button
              class="chatbot-send-btn"
              :class="{ active: inputText.trim().length > 0 }"
              aria-label="Send"
              type="button"
              @click="handleUserInput(inputText)"
            >
              <i class="uil uil-arrow-up"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <button
      class="chatbot-toggle-btn"
      aria-label="Buka Asisten Virtual"
      @click.stop="toggle"
    >
      <i class="uil uil-comment-alt-dots chatbot-icon-chat"></i>
      <i class="uil uil-multiply chatbot-icon-close"></i>
    </button>
  </div>
</template>

<script>
import {
  musicState,
  MUSIC_TRACKS,
  hasTracks,
  playTrack,
  pauseMusic,
  toggleMusic,
  onTrackEnded,
} from "./musicPlayer";

const CONTACT_LINKS = {
  instagram: {
    label: "Buka Instagram",
    url: "https://www.instagram.com/dxtnn_",
    iconClass: "uil uil-instagram",
  },
  tiktok: {
    label: "Buka TikTok",
    url: "https://www.tiktok.com/@risemss",
    iconClass: "uil uil-video",
  },
  whatsapp: {
    label: "Chat WhatsApp",
    url: "https://wa.me/6285281144792",
    iconClass: "uil uil-whatsapp",
  },
  email: {
    label: "Kirim Email",
    url: "mailto:ibnudexton@gmail.com",
    iconClass: "uil uil-envelope",
  },
};

const REACTIONS = [
  { key: "love", emoji: "❤️" },
  { key: "like", emoji: "👍" },
  { key: "dislike", emoji: "👎" },
  { key: "laugh", emoji: "😂" },
  { key: "wow", emoji: "❗" },
  { key: "hmm", emoji: "❓" },
];

const QUICK_REPLIES = [
  { key: "q1", label: "Profil singkat?", answer: "ans1" },
  {
    key: "q3",
    label: "Mau Dengerin Musik?",
    answer: "ansMusicPlaylistIntro",
  },
  { key: "q4", label: "Cara Kontak?", answer: "ans4" },
];

const ANSWERS = {
  ans1: "Muhammad Ibnu Dexton Alfathir — 19 tahun, Tangerang, mahasiswa Universitas Pamulang, anak pertama dari 2 bersaudara. Lulusan SMKN 5 Kota Tangerang DKV, fokus di UI/UX, graphic design, motion design, dan frontend dev.",
  ans2: "Keahlian: Graphic Design 95% (Illustrator/Photoshop), UI/UX 90% (Figma), Motion & Video Editing 80% (CapCut), Frontend 75% (React, Tailwind, Vite, Vanilla JS, Canvas/Web Audio), Layout & Print 85%.",
  ans3: "Proyek: Brand Identity Garuda Private Server, Custom Vector Logo & Typography, Internship Azka Print (packaging workflow), Brand fashion Attics (katalog), Packaging Keripik Tempe & Social Media Kit sneaker lokal.",
  ans4: "Gampang! Scroll ke section kontak di bawah, isi form, atau langsung klik salah satu link ini",
  greeting:
    "Halo Saya Assistantnya Dexton! Tanyakan sesuatu seputar portfolio ini",
  ansGreeting:
    "Halo juga! Mau tanya apa? Bisa profil, skill, proyek, hobi/favorit, game, creator favorit, atau kontak.",
  ansThanks: "Sama-sama! Ada lagi yang mau ditanyain?",
  ansBotId:
    "Aku asisten virtual di portfolio ini, siap bantu jawab pertanyaan seputar pemiliknya dan karyanya!",
  ansLocation: "di Tangerang, Ciledug , Banten",
  ansEducation:
    "Lulusan SMKN 5 Kota Tangerang jurusan Desain Komunikasi Visual, sekarang mahasiswa aktif di Universitas Pamulang.",
  ansExperience:
    "Udah beberapa tahun terjun di dunia desain & frontend dev, kerja bareng berbagai klien dari macam-macam industri.",
  ansTech:
    "Tech stack: React 19, Tailwind CSS, Vite, Vanilla, Lenis (smooth scroll), Vue. Deploy di Vercel dengan Serverless Functions Node.js.",
  ansOrder:
    "Buat order jasa atau kerja sama, langsung aja isi form di section kontak ya!",
  ansFood: "Makanan favorit: nasi goreng dan ayam geprek Sabana!",
  ansHobby:
    "Hobi: eksplorasi & eksperimen hal baru, bersepeda, dan hunting inspirasi desain.",
  ansGame:
    "Game favorit: Red Dead Redemption 2, Clair Obscur: Expedition 33, Dark Souls III, Ghost of Yotei, Diablo V, Roblox, plus game indie & party.",
  ansCreator:
    "Content creator favorit: Windah Basudara, Luthfi Halimawan, Ace Anthem, Ade Setiawan, dan Deankt!",
  ansFav:
    "Favorit — Makanan: nasi goreng & ayam geprek Sabana. Hobi: eksplor hal baru & bersepeda. Game: RDR2, Clair Obscur: Expedition 33, Dark Souls III, Ghost of Yotei, Diablo V, Roblox. Creator: Windah Basudara, Luthfi Halimawan, Ace Anthem, Ade Setiawan, Deankt.",
  ansFavAsk:
    'Kamu mau nanya favorit yang mana dulu? Ada makanan favorit, game favorit, musik favorit, sama content creator favorit. Ketik aja misal "musik favorit" atau "creator favorit" — atau ketik "semuanya" kalau mau rangkuman lengkap.',
  ansMusicFav:
    "Musik favorit: Alex Crichton – What If I Call, Reality Club – A Sorrowful Reunion, Lord Huron – The Night We Met, Cup of Joe – Multo, Kaash Paige – Love Songs. Ketik aja “putar musik” kalau mau dengerin langsung!",
  ansTestimonial: "Siap! Ke Reviews ya — aku scroll-in ke kata-kata klien.",
  ansAge: "Umur 19 tahun, domisili Tangerang — kuliah di Universitas Pamulang.",
  ansServices:
    "Siap! Aku arahin kamu ke Services ya — klik link ini atau scroll ke section Services di bawah.",
  ansPortfolio:
    "Siap! Ke Portfolio ya — aku scroll-in ke bagian karya-karya di bawah.",
  ansAbout:
    "Siap! Ke About ya — aku bawa kamu ke section profil Dexton di bawah.",
  ansContact: "Siap! Ke Contact ya — aku arahin ke form kontak di bawah.",
  ansSkills: "Skill lengkap ada di section Skills — aku scroll-in ke sana ya.",
  ansQualification:
    "Riwayat pendidikan & pengalaman ada di Qualification — aku bawa ke sana.",
  ansGithub:
    "Aktivitas GitHub ada di section Github Activity — aku arahin ke sana.",
  ansHome: "Balik ke Home ya — aku scroll ke atas.",
  ansContactDetail:
    "Kontak — Email: ibnudexton@gmail.com, WA: +62 852-8114-4792, IG: @dxtnn_, GitHub: detonnn",
  fallbackHelp:
    'Boleh tanya apa aja — profil, skill & tech stack, proyek, makanan/hobi/game/musik favorit, creator favorit, review klien, atau cara kontak. Coba tanya misalnya: "musik favorit apa?" atau "hobinya apa?"',
  ansMusicNoTracks:
    "Duh, playlist-nya masih kosong nih, belum ada lagu yang di-setting. Coba lagi nanti ya!",
  ansMusicPaused: "Oke, musiknya gw pause dulu ya.",
  ansMusicPlaylistIntro:
    "Nih playlist kesukaannya, tinggal pilih mau dengerin yang mana:",
};

// Kata kunci yang mentrigger munculnya PLAYLIST (bukan langsung muter).
const MUSIC_PLAY_KEYWORDS = [
  "music",
  "musik",
  "lagu",
  "song",
  "putar musik",
  "puter musik",
  "play music",
  "play lagu",
  "putar lagu",
  "puter lagu",
  "nyalain musik",
  "setel musik",
  "setel lagu",
  "mainkan musik",
  "mainin musik",
  "dengerin musik",
  "dengerin lagu",
  "denger musik",
  "denger lagu",
];

// Kata kunci buat berhenti — ini langsung dieksekusi, gak perlu playlist.
const MUSIC_STOP_KEYWORDS = [
  "stop musik",
  "pause musik",
  "berhenti musik",
  "berhentiin musik",
  "stop lagu",
  "matiin musik",
  "matiin lagu",
  "berhentiin lagu",
];

const VISITOR_KEYWORDS = [
  "visitor",
  "pengunjung",
  "dikunjungi",
  "dilihat",
  "berapa orang",
  "angka",
  "view",
  "traffic",
];

const KEYWORD_MAP = [
  {
    keys: ["makasih", "terima kasih", "thanks", "thank you", "thx", "tq"],
    answer: "ansThanks",
  },
  {
    keys: [
      "kamu siapa",
      "siapa kamu",
      "siapa ini",
      "kamu bot",
      "are you a bot",
    ],
    answer: "ansBotId",
  },
  {
    keys: [
      "content creator favorit",
      "creator favorit",
      "youtuber favorit",
      "creator kesukaan",
      "deankt",
      "windah basudara",
      "luthfi halimawan",
      "ace anthem",
      "ade setiawan",
    ],
    answer: "ansCreator",
  },
  {
    keys: [
      "makanan favorit",
      "makanan kesukaan",
      "makanan suka",
      "ayam geprek",
      "nasi goreng",
      "geprek",
    ],
    answer: "ansFood",
  },
  {
    keys: [
      "game favorit",
      "game favorite",
      "game fav",
      "red dead",
      "rdr2",
      "clair obscur",
      "dark souls",
      "ghost of yotei",
      "diablo",
      "roblox",
    ],
    answer: "ansGame",
  },
  {
    keys: [
      "lagu favorit",
      "musik favorit",
      "song favorit",
      "music favorit",
      "lagu kesukaan",
      "musik kesukaan",
      "lagu fav",
      "musik fav",
      "what if i call",
      "alex crichton",
      "reality club",
      "lord huron",
      "cup of joe",
      "kaash paige",
    ],
    answer: "ansMusicFav",
  },
  {
    keys: [
      "hobi",
      "hobby",
      "kesukaan",
      "hobi dexton",
      "bersepeda",
      "eksplorasi",
      "eksperimen",
    ],
    answer: "ansHobby",
  },
  {
    keys: [
      "semuanya",
      "semua favorit",
      "all favorit",
      "rangkuman favorit",
      "info",
      "informasi",
      "detail",
      "selengkapnya",
      "favorit lengkap",
      "favorit semua",
    ],
    answer: "ansFav",
  },
  {
    keys: [
      "umur",
      "usia",
      "berapa umur",
      "umur ibnu",
      "lahir",
      "ulang tahun",
      "19 tahun",
      "anak pertama",
      "2 bersaudara",
    ],
    answer: "ansAge",
  },
  {
    keys: [
      "halo",
      "oy",
      "bre",
      "dul",
      "bro",
      "bos",
      "woe",
      "hai",
      "hello",
      "pagi",
      "siang",
      "malam",
      "hey",
      "hi",
      "hallo",
      "selamat pagi",
      "selamat siang",
      "selamat malam",
      "hallo",
      "selamat sore",
    ],
    answer: "ansGreeting",
  },
  {
    keys: [
      "dimana",
      "dmna",
      "lok",
      "lokasi",
      "alamat",
      "sherlock",
      "ibnu dimana",
      "ibnu tinggal",
      "domisili",
      "tangerang",
      "ciledug",
      "where does ibnu",
      "where is ibnu",
    ],
    answer: "ansLocation",
  },
  {
    keys: [
      "sekolah",
      "smk",
      "pendidikan",
      "lulusan",
      "kuliah ",
      "universitas pamulang",
      "smkn 5",
    ],
    answer: "ansEducation",
  },
  {
    keys: ["pengalaman", "pengalaman kamu", "experience"],
    answer: "ansExperience",
  },
  {
    keys: [
      "react",
      "vue",
      "next",
      "javascript",
      "tailwind",
      "vite",
      "vercel",
      "tech stack",
      "teknologi",
      "framework",
      "coding pakai apa",
      "bahasa pemrograman",
    ],
    answer: "ansTech",
  },
  {
    keys: ["harga", "biaya", "price", "order", "jasa", "sewa", "hire"],
    answer: "ansOrder",
  },
  {
    keys: [
      "bawa ke services",
      "arahin ke services",
      "ke services",
      "halaman services",
      "layanan ibnu",
      "services page",
    ],
    answer: "ansServices",
  },
  {
    keys: [
      "bawa ke portfolio",
      "arahin ke portfolio",
      "ke portfolio",
      "halaman portfolio",
      "karya ibnu",
      "project ibnu",
    ],
    answer: "ansPortfolio",
  },
  {
    keys: [
      "bawa ke about",
      "arahin ke about",
      "ke about",
      "tentang ibnu",
      "profil ibnu",
      "halaman about",
    ],
    answer: "ansAbout",
  },
  {
    keys: [
      "bawa ke contact",
      "arahin ke contact",
      "ke contact",
      "halaman contact",
      "halaman kontak",
      "hubungi ibnu",
    ],
    answer: "ansContact",
  },
  {
    keys: [
      "bawa ke skills",
      "arahin ke skills",
      "ke skills",
      "halaman skills",
      "skill ibnu",
    ],
    answer: "ansSkills",
  },
  {
    keys: [
      "qualification",
      "kualifikasi",
      "pendidikan",
      "riwayat",
      "karir",
      "karier",
      "journey",
      "sekolah",
      "kuliah dimana",
    ],
    answer: "ansQualification",
  },
  {
    keys: [
      "review",
      "reviews",
      "ulasan",
      "testimoni",
      "testimonial",
      "kata klien",
      "kata client",
    ],
    answer: "ansTestimonial",
  },
  { keys: ["github", "aktivitas github", "repo"], answer: "ansGithub" },
  { keys: ["home", "beranda", "ke atas"], answer: "ansHome" },
  { keys: ["services", "layanan"], answer: "ansServices" },
  { keys: ["portfolio", "portofolio"], answer: "ansPortfolio" },
  { keys: ["contact", "kontak"], answer: "ansContact" },
  {
    keys: ["favorit", "kesukaan", "suka apa", "favorite", "fav"],
    answer: "ansFavAsk",
  },
];

export default {
  name: "AiAssistant",
  data() {
    return {
      isOpen: false,
      menuOpen: false,
      chatInitialized: false,
      inputText: "",
      messages: [],
      typing: false,
      historyView: false,
      historyList: [],
      quickReplies: QUICK_REPLIES,
      reactions: REACTIONS,
      activeReact: null,
      activeReactBelow: false,
      idleTimer: null,
      hasSentIdle: false,
      lastIdleIdx: -1,
      audioElements: {},
      isNearBottom: true,
      spamTimes: [],
      lastSpamWarnAt: 0,
      spamQueue: null,
      spamWarnScheduled: false,
      typingTimer: null,
    };
  },
  computed: {
    showQuick() {
      return !this.historyView && this.chatInitialized;
    },
    showQuickInside() {
      return this.showQuick && this.isNearBottom;
    },
    musicPlaying() {
      return musicState.isPlaying;
    },
    currentTrack() {
      return musicState.currentTrack;
    },
  },
  mounted() {
    this.stopListenEnded = onTrackEnded(this.handleTrackEnded);
    document.addEventListener("click", this.onDocClick);

    // Pre-initialize audio elements to unlock them globally
    this.audioElements = {
      send: new Audio("/frontend/assets/audio/send.MP3"),
      recive: new Audio("/frontend/assets/audio/recive.MP3"),
    };
    Object.values(this.audioElements).forEach((a) => {
      a.volume = 0.5;
      a.load();
    });

    const unlockAll = () => {
      Object.values(this.audioElements).forEach((a) => {
        a.play()
          .then(() => {
            a.pause();
            a.currentTime = 0;
          })
          .catch(() => {});
      });
      ["click", "touchstart", "keydown"].forEach((evt) =>
        window.removeEventListener(evt, unlockAll, { capture: true }),
      );
    };
    ["click", "touchstart", "keydown"].forEach((evt) =>
      window.addEventListener(evt, unlockAll, { capture: true, once: true }),
    );

    this.$nextTick(() => {
      const b = this.$refs.body;
      if (b) {
        b.setAttribute("data-lenis-prevent", "");
        b.addEventListener("wheel", (e) => e.stopPropagation(), {
          passive: true,
        });
        b.addEventListener("touchmove", (e) => e.stopPropagation(), {
          passive: true,
        });
      }
    });
  },
  beforeUnmount() {
    document.removeEventListener("click", this.onDocClick);
    if (this.stopListenEnded) this.stopListenEnded();
  },
  methods: {
    onDocClick(e) {
      const menuWrap = this.$refs.menuWrap;
      if (menuWrap && !menuWrap.contains(e.target)) this.menuOpen = false;
      if (e.target.closest && !e.target.closest(".chatbot-msg"))
        this.activeReact = null;
      // Klik tombol ganti tema jangan nutup widget assistant
      if (e.target.closest && e.target.closest("#theme-button")) return;
      if (this.isOpen && !this.$el.contains(e.target)) this.closeChat();
    },
    toggle() {
      this.isOpen ? this.closeChat() : this.openChat();
    },
    openChat() {
      this.isOpen = true;
      this.isNearBottom = true;
      if (!this.chatInitialized) this.startFreshChat();
      this.resetIdleTimer();
      this.$nextTick(() => {
        const inp = this.$el.querySelector(".chatbot-input");
        if (inp) setTimeout(() => inp.focus(), 350);
      });
    },
    closeChat() {
      this.isOpen = false;
      this.menuOpen = false;
      this.clearIdleTimer();
    },
    clearIdleTimer() {
      if (this.idleTimer) {
        clearTimeout(this.idleTimer);
        this.idleTimer = null;
      }
    },
    closeMenu() {
      this.menuOpen = false;
    },
    resetIdleTimer() {
      this.clearIdleTimer();
      if (!this.isOpen || !this.chatInitialized || this.hasSentIdle) return;
      this.idleTimer = setTimeout(() => {
        this.showIdleMessage();
      }, 7000);
    },
    showIdleMessage() {
      if (!this.isOpen || this.typing || this.hasSentIdle) return;
      const idleMessages = [
        "Masih di situ kan? Ada yang mau ditanyain lagi gak nih?",
        "Bengong ya? Tanya aja bebas — profil, skill, hobi, atau tiktok?!",
        "Kalo bingung mau nanya apa, coba klik quick replies di bawah ya?",
        "Santai aja, butuh info kontak atau mau liat karya Dexton yang lain?",
        "Ada yang kurang jelas tentang portfolio ini? Tanyain aja bre!",
      ];
      let idx;
      do {
        idx = Math.floor(Math.random() * idleMessages.length);
      } while (idx === this.lastIdleIdx && idleMessages.length > 1);
      this.lastIdleIdx = idx;
      this.hasSentIdle = true; // Tandai sudah kirim idle, stop spamming!

      this.showTyping(() => {
        this.addMessage(idleMessages[idx], "bot");
      });
    },
    startFreshChat() {
      this.messages = [];
      this.activeReact = null;
      this.historyView = false;
      this.chatInitialized = true;
      this.hasSentIdle = false;
      this.resetIdleTimer();
      // ponytail: greeting jangan lama — 700ms cukup
      this.showTyping(() => this.addMessage(ANSWERS.greeting, "bot"), 700);
    },
    endChat() {
      this.chatInitialized = false;
      this.closeChat();
    },
    addMessage(text, sender, links, playlist) {
      this.messages.push({
        text,
        sender,
        links: links || null,
        playlist: playlist || null,
        reaction: null,
      });
      // Sound effect hanya untuk pesan bot yang sudah selesai (bukan saat typing)
      if (sender === "bot") {
        this.playAudio("recive.mp3");
      }
      this.scrollDown();
    },
    playAudio(fileName) {
      const key = fileName.split(".")[0].toLowerCase();
      const audio =
        this.audioElements[key] ||
        new Audio(`/frontend/assets/audio/${key}.MP3`);
      audio.currentTime = 0;
      audio.play().catch(() => {});
    },
    toggleReactBar(i) {
      this.activeReact = this.activeReact === i ? null : i;
    },
    onBotMsgClick(e, i) {
      if ((this.messages[i] || {}).sender !== "bot") return;
      if (
        e.target.closest &&
        e.target.closest("a,button,.chatbot-playlist,.pl-row")
      )
        return;
      // jika bar mau dibuka, cek apakah pesan dekat header ( < 70px dari top body )
      // kalau iya, flip bar ke bawah biar ga ketutup header
      const willOpen = this.activeReact !== i;
      if (willOpen) {
        this.$nextTick(() => {
          const body = this.$refs.body;
          const msgEl = e.currentTarget;
          if (body && msgEl) {
            const bodyRect = body.getBoundingClientRect();
            const msgRect = msgEl.getBoundingClientRect();
            this.activeReactBelow = msgRect.top - bodyRect.top < 70;
          } else {
            this.activeReactBelow = false;
          }
        });
      }
      this.toggleReactBar(i);
    },
    setReaction(i, key) {
      const m = this.messages[i];
      if (!m) return;
      // ponytail: klik emoji yang sama = batalin reaksi
      m.reaction = m.reaction === key ? null : key;
      this.activeReact = null;
    },
    reactionEmoji(key) {
      const r = REACTIONS.find((x) => x.key === key);
      return r ? r.emoji : "";
    },
    focusInput() {
      const el = this.$refs.input;
      if (el) el.focus();
    },
    autoGrow() {
      const el = this.$refs.input;
      if (!el) return;
      el.style.height = "0";
      el.style.height = Math.min(el.scrollHeight, 120) + "px";
    },
    onBodyScroll() {
      const body = this.$refs.body;
      if (!body) return;
      // ponytail: threshold 40px — toleransi rounding + typing indicator
      this.isNearBottom =
        body.scrollHeight - body.scrollTop - body.clientHeight < 40;
    },
    scrollDown() {
      this.isNearBottom = true;
      this.$nextTick(() => {
        const body = this.$refs.body;
        if (body) body.scrollTop = body.scrollHeight;
      });
    },
    showTyping(cb, delay) {
      if (this.typingTimer) clearTimeout(this.typingTimer);
      this.typing = true;
      this.scrollDown();
      const d = delay != null ? delay : 1500 + Math.random() * 1200;
      this.typingTimer = setTimeout(() => {
        this.typingTimer = null;
        this.typing = false;
        cb();
      }, d);
    },
    cancelTyping() {
      if (this.typingTimer) clearTimeout(this.typingTimer);
      this.typingTimer = null;
      this.typing = false;
    },
    loadHistory() {
      try {
        return JSON.parse(localStorage.getItem("chatbot_history") || "[]");
      } catch {
        return [];
      }
    },
    saveHistoryEntry(text) {
      try {
        const hist = this.loadHistory();
        hist.unshift({ text, time: Date.now() });
        localStorage.setItem(
          "chatbot_history",
          JSON.stringify(hist.slice(0, 8)),
        );
      } catch {
        // storage penuh / diblokir — chat tetap jalan, riwayat aja yang skip
      }
    },
    showHistory() {
      this.closeMenu();
      this.historyList = this.loadHistory();
      this.historyView = true;
      this.scrollDown();
    },
    detectContactLinks(text) {
      const lower = " " + text.toLowerCase() + " ";
      const matched = [];
      if (lower.includes("instagram") || lower.includes(" ig "))
        matched.push(CONTACT_LINKS.instagram);
      if (lower.includes("tiktok") || lower.includes(" tt "))
        matched.push(CONTACT_LINKS.tiktok);
      if (
        lower.includes("whatsapp") ||
        lower.includes(" wa ") ||
        lower.includes("nomor") ||
        lower.includes("telepon") ||
        lower.includes("hp ")
      )
        matched.push(CONTACT_LINKS.whatsapp);
      if (
        lower.includes("email") ||
        lower.includes("gmail") ||
        lower.includes("e-mail")
      )
        matched.push(CONTACT_LINKS.email);
      if (
        matched.length === 0 &&
        (lower.includes("kontak") ||
          lower.includes("contact") ||
          lower.includes("hubungi"))
      ) {
        return [
          CONTACT_LINKS.whatsapp,
          CONTACT_LINKS.instagram,
          CONTACT_LINKS.email,
        ];
      }
      return matched;
    },
    detectMusicIntent(text) {
      const lower = " " + text.toLowerCase() + " ";
      if (MUSIC_STOP_KEYWORDS.some((k) => lower.includes(k))) return "stop";
      if (MUSIC_PLAY_KEYWORDS.some((k) => lower.includes(k))) return "play";
      return null;
    },
    isTrackPlaying(index) {
      return this.musicPlaying && musicState.currentIndex === index;
    },
    // Kalau user minta musik lewat chat -> tampilin playlist, JANGAN langsung muter.
    showPlaylist() {
      if (!hasTracks()) {
        this.addMessage(ANSWERS.ansMusicNoTracks, "bot");
        return;
      }
      const options = MUSIC_TRACKS.map((t, i) => ({
        index: i,
        label: `${t.title} — ${t.artist}`,
        title: t.title,
        artist: t.artist,
        duration: t.duration,
        cover: t.cover,
      }));
      this.addMessage(ANSWERS.ansMusicPlaylistIntro, "bot", null, options);
    },
    // User pilih salah satu lagu dari tombol playlist di dalam chat.
    selectTrack(index) {
      const track = MUSIC_TRACKS[index];
      if (!track) return;
      playTrack(index);
      this.showTyping(() => {
        this.addMessage(
          `Oke, muter "${track.title}" — ${track.artist} nih. Cek pojok kanan atas ya!`,
          "bot",
        );
      });
    },
    // Lagu selesai natural (bukan di-stop user) -> kasih tau, JANGAN auto-next.
    handleTrackEnded(track) {
      if (!this.chatInitialized) return;
      const label = track ? `"${track.title}" — ${track.artist}` : "Lagunya";
      this.showTyping(() => {
        this.addMessage(
          `${label} udah selesai nih. Mau putar lagi atau pilih lagu lain dari playlist?`,
          "bot",
        );
      });
    },
    // Tombol toggle manual di header chatbot — on/off langsung, gak perlu ketik apa-apa.
    handleMusicToggleClick() {
      const result = toggleMusic();
      if (!this.isOpen || !this.chatInitialized) return;
      let text;
      if (result === "no-tracks") text = ANSWERS.ansMusicNoTracks;
      else if (result === "playing") {
        const t = musicState.currentTrack;
        text = t
          ? `Muter "${t.title}" — ${t.artist} lagi nih`
          : ANSWERS.ansMusicNoTracks;
      } else {
        text = ANSWERS.ansMusicPaused;
      }
      this.showTyping(() => this.addMessage(text, "bot"));
    },
    detectAnswer(text) {
      const lower = " " + text.toLowerCase() + " ";
      let best = null;
      let bestScore = 0;
      for (const entry of KEYWORD_MAP) {
        let score = 0;
        for (const k of entry.keys) if (lower.includes(k)) score += k.length;
        if (score > bestScore) {
          bestScore = score;
          best = entry.answer;
        }
      }
      return bestScore > 0 ? best : null;
    },
    isVisitorAsk(text) {
      const l = " " + text.toLowerCase() + " ";
      return VISITOR_KEYWORDS.some((k) => l.includes(k));
    },
    async replyVisitor() {
      this.typing = true;
      this.scrollDown();
      await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1200));
      try {
        const r = await fetch("/api/visitors");
        if (!r.ok) throw new Error("visitors API " + r.status);
        const j = await r.json();
        const n = Number(j.count);
        const c = Number.isFinite(n) ? n.toLocaleString("id-ID") : "banyak";
        this.addMessage(
          `Portfolio ini sudah dikunjungi ${c} orang — kamu salah satunya!`,
          "bot",
        );
      } catch {
        this.addMessage(
          "Visitor count lagi offline, tapi portfolio ini tetap rame kok!",
          "bot",
        );
      } finally {
        this.typing = false;
      }
    },
    // ponytail: helper — cuma balas bot, tanpa add user msg (dipakai buat queue spam)
    _replyBot(displayText, forcedAnswerKey) {
      if (!forcedAnswerKey) {
        if (this.isVisitorAsk(displayText)) {
          this.replyVisitor();
          return;
        }
        const musicIntent = displayText.toLowerCase().includes("favorit")
          ? null
          : this.detectMusicIntent(displayText);
        if (musicIntent === "stop") {
          pauseMusic();
          this.showTyping(() => this.addMessage(ANSWERS.ansMusicPaused, "bot"));
          return;
        }
        if (musicIntent === "play") {
          this.showTyping(() => this.showPlaylist());
          return;
        }
      }
      const answerKey = forcedAnswerKey || this.detectAnswer(displayText);
      const NAV_MAP = {
        ansServices: "#services",
        ansPortfolio: "#portfolio",
        ansAbout: "#about",
        ansContact: "#contact",
        ansSkills: "#skills",
        ansQualification: "#qualification",
        ansTestimonial: "#testimonial",
        ansGithub: "#github",
        ansHome: "#home",
      };
      if (answerKey === "ansFavAsk") {
        this.showTyping(() => this.addMessage(ANSWERS.ansFavAsk, "bot"));
      } else if (answerKey === "ansMusicPlaylistIntro") {
        this.showTyping(() => this.showPlaylist());
      } else if (answerKey) {
        const links =
          answerKey === "ans4" ? this.detectContactLinks(displayText) : null;
        const hash = NAV_MAP[answerKey];
        this.showTyping(() => {
          this.addMessage(ANSWERS[answerKey], "bot", links);
          if (hash) {
            const el = document.querySelector(hash);
            if (el) {
              if (window.lenis)
                window.lenis.scrollTo(el, { offset: 0, duration: 1.1 });
              else el.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }
        });
      } else {
        const links = this.detectContactLinks(displayText);
        this.showTyping(() =>
          this.addMessage(ANSWERS.fallbackHelp, "bot", links.length ? links : null),
        );
      }
    },
    handleUserInput(displayText, forcedAnswerKey) {
      if (!displayText || !displayText.trim()) return;
      const now = Date.now();
      const isSpamBurst = (() => {
        this.spamTimes = (this.spamTimes || []).filter((t) => now - t < 4000);
        this.spamTimes.push(now);
        return this.spamTimes.length > 3;
      })();
      const isSpam = this.typing || isSpamBurst;
      if (isSpam) {
        // cancel jawaban pending pertama biar gak double, tapi jangan cancel warning yang lagi jalan
        if (this.typing && !this.spamWarnScheduled) this.cancelTyping();
        // simpan cuma yang terakhir — semua spam sebelumnya diabaikan, cuma jawab paling akhir
        this.spamQueue = { text: displayText, key: forcedAnswerKey };
        // tampilkan bubble user biar keliatan dia spam (gak silent drop)
        this.addMessage(displayText, "user");
        this.playAudio("send.mp3");
        this.saveHistoryEntry(displayText);
        this.inputText = "";
        this.$nextTick(() => {
          const el = this.$refs.input;
          if (el) el.style.height = "auto";
        });
        if (this.spamWarnScheduled) return;
        this.spamWarnScheduled = true;
        this.lastSpamWarnAt = now;
        const warnMsg = isSpamBurst && !this.typing
          ? "Woy pelan-pelan, jangan spam quick chat 😅 — kasih jeda bentar ya"
          : "Santai bre, jangan di-spam — tunggu gue jawab satu-satu ya 🙏";
        const waitAndProcess = () => {
          if (this.typing) { setTimeout(waitAndProcess, 350); return; }
          this.showTyping(() => {
            this.addMessage(warnMsg, "bot");
            // setelah warning selesai (typing false lagi), baru jawab queue paling akhir aja
            const afterWarn = () => {
              if (this.typing) { setTimeout(afterWarn, 350); return; }
              const q = this.spamQueue;
              this.spamQueue = null;
              this.spamWarnScheduled = false;
              this.spamTimes = [];
              if (q) {
                this.hasSentIdle = false;
                this.resetIdleTimer();
                this.historyView = false;
                this.activeReact = null;
                // user bubble-nya udah ditambah di atas untuk q yang terakhir,
                // jadi di sini cuma trigger balasan bot-nya aja
                this._replyBot(q.text, q.key);
              }
            };
            setTimeout(afterWarn, 350);
          });
        };
        waitAndProcess();
        return;
      }
      this.hasSentIdle = false;
      this.resetIdleTimer();
      this.historyView = false;
      this.activeReact = null;
      this.addMessage(displayText, "user");
      this.playAudio("send.mp3");
      this.saveHistoryEntry(displayText);
      this.inputText = "";
      this.$nextTick(() => {
        const el = this.$refs.input;
        if (el) el.style.height = "auto";
      });
      this._replyBot(displayText, forcedAnswerKey);
    },
  },
};
</script>

<style scoped>
.chatbot-msg.bot {
  position: relative;
}
/* ponytail: scale di row (bukan bubble) biar gak tabrakan sama entrance animation bubble */
.chatbot-msg-row {
  display: flex;
  width: 100%;
  position: relative;
  transition: transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 0.25s ease;
}
.chatbot-msg-row.bot {
  justify-content: flex-start;
  transform-origin: left center;
}
.chatbot-msg-row.user {
  justify-content: flex-end;
  transform-origin: right center;
}
.chatbot-msg-row.focused {
  transform: scale(1.07);
}
.chatbot-msg-row.focused .chatbot-msg {
  border-color: var(--green);
  box-shadow: none;
}
.chatbot-msg-row.dimmed {
  opacity: 0.35;
}
.chatbot-msg-row.dimmed .chatbot-react-bar {
  opacity: 1;
}
.chatbot-react-bar {
  position: absolute;
  bottom: 100%;
  left: 0;
  margin-bottom: 8px;
  opacity: 1;
  display: flex;
  gap: 2px;
  padding: 6px 10px;
  border-radius: 20px;
  background: #000000;
  border: 1px solid var(--border);
  box-shadow: none;
  z-index: 12;
  animation: chatbotMsgIn 0.25s ease both;
}
.chatbot-react-bar--below {
  bottom: auto;
  top: 100%;
  margin-bottom: 0;
  margin-top: 8px;
}
.chatbot-header {
  position: relative;
  z-index: 1;
}
.chatbot-body {
  position: relative;
  z-index: 2;
}
.chatbot-react-btn {
  background: transparent;
  border: none;
  font-size: 17px;
  line-height: 1;
  padding: 4px 5px;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.15s ease;
  filter: grayscale(0.4);
}
.chatbot-react-btn:hover {
  transform: scale(1.35);
  filter: none;
}
.chatbot-react-btn.selected {
  filter: none;
  transform: scale(1.2);
}
.chatbot-react-badge {
  position: absolute;
  right: -6px;
  bottom: -12px;
  font-size: 14px;
  line-height: 1;
  background: #000000;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 2px 5px;
}

body.light-theme .chatbot-react-bar,
body.light-theme .chatbot-react-badge {
  background: var(--bg-elev-2);
}

/* === Playlist layout — port dari playlist-layout.html === */
.chatbot-playlist {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-top: 10px;
  animation: chatbotMsgIn 0.3s ease both;
  /* biar playlist mentok ke tepi bubble, override padding bubble */
  margin-left: -4px;
  margin-right: -4px;
}
.pl-row {
  display: grid;
  grid-template-columns: 28px 1fr 44px;
  align-items: center;
  gap: 10px;
  padding: 7px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s ease;
}
.pl-row:hover {
  background: rgba(255, 255, 255, 0.08);
}
body.light-theme .pl-row:hover {
  background: rgba(0, 0, 0, 0.06);
}
.pl-row__index {
  position: relative;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-dim);
  font-size: 12px;
  flex-shrink: 0;
}
.pl-row__index .pl-num {
  display: block;
}
.pl-row__index .pl-play {
  display: none;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 5px 0 5px 8px;
  border-color: transparent transparent transparent var(--text);
}
.pl-row:hover .pl-row__index .pl-num {
  display: none;
}
.pl-row:hover .pl-row__index .pl-play {
  display: block;
}
.pl-row--playing .pl-row__index .pl-num {
  display: none;
}
.pl-row--playing .pl-row__index .pl-bars {
  display: flex;
}
.pl-row--playing:hover .pl-row__index .pl-bars {
  display: none;
}
.pl-row--playing:hover .pl-row__index .pl-play {
  display: block;
}
.pl-bars {
  display: none;
  align-items: flex-end;
  gap: 2px;
  height: 12px;
}
.pl-bars span {
  width: 3px;
  background: #1ed760;
  animation: pl-bounce 1s ease-in-out infinite;
}
.pl-bars span:nth-child(1) {
  height: 40%;
  animation-delay: -0.9s;
}
.pl-bars span:nth-child(2) {
  height: 100%;
  animation-delay: -0.3s;
}
.pl-bars span:nth-child(3) {
  height: 65%;
  animation-delay: -0.6s;
}
@keyframes pl-bounce {
  0%,
  100% {
    transform: scaleY(0.4);
  }
  50% {
    transform: scaleY(1);
  }
}
.pl-row__main {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.pl-row__art {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  background: #2a2a2a;
  flex-shrink: 0;
  object-fit: cover;
}
.pl-row__text {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}
.pl-row__title {
  color: var(--text);
  font-size: 12.5px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}
.pl-row--playing .pl-row__title {
  color: #1ed760;
}
body.light-theme .pl-row--playing .pl-row__title {
  color: #1a9c4b;
}
.pl-row__artist {
  color: var(--text-dim);
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}
.pl-row__duration {
  color: var(--text-dim);
  font-size: 11px;
  text-align: right;
  flex-shrink: 0;
}
</style>
