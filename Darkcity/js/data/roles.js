/* ------------------------------------------------------------------
   دادهٔ نقش‌ها
   act همان توانایی شبانه‌ای است که موتور بازی از بازیکن می‌پرسد:
   mafiaKill | serialKill | save | protect | check | shoot | silence | kidnap
------------------------------------------------------------------ */

(function () {
  'use strict';

  const M = window.Mafia = window.Mafia || {};

  const TEAMS = {
    city:    { name: 'شهر',   color: '#5ad1ff' },
    mafia:   { name: 'مافیا', color: '#ff3b5c' },
    neutral: { name: 'مستقل', color: '#b487ff' },
  };

  const MAFIA_ROLES = ['mafia', 'godfather', 'kidnapper'];

  const ROLES = {
    citizen: {
      name: 'شهروند',
      team: 'city',
      icon: '<circle cx="12" cy="8.4" r="3.6"/><path d="M4.8 20.6c.6-4 3.6-6.4 7.2-6.4s6.6 2.4 7.2 6.4"/>',
      desc: 'سلاح تو رأی و استدلال است. توانایی شبانه‌ای نداری؛ در روز با شهر هم‌رأی شو و مافیا را پیدا کن.',
      night: null,
      act: null,
      max: 99,
      tip: 'بی‌صدا گوش کن، بلند استدلال کن.',
    },
    mafia: {
      name: 'مافیا',
      team: 'mafia',
      icon: '<path d="M4 10.2c0-1.7 3.6-3.1 8-3.1s8 1.4 8 3.1c0 3.5-3.6 6.1-8 6.1s-8-2.6-8-6.1z"/><circle cx="9" cy="10.6" r="1.1" fill="currentColor" stroke="none"/><circle cx="15" cy="10.6" r="1.1" fill="currentColor" stroke="none"/><path d="M8.5 14.2c2.2 1.3 4.8 1.3 7 0"/>',
      desc: 'هر شب با هم‌تیمی‌هایت یک نفر را از بازی حذف می‌کنید. در روز باید شهروند جلوه کنی و رأی‌ها را به سمت بی‌گناه‌ها ببری.',
      night: 'یک هدف را برای حذف انتخاب کنید.',
      act: 'mafiaKill',
      max: 99,
      tip: 'بهترین مافیا، آرام‌ترین آدم اتاق است.',
    },
    godfather: {
      name: 'پدرخوانده',
      team: 'mafia',
      icon: '<path d="M3.6 17.6h16.8"/><path d="M4.6 17.6 5.7 6.9l4.4 4.3L12 4.6l1.9 6.6 4.4-4.3 1.1 10.7z"/>',
      desc: 'رهبر مافیا. تصمیم نهایی شب با توست و اگر کارآگاه تو را استعلام کند، «غیرمافیا» نشان داده می‌شوی.',
      night: 'هدف شب را نهایی کن. استعلام کارآگاه روی تو «غیرمافیا» است.',
      act: 'mafiaKill',
      max: 1,
      tip: 'تو نامرئی‌ترین مافیای بازی هستی.',
    },
    kidnapper: {
      name: 'گروگان‌گیر',
      team: 'mafia',
      icon: '<circle cx="12" cy="12" r="8"/><path d="M8.6 10.4h.01M15.4 10.4h.01"/><path d="M8.4 15.4c2.2-1.4 5-1.4 7.2 0"/><path d="M12 4v2M4 12h2M18 12h2"/>',
      desc: 'عضو مافیا. هر شب یک نفر را گروگان می‌گیری؛ او روز بعد حق صحبت و رأی ندارد.',
      night: 'یک نفر را برای گروگان گرفتن انتخاب کن.',
      act: 'kidnap',
      max: 1,
      tip: 'گروگان گرفتنِ یک بازیکن پرحرف، نصف شهر را ساکت می‌کند.',
    },
    doctor: {
      name: 'دکتر',
      team: 'city',
      icon: '<path d="M9.6 3.6h4.8v6h6v4.8h-6v6H9.6v-6h-6V9.6h6z"/>',
      desc: 'هر شب یک بازیکن (حتی خودت) را انتخاب می‌کنی؛ اگر همان شب هدف شلیک شود، زنده می‌ماند.',
      night: 'یک نفر را برای نجات انتخاب کن.',
      act: 'save',
      max: 2,
      tip: 'دکتر خوب، هدف مافیا را حدس می‌زند.',
    },
    detective: {
      name: 'کارآگاه',
      team: 'city',
      icon: '<circle cx="10.5" cy="10.5" r="6.1"/><path d="m15 15 4.9 4.9"/>',
      desc: 'هر شب یک بازیکن را استعلام می‌کنی و نتیجه (مافیا یا غیرمافیا) را خصوصی می‌بینی.',
      night: 'یک نفر را استعلام کن.',
      act: 'check',
      max: 1,
      tip: 'نتیجه‌ات را در روز با احتیاط لو بده.',
    },
    bodyguard: {
      name: 'محافظ',
      team: 'city',
      icon: '<path d="M12 3.2 19.5 6v5.6c0 4.7-3.1 7.7-7.5 9.2-4.4-1.5-7.5-4.5-7.5-9.2V6z"/><path d="m9.4 12.1 1.9 1.9 3.4-3.7"/>',
      desc: 'هر شب از یک نفر محافظت می‌کنی؛ اگر او هدف شلیک شود، جای او می‌میری.',
      night: 'یک نفر را انتخاب کن تا در صورت شلیک، به جای او کشته شوی.',
      act: 'protect',
      max: 2,
      tip: 'با دکتر هماهنگ نباش، محافظت را تقسیم کنید.',
    },
    sniper: {
      name: 'تک‌تیرانداز',
      team: 'city',
      icon: '<circle cx="12" cy="12" r="7.4"/><path d="M12 1.6v4.8M12 17.6v4.8M1.6 12h4.8M17.6 12h4.8"/><circle cx="12" cy="12" r="2.1"/>',
      desc: 'دو گلوله داری. هر شب می‌توانی یک نفر را بزنی؛ اگر شهروند باشد، شهر یک نیرو از دست می‌دهد.',
      night: 'می‌توانی یک نفر را هدف بگیری یا این شب شلیک نکنی.',
      act: 'shoot',
      max: 2,
      tip: 'گلوله‌ات را برای یقین نگه دار.',
    },
    soldier: {
      name: 'سرباز',
      team: 'city',
      icon: '<path d="m12 3.4 2.7 5.4 5.9.9-4.3 4.2 1 5.8L12 17l-5.3 2.7 1-5.8L3.4 9.7l5.9-.9z"/>',
      desc: 'یک‌بار در برابر شلیک شبانه زنده می‌مانی و گرداننده این را فقط به تو اطلاع می‌دهد.',
      night: 'توانایی فعالی نداری؛ فقط سپر یک‌باره‌ات را به یاد داشته باش.',
      act: null,
      max: 2,
      tip: 'بعد از جان سالم بردن، حرف زدن ریسک است.',
    },
    witch: {
      name: 'جادوگر',
      team: 'city',
      icon: '<path d="M9.2 3.4h5.6v4.7l3.4 6.6c.7 1.6-.4 3.5-2.2 3.5H8c-1.8 0-2.9-1.9-2.2-3.5l3.4-6.6z"/><path d="M7.6 14.4h8.8"/>',
      desc: 'یک‌بار در بازی می‌توانی یک بازیکن را ساکت کنی؛ او تا پایان روز بعد حق صحبت و رأی ندارد.',
      night: 'می‌توانی یک نفر را ساکت کنی یا این شب صبر کنی.',
      act: 'silence',
      max: 1,
      tip: 'سکوت یک مافیای مشکوک، شهر را نجات می‌دهد.',
    },
    lawyer: {
      name: 'وکیل',
      team: 'city',
      icon: '<path d="M12 3.4v17"/><path d="M5 7.4h14"/><path d="M6.4 7.4 3.2 14h6.4z"/><path d="M17.6 7.4 14.4 14h6.4z"/><path d="M8.4 20.6h7.2"/>',
      desc: 'یک‌بار در بازی می‌تواند حکم اعدام همان روز را لغو کند و متهم را در بازی نگه دارد.',
      night: 'توانایی شبانه نداری؛ اگر روزی حکم اعدام را لغو کردی، برنامه اعلامش می‌کند.',
      act: null,
      max: 1,
      tip: 'حکمت را برای وقتی نگه دار که واقعاً مطمئنی.',
    },
    joker: {
      name: 'دلقک',
      team: 'neutral',
      icon: '<path d="M4.2 6.4h15.6v5.3c0 4-3.5 7.4-7.8 7.4S4.2 15.7 4.2 11.7z"/><circle cx="9.2" cy="11.1" r="1.1" fill="currentColor" stroke="none"/><circle cx="14.8" cy="11.1" r="1.1" fill="currentColor" stroke="none"/><path d="M8.7 14.6c1.9 1.5 4.7 1.5 6.6 0"/>',
      desc: 'این بازی را فقط برای خودت بازی می‌کنی؛ اگر در روز با رأی شهر اعدام شوی، تنها تو برنده‌ای.',
      night: 'توانایی شبانه نداری؛ در روز باید مشکوک به نظر برسی تا اعدام شوی.',
      act: null,
      max: 1,
      tip: 'باید اعدام شوی، نه کشته‌شده در شب.',
    },
    serialkiller: {
      name: 'قاتل زنجیره‌ای',
      team: 'neutral',
      icon: '<path d="M5 4.5 11.5 12 5 19.5"/><path d="M12 4.5 18.5 12 12 19.5"/><circle cx="19.5" cy="12" r="1.4" fill="currentColor" stroke="none"/>',
      desc: 'برای خودش بازی می‌کند. هر شب یک نفر را می‌کشد و وقتی شهر و مافیا هر دو از پا بیفتند، تنها برنده است.',
      night: 'یک نفر را برای حذف انتخاب کن.',
      act: 'serialKill',
      max: 1,
      tip: 'نه با شهر، نه با مافیا؛ فقط با خودت.',
    },
  };

  const ROLE_ORDER = [
    'citizen', 'mafia', 'godfather', 'kidnapper', 'doctor', 'detective',
    'bodyguard', 'sniper', 'soldier', 'witch', 'lawyer', 'joker', 'serialkiller',
  ];

  function roleIcon(roleId) {
    const role = ROLES[roleId];
    if (!role) return '';
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${role.icon}</svg>`;
  }

  M.roles = { TEAMS, ROLES, ROLE_ORDER, MAFIA_ROLES, roleIcon };
})();
