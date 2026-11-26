// POST /api/official { role, name, email, homeroom, days, note }
// Referees, the scorer and the timer. One sign-up per school email.

import {
  GAME_DAYS, K, ROLES, SCHOOL_EMAIL, body, clean, cleanEmail, computeRoles, expireIfTest, failed, limited, loadAll, newId, redis,
  refuse, summaryOf,
} from './_store.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  try {
    if (await limited(req, 'official', 20)) return refuse(res, 429, 'err.rate', {}, 'Too many sign-ups from this connection.');
    const b = body(req);
    const role = ROLES.find((r) => r.id === b.role);
    if (!role) return refuse(res, 400, 'err.role', {}, 'Pick a role.');
    const row = {
      id: newId(),
      role: role.id,
      name: clean(b.name, 80),
      email: cleanEmail(b.email).slice(0, 120),
      homeroom: clean(b.homeroom, 20),
      days: Array.isArray(b.days) ? GAME_DAYS.filter((d) => b.days.includes(d)) : [],
      note: clean(b.note, 300),
      at: Date.now(),
    };
    if (row.name.length < 2) return refuse(res, 400, 'err.name', {}, 'Name missing.');
    if (!SCHOOL_EMAIL.test(row.email)) return refuse(res, 400, 'err.emailDomain', {}, 'Use a school email.');
    if (!row.homeroom) return refuse(res, 400, 'err.homeroom', { x: '10.2' }, 'Homeroom missing.');
    if (!row.days.length) return refuse(res, 400, 'err.days', {}, 'Pick at least one day.');

    const [claim] = await redis([['SET', K.officialEmail(row.email), row.id, 'NX']]);
    if (claim !== 'OK') {
      const [takenId] = await redis([['GET', K.officialEmail(row.email)]]);
      const [taken] = takenId ? await redis([['HGET', K.officials, takenId]]) : [null];
      const takenRole = ROLES.find((r) => r.id === (taken ? JSON.parse(taken).role : ''));
      return refuse(res, 409, 'err.officialTaken', { email: row.email, role: takenRole?.word ?? '' }, `${row.email} is already signed up.`);
    }
    await redis([
      ['HSET', K.officials, row.id, JSON.stringify(row)],
      ...expireIfTest([K.officials, K.officialEmail(row.email)]),
    ]);

    const all = await loadAll();
    const mine = computeRoles(all.officials).find((r) => r.id === row.role);
    const reserve = mine.people.findIndex((p) => p.id === row.id) >= mine.need;
    return res.status(200).json({ ok: true, reserve, summary: summaryOf(all) });
  } catch (err) {
    return failed(res, err);
  }
}
