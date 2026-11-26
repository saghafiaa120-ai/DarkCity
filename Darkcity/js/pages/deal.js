/* ------------------------------------------------------------------
   صفحه‌ی پخش کارت
------------------------------------------------------------------ */

(function () {
  'use strict';

  const M = window.Mafia;
  const { $, fa, hexToRgba } = M.dom;
  const { ROLES, TEAMS, roleIcon } = M.roles;
  const state = M.state;

  function fillCard(roleId) {
    const role = ROLES[roleId];
    const team = TEAMS[role.team];
    const card = $('#role-card');
    card.style.setProperty('--c', team.color);
    card.style.setProperty('--cs', hexToRgba(team.color, .16));

    $('#card-team').textContent = team.name;
    $('#card-icon').innerHTML = roleIcon(roleId);
    $('#card-name').textContent = role.name;
    $('#card-desc').textContent = role.desc;
    $('#card-night').innerHTML = role.night
      ? `<b>در شب</b>${role.night}`
      : `<b>یادت باشد</b>${role.tip}`;
  }

  function renderDeal() {
    const total = state.roster.length;
    $('#deal-counter').textContent = `${fa(state.index + 1)} / ${fa(total)}`;
    $('#deal-progress').style.width = `${(state.index / total) * 100}%`;
    $('#deal-player').textContent = state.roster[state.index].name;

    $('#flip-card').classList.remove('revealed');
    $('#flip-card').setAttribute('aria-expanded', 'false');
    $('#deal-tap').classList.remove('hidden');

    const next = $('#deal-next');
    next.disabled = true;
    next.textContent = state.index === total - 1 ? 'شروع شب اول' : 'نقشمو دیدم، نفر بعد';

    state.revealed = false;
    fillCard(state.roster[state.index].roleId);
  }

  let busy = false;

  function reveal() {
    if (state.revealed || busy) return;
    state.revealed = true;
    $('#flip-card').classList.add('revealed');
    $('#flip-card').setAttribute('aria-expanded', 'true');
    $('#deal-tap').classList.add('hidden');
    $('#deal-next').disabled = false;
    if (navigator.vibrate) navigator.vibrate(14);
  }

  // کارت اول با محتوای فعلی بسته می‌شود و فقط بعد از پشت‌شدن کامل، نقش نفر بعد جایگزین می‌شود
  function next() {
    if (!state.revealed || busy) return;
    busy = true;

    $('#deal-next').disabled = true;
    $('#deal-tap').classList.add('hidden');

    const flip = $('#flip-card');
    flip.classList.remove('revealed');
    state.revealed = false;

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      flip.removeEventListener('transitionend', onEnd);

      state.index += 1;
      if (state.index >= state.roster.length) {
        busy = false;
        M.pages.game.start();
        return;
      }
      renderDeal();
      busy = false;
    };
    const onEnd = (e) => {
      if (e.target === flip.firstElementChild && e.propertyName === 'transform') finish();
    };

    flip.addEventListener('transitionend', onEnd);
    setTimeout(finish, 700);
  }

  function start() {
    const ids = M.store.allRoles();
    if (ids.length !== state.players) return;

    M.store.shuffle(ids);
    M.store.resetRoster(ids);
    M.router.go('deal');
    renderDeal();
  }

  function mount() {
    M.router.register('deal', $('#screen-deal'), null);

    const flip = $('#flip-card');
    flip.addEventListener('click', reveal);
    flip.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); reveal(); }
    });

    $('#deal-next').addEventListener('click', next);
    $('#deal-exit').addEventListener('click', () => M.router.go('roles'));
  }

  M.pages = M.pages || {};
  M.pages.deal = { mount, start };
})();
