// ONE-OFF, delete after use: copies the join-the-team list from the old Upstash
// Redis store (live:joins) into the Supabase table `joins`. Safe to run twice
// (rows are matched on legacy_id). Needs the header x-migrate-key set to the
// Supabase service key, so only someone holding that key can run it.

import { db, failed, ready, sameSecret, send } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed.' });
  if (!ready() || !sameSecret(req.headers['x-migrate-key'], process.env.SUPABASE_SERVICE_ROLE_KEY)) {
    return send(res, 401, { error: 'Not allowed.' });
  }
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return send(res, 503, { error: 'Redis is not connected to this deployment.' });
  try {
    const r = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([['HGETALL', 'live:joins']]),
    });
    const [out] = await r.json();
    const flat = out?.result ?? [];
    const rows = [];
    for (let i = 1; i < flat.length; i += 2) {
      const x = JSON.parse(flat[i]);
      rows.push({
        legacy_id: x.id,
        created_at: new Date(x.at).toISOString(),
        name: x.name,
        email: x.email,
        homeroom: x.homeroom ?? '',
        roles: x.roles ?? [],
        langs: x.langs ?? [],
        note: x.note ?? '',
      });
    }
    if (rows.length) {
      await db('joins?on_conflict=legacy_id', { method: 'POST', body: rows, prefer: 'resolution=ignore-duplicates' });
    }
    const all = await db('joins?select=id');
    return send(res, 200, { redis: rows.length, supabase: all.length });
  } catch (err) {
    return failed(res, err);
  }
}
