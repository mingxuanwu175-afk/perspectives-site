// POST /api/signup { team, members: [{ name, email, homeroom, note }] }
// members[0] fills in the form (the captain of a group). Every email must be
// a school address that is not signed up already; a group is all or nothing.

import {
  K, SCHOOL_EMAIL, TEAMS, TEAM_SIZE, body, clean, cleanEmail, computeLineup, expireIfTest, failed, limited, loadAll, newId, redis,
  refuse, summaryOf,
} from './_store.js';
import { TOURNAMENT } from '../js/data.js';

// Sign-ups close after the last quarter-final (Singapore time).
const SGT_DAY = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Singapore', year: 'numeric', month: '2-digit', day: '2-digit' });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  try {
    if (await limited(req, 'signup', 20)) return refuse(res, 429, 'err.rate', {}, 'Too many sign-ups from this connection.');
    if (SGT_DAY.format(Date.now()) > TOURNAMENT.signupUntil) return refuse(res, 403, 'err.closed', {}, 'Sign-ups have closed.');
    const b = body(req);
    const team = TEAMS[b.team];
    if (!team) return refuse(res, 400, 'err.noTeam', {}, 'That team does not exist.');
    const list = Array.isArray(b.members) ? b.members : [];
    if (list.length < 1 || list.length > TEAM_SIZE) return refuse(res, 400, 'err.server', {}, 'A sign-up has 1 to 5 people.');

    const members = list.map((m, i) => ({
      name: clean(m?.name, 80),
      email: cleanEmail(m?.email).slice(0, 120),
      // A homeroom team is one class; grade teams ask the person filling in.
      homeroom: team.pool === 'homeroom' ? team.label : clean(m?.homeroom, 20),
      note: i === 0 ? clean(m?.note, 300) : '',
    }));
    for (const [i, m] of members.entries()) {
      if (m.name.length < 2) return refuse(res, 400, i === 0 ? 'err.name' : 'err.mateName', {}, 'Name missing.');
      if (!SCHOOL_EMAIL.test(m.email)) return refuse(res, 400, 'err.emailDomain', {}, 'Use a school email.');
    }
    if (team.pool === 'grade' && !members[0].homeroom) return refuse(res, 400, 'err.homeroom', { x: team.example }, 'Homeroom missing.');
    if (new Set(members.map((m) => m.email)).size !== members.length) return refuse(res, 400, 'err.emailDup', {}, 'The same email twice.');

    // Claim each email; if any is taken, give back the ones just claimed.
    const ids = members.map(() => newId());
    const claims = await redis(members.map((m, i) => ['SET', K.playerEmail(m.email), ids[i], 'NX']));
    const clash = claims.findIndex((r) => r !== 'OK');
    if (clash >= 0) {
      const ours = members.filter((_, i) => claims[i] === 'OK').map((m) => ['DEL', K.playerEmail(m.email)]);
      if (ours.length) await redis(ours);
      const email = members[clash].email;
      const [takenId] = await redis([['GET', K.playerEmail(email)]]);
      const [row] = takenId ? await redis([['HGET', K.players, takenId]]) : [null];
      const where = row ? TEAMS[JSON.parse(row).team]?.label ?? '' : '';
      return refuse(res, 409, 'err.emailTaken', { email, team: where }, `${email} is already signed up.`);
    }

    const at = Date.now();
    const group = members.length > 1 ? newId() : null;
    const rows = members.map((m, i) => ({ id: ids[i], team: b.team, group, captain: Boolean(group) && i === 0, ...m, at: at + i }));
    await redis([
      ['HSET', K.players, ...rows.flatMap((r) => [r.id, JSON.stringify(r)])],
      ...expireIfTest([K.players, ...rows.map((r) => K.playerEmail(r.email))]),
    ]);

    const all = await loadAll();
    const l = computeLineup(all.players, b.team);
    const reserve = l.reserves.some((p) => ids.includes(p.id));
    return res.status(200).json({ ok: true, reserve, count: l.count, summary: summaryOf(all) });
  } catch (err) {
    return failed(res, err);
  }
}
