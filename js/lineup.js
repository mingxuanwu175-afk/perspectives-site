// Team matching and officials, shared by the page (js/store.js) and the
// server (api/). Pure functions over lists of sign-up rows.
//
// Sign-ups are taken in order. A group only takes places if the whole group
// fits, so friends are never split up. People who sign up alone fill whatever
// places are left. Anyone past five becomes a reserve, and a group that could
// not fit is flagged for the organisers.

import { ROLES, TEAM_SIZE } from './data.js';

export function computeLineup(players, team) {
  const rows = players.filter((p) => p.team === team).sort((a, b) => a.at - b.at);

  const units = [];
  const groups = new Map();
  let letter = 0;
  for (const r of rows) {
    if (!r.group) {
      units.push({ kind: 'solo', members: [r] });
      continue;
    }
    let unit = groups.get(r.group);
    if (!unit) {
      const x = String.fromCharCode(65 + letter);
      unit = { kind: 'group', id: r.group, letter: x, tag: `Group ${x}`, index: letter, members: [] };
      letter += 1;
      groups.set(r.group, unit);
      units.push(unit);
    }
    unit.members.push(r);
  }

  const starters = [];
  const reserves = [];
  const waiting = [];
  for (const unit of units) {
    const placed = unit.members.map((m) => ({ ...m, unit }));
    if (starters.length + unit.members.length <= TEAM_SIZE) {
      starters.push(...placed);
    } else {
      if (unit.kind === 'group' && starters.length < TEAM_SIZE) {
        waiting.push({ unit, openAtTheTime: TEAM_SIZE - starters.length });
      }
      reserves.push(...placed);
    }
  }

  return {
    team,
    starters,
    reserves,
    waiting,
    count: starters.length,
    open: TEAM_SIZE - starters.length,
    total: rows.length,
  };
}

export function computeRoles(officials) {
  const list = officials.slice().sort((a, b) => a.at - b.at);
  return ROLES.map((role) => {
    const people = list.filter((o) => o.role === role.id);
    return {
      ...role,
      people,
      filled: Math.min(people.length, role.need),
      reserves: Math.max(0, people.length - role.need),
    };
  });
}
