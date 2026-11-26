/* ------------------------------------------------------------------
   سرویس صدا — گفتار فارسی برای اعلام‌های خودکار
------------------------------------------------------------------ */

(function () {
  'use strict';

  const M = window.Mafia = window.Mafia || {};
  const SAY_LANG = 'fa-IR';

  function speechSupported() {
    return typeof window !== 'undefined'
      && 'speechSynthesis' in window
      && typeof window.SpeechSynthesisUtterance === 'function';
  }

  function createSpeaker() {
    const supported = speechSupported();
    const synth = supported ? window.speechSynthesis : null;
    let voices = [];
    let run = 0;
    let playing = false;

    const refresh = () => { if (synth) voices = synth.getVoices() || []; };
    if (synth) {
      refresh();
      if (typeof synth.addEventListener === 'function') synth.addEventListener('voiceschanged', refresh);
    }

    const persianVoices = () => voices.filter(
      (v) => /^fa([-_]|$)/i.test(v.lang) || /(farsi|persian|فارسی)/i.test(v.name),
    );

    function pickVoice() {
      if (!voices.length) refresh();
      const fa = persianVoices();
      return fa.find((v) => /google|microsoft|siri|natural|enhanced/i.test(v.name)) || fa[0] || null;
    }

    function speak(text) {
      return new Promise((resolve) => {
        if (!text) return resolve();
        const voice = pickVoice();
        if (!synth || !voices.length) {
          return setTimeout(resolve, Math.min(12000, 500 + text.length * 55));
        }

        const u = new SpeechSynthesisUtterance(text);
        u.lang = voice ? voice.lang : SAY_LANG;
        if (voice) u.voice = voice;
        u.rate = 0.92;
        u.pitch = 0.95;

        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          clearTimeout(guard);
          resolve();
        };
        const guard = setTimeout(finish, Math.max(8000, text.length * 170));

        u.onend = finish;
        u.onerror = finish;
        synth.speak(u);
      });
    }

    const wait = (ms) => new Promise((r) => setTimeout(r, ms));

    async function play(items, { onStep, onEnd, gap = 400 } = {}) {
      if (!synth || !items.length) return;
      stop();
      const id = ++run;
      playing = true;

      for (let i = 0; i < items.length; i++) {
        if (id !== run) return;
        if (onStep) onStep(i, items[i]);
        await speak(items[i].say);
        if (id !== run) return;
        await wait(gap);
      }

      if (id === run) {
        playing = false;
        if (onEnd) onEnd();
      }
    }

    function stop() {
      run += 1;
      playing = false;
      if (synth) synth.cancel();
    }

    return {
      supported,
      get playing() { return playing; },
      hasPersianVoice: () => persianVoices().length > 0,
      play,
      stop,
      say(text) { play([{ say: text || '' }]); },
    };
  }

  M.voice = createSpeaker();
  M.speechSupported = speechSupported;
})();
