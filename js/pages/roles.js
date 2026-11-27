/* ------------------------------------------------------------------
   صفحه‌ی چیدن نقش‌ها
------------------------------------------------------------------ */

(function () {
  'use strict';

  const M = window.Mafia;
  const { $, fa, hexToRgba } = M.dom;
  const { ROLES, ROLE_ORDER, TEAMS, roleIcon } = M.roles;
  const state = M.state;

  const ICON_MINUS = M.icons.raw('minus', 15);
  const ICON_PLUS = M.icons.raw('plus', 15);

  function renderRoles() {
    $('#role-list').innerHTML = ROLE_ORDER.map((id) => {
      const role = ROLES[id];
      const count = state.counts[id] || 0;
      const color = TEAMS[role.team].color;
      const atMax = count >= (role.max || 1);
      return `
        <div class="role-row ${count ? 'on' : ''} ${state.openRoles.has(id) ? 'open' : ''}"
             data-role="${id}" style="--c:${color}; --cs:${hexToRgba(color, .16)}">
          <div class="role-main" data-act="info">
            <div class="role-ic">${roleIcon(id)}</div>
            <div class="role-text">
              <div class="role-top"><b>${role.name}</b><span class="team-tag">${TEAMS[role.team].name}</span></div>
              <p>${role.desc}</p>
            </div>
          </div>
          <div class="counter">
            <button data-act="dec" aria-label="کم کردن ${role.name}" ${count ? '' : 'disabled'}>${ICON_MINUS}</button>
            <span>${fa(count)}</span>
            <button data-act="inc" aria-label="زیاد کردن ${role.name}" ${atMax ? 'disabled' : ''}>${ICON_PLUS}</button>
          </div>
        </div>`;
    }).join('');
  }

  function renderSummary() {
    const { total, city, mafia } = M.store.recount();
    $('#picked-total').textContent = `${fa(total)} / ${fa(state.players)}`;

    const note = $('#picked-note');
    const start = $('#roles-start');

    if (total === state.players && mafia > 0 && city > 0) {
      note.textContent = 'همه نقش‌ها چیده شد';
      note.className = 'start-note';
      start.disabled = false;
    } else if (total > state.players) {
      note.textContent = `${fa(total - state.players)} نقش اضافه است`;
      note.className = 'start-note bad';
      start.disabled = true;
    } else if (total < state.players) {
      note.textContent = `${fa(state.players - total)} نقش کم است`;
      note.className = 'start-note bad';
      start.disabled = true;
    } else {
      note.textContent = 'حداقل یک مافیا و یک شهروند لازم است';
      note.className = 'start-note bad';
      start.disabled = true;
    }
  }

  function renderAll() {
    renderRoles();
    renderSummary();
  }

  function mount() {
    M.router.register('roles', $('#screen-roles'), renderAll);

    $('#role-list').addEventListener('click', (e) => {
      const row = e.target.closest('.role-row');
      if (!row) return;
      const id = row.dataset.role;
      const act = e.target.closest('[data-act]')?.dataset.act;

      if (act === 'inc' || act === 'dec') {
        const max = ROLES[id].max || 1;
        const current = state.counts[id] || 0;
        state.counts[id] = Math.min(max, Math.max(0, current + (act === 'inc' ? 1 : -1)));
        renderAll();
        return;
      }

      if (act === 'info') {
        if (state.openRoles.has(id)) state.openRoles.delete(id);
        else state.openRoles.add(id);
        row.classList.toggle('open');
      }
    });

    $('#roles-suggest').addEventListener('click', () => {
      state.counts = M.store.defaultCounts(state.players);
      renderAll();
    });

    $('#roles-back').addEventListener('click', () => M.router.go('players'));
    $('#roles-start').addEventListener('click', () => M.pages.deal.start());
  }

  M.pages = M.pages || {};
  M.pages.roles = { mount, renderAll };
})();
