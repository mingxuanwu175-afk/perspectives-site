// ONE-OFF, removed right after use: empties the old Upstash Redis store
// (basketball sign-ups, officials, the join list already copied to Supabase,
// rate limits). GET lists what is there; POST deletes the live:/test: keys.
// Needs the WIPE_TOKEN env var in the x-wipe-token header.
import crypto from 'node:crypto';

const fromEnv = (names) => {
  for (const [key, value] of Object.entries(process.env)) {
    if (names.some((n) => key === n || key.endsWith(`_${n}`))) return value;
  }
  return undefined;
};
const URL = fromEnv(['KV_REST_API_URL', 'UPSTASH_REDIS_REST_URL']);
const TOKEN = fromEnv(['KV_REST_API_TOKEN', 'UPSTASH_REDIS_REST_TOKEN']);

async function redis(commands) {
  const r = await fetch(`${URL}/pipeline`, { method: 'POST', headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify(commands) });
  if (!r.ok) throw new Error('redis ' + r.status);
  return (await r.json()).map((x) => x.result);
}
async function allKeys() {
  let cursor = '0'; const keys = [];
  do {
    const [[next, batch]] = await redis([['SCAN', cursor, 'COUNT', '500']]);
    cursor = String(next); keys.push(...batch);
  } while (cursor !== '0');
  return keys;
}

export default async function handler(req, res) {
  const want = process.env.WIPE_TOKEN || '';
  const got = String(req.headers['x-wipe-token'] || '');
  if (!want || got.length !== want.length || !crypto.timingSafeEqual(Buffer.from(got), Buffer.from(want))) return res.status(404).end();
  if (!URL || !TOKEN) return res.status(503).json({ error: 'no redis env' });
  const keys = await allKeys();
  const groups = {};
  for (const k of keys) { const g = k.split(':').slice(0, 2).join(':'); groups[g] = (groups[g] || 0) + 1; }
  if (req.method !== 'POST') return res.json({ total: keys.length, groups });
  const ours = keys.filter((k) => /^(live|test):/.test(k));
  for (let i = 0; i < ours.length; i += 200) await redis([['DEL', ...ours.slice(i, i + 200)]]);
  const left = await allKeys();
  return res.json({ deleted: ours.length, left: left.length, leftKeys: left.slice(0, 20) });
}
