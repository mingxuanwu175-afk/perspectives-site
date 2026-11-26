// Home cover: the android (../cover3d.js) with a HUD laid over it.
// Styling follows the UI/UX Pro Max "Perspectives Cover" system: immersive
// pattern, brutalist frame, star white + launch blue, Exo / Roboto Mono.
// Switching language updates the text in place; the 3D scene keeps running.

import { ISSUE, JOIN_FORM, NOW_OPEN } from '../data.js';
import { L, lang, langSwitch, onLang, t } from '../i18n.js';
import { icon } from '../icons.js';
import { esc, fmtShort, fmtSpan, reducedMotion } from '../util.js';
import { openJoin } from './joinform.js';

export const theme = 'cover';
export const liveLang = true;

// Scramble glyphs in the script being decoded.
const GLYPHS = {
  en: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&/<>+=',
  zh: '的一是在不了有和人这中大为上个国我以要他时来用们生到作地于出就分对成会可主发年动同工',
  ja: 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン',
  ko: '가나다라마바사아자차카타파하거너더러머버서어저처커터퍼허고노도로모보소오조초코토포호',
};
// What readers can do right now (data.js NOW_OPEN), in Singapore time.
const SGT_DAY = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Singapore', year: 'numeric', month: '2-digit', day: '2-digit' });
function openNow() {
  const today = SGT_DAY.format(Date.now());
  return NOW_OPEN.filter((item) => (!item.until || today <= item.until) && (!item.needsForm || JOIN_FORM));
}

const signed = (v) => `${v < 0 ? '−' : '+'}${Math.abs(v).toFixed(1).padStart(4, '0')}°`;

// One fixed-width cell per character (words kept whole for line breaks),
// so scrambling never shifts the layout. Spaces map to null.
function cells(el, text) {
  el.textContent = '';
  const out = [];
  let word = null;
  for (const ch of text) {
    if (ch === ' ') {
      word = null;
      el.appendChild(document.createTextNode(' '));
      out.push(null);
      continue;
    }
    if (!word) {
      word = document.createElement('span');
      word.className = 'dw';
      el.appendChild(word);
    }
    const span = document.createElement('span');
    span.className = 'dc';
    span.textContent = ch;
    word.appendChild(span);
    out.push(span);
  }
  return out;
}

function lockWidths(spans) {
  const live = spans.filter(Boolean);
  for (const s of live) s.style.width = '';
  const widths = live.map((s) => s.getBoundingClientRect().width);
  live.forEach((s, i) => {
    s.style.width = `${widths[i]}px`;
  });
}

// Letters spin through random glyphs and lock in from left to right.
function decode(spans, text, { step = 55, spin = 420 } = {}) {
  const glyphs = GLYPHS[lang()] ?? GLYPHS.en;
  const chars = [...text];
  const start = performance.now();
  let raf = 0;
  const tick = (now) => {
    const elapsed = now - start;
    let done = true;
    spans.forEach((s, i) => {
      if (!s) return;
      if (elapsed >= i * step + spin) {
        if (s.textContent !== chars[i]) s.textContent = chars[i];
      } else {
        done = false;
        if (elapsed > i * step * 0.3) s.textContent = glyphs[(Math.random() * glyphs.length) | 0];
      }
    });
    if (!done) raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

export function render(root) {
  const still = reducedMotion();
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  root.innerHTML = `
    <div class="cover-track" data-track>
    <section class="cover" data-state="loading">
      <div class="cover-stage" data-stage></div>
      <div class="cover-grid" aria-hidden="true"></div>
      <header class="cover-bar">
        <span data-issue></span>
        <span data-dates></span>
        <span class="cover-bar-end">${langSwitch('lang--cover')}</span>
      </header>
      <h1 class="cover-mast" aria-label="Perspectives"><span aria-hidden="true" data-mast>Perspectives</span></h1>
      <div class="hud" aria-hidden="true">
        <div class="hud-frame" data-frame>
          <i class="hud-c hud-c--tl"></i><i class="hud-c hud-c--tr"></i><i class="hud-c hud-c--bl"></i><i class="hud-c hud-c--br"></i>
          <span class="hud-frame-label" data-frame-label></span>
          <span class="hud-msg" data-msg></span>
          <span class="hud-hint" data-hint></span>
        </div>
        <div class="hud-tag hud-tag--left" data-tag-visor><i class="hud-dot"></i><i class="hud-line"></i><span class="hud-label" data-label="hud.decoder"></span></div>
        <div class="hud-tag hud-tag--right" data-tag-ear><i class="hud-dot"></i><i class="hud-line"></i><span class="hud-label" data-label="hud.audio"></span></div>
      </div>
      <p class="cam-tag" aria-hidden="true"><i></i><span data-cam-main></span></p>
      <div class="feeds" data-feeds>
        <button class="feed" type="button" data-feed="0"><span class="feed-k" data-feed-k></span><span class="feed-rec" aria-hidden="true"><i></i>REC</span><span class="feed-tc" aria-hidden="true" data-feed-tc></span><span class="feed-go" aria-hidden="true" data-feed-go></span></button>
        <button class="feed" type="button" data-feed="1"><span class="feed-k" data-feed-k></span><span class="feed-rec" aria-hidden="true"><i></i>REC</span><span class="feed-tc" aria-hidden="true" data-feed-tc></span><span class="feed-go" aria-hidden="true" data-feed-go></span></button>
      </div>
      <div class="cover-cut" aria-hidden="true"></div>
      <div class="dive" aria-hidden="true">
        <div class="dive-row"><span class="dive-k" data-dive-k></span><span class="dive-rail"><i class="dive-mark"></i></span></div>
        <span class="dive-v" data-dive-v></span>
      </div>
      <p class="cover-status" data-status role="status"></p>
      <footer class="cover-foot">
        <p class="cover-line" data-line></p>
        <nav class="cover-now" data-now></nav>
        <div class="cover-ctas">
          <button class="cover-join" type="button" data-join>
            <span class="cover-join-k"><i aria-hidden="true"></i><span data-join-k></span></span>
            <span class="cover-join-t"><span data-join-t></span>${icon('arrow')}</span>
          </button>
          <a class="cover-cta" href="#/events"><span data-cta></span>${icon('arrow')}</a>
        </div>
        <div class="cover-base">
          <p class="cover-credit" data-credit></p>
          <p class="cover-readout" aria-hidden="true">
            <span class="cover-readout-k" data-head></span>
            <span data-yaw></span>
            <span data-pitch></span>
          </p>
        </div>
      </footer>
      <div class="cover-flash" aria-hidden="true"></div>
      <div class="hud-cursor" data-cursor aria-hidden="true"><i></i><span data-cursor-xy></span></div>
    </section>
    </div>`;

  const $ = (sel) => root.querySelector(sel);
  const cover = $('.cover');
  const stage = $('[data-stage]');
  const status = $('[data-status]');
  const yaw = $('[data-yaw]');
  const pitch = $('[data-pitch]');
  const frameEl = $('[data-frame]');
  const frameLabel = $('[data-frame-label]');
  const msg = $('[data-msg]');
  const hint = $('[data-hint]');
  const tagVisor = $('[data-tag-visor]');
  const tagEar = $('[data-tag-ear]');
  const cursor = $('[data-cursor]');
  const cursorXY = $('[data-cursor-xy]');
  const lineEl = $('[data-line]');
  const track = $('[data-track]');
  const diveV = $('[data-dive-v]');
  const cleanups = [];
  const pose = { yaw: 0, pitch: 0, lens: false };
  const scroll = { target: 0, now: 0, raf: 0, leaving: false };
  const feeds = [...root.querySelectorAll('[data-feed]')];
  const cams = { main: 'front', feeds: ['side', 'xray'] };
  const CAM_NO = { front: '01', side: '02', xray: '03' };
  const camName = (id) => t('cam.label', { n: CAM_NO[id], name: t(`cam.${id}`) });

  const mastText = 'Perspectives';
  const mastCells = cells($('[data-mast]'), mastText);
  let lineCells = [];
  let stopLine = null;

  // ---------- text for the current language
  function writeLine(animate) {
    stopLine?.();
    const text = t('cover.line');
    lineCells = cells(lineEl, text);
    lockWidths(lineCells);
    if (animate && !still) stopLine = decode(lineCells, text, { step: 18, spin: 600 });
  }

  function writeLabels(animate) {
    for (const el of root.querySelectorAll('[data-label]')) {
      const text = t(el.dataset.label);
      if (animate && !still) cleanups.push(decode(cells(el, text), text, { step: 30, spin: 300 }));
      else el.textContent = text;
    }
  }

  function writeReadout() {
    yaw.textContent = `${t('cover.yaw')} ${signed(pose.yaw)}`;
    pitch.textContent = `${t('cover.pitch')} ${signed(pose.pitch)}`;
  }

  function writeNow() {
    const items = openNow();
    const nav = $('[data-now]');
    nav.hidden = !items.length;
    nav.setAttribute('aria-label', t('now.label'));
    nav.innerHTML = `<p class="cover-now-k">${esc(t('now.label'))}</p>${items
      .map((item) => `<a class="cover-now-a" href="${item.href}"><span class="cover-now-t">${esc(L(item.title))}</span>${
        item.starts ? `<span class="cover-now-d">${esc(t(item.startsKey ?? 'now.starts', { date: fmtShort(item.starts) }))}</span>` : ''
      }</a>`)
      .join('')}`;
  }

  function writeDepth() {
    diveV.textContent = `${t('cover.depth')} ${String(Math.round(scroll.now * 100)).padStart(3, '0')}%`;
  }

  // Camera labels: the main view's tag and the two feeds.
  function writeCams() {
    $('[data-cam-main]').textContent = camName(cams.main);
    feeds.forEach((el, i) => {
      const id = cams.feeds[i];
      el.querySelector('[data-feed-k]').textContent = camName(id);
      el.querySelector('[data-feed-go]').textContent = t('cam.go');
      el.setAttribute('aria-label', t('cam.switch', { name: camName(id) }));
    });
  }

  function applyText(animate) {
    $('[data-issue]').textContent = t('issue', { n: ISSUE.number });
    $('[data-dates]').textContent = fmtSpan(ISSUE.start, ISSUE.end, { year: true, short: true });
    if (cover.dataset.state === 'loading') status.textContent = t('cover.loading');
    $('[data-head]').textContent = t('cover.head');
    writeReadout();
    $('[data-cta]').textContent = t('cover.cta');
    $('[data-join-k]').textContent = t('cover.joinK');
    $('[data-join-t]').textContent = t('cover.join');
    writeNow();
    $('[data-credit]').innerHTML = t('cover.credit', {
      license: '<a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noopener noreferrer">CC BY 3.0</a>',
    });
    hint.textContent = t(coarse ? 'hud.hintTouch' : 'hud.hintFine');
    frameLabel.textContent = t(pose.lens ? 'hud.xray' : 'hud.tracking');
    $('[data-dive-k]').textContent = t('cover.dive');
    writeDepth();
    writeCams();
    writeLabels(animate && cover.classList.contains('is-live'));
    writeLine(animate);
  }

  applyText(false);
  document.fonts.load('900 100px "Exo"').catch(() => {}).then(() => {
    if (!cover.isConnected) return;
    lockWidths(mastCells);
    writeLine(true);
  });
  cleanups.push(onLang(() => applyText(true)));
  cleanups.push(() => stopLine?.());

  const mast = $('.cover-mast');
  let lastMastDecode = 0;
  mast.addEventListener('pointerenter', () => {
    if (still || cover.dataset.state === 'ready' || performance.now() - lastMastDecode < 1200) return;
    lastMastDecode = performance.now();
    cleanups.push(decode(mastCells, mastText, { step: 35, spin: 260 }));
  });
  const onResize = () => {
    lockWidths(mastCells);
    lockWidths(lineCells);
    if (cover.classList.contains('has-dive')) readScroll();
  };
  window.addEventListener('resize', onResize);
  cleanups.push(() => window.removeEventListener('resize', onResize));

  // ---------- reticle cursor (mouse and pen only)
  if (window.matchMedia('(pointer: fine)').matches) {
    cover.classList.add('has-reticle');
    const pos = { x: -100, y: -100, tx: -100, ty: -100 };
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      pos.x += (pos.tx - pos.x) * (still ? 1 : 0.35);
      pos.y += (pos.ty - pos.y) * (still ? 1 : 0.35);
      cursor.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
    };
    loop();
    const onMove = (e) => {
      pos.tx = e.clientX;
      pos.ty = e.clientY;
      const target = e.target instanceof Element ? e.target : document.elementFromPoint(e.clientX, e.clientY);
      const overUi = target?.closest('a, button, .cover-foot, .cover-bar');
      cursor.classList.toggle('is-on', Boolean(target) && !overUi && cover.contains(target));
      const r = stage.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
      const ny = 1 - ((e.clientY - r.top) / r.height) * 2;
      cursorXY.textContent = `x ${nx >= 0 ? '+' : '−'}${Math.abs(nx).toFixed(2)} y ${ny >= 0 ? '+' : '−'}${Math.abs(ny).toFixed(2)}`;
    };
    const onLeave = () => cursor.classList.remove('is-on');
    const onDown = () => {
      cursor.classList.add('is-down');
      setTimeout(() => cursor.classList.remove('is-down'), 160);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    window.addEventListener('pointerdown', onDown);
    cleanups.push(() => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('pointerdown', onDown);
    });
  }

  // ---------- HUD
  const PAD = 18;
  function place(h) {
    frameEl.style.transform = `translate(${h.box.x - PAD}px, ${h.box.y - PAD}px)`;
    frameEl.style.width = `${h.box.w + PAD * 2}px`;
    frameEl.style.height = `${h.box.h + PAD * 2}px`;
    tagVisor.style.transform = `translate(${h.visor.x}px, ${h.visor.y}px)`;
    tagEar.style.transform = `translate(${h.ear.x}px, ${h.ear.y}px)`;
    if (h.lens !== pose.lens) {
      pose.lens = h.lens;
      frameLabel.textContent = t(h.lens ? 'hud.xray' : 'hud.tracking');
    }
    cover.classList.toggle('is-xray', h.lens);
  }

  let msgTimer = 0;
  let hintHidden = false;
  function onIntro(kind) {
    if (kind === 'ready') {
      cover.classList.add('is-live');
      writeLabels(true);
    }
    if (kind === 'pulse') {
      if (!hintHidden) {
        hintHidden = true;
        hint.classList.add('is-gone');
      }
      cover.classList.remove('is-pulse');
      void cover.offsetWidth; // restart the flash
      cover.classList.add('is-pulse');
      const text = t('hud.scan');
      msg.classList.add('is-on');
      if (!still) cleanups.push(decode(cells(msg, text), text, { step: 28, spin: 240 }));
      else msg.textContent = text;
      clearTimeout(msgTimer);
      msgTimer = setTimeout(() => msg.classList.remove('is-on'), 2200);
    }
  }
  cleanups.push(() => clearTimeout(msgTimer));

  // ---------- scroll in: the camera flies into the visor, the light fills the
  // screen, and the events page comes out of it. The link below stays for
  // anyone who does not scroll.
  let scene = null;
  function readScroll() {
    const max = track.offsetHeight - window.innerHeight;
    scroll.target = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    if (!scroll.raf) scroll.raf = requestAnimationFrame(diveStep);
  }
  function diveStep() {
    scroll.raf = 0;
    scroll.now += (scroll.target - scroll.now) * 0.14;
    if (Math.abs(scroll.target - scroll.now) < 0.0005) scroll.now = scroll.target;
    scene?.setDive(scroll.now);
    cover.style.setProperty('--dive', scroll.now.toFixed(4));
    cover.classList.toggle('is-diving', scroll.now > 0.01);
    writeDepth();
    if (scroll.now > 0.985 && !scroll.leaving) {
      scroll.leaving = true;
      document.documentElement.dataset.vtNext = 'light';
      location.hash = '#/events';
      return;
    }
    if (scroll.now !== scroll.target) scroll.raf = requestAnimationFrame(diveStep);
  }
  function enableDive() {
    track.classList.add('has-dive');
    cover.classList.add('has-dive');
    window.addEventListener('scroll', readScroll, { passive: true });
    readScroll();
  }
  cleanups.push(() => {
    window.removeEventListener('scroll', readScroll);
    cancelAnimationFrame(scroll.raf);
  });

  // ---------- cameras: two live feeds; clicking one cuts the main view to it
  const cutFlash = $('.cover-cut');
  function onCamera(next) {
    const changed = next.main !== cams.main;
    cams.main = next.main;
    cams.feeds = next.feeds;
    writeCams();
    if (changed && !still) {
      cutFlash.classList.remove('is-on');
      void cutFlash.offsetWidth; // restart the flash
      cutFlash.classList.add('is-on');
    }
  }
  const onFeed = (e) => {
    const feed = e.target.closest('[data-feed]');
    if (feed) scene?.cut(Number(feed.dataset.feed));
  };
  $('[data-feeds]').addEventListener('click', onFeed);
  $('[data-join]').addEventListener('click', () => openJoin());
  // Running timecode on the feeds, like a camera monitor.
  const started = performance.now();
  const tc = [...root.querySelectorAll('[data-feed-tc]')];
  const clockTimer = setInterval(() => {
    const ms = performance.now() - started;
    const p = (n) => String(Math.floor(n)).padStart(2, '0');
    const text = `${p(ms / 3600000)}:${p((ms / 60000) % 60)}:${p((ms / 1000) % 60)}:${p(((ms % 1000) / 1000) * 25)}`;
    for (const el of tc) el.textContent = text;
  }, 80);
  cleanups.push(() => clearInterval(clockTimer));

  // ---------- 3D
  let dispose = null;
  let alive = true;
  import('../cover3d.js')
    .then(({ mountCover }) =>
      mountCover(stage, {
        reduced: still,
        mastEl: $('[data-mast]'),
        mastText,
        pipEls: feeds,
        onCamera,
        onProgress: (p) => {
          status.textContent = t('cover.loadingPct', { p: Math.round(p * 100) });
        },
        onPose: (p) => {
          pose.yaw = p.yaw;
          pose.pitch = p.pitch;
          writeReadout();
        },
        onFrame: place,
        onIntro,
      }),
    )
    .then((mounted) => {
      if (!alive) {
        mounted.dispose();
        return;
      }
      scene = mounted;
      dispose = mounted.dispose;
      cover.dataset.state = 'ready';
      status.textContent = '';
      if (!still) enableDive();
    })
    .catch((err) => {
      console.warn('Cover 3D unavailable:', err);
      if (!alive) return;
      cover.dataset.state = 'fallback';
      status.textContent = '';
      $('[data-feeds]').hidden = true;
    });

  return () => {
    alive = false;
    for (const fn of cleanups) fn();
    dispose?.();
  };
}
