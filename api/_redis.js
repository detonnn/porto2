// ponytail: shared redis helper — deduped from visitors.js + chat.js
export async function redisGet(key, redisUrl, redisToken) {
  const url = `${redisUrl}/get/${encodeURIComponent(key)}`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 3500);
  try {
    const r = await fetch(url, { headers: { Authorization: `Bearer ${redisToken}` }, signal: ctrl.signal });
    if (!r.ok) throw new Error(`Redis error ${r.status}`);
    const data = await r.json();
    return data.result;
  } finally { clearTimeout(t); }
}
export async function redisIncr(key, redisUrl, redisToken) {
  const url = `${redisUrl}/incr/${encodeURIComponent(key)}`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 4000);
  try {
    const r = await fetch(url, { headers: { Authorization: `Bearer ${redisToken}` }, signal: ctrl.signal });
    if (!r.ok) throw new Error(`Redis error ${r.status}`);
    const data = await r.json();
    return data.result;
  } finally { clearTimeout(t); }
}
