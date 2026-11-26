// Server side of the sign-ups. Not a route (the leading underscore keeps
// Vercel from serving it); the files next to it are.
//
// Data lives in a Redis database from Upstash, added to the Vercel project
// from its Storage tab, which sets KV_REST_API_URL and KV_REST_API_TOKEN.
// Preview deployments use their own keys, which expire after a week, so
// testing never touches the real sign-ups.

import crypto from 'node:crypto';
import { GAME_DAYS, ROLES, TEAMS, TEAM_SIZE } from '../js/data.js';
import { computeLineup, computeRoles } from '../js/lineup.js';

export { GAME_DAYS, ROLES, TEAMS, TEAM_SIZE, computeLineup };

// The Storage tab names these KV_REST_API_URL and KV_REST_API_TOKEN, with a
// prefix if one was typed when connecting; Upstash's own names work too.
const fromEnv = (names) => {
  for (const [key, value] of Object.entries(process.env)) {
    if (names.some((n) => key === n || key.endsWith(`_${n}`))) return value;
  }
  return undefined;
};
const URL = fromEnv(['KV_REST_API_URL', 'UPSTASH_REDIS_REST_URL']);
const TOKEN = fromEnv(['KV_REST_API_TOKEN', 'UPSTASH_REDIS_REST_TOKEN']);
export const LIVE = process.env.VERCEL_ENV === 'production';
const P = LIVE ? 'live' : 'test';
const TEST_TTL = 60 * 60 * 24 * 7;

export const K = {
  players: `${P}:players`,
  officials: `${P}:officials`,
  playerEmail: (e) => `${P}:player-email:${e}`,
  officialEmail: (e) => `${P}:official-email:${e}`,
  joins: `${P}:joins`,
  joinEmail: (e) => `${P}:join-email:${e}`,
  rate: (kind, ip) => `${P}:rate:${kind}:${ip}`,
};

// Several Redis commands in one request (Upstash REST pipeline).
export async function redis(commands) {
  // Local development (dev/server.mjs) keeps its data in memory instead.
  if (!URL && !TOKEN && globalThis.__mockRedis) return globalThis.__mockRedis(commands);
  if (!URL || !TOKEN) throw Object.assign(new Error('The database is not connected.'), { status: 503 });
  const res = await fetch(`${URL}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
  });
  if (!res.ok) throw new Error(`Database error ${res.status}`);
  const out = await res.json();
  return out.map((r) => {
    if (r.error) throw new Error(r.error);
    return r.result;
  });
}

// Test data on preview deployments cleans itself up.
export const expireIfTest = (keys) => (LIVE ? [] : keys.map((k) => ['EXPIRE', k, TEST_TTL]));

const rowsOf = (flat) => {
  const rows = [];
  for (let i = 1; i < (flat?.length ?? 0); i += 2) rows.push(JSON.parse(flat[i]));
  return rows;
};

export async function loadAll() {
  const [players, officials] = await redis([['HGETALL', K.players], ['HGETALL', K.officials]]);
  return { players: rowsOf(players), officials: rowsOf(officials) };
}

// People who want to join the magazine team (api/join.js). Editors only.
export async function loadJoins() {
  const [joins] = await redis([['HGETALL', K.joins]]);
  return rowsOf(joins);
}

// What everyone may see: numbers only, no names or emails.
export function summaryOf({ players, officials }) {
  const teams = {};
  for (const id of Object.keys(TEAMS)) {
    const l = computeLineup(players, id);
    teams[id] = { count: l.count, open: l.open, total: l.total };
  }
  const roles = {};
  for (const r of computeRoles(officials)) roles[r.id] = { filled: r.filled, total: r.people.length };
  return { teams, roles };
}

export { computeRoles };

// ---------- requests

export const SCHOOL_EMAIL = /^[^\s@]+@xwa\.edu\.sg$/i;
export const cleanEmail = (v) => String(v ?? '').trim().toLowerCase();
export const clean = (v, max) => String(v ?? '').trim().replace(/\s+/g, ' ').slice(0, max);
export const newId = () => crypto.randomUUID();

export function body(req) {
  const b = req.body;
  if (b && typeof b === 'object') return b;
  try {
    return JSON.parse(b || '{}');
  } catch {
    return {};
  }
}

// A refusal the form can show in any language (keys from js/strings.js).
export const refuse = (res, status, key, vars = {}, english = 'Request refused.') =>
  res.status(status).json({ error: english, i18n: [key, vars] });

export const clientIp = (req) => String(req.headers['x-forwarded-for'] ?? '').split(',')[0].trim() || 'unknown';

// At most `max` requests of one kind per connection in ten minutes.
export async function limited(req, kind, max) {
  const key = K.rate(kind, clientIp(req));
  const [n] = await redis([['INCR', key], ['EXPIRE', key, 600]]);
  return n > max;
}

// Compare secrets without leaking their length or content through timing.
// Full-width characters (typed with a Chinese or Japanese input method) count
// as their ordinary forms, and spaces at either end are ignored.
const tidy = (s) => String(s).normalize('NFKC').trim();
export function sameSecret(given, expected) {
  if (typeof given !== 'string' || !expected) return false;
  const a = crypto.createHash('sha256').update(tidy(given)).digest();
  const b = crypto.createHash('sha256').update(tidy(expected)).digest();
  return crypto.timingSafeEqual(a, b);
}

export function failed(res, err) {
  console.error(err);
  res.status(err.status === 503 ? 503 : 500).json({ error: 'Something went wrong on the server.', i18n: ['err.server', {}] });
}
