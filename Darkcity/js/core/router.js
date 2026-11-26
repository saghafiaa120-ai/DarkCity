/* ------------------------------------------------------------------
   روتر صفحه‌ها
   هر صفحه یک <section class="screen"> است؛ صفحه‌ها خودشان ثبت می‌شوند.
------------------------------------------------------------------ */

(function () {
  'use strict';

  const M = window.Mafia = window.Mafia || {};

  const routes = new Map();
  let current = null;
  let previous = null;
  let syncing = false;

  function register(name, element, onEnter) {
    if (!element) return;
    routes.set(name, { element, onEnter });
  }

  function render(name, payload) {
    const route = routes.get(name);
    routes.forEach((r) => r.element.classList.remove('active'));
    route.element.classList.add('active');

    previous = current;
    current = name;
    window.scrollTo({ top: 0, behavior: 'auto' });
    if (route.onEnter) route.onEnter(payload || {});
  }

  function hashName() {
    const name = location.hash.slice(1);
    return routes.has(name) ? name : null;
  }

  function go(name, payload) {
    if (!routes.has(name)) return;
    render(name, payload);

    // هر صفحه یک ورودی تاریخچه می‌گیرد تا دکمهٔ برگشت گوشی کار کند
    if (location.hash.slice(1) !== name) {
      syncing = true;
      location.hash = name;
    }
  }

  window.addEventListener('hashchange', () => {
    if (syncing) { syncing = false; return; }
    const name = hashName();
    if (!name || name === current) return;
    render(name, {});
  });

  M.router = {
    register,
    go,
    get current() { return current; },
    get previous() { return previous; },
  };
})();
