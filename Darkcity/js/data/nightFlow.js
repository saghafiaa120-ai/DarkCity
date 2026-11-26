/* ------------------------------------------------------------------
   ترتیب نوبت‌های شب
   برای اضافه‌کردن نقش تازه: یک عضو جدید به همین آرایه اضافه کن،
   سپس act را در دادهٔ نقش‌ها (js/data/roles.js) ثبت کن.
------------------------------------------------------------------ */

(function () {
  'use strict';

  const M = window.Mafia = window.Mafia || {};

  M.nightFlow = [
    {
      act: 'mafiaKill',
      label: 'مافیا',
      roles: ['mafia', 'godfather'],
      hint: 'هدف شب را انتخاب کنید',
      optional: true,
    },
    {
      act: 'save',
      label: 'دکتر',
      roles: ['doctor'],
      hint: 'یک نفر را برای نجات انتخاب کن',
      optional: true,
    },
    {
      act: 'protect',
      label: 'محافظ',
      roles: ['bodyguard'],
      hint: 'از یک نفر محافظت کن',
      optional: true,
    },
    {
      act: 'check',
      label: 'کارآگاه',
      roles: ['detective'],
      hint: 'یک نفر را استعلام کن',
      reveal: true,
    },
    {
      act: 'shoot',
      label: 'تک‌تیرانداز',
      roles: ['sniper'],
      hint: 'هدف شلیک را انتخاب کن',
      optional: true,
      ammo: true,
    },
    {
      act: 'silence',
      label: 'جادوگر',
      roles: ['witch'],
      hint: 'یک نفر را ساکت کن',
      optional: true,
      once: 'witch',
    },
    {
      act: 'kidnap',
      label: 'گروگان‌گیر',
      roles: ['kidnapper'],
      hint: 'یک نفر را گروگان بگیر',
      optional: true,
    },
    {
      act: 'serialKill',
      label: 'قاتل زنجیره‌ای',
      roles: ['serialkiller'],
      hint: 'یک نفر را حذف کن',
      optional: true,
    },
  ];
})();
