/* ------------------------------------------------------------------
   نقطه‌ی شروع برنامه
   هر صفحه فقط mount می‌شود؛ ناوبری با M.router انجام می‌گیرد.
------------------------------------------------------------------ */

(function () {
  'use strict';

  const M = window.Mafia;

  const pages = [
    M.pages.home,
    M.pages.players,
    M.pages.roles,
    M.pages.deal,
    M.pages.game,
    M.pages.guide,
    M.pages.rolesGuide,
    M.pages.end,
  ];

  pages.forEach((page) => page && page.mount && page.mount());

  M.icons.hydrate();
  M.router.go('home');
})();
