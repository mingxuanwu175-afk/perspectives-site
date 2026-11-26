// Shared top bar for the inner pages, with the language switch at the end.
import { langSwitch, t } from '../i18n.js';

export function topbar({ links = [], right = '' } = {}) {
  const nav = links.length
    ? `<nav class="bar-nav">${links.map(([href, label]) => `<a href="${href}">${label}</a>`).join('')}</nav>`
    : '';
  return `<header class="bar">
    <a class="brand" href="#/" aria-label="${t('nav.home')}"><img class="brand-mark" src="img/P_topbar_96.png" alt="" width="70" height="96">Perspectives</a>
    ${nav}
    <div class="bar-end">${right}${langSwitch()}</div>
  </header>`;
}
