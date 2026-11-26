/* ------------------------------------------------------------------
   صفحه‌ی قوانین
------------------------------------------------------------------ */

(function () {
  'use strict';

  const M = window.Mafia;
  const { $ } = M.dom;

  let returnTo = 'home';

  function mount() {
    M.router.register('guide', $('#screen-guide'), null);

    $('#guide-back').addEventListener('click', () => {
      M.router.go(returnTo === 'game' ? 'game' : returnTo);
    });

    $('#guide-to-roles').addEventListener('click', () => {
      M.pages.rolesGuide.returnTo('guide');
      M.router.go('rolesGuide');
    });
  }

  M.pages = M.pages || {};
  M.pages.guide = {
    mount,
    returnTo(page) { returnTo = page || 'home'; },
  };
})();
