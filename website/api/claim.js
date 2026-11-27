// POST /api/claim  (Authorization: Bearer <Supabase access token>)
//
// After someone submits without an account and then signs in through the
// email link offered on the thank-you screen, this links every submission
// made with that (now verified) email address to their account.

import { allowed, db, failed, ready, refuse, send, userOf } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed.' });
  if (!ready()) return refuse(res, 503, 'err.server', 'Storage is not connected.');
  try {
    if (!(await allowed(req, 'claim', 20))) return refuse(res, 429, 'err.rate', 'Too many requests.');
    const user = await userOf(req);
    if (!user?.email || !user.email_confirmed_at) return refuse(res, 401, 'err.server', 'Sign in first.');
    const email = encodeURIComponent(user.email.toLowerCase());
    const linked = await db(`submissions?email=eq.${email}&user_id=is.null&select=id`, {
      method: 'PATCH', body: { user_id: user.id }, prefer: 'return=representation',
    });
    return send(res, 200, { linked: linked.length });
  } catch (err) {
    return failed(res, err);
  }
}
