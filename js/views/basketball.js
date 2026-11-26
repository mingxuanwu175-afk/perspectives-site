// Think Pink Basketball: playoff bracket. Pick a team to sign up.

import { GAMES, GAME_DAYS, QFS, STAR_PHOTOS, TEAMS, TEAM_SIZE, TOURNAMENT } from '../data.js';
import { openDialog } from '../dialog.js';
import { court, figure } from '../figures.js';
import { L, t } from '../i18n.js';
import { emblem, icon } from '../icons.js';
import * as store from '../store.js';
import { esc, fmtLong, fmtShort, fmtSpan, pips, reducedMotion } from '../util.js';
import { topbar } from './chrome.js';
import { openSignup } from './signup.js';

export const theme = 'arena';
export const titleKey = 'title.bb';

// Once sign-ups close, a team shows its result (data.js GAMES winner and
// score) instead of how many have signed up.
function teamButton(id, side, g) {
  const team = TEAMS[id];
  const done = signupsClosed();
  const won = g?.winner === id;
  const lost = Boolean(g?.winner) && !won;
  const score = done && g?.score ? g.score[g.teams.indexOf(id)] : null;
  const right = done
    ? `<span class="team-result">${score != null ? `<b>${score}</b>` : ''}${won ? `<span class="team-won">${t('bb.won')}</span>` : ''}</span>`
    : `<span class="team-fill" data-fill>${fill(id)}</span>`;
  return `<button class="team team--${side}${done && won ? ' team--won' : ''}${done && lost ? ' team--lost' : ''}" type="button" data-team="${id}">
    <span class="team-label">${team.label}</span>
    <span class="team-sub">${esc(L(team.sub))}</span>
    ${right}
  </button>`;
}

function fill(id) {
  const l = store.lineup(id);
  return `${pips(l.count)}<span class="team-count"><b>${l.count}</b>/${TEAM_SIZE}</span>`;
}

function teamAria(id) {
  const team = TEAMS[id];
  const l = store.lineup(id);
  const state = l.open > 0 ? t('bb.stateCount', { n: l.count, size: TEAM_SIZE }) : t('bb.stateFull');
  return t('bb.teamAria', { team: team.label, sub: L(team.sub), state });
}

function match(gid) {
  const g = GAMES[gid];
  const row = g.teams
    ? `${teamButton(g.teams[0], 'l', g)}<span class="vs">v</span>${teamButton(g.teams[1], 'r', g)}`
    : `<div class="slot slot--tbc"><b class="slot-v">${t('bb.tbc')}</b></div>`;
  return `<div class="match" data-game="${gid}">
    <p class="match-head"><span>${esc(L(g.name))}</span><span class="match-day">${esc(fmtShort(g.date))}</span></p>
    <div class="match-row">${row}</div>
  </div>`;
}

// No semi-finals: the quarter-final winners are ranked by the points they
// scored, and the top two play the final. So the bracket reads left to
// right in three steps: games, points table, final.
const stage = (n, cls, title, sub) =>
  `<header class="stage-h stage-h--${cls}"><span class="stage-n">${n}</span><span class="stage-t">${esc(title)}</span><span class="stage-d">${esc(sub)}</span></header>`;

// The winners so far and their points. They are ranked only once every
// quarter-final has a winner and a score; until then they are listed in the
// order of the games and there is no cut line.
function tableRows() {
  const rows = QFS.map((id) => {
    const g = GAMES[id];
    if (!g.winner) return { team: null, pts: null };
    return { team: g.winner, pts: g.score ? g.score[g.teams.indexOf(g.winner)] : null };
  });
  const ranked = rows.every((r) => r.team && r.pts != null);
  if (ranked) rows.sort((a, b) => b.pts - a.pts);
  return { rows, ranked };
}

const tableRow = (r, n, ranked) =>
  `<li class="row${r.team ? '' : ' row--tbd'}"><span class="row-n">${ranked ? n : '·'}</span><span class="row-team">${r.team ? esc(TEAMS[r.team].label) : t('bb.tbd')}</span><span class="row-pts">${t('bb.pts', { n: r.pts ?? '–' })}</span></li>`;

const finalist = (n) =>
  `<div class="slot slot--finalist"><span class="slot-k">${t('bb.table')}</span><b class="slot-v">${t(n === 1 ? 'bb.rank1' : 'bb.rank2')}</b></div>`;

function bracket() {
  const { rows, ranked } = tableRows();
  const table = ranked
    ? `<ol class="rows rows--in">${rows.slice(0, 2).map((r, i) => tableRow(r, i + 1, true)).join('')}</ol>
      <p class="cut">${t('bb.cut')}</p>
      <ol class="rows rows--out" start="3">${rows.slice(2).map((r, i) => tableRow(r, i + 3, true)).join('')}</ol>`
    : `<ol class="rows rows--wait">${rows.map((r) => tableRow(r, 0, false)).join('')}</ol>
      <p class="cut">${t('bb.tableWait')}</p>`;
  return `
    ${stage(1, 'qf', t('bb.round.qf'), fmtSpan(GAMES[QFS[0]].date, GAMES[QFS[QFS.length - 1]].date))}
    ${stage(2, 'pts', t('bb.table'), t('bb.tableSub'))}
    ${stage(3, 'final', t('bb.round.final'), fmtLong(GAMES.final.date))}
    <div class="col col--qf">${QFS.map(match).join('')}</div>
    <div class="col col--pts">
      ${table}
    </div>
    <div class="col col--final">
      <div class="match match--final" data-game="final">
        <div class="match-row">${finalist(1)}<span class="vs">v</span>${finalist(2)}</div>
      </div>
      <div class="final-top">
        <div class="ball3d" data-ball>${emblem('bb')}</div>
        <div class="slot slot--champion" data-slot="final"><b class="slot-v">${t('bb.champion')}</b></div>
      </div>
    </div>`;
}

function officialsSummary() {
  return store
    .officialsByRole()
    .map((r) => `<li><b>${r.filled}</b><span>/${r.need}</span> ${esc(L(r.need > 1 ? r.words : r.word))}</li>`)
    .join('');
}

// ---------- backdrop ----------

function backdrop() {
  if (!STAR_PHOTOS.length) return `${figure('drive')}${figure('rise')}${figure('ball')}`;
  return STAR_PHOTOS.map(
    (p) => `<figure class="star star--${p.slot}"><img src="${p.src}" alt="" decoding="async" style="object-position:${p.focus};${p.zoom ? `transform:scale(${p.zoom});transform-origin:${p.focus}` : ''}"></figure>`,
  ).join('');
}

function photoCredits() {
  if (!STAR_PHOTOS.length) return '';
  const link = (href, text) => `<a href="${href}" target="_blank" rel="noopener noreferrer">${esc(text)}</a>`;
  const items = STAR_PHOTOS.map((p) => t('bb.creditItem', {
    name: link(p.page, L(p.name)),
    author: esc(p.author),
    license: link(p.licenseUrl, L(p.license)),
  }));
  return `<p class="bb-credits">${t('bb.credits', { items: items.join('; ') })}</p>`;
}

// ---------- wires ----------

function drawWires(root, animate) {
  const board = root.querySelector('.bracket');
  const svg = board.querySelector('.wires');
  const wide = window.matchMedia('(min-width: 1000px)').matches;
  if (!wide) {
    svg.innerHTML = '';
    return;
  }
  const b = board.getBoundingClientRect();
  svg.setAttribute('viewBox', `0 0 ${b.width} ${b.height}`);
  const box = (el) => {
    const r = el.getBoundingClientRect();
    return { l: r.left - b.left, r: r.right - b.left, y: r.top - b.top + r.height / 2 };
  };
  const paths = [];
  // Several boxes merge into one: each runs right to a shared trunk, and the
  // trunk runs on into the target at its middle.
  const merge = (froms, target, tier) => {
    if (!froms.length || !target) return;
    const T = box(target);
    const F = froms.map(box);
    const trunk = (Math.max(...F.map((f) => f.r)) + T.l) / 2;
    for (const f of F) paths.push({ d: `M${f.r} ${f.y}H${trunk}V${T.y}`, tier });
    paths.push({ d: `M${trunk} ${T.y}H${T.l}`, tier: tier + 0.5 });
  };
  merge([...root.querySelectorAll('.col--qf .match-row')], root.querySelector('.col--pts'), 0);
  merge([...root.querySelectorAll('.rows--in .row')], root.querySelector('.match--final .match-row'), 1);
  svg.innerHTML = paths
    .map((p) => `<path class="wire wire--t${Math.floor(p.tier)}" d="${p.d}" data-tier="${p.tier}"/>`)
    .join('');

  if (!animate) return;
  for (const el of svg.querySelectorAll('path')) {
    const len = el.getTotalLength();
    const tier = Number(el.dataset.tier);
    el.style.strokeDasharray = `${len}`;
    el.style.strokeDashoffset = `${len}`;
    el.style.transition = `stroke-dashoffset ${tier % 1 ? 0.28 : 0.42}s cubic-bezier(.5,0,.2,1) ${0.25 + tier * 0.62}s`;
  }
  svg.getBoundingClientRect();
  requestAnimationFrame(() => {
    for (const el of svg.querySelectorAll('path')) el.style.strokeDashoffset = '0';
  });
}

// ---------- schedule ----------

function gameTeams(g) {
  if (g.teams) return g.teams.map((id) => TEAMS[id].label).join(' v ');
  return g.from ? t('sched.topTwo') : t('bb.tbc');
}

// What the schedule shows in the score column.
function scoreCell(g) {
  if (g.score) return `${g.score[0]} : ${g.score[1]}`;
  if (g.winner) return esc(t('bb.wonBy', { team: TEAMS[g.winner].label }));
  return `<span class="sr-only">${t(signupsClosed() && !g.from ? 'bb.tbc' : 'sched.noScore')}</span><span aria-hidden="true">– : –</span>`;
}

function openSchedule() {
  const byDay = new Map();
  for (const [id, g] of Object.entries(GAMES)) {
    if (!byDay.has(g.date)) byDay.set(g.date, []);
    byDay.get(g.date).push({ id, ...g });
  }
  const days = [...byDay.entries()]
    .map(
      ([date, games]) => `<li class="sched-day">
        <h3 class="sched-date">${fmtLong(date)}</h3>
        <ul class="sched-games">${games
          .map(
            (g) => `<li class="sched-game${g.id === 'final' ? ' sched-game--final' : ''}">
              <span class="sched-name">${esc(L(g.name))}</span>
              <span class="sched-teams">${esc(gameTeams(g))}</span>
              <span class="sched-score">${scoreCell(g)}</span>
            </li>`,
          )
          .join('')}</ul>
      </li>`,
    )
    .join('');
  openDialog({
    theme: 'arena',
    wide: true,
    html: `
      <h2 class="dlg-title" id="dlg-title">${t('sched.title')}</h2>
      <p class="dlg-lead">${esc(t('sched.lead', { where: L(TOURNAMENT.where), finalWhere: L(TOURNAMENT.finalWhere), finalFormat: L(TOURNAMENT.finalFormat) }))}</p>
      <ol class="sched">${days}</ol>
      <p class="dlg-note">${esc(signupsClosed() ? t('sched.notePast') : t('sched.note', { date: fmtLong(TOURNAMENT.firstGame) }))}</p>`,
  });
}

function openClosed() {
  openDialog({
    theme: 'arena',
    html: `
      <h2 class="dlg-title" id="dlg-title">${t('bb.closedTitle')}</h2>
      <p class="dlg-lead">${esc(t('bb.hintClosed', { date: fmtLong(GAMES.final.date), where: L(TOURNAMENT.finalWhere) }))}</p>`,
  });
}

// ---------- scoreboard: countdown to the first game ----------

const SGT_DAY = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Singapore', year: 'numeric', month: '2-digit', day: '2-digit' });
// Sign-ups close after the last quarter-final (data.js TOURNAMENT.signupUntil).
const signupsClosed = () => SGT_DAY.format(Date.now()) > TOURNAMENT.signupUntil;
const pad = (n) => String(n).padStart(2, '0');
// One fixed-width cell per character, with an unlit "8" behind it.
const ledCells = (text) => [...text].map((c) => `<i>${esc(c)}</i>`).join('');
const firstGame = () => gameTeams(GAMES[QFS[0]]);

function boardState(now) {
  const tip = Date.parse(TOURNAMENT.tipOff);
  if (now < tip) {
    const s = Math.floor((tip - now) / 1000);
    return { kind: 'count', vals: [pad(Math.floor(s / 86400)), pad(Math.floor(s / 3600) % 24), pad(Math.floor(s / 60) % 60), pad(s % 60)], days: Math.floor(s / 86400) };
  }
  const today = SGT_DAY.format(now);
  const day = GAME_DAYS.indexOf(today);
  if (day >= 0) return { kind: 'live', day: day + 1, today };
  const next = GAME_DAYS.find((d) => d > today);
  if (!next) return { kind: 'over' };
  // A day with no game in the middle of the tournament (Friday 23 to Monday
  // 26 October, before the final): count whole days to the next game day. No
  // time of day is shown, because the final's start time is not set yet.
  const days = Math.round((Date.parse(`${next}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000);
  return { kind: 'rest', days, date: next, game: Object.values(GAMES).find((g) => g.date === next) };
}

function boardView(st) {
  if (st.kind === 'count') {
    const units = ['bb.unitD', 'bb.unitH', 'bb.unitM', 'bb.unitS'];
    return {
      k: t('bb.countLabel'),
      led: st.vals
        .map((v, i) => `${i ? '<span class="led-colon">:</span>' : ''}<span class="led-g"><span class="led" data-led>${ledCells(v)}</span><span class="led-u">${t(units[i])}</span></span>`)
        .join(''),
      sub: t('bb.firstGame', { teams: firstGame() }),
      sr: t('bb.countSr', { n: st.days, teams: firstGame() }),
    };
  }
  if (st.kind === 'live') {
    const games = Object.values(GAMES).filter((g) => g.date === st.today).map(gameTeams).join(t('sep'));
    const sub = games ? t('bb.liveGames', { games }) : '';
    return {
      k: t('bb.liveLabel'),
      led: `<span class="led-g"><span class="led">${ledCells(`${st.day}/${GAME_DAYS.length}`)}</span></span>`,
      sub,
      sr: `${t('bb.liveLabel')} ${st.day}/${GAME_DAYS.length}. ${sub}`,
    };
  }
  if (st.kind === 'rest') {
    const game = L(st.game.name);
    return {
      k: t('bb.restLabel', { game }),
      led: `<span class="led-g"><span class="led">${ledCells(pad(st.days))}</span><span class="led-u">${t('bb.unitD')}</span></span>`,
      sub: fmtLong(st.date),
      sr: t('bb.restSr', { n: st.days, game, date: fmtLong(st.date) }),
    };
  }
  return { k: t('bb.overLabel'), led: `<span class="led-g"><span class="led">${ledCells('FT')}</span></span>`, sub: t('bb.overNote'), sr: t('bb.overLabel') };
}

function mountBoard(el) {
  let kind = '';
  let shown = '';
  const tick = () => {
    const st = boardState(Date.now());
    const view = boardView(st);
    // Redraw when the state changes, and when a game day or a rest day turns
    // over at midnight; the countdown updates its digits in place instead.
    const key = st.kind === 'count' ? 'count' : `${st.kind}:${st.day ?? ''}:${st.days ?? ''}`;
    if (key !== shown) {
      shown = key;
      kind = st.kind;
      el.dataset.kind = kind;
      el.innerHTML = `<p class="board-k">${esc(view.k)}</p>
        <div class="board-led" aria-hidden="true">${view.led}</div>
        <p class="board-sub">${esc(view.sub)}</p>
        <p class="sr-only" data-board-sr>${esc(view.sr)}</p>`;
      return;
    }
    if (kind !== 'count') return;
    // Digits that change roll over like a drum: the old one tips away, the new one rises in.
    el.querySelectorAll('[data-led]').forEach((led, i) => {
      const next = [...st.vals[i]];
      const cells = [...led.children];
      if (cells.length !== next.length) {
        led.innerHTML = ledCells(st.vals[i]);
        return;
      }
      cells.forEach((cell, j) => {
        const was = cell.dataset.v ?? cell.textContent;
        if (was === next[j]) return;
        cell.dataset.v = next[j];
        cell.classList.remove('is-roll');
        cell.innerHTML = `<b class="led-old">${esc(was)}</b><b class="led-new">${esc(next[j])}</b>`;
        void cell.offsetWidth; // restart the roll
        cell.classList.add('is-roll');
      });
    });
    const sr = el.querySelector('[data-board-sr]');
    if (sr.textContent !== view.sr) sr.textContent = view.sr;
  };
  tick();
  const timer = setInterval(tick, 1000);
  return () => clearInterval(timer);
}

// ---------- ticker: live sign-up progress along the bottom ----------

function tickerItems() {
  const teams = Object.values(GAMES).flatMap((g) => g.teams ?? []);
  const items = teams.map((id) => {
    const l = store.lineup(id);
    const full = l.open === 0;
    return `<li class="tk${full ? ' tk--full' : ''}"><b>${TEAMS[id].label}</b><span class="tk-n">${l.count}/${TEAM_SIZE}</span><span class="tk-s">${esc(full ? t('ad.full') : t('ad.needs', { n: l.open }))}</span></li>`;
  });
  for (const r of store.officialsByRole()) {
    const full = r.filled >= r.need;
    items.push(`<li class="tk${full ? ' tk--full' : ''}"><b>${esc(L(r.need > 1 ? r.plural : r.name))}</b><span class="tk-n">${r.filled}/${r.need}</span></li>`);
  }
  return items.join('');
}

// Two copies side by side scroll by one copy's width, so the loop is seamless.
function paintTicker(root, still) {
  const track = root.querySelector('[data-ticker]');
  if (!track) return;
  const items = tickerItems();
  track.innerHTML = `<ul class="tk-list">${items}</ul>${still ? '' : `<ul class="tk-list" aria-hidden="true">${items}</ul>`}`;
  if (!still) track.style.setProperty('--tick-dur', `${Math.max(20, track.firstElementChild.offsetWidth / 60).toFixed(1)}s`);
}

// ---------- page ----------

export function render(root) {
  const closed = signupsClosed();
  root.innerHTML = `
    <div class="arena">
      <div class="arena-bg" aria-hidden="true">
        <div class="beam beam--a"></div>
        <div class="beam beam--b"></div>
        <div class="floor">${court()}</div>
        <div class="players${STAR_PHOTOS.length ? ' players--photos' : ''}">${backdrop()}</div>
        <div class="arena-fade"></div>
      </div>
      ${topbar({
        links: [['#/events', t('nav.whatson')]],
        right: `<button class="btn-schedule" type="button" data-schedule>${icon('calendar')}<span>${t('bb.schedule')}</span></button>`,
      })}
      <header class="bb-head">
        <div class="bb-titles">
          <h1 class="bb-title">${t('bb.titleHtml')}</h1>
          <a class="bb-by" href="#/">${t('bb.madeBy', { name: '<b>Perspectives</b>' })}</a>
        </div>
        <div class="bb-side">
          <div class="board" data-board></div>
          <p class="bb-when">${esc(t('bb.whenLine', { range: fmtSpan(GAMES[QFS[0]].date, GAMES[QFS[QFS.length - 1]].date) }))}<br>${esc(L(TOURNAMENT.where))}<br>${esc(L(TOURNAMENT.format))}<br>${esc(t('bb.finalLine', { date: fmtLong(GAMES.final.date), where: L(TOURNAMENT.finalWhere), format: L(TOURNAMENT.finalFormat) }))}</p>
        </div>
      </header>
      <section class="bracket" aria-label="${esc(t('bb.bracketLabel'))}">
        <svg class="wires" aria-hidden="true" focusable="false"></svg>
        ${bracket()}
      </section>
      <p class="bb-hint">${closed ? esc(t('bb.hintClosed', { date: fmtLong(GAMES.final.date), where: L(TOURNAMENT.finalWhere) })) : t('bb.hint')}</p>
    </div>
    <div class="bb-more">
      <section class="bb-col">
        <h2 class="bb-h2">${t('bb.about')}</h2>
        <p class="bb-lead">${esc(L(TOURNAMENT.lead))}</p>
        <dl class="facts facts--arena">${TOURNAMENT.facts.map(([k, v]) => `<dt>${t(k)}</dt><dd>${esc(L(v))}</dd>`).join('')}</dl>
      </section>
      ${closed ? '' : `<section class="bb-col">
        <h2 class="bb-h2">${t('bb.howTitle')}</h2>
        <p>${esc(t('bb.how1'))}</p>
        <p>${esc(t('bb.how2'))}</p>
        <p>${esc(t('bb.how3'))}</p>
      </section>`}
      <section class="bb-col bb-col--off">
        <h2 class="bb-h2">${t('bb.offTitle')}</h2>
        <p>${esc(t('bb.offText'))}</p>
        <ul class="off-mini" data-off>${officialsSummary()}</ul>
        <a class="btn btn--ghost" href="#/officials">${icon('whistle')}${t('bb.offCta')}</a>
      </section>
      ${photoCredits()}
    </div>
    ${closed ? '' : `<div class="ticker" role="region" aria-label="${esc(t('bb.tickerLabel'))}">
      <p class="ticker-k"><i class="ticker-dot" aria-hidden="true"></i>${t('bb.tickerLabel')}</p>
      <div class="ticker-view"><div class="ticker-track" data-ticker></div></div>
    </div>`}`;

  const still = reducedMotion();
  let alive = true;

  // Reflect sign-ups in the bracket and the ticker as they happen.
  const refresh = () => {
    if (!closed) {
      for (const el of root.querySelectorAll('.team')) {
        el.querySelector('[data-fill]').innerHTML = fill(el.dataset.team);
        el.setAttribute('aria-label', teamAria(el.dataset.team));
      }
    }
    root.querySelector('[data-off]').innerHTML = officialsSummary();
    paintTicker(root, still);
  };
  refresh();
  const unsubscribe = store.subscribe(refresh);
  const stopBoard = mountBoard(root.querySelector('[data-board]'));

  // The final's ball in 3D once three.js has loaded; the drawing stays until then.
  let disposeBall = null;
  const ballHost = root.querySelector('[data-ball]');
  import('../ball3d.js')
    .then(({ mountBall }) => {
      if (!alive) return;
      disposeBall = mountBall(ballHost, { reduced: still });
      ballHost.classList.add('is-ready');
    })
    .catch((err) => console.warn('3D ball unavailable:', err));

  const onClick = (e) => {
    const team = e.target.closest('[data-team]');
    if (team) {
      if (signupsClosed()) openClosed();
      else openSignup(team.dataset.team);
    }
    else if (e.target.closest('[data-schedule]')) openSchedule();
  };
  root.addEventListener('click', onClick);

  // Pointer parallax on the players.
  const players = root.querySelector('.players');
  const onMove = (e) => {
    const x = e.clientX / window.innerWidth - 0.5;
    const y = e.clientY / window.innerHeight - 0.5;
    players.style.setProperty('--px', x.toFixed(3));
    players.style.setProperty('--py', y.toFixed(3));
  };
  if (!still) window.addEventListener('pointermove', onMove, { passive: true });

  // Wires: draw in once, then redraw on resize.
  const board = root.querySelector('.bracket');
  let drawn = false;
  const ro = new ResizeObserver(() => {
    drawWires(root, !drawn && !still);
    if (!drawn) {
      drawn = true;
      root.querySelector('.arena').classList.add('is-in');
    }
  });
  document.fonts.ready.then(() => {
    if (!alive) return;
    ro.observe(board);
    paintTicker(root, still); // widths change once the fonts are in
  });

  return () => {
    alive = false;
    unsubscribe();
    stopBoard();
    disposeBall?.();
    ro.disconnect();
    root.removeEventListener('click', onClick);
    window.removeEventListener('pointermove', onMove);
  };
}
