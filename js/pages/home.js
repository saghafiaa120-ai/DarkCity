/* ------------------------------------------------------------------
   صفحه‌ی خانه
------------------------------------------------------------------ */

(function () {
  'use strict';

  const M = window.Mafia;
  const { $ } = M.dom;

  function mount() {
    M.router.register('home', $('#screen-home'), () => {
      M.voice.stop();
    });

    $('#home-start').addEventListener('click', () => M.router.go('players'));

    $('#home-guide').addEventListener('click', () => {
      M.pages.guide.returnTo('home');
      M.router.go('guide');
    });

    $('#home-roles').addEventListener('click', () => {
      M.pages.rolesGuide.returnTo('home');
      M.router.go('rolesGuide');
    });
  }

  M.pages = M.pages || {};
  M.pages.home = { mount };
})();
