// Sign-up dialog for one team: on your own, or as a group of 2 to 5.

import { GAMES, TEAMS, TEAM_SIZE, TOURNAMENT } from '../data.js';
import { openDialog } from '../dialog.js';
import { L, t } from '../i18n.js';
import { icon } from '../icons.js';
import * as store from '../store.js';
import { esc, fmtLong, fmtShort, pips, wait } from '../util.js';

const MAX_MATES = TEAM_SIZE - 1;

function statusLine(teamId) {
  const l = store.lineup(teamId);
  if (l.open <= 0) return `${pips(TEAM_SIZE)}<span>${t('su.statusFull')}</span>`;
  const taken = l.count === 0 ? t('su.statusNone') : t('su.statusSome', { n: l.count, size: TEAM_SIZE });
  return `${pips(l.count)}<span>${taken}</span>`;
}

function field({ id, name, label, type = 'text', hint = '', attrs = '', prefix = '' }) {
  const describedBy = [hint ? `${id}-hint` : '', `${id}-err`].filter(Boolean).join(' ');
  const hidden = prefix ? `<span class="sr-only" data-prefix>${prefix} </span>` : '';
  return `<div class="field">
    <label for="${id}">${hidden}${label}</label>
    <input id="${id}" name="${name}" type="${type}" aria-describedby="${describedBy}" ${attrs}>
    ${hint ? `<p class="field-hint" id="${id}-hint">${hint}</p>` : ''}
    <p class="field-err" id="${id}-err"></p>
  </div>`;
}

const EMAIL_ATTRS = 'inputmode="email" autocomplete="email" autocapitalize="off" spellcheck="false" required';

function mateRow(n) {
  const who = t('su.teammate', { n });
  return `<li class="mate" data-mate>
    <p class="mate-n">${who}</p>
    ${field({ id: `m${n}-name`, name: 'mate-name', label: t('f.fullName'), prefix: who, attrs: 'autocomplete="off" required data-check="mate-name"' })}
    ${field({ id: `m${n}-email`, name: 'mate-email', label: t('f.email'), prefix: who, type: 'email', attrs: `${EMAIL_ATTRS} data-check="email"` })}
    <button class="mate-x" type="button" data-remove-mate aria-label="${esc(t('su.removeMate', { n }))}">${icon('close')}</button>
  </li>`;
}

function formHTML(team, game) {
  const grade = team.pool === 'grade';
  return `
    <form class="signup" novalidate data-mode="solo">
      ${game ? `<p class="dlg-date">${esc(t('su.gameLine', { game: L(game.name), date: fmtLong(game.date) }))}</p>` : ''}
      <h2 class="dlg-title" id="dlg-title">${esc(t('su.title', { team: team.label }))}</h2>
      <p class="signup-status" data-status>${statusLine(team.id)}</p>

      <fieldset class="modes">
        <legend class="sr-only">${t('su.modeLegend')}</legend>
        <label class="mode">
          <input type="radio" name="mode" value="solo" checked>
          <span class="mode-body">
            <span class="mode-name">${t('su.soloName')}</span>
            <span class="mode-note">${esc(t('su.soloNote', { pool: L(team.poolName) }))}</span>
          </span>
        </label>
        <label class="mode">
          <input type="radio" name="mode" value="group">
          <span class="mode-body">
            <span class="mode-name">${t('su.groupName')}</span>
            <span class="mode-note">${esc(t('su.groupNote'))}</span>
          </span>
        </label>
      </fieldset>

      <div class="fields">
        <p class="fields-title" data-self-title>${t('su.details')}</p>
        ${field({ id: 'f-name', name: 'name', label: t('f.fullName'), attrs: 'autocomplete="name" required data-check="name"' })}
        ${field({ id: 'f-email', name: 'email', label: t('f.email'), type: 'email', hint: t('f.emailHint'), attrs: `${EMAIL_ATTRS} data-check="email"` })}
        ${grade ? field({ id: 'f-homeroom', name: 'homeroom', label: t('f.homeroom'), hint: esc(t('f.homeroomHint', { x: team.example })), attrs: 'autocomplete="off" required data-check="homeroom"' }) : ''}

        <div class="mates" data-mates hidden>
          <ol class="mates-list" data-mates-list></ol>
          <button class="btn btn--ghost btn--small" type="button" data-add-mate>${icon('plus')}${t('su.addMate')}</button>
          <p class="field-hint">${esc(t('su.matesHint'))}</p>
        </div>

        <div class="field">
          <label for="f-note">${t('f.note')} <span class="opt">${t('optional')}</span></label>
          <textarea id="f-note" name="note" rows="2" maxlength="300" placeholder="${esc(t('f.notePh'))}"></textarea>
        </div>
      </div>

      <p class="form-err" role="alert" data-form-err></p>
      <div class="dlg-actions">
        <button class="btn btn--pink" type="submit" data-submit>${t('su.submit')}</button>
      </div>
      <p class="proto-note">${t(store.REMOTE ? 'live.privacy' : 'proto.saved')}</p>
    </form>`;
}

// result: { size, reserve, count } from store.addPlayers
function doneHTML(team, result) {
  const group = result.size > 1;
  const heading = group ? t('su.doneGroup', { n: result.size, team: team.label }) : t('su.doneSolo', { team: team.label });
  const place = result.reserve
    ? t(group ? 'su.doneReserveGroup' : 'su.doneReserveSolo', { team: team.label })
    : t('su.doneCount', { team: team.label, n: result.count, size: TEAM_SIZE });
  return `
    <div class="done">
      <span class="done-mark">${icon('check')}</span>
      <h2 class="dlg-title" id="dlg-title">${esc(heading)}</h2>
      <p class="done-line">${esc(place)}</p>
      <p class="done-line">${esc(t('su.doneConfirm', { date: fmtShort(TOURNAMENT.firstGame) }))}</p>
      <div class="dlg-actions"><button class="btn btn--pink" type="button" data-close>${t('su.done')}</button></div>
    </div>`;
}

export function openSignup(teamId) {
  const team = TEAMS[teamId];
  const game = Object.values(GAMES).find((g) => g.teams?.includes(teamId));
  const d = openDialog({ theme: 'arena', html: formHTML(team, game) });
  const form = d.querySelector('form');
  const matesBox = form.querySelector('[data-mates]');
  const list = form.querySelector('[data-mates-list]');
  const addBtn = form.querySelector('[data-add-mate]');
  const submit = form.querySelector('[data-submit]');
  const formErr = form.querySelector('[data-form-err]');
  const selfTitle = form.querySelector('[data-self-title]');

  const mode = () => form.elements.mode.value;
  const mates = () => [...list.querySelectorAll('[data-mate]')];

  function renumber() {
    mates().forEach((li, i) => {
      const n = i + 1;
      const who = t('su.teammate', { n });
      li.querySelector('.mate-n').textContent = who;
      li.querySelectorAll('[data-prefix]').forEach((el) => {
        el.textContent = `${who} `;
      });
      const x = li.querySelector('[data-remove-mate]');
      x.setAttribute('aria-label', t('su.removeMate', { n }));
      x.hidden = mates().length === 1; // a group needs at least one teammate
    });
    addBtn.hidden = mates().length >= MAX_MATES;
    updateSubmit();
  }

  function updateSubmit() {
    submit.textContent = mode() === 'group' ? t('su.submitN', { n: 1 + mates().length }) : t('su.submit');
  }

  let mateSerial = 0;
  function addMate(focus = true) {
    if (mates().length >= MAX_MATES) return;
    mateSerial += 1;
    list.insertAdjacentHTML('beforeend', mateRow(mateSerial));
    const row = list.lastElementChild;
    renumber();
    if (focus) row.querySelector('input').focus();
  }

  function setMode(m) {
    form.dataset.mode = m;
    matesBox.hidden = m !== 'group';
    selfTitle.textContent = m === 'group' ? t('su.detailsCaptain') : t('su.details');
    if (m === 'group' && mates().length === 0) addMate(false);
    updateSubmit();
    formErr.textContent = '';
  }

  // ---------- validation ----------

  function setError(input, msg) {
    const err = form.querySelector(`#${input.id}-err`);
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    input.closest('.field').classList.toggle('has-err', Boolean(msg));
    if (err) err.textContent = msg;
  }

  function emailsInForm(except) {
    return [...form.querySelectorAll('[data-check="email"]')]
      .filter((i) => i !== except && !i.closest('[hidden]'))
      .map((i) => store.cleanEmail(i.value));
  }

  function check(input) {
    const v = input.value.trim();
    let msg = '';
    switch (input.dataset.check) {
      case 'name':
        if (v.length < 2) msg = t('err.name');
        break;
      case 'mate-name':
        if (v.length < 2) msg = t('err.mateName');
        break;
      case 'homeroom':
        if (!v) msg = t('err.homeroom', { x: team.example });
        break;
      case 'email': {
        const taken = v && store.playerByEmail(v);
        if (!v) msg = t('err.email');
        else if (!store.SCHOOL_EMAIL.test(v)) msg = t('err.emailDomain');
        else if (taken) msg = t('err.emailTaken', { email: store.cleanEmail(v), team: TEAMS[taken.team].label });
        else if (emailsInForm(input).includes(store.cleanEmail(v))) msg = t('err.emailDup');
        break;
      }
      default:
    }
    setError(input, msg);
    return !msg;
  }

  const activeInputs = () => [...form.querySelectorAll('[data-check]')].filter((i) => !i.closest('[hidden]'));

  form.addEventListener('focusout', (e) => {
    const input = e.target.closest?.('[data-check]');
    if (input && (input.value.trim() || input.getAttribute('aria-invalid') === 'true')) check(input);
  });
  form.addEventListener('input', (e) => {
    const input = e.target.closest?.('[data-check]');
    if (input?.getAttribute('aria-invalid') === 'true') check(input);
  });
  form.addEventListener('change', (e) => {
    if (e.target.name === 'mode') setMode(mode());
  });
  form.addEventListener('click', (e) => {
    if (e.target.closest('[data-add-mate]')) addMate();
    const remove = e.target.closest('[data-remove-mate]');
    if (remove) {
      const li = remove.closest('[data-mate]');
      const next = li.nextElementSibling ?? li.previousElementSibling;
      li.remove();
      renumber();
      (next?.querySelector('input') ?? addBtn).focus();
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    formErr.textContent = '';
    const bad = activeInputs().filter((i) => !check(i));
    if (bad.length) {
      formErr.textContent = bad.length === 1 ? t('err.check1') : t('err.checkN', { n: bad.length });
      bad[0].focus();
      return;
    }
    const homeroom = form.elements.homeroom?.value ?? (team.pool === 'homeroom' ? team.label : '');
    const note = form.elements.note.value;
    const members = [{ name: form.elements.name.value, email: form.elements.email.value, homeroom, note }];
    if (mode() === 'group') {
      for (const li of mates()) {
        const [n, m] = li.querySelectorAll('input');
        members.push({ name: n.value, email: m.value, homeroom: team.pool === 'homeroom' ? team.label : '' });
      }
    }

    submit.disabled = true;
    submit.textContent = t('su.busy');
    form.setAttribute('aria-busy', 'true');
    if (!store.REMOTE) await wait(450);
    try {
      const result = await store.addPlayers(team.id, members);
      d.querySelector('.dlg-body').innerHTML = doneHTML(team, result);
      d.querySelector('.done [data-close]').focus();
    } catch (err) {
      formErr.textContent = err.i18n ? t(...err.i18n) : err.message;
      submit.disabled = false;
      form.removeAttribute('aria-busy');
      updateSubmit();
    }
  });

  form.querySelector('input[name="mode"]:checked').focus();
}
