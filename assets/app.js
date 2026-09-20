/* Tomlop site: language switch, today's dateline, and the one interaction
   that matters — stamping a row. Everything degrades to readable Khmer
   without JavaScript. */

(function () {
  'use strict';

  var root = document.documentElement;

  /* ---- language ---- */

  var STORED = 'tomlop.lang';
  var buttons = Array.prototype.slice.call(document.querySelectorAll('[data-setlang]'));

  function setLang(lang) {
    root.setAttribute('data-lang', lang);
    root.setAttribute('lang', lang === 'en' ? 'en' : 'km');
    buttons.forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.setlang === lang));
    });
    try { localStorage.setItem(STORED, lang); } catch (e) { /* private mode */ }
    drawDateline();
    drawTally();
  }

  buttons.forEach(function (b) {
    b.addEventListener('click', function () { setLang(b.dataset.setlang); });
  });

  var initial = 'km';
  try {
    var saved = localStorage.getItem(STORED);
    if (saved === 'km' || saved === 'en') initial = saved;
  } catch (e) { /* ignore */ }

  /* ---- today's dateline ---- */

  var KH_DIGITS = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
  var KH_MONTHS = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា',
                   'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];

  function khmerNumber(n) {
    return String(n).replace(/\d/g, function (d) { return KH_DIGITS[+d]; });
  }

  function drawDateline() {
    var el = document.getElementById('dateline');
    if (!el) return;
    var now = new Date();
    if (root.getAttribute('data-lang') === 'en') {
      el.textContent = 'Today — ' + now.toLocaleDateString('en-GB',
        { day: 'numeric', month: 'long', year: 'numeric' });
    } else {
      el.textContent = 'ថ្ងៃនេះ — ' + khmerNumber(now.getDate()) + ' ' +
        KH_MONTHS[now.getMonth()] + ' ' + khmerNumber(now.getFullYear());
    }
  }

  /* ---- the ledger ---- */

  var rows = Array.prototype.slice.call(document.querySelectorAll('#demo .row'));

  function drawTally() {
    var el = document.getElementById('tally');
    if (!el) return;
    var done = rows.filter(function (r) { return r.getAttribute('aria-pressed') === 'true'; }).length;
    var total = rows.length;
    if (root.getAttribute('data-lang') === 'en') {
      el.innerHTML = done === total
        ? '<b>All ' + total + ' done.</b> That is the whole app.'
        : '<b>' + done + ' of ' + total + '</b> marked. Tap a row to try it.';
    } else {
      el.innerHTML = done === total
        ? '<b>គ្រប់ ' + khmerNumber(total) + ' រួចរាល់។</b> កម្មវិធីមានត្រឹមនេះឯង។'
        : '<b>' + khmerNumber(done) + ' ក្នុងចំណោម ' + khmerNumber(total) + '</b> ត្រូវបានកត់ត្រា។ ចុចលើជួរណាមួយដើម្បីសាកល្បង។';
    }
  }

  rows.forEach(function (row) {
    row.addEventListener('click', function () {
      var next = row.getAttribute('aria-pressed') !== 'true';
      row.setAttribute('aria-pressed', String(next));
      drawTally();
    });
  });

  setLang(initial);
}());
