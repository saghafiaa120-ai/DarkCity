/* ------------------------------------------------------------------
   صفحه‌ی بازیکنان — تعداد نفرات و اسم‌ها
------------------------------------------------------------------ */

(function () {
  'use strict';

  const M = window.Mafia;
  const { $, fa, esc } = M.dom;
  const state = M.state;

  function renderPlayers() {
    $('#players-count').textContent = fa(state.players);
    $('#players-minus').disabled = state.players <= M.store.MIN_PLAYERS;
    $('#players-plus').disabled = state.players >= M.store.MAX_PLAYERS;
  }

  function renderNames() {
    M.store.ensureNames();
    $('#name-list').innerHTML = state.names.map((value, i) => `
      <label class="name-row">
        <span class="name-no">${fa(i + 1)}</span>
        <input class="name-input" type="text" maxlength="14" autocomplete="off"
               data-i="${i}" value="${esc(value)}" placeholder="بازیکن ${fa(i + 1)}"
               aria-label="نام بازیکن ${fa(i + 1)}">
      </label>`).join('');
  }

  function renderBalance() {
    const { total, city, mafia, neutral } = M.store.recount();
    const pct = (v) => `${total ? (v / total) * 100 : 0}%`;
    $('#bar-city').style.width = pct(city);
    $('#bar-mafia').style.width = pct(mafia);

    const parts = [`${fa(mafia)} مافیا`, `${fa(city)} شهر`];
    if (neutral) parts.push(`${fa(neutral)} مستقل`);
    $('#balance-text').textContent = parts.join(' • ');

    const note = $('#players-note');
    if (note) {
      note.textContent = total === state.players
        ? 'ترکیب فعلی با تعداد بازیکنان هم‌خوان است.'
        : `الان ${fa(total)} نقش برای ${fa(state.players)} نفر چیده شده؛ در مرحله‌ی بعد تنظیمش کن.`;
    }
  }

  function renderAll() {
    renderPlayers();
    renderNames();
    renderBalance();
  }

  function mount() {
    M.router.register('players', $('#screen-players'), renderAll);

    $('#players-minus').addEventListener('click', () => {
      M.store.setPlayers(state.players - 1);
      renderAll();
    });

    $('#players-plus').addEventListener('click', () => {
      M.store.setPlayers(state.players + 1);
      renderAll();
    });

    $('#name-list').addEventListener('input', (e) => {
      const input = e.target.closest('.name-input');
      if (!input) return;
      state.names[+input.dataset.i] = input.value;
    });

    $('#names-clear').addEventListener('click', () => {
      state.names = [];
      M.store.ensureNames();
      renderNames();
    });

    $('#players-back').addEventListener('click', () => M.router.go('home'));
    $('#players-next').addEventListener('click', () => M.router.go('roles'));
  }

  M.pages = M.pages || {};
  M.pages.players = { mount, renderAll, renderBalance, renderNames };
})();
