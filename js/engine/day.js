/* ------------------------------------------------------------------
   موتور روز — رأی‌گیری، شمارش، اعدام، وکالت، شهردار، فدایی و تیر روزانه
------------------------------------------------------------------ */

(function () {
  'use strict';

  const M = window.Mafia = window.Mafia || {};
  const { fa } = M.dom;

  const aliveRole = (state, roleId) => state.roster.findIndex((p) => p.alive && p.roleId === roleId);

  function startVoting(state) {
    state.voteQueue = M.store.aliveIndexes()
      .filter((i) => !state.roster[i].silent && !state.roster[i].noVote);
    state.voteIndex = 0;
    state.votes = {};
    state.picking = null;
    state.executed = null;
    state.pardoned = false;
    state.pardonBy = null;
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

    const lawyer = aliveRole(state, 'lawyer');
    const needPardon = state.executed != null && lawyer >= 0 && !state.used.lawyer;
    return needPardon ? 'pardon' : 'done';
  }

  // چه کسی می‌تواند حکم را برگرداند؟
  function rescuers(state) {
    const i = state.executed;
    if (i == null) return [];
    const out = [];
    if (aliveRole(state, 'mayor') >= 0 && !state.used.mayor) out.push('mayor');
    const martyr = aliveRole(state, 'martyr');
    if (martyr >= 0 && martyr !== i) out.push('martyr');
    return out;
  }

  function applyExecution(state) {
    const i = state.executed;
    let announcement = 'کسی اعدام نشد.';

    if (i != null && state.pardoned) {
      const name = state.roster[i].name;
      if (state.pardonBy === 'martyr') {
        announcement = `فدایی خودش را به جای ${name} فدا کرد.`;
      } else if (state.pardonBy === 'mayor') {
        announcement = `شهردار رأی‌گیری را لغو کرد و ${name} در بازی ماند.`;
      } else {
        announcement = `وکیل حکم اعدام ${name} را لغو کرد.`;
      }
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
    state.pardonBy = 'lawyer';
    return applyExecution(state);
  }

  function useMayor(state) {
    state.used.mayor = true;
    state.pardoned = true;
    state.pardonBy = 'mayor';
    return applyExecution(state);
  }

  function useMartyr(state) {
    const martyr = aliveRole(state, 'martyr');
    if (martyr < 0) return '';
    state.roster[martyr].alive = false;
    state.used.martyr = true;
    state.pardoned = true;
    state.pardonBy = 'martyr';
    return applyExecution(state);
  }

  // تیر روزانهٔ انتقام‌جو یا تفنگدار
  function dayShoot(state, shooter, target) {
    const s = state.roster[shooter];
    const t = state.roster[target];
    if (!s || !s.alive || !t || !t.alive || !s.gun) return null;

    s.gun = false;
    const real = s.gunReal !== false;
    s.gunReal = false;

    if (!real) {
      state.announcement = `تفنگ ${s.name} مشقی بود و هیچ‌کس آسیب ندید.`;
      return { real: false, name: t.name };
    }

    t.alive = false;
    state.announcement = `${s.name} با تفنگ روزانه ${t.name} را زد. نقش او ${M.rules.roleName(t.roleId)} بود.`;
    if (t.roleId === 'joker') state.pendingEnd = 'دلقک برنده شد؛ در روز با شلیک حذف شد.';
    else state.pendingEnd = M.rules.checkEnd(state);
    return { real: true, name: t.name, role: M.rules.roleName(t.roleId) };
  }

  function clearSilence(state) {
    state.roster.forEach((p) => {
      p.silent = false;
      p.noVote = false;
    });
  }

  M.day = {
    startVoting, recordVote, tally, rescuers, applyExecution,
    usePardon, useMayor, useMartyr, dayShoot, clearSilence, aliveRole,
  };
})();
