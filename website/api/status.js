// GET /api/status?t=<token>: where a submission is, for its progress link.
// Only the title, the status and dates; nothing about the person.

import { UUID, allowed, db, failed, ready, refuse, send } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed.' });
  if (!ready()) return refuse(res, 503, 'err.server', 'Storage is not connected.');
  try {
    if (!(await allowed(req, 'status', 60))) return refuse(res, 429, 'err.rate', 'Too many requests. Try again in 10 minutes.');
    const token = String(req.query?.t ?? '');
    if (!UUID.test(token)) return refuse(res, 404, 'err.unknown', 'No submission with this link.');
    const [sub] = await db(`submissions?token=eq.${token}&select=id,title,status,created_at,user_id`);
    if (!sub) return refuse(res, 404, 'err.unknown', 'No submission with this link.');
    const files = await db(`submission_files?submission_id=eq.${sub.id}&select=name`);
    return send(res, 200, { title: sub.title, status: sub.status, created_at: sub.created_at, files: files.length, linked: Boolean(sub.user_id) });
  } catch (err) {
    return failed(res, err);
  }
}
