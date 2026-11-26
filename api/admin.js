// POST /api/admin with the editors' password as `key` in the body.
//   { key, action: 'list' }            every sign-up, with names and emails,
//                                      and everyone who wants to join the team
//   { key, action: 'remove', id }      delete one sign-up, then list
// The password is ADMIN_PASSWORD in the Vercel project's settings.

import { K, body, clientIp, failed, loadAll, loadJoins, redis, sameSecret } from './_store.js';

const pause = (ms) => new Promise((r) => setTimeout(r, ms));

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return res.status(503).json({ error: 'Set ADMIN_PASSWORD in the Vercel project settings.' });
  try {
    // Ten wrong passwords from one connection lock it out for fifteen minutes.
    const lockKey = K.rate('admin-fail', clientIp(req));
    const [fails] = await redis([['GET', lockKey]]);
    if (Number(fails) >= 10) return res.status(429).json({ error: 'Too many wrong passwords. Try again later.' });
    const b = body(req);
    const given = typeof b.key === 'string' ? b.key : req.headers['x-admin-key'];
    if (!sameSecret(given, password)) {
      await redis([['INCR', lockKey], ['EXPIRE', lockKey, 900]]);
      await pause(400);
      return res.status(401).json({ error: 'Wrong password.' });
    }

    if (b.action === 'remove' && typeof b.id === 'string') {
      const [p, o, j] = await redis([['HGET', K.players, b.id], ['HGET', K.officials, b.id], ['HGET', K.joins, b.id]]);
      const drop = [];
      if (p) drop.push(['HDEL', K.players, b.id], ['DEL', K.playerEmail(JSON.parse(p).email)]);
      if (o) drop.push(['HDEL', K.officials, b.id], ['DEL', K.officialEmail(JSON.parse(o).email)]);
      if (j) drop.push(['HDEL', K.joins, b.id], ['DEL', K.joinEmail(JSON.parse(j).email)]);
      if (drop.length) await redis(drop);
    }
    res.setHeader('Cache-Control', 'no-store');
    const [all, joins] = await Promise.all([loadAll(), loadJoins()]);
    return res.status(200).json({ ...all, joins });
  } catch (err) {
    return failed(res, err);
  }
}
