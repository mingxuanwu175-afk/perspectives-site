// Join the team: the form behind the cover's "Join the team" button and the
// join page. People say what they would like to do; the editors read the
// answers on #/admin and write back by school email.

import { JOIN_FORM, JOIN_LANGS, JOIN_ROLES } from '../data.js';
import { openDialog } from '../dialog.js';
import { L, t } from '../i18n.js';
import { icon } from '../icons.js';
import * as store from '../store.js';
import { esc, wait } from '../util.js';

const HOMEROOM_EXAMPLE = '9.2';

const picks = (name, items) =>
  items
    .map((it) => `<label class="pick"><input type="checkbox" name="${name}" value="${it.id}"><span>${esc(L(it.name))}</span></label>`)
    .join('');

function formHTML() {
  return `
    <form class="jf" novalidate>
      <p class="jf-k"><i aria-hidden="true"></i>${esc(t('cover.joinK'))}</p>
      <h2 class="dlg-title" id="dlg-title">${esc(t('jf.title'))}</h2>
      <p class="dlg-lead">${esc(t('jf.lead'))}</p>
      <div class="fields">
        <div class="field">
          <label for="j-name">${t('f.fullName')}</label>
          <input id="j-name" name="name" autocomplete="name" required data-check="name" aria-describedby="j-name-err">
          <p class="field-err" id="j-name-err"></p>
        </div>
        <div class="jf-pair">
          <div class="field">
            <label for="j-email">${t('f.email')}</label>
            <input id="j-email" name="email" type="email" inputmode="email" autocomplete="email" autocapitalize="off" spellcheck="false" required data-check="email" aria-describedby="j-email-hint j-email-err">
            <p class="field-hint" id="j-email-hint">${t('f.emailHint')}</p>
            <p class="field-err" id="j-email-err"></p>
          </div>
          <div class="field">
            <label for="j-homeroom">${t('f.homeroom')}</label>
            <input id="j-homeroom" name="homeroom" autocomplete="off" required data-check="homeroom" aria-describedby="j-homeroom-hint j-homeroom-err">
            <p class="field-hint" id="j-homeroom-hint">${esc(t('f.homeroomHint', { x: HOMEROOM_EXAMPLE }))}</p>
            <p class="field-err" id="j-homeroom-err"></p>
          </div>
        </div>
        <fieldset class="field field--group" data-group="roles" aria-describedby="j-roles-hint j-roles-err">
          <legend>${t('jf.roles')}</legend>
          <p class="field-hint" id="j-roles-hint">${t('jf.rolesHint')}</p>
          <div class="picks">${picks('roles', JOIN_ROLES)}</div>
          <p class="field-err" id="j-roles-err"></p>
        </fieldset>
        <fieldset class="field field--group">
          <legend>${t('jf.langs')} <span class="opt">${t('optional')}</span></legend>
          <div class="picks">${picks('langs', JOIN_LANGS)}</div>
        </fieldset>
        <div class="field">
          <label for="j-note">${t('jf.note')} <span class="opt">${t('optional')}</span></label>
          <textarea id="j-note" name="note" rows="3" maxlength="500" placeholder="${esc(t('jf.notePh'))}"></textarea>
        </div>
      </div>
      <p class="form-err" role="alert" data-form-err></p>
      <div class="dlg-actions"><button class="btn btn--blue" type="submit" data-submit>${t('jf.submit')}</button></div>
      <p class="proto-note">${t(store.REMOTE ? 'jf.privacy' : 'proto.saved')}</p>
    </form>`;
}

function doneHTML(entry) {
  const name = entry.name.trim().replace(/\s+/g, ' ');
  // Someone with work ready can send it straight away (the Microsoft Form takes files).
  const submit = JOIN_FORM
    ? `<a class="btn btn--ghost" href="${esc(JOIN_FORM)}" target="_blank" rel="noopener noreferrer">${t('jf.doneSubmit')}${icon('external')}</a>`
    : '';
  return `
    <div class="done">
      <span class="done-mark">${icon('check')}</span>
      <h2 class="dlg-title" id="dlg-title">${esc(t('jf.doneTitle', { name }))}</h2>
      <p class="done-line">${esc(t('jf.doneLine', { email: store.cleanEmail(entry.email) }))}</p>
      <div class="dlg-actions"><button class="btn btn--blue" type="button" data-close>${t('su.done')}</button>${submit}</div>
    </div>`;
}

export function openJoin() {
  // The page stays still behind the form: on the cover a scroll would fly
  // into the robot and leave for the events page, closing the form.
  const page = document.documentElement;
  const overflow = page.style.overflow;
  page.style.overflow = 'hidden';
  const d = openDialog({
    theme: 'cover',
    html: formHTML(),
    onClose: () => {
      page.style.overflow = overflow;
    },
  });
  const form = d.querySelector('form');
  const formErr = form.querySelector('[data-form-err]');
  const submit = form.querySelector('[data-submit]');
  const rolesBox = form.querySelector('[data-group="roles"]');

  const setError = (el, errId, msg) => {
    el.closest('.field').classList.toggle('has-err', Boolean(msg));
    if (el.matches('input')) el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    form.querySelector(`#${errId}`).textContent = msg;
    return !msg;
  };

  function check(input) {
    const v = input.value.trim();
    let msg = '';
    if (input.dataset.check === 'name' && v.length < 2) msg = t('err.name');
    if (input.dataset.check === 'homeroom' && !v) msg = t('err.homeroom', { x: HOMEROOM_EXAMPLE });
    if (input.dataset.check === 'email') {
      if (!v) msg = t('err.email');
      else if (!store.SCHOOL_EMAIL.test(v)) msg = t('err.emailDomain');
      else if (store.joinByEmail(v)) msg = t('err.joinTaken', { email: store.cleanEmail(v) });
    }
    return setError(input, `${input.id}-err`, msg);
  }

  const chosen = (name) => [...form.querySelectorAll(`input[name="${name}"]:checked`)].map((i) => i.value);
  const checkRoles = () => setError(rolesBox, 'j-roles-err', chosen('roles').length ? '' : t('err.roles'));

  // Once every highlighted field is fixed, the line under the form goes too.
  const tidy = () => {
    if (!form.querySelector('.has-err')) formErr.textContent = '';
  };
  form.addEventListener('focusout', (e) => {
    const input = e.target.closest?.('input[data-check]');
    if (input && (input.value.trim() || input.getAttribute('aria-invalid') === 'true')) check(input);
    tidy();
  });
  form.addEventListener('input', (e) => {
    const input = e.target.closest?.('input[data-check]');
    if (input?.getAttribute('aria-invalid') === 'true') check(input);
    tidy();
  });
  form.addEventListener('change', (e) => {
    if (e.target.name === 'roles' && rolesBox.classList.contains('has-err')) checkRoles();
    tidy();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    formErr.textContent = '';
    const results = [...[...form.querySelectorAll('input[data-check]')].map(check), checkRoles()];
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
      roles: chosen('roles'),
      langs: chosen('langs'),
      note: form.elements.note.value,
    };
    submit.disabled = true;
    submit.textContent = t('jf.busy');
    form.setAttribute('aria-busy', 'true');
    if (!store.REMOTE) await wait(450);
    try {
      await store.addJoin(entry);
      d.querySelector('.dlg-body').innerHTML = doneHTML(entry);
      d.querySelector('.done [data-close]').focus();
    } catch (err) {
      formErr.textContent = err.i18n ? t(...err.i18n) : err.message;
      submit.disabled = false;
      submit.textContent = t('jf.submit');
      form.removeAttribute('aria-busy');
    }
  });

  // No keyboard popping up over the form on phones.
  if (!window.matchMedia('(pointer: coarse)').matches) form.elements.name.focus();
}
