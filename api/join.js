// POST /api/join { name, email, homeroom, roles, langs, note }
// Someone who wants to join the magazine team. One sign-up per school email;
// the editors see them on #/admin.

import { JOIN_LANGS, JOIN_ROLES } from '../js/data.js';
import {
  K, SCHOOL_EMAIL, body, clean, cleanEmail, expireIfTest, failed, limited, newId, redis, refuse,
} from './_store.js';

// Only ids from data.js are kept, in data.js order.
const pick = (list, given) => (Array.isArray(given) ? list.filter((x) => given.includes(x.id)).map((x) => x.id) : []);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  try {
    // A whole class may sign up at once from the school's network.
    if (await limited(req, 'join', 40)) return refuse(res, 429, 'err.rate', {}, 'Too many sign-ups from this connection.');
    const b = body(req);
    const row = {
      id: newId(),
      name: clean(b.name, 80),
      email: cleanEmail(b.email).slice(0, 120),
      homeroom: clean(b.homeroom, 20),
      roles: pick(JOIN_ROLES, b.roles),
      langs: pick(JOIN_LANGS, b.langs),
      note: clean(b.note, 500),
      at: Date.now(),
    };
    if (row.name.length < 2) return refuse(res, 400, 'err.name', {}, 'Name missing.');
    if (!SCHOOL_EMAIL.test(row.email)) return refuse(res, 400, 'err.emailDomain', {}, 'Use a school email.');
    if (!row.homeroom) return refuse(res, 400, 'err.homeroom', { x: '9.2' }, 'Homeroom missing.');
    if (!row.roles.length) return refuse(res, 400, 'err.roles', {}, 'Pick at least one thing to do.');

    const [claim] = await redis([['SET', K.joinEmail(row.email), row.id, 'NX']]);
    if (claim !== 'OK') return refuse(res, 409, 'err.joinTaken', { email: row.email }, `${row.email} has already signed up to join.`);
    await redis([
      ['HSET', K.joins, row.id, JSON.stringify(row)],
      ...expireIfTest([K.joins, K.joinEmail(row.email)]),
    ]);
    return res.status(200).json({ ok: true });
  } catch (err) {
    return failed(res, err);
  }
}
