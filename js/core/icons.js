/* ------------------------------------------------------------------
   مجموعهٔ آیکون‌های یکسان
   همه با ضخامت خط ۱٫۸ و انتهای گرد کشیده می‌شوند تا در کل برنامه هم‌خانواده باشند.
   در HTML با data-icon استفاده می‌شود و در JS با M.icons.raw()
------------------------------------------------------------------ */

(function () {
  'use strict';

  const M = window.Mafia = window.Mafia || {};

  const PATHS = {
    // در RTL، فلش برگشت به سمت راست است
    back: '<path d="M9.5 6l6 6-6 6"/>',
    help: '<circle cx="12" cy="12" r="8.6"/><path d="M9.7 9.3a2.4 2.4 0 1 1 3.5 2.2c-.8.5-1.2 1.1-1.2 2"/><circle cx="12" cy="16.9" r=".95" fill="currentColor" stroke="none"/>',
    tick: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    minus: '<path d="M5 12h14"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    users: '<circle cx="9" cy="8.6" r="3.4"/><path d="M3.4 20c.5-3.6 2.9-5.8 5.6-5.8s5.1 2.2 5.6 5.8"/><path d="M16 5.6a3.2 3.2 0 0 1 0 6.2M17.6 14.6c1.9.6 3.1 2.5 3.5 5.4"/>',
    restart: '<path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 4.6V9h-4.4"/>',
    play: '<path d="M8.2 5.6v12.8l10.4-6.4z" fill="currentColor" stroke="none"/>',
    pause: '<rect x="7" y="5.6" width="3.6" height="12.8" rx="1" fill="currentColor" stroke="none"/><rect x="13.4" y="5.6" width="3.6" height="12.8" rx="1" fill="currentColor" stroke="none"/>',
  };

  function raw(name, size) {
    const path = PATHS[name];
    if (!path) return '';
    const s = size || 18;
    return `<svg class="ic ic-${name}" viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
  }

  // هر عنصری که data-icon دارد، آیکون را به ابتدای متنش می‌گیرد
  function hydrate(root) {
    (root || document).querySelectorAll('[data-icon]').forEach((el) => {
      if (el.dataset.iconReady) return;
      el.insertAdjacentHTML('afterbegin', raw(el.dataset.icon, Number(el.dataset.iconSize) || 16));
      el.dataset.iconReady = '1';
      el.classList.add('has-icon');
    });
  }

  M.icons = { raw, hydrate, PATHS };
})();
