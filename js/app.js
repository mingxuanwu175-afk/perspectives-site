import { closeDialog, setupDialog } from './dialog.js';
import * as fx from './fx.js';
import { applyDocumentLang, lang, onLang, setLang, t } from './i18n.js';
import { reducedMotion } from './util.js';
import * as admin from './views/admin.js';
import * as basketball from './views/basketball.js';
import * as events from './views/events.js';
import * as home from './views/home.js';
import * as join from './views/join.js';
import * as officials from './views/officials.js';
import * as spirit from './views/spirit.js';

const ROUTES = { '': home, events, basketball, spirit, officials, join, admin };
const THEME_COLOR = { cover: '#0B0B10', paper: '#F2EAD5', arena: '#12080F', spirit: '#0E0F13' };

const main = document.getElementById('main');
const skip = document.querySelector('[data-skip]');
let teardown = null;
let current = null;
let firstRender = true;

function currentPath() {
  const hash = location.hash;
  if (!hash.startsWith('#/')) return '';
  return hash.slice(2).split(/[?#]/)[0].replace(/\/$/, '');
}

function setTitle(view) {
  document.title = view.titleKey ? `${t(view.titleKey)} | Perspectives` : 'Perspectives';
}

function route() {
  const view = ROUTES[currentPath()] ?? home;
  current = view;
  closeDialog();
  teardown?.();
  teardown = null;

  document.body.dataset.theme = view.theme;
  setTitle(view);
  document.querySelector('meta[name="theme-color"]').setAttribute('content', THEME_COLOR[view.theme]);

  main.replaceChildren();
  teardown = view.render(main) ?? null;
  window.scrollTo(0, 0);

  // Keyboard and screen reader users start at the top of the new page.
  if (!firstRender && view !== admin) main.focus({ preventScroll: true });
  firstRender = false;
}

// Page changes (js/fx.js): the page burns away into light and particles from
// where it was clicked, the name of the next page decodes in, and the new page
// comes out of the particles. Blue for the robot's pages, pink inside Think
// Pink. The cover's scroll-in ends in a flash, so its page comes out of light.
const TONE = { cover: '#3B82F6', paper: '#3B82F6', arena: '#FF5CA5', spirit: '#2F6BFF' };
let lastPress = null;
let busy = false;
let again = false;
document.addEventListener('pointerdown', (e) => {
  lastPress = { x: e.clientX, y: e.clientY, at: performance.now() };
}, { capture: true });

async function go() {
  const next = ROUTES[currentPath()] ?? home;
  const html = document.documentElement;
  const style = html.dataset.vtNext;
  delete html.dataset.vtNext;
  if (busy) {
    again = true;
    return;
  }
  if (next === current || reducedMotion() || !fx.available()) {
    route();
    return;
  }
  busy = true;
  const tone = TONE[next.theme];
  // Start from the link that was pressed; keyboard and back button start in the middle.
  const origin = lastPress && performance.now() - lastPress.at < 1500 ? lastPress : null;
  try {
    if (style === 'light') fx.fill({ tone, light: true });
    else await fx.cover({ origin, tone });
    const title = next.titleKey ? t(next.titleKey) : 'Perspectives';
    await fx.signal(t('fx.signal'), title);
    route();
    const middle = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    await fx.reveal({ tone, light: style === 'light', origin: style === 'light' ? middle : undefined });
  } finally {
    busy = false;
  }
  // Another link was followed mid-change: show where we ended up.
  if (again) {
    again = false;
    if ((ROUTES[currentPath()] ?? home) !== current) route();
  }
}

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
applyDocumentLang();
skip.textContent = t('skip');
setupDialog();
window.addEventListener('hashchange', go);
route();

// Language switch: every top bar has one; one listener handles them all.
document.addEventListener('click', (e) => {
  const button = e.target.closest?.('[data-lang]');
  if (button) setLang(button.dataset.lang);
});

onLang(() => {
  skip.textContent = t('skip');
  for (const b of document.querySelectorAll('.lang-btn')) b.setAttribute('aria-pressed', String(b.dataset.lang === lang()));
  for (const g of document.querySelectorAll('.lang')) g.setAttribute('aria-label', t('lang.label'));
  setTitle(current);
  // Pages rebuild in the new language; the cover updates its own text so the
  // 3D scene keeps running.
  if (!current.liveLang) {
    const y = window.scrollY;
    route();
    window.scrollTo(0, y);
  }
  // Keep keyboard focus on the switch that was just used.
  document.querySelector('.lang-btn[aria-pressed="true"]')?.focus({ preventScroll: true });
});

// The skip link must not change the hash, which drives the router.
skip.addEventListener('click', (e) => {
  e.preventDefault();
  main.focus();
});
