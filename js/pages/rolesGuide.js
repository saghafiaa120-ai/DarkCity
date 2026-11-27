/* ------------------------------------------------------------------
   صفحه‌ی معرفی نقش‌ها
------------------------------------------------------------------ */

(function () {
  'use strict';

  const M = window.Mafia;
  const { $, fa, hexToRgba } = M.dom;
  const { ROLES, ROLE_ORDER, TEAMS, roleIcon } = M.roles;

  let returnTo = 'home';

  function render() {
    $('#guide-roles').innerHTML = ROLE_ORDER.map((id) => {
      const role = ROLES[id];
      const color = TEAMS[role.team].color;
      const maxTag = role.max > 1 && role.max < 99
        ? `<span class="g-max">تا ${fa(role.max)} نفر</span>`
        : '';
      return `
        <div class="g-role" style="--c:${color}; --cs:${hexToRgba(color, .15)}">
          <div class="g-ic">${roleIcon(id)}</div>
          <div class="g-body">
            <div class="g-top">
              <b>${role.name}</b>
              <span class="team-tag">${TEAMS[role.team].name}</span>
              ${maxTag}
            </div>
            <p>${role.desc}</p>
            ${role.tip ? `<p class="g-tip">${role.tip}</p>` : ''}
          </div>
        </div>`;
    }).join('');
  }

  function mount() {
    M.router.register('rolesGuide', $('#screen-roles-guide'), render);

    $('#roles-guide-back').addEventListener('click', () => M.router.go(returnTo));
  }

  M.pages = M.pages || {};
  M.pages.rolesGuide = {
    mount,
    returnTo(page) { returnTo = page || 'home'; },
  };
})();
