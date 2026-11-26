// Join us or submit. Joining the team is our own form (views/joinform.js,
// also on the cover); submissions go through the Microsoft Form, which takes
// files. Without a form link set in data.js the page says that form is not
// open yet. #/join?apply opens the join form straight away, for a QR code.

import { JOIN_FORM } from '../data.js';
import { t } from '../i18n.js';
import { icon } from '../icons.js';
import { esc } from '../util.js';
import { topbar } from './chrome.js';
import { openJoin } from './joinform.js';

export const theme = 'paper';
export const titleKey = 'title.join';

export function render(root) {
  const submit = JOIN_FORM
    ? `<a class="btn btn--red join-cta" href="${esc(JOIN_FORM)}" target="_blank" rel="noopener noreferrer">${t('join.cta')}${icon('external')}</a>
       <p class="join-note">${esc(t('join.formNote'))}</p>`
    : `<p class="join-note join-note--closed">${esc(t('join.closed'))}</p>`;
  root.innerHTML = `
    <div class="page page--join">
      ${topbar({ links: [['#/events', t('nav.whatson')]] })}
      <header class="page-head">
        <h1 class="page-title">${esc(t('title.join'))}</h1>
        <p class="page-sub">${esc(t('join.sub'))}</p>
      </header>
      <div class="join-grid">
        <section class="join-block">
          <h2 class="join-h2">${esc(t('join.teamTitle'))}</h2>
          <p>${esc(t('join.teamText'))}</p>
          <div class="join-go"><button class="btn btn--red join-cta" type="button" data-join>${t('join.teamCta')}</button></div>
        </section>
        <section class="join-block">
          <h2 class="join-h2">${esc(t('join.submitTitle'))}</h2>
          <p>${esc(t('join.submitText'))}</p>
          <div class="join-go">${submit}</div>
        </section>
      </div>
    </div>`;

  const onClick = (e) => {
    if (e.target.closest('[data-join]')) openJoin();
  };
  root.addEventListener('click', onClick);
  if (new URLSearchParams(location.hash.split('?')[1] ?? '').has('apply')) {
    history.replaceState(null, '', '#/join');
    requestAnimationFrame(() => openJoin());
  }
  return () => root.removeEventListener('click', onClick);
}
