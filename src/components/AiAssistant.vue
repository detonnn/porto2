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

      <div class="chatbot-body" ref="body">
        <div
          v-for="(m, i) in messages"
          :key="i"
          class="chatbot-msg"
          :class="m.sender"
        >
          {{ m.text }}
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
            class="chatbot-playlist-row"
          >
            <button
              v-for="opt in m.playlist"
              :key="opt.index"
              class="chatbot-playlist-btn"
              @click="selectTrack(opt.index)"
            >
              <i class="uil uil-play"></i> <span>{{ opt.label }}</span>
            </button>
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

      <div class="chatbot-quick-replies" v-if="showQuick">
        <button
          v-for="q in quickReplies"
          :key="q.key"
          class="chatbot-quick-btn"
          @click="handleUserInput(q.label, q.answer)"
        >
          {{ q.label }}
        </button>
      </div>

      <div class="chatbot-input-row">
        <input
          type="text"
          class="chatbot-input"
          v-model="inputText"
          placeholder="Tulis pesan..."
          autocomplete="off"
          @keydown.enter="handleUserInput(inputText)"
        />
        <button
          class="chatbot-send-btn"
          aria-label="Send"
          @click="handleUserInput(inputText)"
        >
          <i class="uil uil-message"></i>
        </button>
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

const QUICK_REPLIES = [
  { key: "q1", label: "Profil singkat?", answer: "ans1" },
  { key: "q2", label: "Keahlian & Skill?", answer: "ans2" },
  {
    key: "q3",
    label: "Mau Sambil Dengerin Musik?",
    answer: "ansMusicPlaylistIntro",
  },
  { key: "q4", label: "Cara Kontak?", answer: "ans4" },
];

const ANSWERS = {
  ans1: "Muhammad Ibnu Dexton Alfathir — 19 tahun, Tangerang, mahasiswa Universitas Pamulang, anak pertama dari 2 bersaudara. Lulusan SMKN 5 Kota Tangerang DKV, fokus di UI/UX, graphic design, motion design, dan frontend dev.",
  ans2: "Keahlian: Graphic Design 95% (Illustrator/Photoshop), UI/UX 90% (Figma), Motion & Video Editing 80% (CapCut), Frontend 75% (React, Tailwind, Vite, Vanilla JS, Canvas/Web Audio), Layout & Print 85%.",
  ans3: "Proyek: Brand Identity Garuda Private Server, Custom Vector Logo & Typography, Internship Azka Print (packaging workflow), Brand fashion Attics (katalog), Packaging Keripik Tempe & Social Media Kit sneaker lokal.",
  ans4: "Gampang! Scroll ke section kontak di bawah, isi form, atau langsung klik salah satu link ini",
  greeting: "Halo! Tanyakan sesuatu seputar portfolio ini",
  ansGreeting:
    "Halo juga! Mau tanya apa? Bisa profil, skill, proyek, hobi/favorit, game, creator favorit, atau kontak.",
  ansThanks: "Sama-sama! Ada lagi yang mau ditanyain?",
  ansBotId:
    "Aku asisten virtual di portfolio ini, siap bantu jawab pertanyaan seputar pemiliknya dan karyanya!",
  ansLocation: "Berbasis di Tangerang, Indonesia",
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
  "visit",
  "view",
  "traffic",
];

const KEYWORD_MAP = [
  {
    keys: ["makasih", "terima kasih", "thanks", "thank you"],
    answer: "ansThanks",
  },
  {
    keys: [
      "kamu siapa",
      "siapa kamu",
      "who are you",
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
      "sabana",
    ],
    answer: "ansFood",
  },
  {
    keys: [
      "game favorit",
      "game kesukaan",
      "game suka",
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
    keys: ["semuanya", "semua favorit", "all favorit", "rangkuman favorit"],
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
      "hai",
      "hello",
      "pagi",
      "siang",
      "malam",
      "hey",
      "hi",
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
      "dimana ibnu",
      "lokasi ibnu",
      "alamat ibnu",
      "ibnu dimana",
      "ibnu tinggal",
      "domisili",
      "tangerang",
      "where does ibnu",
      "where is ibnu",
    ],
    answer: "ansLocation",
  },
  {
    keys: [
      "sekolah ibnu",
      "smk ibnu",
      "pendidikan ibnu",
      "lulusan ibnu",
      "kuliah ibnu",
      "universitas pamulang",
      "smkn 5",
    ],
    answer: "ansEducation",
  },
  {
    keys: ["pengalaman ibnu", "pengalaman kamu", "ibnu experience"],
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
    };
  },
  computed: {
    showQuick() {
      return !this.historyView && this.chatInitialized;
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
      if (this.isOpen && !this.$el.contains(e.target)) this.closeChat();
    },
    toggle() {
      this.isOpen ? this.closeChat() : this.openChat();
    },
    openChat() {
      this.isOpen = true;
      if (!this.chatInitialized) this.startFreshChat();
      this.$nextTick(() => {
        const inp = this.$el.querySelector(".chatbot-input");
        if (inp) setTimeout(() => inp.focus(), 350);
      });
    },
    closeChat() {
      this.isOpen = false;
      this.closeMenu();
    },
    closeMenu() {
      this.menuOpen = false;
    },
    startFreshChat() {
      this.messages = [];
      this.historyView = false;
      this.chatInitialized = true;
      this.showTyping(() => this.addMessage(ANSWERS.greeting, "bot"));
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
      });
      this.scrollDown();
    },
    scrollDown() {
      this.$nextTick(() => {
        const body = this.$refs.body;
        if (body) body.scrollTop = body.scrollHeight;
      });
    },
    showTyping(cb) {
      this.typing = true;
      this.scrollDown();
      setTimeout(() => {
        this.typing = false;
        cb();
      }, 900 + Math.random() * 900);
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
    // Kalau user minta musik lewat chat -> tampilin playlist, JANGAN langsung muter.
    showPlaylist() {
      if (!hasTracks()) {
        this.addMessage(ANSWERS.ansMusicNoTracks, "bot");
        return;
      }
      const options = MUSIC_TRACKS.map((t, i) => ({
        index: i,
        label: `${t.title} — ${t.artist}`,
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
      await new Promise((r) => setTimeout(r, 900 + Math.random() * 900));
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
    handleUserInput(displayText, forcedAnswerKey) {
      if (!displayText || !displayText.trim()) return;
      this.historyView = false;
      this.addMessage(displayText, "user");
      this.saveHistoryEntry(displayText);
      this.inputText = "";

      if (!forcedAnswerKey) {
        if (this.isVisitorAsk(displayText)) {
          this.replyVisitor();
          return;
        }
        // "lagu favorit apa?" itu nanya favorit, bukan minta muter musik
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
          this.addMessage(
            ANSWERS.fallbackHelp,
            "bot",
            links.length ? links : null,
          ),
        );
      }
    },
  },
};
</script>
