// api/review.js — review asli dari form contact
// GET    -> list review (publik, tanpa email)
// POST   -> kirim review (name, email, message, rating) -> simpan ke Upstash + email ke owner
// DELETE -> hapus review (header x-admin-key == ADMIN_KEY), body { id }
//
// Env di Vercel: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN (udah ada),
//                RESEND_API_KEY, ADMIN_KEY
import crypto from 'crypto';
import { redisCmd, redisPipeline } from './_redis.js';

const OWNER_EMAIL = 'ibnudexton@gmail.com';
const IDX = 'porto2:reviews:idx';   // sorted set (score = timestamp, member = id)
const DATA = 'porto2:reviews:data'; // hash (id -> json)
const AVATARS = 9;
const AVKEY = 'porto2:reviews:avatar';
const COOLDOWN = 3600;              // 1 jam per IP
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const clean = (s, max) => String(s ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sha = s => crypto.createHash('sha256').update(String(s)).digest('hex');
const getIp = req => req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'anon';
const body = req => (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {});

// owner bypass: kalo header x-admin-key cocok ADMIN_KEY, cooldown di-skip (buat testing)
const isAdmin = req => {
  const admin = process.env.ADMIN_KEY || '';
  const given = String(req.headers['x-admin-key'] || '');
  return !!admin && crypto.timingSafeEqual(Buffer.from(sha(admin)), Buffer.from(sha(given)));
};

async function sendMail({ name, email, message, rating }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) { console.error('RESEND_API_KEY belum diset'); return false; }
  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Portfolio <onboarding@resend.dev>',
      to: [OWNER_EMAIL],
      reply_to: email,
      subject: `[Portfolio] ${stars} dari ${name}`,
      html: `<div style="font-family:monospace"><h3>${esc(name)} &lt;${esc(email)}&gt;</h3><p style="font-size:20px;color:#f5a623">${stars}</p><p style="white-space:pre-wrap">${esc(message)}</p></div>`,
    }),
  });
  if (!r.ok) console.error('Resend error', r.status, await r.text());
  return r.ok;
}

export default async function handler(req, res) {
  const URL_ = process.env.UPSTASH_REDIS_REST_URL;
  const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  if (!URL_ || !TOKEN) return res.status(500).json({ error: 'Redis belum dikonfigurasi' });

  try {
    if (req.method === 'GET') {
      // cache edge 5 dtk: ngurangin hit Redis & load lebih cepat (admin.html pake ?t= biar selalu fresh)
      if (!req.query?.t) res.setHeader('Cache-Control', 'public, s-maxage=5');
      const ids = await redisCmd(['ZREVRANGE', IDX, 0, 29], URL_, TOKEN);
      if (!ids?.length) return res.status(200).json({ reviews: [] });
      const rows = await redisCmd(['HMGET', DATA, ...ids], URL_, TOKEN);
      const reviews = rows.filter(Boolean).map(r => JSON.parse(r));
      return res.status(200).json({ reviews });
    }

    if (req.method === 'POST') {
      const b = body(req);
      // honeypot (nama field sengaja gak umum biar gak di-autofill browser HP). Kalo keisi => tolak jelas, bukan pura-pura sukses
      if (b.hp) return res.status(400).json({ error: 'Data tidak valid, muat ulang halaman lalu coba lagi' });
      const name = clean(b.name, 40);
      const email = clean(b.email, 100);
      const message = clean(b.message, 500);
      const rating = parseInt(b.rating, 10);
      if (!name || !EMAIL_RE.test(email) || !message || !(rating >= 1 && rating <= 5)) {
        return res.status(400).json({ error: 'Data tidak lengkap / tidak valid' });
      }

      const rlKey = `porto2:reviews:rl:${sha(getIp(req))}`;
      const owner = isAdmin(req);
      // 1 round-trip: cek cooldown + ambil nomor avatar sekaligus (lebih cepet, terutama di jaringan HP)
      let n;
      if (owner) {
        n = await redisCmd(['INCR', AVKEY], URL_, TOKEN);
      } else {
        const [ok, c] = await redisPipeline([['SET', rlKey, '1', 'NX', 'EX', COOLDOWN], ['INCR', AVKEY]], URL_, TOKEN);
        if (!ok) {
          const [, ttl] = await redisPipeline([['DECR', AVKEY], ['TTL', rlKey]], URL_, TOKEN); // balikin nomor avatar yang kepake
          return res.status(429).json({ error: 'Cooldown 1 jam per review', retryAfter: Math.max(ttl, 1) });
        }
        n = c;
      }

      const id = Date.now().toString(36) + crypto.randomBytes(3).toString('hex');
      const review = {
        id, name, role: 'Client', rating, text: message,
        image: `/frontend/assets/img/avatars/av${((n - 1) % AVATARS) + 1}.jpg`,
        ts: Date.now(),
      };
      let card = 0;
      try {
        const out = await redisPipeline([
          ['HSET', DATA, id, JSON.stringify(review)],
          ['ZADD', IDX, review.ts, id],
          ['ZCARD', IDX],
        ], URL_, TOKEN);
        card = out[2];
      } catch (e) {
        if (!owner) await redisCmd(['DEL', rlKey], URL_, TOKEN).catch(() => {});
        throw e;
      }
      // simpen 200 review terbaru aja (cuma dicek kalo udah lewat)
      if (card > 200) {
        try {
          const old = await redisCmd(['ZRANGE', IDX, 0, card - 201], URL_, TOKEN);
          if (old?.length) await redisPipeline([['ZREM', IDX, ...old], ['HDEL', DATA, ...old]], URL_, TOKEN);
        } catch (e) { console.error('trim fail', e); }
      }
      // balas dulu ke pengunjung (review udah kesimpen), baru kirim email
      res.status(200).json({ ok: true, review });
      await sendMail({ name, email, message, rating }).catch(e => console.error('mail fail', e));
      return;
    }

    if (req.method === 'DELETE') {
      // batasin tebak password: max 10 gagal / 15 menit / IP
      const failKey = `porto2:reviews:fail:${sha(getIp(req))}`;
      const fails = parseInt(await redisCmd(['GET', failKey], URL_, TOKEN) || '0', 10);
      if (fails >= 10) return res.status(429).json({ error: 'Terlalu banyak percobaan, tunggu 15 menit' });

      const admin = process.env.ADMIN_KEY || '';
      const given = String(req.headers['x-admin-key'] || '');
      const same = admin && crypto.timingSafeEqual(Buffer.from(sha(admin)), Buffer.from(sha(given)));
      if (!same) {
        await redisPipeline([['INCR', failKey], ['EXPIRE', failKey, 900]], URL_, TOKEN);
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const id = clean(body(req).id, 40);
      if (!id) return res.status(400).json({ error: 'id wajib' });
      await redisPipeline([['ZREM', IDX, id], ['HDEL', DATA, id]], URL_, TOKEN);
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('review api error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
