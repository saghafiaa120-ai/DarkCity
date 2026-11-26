/* ------------------------------------------------------------------
   صفحه‌ی پایان بازی
------------------------------------------------------------------ */

(function () {
  'use strict';

  const M = window.Mafia;
  const { $, fa, esc, hexToRgba } = M.dom;
  const { ROLES, TEAMS, roleIcon } = M.roles;
  const state = M.state;

  function render(reason) {
    const alive = state.roster.filter((p) => p.alive).length;

    $('#end-reason').textContent = reason || 'بازی تمام شد.';
    $('#end-meta').textContent =
      `${fa(alive)} نفر زنده از ${fa(state.roster.length)} نفر — پایان ${state.phase === 'day' ? 'روز' : 'شب'} ${fa(state.round)}`;

    $('#end-list').innerHTML = state.roster.map((p) => {
      const role = ROLES[p.roleId];
      const color = TEAMS[role.team].color;
      return `<li class="${p.alive ? '' : 'dead'}" style="--c:${color}; --cs:${hexToRgba(color, .16)}">
        <span class="p-name">${esc(p.name)}<small>${p.alive ? 'زنده' : 'خارج شده'}</small></span>
        <span class="r">${roleIcon(p.roleId)}${role.name}</span>
      </li>`;
    }).join('');
  }

  function show(reason) {
    M.pages.game.halt();
    render(reason);
    M.router.go('end');
  }

  function mount() {
    M.router.register('end', $('#screen-end'), null);

    $('#end-again').addEventListener('click', () => M.pages.deal.start());
    $('#end-roles').addEventListener('click', () => M.router.go('roles'));
    $('#end-home').addEventListener('click', () => M.router.go('home'));
  }

  M.pages = M.pages || {};
  M.pages.end = { mount, show, render };
})();
