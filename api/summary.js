// GET /api/summary: how full each team and each officials' role is.
// Numbers only; names and emails never leave the server here.

import { failed, loadAll, summaryOf } from './_store.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed.' });
  try {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(summaryOf(await loadAll()));
  } catch (err) {
    return failed(res, err);
  }
}
