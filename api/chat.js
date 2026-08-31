const FACTS = {
  creator: 'Content creator favorit Ibnu:Windah Basudara, Luthfi Halimawan, Ace Anthem, Ade Setiawan, dan Deankt!',
  food: 'Makanan favorit Ibnu: nasi goreng dan ayam geprek Sabana!',
  hobby: 'Hobi Ibnu: eksplorasi & eksperimen hal baru, bersepeda, dan hunting inspirasi desain.',
  game: 'Game favorit Ibnu: Red Dead Redemption 2, Clair Obscur: Expedition 33, Dark Souls III, Ghost of Yotei, Diablo V, Roblox, plus game indie & party.',
  fav: 'Favorit Ibnu — Makanan: nasi goreng & ayam geprek Sabana. Hobi: eksplor hal baru & bersepeda. Game: RDR2, Clair Obscur: Expedition 33, Dark Souls III, Ghost of Yotei, Diablo V, Roblox. Creator: Deddy Corbuzier, Raditya Dika, Arif Muhammad, Jerome Polin, Bayu Skak, Windah Basudara, Luthfi Halimawan, Ace Anthem, Ade Setiawan, Deankt.',
  age: 'Ibnu umur 19 tahun, domisili Tangerang — anak pertama dari 2 bersaudara, kuliah di Universitas Pamulang.',
  profile: 'Muhammad Ibnu Dexton Alfathir — 19 th, Tangerang, mahasiswa Universitas Pamulang, lulusan SMKN 5 Kota Tangerang DKV. Fokus UI/UX, graphic design, motion & frontend dev.',
  skill: 'Skill Ibnu: Graphic Design 95% (AI/PS), UI/UX 90% (Figma), Motion 80% (CapCut), Frontend 75% (React/Tailwind/Vite/JS), Layout Print 85%.',
  tech: 'Tech stack: React 19, Tailwind CSS, Vite, Vanilla JS, Lenis, OGL. Deploy Vercel + Serverless Node.js.',
};

const MAP = [
  { keys: ['creator favorit', 'content creator', 'deankt', 'deddy', 'raditya', 'windah', 'jerome'], reply: FACTS.creator },
  { keys: ['makanan favorit', 'makanan kesukaan', 'nasi goreng', 'ayam geprek', 'sabana'], reply: FACTS.food },
  { keys: ['game favorit', 'game kesukaan', 'rdr2', 'clair obscur', 'dark souls', 'ghost of yotei', 'diablo', 'roblox'], reply: FACTS.game },
  { keys: ['hobi', 'hobby'], reply: FACTS.hobby },
  { keys: ['umur', 'usia', 'lahir', 'ulang tahun', '19 tahun'], reply: FACTS.age },
  { keys: ['favorit', 'kesukaan'], reply: FACTS.fav },
  { keys: ['siapa ibnu', 'tentang ibnu', 'profil ibnu'], reply: FACTS.profile },
  { keys: ['skill', 'keahlian', 'bisa apa'], reply: FACTS.skill },
  { keys: ['tech stack', 'teknologi', 'pakai apa', 'framework'], reply: FACTS.tech },
];

function localAnswer(msg) {
  const l = ' ' + msg.toLowerCase() + ' ';
  let best = null, bestScore = 0;
  for (const e of MAP) {
    let s = 0;
    for (const k of e.keys) if (l.includes(k)) s += k.length;
    if (s > bestScore) { bestScore = s; best = e.reply; }
  }
  return best || 'Boleh tanya apa aja soal si dexton — profil, skill & tech stack, proyek, makanan/hobi/game favorit, creator favorit, atau cara kontak. Coba: " siapa?"';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { message } = req.body || {};
  if (!message || typeof message !== 'string' || !message.trim()) return res.status(400).json({ error: 'Pesan kosong' });
  const safe = message.slice(0, 300);
  const reply = localAnswer(safe);
  return res.status(200).json({ reply });
}
