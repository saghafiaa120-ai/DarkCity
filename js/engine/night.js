/* ------------------------------------------------------------------
   موتور شب — Darkcity
   صف نوبت‌ها، هدف‌های مجاز، نتیجهٔ شب و متن اعلام صبح
------------------------------------------------------------------ */

(function () {
  'use strict';

  const M = window.Mafia = window.Mafia || {};
  const { ROLES } = M.roles;
  const { fa } = M.dom;

  const isMafia = (p) => !!(ROLES[p.roleId] && ROLES[p.roleId].team === 'mafia');
  const isMasonish = (p) => p.roleId === 'mason' || p.roleId === 'tyler' || p.mason === true;

  /* ------------------------------- صف نوبت‌ها ------------------------------ */
  function buildQueue(state) {
    const blocked = (p) => p.blockUntil != null && p.blockUntil >= state.round;
    const present = new Set(
      state.roster.filter((p) => p.alive && !blocked(p)).map((p) => p.roleId),
    );

    return M.nightFlow.filter((step) => {
      if (step.cond && !step.cond(state)) return false;
      if (step.every && state.round % step.every !== 0) return false;
      if (step.ammo && state.sniperShots <= 0) return false;
      if (step.maxUses && (state.uses[step.act] || 0) >= step.maxUses) return false;
      return step.roles.some((roleId) => present.has(roleId));
    });
  }

  /* ----------------------------- هدف‌های مجاز ------------------------------ */
  function targetsFor(state, step) {
    const act = step.act;
    const all = state.roster.map((_, i) => i);

    if (step.target === 'dead') return all.filter((i) => !state.roster[i].alive);

    return all.filter((i) => {
      const p = state.roster[i];
      if (!p.alive) return false;

      switch (act) {
        case 'mafiaKill':   return !isMafia(p);
        case 'mafiaSave':   return isMafia(p) && p.roleId !== 'mafiasurgeon';
        case 'save':        return state.round === 1 ? true : p.roleId === 'doctor';
        case 'antidote':    return p.roleId !== 'healer';
        case 'protect':     return p.roleId !== 'bodyguard';
        case 'insure':      return p.roleId !== 'champion';
        case 'check':       return p.roleId !== 'detective';
        case 'mason':       return !isMasonish(p);
        case 'shoot':       return p.roleId !== 'sniper';
        case 'sheriffShot': return p.roleId !== 'sheriff';
        case 'serialKill':  return p.roleId !== 'serialkiller';
        case 'zodiacKill':  return p.roleId !== 'zodiac';
        case 'infect':      return p.roleId !== 'infector';
        case 'silence':     return p.roleId !== 'witch';
        case 'hush':        return p.roleId !== 'silencer';
        case 'steal':       return p.roleId !== 'illusionist' && i !== state.lastStolen;
        case 'double':      return p.roleId !== 'bettor';
        case 'giveGun':     return p.roleId !== 'gunsmith';
        case 'guess':       return p.roleId !== 'avenger';
        case 'kidnap':      return !isMafia(p);
        default:            return true;
      }
    });
  }

  /* ------------------------------- متن صبح -------------------------------- */
  function dawnText(state) {
    const n = state.lastNight;
    const who = n.deaths.length
      ? `${n.deaths.join('، ')} ${n.deaths.length > 1 ? 'از بازی خارج شدند' : 'از بازی خارج شد'}.`
      : 'هیچ‌کس کشته نشد.';

    let text = `شب ${fa(state.round)} تمام شد. ${who}`;
    if (n.saved) text += ' دکتر یک نفر را نجات داد.';
    if (n.guard) text += ' محافظ جلوی حمله را گرفت.';
    if (n.shielded) text += ' سرباز یک‌بار جان سالم برد.';
    if (n.cured) text += ' طبیب پادزهر داد و مسموم نجات پیدا کرد.';
    if (n.poisoned) text += ` ${n.poisoned} مسموم شد.`;
    if (n.infected) text += ` ${n.infected} آلوده شد.`;
    if (n.masonsDead) text += ' تیم ماسونی به اشتباه مافیا را بیدار کرد و کامل حذف شد.';
    if (n.spyJoined) text += ' جاسوس به تیم ماسونی پیوست.';
    if (n.masonJoined) text += ` ${n.masonJoined} به تیم ماسونی پیوست.`;
    if (n.sheriffFell) text += ' کلانتر به شهروند شلیک کرد و خودش حذف شد.';
    if (n.zodiacFell) text += ' زودیاک به محافظ شلیک کرد و خودش بیرون رفت.';
    if (n.guessed) text += ' انتقام‌جو حدس درست زد و تفنگ گرفت.';
    if (n.gun) text += ` ${n.gun} تفنگ دریافت کرد.`;
    if (n.stolen) text += ` توانایی ${n.stolen} دزدیده شد.`;
    if (n.adopted) text += ` شهروند خاص نقش ${n.adopted} را به ارث برد.`;
    if (n.inherited) text += ` ${n.inherited} رهبر تیم مافیا شد.`;
    if (n.silenced.length) text += ` ${n.silenced.join('، ')} امروز حق رأی دادن ندارد.`;
    return text;
  }

  /* ------------------------------- نتیجه شب ------------------------------- */
  function resolve(state) {
    const picks = state.picks || {};
    const R = state.roster;
    const deaths = new Set();

    const notes = {
      saved: false, guard: false, shielded: false, cured: false,
      poisoned: null, infected: null, masonsDead: false, spyJoined: false,
      masonJoined: null, sheriffFell: false, zodiacFell: false,
      insured: null, stolen: null, doubled: null, gun: null,
      guessed: false, adopted: null, inherited: null,
    };

    const alive = (i) => i != null && R[i] && R[i].alive;

    // صاحب هر توانایی؛ برای تشخیص اینکه شعبده‌باز توانایی چه کسی را دزدیده
    const actor = {};
    R.forEach((p, i) => {
      if (!p.alive) return;
      const act = ROLES[p.roleId] && ROLES[p.roleId].act;
      if (act && actor[act] == null) actor[act] = i;
    });
    const stolen = alive(picks.steal) ? picks.steal : null;
    const blocked = (act) => stolen != null && actor[act] === stolen;

    /* ۱ — دزدی توانایی */
    if (stolen != null) {
      notes.stolen = R[stolen].name;
      state.lastStolen = stolen;
    }

    /* ۲ — دو برابر کردن توانایی */
    if (alive(picks.double) && !blocked('double')) {
      R[picks.double].doubled = true;
      notes.doubled = R[picks.double].name;
    }

    /* ۳ — بیمهٔ قهرمان */
    const insured = new Set();
    if (alive(picks.insure) && !blocked('insure')) insured.add(picks.insure);

    /* ۴ — سم: پادزهر و مرگ تأخیری */
    R.forEach((p, i) => {
      if (!p.poisoned) return;
      if (picks.antidote === i && !blocked('antidote')) {
        p.poisoned = false;
        notes.cured = true;
        return;
      }
      if (state.round > p.poisonRound) deaths.add(i);
    });

    /* ۵ — سم جدید؛ در این شب مافیا شلیک ندارد */
    let poisonTarget = null;
    if (alive(picks.poison) && !blocked('poison')) {
      poisonTarget = picks.poison;
      R[poisonTarget].poisoned = true;
      R[poisonTarget].poisonRound = state.round;
      notes.poisoned = R[poisonTarget].name;

      // اگر طبیب همان شب پادزهر بدهد، سم بی‌اثر می‌شود
      if (picks.antidote === poisonTarget && !blocked('antidote')) {
        R[poisonTarget].poisoned = false;
        notes.cured = true;
      }
    }

    /* ۶ — طاعون ناقل: لال → بی‌توان → بی‌رأی → مرگ */
    R.forEach((p, i) => {
      if (p.plague == null) return;
      if (state.round === p.plague + 2) { deaths.add(i); return; }
      if (state.round === p.plague + 1) p.noVote = true;
    });
    if (alive(picks.infect) && !blocked('infect')) {
      const t = R[picks.infect];
      t.plague = state.round;
      t.blockUntil = state.round + 1;
      t.silent = true;
      notes.infected = t.name;
    }

    /* ۷ — شلیک‌ها */
    function kill(i, kind) {
      if (!alive(i)) return;
      if (insured.has(i)) { notes.insured = R[i].name; return; }
      if (R[i].roleId === 'zodiac' && kind !== 'day') return;

      if (kind === 'mafia') {
        if (picks.save === i && !blocked('save')) { notes.saved = true; return; }
        if (picks.mafiaSave === i && !blocked('mafiaSave')) { notes.saved = true; return; }
        if (picks.protect === i && !blocked('protect')) {
          const g = R.findIndex((p) => p.alive && p.roleId === 'bodyguard');
          if (g >= 0 && g !== i) { kill(g, 'mafia'); return; }
        }
      }

      if (R[i].roleId === 'bodyguard' && !R[i].shield) {
        R[i].shield = true;
        notes.guard = true;
        return;
      }
      if (R[i].roleId === 'soldier' && !R[i].shield) {
        R[i].shield = true;
        notes.shielded = true;
        return;
      }
      deaths.add(i);
    }

    const mafiaTarget = poisonTarget != null ? null : picks.mafiaKill;
    if (alive(mafiaTarget)) kill(mafiaTarget, 'mafia');

    if (alive(picks.shoot) && !blocked('shoot')) kill(picks.shoot, 'shot');

    if (alive(picks.sheriffShot) && !blocked('sheriffShot')) {
      const t = picks.sheriffShot;
      if (isMafia(R[t])) {
        kill(t, 'shot');
      } else {
        const s = R.findIndex((p) => p.alive && p.roleId === 'sheriff');
        if (s >= 0) { kill(s, 'shot'); notes.sheriffFell = true; }
      }
    }

    if (alive(picks.serialKill) && !blocked('serialKill')) kill(picks.serialKill, 'serial');

    if (alive(picks.zodiacKill) && !blocked('zodiacKill')) {
      const t = picks.zodiacKill;
      if (R[t].roleId === 'bodyguard') {
        const z = R.findIndex((p) => p.alive && p.roleId === 'zodiac');
        if (z >= 0) { R[z].alive = false; deaths.add(z); notes.zodiacFell = true; }
      } else {
        kill(t, 'serial');
      }
    }

    /* ۸ — انتقام‌جو: حدس درست = تفنگ */
    if (mafiaTarget != null && picks.guess === mafiaTarget && deaths.has(mafiaTarget)) {
      const a = R.findIndex((p) => p.alive && p.roleId === 'avenger');
      if (a >= 0 && !blocked('guess')) {
        R[a].gun = true;
        R[a].gunReal = true;
        notes.guessed = true;
      }
    }

    /* ۹ — تفنگدار */
    if (alive(picks.giveGun) && !blocked('giveGun')) {
      const t = R[picks.giveGun];
      t.gun = true;
      t.gunReal = !!(state.gunGiven && state.gunGiven.index === picks.giveGun && state.gunGiven.real);
      notes.gun = t.name;
    }

    /* ۱۰ — تیم ماسونی */
    if (alive(picks.mason) && !blocked('mason')) {
      const t = R[picks.mason];
      if (isMafia(t)) {
        if (t.roleId === 'spy') {
          t.mason = true;
          notes.spyJoined = true;
        } else {
          R.forEach((p, i) => { if (p.alive && isMasonish(p)) deaths.add(i); });
          notes.masonsDead = true;
        }
      } else {
        t.mason = true;
        notes.masonJoined = t.name;
      }
    }

    /* ۱۱ — سکوت و گروگان */
    const silenced = [...new Set([picks.silence, picks.hush, picks.kidnap])]
      .filter((i) => i != null && R[i] && R[i].alive);
    silenced.forEach((i) => { R[i].silent = true; });

    /* ۱۲ — شهروند خاص */
    const aliveCount = R.filter((p) => p.alive).length;
    if (typeof picks.adopt === 'string' && ROLES[picks.adopt] && aliveCount <= R.length / 2) {
      const s = R.findIndex((p) => p.alive && p.roleId === 'special');
      if (s >= 0) {
        R[s].roleId = picks.adopt;
        notes.adopted = ROLES[picks.adopt].name;
      }
    }

    /* ۱۳ — اعمال مرگ‌ها */
    deaths.forEach((i) => { R[i].alive = false; });

    /* ۱۴ — جانشینی رئیس مافیا */
    const godAlive = R.some((p) => p.alive && p.roleId === 'godfather');
    const mistress = R.find((p) => p.alive && p.roleId === 'mistress');
    if (!godAlive && mistress && !mistress.isGodfather) {
      mistress.isGodfather = true;
      notes.inherited = mistress.name;
    }

    /* ۱۵ — پاک‌سازی نشانه‌های یک‌شبه */
    R.forEach((p) => { p.doubled = false; });

    state.lastNight = {
      deaths: [...deaths].map((i) => R[i].name),
      silenced: silenced.map((i) => R[i].name),
      ...notes,
    };

    state.phase = 'day';
    state.announcement = dawnText(state);
    state.pendingEnd = M.rules.checkEnd(state);

    return state.lastNight;
  }

  M.night = { buildQueue, targetsFor, resolve, dawnText };
})();
