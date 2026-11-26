import { lang, langInfo, t } from './i18n.js';

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

export function parseDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function isoDate(date) {
  const p = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

export function addDays(date, n) {
  const next = new Date(date);
  next.setDate(next.getDate() + n);
  return next;
}

// English uses fixed names (Intl's en-GB now prints "Sept", which the print
// edition doesn't use). Chinese, Japanese and Korean use the browser's own
// date formats, which follow each language's conventions.
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const asDate = (d) => (typeof d === 'string' ? parseDate(d) : d);
const two = (n) => String(n).padStart(2, '0');
const en = () => lang() === 'en';

const cache = new Map();
function intl(opts) {
  const key = `${langInfo().locale}|${JSON.stringify(opts)}`;
  if (!cache.has(key)) cache.set(key, new Intl.DateTimeFormat(langInfo().locale, opts));
  return cache.get(key);
}

export const fmtWeekday = (d) => (en() ? DAYS[asDate(d).getDay()].slice(0, 3) : intl({ weekday: 'short' }).format(asDate(d)));
export const fmtMonth = (d) => (en() ? MONTHS[asDate(d).getMonth()].slice(0, 3) : intl({ month: 'short' }).format(asDate(d)));
export const fmtShort = (d) => (en()
  ? `${fmtWeekday(d)} ${asDate(d).getDate()} ${fmtMonth(d)}`
  : intl({ month: 'short', day: 'numeric', weekday: 'short' }).format(asDate(d)));
export const fmtLong = (d) => (en()
  ? `${DAYS[asDate(d).getDay()]} ${asDate(d).getDate()} ${MONTHS[asDate(d).getMonth()]}`
  : intl({ month: 'long', day: 'numeric', weekday: 'long' }).format(asDate(d)));

export function fmtStamp(ms) {
  const d = new Date(ms);
  if (en()) return `${d.getDate()} ${fmtMonth(d)}, ${two(d.getHours())}:${two(d.getMinutes())}`;
  return intl({ month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
}

// Short dates with weekdays: "Wed 30 Sep to Fri 2 Oct".
export const fmtRange = (a, b) => (a === b ? fmtShort(a) : t('range', { a: fmtShort(a), b: fmtShort(b) }));

// A span of days without weekdays: "19 to 23 October", "28 Sep to 23 Oct 2026".
export function fmtSpan(a, b, { year = false, short = false } = {}) {
  const A = asDate(a);
  const B = asDate(b);
  if (en()) {
    const month = (d) => (short ? MONTHS[d.getMonth()].slice(0, 3) : MONTHS[d.getMonth()]);
    const tail = year ? ` ${B.getFullYear()}` : '';
    if (A.getMonth() === B.getMonth() && !short) return `${A.getDate()} to ${B.getDate()} ${month(B)}${tail}`;
    return `${A.getDate()} ${month(A)} to ${B.getDate()} ${month(B)}${tail}`;
  }
  // Built from two dates rather than Intl's formatRange, which falls back to
  // "2026/9/28 – 2026/10/23" in some browsers.
  const sameMonth = A.getFullYear() === B.getFullYear() && A.getMonth() === B.getMonth();
  const start = intl(year ? { year: 'numeric', month: 'long', day: 'numeric' } : { month: 'long', day: 'numeric' }).format(A);
  const end = intl(sameMonth ? { day: 'numeric' } : { month: 'long', day: 'numeric' }).format(B);
  return t('range', { a: start, b: end });
}

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function pips(filled, total = 5) {
  let out = '';
  for (let i = 0; i < total; i += 1) out += `<i class="pip${i < filled ? ' on' : ''}"></i>`;
  return `<span class="pips" aria-hidden="true">${out}</span>`;
}
