// Sign-up data layer.
//
// Live site (Vercel): sign-ups go to the server (api/), which keeps them in a
// database. The page only ever receives team and role counts; the editors'
// page gets the full list once the server has checked its password.
//
// Prototype (opened from this folder with serve.py): everything is kept in
// this browser's localStorage, so each device only sees its own sign-ups.
//
// The rest of the site only uses the functions exported here.

import { JOIN_LANGS, JOIN_ROLES, ROLES, TEAMS, TEAM_SIZE } from './data.js';
import { L } from './i18n.js';
import { computeLineup, computeRoles } from './lineup.js';

// `?live` in the address tries the live mode on a local server (vercel dev).
export const REMOTE = !['127.0.0.1', 'localhost', ''].includes(location.hostname) || new URLSearchParams(location.search).has('live');

const KEY = 'perspectives.signups.v1';
const ADMIN_KEY = 'perspectives.editor.key';
const listeners = new Set();
const notify = () => listeners.forEach((fn) => fn());

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const SCHOOL_EMAIL = /^[^\s@]+@xwa\.edu\.sg$/i;
export const cleanEmail = (value) => String(value ?? '').trim().toLowerCase();
const uid = () => crypto.randomUUID?.() ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
const clean = (value) => String(value ?? '').trim().replace(/\s+/g, ' ');

// Errors carry a strings.js key so the form can show them in any language.
const fail = (key, vars, english) => Object.assign(new Error(english), { i18n: [key, vars] });

// ---------------------------------------------------------------- live site

let summary = null; // { teams: { id: { count, open, total } }, roles: { id: { filled, total } } }
let admin = null; // { players, officials, joins }, editors only
let adminKey = null;
try {
  adminKey = sessionStorage.getItem(ADMIN_KEY);
} catch {
  adminKey = null;
}

async function api(path, body, key) {
  let res;
  try {
    res = await fetch(path, {
      method: body ? 'POST' : 'GET',
      headers: { 'content-type': 'application/json' },
      body: body ? JSON.stringify(key ? { ...body, key } : body) : undefined,
      cache: 'no-store',
    });
  } catch {
    throw fail('err.network', {}, 'Could not reach the server.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw Object.assign(new Error(data.error || `HTTP ${res.status}`), {
      status: res.status,
      i18n: data.i18n ?? (res.status >= 500 ? ['err.server', {}] : undefined),
    });
  }
  return data;
}

// Team and role counts for everyone; refreshed now and then.
export async function refresh() {
  if (!REMOTE) return;
  try {
    summary = await api('/api/summary');
    notify();
  } catch (err) {
    console.warn('Could not load the sign-up numbers:', err);
  }
}
if (REMOTE) {
  refresh();
  setInterval(() => {
    if (!document.hidden && !admin) refresh();
  }, 30000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) (admin ? refreshAdmin() : refresh());
  });
}

// ---------------------------------------------------------------- prototype

let db = null;

function load() {
  if (db) return db;
  let raw = null;
  try {
    raw = JSON.parse(localStorage.getItem(KEY) || 'null');
  } catch {
    raw = null;
  }
  db = {
    players: Array.isArray(raw?.players) ? raw.players : [],
    officials: Array.isArray(raw?.officials) ? raw.officials : [],
    joins: Array.isArray(raw?.joins) ? raw.joins : [],
  };
  return db;
}

function commit() {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    // Storage blocked (private window, full disk): keep going in memory.
  }
  notify();
}

// Another tab changed the data: reload and tell the page.
if (!REMOTE) {
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY && e.key !== null) return;
    db = null;
    notify();
  });
}

// ---------------------------------------------------------------- reading

// On the live site the page cannot look up other people's emails; the server
// checks for duplicates when the form is sent.
export const playerByEmail = (email) => (REMOTE ? null : load().players.find((p) => p.email === cleanEmail(email)));
export const officialByEmail = (email) => (REMOTE ? null : load().officials.find((o) => o.email === cleanEmail(email)));

export function lineup(team) {
  if (!REMOTE) return computeLineup(load().players, team);
  if (admin) return computeLineup(admin.players, team);
  const s = summary?.teams?.[team];
  return { team, starters: [], reserves: [], waiting: [], count: s?.count ?? 0, open: s ? s.open : TEAM_SIZE, total: s?.total ?? 0 };
}

export function officialsByRole() {
  if (!REMOTE) return computeRoles(load().officials);
  if (admin) return computeRoles(admin.officials);
  return ROLES.map((role) => {
    const s = summary?.roles?.[role.id];
    return { ...role, people: [], filled: s?.filled ?? 0, reserves: s ? Math.max(0, s.total - role.need) : 0 };
  });
}

// ---------------------------------------------------------------- signing up

// members[0] is the person filling in the form (the captain of a group).
// Resolves to { size, reserve, count }: whether they landed on the reserves,
// and how many starters the team now has.
export async function addPlayers(team, members) {
  if (REMOTE) {
    const r = await api('/api/signup', { team, members });
    summary = r.summary ?? summary;
    notify();
    return { size: members.length, reserve: r.reserve, count: r.count };
  }
  if (!TEAMS[team]) throw fail('err.noTeam', {}, 'That team does not exist.');
  for (const m of members) {
    const taken = playerByEmail(m.email);
    if (taken) {
      const vars = { email: cleanEmail(m.email), team: TEAMS[taken.team].label };
      throw fail('err.emailTaken', vars, `${vars.email} is already signed up for ${vars.team}.`);
    }
  }
  const group = members.length > 1 ? uid() : null;
  const at = Date.now();
  const rows = members.map((m, i) => ({
    id: uid(),
    team,
    group,
    captain: Boolean(group) && i === 0,
    name: clean(m.name),
    email: cleanEmail(m.email),
    homeroom: clean(m.homeroom),
    note: clean(m.note),
    at: at + i,
  }));
  load().players.push(...rows);
  commit();
  const l = lineup(team);
  const ids = new Set(rows.map((r) => r.id));
  return { size: rows.length, reserve: l.reserves.some((p) => ids.has(p.id)), count: l.count };
}

// Resolves to { reserve }: whether every place for that role was already taken.
export async function addOfficial(entry) {
  if (REMOTE) {
    const r = await api('/api/official', entry);
    summary = r.summary ?? summary;
    notify();
    return { reserve: r.reserve };
  }
  const taken = officialByEmail(entry.email);
  if (taken) {
    const role = ROLES.find((r) => r.id === taken.role);
    throw fail('err.officialTaken', { email: cleanEmail(entry.email), role: role?.word ?? taken.role }, `${cleanEmail(entry.email)} is already signed up.`);
  }
  const row = {
    id: uid(),
    role: entry.role,
    name: clean(entry.name),
    email: cleanEmail(entry.email),
    homeroom: clean(entry.homeroom),
    days: [...(entry.days ?? [])],
    note: clean(entry.note),
    at: Date.now(),
  };
  load().officials.push(row);
  commit();
  const role = officialsByRole().find((r) => r.id === row.role);
  return { reserve: role.people.findIndex((p) => p.id === row.id) >= role.need };
}

// ---------------------------------------------------------------- joining the team

// On the live site the page cannot look up other people's emails; the server
// checks for duplicates when the form is sent.
export const joinByEmail = (email) => (REMOTE ? null : load().joins.find((j) => j.email === cleanEmail(email)));

export async function addJoin(entry) {
  if (REMOTE) {
    await api('/api/join', entry);
    return;
  }
  if (joinByEmail(entry.email)) {
    const email = cleanEmail(entry.email);
    throw fail('err.joinTaken', { email }, `${email} has already signed up to join.`);
  }
  load().joins.push({
    id: uid(),
    name: clean(entry.name),
    email: cleanEmail(entry.email),
    homeroom: clean(entry.homeroom),
    roles: [...entry.roles],
    langs: [...entry.langs],
    note: clean(entry.note),
    at: Date.now(),
  });
  commit();
}

// Editors only: everyone who wants to join, newest first.
export function joins() {
  const list = REMOTE ? admin?.joins ?? [] : load().joins;
  return [...list].sort((a, b) => b.at - a.at);
}

// ---------------------------------------------------------------- editors

// Live site: the password is checked by the server, and kept for this browser
// tab only so the list can refresh.
export async function unlock(password) {
  try {
    admin = await api('/api/admin', { action: 'list' }, password);
  } catch (err) {
    if (err.status === 401) return false;
    throw err;
  }
  adminKey = password;
  try {
    sessionStorage.setItem(ADMIN_KEY, password);
  } catch {
    /* kept in memory until the page is reloaded */
  }
  notify();
  return true;
}

export const hasAdminKey = () => Boolean(adminKey);
export const adminReady = () => Boolean(admin);

export async function refreshAdmin() {
  if (!adminKey) return false;
  try {
    admin = await api('/api/admin', { action: 'list' }, adminKey);
    notify();
    return true;
  } catch (err) {
    if (err.status === 401) lock();
    return false;
  }
}

export function lock() {
  admin = null;
  adminKey = null;
  try {
    sessionStorage.removeItem(ADMIN_KEY);
  } catch {
    /* nothing stored */
  }
}

export async function removeEntry(id) {
  if (REMOTE) {
    admin = await api('/api/admin', { action: 'remove', id }, adminKey);
    notify();
    return;
  }
  const d = load();
  d.players = d.players.filter((p) => p.id !== id);
  d.officials = d.officials.filter((o) => o.id !== id);
  d.joins = d.joins.filter((j) => j.id !== id);
  commit();
}

// ---------------------------------------------------------------- prototype tools

const SAMPLE_PLAYERS = [
  ['10.1', [['Alex Tan', '', 'Point guard, can also referee'], ['Jordan Lee'], ['Priya Nair']]],
  ['10.1', [['Kenji Sato']]],
  ['10.2', [['Mei Lin Wong']]],
  ['10.2', [['Omar Haddad']]],
  ['10.2', [['Sofia Rossi', '', 'Away on Tuesday']]],
  ['10.2', [['Daniel Park']]],
  ['10.2', [['Hana Kim']]],
  ['10.2', [['Tom Becker']]],
  ['10.3', [['Lucas Chen'], ['Arjun Mehta'], ['Emma Schmidt'], ['Wei Jie Lim'], ['Noah Brown']]],
  ['G7', [['Ryan Ng', '7.2']]],
  ['G7', [['Chloe Tay', '7.1']]],
  ['G8', [['Ethan Goh', '8.3'], ['Marcus Yeo', '8.3']]],
  ['G8', [['Isla Martin', '8.1']]],
  ['G8', [['Aditi Rao', '8.1'], ['Ben Carter', '8.2'], ['Zara Ali', '8.1']]],
  ['G9', [['Leo Fernandes', '9.2']]],
  ['FEP', [['Yuki Tanaka', 'FEP 1'], ['Minh Tran', 'FEP 1'], ['Carlos Ruiz', 'FEP 2'], ['Ana Silva', 'FEP 2']]],
];

const SAMPLE_OFFICIALS = [
  ['referee', 'Grace Ho', '11.2', ['2026-10-19', '2026-10-20', '2026-10-21']],
  ['referee', 'Samuel Ong', '11.1', ['2026-10-19', '2026-10-22', '2026-10-26']],
  ['timer', 'Nina Patel', '9.1', ['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-26']],
];

const SAMPLE_JOINS = [
  ['Lin Yutong', '9.2', ['write', 'translate'], ['zh', 'en'], 'Wrote for the school paper at my old school'],
  ['Kaito Mori', '10.3', ['photo', 'podcast'], ['ja', 'en'], ''],
  ['Ji-woo Han', '8.1', ['draw', 'design', 'social'], ['ko', 'en'], 'I post sketches on Instagram'],
];

const sampleEmail = (name) => `sample.${name.toLowerCase().replace(/[^a-z]+/g, '.')}@xwa.edu.sg`;

// Sample sign-ups exist only in the prototype; the live list is real people.
export function addSampleData() {
  if (REMOTE) return;
  removeSampleData();
  const base = Date.now() - 1000 * 60 * 60 * 30;
  let t = base;
  const d = load();
  for (const [team, people] of SAMPLE_PLAYERS) {
    const group = people.length > 1 ? uid() : null;
    people.forEach(([name, homeroom = '', note = ''], i) => {
      d.players.push({
        id: uid(), team, group, captain: Boolean(group) && i === 0,
        name, email: sampleEmail(name), homeroom, note, at: t + i, demo: true,
      });
    });
    t += 1000 * 60 * 47;
  }
  for (const [role, name, homeroom, days] of SAMPLE_OFFICIALS) {
    d.officials.push({ id: uid(), role, name, email: sampleEmail(name), homeroom, days, note: '', at: t, demo: true });
    t += 1000 * 60 * 53;
  }
  for (const [name, homeroom, roles, langs, note] of SAMPLE_JOINS) {
    d.joins.push({ id: uid(), name, email: sampleEmail(name), homeroom, roles, langs, note, at: t, demo: true });
    t += 1000 * 60 * 61;
  }
  commit();
}

export function removeSampleData() {
  if (REMOTE) return;
  const d = load();
  d.players = d.players.filter((p) => !p.demo);
  d.officials = d.officials.filter((o) => !o.demo);
  d.joins = d.joins.filter((j) => !j.demo);
  commit();
}

export const hasSampleData = () =>
  !REMOTE && (load().players.some((p) => p.demo) || load().officials.some((o) => o.demo) || load().joins.some((j) => j.demo));

// Spreadsheet-safe CSV (leading = + - @ would run as formulas in Excel).
const cell = (v) => {
  let s = String(v ?? '');
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};
const when = (ms) => new Date(ms).toISOString().replace('T', ' ').slice(0, 16);

export function toCSV() {
  const lines = [['Type', 'Team or role', 'Place', 'Group', 'Captain', 'Name', 'Email', 'Homeroom', 'Days', 'Note', 'Signed up (UTC)', 'Sample'].map(cell).join(',')];
  for (const id of Object.keys(TEAMS)) {
    const l = lineup(id);
    const rows = [...l.starters.map((p) => ['Player', p]), ...l.reserves.map((p) => ['Reserve', p])];
    for (const [place, p] of rows) {
      lines.push([
        'Player', TEAMS[id].label, place, p.unit.kind === 'group' ? p.unit.tag : 'Solo', p.captain ? 'Yes' : '',
        p.name, p.email, p.homeroom, '', p.note, when(p.at), p.demo ? 'Yes' : '',
      ].map(cell).join(','));
    }
  }
  for (const role of officialsByRole()) {
    role.people.forEach((o, i) => {
      lines.push([
        'Official', role.name.en, i < role.need ? 'Official' : 'Reserve', '', '',
        o.name, o.email, o.homeroom, o.days.join(' '), o.note, when(o.at), o.demo ? 'Yes' : '',
      ].map(cell).join(','));
    });
  }
  return `﻿${lines.join('\r\n')}`;
}

// The people who want to join, for the editors' spreadsheet. Roles and
// languages are written in the language the page is in.
export function joinsCSV() {
  const nameIn = (list, id) => L(list.find((x) => x.id === id)?.name ?? id);
  const lines = [['Name', 'Email', 'Homeroom', 'Would like to do', 'Writes in', 'Note', 'Signed up (UTC)', 'Sample'].map(cell).join(',')];
  for (const j of joins()) {
    lines.push([
      j.name, j.email, j.homeroom, j.roles.map((id) => nameIn(JOIN_ROLES, id)).join(' / '),
      j.langs.map((id) => nameIn(JOIN_LANGS, id)).join(' / '), j.note, when(j.at), j.demo ? 'Yes' : '',
    ].map(cell).join(','));
  }
  return `\ufeff${lines.join('\r\n')}`;
}
