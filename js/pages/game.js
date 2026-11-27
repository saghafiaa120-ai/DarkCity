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

  function currentStep() {
    return state.queue[state.qIndex];
  }

  function townHtml() {
    return `<div class="town">${state.roster.map((p) => `
      <div class="town-row ${p.alive ? '' : 'dead'}">
        <span class="town-name">${esc(p.name)}</span>
        <span class="town-state">${!p.alive ? 'حذف' : p.silent ? 'ساکت' : p.noVote ? 'بی‌رأی' : 'زنده'}</span>
      </div>`).join('')}</div>`;
  }

  const card = (inner, cls = '') => `<div class="stage-card ${cls}">${inner}</div>`;

  const ICON_TICK = M.icons.raw('tick', 14).replace('class="ic ic-tick"', 'class="tick ic ic-tick"');

  const targetGrid = (items) => `
    <div class="target-grid">
      ${items.map((i) => `<button class="target ${state.picking === i ? 'on' : ''}" data-pick="${i}">${state.picking === i ? ICON_TICK : ''}<span>${esc(state.roster[i].name)}</span></button>`).join('')}
    </div>`;

  const roleGrid = (ids) => `
    <div class="target-grid">
      ${ids.map((id) => `<button class="target ${state.picking === id ? 'on' : ''}" data-rolepick="${id}">${state.picking === id ? ICON_TICK : ''}<span>${ROLES[id].name}</span></button>`).join('')}
    </div>`;

  function deadCityRoles() {
    const ids = [];
    state.roster.forEach((p) => {
      if (!p.alive && ROLES[p.roleId].team === 'city' && !ids.includes(p.roleId)) ids.push(p.roleId);
    });
    return ids;
  }

  function gunHolders() {
    return state.roster.map((_, i) => i).filter((i) => state.roster[i].alive && state.roster[i].gun);
  }

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
      const step = currentStep();
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
      const step = currentStep();
      const isRole = step.kind === 'role';
      const targets = isRole ? deadCityRoles() : M.night.targetsFor(state, step);
      const grid = isRole ? roleGrid(targets) : targetGrid(targets);
      const empty = isRole
        ? '<p class="stage-text">هیچ نقش شهروندی خارج نشده است.</p>'
        : '<p class="stage-text">کسی برای انتخاب باقی نمانده است.</p>';

      return card(`
        <div class="private-bar">صفحه خصوصی — ${step.label}</div>
        <h2 class="stage-title">${step.hint}</h2>
        ${targets.length ? grid : empty}
        <button class="btn-primary wide" data-do="confirm-act" ${state.picking == null ? 'disabled' : ''}>تأیید انتخاب</button>
        ${step.optional ? '<button class="ghost-btn" data-do="skip-act">این نوبت کاری نمی‌کنم</button>' : ''}
      `);
    },

    reveal: () => {
      const step = currentStep();
      const target = state.roster[state.picking];

      if (step.act === 'grave') {
        return card(`
          <div class="private-bar">فقط گورکن</div>
          <span class="stage-chip">نقش حذف‌شده</span>
          <h2 class="stage-title">${esc(target.name)}</h2>
          <div class="verdict good">${M.rules.roleName(target.roleId)}</div>
          <p class="stage-text">صفحه را ببند تا کسی نتیجه را نبیند.</p>
          <button class="btn-primary wide" data-do="close-act">بستن و ادامه</button>
        `, 'center');
      }

      if (step.act === 'mason') {
        const team = ROLES[target.roleId].team;
        let verdict = 'به تیم ماسونی پیوست';
        let cls = 'good';
        let note = 'او شهروند است و از این پس همدیگر را می‌شناسید.';
        if (team === 'mafia') {
          if (target.roleId === 'spy') {
            verdict = 'جاسوس بود و پیوست';
            note = 'تیم ماسونی حذف نمی‌شود، اما جاسوس نقش شما را می‌داند.';
          } else {
            verdict = 'مافیا بود';
            cls = 'bad';
            note = 'همهٔ ماسون‌ها امشب از بازی خارج می‌شوند.';
          }
        }
        return card(`
          <div class="private-bar">فقط فراماسون</div>
          <span class="stage-chip">نتیجهٔ دعوت</span>
          <h2 class="stage-title">${esc(target.name)}</h2>
          <div class="verdict ${cls}">${verdict}</div>
          <p class="stage-text">${note}</p>
          <button class="btn-primary wide" data-do="close-act">بستن و ادامه</button>
        `, 'center');
      }

      // کارآگاه
      const detective = state.roster.findIndex((p) => p.alive && p.roleId === 'detective');
      const exact = detective >= 0 && state.picks.double === detective;
      const mafia = MAFIA_ROLES.includes(target.roleId) && target.roleId !== 'godfather' && !target.isGodfather;
      return card(`
        <div class="private-bar">فقط کارآگاه</div>
        <span class="stage-chip">نتیجه استعلام</span>
        <h2 class="stage-title">${esc(target.name)}</h2>
        <div class="verdict ${mafia ? 'bad' : 'good'}">${exact ? M.rules.roleName(target.roleId) : (mafia ? 'مافیا' : 'مافیا نیست')}</div>
        <p class="stage-text">${exact ? 'توانایی تو دو برابر شده؛ نقش دقیق را می‌بینی.' : 'صفحه را ببند تا کسی نتیجه را نبیند.'}</p>
        <button class="btn-primary wide" data-do="close-act">بستن و ادامه</button>
      `, 'center');
    },

    actDone: () => {
      const step = currentStep();
      const raw = state.picks[step.act];
      let line = 'این نوبت کاری انجام نشد.';

      if (step.kind === 'role' && typeof raw === 'string') {
        line = `نقش جدید تو: <b>${M.rules.roleName(raw)}</b>`;
      } else if (raw != null && state.roster[raw]) {
        line = `هدف: <b>${esc(state.roster[raw].name)}</b>`;
      }

      if (step.act === 'giveGun' && state.gunGiven) {
        line += state.gunGiven.real
          ? ' — تفنگ <b>واقعی</b> بود.'
          : ' — تفنگ <b>مشقی</b> بود.';
      }

      return card(`
        <div class="private-bar">صفحه خصوصی — ${step.label}</div>
        <h2 class="stage-title">ثبت شد</h2>
        <p class="stage-text">${line}</p>
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
      if (n.guard) lines.push('<p class="note-line">محافظ جلوی حمله را گرفت.</p>');
      if (n.shielded) lines.push('<p class="note-line">سرباز یک‌بار در برابر شلیک زنده ماند.</p>');
      if (n.cured) lines.push('<p class="note-line">طبیب پادزهر داد و مسموم نجات پیدا کرد.</p>');
      if (n.poisoned) lines.push(`<p class="note-line">${esc(n.poisoned)} مسموم شد؛ اگر پادزهر نگیرد شب بعد می‌میرد.</p>`);
      if (n.infected) lines.push(`<p class="note-line">${esc(n.infected)} آلوده شد.</p>`);
      if (n.masonsDead) lines.push('<p class="note-line">تیم ماسونی به اشتباه مافیا را بیدار کرد و کامل حذف شد.</p>');
      if (n.spyJoined) lines.push('<p class="note-line">جاسوس به تیم ماسونی پیوست.</p>');
      if (n.masonJoined) lines.push(`<p class="note-line">${esc(n.masonJoined)} به تیم ماسونی پیوست.</p>`);
      if (n.sheriffFell) lines.push('<p class="note-line">کلانتر به شهروند شلیک کرد و خودش حذف شد.</p>');
      if (n.zodiacFell) lines.push('<p class="note-line">زودیاک به محافظ شلیک کرد و خودش بیرون رفت.</p>');
      if (n.guessed) lines.push('<p class="note-line">انتقام‌جو حدس درست زد و تفنگ گرفت.</p>');
      if (n.gun) lines.push(`<p class="note-line">${esc(n.gun)} تفنگ دریافت کرد.</p>`);
      if (n.stolen) lines.push(`<p class="note-line">توانایی ${esc(n.stolen)} دزدیده شد.</p>`);
      if (n.adopted) lines.push(`<p class="note-line">شهروند خاص نقش ${esc(n.adopted)} را به ارث برد.</p>`);
      if (n.inherited) lines.push(`<p class="note-line">${esc(n.inherited)} رهبر تیم مافیا شد.</p>`);
      if (n.silenced.length) lines.push(`<p class="note-line">${n.silenced.map(esc).join('، ')} امروز اجازه رأی دادن ندارد.</p>`);

      return card(`
        <span class="stage-chip">روز ${fa(state.round)}</span>
        <h2 class="stage-title">صبح شد</h2>
        ${lines.join('')}
        <button class="ghost-btn" data-do="speak">شنیدن با صدا</button>
        <button class="btn-primary wide" data-do="after-dawn">${state.pendingEnd ? 'دیدن نتیجه بازی' : 'شروع روز'}</button>
      `, 'center');
    },

    day: () => {
      const guns = gunHolders().length;
      return card(`
        <span class="stage-chip">روز ${fa(state.round)}</span>
        <h2 class="stage-title">بحث و گفت‌وگو</h2>
        <p class="stage-text">درباره شب گذشته حرف بزنید. تایمر را روشن کنید و در پایان، رأی‌گیری را شروع کنید.</p>
        ${townHtml()}
        ${guns ? '<button class="ghost-btn" data-do="gun-open">تیر روزانه</button>' : ''}
        <button class="btn-primary wide" data-do="start-vote">شروع رأی‌گیری</button>
        <button class="ghost-btn" data-do="end-early">پایان بازی و افشای نقش‌ها</button>
      `);
    },

    gunHandoff: () => card(`
      <span class="stage-chip">تیر روزانه</span>
      <div class="stage-icon" style="--c:${TEAMS.city.color}; --cs:${hexToRgba(TEAMS.city.color, .16)}">${roleIcon('gunsmith')}</div>
      <h2 class="stage-title">گوشی را به صاحب تفنگ بده</h2>
      <p class="stage-text">هر کس تفنگ گرفته، قبل از شروع رأی‌گیری یک تیر دارد.</p>
      <button class="btn-primary wide" data-do="gun-shooter">من تفنگ دارم</button>
      <button class="ghost-btn" data-do="gun-cancel">فعلاً شلیک نمی‌کنیم</button>
    `, 'center'),

    gunShooter: () => card(`
      <div class="private-bar">صفحه خصوصی — صاحب تفنگ</div>
      <h2 class="stage-title">تو کی هستی؟</h2>
      ${targetGrid(gunHolders())}
      <button class="btn-primary wide" data-do="gun-target" ${state.picking == null ? 'disabled' : ''}>ادامه</button>
    `),

    gunTarget: () => {
      const shooter = state.gunShooter;
      const targets = state.roster.map((_, i) => i).filter((i) => state.roster[i].alive && i !== shooter);
      return card(`
        <div class="private-bar">صفحه خصوصی — ${esc(state.roster[shooter].name)}</div>
        <h2 class="stage-title">به کی شلیک می‌کنی؟</h2>
        ${targetGrid(targets)}
        <button class="btn-primary wide" data-do="gun-confirm" ${state.picking == null ? 'disabled' : ''}>شلیک</button>
        <button class="ghost-btn" data-do="gun-cancel">منصرف شدم</button>
      `);
    },

    gunDone: () => {
      const r = state.dayShot;
      return card(`
        <span class="stage-chip">تیر روزانه</span>
        <h2 class="stage-title">${r && r.real ? `${esc(r.name)} حذف شد` : 'تفنگ مشقی بود'}</h2>
        <p class="stage-text">${r && r.real
          ? `نقش او <b>${esc(r.role)}</b> بود.`
          : 'هیچ‌کس آسیب ندید.'}</p>
        <button class="btn-primary wide" data-do="gun-done">بستن و ادامه</button>
      `, 'center');
    },

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
        const by = state.pardonBy;
        const title = by === 'mayor' ? 'شهردار حکم را لغو کرد' : by === 'martyr' ? 'فدایی خودش را فدا کرد' : 'حکم لغو شد';
        const text = by === 'martyr'
          ? `فدایی به جای <b>${esc(state.roster[i].name)}</b> از بازی خارج شد.`
          : `<b>${esc(state.roster[i].name)}</b> در بازی ماند.`;
        return card(`
          <span class="stage-chip">نتیجه رأی‌گیری</span>
          <h2 class="stage-title">${title}</h2>
          <p class="stage-text">${text}</p>
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

    rescueHandoff: () => card(`
      <span class="stage-chip">حکم اعدام</span>
      <h2 class="stage-title">${esc(state.roster[state.executed].name)} محکوم شده است</h2>
      <p class="stage-text">اگر شهردار یا فدایی هستی، حالا وقت اعلام است. گوشی را به او بده.</p>
      ${M.day.rescuers(state).includes('mayor') ? '<button class="btn-primary wide" data-do="rescue-mayor">من شهردار هستم</button>' : ''}
      ${M.day.rescuers(state).includes('martyr') ? '<button class="ghost-btn wide" data-do="rescue-martyr">من فدایی هستم</button>' : ''}
      <button class="ghost-btn" data-do="rescue-skip">حکم اجرا شود</button>
    `, 'center'),

    rescueMayor: () => card(`
      <div class="private-bar">صفحه خصوصی — شهردار</div>
      <h2 class="stage-title">رأی‌گیری را ملغی می‌کنی؟</h2>
      <p class="stage-text">این تنها بار استفاده از قدرت شهرداری است. ${esc(state.roster[state.executed].name)} در بازی می‌ماند.</p>
      <button class="btn-primary wide" data-do="rescue-yes-mayor">بله، حکم را لغو کن</button>
      <button class="ghost-btn" data-do="rescue-skip">نه، اعدام شود</button>
    `),

    rescueMartyr: () => card(`
      <div class="private-bar">صفحه خصوصی — فدایی</div>
      <h2 class="stage-title">خودت را فدا می‌کنی؟</h2>
      <p class="stage-text">تو از بازی خارج می‌شوی و ${esc(state.roster[state.executed].name)} زنده می‌ماند.</p>
      <button class="btn-primary wide" data-do="rescue-yes-martyr">بله، فدایی می‌شوم</button>
      <button class="ghost-btn" data-do="rescue-skip">نه، اعدام شود</button>
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
    state.uses = {};
    state.pardoned = false;
    state.pardonBy = null;
    state.executed = null;
    state.gunShooter = null;
    state.dayShot = null;
    state.gunGiven = null;
    state.lastStolen = null;
    state.sniperShots = state.roster.filter((p) => p.roleId === 'sniper').length * 2;
    state.round = 1;
    M.store.resetGuns();
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
    M.sound.play('night');
  }

  function playStepSound(step) {
    if (step && step.sound) M.sound.play(step.sound);
  }

  function resolveNight() {
    M.night.resolve(state);
    state.stage = 'dawn';
    render();
    M.sound.play('dawn');
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
    playStepSound(currentStep());
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

  function afterTally() {
    if (M.day.rescuers(state).length) {
      state.stage = 'rescueHandoff';
      render();
      return;
    }
    M.day.applyExecution(state);
    state.stage = 'voteDone';
    render();
  }

  function finishVotes() {
    const result = M.day.tally(state);
    if (result === 'pardon') {
      state.stage = 'pardonHandoff';
      render();
      return;
    }
    afterTally();
  }

  function halt() {
    timer.stop();
    M.voice.stop();
  }

  /* --------------------------------- کنش‌ها -------------------------------- */
  function act(name) {
    if (name !== 'speak') M.voice.stop();

    switch (name) {
      case 'begin-night': {
        if (!state.queue.length) { resolveNight(); return; }
        state.picking = null;
        state.stage = 'handoff';
        render();
        playStepSound(currentStep());
        break;
      }

      case 'open-act':
        state.picking = null;
        state.stage = 'act';
        render();
        break;

      case 'confirm-act': {
        const step = currentStep();
        if (state.picking == null) return;
        state.picks[step.act] = state.picking;
        if (step.ammo) state.sniperShots = Math.max(0, state.sniperShots - 1);
        if (step.maxUses) state.uses[step.act] = (state.uses[step.act] || 0) + 1;
        if (step.act === 'giveGun') {
          const real = state.guns.length ? state.guns.pop() === true : false;
          state.gunGiven = { index: state.picking, real };
        }
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
        afterTally();
        break;

      case 'rescue-mayor':
        state.stage = 'rescueMayor';
        render();
        break;

      case 'rescue-martyr':
        state.stage = 'rescueMartyr';
        render();
        break;

      case 'rescue-yes-mayor':
        M.day.useMayor(state);
        state.stage = 'voteDone';
        render();
        break;

      case 'rescue-yes-martyr':
        M.day.useMartyr(state);
        state.stage = 'voteDone';
        render();
        break;

      case 'rescue-skip':
        M.day.applyExecution(state);
        state.stage = 'voteDone';
        render();
        break;

      case 'gun-open':
        state.stage = 'gunHandoff';
        state.picking = null;
        render();
        break;

      case 'gun-shooter':
        state.picking = null;
        state.stage = 'gunShooter';
        render();
        break;

      case 'gun-target':
        if (state.picking == null) return;
        state.gunShooter = state.picking;
        state.picking = null;
        state.stage = 'gunTarget';
        render();
        break;

      case 'gun-confirm':
        if (state.picking == null) return;
        state.dayShot = M.day.dayShoot(state, state.gunShooter, state.picking);
        state.picking = null;
        state.stage = 'gunDone';
        render();
        break;

      case 'gun-cancel':
        state.picking = null;
        state.stage = 'day';
        render();
        break;

      case 'gun-done':
        state.picking = null;
        state.stage = 'day';
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
      const rolePick = e.target.closest('[data-rolepick]');
      if (rolePick) {
        const id = rolePick.dataset.rolepick;
        state.picking = state.picking === id ? null : id;
        if (navigator.vibrate) navigator.vibrate(8);
        render();
        return;
      }

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
