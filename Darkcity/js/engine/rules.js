/* ------------------------------------------------------------------
   قوانین برد و باخت
------------------------------------------------------------------ */

(function () {
  'use strict';

  const M = window.Mafia = window.Mafia || {};
  const { ROLES } = M.roles;

  function teamCount(state, team) {
    return state.roster.filter((p) => p.alive && ROLES[p.roleId].team === team).length;
  }

  function checkEnd(state) {
    const alive = state.roster.filter((p) => p.alive).length;
    const mafia = teamCount(state, 'mafia');
    const city = teamCount(state, 'city');
    const neutral = teamCount(state, 'neutral');

    if (!alive) return 'همه بازیکنان حذف شدند.';
    if (!mafia && !neutral) return 'شهر برنده شد؛ همه مافیاها و مستقل‌ها حذف شدند.';
    if (!mafia && !city) return 'بازی به نفع بازیکنان مستقل تمام شد.';
    if (!mafia) return null;
    if (mafia >= city + neutral) return 'مافیا برنده شد؛ تعدادشان با بقیه برابر شد.';
    return null;
  }

  function roleName(roleId) {
    return ROLES[roleId] ? ROLES[roleId].name : '';
  }

  M.rules = { teamCount, checkEnd, roleName };
})();
