/* ------------------------------------------------------------------
   ترتیب نوبت‌های شب — Darkcity
   هر مرحله یک act دارد که در js/data/roles.js به نقش وصل شده است.
   فیلدهای اختیاری:
     optional  → بازیکن می‌تواند آن شب کاری نکند
     reveal    → نتیجه روی همان گوشی نشان داده می‌شود
     every     → فقط شب‌های مضرب این عدد اجرا می‌شود
     maxUses   → چند بار در کل بازی قابل استفاده است
     ammo      → از تعداد تیر کم می‌شود
     target    → 'dead' یعنی فقط حذف‌شده‌ها قابل انتخاب‌اند
     kind      → 'role' یعنی انتخاب از میان نقش‌ها، نه بازیکن‌ها
     cond      → شرط اضافه برای نمایش مرحله
------------------------------------------------------------------ */

(function () {
  'use strict';

  const M = window.Mafia = window.Mafia || {};
  const { MAFIA_ROLES } = M.roles;

  M.nightFlow = [
    {
      act: 'mafiaKill',
      label: 'مافیا',
      roles: MAFIA_ROLES,
      hint: 'هدف شب را انتخاب کنید',
      optional: true,
      sound: 'mafia',
    },
    {
      act: 'poison',
      label: 'سم‌ساز',
      roles: ['poisoner'],
      hint: 'یک نفر را مسموم کن — امشب مافیا شلیک نمی‌کند',
      optional: true,
      maxUses: 1,
    },
    {
      act: 'mafiaSave',
      label: 'دکتر لکتر',
      roles: ['mafiasurgeon'],
      hint: 'یکی از مافیاها را درمان کن',
      optional: true,
    },
    {
      act: 'save',
      label: 'دکتر',
      roles: ['doctor'],
      hint: 'یک نفر را برای نجات انتخاب کن',
      optional: true,
      maxUses: 2,
    },
    {
      act: 'antidote',
      label: 'طبیب',
      roles: ['healer'],
      hint: 'پادزهر را به کی می‌دهی؟',
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
      act: 'insure',
      label: 'قهرمان',
      roles: ['champion'],
      hint: 'یک نفر را برای ۲۴ ساعت بیمه کن',
      optional: true,
      every: 2,
    },
    {
      act: 'check',
      label: 'کارآگاه',
      roles: ['detective'],
      hint: 'یک نفر را استعلام کن',
      reveal: true,
    },
    {
      act: 'grave',
      label: 'گورکن',
      roles: ['gravedigger'],
      hint: 'یکی از حذف‌شده‌ها را انتخاب کن',
      reveal: true,
      target: 'dead',
      maxUses: 2,
    },
    {
      act: 'mason',
      label: 'فراماسون',
      roles: ['mason'],
      hint: 'یک نفر را به تیم ماسونی دعوت کن',
      optional: true,
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
      act: 'sheriffShot',
      label: 'کلانتر',
      roles: ['sheriff'],
      hint: 'فقط مافیا را می‌زنی؛ اشتباه یعنی حذف خودت',
      optional: true,
      maxUses: 2,
    },
    {
      act: 'serialKill',
      label: 'قاتل زنجیره‌ای',
      roles: ['serialkiller'],
      hint: 'یک نفر را حذف کن',
      optional: true,
    },
    {
      act: 'zodiacKill',
      label: 'زودیاک',
      roles: ['zodiac'],
      hint: 'شب‌های زوج یک نفر را حذف کن',
      optional: true,
      every: 2,
    },
    {
      act: 'infect',
      label: 'ناقل',
      roles: ['infector'],
      hint: 'یک نفر را آلوده کن',
      optional: true,
    },
    {
      act: 'silence',
      label: 'جادوگر',
      roles: ['witch'],
      hint: 'یک نفر را ساکت کن',
      optional: true,
      maxUses: 1,
    },
    {
      act: 'hush',
      label: 'سایلنسر',
      roles: ['silencer'],
      hint: 'یک نفر را برای فردا ساکت کن',
      optional: true,
    },
    {
      act: 'steal',
      label: 'شعبده‌باز',
      roles: ['illusionist'],
      hint: 'توانایی یک نفر را امشب از او بگیر',
      optional: true,
    },
    {
      act: 'double',
      label: 'شرط‌بند',
      roles: ['bettor'],
      hint: 'توانایی یک نفر را دو برابر کن',
      optional: true,
      maxUses: 2,
    },
    {
      act: 'giveGun',
      label: 'تفنگدار',
      roles: ['gunsmith'],
      hint: 'به یک نفر تفنگ بده',
      optional: true,
      maxUses: 5,
    },
    {
      act: 'guess',
      label: 'انتقام‌جو',
      roles: ['avenger'],
      hint: 'حدس بزن امشب چه کسی کشته می‌شود',
      optional: true,
      maxUses: 1,
    },
    {
      act: 'kidnap',
      label: 'گروگان‌گیر',
      roles: ['kidnapper'],
      hint: 'یک نفر را گروگان بگیر',
      optional: true,
    },
    {
      act: 'adopt',
      label: 'شهروند خاص',
      roles: ['special'],
      hint: 'نقش یک شهروند حذف‌شده را انتخاب کن',
      kind: 'role',
      maxUses: 1,
      cond: (state) => {
        const alive = state.roster.filter((p) => p.alive).length;
        return alive > 0 && alive <= state.roster.length / 2;
      },
    },
  ];
})();
