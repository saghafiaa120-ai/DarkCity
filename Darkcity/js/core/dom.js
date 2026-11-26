/* ------------------------------------------------------------------
   ابزارهای مشترک DOM و قالب‌بندی فارسی
------------------------------------------------------------------ */

(function () {
  'use strict';

  const M = window.Mafia = window.Mafia || {};

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
  const fa = (n) => String(n).replace(/\d/g, (d) => FA_DIGITS[+d]);
  const clock = (s) => `${fa(String(Math.floor(s / 60)).padStart(2, '0'))}:${fa(String(s % 60).padStart(2, '0'))}`;

  const esc = (str) => String(str).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

  const hexToRgba = (hex, a) => {
    const h = hex.replace('#', '');
    const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    const n = parseInt(full, 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
  };

  M.dom = { $, $$, fa, clock, esc, hexToRgba };
})();
