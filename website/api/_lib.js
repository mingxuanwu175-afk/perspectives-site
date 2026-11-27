// Shared by the functions in api/. The leading underscore keeps Vercel from
// serving it as a route.
//
// Data lives in Supabase (Postgres + Storage), connected to the Vercel project
// through the Supabase integration, which sets SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY. The service key stays on the server: every table
// has row level security on and no policies, so the public keys read nothing.

import crypto from 'node:crypto';

const BASE = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const ready = () => Boolean(BASE && KEY);
export const STORAGE = () => `${BASE}/storage/v1`;
const auth = () => ({ apikey: KEY, Authorization: `Bearer ${KEY}` });

// PostgREST: db('submissions?select=id', { method: 'POST', body: {...} })
export async function db(path, { method = 'GET', body, prefer } = {}) {
  const res = await fetch(`${BASE}/rest/v1/${path}`, {
    method,
    headers: { ...auth(), 'Content-Type': 'application/json', ...(prefer ? { Prefer: prefer } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Database ${res.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}

// Supabase Storage REST: storage('object/list/submissions', { body: {...} })
export async function storage(path, { method = 'POST', body } = {}) {
  const res = await fetch(`${STORAGE()}/${path}`, {
    method,
    headers: { ...auth(), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Storage ${res.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}

// ---------- requests

export function body(req) {
  const b = req.body;
  if (b && typeof b === 'object') return b;
  try {
    return JSON.parse(b || '{}');
  } catch {
    return {};
  }
}

export const clientIp = (req) => String(req.headers['x-forwarded-for'] ?? '').split(',')[0].trim() || 'unknown';

// One line of text: spaces collapsed, cut to max.
export const clean = (v, max) => String(v ?? '').trim().replace(/\s+/g, ' ').slice(0, max);
// A block of text: line breaks kept, cut to max.
export const cleanBlock = (v, max) => String(v ?? '').replace(/\r\n?/g, '\n').trim().slice(0, max);

export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// At most `max` requests of one kind from one connection in `windowS` seconds
// (hit_rate() in the database counts and records atomically).
export async function allowed(req, kind, max, windowS = 600) {
  const ok = await db('rpc/hit_rate', { method: 'POST', body: { k: `${kind}:${clientIp(req)}`, window_s: windowS, max_hits: max } });
  return ok === true;
}

export function send(res, status, data) {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(status).json(data);
}

// A refusal the page can show in its own language: `key` is in js/contribute.js.
export const refuse = (res, status, key, english) => send(res, status, { error: english, key });

export function failed(res, err) {
  console.error(err);
  return refuse(res, 500, 'err.server', 'Something went wrong on the server.');
}

// Compare secrets without leaking their length or content through timing.
export function sameSecret(given, expected) {
  if (typeof given !== 'string' || !expected) return false;
  const a = crypto.createHash('sha256').update(given).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}
