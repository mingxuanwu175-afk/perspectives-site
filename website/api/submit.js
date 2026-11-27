// POST /api/submit
//
// Two steps, so files go straight from the browser to Supabase Storage and
// never pass through this function (Vercel caps a request at about 4.5 MB):
//
//   { action: 'start', name, email, contact, title, kind, note, files: [{ name, size, type }] }
//     -> records the submission and returns one signed upload URL per file:
//        { id, token, uploads: [{ path, url }] }
//     The browser PUTs each file to its url.
//
//   { action: 'finish', id, token }
//     -> checks every file arrived, marks the submission "received".
//
// Any file type is accepted; files are kept private in the "submissions"
// bucket and only editors see them. `token` is the submitter's progress link
// (contribution.html?t=<token>).

import {
  EMAIL, STORAGE, UUID, allowed, body, clean, cleanBlock, clientIp, db, failed, ready, refuse, send, storage, userOf,
} from './_lib.js';

const KINDS = ['writing', 'art', 'photo', 'other'];
const MB = 1024 * 1024;
const MAX_FILE = 50 * MB; // the bucket refuses larger files too
const MAX_FILES = 10;
const MAX_TOTAL = 200 * MB;

// Storage keys: ASCII only. The original name is kept in submission_files.name.
function slug(name) {
  const ext = (name.match(/\.[A-Za-z0-9]{1,10}$/)?.[0] ?? '').toLowerCase();
  const base = name.slice(0, name.length - ext.length).normalize('NFKD')
    .replace(/[^\w-]+/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '').slice(0, 60);
  return (base || 'file') + ext;
}

// Submissions whose upload never finished (closed tab, lost connection) are
// removed with their files after a day. Runs a little at a time, on new submissions.
async function sweepAbandoned() {
  const old = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const stale = await db(`submissions?status=eq.uploading&created_at=lt.${old}&select=id&limit=20`);
  if (!stale.length) return;
  const ids = stale.map((s) => s.id);
  const files = await db(`submission_files?submission_id=in.(${ids.join(',')})&select=path`);
  if (files.length) await storage('object/submissions', { method: 'DELETE', body: { prefixes: files.map((f) => f.path) } });
  await db(`submissions?id=in.(${ids.join(',')})&status=eq.uploading`, { method: 'DELETE' });
}

async function start(req, res, b) {
  if (!(await allowed(req, 'submit', 10))) return refuse(res, 429, 'err.rate', 'Too many submissions from this connection. Try again in 10 minutes.');
  await sweepAbandoned().catch((err) => console.error('sweep', err));
  // Submitting needs an account (the form signs people in or creates one).
  const user = await userOf(req);
  if (!user) return refuse(res, 401, 'err.signin', 'Sign in first.');
  const row = {
    user_id: user.id,
    name: clean(b.name, 80),
    email: String(user.email || clean(b.email, 120)).toLowerCase(),
    contact: clean(b.contact, 120),
    title: clean(b.title, 200),
    kind: KINDS.includes(b.kind) ? b.kind : 'other',
    note: cleanBlock(b.note, 2000),
    ip: clientIp(req),
  };
  if (!row.name) return refuse(res, 400, 'err.name', 'Name missing.');
  if (!EMAIL.test(row.email)) return refuse(res, 400, 'err.email', 'Email address not valid.');
  if (!row.title) return refuse(res, 400, 'err.title', 'Title missing.');

  const given = Array.isArray(b.files) ? b.files : [];
  if (!given.length) return refuse(res, 400, 'err.noFiles', 'Add at least one file.');
  if (given.length > MAX_FILES) return refuse(res, 400, 'err.tooMany', `At most ${MAX_FILES} files.`);
  const files = given.map((f, i) => ({
    name: clean(f?.name, 200) || `file-${i + 1}`,
    size: Number(f?.size),
    type: clean(f?.type, 100),
  }));
  if (files.some((f) => !Number.isFinite(f.size) || f.size <= 0)) return refuse(res, 400, 'err.empty', 'One of the files is empty.');
  if (files.some((f) => f.size > MAX_FILE)) return refuse(res, 413, 'err.size', 'Each file can be at most 50 MB.');
  if (files.reduce((n, f) => n + f.size, 0) > MAX_TOTAL) return refuse(res, 413, 'err.total', 'All files together can be at most 200 MB.');

  const [sub] = await db('submissions?select=id,token', { method: 'POST', body: row, prefer: 'return=representation' });
  const uploads = [];
  for (const [i, f] of files.entries()) {
    const path = `${sub.id}/${String(i + 1).padStart(2, '0')}-${slug(f.name)}`;
    const signed = await storage(`object/upload/sign/submissions/${path.split('/').map(encodeURIComponent).join('/')}`);
    uploads.push({ path, url: `${STORAGE()}${signed.url}` });
  }
  await db('submission_files', {
    method: 'POST',
    body: files.map((f, i) => ({ submission_id: sub.id, path: uploads[i].path, name: f.name, size: f.size, type: f.type })),
  });
  return send(res, 200, { id: sub.id, token: sub.token, uploads });
}

async function finish(req, res, b) {
  if (!UUID.test(String(b.id)) || !UUID.test(String(b.token))) return refuse(res, 400, 'err.server', 'Unknown submission.');
  const [sub] = await db(`submissions?id=eq.${b.id}&token=eq.${b.token}&select=id,status`);
  if (!sub) return refuse(res, 404, 'err.server', 'Unknown submission.');
  const expected = await db(`submission_files?submission_id=eq.${sub.id}&select=path`);
  const listed = await storage('object/list/submissions', { body: { prefix: `${sub.id}/`, limit: 100 } });
  const have = new Set((listed ?? []).map((o) => `${sub.id}/${o.name}`));
  const missing = expected.filter((f) => !have.has(f.path)).length;
  if (missing) return refuse(res, 409, 'err.upload', `${missing} file(s) did not arrive. Try again.`);
  if (sub.status === 'uploading') await db(`submissions?id=eq.${sub.id}`, { method: 'PATCH', body: { status: 'received' } });
  return send(res, 200, { ok: true });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed.' });
  if (!ready()) return refuse(res, 503, 'err.server', 'Storage is not connected.');
  try {
    const b = body(req);
    return b.action === 'finish' ? await finish(req, res, b) : await start(req, res, b);
  } catch (err) {
    return failed(res, err);
  }
}
