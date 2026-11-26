/* ------------------------------------------------------------------
   صفحه‌ی بازی — ماشین مرحله‌ها (تحویل گوشی، انتخاب خصوصی، صبح، رأی)
------------------------------------------------------------------ */

(function () {
  'use strict';

  const M = window.Mafia;
  const { $, fa, esc, clock, hexToRgba } = M.dom;
  const { ROLES, TEAMS, MAFIA_ROLES, roleIcon } = M.roles;
  const state = M.state;
  const DAY_SECONDS = 150;

  let timer = null;

  /* --------------------------------- کمکی -------------------------------- */
  function stepRole(step) {
    const present = state.roster.find((p) => p.alive && step.roles.includes(p.roleId));
    return present ? present.roleId : step.roles[0];
  }

  function stepColor(step) {
    return TEAMS[ROLES[stepRole(step)].team].color;
  }

  function townHtml() {
    return `<div class="town">${state.roster.map((p) => `
      <div class="town-row ${p.alive ? '' : 'dead'}">
        <span class="town-name">${esc(p.name)}</span>
        <span class="town-state">${!p.alive ? 'حذف' : p.silent ? 'ساکت' : 'زنده'}</span>
      </div>`).join('')}</div>`;
  }

  const card = (inner, cls = '') => `<div class="stage-card ${cls}">${inner}</div>`;

  const ICON_TICK = M.icons.raw('tick', 14).replace('class="ic ic-tick"', 'class="tick ic ic-tick"');

  const targetGrid = (items) => `
    <div class="target-grid">
      ${items.map((i) => `<button class="target ${state.picking === i ? 'on' : ''}" data-pick="${i}">${state.picking === i ? ICON_TICK : ''}<span>${esc(state.roster[i].name)}</span></button>`).join('')}
    </div>`;

  /* --------------------------------- نماها -------------------------------- */
  const VIEW = {
    nightIntro: () => card(`
      <span class="stage-chip">شب ${fa(state.round)}</span>
      <h2 class="stage-title">چراغ‌ها خاموش شد</h2>
      <p class="stage-text">همه چشم‌ها را ببندید. گوشی فقط برای نوبت هر نقش باز می‌شود و بعد از انتخاب دوباره بسته می‌شود.</p>
      <button class="btn-primary wide" data-do="begin-night">شروع نوبت‌های شب</button>
      <button class="ghost-btn" data-do="end-early">پایان بازی و افشای نقش‌ها</button>
    `, 'center'),

    handoff: () => {
      const step = state.queue[state.qIndex];
      const color = stepColor(step);
      return card(`
        <span class="stage-chip">نوبت ${fa(state.qIndex + 1)} از ${fa(state.queue.length)}</span>
        <div class="stage-icon" style="--c:${color}; --cs:${hexToRgba(color, .16)}">${roleIcon(stepRole(step))}</div>
        <h2 class="stage-title">گوشی را به ${step.label} بده</h2>
        <p class="stage-text">هیچ‌کس نباید صفحه را ببیند.</p>
        <button class="btn-primary wide" data-do="open-act">من ${step.label} هستم</button>
      `, 'center');
    },

    act: () => {
      const step = state.queue[state.qIndex];
      const targets = M.night.targetsFor(state, step.act);
      return card(`
        <div class="private-bar">صفحه خصوصی — ${step.label}</div>
        <h2 class="stage-title">${step.hint}</h2>
        ${targets.length ? targetGrid(targets) : '<p class="stage-text">کسی برای انتخاب باقی نمانده است.</p>'}
        <button class="btn-primary wide" data-do="confirm-act" ${state.picking == null ? 'disabled' : ''}>تأیید انتخاب</button>
        <button class="ghost-btn" data-do="skip-act">این نوبت کاری نمی‌کنم</button>
      `);
    },

    reveal: () => {
      const target = state.roster[state.picking];
      const isMafia = MAFIA_ROLES.includes(target.roleId) && target.roleId !== 'godfather';
      return card(`
        <div class="private-bar">فقط کارآگاه</div>
        <span class="stage-chip">نتیجه استعلام</span>
        <h2 class="stage-title">${esc(target.name)}</h2>
        <div class="verdict ${isMafia ? 'bad' : 'good'}">${isMafia ? 'مافیا' : 'مافیا نیست'}</div>
        <p class="stage-text">صفحه را ببند تا کسی نتیجه را نبیند.</p>
        <button class="btn-primary wide" data-do="close-act">بستن و ادامه</button>
      `, 'center');
    },

    actDone: () => {
      const step = state.queue[state.qIndex];
      const target = state.picks[step.act] != null ? state.roster[state.picks[step.act]].name : null;
      return card(`
        <div class="private-bar">صفحه خصوصی — ${step.label}</div>
        <h2 class="stage-title">ثبت شد</h2>
        <p class="stage-text">${target ? `هدف: <b>${esc(target)}</b>` : 'این نوبت کاری انجام نشد.'}</p>
        <button class="btn-primary wide" data-do="close-act">بستن صفحه و ادامه</button>
      `, 'center');
    },

    dawn: () => {
      const n = state.lastNight;
      const lines = [];
      lines.push(n.deaths.length
        ? `<p class="stage-text"><b>${n.deaths.map(esc).join('، ')}</b> شب گذشته از بازی خارج ${n.deaths.length > 1 ? 'شدند' : 'شد'}.</p>`
        : '<p class="stage-text">این شب هیچ‌کس کشته نشد.</p>');
      if (n.saved) lines.push('<p class="note-line">دکتر یک نفر را نجات داد.</p>');
      if (n.guard) lines.push('<p class="note-line">محافظ به جای هدف شلیک، خودش کشته شد.</p>');
      if (n.shielded) lines.push('<p class="note-line">سرباز یک‌بار در برابر شلیک زنده ماند.</p>');
      if (n.silenced.length) lines.push(`<p class="note-line">${n.silenced.map(esc).join('، ')} امروز اجازه رأی دادن ندارد.</p>`);

      return card(`
        <span class="stage-chip">روز ${fa(state.round)}</span>
        <h2 class="stage-title">صبح شد</h2>
        ${lines.join('')}
        <button class="ghost-btn" data-do="speak">شنیدن با صدا</button>
        <button class="btn-primary wide" data-do="after-dawn">${state.pendingEnd ? 'دیدن نتیجه بازی' : 'شروع روز'}</button>
      `, 'center');
    },

    day: () => card(`
      <span class="stage-chip">روز ${fa(state.round)}</span>
      <h2 class="stage-title">بحث و گفت‌وگو</h2>
      <p class="stage-text">درباره شب گذشته حرف بزنید. تایمر را روشن کنید و در پایان، رأی‌گیری را شروع کنید.</p>
      ${townHtml()}
      <button class="btn-primary wide" data-do="start-vote">شروع رأی‌گیری</button>
      <button class="ghost-btn" data-do="end-early">پایان بازی و افشای نقش‌ها</button>
    `),

    voteHandoff: () => {
      const name = esc(state.roster[state.voteQueue[state.voteIndex]].name);
      return card(`
        <span class="stage-chip">رأی ${fa(state.voteIndex + 1)} از ${fa(state.voteQueue.length)}</span>
        <h2 class="stage-title">گوشی را به ${name} بده</h2>
        <p class="stage-text">رأی هر بازیکن مخفی ثبت می‌شود.</p>
        <button class="btn-primary wide" data-do="open-vote">من ${name} هستم</button>
      `, 'center');
    },

    vote: () => {
      const voter = state.voteQueue[state.voteIndex];
      const targets = state.roster
        .map((_, i) => i)
        .filter((i) => state.roster[i].alive && i !== voter);
      return card(`
        <div class="private-bar">رأی مخفی — ${esc(state.roster[voter].name)}</div>
        <h2 class="stage-title">به کی رأی می‌دهی؟</h2>
        ${targets.length ? targetGrid(targets) : '<p class="stage-text">کسی برای رأی دادن نیست.</p>'}
        <button class="btn-primary wide" data-do="confirm-vote" ${state.picking == null ? 'disabled' : ''}>ثبت رأی</button>
        <button class="ghost-btn" data-do="abstain">رأی نمی‌دهم</button>
      `);
    },

    voteDone: () => {
      const i = state.executed;
      const speak = '<button class="ghost-btn" data-do="speak">شنیدن با صدا</button>';
      const next = '<button class="btn-primary wide" data-do="after-vote">ادامه</button>';

      if (state.pardoned && i != null) {
        return card(`
          <span class="stage-chip">نتیجه رأی‌گیری</span>
          <h2 class="stage-title">حکم لغو شد</h2>
          <p class="stage-text">وکیل حکم اعدام <b>${esc(state.roster[i].name)}</b> را لغو کرد.</p>
          ${speak}${next}
        `, 'center');
      }

      if (i == null) {
        return card(`
          <span class="stage-chip">نتیجه رأی‌گیری</span>
          <h2 class="stage-title">کسی اعدام نشد</h2>
          <p class="stage-text">${state.voteTop ? 'رأی‌ها مساوی شد یا کسی رأی نداد.' : 'هیچ رأی معتبری ثبت نشد.'}</p>
          ${speak}${next}
        `, 'center');
      }

      return card(`
        <span class="stage-chip">نتیجه رأی‌گیری</span>
        <h2 class="stage-title">${esc(state.roster[i].name)} اعدام شد</h2>
        <p class="stage-text">با ${fa(state.voteTop)} رأی — نقش او <b>${M.rules.roleName(state.roster[i].roleId)}</b> بود.</p>
        ${speak}${next}
      `, 'center');
    },

    pardonHandoff: () => card(`
      <span class="stage-chip">حکم اعدام</span>
      <div class="stage-icon" style="--c:${TEAMS.city.color}; --cs:${hexToRgba(TEAMS.city.color, .16)}">${roleIcon('lawyer')}</div>
      <h2 class="stage-title">گوشی را به وکیل بده</h2>
      <p class="stage-text">حکم اعدام صادر شده؛ وکیل می‌تواند یک‌بار آن را لغو کند.</p>
      <button class="btn-primary wide" data-do="pardon-open">من وکیل هستم</button>
    `, 'center'),

    pardon: () => card(`
      <div class="private-bar">صفحه خصوصی — وکیل</div>
      <h2 class="stage-title">حکم اعدام ${esc(state.roster[state.executed].name)}</h2>
      <p class="stage-text">می‌توانی این یک‌بار از توانایی وکالت استفاده کنی و اعدام را لغو کنی.</p>
      <button class="btn-primary wide" data-do="pardon-yes">حکم را لغو می‌کنم</button>
      <button class="ghost-btn" data-do="pardon-no">نه، اعدام اجرا شود</button>
    `),
  };

  /* ------------------------------- رندر مرحله ------------------------------ */
  function render() {
    const stage = state.stage;
    const pill = $('#phase-pill');
    pill.textContent = `${state.phase === 'night' ? 'شب' : 'روز'} ${fa(state.round)}`;
    pill.className = `phase-pill ${state.phase === 'night' ? 'night' : 'day'}`;
    $('#timer-wrap').hidden = stage !== 'day';

    $('#stage').className = `stage stage-${stage}`;
    $('#stage').innerHTML = VIEW[stage] ? VIEW[stage]() : '';

    if (state.lastStage !== stage) {
      state.lastStage = stage;
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }

  /* --------------------------------- تایمر -------------------------------- */
  function updateTimer() {
    $('#timer-text').textContent = clock(timer.left);
    $('#timer-fill').style.width = `${timer.total ? (timer.left / timer.total) * 100 : 0}%`;
  }

  function setTimerIcon(running) {
    $('#timer-toggle').innerHTML = M.icons.raw(running ? 'pause' : 'play', 13).replace('class="ic', 'class="timer-ic ic');
    $('#timer-toggle').classList.toggle('is-running', running);
    $('#timer-toggle').setAttribute('aria-label', running ? 'توقف تایمر' : 'شروع تایمر');
  }

  /* -------------------------------- جریان بازی ------------------------------ */
  function start() {
    state.used = {};
    state.pardoned = false;
    state.executed = null;
    state.sniperShots = state.roster.filter((p) => p.roleId === 'sniper').length * 2;
    state.round = 1;
    startNight();
  }

  function startNight() {
    state.phase = 'night';
    state.picks = {};
    state.picking = null;
    state.lastNight = null;
    state.pendingEnd = null;
    state.announcement = '';
    state.queue = M.night.buildQueue(state);
    state.qIndex = 0;
    state.lastStage = '';
    state.stage = 'nightIntro';

    timer.stop();
    setTimerIcon(false);
    M.voice.stop();
    M.router.go('game');
    render();
  }

  function resolveNight() {
    M.night.resolve(state);
    state.stage = 'dawn';
    render();
  }

  function nextNightStep() {
    state.qIndex += 1;
    state.picking = null;

    if (state.qIndex >= state.queue.length) {
      resolveNight();
      return;
    }

    state.stage = 'handoff';
    render();
  }

  function startDay() {
    state.phase = 'day';
    state.stage = 'day';
    state.lastStage = '';
    timer.reset(DAY_SECONDS);
    timer.stop();
    setTimerIcon(false);
    render();
  }

  function finishVotes() {
    const result = M.day.tally(state);
    if (result === 'pardon') {
      state.stage = 'pardonHandoff';
      render();
      return;
    }
    M.day.applyExecution(state);
    state.stage = 'voteDone';
    render();
  }

  function halt() {
    timer.stop();
    M.voice.stop();
  }

  /* --------------------------------- کنش‌ها -------------------------------- */
  function act(name) {
    if (name !== 'speak') M.voice.stop();

    switch (name) {
      case 'begin-night':
        if (!state.queue.length) { resolveNight(); return; }
        state.picking = null;
        state.stage = 'handoff';
        render();
        break;

      case 'open-act':
        state.picking = null;
        state.stage = 'act';
        render();
        break;

      case 'confirm-act': {
        const step = state.queue[state.qIndex];
        if (state.picking == null) return;
        state.picks[step.act] = state.picking;
        if (step.ammo) state.sniperShots = Math.max(0, state.sniperShots - 1);
        if (step.once) state.used[step.once] = true;
        state.stage = step.reveal ? 'reveal' : 'actDone';
        render();
        break;
      }

      case 'skip-act':
        state.picking = null;
        state.stage = 'actDone';
        render();
        break;

      case 'close-act':
        nextNightStep();
        break;

      case 'after-dawn':
        if (state.pendingEnd) M.pages.end.show(state.pendingEnd);
        else startDay();
        break;

      case 'start-vote': {
        const voters = M.day.startVoting(state);
        timer.stop();
        setTimerIcon(false);
        if (!voters) {
          M.day.applyExecution(state);
          state.stage = 'voteDone';
          render();
          return;
        }
        state.stage = 'voteHandoff';
        render();
        break;
      }

      case 'open-vote':
        state.picking = null;
        state.stage = 'vote';
        render();
        break;

      case 'confirm-vote':
        if (state.picking == null) return;
        if (M.day.recordVote(state, state.picking)) {
          state.stage = 'voteHandoff';
          render();
        } else {
          finishVotes();
        }
        break;

      case 'abstain':
        if (M.day.recordVote(state, null)) {
          state.stage = 'voteHandoff';
          render();
        } else {
          finishVotes();
        }
        break;

      case 'after-vote':
        if (state.pendingEnd) { M.pages.end.show(state.pendingEnd); return; }
        M.day.clearSilence(state);
        state.round += 1;
        startNight();
        break;

      case 'pardon-open':
        state.stage = 'pardon';
        render();
        break;

      case 'pardon-yes':
        M.day.usePardon(state);
        state.stage = 'voteDone';
        render();
        break;

      case 'pardon-no':
        M.day.applyExecution(state);
        state.stage = 'voteDone';
        render();
        break;

      case 'speak':
        M.voice.say(state.announcement || 'چیزی برای خواندن نیست.');
        break;

      case 'end-early':
        M.pages.end.show('بازی به‌صورت دستی پایان داده شد.');
        break;

      default:
        break;
    }
  }

  /* --------------------------------- اتصال -------------------------------- */
  function mount() {
    timer = M.createTimer({
      onTick: updateTimer,
      onDone: () => setTimerIcon(false),
    });

    M.router.register('game', $('#screen-game'), null);

    $('#stage').addEventListener('click', (e) => {
      const pick = e.target.closest('[data-pick]');
      if (pick) {
        const i = +pick.dataset.pick;
        state.picking = state.picking === i ? null : i;
        if (navigator.vibrate) navigator.vibrate(8);
        render();
        return;
      }
      const btn = e.target.closest('[data-do]');
      if (btn) act(btn.dataset.do);
    });

    $('#timer-toggle').addEventListener('click', () => {
      if (timer.running) {
        timer.stop();
        setTimerIcon(false);
      } else {
        if (timer.left === 0) timer.reset(DAY_SECONDS);
        timer.start();
        setTimerIcon(true);
      }
    });

    $('#open-guide').addEventListener('click', () => {
      M.pages.guide.returnTo('game');
      halt();
      M.router.go('guide');
    });
  }

  M.pages = M.pages || {};
  M.pages.game = { mount, start, halt, render };
})();
