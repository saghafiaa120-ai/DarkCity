/* ------------------------------------------------------------------
   موتور شب
   صف نوبت‌ها، هدف‌های مجاز، نتیجه‌ی شب و متن اعلام صبح
------------------------------------------------------------------ */

(function () {
  'use strict';

  const M = window.Mafia = window.Mafia || {};
  const { ROLES, MAFIA_ROLES } = M.roles;
  const { fa } = M.dom;

  function buildQueue(state) {
    const present = new Set(state.roster.filter((p) => p.alive).map((p) => p.roleId));
    return M.nightFlow.filter((step) => {
      if (step.once && state.used[step.once]) return false;
      if (step.ammo && state.sniperShots <= 0) return false;
      return step.roles.some((roleId) => present.has(roleId));
    });
  }

  function targetsFor(state, act) {
    const blocked = new Set();
    state.roster.forEach((p, i) => {
      if (!p.alive) return;
      if (act === 'mafiaKill' && MAFIA_ROLES.includes(p.roleId)) blocked.add(i);
      if (act !== 'save' && ROLES[p.roleId].act === act) blocked.add(i);
    });
    return state.roster
      .map((_, i) => i)
      .filter((i) => state.roster[i].alive && !blocked.has(i));
  }

  function dawnText(state) {
    const n = state.lastNight;
    const who = n.deaths.length
      ? `${n.deaths.join('، ')} ${n.deaths.length > 1 ? 'کشته شدند' : 'کشته شد'}.`
      : 'هیچ‌کس کشته نشد.';

    let text = `شب ${fa(state.round)} تمام شد. ${who}`;
    if (n.saved) text += ' دکتر یک نفر را نجات داد.';
    if (n.guard) text += ' محافظ به جای هدف کشته شد.';
    if (n.shielded) text += ' سرباز یک‌بار جان سالم برد.';
    if (n.silenced.length) text += ` ${n.silenced.join('، ')} امروز اجازه رأی دادن ندارد.`;
    return text;
  }

  function resolve(state) {
    const picks = state.picks;
    const deaths = new Set();
    const notes = { saved: false, guard: false, shielded: false };

    const strikes = [picks.mafiaKill, picks.shoot, picks.serialKill].filter((v) => v != null);
    const guardIdx = state.roster.findIndex((x) => x.alive && x.roleId === 'bodyguard');

    strikes.forEach((target) => {
      if (!state.roster[target] || !state.roster[target].alive) return;
      if (picks.save === target) { notes.saved = true; return; }
      if (picks.protect === target && guardIdx >= 0 && guardIdx !== target) {
        deaths.add(guardIdx);
        notes.guard = true;
        return;
      }
      deaths.add(target);
    });

    [...deaths].forEach((i) => {
      const p = state.roster[i];
      if (p.roleId === 'soldier' && !p.shield) {
        p.shield = true;
        deaths.delete(i);
        notes.shielded = true;
      }
    });

    [...deaths].forEach((i) => { state.roster[i].alive = false; });

    const silenced = [...new Set([picks.silence, picks.kidnap])]
      .filter((i) => i != null && state.roster[i] && state.roster[i].alive);
    silenced.forEach((i) => { state.roster[i].silent = true; });

    state.lastNight = {
      deaths: [...deaths].map((i) => state.roster[i].name),
      silenced: silenced.map((i) => state.roster[i].name),
      ...notes,
    };

    state.phase = 'day';
    state.announcement = dawnText(state);
    state.pendingEnd = M.rules.checkEnd(state);

    return state.lastNight;
  }

  M.night = { buildQueue, targetsFor, resolve, dawnText };
})();
