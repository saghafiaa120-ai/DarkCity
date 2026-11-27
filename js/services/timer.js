/* ------------------------------------------------------------------
   سرویس تایمر مرحله‌ی روز
------------------------------------------------------------------ */

(function () {
  'use strict';

  const M = window.Mafia = window.Mafia || {};

  function createTimer({ onTick, onDone } = {}) {
    let total = 0;
    let left = 0;
    let id = null;
    let running = false;

    function emit() {
      if (onTick) onTick(left, total);
    }

    function clear() {
      if (id) clearInterval(id);
      id = null;
      running = false;
    }

    function reset(seconds) {
      clear();
      total = seconds;
      left = seconds;
      emit();
    }

    function tick() {
      left -= 1;
      if (left <= 0) {
        left = 0;
        emit();
        clear();
        if (navigator.vibrate) navigator.vibrate([40, 70, 40]);
        if (onDone) onDone();
        return;
      }
      emit();
    }

    function start() {
      if (running || left <= 0) return;
      running = true;
      id = setInterval(tick, 1000);
    }

    function stop() {
      clear();
    }

    return {
      reset,
      start,
      stop,
      get running() { return running; },
      get left() { return left; },
      get total() { return total; },
    };
  }

  M.createTimer = createTimer;
})();
