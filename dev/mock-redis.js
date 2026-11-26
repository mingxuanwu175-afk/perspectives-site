// A stand-in for the Upstash database, for local development only. It keeps
// data in memory and understands the commands api/ uses. Add a command here
// when api/ starts using a new one.

const db = new Map();      // key -> string, or Map for hashes
const expiry = new Map();  // key -> time in ms

const alive = (k) => {
  const t = expiry.get(k);
  if (t !== undefined && t <= Date.now()) { db.delete(k); expiry.delete(k); }
  return db.has(k);
};
const hash = (k) => {
  if (!alive(k)) db.set(k, new Map());
  return db.get(k);
};

const COMMANDS = {
  GET: (k) => (alive(k) ? db.get(k) : null),
  SET: (k, v, ...opts) => {
    const o = opts.map((x) => String(x).toUpperCase());
    if (o.includes('NX') && alive(k)) return null;
    db.set(k, String(v)); expiry.delete(k);
    const ex = o.indexOf('EX');
    if (ex >= 0) expiry.set(k, Date.now() + Number(opts[ex + 1]) * 1000);
    return 'OK';
  },
  DEL: (...ks) => ks.reduce((n, k) => (alive(k) ? (db.delete(k), expiry.delete(k), n + 1) : n), 0),
  INCR: (k) => { const n = Number(alive(k) ? db.get(k) : 0) + 1; db.set(k, String(n)); return n; },
  EXPIRE: (k, s) => (alive(k) ? (expiry.set(k, Date.now() + Number(s) * 1000), 1) : 0),
  HSET: (k, ...fv) => {
    const h = hash(k); let added = 0;
    for (let i = 0; i < fv.length; i += 2) { if (!h.has(fv[i])) added++; h.set(String(fv[i]), String(fv[i + 1])); }
    return added;
  },
  HGET: (k, f) => (alive(k) ? db.get(k).get(String(f)) ?? null : null),
  HDEL: (k, ...fs) => (alive(k) ? fs.reduce((n, f) => n + (db.get(k).delete(String(f)) ? 1 : 0), 0) : 0),
  HGETALL: (k) => (alive(k) ? [...db.get(k)].flat() : []),
};

export async function mockRedis(commands) {
  return commands.map(([cmd, ...args]) => {
    const fn = COMMANDS[String(cmd).toUpperCase()];
    if (!fn) throw new Error(`dev/mock-redis.js does not know ${cmd} yet.`);
    return fn(...args);
  });
}
