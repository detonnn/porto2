# 9Router Ops Bot

> Telegram jadi remote control buat semua project Das.

Satu bot Telegram (`das9router_bot`) dipake buat mantau uptime, deploy Vercel, aktivitas GitHub (push/commit/issue), dan jalanin perintah git — semua dari HP, tanpa buka laptop.

| | |
|---|---|
| **Bot** | `das9router_bot` |
| **Runtime** | Node.js + PM2 |
| **Storage** | `watchlist.json` (file-based) |

```
/addweb situsklien.com repo:situsklien Situs Klien
> ✅ Web ditambahin ke pantauan
> Situs Klien
> https://situsklien.com
> 🔗 Repo: detonnn/situsklien (push/commit/issue ikut dipantau)

> 🔴 Situs Klien DOWN
> https://situsklien.com
> Status: 503 | 8241ms

> 🚀 Push baru - Situs Klien
> Repo: detonnn/situsklien
> a1b2c3d fix layout mobile
> by detonnn
```

## Daftar Isi

- [Arsitektur Sistem](#arsitektur-sistem)
- [Timeline Command](#timeline-command--dari-awal-sampai-sekarang)
- [Semua Command](#semua-command)
- [Alur Kerja `/addweb`](#alur-kerja-sekali-addweb-tiap-loop-ngecek-apa-aja)
- [Environment Variables](#environment-variables)
- [Peta File & Cara Jalanin](#peta-file--cara-jalanin)

## Arsitektur Sistem

Semua proses jalan independen lewat PM2, saling terpisah tapi share 2 modul inti: `telegram.js` (pengirim pesan) dan `watchlist.js` (penyimpanan daftar web).

| File | Peran | Proses |
|---|---|---|
| `telegram.js` | Helper pengirim pesan ke Telegram (HTML mode). Dipake hampir semua file lain. | Modul inti |
| `watchlist.js` | Baca/tulis `watchlist.json`. Nyimpen daftar web, status terakhir, sha commit terakhir, id issue terakhir. | Modul inti |
| `bot-commands.js` | Long-poll ke Telegram API, proses semua command masuk (`/status`, `/addweb`, dst). Satu-satunya pintu masuk perintah dari HP. | PM2: `botcmd` |
| `monitor-loop.js` | Cron loop. Cek uptime web utama, status deploy Vercel, dan loop semua entry di watchlist (uptime + git). | PM2: `monitor` |
| `site-monitor.js` / `monitor.js` | Versi awal monitor uptime (`setInterval` biasa), sebelum ada watchlist. Masih bisa jalan standalone kalo perlu. | Legacy / opsional |
| `vercel-monitor.js` | Versi awal cek deploy Vercel standalone, sebelum digabung ke `monitor-loop.js`. | Legacy / opsional |
| `github-commands.js` | Command manual: `/ghstatus /ghcommits /ghprs /ghissues`. Fokus ke 1 repo lewat `GITHUB_OWNER/GITHUB_REPO`. | GitHub — polling |
| `github-webhook.js` | Express server port 20130. Nerima webhook GitHub real-time (push/PR/issue), forward ke Telegram. Support multi-repo asal di-setting manual per repo. | GitHub — realtime |
| `wrap.js` / `dev-wrap.js` | Bungkus proses (`9router` atau `npm run dev`), forward semua console log ke Telegram tiap 5 detik. | Log forwarding |
| `notify.js` | Kirim pesan update progress manual dari terminal: `node notify.js "pesan"`. | Manual trigger |

## Timeline Command — dari awal sampai sekarang

Urutan asli gimana sistem ini dibangun bertahap, tiap fase nambah kemampuan baru tanpa ngerusak yang lama.

### Fase 1 — Kontrol Git dari HP
**`bot-commands.js`: perintah git dasar**

Bot dengerin pesan masuk lewat long-polling, cuma proses dari `CHAT_ID` yang authorized. Jalanin git command langsung di `REPO_DIR`.

```
/status
/commit <pesan>
/push
/pull
/help
```

### Fase 2 — Integrasi GitHub
**`github-commands.js` (polling) + `github-webhook.js` (realtime)**

Dua pendekatan dipasang bareng: command manual buat query kapan aja, dan webhook server buat notif otomatis begitu ada event di GitHub. Awalnya cuma mantau 1 repo lewat env var.

```
/ghstatus
/ghcommits
/ghprs
/ghissues
```

### Fase 3 — Monitor jadi dinamis
**`watchlist.js` + `/addweb` (versi awal)**

Sebelumnya monitor cuma mantau 1 web hardcoded (`SITE_URL`). Ditambahin `watchlist.json` biar user bisa nambah web apapun lewat Telegram, dan tetep persist walau proses restart.

```
/addweb <url> [label]
/listweb
/removeweb
```

### Fase 4 — Nempelin monitoring web ke repo GitHub-nya
**`watchlist.js` diperluas: `lastCommitSha` + `lastIssueIds`**

Web yang dipantau bisa ditempelin ke repo GitHub-nya. Tiap loop, `monitor-loop.js` sekalian ngecek commit terbaru (push) dan issue open baru (bug) dari repo itu, dibandingin sama state tersimpan.

```
/addweb <url> owner/repo [label]
```

### Fase 5 — Bikin input repo enak dipake
**Prefix `repo:` + default owner + `/myrepos`**

Format `owner/repo` di posisi tetap gampang ketuker sama label. Diganti pake prefix eksplisit `repo:`, dan kalo repo-nya punya sendiri, cukup nama repo doang (owner-nya di-default ke `GITHUB_OWNER` di `.env`). Ditambahin `/myrepos` buat liat nama repo persis dari GitHub, tinggal copas.

```
/addweb <url> repo:namarepo [label]
/myrepos
```

## Semua Command

Semua ini aktif bareng lewat proses `botcmd` di PM2. Cuma nerima perintah dari `CHAT_ID` yang di-authorize.

### Git

| Command | Sumber file | Fungsi |
|---|---|---|
| `/status` | bot-commands.js | Jalanin `git status` di REPO_DIR |
| `/commit <pesan>` | bot-commands.js | `git add -A` lalu `git commit -m` |
| `/push` | bot-commands.js | `git push` |
| `/pull` | bot-commands.js | `git pull` |

### GitHub (query manual, 1 repo tetap)

| Command | Sumber file | Fungsi |
|---|---|---|
| `/ghstatus` | github-commands.js | Info repo: stars, forks, issue count, commit terakhir |
| `/ghcommits [n]` | github-commands.js | N commit terakhir (default 5, max 15) |
| `/ghprs` | github-commands.js | Daftar PR yang masih open |
| `/ghissues` | github-commands.js | Daftar issue yang masih open |

### Monitor Web (dinamis, web apapun)

| Command | Sumber file | Fungsi |
|---|---|---|
| `/addweb <url> [repo:nama] [label]` | bot-commands.js + watchlist.js | Tambah web ke pantauan uptime, opsional tempelin repo GitHub buat push/commit/issue |
| `/listweb` | bot-commands.js | Liat semua web dipantau + status terakhir |
| `/removeweb <nomor/url>` | bot-commands.js | Hapus web dari daftar |
| `/myrepos` | bot-commands.js | List nama repo dari akun GitHub, buat dicopas ke `/addweb` |

### Umum

| Command | Sumber file | Fungsi |
|---|---|---|
| `/help` | bot-commands.js | Nampilin semua command di atas |

## Alur Kerja: Sekali `/addweb`, Tiap Loop Ngecek Apa Aja

Ini yang jalan otomatis di background (proses `monitor`) tiap interval `CHECK_INTERVAL_CRON` (default tiap 5 menit), buat tiap entry di watchlist.

1. **Cron trigger jalan** — node-cron manggil `runChecks()` → `checkWatchlist()` dipanggil, loop semua entry di `watchlist.json` secara paralel.
2. **Cek uptime (selalu jalan)** — Fetch URL-nya, bandingin `isUp` sekarang vs `lastStatus` tersimpan.
   - ✅ berubah jadi UP → kirim notif "UP lagi"
   - 🔴 berubah jadi DOWN → kirim notif "DOWN" + status code
   - ⏳ ga berubah → diem, cuma dicatat di log lokal
3. **Punya repo yang ditempelin?** — Kalo `entry.repo` kosong (ga di-setting pas `/addweb`) → stop di sini, cuma uptime doang. Kalo ada → lanjut ke cek GitHub.
4. **Cek commit terbaru (push)** — GET `/repos/{repo}/commits?per_page=1`, bandingin sha sama `lastCommitSha` tersimpan.
   - 🚀 sha beda → kirim notif: sha pendek, pesan commit, nama author
   - sha sama / baseline pertama → diem, cuma update state
5. **Cek issue open (bug)** — GET `/repos/{repo}/issues?state=open`, filter PR, bandingin daftar nomor issue sama `lastIssueIds` tersimpan.
   - 🐛 ada nomor baru → kirim notif per issue baru: nomor, judul, pembuat
   - baseline pertama → diem — biar ga spam semua issue lama yang emang udah ada dari awal
6. **State disimpen balik ke `watchlist.json`** — Semua status baru (uptime, sha, daftar issue) ditulis ulang, jadi baseline buat perbandingan di loop berikutnya.

> **Catatan** — cek commit & issue butuh `GITHUB_TOKEN` keisi di `.env`. Kalo token itu scope-nya fine-grained ke 1 repo doang, nambahin web dengan repo lain bisa gagal fetch (error 403/404 di log `[WATCHLIST-GIT]`).

## Environment Variables

Semua diisi di satu file `.env`, dipake bareng-bareng sama semua proses di folder ini.

| Variable | Dipake di |
|---|---|
| `BOT_TOKEN` | bot-commands.js, telegram.js, wrap.js dkk |
| `CHAT_ID` | bot-commands.js, telegram.js, wrap.js dkk |
| `TELEGRAM_BOT_TOKEN` | monitor-loop.js |
| `TELEGRAM_CHAT_ID` | monitor-loop.js |
| `REPO_DIR` | bot-commands.js (path repo portfolio) |
| `SITE_URL` | monitor-loop.js, site-monitor.js |
| `VERCEL_TOKEN` | monitor-loop.js, vercel-monitor.js |
| `VERCEL_PROJECT_ID` | monitor-loop.js |
| `GITHUB_TOKEN` | github-commands.js, github-webhook.js, monitor-loop.js, bot-commands.js |
| `GITHUB_OWNER` | github-commands.js, bot-commands.js (default owner `/addweb`) |
| `GITHUB_REPO` | github-commands.js (repo default `/ghstatus` dkk) |
| `GITHUB_WEBHOOK_SECRET` | github-webhook.js |
| `CHECK_INTERVAL_CRON` | monitor-loop.js (default `*/5 * * * *`) |

## Peta File & Cara Jalanin

| File | Cara jalanin | Peran |
|---|---|---|
| `bot-commands.js` | PM2: `botcmd` | Terima semua command Telegram (git + web watchlist) |
| `monitor-loop.js` | PM2: `monitor` | Cron loop: uptime utama, Vercel deploy, watchlist (uptime+git) |
| `github-webhook.js` | Express, port 20130 (+ngrok) | Nerima webhook GitHub realtime, multi-repo asal disetting manual di GitHub |
| `wrap.js` | `npm run wrap` | Forward log 9Router ke Telegram |
| `dev-wrap.js` | `node dev-wrap.js "npm run dev" "Label"` | Forward log dev server portfolio ke Telegram |
| `notify.js` | `node notify.js "pesan"` | Kirim update progress manual |
| `site-monitor.js` / `monitor.js` / `vercel-monitor.js` | opsional, standalone | Versi lama sebelum digabung ke `monitor-loop.js` — masih bisa dipake terpisah kalo perlu |

### Menjalankan via PM2

```bash
pm2 start ecosystem.config.js
pm2 save
```

Buat auto-start pas Windows boot, install `pm2-windows-startup` dulu:

```bash
npm install -g pm2-windows-startup
pm2-startup install
pm2 save
```

---

Dibuat buat referensi internal Das (`detonnn`) — sistem monitoring & kontrol jarak jauh via Telegram untuk 9Router & portfolio.
