// Language switching: English (default), Chinese, Japanese, Korean.
// Interface text is in strings.js; event and tournament content in data.js
// uses objects like { en, zh, ja, ko } that L() picks from.

import { STRINGS } from './strings.js';

export const LANGS = [
  { code: 'en', label: 'EN', short: 'EN', html: 'en', locale: 'en-GB', font: null },
  { code: 'zh', label: '中文', short: '中', html: 'zh-CN', locale: 'zh-CN', font: 'Noto+Sans+SC:wght@400;500;700;900' },
  { code: 'ja', label: '日本語', short: '日', html: 'ja', locale: 'ja-JP', font: 'Noto+Sans+JP:wght@400;500;700;900' },
  { code: 'ko', label: '한국어', short: '한', html: 'ko', locale: 'ko-KR', font: 'Noto+Sans+KR:wght@400;500;700;900' },
];

const KEY = 'perspectives.lang';
const listeners = new Set();
let current = 'en';
try {
  const saved = localStorage.getItem(KEY);
  if (LANGS.some((l) => l.code === saved)) current = saved;
} catch {
  /* storage blocked: stay in English */
}

export const lang = () => current;
export const langInfo = () => LANGS.find((l) => l.code === current);

// Placeholder values may themselves be { en, zh, ja, ko } objects.
const fill = (s, vars) => (vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(L(vars[k])) : m)) : s);

export function t(key, vars) {
  const table = STRINGS[current] ?? STRINGS.en;
  let s = vars?.n === 1 ? table[`${key}_one`] ?? table[key] : table[key];
  if (s === undefined) s = (vars?.n === 1 && STRINGS.en[`${key}_one`]) || STRINGS.en[key] || key;
  return fill(s, vars);
}

// Pick the current language from a content object; plain values pass through.
export function L(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value[current] ?? value.en;
  return value;
}

const fontsLoaded = new Set();
function ensureFont(info) {
  if (!info.font || fontsLoaded.has(info.code)) return;
  fontsLoaded.add(info.code);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${info.font}&display=swap`;
  document.head.appendChild(link);
}

export function applyDocumentLang() {
  const info = langInfo();
  document.documentElement.lang = info.html;
  document.documentElement.classList.toggle('cjk', current !== 'en');
  ensureFont(info);
}

export function setLang(code) {
  if (code === current || !LANGS.some((l) => l.code === code)) return;
  current = code;
  try {
    localStorage.setItem(KEY, code);
  } catch {
    /* choice lasts until reload */
  }
  applyDocumentLang();
  listeners.forEach((fn) => fn(code));
}

export function onLang(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// The switch shown in every top bar. Clicks are handled once in app.js.
export function langSwitch(extra = '') {
  const buttons = LANGS.map(
    (l) => `<button type="button" class="lang-btn" data-lang="${l.code}" lang="${l.html}" aria-label="${l.label}" aria-pressed="${l.code === current}"><span class="lang-long" aria-hidden="true">${l.label}</span><span class="lang-short" aria-hidden="true">${l.short}</span></button>`,
  ).join('');
  return `<div class="lang ${extra}" role="group" aria-label="${t('lang.label')}">${buttons}</div>`;
}
