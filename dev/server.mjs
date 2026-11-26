// Local development server: the static site plus every function in api/,
// run the way Vercel runs them.
//
//   node dev/server.mjs        then open http://127.0.0.1:8765
//
// Nothing here talks to the real database. Sign-ups, the join form and the
// editors' page (#/admin, password "local") use a database that lives in
// memory and is wiped when the server stops. Set PORT for another port.

import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { mockRedis } from './mock-redis.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT || 8765);

// Make sure no real keys are picked up, then switch the store to memory.
for (const k of Object.keys(process.env)) if (/KV_|REDIS|UPSTASH/.test(k)) delete process.env[k];
process.env.ADMIN_PASSWORD ||= 'local';
globalThis.__mockRedis = mockRedis;

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.glb': 'model/gltf-binary', '.mp4': 'video/mp4', '.md': 'text/plain; charset=utf-8',
};

// The parts of Vercel's req/res helpers the functions use.
function wrapRes(res) {
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (data) => {
    if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
    return res;
  };
  res.send = (data) => { res.end(typeof data === 'string' ? data : JSON.stringify(data)); return res; };
  return res;
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const text = Buffer.concat(chunks).toString('utf8');
  if ((req.headers['content-type'] || '').includes('application/json')) {
    try { return JSON.parse(text || '{}'); } catch { return text; }
  }
  return text;
}

async function runApi(name, req, res) {
  const file = path.join(ROOT, 'api', `${name}.js`);
  if (name.startsWith('_') || !(await fs.stat(file).catch(() => null))) return wrapRes(res).status(404).json({ error: 'No such function.' });
  req.body = await readBody(req);
  // A fresh import on every request, so edits show up without a restart.
  const mod = await import(`${pathToFileURL(file).href}?t=${Date.now()}`);
  await mod.default(req, wrapRes(res));
}

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const api = url.pathname.match(/^\/api\/([\w-]+)\/?$/);
    if (api) return await runApi(api[1], req, res);
    let file = path.join(ROOT, decodeURIComponent(url.pathname));
    if (!file.startsWith(ROOT)) return res.writeHead(403).end();
    if ((await fs.stat(file).catch(() => null))?.isDirectory()) file = path.join(file, 'index.html');
    const data = await fs.readFile(file).catch(() => null);
    if (!data) return res.writeHead(404).end('Not found');
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.writeHead(500);
    res.end('Server error');
  }
}).listen(PORT, '127.0.0.1', () => {
  console.log(`Perspectives (local, test database in memory): http://127.0.0.1:${PORT}`);
  console.log('Editors page: #/admin, password "local"');
});
