// Editors' view of every sign-up, laid out like the bracket.
//
// Live site: the password is checked by the server (api/admin.js, the
// ADMIN_PASSWORD setting on Vercel) before any names or emails are sent.
// Prototype (serve.py): the passcode is checked in the browser, which only
// keeps casual visitors out; there the data is this browser's own anyway.

import { GAMES, GAME_DAYS, JOIN_LANGS, JOIN_ROLES, TEAMS, TEAM_SIZE } from '../data.js';
import { L, t } from '../i18n.js';
import { icon } from '../icons.js';
import * as store from '../store.js';
import { esc, fmtShort, fmtStamp, pips } from '../util.js';
import { topbar } from './chrome.js';

export const theme = 'arena';
export const titleKey = 'title.admin';

const PASS_HASH = 'cbe365a959cd6b72eddb785963a4f96f670edfaa5a2e6e54262422321d66b3b8';
const SESSION_KEY = 'perspectives.editor';

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function unlocked() {
  try {
    return sessionStorage.getItem(SESSION_KEY) === PASS_HASH;
  } catch {
    return false;
  }
}

export function render(root) {
  if (!store.REMOTE) return unlocked() ? board(root) : gate(root);
  if (store.adminReady()) return board(root);
  if (store.hasAdminKey()) {
    // Opened again in the same tab: the server checks the saved password again.
    root.innerHTML = `<div class="admin admin--gate">${topbar()}<p class="gate gate-line">${t('ad.loading')}</p></div>`;
    let alive = true;
    let teardown = null;
    store.refreshAdmin().then((ok) => {
      if (alive) teardown = ok ? board(root) : gate(root);
    });
    return () => {
      alive = false;
      teardown?.();
    };
  }
  return gate(root);
}

// ---------- passcode gate ----------

function gate(root) {
  root.innerHTML = `
    <div class="admin admin--gate">
      ${topbar()}
      <form class="gate" novalidate>
        <span class="gate-icon">${icon('lock')}</span>
        <h1 class="gate-title">${t('ad.gateTitle')}</h1>
        <p class="gate-line">${t('ad.gateLine')}</p>
        <div class="field">
          <label for="g-pass">${t('ad.pass')}</label>
          <input id="g-pass" name="pass" type="password" autocomplete="off" required aria-describedby="g-pass-err">
          <p class="field-err" id="g-pass-err" role="alert"></p>
        </div>
        <button class="btn btn--pink" type="submit">${t('ad.openBtn')}</button>
      </form>
    </div>`;
  const form = root.querySelector('.gate');
  const input = form.elements.pass;
  const err = form.querySelector('#g-pass-err');
  let teardown = null;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (store.REMOTE) {
      const button = form.querySelector('[type="submit"]');
      err.textContent = '';
      button.disabled = true;
      try {
        if (await store.unlock(input.value)) {
          teardown = board(root);
          return;
        }
        err.textContent = t('ad.wrong');
        input.setAttribute('aria-invalid', 'true');
        input.select();
      } catch (x) {
        err.textContent = x.i18n ? t(...x.i18n) : x.message;
      } finally {
        button.disabled = false;
      }
      return;
    }
    if (!window.crypto?.subtle) {
      err.textContent = t('ad.needHttp');
      return;
    }
    const hash = await sha256(input.value);
    if (hash !== PASS_HASH) {
      err.textContent = t('ad.wrong');
      input.setAttribute('aria-invalid', 'true');
      input.select();
      return;
    }
    try {
      sessionStorage.setItem(SESSION_KEY, hash);
    } catch {
      /* stays open until the page is reloaded */
    }
    teardown = board(root);
  });
  input.focus();
  return () => teardown?.();
}

// ---------- board ----------

const GROUP_TONES = ['pink', 'gold', 'sky', 'lime'];

function person(p, i, reserve) {
  const unit = p.unit;
  const tag = unit.kind === 'group'
    ? `<span class="a-tag a-tag--${GROUP_TONES[unit.index % GROUP_TONES.length]}">${esc(t(p.captain ? 'ad.groupCaptain' : 'ad.group', { x: unit.letter }))}</span>`
    : `<span class="a-tag">${t('ad.solo')}</span>`;
  return `<li class="a-p${reserve ? ' a-p--res' : ''}">
    <span class="a-p-n">${reserve ? 'R' : i + 1}</span>
    <span class="a-p-main">
      <span class="a-p-name">${esc(p.name)}${p.demo ? ` <span class="a-sample">${t('ad.sample')}</span>` : ''}</span>
      <a class="a-p-mail" href="mailto:${esc(p.email)}">${esc(p.email)}</a>
      ${p.homeroom && !/^10\.\d$/.test(p.homeroom) ? `<span class="a-p-meta">${esc(t('ad.homeroom', { x: p.homeroom }))}</span>` : ''}
      ${p.note ? `<span class="a-p-note">${esc(p.note)}</span>` : ''}
    </span>
    <span class="a-p-side">${tag}<time datetime="${new Date(p.at).toISOString()}">${fmtStamp(p.at)}</time></span>
    <button class="a-x" type="button" data-remove="${p.id}" data-name="${esc(p.name)}" aria-label="${esc(t('ad.remove', { name: p.name }))}">${icon('close')}</button>
  </li>`;
}

function statusOf(l) {
  if (l.count === 0) return ['empty', t('ad.none')];
  if (l.open > 0) return ['short', t('ad.needs', { n: l.open })];
  return ['full', l.reserves.length ? t('ad.fullRes', { n: l.reserves.length }) : t('ad.full')];
}

function teamCard(id) {
  const team = TEAMS[id];
  const l = store.lineup(id);
  const [state, label] = statusOf(l);
  const open = Array.from({ length: l.open }, (_, k) => `<li class="a-p a-p--open"><span class="a-p-n">${l.count + k + 1}</span><span class="a-p-main">${t('ad.openPlace')}</span></li>`).join('');
  const waiting = l.waiting
    .map(({ unit, openAtTheTime }) => {
      const lead = unit.members.find((m) => m.captain) ?? unit.members[0];
      return `<p class="a-flag">${esc(t('ad.waiting', { x: unit.letter, size: unit.members.length, name: lead.name, n: openAtTheTime }))}</p>`;
    })
    .join('');
  return `<article class="a-team a-team--${state}">
    <header class="a-team-head">
      <h3 class="a-team-name">${team.label}</h3>
      <span class="a-team-sub">${esc(L(team.sub))}</span>
      <span class="a-team-fill">${pips(l.count)}<b>${l.count}</b>/${TEAM_SIZE}</span>
      <span class="a-status a-status--${state}">${esc(label)}</span>
    </header>
    <ol class="a-lineup">${l.starters.map((p, i) => person(p, i, false)).join('')}${open}</ol>
    ${l.reserves.length ? `<p class="a-sub">${t('ad.reserves')}</p><ol class="a-lineup a-lineup--res">${l.reserves.map((p, i) => person(p, i, true)).join('')}</ol>` : ''}
    ${waiting}
  </article>`;
}

// Sign-ups are by team, and the games as played (data.js GAMES) are not the
// original draw, so the board lists every team: G10 homerooms on the left, the
// grade teams on the right.
const TEAM_IDS = Object.keys(TEAMS);
function teamsBox(ids) {
  return `<section class="a-match">${ids.map(teamCard).join('')}</section>`;
}

function officialsBox() {
  return store
    .officialsByRole()
    .map((r) => {
      const people = r.people
        .map((o, i) => {
          // Days show their dates. A day that no longer has a game (Monday 19
          // or Monday 26 October, from before the schedule changed) stays
          // visible, marked.
          const on = GAME_DAYS.filter((d) => o.days.includes(d));
          const gone = o.days.filter((d) => !GAME_DAYS.includes(d));
          const days = [
            ...(on.length === GAME_DAYS.length ? [t('ad.everyDay')] : on.map(fmtShort)),
            ...gone.map((d) => t('ad.oldDay', { date: fmtShort(d) })),
          ].join(t('list'));
          return `<li class="a-o${i >= r.need ? ' a-o--res' : ''}">
          <span class="a-p-main">
            <span class="a-p-name">${esc(o.name)}${i >= r.need ? ` <span class="a-sample">${t('ad.reserve')}</span>` : ''}${o.demo ? ` <span class="a-sample">${t('ad.sample')}</span>` : ''}</span>
            <a class="a-p-mail" href="mailto:${esc(o.email)}">${esc(o.email)}</a>
            <span class="a-p-meta">${esc(o.homeroom)}${t('sep')}${esc(days)}</span>
            ${o.note ? `<span class="a-p-note">${esc(o.note)}</span>` : ''}
          </span>
          <button class="a-x" type="button" data-remove="${o.id}" data-name="${esc(o.name)}" aria-label="${esc(t('ad.remove', { name: o.name }))}">${icon('close')}</button>
        </li>`;
        })
        .join('');
      const open = Math.max(0, r.need - r.people.length);
      return `<div class="a-role">
        <h3 class="a-role-name">${esc(L(r.need > 1 ? r.plural : r.name))} <span><b>${r.filled}</b>/${r.need}</span></h3>
        <ul class="a-role-list">${people}${Array.from({ length: open }, () => `<li class="a-o a-o--open">${t('ad.openSlot')}</li>`).join('')}</ul>
      </div>`;
    })
    .join('');
}

function attention() {
  const items = [];
  for (const id of Object.keys(TEAMS)) {
    const l = store.lineup(id);
    if (l.open > 0) items.push(t('ad.attnTeam', { team: TEAMS[id].label, n: l.open }));
    if (l.waiting.length) items.push(t('ad.attnWaiting', { team: TEAMS[id].label }));
  }
  for (const r of store.officialsByRole()) {
    const left = r.need - r.filled;
    if (left > 0) items.push(t('ad.attnRole', { n: left, role: left === 1 ? r.word : r.words }));
  }
  // Officials who signed up before the final moved could not pick its day.
  const notFinal = store.officialsByRole().flatMap((r) => r.people).filter((o) => !o.days.includes(GAMES.final.date)).length;
  if (notFinal) items.push(t('ad.attnFinal', { n: notFinal, date: fmtShort(GAMES.final.date) }));
  return items.length ? items.map((s) => `<li>${esc(s)}</li>`).join('') : `<li>${t('ad.allFilled')}</li>`;
}

function summary() {
  const ids = Object.keys(TEAMS);
  const lineups = ids.map((id) => store.lineup(id));
  const players = lineups.reduce((n, l) => n + l.total, 0);
  const full = lineups.filter((l) => l.open === 0).length;
  const roles = store.officialsByRole();
  const officials = roles.reduce((n, r) => n + r.filled, 0);
  const need = roles.reduce((n, r) => n + r.need, 0);
  // Numbers are wrapped in <b> after translation so each language keeps its word order.
  const bold = (s) => esc(s).replace(/(\d+(?:\/\d+)?)/, '<b>$1</b>');
  return `<span>${bold(t('ad.joinsCount', { n: store.joins().length }))}</span>
    <span>${bold(t('ad.players', { n: players }))}</span>
    <span>${bold(t('ad.teamsFull', { a: full, b: ids.length }))}</span>
    <span>${bold(t('ad.officials', { a: officials, b: need }))}</span>`;
}

// People who want to join the magazine team, newest first, with a count for
// each role so the gaps show.
const nameIn = (list, id) => L(list.find((x) => x.id === id)?.name ?? id);

function joinsBox() {
  const list = store.joins();
  const tally = JOIN_ROLES.map((r) => {
    const n = list.filter((j) => j.roles.includes(r.id)).length;
    return `<span class="a-tag${n ? ' a-tag--sky' : ''}">${esc(L(r.name))}<b>${n}</b></span>`;
  }).join('');
  const rows = list
    .map((j) => {
      const meta = [j.homeroom, j.langs.length ? t('ad.writesIn', { x: j.langs.map((id) => nameIn(JOIN_LANGS, id)).join(t('list')) }) : '']
        .filter(Boolean)
        .join(t('sep'));
      return `<li class="a-j">
        <span class="a-p-main">
          <span class="a-p-name">${esc(j.name)}${j.demo ? ` <span class="a-sample">${t('ad.sample')}</span>` : ''}</span>
          <a class="a-p-mail" href="mailto:${esc(j.email)}">${esc(j.email)}</a>
          <span class="a-p-meta">${esc(meta)}</span>
          ${j.note ? `<span class="a-p-note">${esc(j.note)}</span>` : ''}
        </span>
        <span class="a-j-roles">${j.roles.map((id) => `<span class="a-tag a-tag--sky">${esc(nameIn(JOIN_ROLES, id))}</span>`).join('')}</span>
        <time datetime="${new Date(j.at).toISOString()}">${fmtStamp(j.at)}</time>
        <button class="a-x" type="button" data-remove="${j.id}" data-name="${esc(j.name)}" aria-label="${esc(t('ad.remove', { name: j.name }))}">${icon('close')}</button>
      </li>`;
    })
    .join('');
  return `<header class="a-joins-head">
      <h2 class="a-match-name">${t('ad.joinsTitle')}<b>${list.length}</b></h2>
      <button class="btn btn--ghost btn--small" type="button" data-export-joins>${icon('download')}${t('ad.exportJoins')}</button>
    </header>
    <p class="a-j-tally">${tally}</p>
    ${rows ? `<ul class="a-j-list">${rows}</ul>` : `<p class="a-joins-empty">${t('ad.joinsNone')}</p>`}`;
}

const today = () => new Date().toISOString().slice(0, 10);

function download(text, name) {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function board(root) {
  root.innerHTML = `
    <div class="admin">
      ${topbar({ right: `<button class="btn btn--ghost btn--small" type="button" data-lock>${icon('lock')}${t('ad.lock')}</button>` })}
      <header class="admin-head">
        <div>
          <h1 class="admin-title">${t('ad.title')}</h1>
          <p class="admin-sum" data-sum></p>
        </div>
        <div class="admin-actions">
          <button class="btn btn--pink btn--small" type="button" data-export>${icon('download')}${t('ad.export')}</button>
          ${store.REMOTE ? '' : '<button class="btn btn--ghost btn--small" type="button" data-sample></button>'}
        </div>
      </header>
      <p class="admin-proto">${t(store.REMOTE ? 'ad.live' : 'ad.proto')}</p>
      <section class="a-joins" data-joins></section>
      <div class="a-board" data-board></div>
    </div>`;

  const paint = () => {
    root.querySelector('[data-sum]').innerHTML = summary();
    root.querySelector('[data-joins]').innerHTML = joinsBox();
    const sample = root.querySelector('[data-sample]');
    if (sample) sample.textContent = store.hasSampleData() ? t('ad.removeSample') : t('ad.addSample');
    root.querySelector('[data-board]').innerHTML = `
      <div class="a-side">${teamsBox(TEAM_IDS.slice(0, 4))}</div>
      <div class="a-mid">
        <section class="a-off"><h2 class="a-match-name">${t('ad.officialsTitle')}</h2>${officialsBox()}</section>
        <section class="a-attn"><h2 class="a-match-name">${t('ad.attention')}</h2><ul>${attention()}</ul></section>
      </div>
      <div class="a-side">${teamsBox(TEAM_IDS.slice(4))}</div>`;
  };
  paint();
  const unsubscribe = store.subscribe(paint);
  // Live site: pick up new sign-ups every 30 seconds; if the password stops
  // working (changed on Vercel), go back to the password box.
  let stopBoard = null;
  const timer = store.REMOTE
    ? setInterval(async () => {
      if (document.hidden) return;
      const ok = await store.refreshAdmin();
      if (!ok && !store.hasAdminKey()) {
        stopBoard();
        gate(root);
      }
    }, 30000)
    : 0;

  const onClick = (e) => {
    const rm = e.target.closest('[data-remove]');
    if (rm) {
      if (window.confirm(t('ad.confirmRemove', { name: rm.dataset.name }))) {
        store.removeEntry(rm.dataset.remove).catch((x) => window.alert(x.i18n ? t(...x.i18n) : x.message));
      }
      return;
    }
    if (e.target.closest('[data-export]')) {
      download(store.toCSV(), `think-pink-signups-${today()}.csv`);
      return;
    }
    if (e.target.closest('[data-export-joins]')) {
      download(store.joinsCSV(), `perspectives-team-signups-${today()}.csv`);
      return;
    }
    if (e.target.closest('[data-sample]')) {
      if (store.hasSampleData()) store.removeSampleData();
      else store.addSampleData();
      return;
    }
    if (e.target.closest('[data-lock]')) {
      store.lock();
      try {
        sessionStorage.removeItem(SESSION_KEY);
      } catch {
        /* nothing stored */
      }
      location.hash = '#/';
    }
  };
  root.addEventListener('click', onClick);
  stopBoard = () => {
    clearInterval(timer);
    unsubscribe();
    root.removeEventListener('click', onClick);
  };
  return stopBoard;
}
