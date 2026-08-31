# porto2

> Portfolio pribadi Ibnu Dexton — Vue 3 + Vue CLI, sekarang dilengkapi AI assistant chatbot.

Landing page single-page portfolio, di-build pake Vue 3 (Options API) + Vue Router + Vuex, styling & interaksi berat (Lenis smooth scroll, terminal effect, dll) tetep jalan lewat script vanilla JS di `public/frontend`.

## Tech Stack

- Vue 3 (`^3.2.13`) + Vue CLI 5
- Vue Router 4, Vuex 4
- Lenis (smooth scroll) — di-load manual sebelum `main.js` biar ga undefined
- PWA plugin (`register-service-worker`)
- Data section (profile, skills, project, dll) di-drive dari `src/data/portfolio.json`

## Struktur Project

```
src/
├── App.vue                  # root, load Lenis + main.js vanilla
├── main.js
├── router/index.js          # single route "/" → MasterView
├── store/index.js           # Vuex store
├── data/portfolio.json      # semua konten dinamis (profile, socials, dll)
├── components/
│   ├── HelloWorld.vue
│   └── AiAssistant.vue      # 🆕 widget chatbot
└── views/
    ├── MasterView.vue       # nyusun semua section + render AiAssistant
    └── pages/
        ├── HeaderrView.vue
        ├── HomeView.vue
        ├── AboutView.vue
        ├── SkillsView.vue
        ├── GithubView.vue
        ├── QualificationView.vue
        ├── ServicesView.vue
        ├── PortfolioView.vue
        ├── ProjectView.vue
        ├── TestimonialView.vue
        ├── ContactView.vue
        └── FooterView.vue
```

## 🆕 AI Assistant (`AiAssistant.vue`)

Widget chat bubble di pojok, di-mount global lewat `MasterView.vue` (jadi muncul di semua section, bukan cuma satu halaman).

**Cara kerja:** rule-based keyword matcher, bukan panggil API AI eksternal — semua respons udah didefinisikan statis di dalam komponen.

- `KEYWORD_MAP` — daftar kata kunci (ID + EN) di-scoring per pesan user, skor tertinggi menang → dipetakan ke `ANSWERS`
- `ANSWERS` — jawaban template: profil, skill, tech stack, proyek, hobi/makanan/game/creator favorit, kontak, dan navigasi ke section (`ansServices`, `ansAbout`, dst — auto-scroll pake `window.lenis.scrollTo` kalau ada, fallback native `scrollIntoView`)
- `CONTACT_LINKS` + `detectContactLinks()` — auto-nempelin tombol link (IG, TikTok, WA, email) kalau pesan user nyinggung channel kontak tertentu
- **Quick replies** — 4 tombol starter pertanyaan pas chat pertama dibuka
- **Riwayat chat** — disimpen ke `localStorage` (`chatbot_history`, max 8 entry), bisa dibuka lewat menu "Lihat Riwayat Chat"
- Menu tambahan: "Mulai Chat Baru" (reset) & "Akhiri Chat" (tutup + reset init state)
- Avatar pake `raccon.gif` dari `public/frontend/assets/img/`

## Menjalankan

```bash
npm install
npm run serve   # dev server
npm run build    # production build
```

## Data Konten

Hampir semua teks section (nama, roles, socials, list skill, project, dll) tinggal edit di `src/data/portfolio.json` — ga perlu sentuh komponen Vue-nya kecuali AI Assistant (jawabannya masih hardcoded di script `AiAssistant.vue`, belum ditarik dari `portfolio.json`).

---

Referensi internal Das (`detonnn`) — portfolio pribadi, deployed di muhammad-ibnu.vercel.app.
