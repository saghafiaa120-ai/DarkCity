/* ------------------------------------------------------------------
   موتور روز — رأی‌گیری، شمارش، اعدام و وکالت
------------------------------------------------------------------ */

(function () {
  'use strict';

  const M = window.Mafia = window.Mafia || {};
  const { fa } = M.dom;

  function startVoting(state) {
    state.voteQueue = M.store.aliveIndexes().filter((i) => !state.roster[i].silent);
    state.voteIndex = 0;
    state.votes = {};
    state.picking = null;
    state.executed = null;
    state.pardoned = false;
    state.voteTop = 0;
    return state.voteQueue.length;
  }

  function recordVote(state, target) {
    if (target != null) state.votes[target] = (state.votes[target] || 0) + 1;
    state.voteIndex += 1;
    state.picking = null;
    return state.voteIndex < state.voteQueue.length;
  }

  function tally(state) {
    const entries = Object.entries(state.votes)
      .map(([i, c]) => ({ i: +i, c }))
      .sort((a, b) => b.c - a.c);

    state.voteTop = entries.length ? entries[0].c : 0;
    const leaders = entries.filter((e) => e.c === state.voteTop);
    state.executed = leaders.length === 1 ? leaders[0].i : null;
    state.picking = null;

    const lawyer = state.roster.findIndex((p) => p.alive && p.roleId === 'lawyer');
    const needPardon = state.executed != null && lawyer >= 0 && !state.used.lawyer;
    return needPardon ? 'pardon' : 'done';
  }

  function applyExecution(state) {
    const i = state.executed;
    let announcement = 'کسی اعدام نشد.';

    if (i != null && state.pardoned) {
      announcement = `وکیل حکم اعدام ${state.roster[i].name} را لغو کرد.`;
    } else if (i != null) {
      state.roster[i].alive = false;
      announcement = `${state.roster[i].name} با ${fa(state.voteTop)} رأی اعدام شد. نقش او ${M.rules.roleName(state.roster[i].roleId)} بود.`;
    }

    state.announcement = announcement;

    if (i != null && !state.pardoned && state.roster[i].roleId === 'joker') {
      state.pendingEnd = 'دلقک برنده شد؛ در روز با رأی شهر اعدام شد.';
    } else {
      state.pendingEnd = M.rules.checkEnd(state);
    }

    return announcement;
  }

  function usePardon(state) {
    state.used.lawyer = true;
    state.pardoned = true;
    return applyExecution(state);
  }

  function clearSilence(state) {
    state.roster.forEach((p) => { p.silent = false; });
  }

  M.day = { startVoting, recordVote, tally, applyExecution, usePardon, clearSilence };
})();
