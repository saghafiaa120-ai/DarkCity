/* ------------------------------------------------------------------
   سرویس صدا — پخش مخفی فایل‌های صوتی
   هیچ پخش‌کننده یا دکمه‌ای در صفحه ساخته نمی‌شود؛ فقط Audio در حافظه.
------------------------------------------------------------------ */

(function () {
  'use strict';

  const M = window.Mafia = window.Mafia || {};

  const BASE = 'Music/';
  const FILES = {
    night: 'night.wav',        // شب می‌شه و شهر به خواب می‌ره
    dawn: 'dawn.wav',          // صبح شد، شهر بیدار شه
    mafia: 'mafia.wav',        // مافیا بیدار شه، به کی شلیک می‌کنه؟
    cityWin: 'city-win.wav',   // تبریک می‌گم، شهروندان برنده شدن
    mafiaWin: 'mafia-win.wav', // تبریک می‌گم، مافیا برنده شد
  };

  const cache = {};
  let current = null;
  let unlocked = false;

  function build(key) {
    const a = new Audio(encodeURI(BASE + FILES[key]));
    a.preload = 'auto';
    a.volume = 0.9;
    return a;
  }

  function preload() {
    Object.keys(FILES).forEach((key) => {
      if (!cache[key]) cache[key] = build(key);
    });
  }

  // مرورگرها پخش خودکار را تا اولین لمس کاربر قفل می‌کنند
  function unlock() {
    if (unlocked) return;
    unlocked = true;
    preload();

    const a = cache.night;
    if (!a) return;
    const vol = a.volume;
    a.volume = 0;
    const p = a.play();
    if (p && p.then) {
      p.then(() => {
        a.pause();
        a.currentTime = 0;
        a.volume = vol;
      }).catch(() => { a.volume = vol; });
    }
  }

  function play(key, opts) {
    const options = opts || {};
    preload();
    const a = cache[key];
    if (!a) return;

    if (current && current !== a) {
      current.pause();
      try { current.currentTime = 0; } catch (e) { /* ignore */ }
    }

    try { a.currentTime = 0; } catch (e) { /* ignore */ }
    a.volume = options.volume == null ? 0.9 : options.volume;

    const p = a.play();
    if (p && p.catch) p.catch(() => {});
    current = a;
  }

  function stop() {
    if (!current) return;
    current.pause();
    try { current.currentTime = 0; } catch (e) { /* ignore */ }
    current = null;
  }

  document.addEventListener('pointerdown', unlock, { once: true });
  document.addEventListener('keydown', unlock, { once: true });

  M.sound = { play, stop, unlock, preload, FILES };
})();
