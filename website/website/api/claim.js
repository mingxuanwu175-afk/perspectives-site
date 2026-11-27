// POST /api/claim { token }   (Authorization: Bearer <Supabase access token>)
//
// Adds one submission to the signed-in person's account. Proof of ownership
// is the submission's progress-link token, which only the submitter was given
// (sign-up does not verify email addresses, so an email match proves nothing).
// A submission that already belongs to an account is left alone.

import { UUID, allowed, body, db, failed, ready, refuse, send, userOf } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed.' });
  if (!ready()) return refuse(res, 503, 'err.server', 'Storage is not connected.');
  try {
    if (!(await allowed(req, 'claim', 20))) return refuse(res, 429, 'err.rate', 'Too many requests.');
    const user = await userOf(req);
    if (!user) return refuse(res, 401, 'err.server', 'Sign in first.');
    const token = String(body(req).token ?? '');
    if (!UUID.test(token)) return refuse(res, 404, 'err.unknown', 'No submission with this link.');
    const rows = await db(`submissions?token=eq.${token}&select=user_id`);
    if (!rows.length) return refuse(res, 404, 'err.unknown', 'No submission with this link.');
    if (rows[0].user_id && rows[0].user_id !== user.id) return refuse(res, 409, 'err.claimed', 'This submission belongs to another account.');
    if (!rows[0].user_id) {
      await db(`submissions?token=eq.${token}&user_id=is.null`, { method: 'PATCH', body: { user_id: user.id } });
    }
    return send(res, 200, { linked: true });
  } catch (err) {
    return failed(res, err);
  }
}
