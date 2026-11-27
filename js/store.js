/* ------------------------------------------------------------------
   وضعیت مشترک بازی + کمکی‌های اسم و ترکیب نقش‌ها — Darkcity
------------------------------------------------------------------ */

(function () {
  'use strict';

  const M = window.Mafia = window.Mafia || {};
  const { ROLES, ROLE_ORDER } = M.roles;

  const MIN_PLAYERS = 5;
  const MAX_PLAYERS = 20;

  const state = {
    players: 8,
    names: [],
    counts: {},
    openRoles: new Set(),

    roster: [],          // { name, roleId, alive, shield, silent, ... }
    index: 0,
    revealed: false,

    phase: 'night',
    round: 1,
    stage: '',
    lastStage: '',

    queue: [],
    qIndex: 0,
    picking: null,
    picks: {},
    used: {},            // یک‌بارمصرف‌ها: witch / lawyer / mayor / ...
    uses: {},            // شمارندهٔ مصرف هر act
    sniperShots: 0,
    guns: [],            // ۵ تفنگ تفنگدار: true = واقعی
    gunGiven: null,
    lastStolen: null,
    dayShot: null,

    voteQueue: [],
    voteIndex: 0,
    votes: {},
    voteTop: 0,
    executed: null,
    pardoned: false,
    pardonBy: null,

    lastNight: null,
    pendingEnd: null,
    announcement: '',
  };

  function emptyCounts() {
    const c = {};
    ROLE_ORDER.forEach((id) => { c[id] = 0; });
    return c;
  }

  function defaultCounts(n) {
    const c = emptyCounts();
    const mafiaTotal = Math.max(1, Math.round(n / 3));
    let rest = n;

    if (n >= 8) { c.godfather = 1; rest -= 1; }

    const mafiaPool = ['mafia', 'silencer', 'illusionist', 'spy', 'champion', 'poisoner', 'mafiasurgeon'];
    let m = mafiaTotal - (c.godfather ? 1 : 0);
    let mi = 0;
    while (m > 0 && mi < 60) {
      const id = mafiaPool[mi % mafiaPool.length];
      if ((c[id] || 0) < (ROLES[id].max || 1)) {
        c[id] = (c[id] || 0) + 1;
        m -= 1;
        rest -= 1;
      }
      mi += 1;
    }

    const cityPool = [
      'detective', 'doctor', 'bodyguard', 'healer', 'sheriff', 'witch',
      'gravedigger', 'gunsmith', 'avenger', 'mayor', 'martyr', 'bettor', 'soldier', 'sniper',
    ];
    let ci = 0;
    while (rest > 2 && ci < 80) {
      const id = cityPool[ci % cityPool.length];
      if ((c[id] || 0) < (ROLES[id].max || 1)) {
        c[id] = (c[id] || 0) + 1;
        rest -= 1;
      }
      ci += 1;
    }

    if (n >= 10 && rest >= 2) { c.joker = 1; rest -= 1; }

    c.citizen = rest;
    return c;
  }

  function ensureNames() {
    while (state.names.length < state.players) state.names.push('');
    state.names.length = state.players;
  }

  function playerName(i) {
    const raw = (state.names[i] || '').trim();
    return raw || `بازیکن ${M.dom.fa(i + 1)}`;
  }

  function setPlayers(n) {
    const next = Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, n));
    const changed = next !== state.players;
    state.players = next;
    ensureNames();
    if (changed) state.counts = defaultCounts(state.players);
    return changed;
  }

  function recount() {
    const totals = { city: 0, mafia: 0, neutral: 0 };
    let total = 0;
    ROLE_ORDER.forEach((id) => {
      const n = state.counts[id] || 0;
      if (!n) return;
      totals[ROLES[id].team] += n;
      total += n;
    });
    return { total, ...totals };
  }

  function resetRoster(roleIds) {
    state.roster = roleIds.map((roleId, i) => ({
      name: playerName(i),
      roleId,
      alive: true,
      shield: false,
      silent: false,
      noVote: false,
      gun: false,
      gunReal: false,
      mason: roleId === 'tyler',
      isGodfather: false,
      plague: null,
      poisoned: false,
      poisonRound: 0,
      blockUntil: null,
      doubled: false,
    }));
    state.index = 0;
    state.revealed = false;
    state.lastStage = '';
  }

  function aliveIndexes() {
    return state.roster.map((_, i) => i).filter((i) => state.roster[i].alive);
  }

  function aliveRoleIds() {
    return [...new Set(state.roster.filter((p) => p.alive).map((p) => p.roleId))];
  }

  function allRoles() {
    const ids = [];
    ROLE_ORDER.forEach((id) => {
      const n = state.counts[id] || 0;
      for (let i = 0; i < n; i++) ids.push(id);
    });
    return ids;
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function resetGuns() {
    // دو تفنگ واقعی و سه مشقی، با ترتیب تصادفی
    state.guns = shuffle([true, true, false, false, false]);
    state.gunGiven = null;
  }

  state.counts = defaultCounts(state.players);
  ensureNames();

  M.state = state;
  M.store = {
    MIN_PLAYERS,
    MAX_PLAYERS,
    emptyCounts,
    defaultCounts,
    ensureNames,
    playerName,
    setPlayers,
    recount,
    resetRoster,
    aliveIndexes,
    aliveRoleIds,
    allRoles,
    shuffle,
    resetGuns,
  };
})();
