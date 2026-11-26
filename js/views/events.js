// What's on: the issue's school weeks as a calendar (list on phones), plus any
// week an event runs into after the issue ends (the basketball final, 27 Oct).

import { EVENTS, ISSUE } from '../data.js';
import { openDialog } from '../dialog.js';
import { L, lang, t } from '../i18n.js';
import { icon } from '../icons.js';
import { addDays, esc, fmtLong, fmtMonth, fmtRange, fmtSpan, fmtWeekday, isoDate, parseDate } from '../util.js';
import { topbar } from './chrome.js';

export const theme = 'paper';
export const titleKey = 'title.events';

function weeks() {
  const out = [];
  const last = parseDate(EVENTS.reduce((end, e) => (e.end > end ? e.end : end), ISSUE.end));
  for (let mon = parseDate(ISSUE.start); mon <= last; mon = addDays(mon, 7)) {
    out.push(Array.from({ length: 5 }, (_, i) => isoDate(addDays(mon, i))));
  }
  return out;
}

// Place the week's events in lanes so bars never overlap. An event with
// `days` (the flashmob's practices and performance) shows on those days only,
// each with its own line of detail.
function lanesFor(days) {
  const inWeek = EVENTS.filter((e) => e.end >= days[0] && e.start <= days[4] && e.kind !== 'break')
    .flatMap((e) => {
      if (e.days) {
        return e.days.filter((d) => days.includes(d.date)).map((d) => ({ e, from: days.indexOf(d.date), to: days.indexOf(d.date), when: d.when }));
      }
      const from = Math.max(0, days.indexOf(e.start < days[0] ? days[0] : e.start));
      const to = days.indexOf(e.end > days[4] ? days[4] : e.end);
      return [{ e, from, to }];
    })
    .sort((a, b) => a.from - b.from || b.to - b.from - (a.to - a.from));
  const lanes = [];
  for (const item of inWeek) {
    let lane = lanes.findIndex((end) => end < item.from);
    if (lane === -1) {
      lane = lanes.length;
      lanes.push(-1);
    }
    lanes[lane] = item.to;
    item.lane = lane;
  }
  return { items: inWeek, count: lanes.length };
}

function bar({ e, from, to, lane, when }) {
  const pos = `grid-column:${from + 1}/${to + 2};grid-row:${lane + 2}`;
  if (e.kind === 'feature') {
    // A one-day feature (the basketball final) keeps its colour but fits one
    // day: title and where, and the whole bar is the link.
    const one = from === to;
    const meta = one ? L(e.when) : t(e.metaKey ?? 'events.featureMeta', { when: L(e.when) });
    return `<a class="ev ev--feature${one ? ' ev--one' : ''}${e.look ? ` ev--${e.look}` : ''}" href="${e.href}" style="${pos}">
      <span class="ev-title">${esc(L(e.title))}</span>
      <span class="ev-meta">${esc(meta)}</span>
      ${one ? '' : `<span class="ev-cta">${t(e.ctaKey ?? 'events.featureCta')}</span>`}
    </a>`;
  }
  const label = e.kind === 'deadline' ? L(e.short) : L(e.title);
  const meta = e.kind === 'deadline' ? '' : `<span class="ev-meta">${esc(L(when ?? e.when) ?? '')}</span>`;
  return `<button class="ev ev--${e.kind}" type="button" data-event="${e.opens ?? e.id}" style="${pos}">
    <span class="ev-title">${esc(label)}</span>${meta}
  </button>`;
}

function weekRow(days) {
  const breakEvent = EVENTS.find((e) => e.kind === 'break' && e.start <= days[4] && e.end >= days[0]);
  const { items, count } = lanesFor(days);
  const lanes = breakEvent ? 1 : Math.max(count, 1);
  const cells = days
    .map((d, i) => {
      const date = parseDate(d);
      const showMonth = i === 0 || date.getDate() === 1;
      return `<div class="day" style="grid-column:${i + 1}"><span class="day-n">${date.getDate()}</span>${showMonth ? `<span class="day-m">${fmtMonth(date)}</span>` : ''}</div>`;
    })
    .join('');
  const body = breakEvent
    ? `<div class="ev-break" style="grid-column:1/6;grid-row:2"><span>${esc(L(breakEvent.title))}</span><span class="ev-break-dates">${fmtRange(breakEvent.start, breakEvent.end)}</span></div>`
    : items.map(bar).join('');
  return `<div class="week${breakEvent ? ' week--break' : ''}" style="--lanes:${lanes}">
    ${cells}${body}
  </div>`;
}

function agenda() {
  return EVENTS.filter((e) => e.kind !== 'deadline')
    .map((e) => {
      const d = parseDate(e.start);
      const when = L(e.when);
      const tail = when ? `${t('sep')}${esc(lang() === 'en' ? when.toLowerCase() : when)}` : '';
      const inner = `<span class="ag-date"><b>${d.getDate()}</b>${fmtMonth(d)}</span>
        <span class="ag-body"><span class="ag-title">${esc(L(e.title))}</span><span class="ag-when">${fmtRange(e.start, e.end)}${tail}</span></span>`;
      if (e.kind === 'feature') return `<li class="ag-item ag-item--feature${e.look ? ` ag-item--${e.look}` : ''}"><a class="ag" href="${e.href}">${inner}</a></li>`;
      if (e.kind === 'break') return `<li class="ag-item ag-item--break"><div class="ag">${inner}</div></li>`;
      return `<li class="ag-item ag-item--${e.kind}"><button class="ag" type="button" data-event="${e.id}">${inner}</button></li>`;
    })
    .join('');
}

function openEvent(id) {
  const e = EVENTS.find((x) => x.id === id);
  if (!e) return;
  const facts = (e.facts ?? []).map(([k, v]) => `<dt>${t(k)}</dt><dd>${esc(L(v))}</dd>`).join('');
  const link = e.link
    ? `<a class="btn btn--red" href="${e.link.href}" target="_blank" rel="noopener noreferrer">${esc(L(e.link.label))}${icon('external')}</a>`
    : '';
  openDialog({
    theme: 'paper',
    html: `
      <p class="dlg-date">${e.start === e.end ? fmtLong(e.start) : fmtRange(e.start, e.end)}</p>
      <h2 class="dlg-title" id="dlg-title">${esc(L(e.title))}</h2>
      ${e.by ? `<p class="dlg-by">${esc(L(e.by))}</p>` : ''}
      <p class="dlg-lead">${esc(L(e.lead) ?? '')}</p>
      ${facts ? `<dl class="facts">${facts}</dl>` : ''}
      ${link ? `<div class="dlg-actions">${link}</div>` : ''}`,
  });
}

export function render(root) {
  const range = fmtSpan(ISSUE.start, ISSUE.end, { year: true });
  const grid = weeks();
  // The grid can run a week past the issue (the final), so say what it shows.
  const gridRange = fmtSpan(grid[0][0], grid[grid.length - 1][4], { year: true });
  const weekdays = grid[0].map((d) => `<span>${fmtWeekday(d)}</span>`).join('');
  root.innerHTML = `
    <div class="page page--events">
      ${topbar()}
      <header class="page-head">
        <h1 class="page-title">${t('events.title')}</h1>
        <p class="page-sub">${esc(t('events.sub', { n: ISSUE.number, range }))}</p>
      </header>
      <section class="cal" aria-label="${esc(t('events.calLabel', { range: gridRange }))}">
        <div class="cal-days" aria-hidden="true">${weekdays}</div>
        ${grid.map(weekRow).join('')}
      </section>
      <ol class="agenda" aria-label="${esc(t('events.agendaLabel'))}">${agenda()}</ol>
    </div>`;

  const onClick = (e) => {
    const target = e.target.closest('[data-event]');
    if (target) openEvent(target.dataset.event);
  };
  root.addEventListener('click', onClick);

  // The cover's "Open now" can link straight to an event's details:
  // #/events?open=<id>. The address goes back to #/events once it is open.
  const open = new URLSearchParams(location.hash.split('?')[1] ?? '').get('open');
  if (open && EVENTS.some((e) => e.id === open)) {
    history.replaceState(null, '', '#/events');
    requestAnimationFrame(() => openEvent(open));
  }
  return () => root.removeEventListener('click', onClick);
}
