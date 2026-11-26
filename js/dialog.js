import { t } from './i18n.js';
import { icon } from './icons.js';

const dlg = () => document.getElementById('dlg');
let onCloseOnce = null;

export function openDialog({ html, theme = 'paper', wide = false, onClose = null }) {
  const d = dlg();
  if (d.open) d.close();
  d.className = `dlg dlg--${theme}${wide ? ' dlg--wide' : ''}`;
  d.innerHTML = `
    <button class="dlg-x" type="button" data-close aria-label="${t('close')}">${icon('close')}</button>
    <div class="dlg-body">${html}</div>`;
  onCloseOnce = onClose;
  d.showModal();
  d.scrollTop = 0;
  return d;
}

export function closeDialog() {
  const d = dlg();
  if (d?.open) d.close();
}

export function setupDialog() {
  const d = dlg();
  d.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) {
      d.close();
      return;
    }
    // A click on the backdrop lands on the dialog element itself, outside its box.
    if (e.target === d) {
      const r = d.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside) d.close();
    }
  });
  d.addEventListener('close', () => {
    const fn = onCloseOnce;
    onCloseOnce = null;
    fn?.();
  });
}
