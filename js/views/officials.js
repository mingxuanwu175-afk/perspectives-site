// Officials: referees, scorer and timer sign up here, away from the bracket.

import { GAMES, GAME_DAYS, QFS, ROLES, TOURNAMENT } from '../data.js';
import { L, t } from '../i18n.js';
import { icon } from '../icons.js';
import * as store from '../store.js';
import { esc, fmtLong, fmtShort, fmtSpan, wait } from '../util.js';
import { topbar } from './chrome.js';

// Only game days still to come can be picked (Singapore time).
const SGT_DAY = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Singapore', year: 'numeric', month: '2-digit', day: '2-digit' });

export const theme = 'arena';
export const titleKey = 'title.off';

function roleList() {
  return store
    .officialsByRole()
    .map((r) => {
      const left = r.need - r.filled;
      const state = left > 0 ? t('off.needed', { n: left }) : t('off.filled');
      return `<li class="role${left > 0 ? '' : ' role--full'}">
        <span class="role-count"><b>${r.filled}</b>/${r.need}</span>
        <span class="role-body">
          <span class="role-name">${esc(L(r.need > 1 ? r.plural : r.name))}</span>
          <span class="role-does">${esc(L(r.does))}</span>
        </span>
        <span class="role-state">${esc(state)}</span>
      </li>`;
    })
    .join('');
}

function roleOptions() {
  return store
    .officialsByRole()
    .map((r, i) => {
      const full = r.filled >= r.need;
      const note = full ? t('off.choiceFull') : t('off.choiceOpen', { left: r.need - r.filled, need: r.need });
      return `<label class="choice">
        <input type="radio" name="role" value="${r.id}" ${i === 0 ? 'required' : ''} data-check="role">
        <span class="choice-body"><span class="choice-name">${esc(L(r.name))}</span><span class="choice-note">${esc(note)}</span></span>
      </label>`;
    })
    .join('');
}

function formHTML() {
  return `
    <form class="off-form" novalidate>
      <h2 class="off-form-title">${t('off.formTitle')}</h2>
      <div class="field">
        <label for="o-name">${t('f.fullName')}</label>
        <input id="o-name" name="name" autocomplete="name" required data-check="name" aria-describedby="o-name-err">
        <p class="field-err" id="o-name-err"></p>
      </div>
      <div class="field">
        <label for="o-email">${t('f.email')}</label>
        <input id="o-email" name="email" type="email" inputmode="email" autocomplete="email" autocapitalize="off" spellcheck="false" required data-check="email" aria-describedby="o-email-hint o-email-err">
        <p class="field-hint" id="o-email-hint">${t('f.emailHint')}</p>
        <p class="field-err" id="o-email-err"></p>
      </div>
      <div class="field">
        <label for="o-homeroom">${t('f.homeroom')}</label>
        <input id="o-homeroom" name="homeroom" autocomplete="off" required data-check="homeroom" aria-describedby="o-homeroom-hint o-homeroom-err">
        <p class="field-hint" id="o-homeroom-hint">${t('off.homeroomHint')}</p>
        <p class="field-err" id="o-homeroom-err"></p>
      </div>
      <fieldset class="field field--group" data-group="role" aria-describedby="o-role-err">
        <legend>${t('off.role')}</legend>
        <div class="choices" data-role-options>${roleOptions()}</div>
        <p class="field-err" id="o-role-err"></p>
      </fieldset>
      <fieldset class="field field--group" data-group="days" aria-describedby="o-days-err">
        <legend>${t('off.days')}</legend>
        <div class="days">${GAME_DAYS.filter((d) => d >= SGT_DAY.format(Date.now())).map(
          (d) => `<label class="day-pick"><input type="checkbox" name="days" value="${d}" checked><span>${fmtShort(d)}</span></label>`,
        ).join('')}</div>
        <p class="field-err" id="o-days-err"></p>
      </fieldset>
      <div class="field">
        <label for="o-note">${t('off.exp')} <span class="opt">${t('optional')}</span></label>
        <textarea id="o-note" name="note" rows="2" maxlength="300" placeholder="${esc(t('off.expPh'))}"></textarea>
      </div>
      <p class="form-err" role="alert" data-form-err></p>
      <button class="btn btn--pink" type="submit" data-submit>${t('off.submit')}</button>
      <p class="proto-note">${t(store.REMOTE ? 'live.privacy' : 'proto.saved')}</p>
    </form>`;
}

export function render(root) {
  const mail = `<a href="mailto:${TOURNAMENT.contact}">${TOURNAMENT.contact}</a>`;
  root.innerHTML = `
    <div class="arena arena--plain">
      <div class="arena-bg" aria-hidden="true">
        <div class="beam beam--a"></div>
        <div class="beam beam--b"></div>
        <div class="arena-fade"></div>
      </div>
      ${topbar({ links: [['#/basketball', t('nav.basketball')]] })}
      <div class="off">
        <section class="off-intro">
          <h1 class="bb-title">${t('off.title')}</h1>
          <p class="off-lead">${esc(t('off.lead', { event: L(TOURNAMENT.title), range: fmtSpan(GAMES[QFS[0]].date, GAMES[QFS[QFS.length - 1]].date), final: fmtLong(GAMES.final.date) }))}</p>
          <ul class="roles" data-roles>${roleList()}</ul>
          <p class="off-alt">${t('off.alt', { email: mail })}</p>
        </section>
        <section class="off-card" data-form-slot>${formHTML()}</section>
      </div>
    </div>`;

  const slot = root.querySelector('[data-form-slot]');
  const refresh = () => {
    root.querySelector('[data-roles]').innerHTML = roleList();
    const opts = slot.querySelector('[data-role-options]');
    if (opts) {
      const chosen = slot.querySelector('input[name="role"]:checked')?.value;
      opts.innerHTML = roleOptions();
      if (chosen) opts.querySelector(`input[value="${chosen}"]`).checked = true;
    }
  };
  const unsubscribe = store.subscribe(refresh);
  wire(slot);

  return () => unsubscribe();
}

function wire(slot) {
  const form = slot.querySelector('form');
  const formErr = form.querySelector('[data-form-err]');
  const submit = form.querySelector('[data-submit]');

  const setError = (el, errId, msg) => {
    const box = el.closest('.field');
    box.classList.toggle('has-err', Boolean(msg));
    if (el.matches('input')) el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    form.querySelector(`#${errId}`).textContent = msg;
    return !msg;
  };

  function check(input) {
    const v = input.value.trim();
    let msg = '';
    if (input.dataset.check === 'name' && v.length < 2) msg = t('err.name');
    if (input.dataset.check === 'homeroom' && !v) msg = t('err.homeroom', { x: '10.2' });
    if (input.dataset.check === 'email') {
      const taken = v && store.officialByEmail(v);
      if (!v) msg = t('err.email');
      else if (!store.SCHOOL_EMAIL.test(v)) msg = t('err.emailDomain');
      else if (taken) msg = t('err.officialTaken', { email: store.cleanEmail(v), role: ROLES.find((r) => r.id === taken.role).word });
    }
    return setError(input, `${input.id}-err`, msg);
  }

  const checkRole = () =>
    setError(form.querySelector('[data-group="role"]'), 'o-role-err', form.elements.role.value ? '' : t('err.role'));
  const checkDays = () =>
    setError(
      form.querySelector('[data-group="days"]'),
      'o-days-err',
      form.querySelectorAll('input[name="days"]:checked').length ? '' : t('err.days'),
    );

  form.addEventListener('focusout', (e) => {
    const input = e.target.closest?.('input[data-check]:not([type="radio"])');
    if (input && (input.value.trim() || input.getAttribute('aria-invalid') === 'true')) check(input);
  });
  form.addEventListener('input', (e) => {
    const input = e.target.closest?.('input[data-check]:not([type="radio"])');
    if (input?.getAttribute('aria-invalid') === 'true') check(input);
  });
  form.addEventListener('change', (e) => {
    if (e.target.name === 'role') checkRole();
    if (e.target.name === 'days') checkDays();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    formErr.textContent = '';
    const inputs = [...form.querySelectorAll('input[data-check]:not([type="radio"])')];
    const results = [...inputs.map(check), checkRole(), checkDays()];
    const bad = results.filter((ok) => !ok).length;
    if (bad) {
      formErr.textContent = bad === 1 ? t('err.check1') : t('err.checkN', { n: bad });
      form.querySelector('.has-err input')?.focus();
      return;
    }
    const entry = {
      name: form.elements.name.value,
      email: form.elements.email.value,
      homeroom: form.elements.homeroom.value,
      role: form.elements.role.value,
      days: [...form.querySelectorAll('input[name="days"]:checked')].map((i) => i.value),
      note: form.elements.note.value,
    };
    submit.disabled = true;
    submit.textContent = t('su.busy');
    if (!store.REMOTE) await wait(450);
    try {
      const { reserve } = await store.addOfficial(entry);
      const role = ROLES.find((r) => r.id === entry.role);
      const heading = t(reserve ? 'off.doneTitleReserve' : 'off.doneTitle', { role: role.word });
      slot.innerHTML = `
        <div class="done" tabindex="-1">
          <span class="done-mark">${icon('check')}</span>
          <h2 class="off-form-title">${esc(heading)}</h2>
          <p class="done-line">${esc(t('off.doneDays', { days: entry.days.map((d) => fmtLong(d)).join(t('list')) }))}</p>
          <p class="done-line">${t('off.doneConfirm')}</p>
          <a class="btn btn--ghost" href="#/basketball">${t('off.back')}</a>
        </div>`;
      slot.querySelector('.done').focus();
    } catch (err) {
      formErr.textContent = err.i18n ? t(...err.i18n) : err.message;
      submit.disabled = false;
      submit.textContent = t('off.submit');
    }
  });
}
