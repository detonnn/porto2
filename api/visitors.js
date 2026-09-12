// api/visitors.js
// Counter visitor total (bukan detail per-user), disimpan di Upstash Redis
// via REST API biar bisa dipanggil dari Vercel serverless function (stateless).
//
// Butuh 2 env var di Vercel (otomatis ke-generate kalau lu connect integrasi
// Upstash lewat Vercel Marketplace, liat instruksi setup di chat):
//   UPSTASH_REDIS_REST_URL
//   UPSTASH_REDIS_REST_TOKEN

const COUNT_KEY = 'porto2:visitor_count';
// ponytail: simple in-memory rate-limit (per lambda instance) — cegah spam INCR
const _rl = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const last = _rl.get(ip) || 0;
  if (now - last < 10000) return true;
  _rl.set(ip, now);
  // cleanup old entries biar gak bocor memori
  if (_rl.size > 500) { for (const [k,v] of _rl) if (now - v > 60000) _rl.delete(k); }
  return false;
}
async function redis(pathParts, redisUrl, redisToken) {
  const url = `${redisUrl}/${pathParts.map(encodeURIComponent).join('/')}`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 4000);
  try {
    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${redisToken}` },
      signal: ctrl.signal,
    });
    if (!r.ok) throw new Error(`Redis error ${r.status}`);
    const data = await r.json();
    return data.result;
  } finally { clearTimeout(t); }
}

export default async function handler(req, res) {
  // baca env di dalam handler biar kebaca di runtime Vercel (bukan build-time), + cegah cache
  const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
  const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (!REDIS_URL || !REDIS_TOKEN) {
    return res.status(500).json({
      error: 'Redis belum dikonfigurasi. Set UPSTASH_REDIS_REST_URL & UPSTASH_REDIS_REST_TOKEN di Vercel env vars.',
    });
  }

  try {
    if (req.method === 'POST') {
      const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'anon';
      if (rateLimited(ip)) return res.status(429).json({ error: 'Terlalu sering, coba lagi 10 detik' });
      const count = await redis(['incr', COUNT_KEY], REDIS_URL, REDIS_TOKEN);
      return res.status(200).json({ count });
    }

    if (req.method === 'GET') {
      // dipanggil buat polling angka realtime tanpa nambah counter
      const raw = await redis(['get', COUNT_KEY], REDIS_URL, REDIS_TOKEN);
      const count = raw ? parseInt(raw, 10) : 0;
      return res.status(200).json({ count });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('visitors api error:', err);
    return res.status(500).json({ error: 'Gagal ambil/update data visitor' });
  }
}
