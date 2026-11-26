// Spirit Week: scroll is the play button. Four Paris 2024 athletes, four
// sports, four house colours. Each athlete is a frame sequence cut out of real
// footage (img/spirit/<id>/NN.webp) and the scroll position is the playhead:
// they stay frozen until the page moves, then throw, lunge, flip and shoot
// exactly as fast as it moves. The hero pins for a screen and a half while all
// four play; below it, each day's lane plays its athlete as it crosses the
// screen. Every fact comes from SPIRIT in data.js, which cites its sources.

import { SPIRIT } from '../data.js';
import { L, t } from '../i18n.js';
import { esc, fmtLong, fmtRange, reducedMotion } from '../util.js';
import { topbar } from './chrome.js';

export const theme = 'spirit';
export const titleKey = 'title.spirit';

const IMG = '/img/spirit/';
const frameSrc = (id, i) => `${IMG}${id}/${String(i).padStart(2, '0')}.webp`;
const clamp01 = (v) => Math.min(1, Math.max(0, v));

// A canvas the size of the athlete's frames; CSS scales it. --ax is where the
// athlete's body sits across the frame (0 to 1), so layout can centre the
// person rather than the box.
function stage(id, where) {
  const a = SPIRIT.athletes[id];
  return `<canvas class="sp-ath sp-ath--${where} sp-ath--${id}" data-ath="${id}" width="${a.w}" height="${a.h}" style="--ax:${a.ax ?? 0.5}" aria-hidden="true"></canvas>`;
}

function lane(d) {
  const a = SPIRIT.athletes[d.athlete];
  const cut = d.lane ?? d.athlete;
  return `<li class="sp-lane sp-lane--${d.house}" data-lane>
    <p class="sp-day"><time datetime="${d.date}">${esc(fmtLong(d.date))}</time></p>
    <h3 class="sp-game">${esc(L(d.game))}</h3>
    <div class="sp-lane-art sp-lane-art--${cut}" style="--ax:${SPIRIT.athletes[cut].ax ?? 0.5}">${stage(cut, 'lane')}</div>
    <p class="sp-cap">${esc(a.name)}, ${esc(L(a.sport))}</p>
  </li>`;
}

function credits() {
  const link = (href, text) => `<a href="${href}" target="_blank" rel="noopener noreferrer">${esc(text)}</a>`;
  const items = SPIRIT.days.map(({ athlete }) => {
    const a = SPIRIT.athletes[athlete];
    return t('sp.creditItem', { name: esc(a.name), sport: esc(L(a.sport)), video: link(a.page, a.video), author: esc(a.author), license: link(a.licenseUrl, a.license) });
  });
  return t('sp.credits', { items: items.join(t('sp.creditSep')) });
}

// Frames load coarse to fine, round robin across athletes: first and peak
// frames, then every 8th, 4th, 2nd, then the rest. Until a frame arrives, the
// nearest loaded one stands in, so scrubbing works from the first second.
function sequences(onFrame) {
  const seqs = {};
  for (const id of Object.keys(SPIRIT.athletes)) {
    const a = SPIRIT.athletes[id];
    const order = [];
    const seen = new Set();
    const add = (i) => { if (i >= 0 && i < a.frames && !seen.has(i)) { seen.add(i); order.push(i); } };
    add(0);
    add(a.peak);
    for (const step of [8, 4, 2, 1]) for (let i = 0; i < a.frames; i += step) add(i);
    seqs[id] = { id, a, frames: new Array(a.frames).fill(null), order };
  }
  const queue = [];
  const ids = Object.keys(seqs);
  for (let k = 0; ids.some((id) => k < seqs[id].order.length); k += 1) {
    for (const id of ids) if (k < seqs[id].order.length) queue.push([id, seqs[id].order[k]]);
  }
  let stopped = false;
  let next = 0;
  const pump = () => {
    if (stopped || next >= queue.length) return;
    const [id, i] = queue[next];
    next += 1;
    const img = new Image();
    img.src = frameSrc(id, i);
    img.decode()
      .then(() => { if (!stopped) { seqs[id].frames[i] = img; onFrame(); } })
      .catch(() => {})
      .finally(pump);
  };
  for (let n = 0; n < 6; n += 1) pump();
  return { seqs, stop: () => { stopped = true; } };
}

function nearest(seq, i) {
  const { frames } = seq;
  for (let d = 0; d < frames.length; d += 1) {
    if (frames[i - d]) return frames[i - d];
    if (frames[i + d]) return frames[i + d];
  }
  return null;
}

export function render(root) {
  const days = SPIRIT.days;
  root.innerHTML = `
    <div class="sp">
      <section class="sp-hero" aria-labelledby="sp-title" data-hero>
        <div class="sp-stage">
          ${topbar({ links: [['#/events', t('nav.whatson')]] })}
          <div class="sp-slabs" aria-hidden="true">${days.map((d) => `<i class="sp-slab sp-slab--${d.house}"></i>`).join('')}</div>
          <div class="sp-cast">${days.map((d) => `<div class="sp-cast-slot sp-cast-slot--${d.athlete}">${stage(d.athlete, 'hero')}</div>`).join('')}</div>
          <div class="sp-hero-copy">
            <h1 class="sp-title" id="sp-title" lang="en"><span>Spirit</span><span>Week</span></h1>
            <p class="sp-lead">${esc(t('sp.lead'))}</p>
            <dl class="sp-facts">
              <div><dt>${t('fact.when')}</dt><dd>${esc(fmtRange(SPIRIT.start, SPIRIT.end))}<br>${esc(t('sp.time'))}</dd></div>
              <div><dt>${t('fact.where')}</dt><dd>${esc(t('sp.place'))}</dd></div>
            </dl>
          </div>
          <div class="sp-scrub" aria-hidden="true"><i data-scrub></i></div>
        </div>
      </section>

      <section class="sp-week" aria-labelledby="sp-week-title">
        <header class="sp-week-head">
          <h2 class="sp-h2" id="sp-week-title">${esc(t('sp.weekTitle'))}</h2>
          <p class="sp-week-sub">${esc(t('sp.weekSub'))}</p>
        </header>
        <ol class="sp-lanes">${days.map(lane).join('')}</ol>
      </section>

      <section class="sp-house" aria-labelledby="sp-support">
        <h2 class="sp-support" id="sp-support">${esc(t('sp.support'))}</h2>
        <ul class="sp-notes">
          <li class="sp-note--yellow">${esc(t('sp.banner'))}</li>
          <li class="sp-note--blue">${esc(t('sp.chants'))}</li>
          <li class="sp-note--red">${esc(t('sp.outfits'))}</li>
          <li class="sp-note--green">${esc(t('sp.shirt'))}</li>
        </ul>
      </section>

      <section class="sp-next" aria-labelledby="sp-next-line">
        <h2 class="sp-next-line" id="sp-next-line">${esc(t('sp.next', { date: '\u0000' })).replace('\u0000', `<span class="sp-nowrap">${esc(fmtLong(SPIRIT.sportsDay))}</span>`)}</h2>
        <a class="sp-btn" href="#/events">${esc(t('sp.nextCta'))}</a>
      </section>

      <p class="sp-credits">${credits()}</p>
    </div>`;

  const hero = root.querySelector('[data-hero]');
  const scrub = root.querySelector('[data-scrub]');
  const lanes = [...root.querySelectorAll('[data-lane]')];
  const still = reducedMotion();

  // Each canvas knows where its playhead comes from.
  const players = [...root.querySelectorAll('[data-ath]')].map((canvas) => ({
    canvas,
    ctx: canvas.getContext('2d'),
    id: canvas.dataset.ath,
    lane: canvas.closest('[data-lane]'),
    shown: null,
  }));

  let raf = 0;
  const schedule = () => { if (!raf) raf = requestAnimationFrame(draw); };
  const { seqs, stop } = sequences(schedule);

  function heroProgress() {
    const r = hero.getBoundingClientRect();
    const run = r.height - window.innerHeight;
    return run > 0 ? clamp01(-r.top / run) : 0;
  }
  // A lane plays while it crosses the middle of the screen.
  function laneProgress(el) {
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    if (r.bottom < -vh * 0.5 || r.top > vh * 1.5) return null;
    return clamp01(((vh - r.top) / (vh + r.height) - 0.12) / 0.7);
  }

  function draw() {
    raf = 0;
    const hp = still ? null : heroProgress();
    if (scrub) scrub.style.setProperty('--p', (hp ?? 1).toFixed(4));
    const laneP = new Map(lanes.map((el) => [el, still ? null : laneProgress(el)]));
    for (const p of players) {
      const seq = seqs[p.id];
      let i;
      if (still) i = seq.a.peak;
      else {
        const prog = p.lane ? laneP.get(p.lane) : hp;
        if (prog === null) continue;
        const last = p.lane ? seq.a.frames - 1 : (seq.a.heroTo ?? seq.a.frames - 1);
        i = Math.round(prog * last);
      }
      const img = nearest(seq, i);
      if (!img || img === p.shown) continue;
      p.ctx.clearRect(0, 0, p.canvas.width, p.canvas.height);
      p.ctx.drawImage(img, 0, 0, p.canvas.width, p.canvas.height);
      p.shown = img;
    }
  }

  // The slabs start under the top bar, which wraps to two rows on phones.
  const stageEl = root.querySelector('.sp-stage');
  const bar = stageEl.querySelector('.bar');
  const fit = () => {
    if (bar) stageEl.style.setProperty('--bar-h', `${bar.offsetHeight}px`);
    schedule();
  };

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', fit);
  fit();
  requestAnimationFrame(() => hero.classList.add('is-in'));

  return () => {
    stop();
    cancelAnimationFrame(raf);
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', fit);
  };
}
