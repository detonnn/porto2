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

// ponytail: generic command / pipeline helpers (Upstash REST) — dipake api/review.js
export async function redisCmd(cmd, redisUrl, redisToken) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 4000);
  try {
    const r = await fetch(redisUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${redisToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(cmd),
      signal: ctrl.signal,
    });
    if (!r.ok) throw new Error(`Redis error ${r.status}`);
    return (await r.json()).result;
  } finally { clearTimeout(t); }
}
export async function redisPipeline(cmds, redisUrl, redisToken) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 4000);
  try {
    const r = await fetch(`${redisUrl}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${redisToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(cmds),
      signal: ctrl.signal,
    });
    if (!r.ok) throw new Error(`Redis error ${r.status}`);
    return (await r.json()).map(x => x.result);
  } finally { clearTimeout(t); }
}
