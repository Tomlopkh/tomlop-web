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

  /* ---- download state ---- */

  /* Read from a static file rather than the GitHub API: same origin, no rate
     limit, and the page still renders its not-yet state if the fetch fails. */
  function drawDownload() {
    var host = document.getElementById('download-state');
    if (!host || !host.dataset.release) return;
    var d = JSON.parse(host.dataset.release);
    var en = root.getAttribute('data-lang') === 'en';
    var mb = (d.bytes / 1048576).toFixed(1);
    host.className = 'release-ready';
    host.innerHTML =
      '<a class="btn" href="' + d.apkUrl + '">' +
        (en ? 'Download ' + d.version : 'ទាញយក ' + d.version) +
      '</a>' +
      '<p class="aside-note">' +
        (en ? mb + ' MB · Android ' + d.minAndroid + ' and above'
            : mb + ' MB · Android ' + d.minAndroid + ' ឡើងទៅ') +
      '</p>' +
      '<p class="hash"><span>SHA-256</span><code>' + d.sha256 + '</code></p>';
  }

  var dl = document.getElementById('download-state');
  if (dl) {
    fetch(dl.dataset.src || '../download.json', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (d && d.released && d.apkUrl) {
          dl.dataset.release = JSON.stringify(d);
          drawDownload();
        }
      })
      .catch(function () { /* leave the not-yet state in place */ });

    buttons.forEach(function (b) {
      b.addEventListener('click', function () {
        if (dl.dataset.release) drawDownload();
      });
    });
  }

  setLang(initial);
}());
