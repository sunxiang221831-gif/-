/* ============================================================================
   Xinyu Heavy Industry — interactions
   Vanilla JS, no dependencies. Everything degrades gracefully: with JS off the
   page is still fully readable in English.
   ========================================================================= */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ───────────────────────────── language ───────────────────────────── */

  var STORE_KEY = 'xinyu-lang';
  var dict = window.I18N || { en: {} };

  function detectLang() {
    try {
      var saved = localStorage.getItem(STORE_KEY);
      if (saved && dict[saved]) return saved;
    } catch (e) { /* private mode */ }
    var nav = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
    return nav.indexOf('zh') === 0 ? 'zh' : 'en';
  }

  var lang = detectLang();

  function t(key, fallback) {
    var table = dict[lang] || {};
    var v = table[key];
    if (v == null) v = (dict.en || {})[key];
    return v == null ? (fallback || '') : v;
  }

  function applyLang(next, persist) {
    if (!dict[next]) next = 'en';
    lang = next;
    root.setAttribute('lang', next === 'zh' ? 'zh-CN' : 'en');
    root.setAttribute('data-lang', next);

    // Plain text nodes
    each('[data-i18n]', function (el) {
      var v = t(el.getAttribute('data-i18n'));
      if (v) el.textContent = v;
    });
    // Nodes that legitimately contain markup (<br>, <em>, <span>)
    each('[data-i18n-html]', function (el) {
      var v = t(el.getAttribute('data-i18n-html'));
      if (v) el.innerHTML = v;
    });
    // alt attributes
    each('[data-i18n-alt]', function (el) {
      var v = t(el.getAttribute('data-i18n-alt'));
      if (v) el.setAttribute('alt', v);
    });
    // Arbitrary attributes: data-i18n-attr="content:key, title:key"
    each('[data-i18n-attr]', function (el) {
      el.getAttribute('data-i18n-attr').split(',').forEach(function (pair) {
        var bits = pair.split(':');
        if (bits.length < 2) return;
        var v = t(bits[1].trim());
        if (v) el.setAttribute(bits[0].trim(), v);
      });
    });

    doc.title = t('meta.title', doc.title);

    // Language pill
    each('.lang button', function (b) {
      var on = b.getAttribute('data-lang') === next;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    positionLangInk();

    // Accessible names that are not in the DOM text
    var nav = doc.getElementById('nav');
    if (nav) nav.setAttribute('aria-label', t('a11y.nav'));
    var burger = doc.getElementById('burger');
    if (burger) {
      burger.setAttribute('aria-label',
        burger.getAttribute('aria-expanded') === 'true' ? t('a11y.burgerClose') : t('a11y.burger'));
    }
    var skip = doc.querySelector('.skip');
    if (skip) skip.textContent = t('a11y.skip');

    if (persist) {
      try { localStorage.setItem(STORE_KEY, next); } catch (e) { /* ignore */ }
    }
    // Layout of the tab underline depends on text width
    positionTabInk();
  }

  function each(sel, fn) {
    var list = doc.querySelectorAll(sel);
    for (var i = 0; i < list.length; i++) fn(list[i], i);
  }

  /* ─────────────────────────── language pill ink ─────────────────────────── */

  var langWrap = doc.querySelector('.lang');
  var langInk = doc.querySelector('.lang__ink');

  function positionLangInk() {
    if (!langWrap || !langInk) return;
    var on = langWrap.querySelector('button.is-on');
    if (!on) return;
    langInk.style.width = on.offsetWidth + 'px';
    langInk.style.transform = 'translateX(' + on.offsetLeft + 'px)';
  }

  if (langWrap) {
    langWrap.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-lang]');
      if (!b) return;
      applyLang(b.getAttribute('data-lang'), true);
    });
  }

  /* ────────────────────────────── header ────────────────────────────── */

  var hdr = doc.getElementById('hdr');
  var burger = doc.getElementById('burger');
  var nav = doc.getElementById('nav');
  var progressBar = doc.getElementById('progressBar');
  var hero = doc.querySelector('.hero');
  var ticking = false;

  function onScroll() {
    var y = window.pageYOffset || root.scrollTop;

    if (hdr) hdr.classList.toggle('is-stuck', y > 40);

    if (progressBar) {
      var max = root.scrollHeight - window.innerHeight;
      progressBar.style.width = (max > 0 ? Math.min(100, (y / max) * 100) : 0) + '%';
    }

    if (!reduce.matches && hero && y < window.innerHeight * 1.2) {
      var stage = doc.querySelector('.stage');
      var s1 = doc.querySelector('.hero__streak--1');
      var s2 = doc.querySelector('.hero__streak--2');
      if (stage) stage.style.transform = 'translate3d(0,' + (y * 0.055).toFixed(2) + 'px,0)';
      if (s1) s1.style.transform = 'rotate(-13deg) translate3d(0,' + (y * -0.045).toFixed(2) + 'px,0)';
      if (s2) s2.style.transform = 'rotate(-13deg) translate3d(' + (9 + y * 0.02).toFixed(2) + '%,' +
        (y * -0.075).toFixed(2) + 'px,0)';
    }
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(onScroll);
  }, { passive: true });

  function setMenu(open) {
    if (!nav || !burger || !hdr) return;
    nav.classList.toggle('is-open', open);
    hdr.classList.toggle('is-menu', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? t('a11y.burgerClose') : t('a11y.burger'));
    doc.body.style.overflow = open ? 'hidden' : '';
  }

  if (burger) {
    burger.addEventListener('click', function () {
      setMenu(burger.getAttribute('aria-expanded') !== 'true');
    });
  }
  if (nav) {
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
  }
  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setMenu(false);
  });
  window.addEventListener('resize', function () {
    positionTabInk();
    positionLangInk();
    if (window.innerWidth > 860) setMenu(false);
  });

  /* ──────────────────────────── reveal on scroll ──────────────────────────── */

  var revealables = doc.querySelectorAll('[data-reveal]');
  each('[data-reveal][data-reveal-d]', function (el) {
    el.style.setProperty('--d', (parseInt(el.getAttribute('data-reveal-d'), 10) * 90) + 'ms');
  });

  if (!('IntersectionObserver' in window) || reduce.matches) {
    for (var i = 0; i < revealables.length; i++) revealables[i].classList.add('is-in');
    runCounters();
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
        if (en.target.classList.contains('stats')) runCounters();
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    for (var j = 0; j < revealables.length; j++) io.observe(revealables[j]);
  }

  // The observer is live, so the head script's "unhide everything" guard can stand down.
  if (window.__revealGuard) { clearTimeout(window.__revealGuard); window.__revealGuard = null; }

  // Failsafe: if anything above stopped the observer from running, make sure whatever is
  // on screen right now is visible rather than leaving the page blank.
  window.setTimeout(function () {
    each('[data-reveal]:not(.is-in)', function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('is-in');
    });
  }, 2200);

  /* ───────────────────────────── counters ───────────────────────────── */

  var countersDone = false;
  function runCounters() {
    if (countersDone) return;
    countersDone = true;
    each('[data-count]', function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var suffix = el.getAttribute('data-suffix') || '';
      if (reduce.matches || isNaN(target)) {
        el.textContent = target.toLocaleString('en-US') + suffix;
        return;
      }
      var start = performance.now();
      var dur = 1300;
      (function step(now) {
        var p = Math.min(1, (now - start) / dur);
        var eased = 1 - Math.pow(1 - p, 4);
        var val = Math.round(target * eased);
        el.textContent = val.toLocaleString('en-US') + suffix;
        if (p < 1) window.requestAnimationFrame(step);
      })(start);
    });
  }

  /* ─────────────────────────────── tabs ─────────────────────────────── */

  var tablist = doc.querySelector('.tablist');
  var tabInk = doc.querySelector('.tablist__ink');
  var tabs = tablist ? tablist.querySelectorAll('button[role="tab"]') : [];

  function positionTabInk() {
    if (!tablist || !tabInk) return;
    if (getComputedStyle(tabInk).display === 'none') return;
    var on = tablist.querySelector('button.is-on');
    if (!on) return;
    tabInk.style.width = on.offsetWidth + 'px';
    tabInk.style.transform = 'translateX(' + on.offsetLeft + 'px)';
  }

  function selectTab(btn, focus) {
    if (!btn) return;
    for (var i = 0; i < tabs.length; i++) {
      var on = tabs[i] === btn;
      tabs[i].classList.toggle('is-on', on);
      tabs[i].setAttribute('aria-selected', on ? 'true' : 'false');
      tabs[i].setAttribute('tabindex', on ? '0' : '-1');
      var panel = doc.getElementById(tabs[i].getAttribute('aria-controls'));
      if (!panel) continue;
      if (on) {
        panel.removeAttribute('hidden');
        panel.classList.add('is-on');
        panel.classList.remove('is-entering');
        void panel.offsetWidth;            // restart the entrance animation
        if (!reduce.matches) panel.classList.add('is-entering');
      } else {
        panel.setAttribute('hidden', '');
        panel.classList.remove('is-on', 'is-entering');
      }
    }
    positionTabInk();
    if (focus) btn.focus();
  }

  if (tablist) {
    tablist.addEventListener('click', function (e) {
      var b = e.target.closest('button[role="tab"]');
      if (b) selectTab(b, false);
    });
    tablist.addEventListener('keydown', function (e) {
      var idx = Array.prototype.indexOf.call(tabs, e.target.closest('button[role="tab"]'));
      if (idx < 0) return;
      var next = null;
      if (e.key === 'ArrowRight') next = tabs[(idx + 1) % tabs.length];
      else if (e.key === 'ArrowLeft') next = tabs[(idx - 1 + tabs.length) % tabs.length];
      else if (e.key === 'Home') next = tabs[0];
      else if (e.key === 'End') next = tabs[tabs.length - 1];
      if (next) { e.preventDefault(); selectTab(next, true); }
    });
  }

  /* ─────────────────────── active section in the nav ─────────────────────── */

  var sections = doc.querySelectorAll('main section[id]');
  if ('IntersectionObserver' in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        each('.nav a', function (a) {
          a.classList.toggle('is-active',
            a.getAttribute('href') === '#' + en.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    for (var k = 0; k < sections.length; k++) spy.observe(sections[k]);
  }

  /* ─────────────────── contact details from site/config.js ─────────────────── */
  /* These only appear when actually configured. The catalogue contains no email
     address or WhatsApp number, so nothing is invented — fill site/config.js
     and the matching buttons/rows switch on by themselves. */
  var cfg = window.SITE_CONFIG || {};
  var emailAddr = String(cfg.email || '').trim();
  var waDigits = String(cfg.whatsapp || '').replace(/[^0-9]/g, '');

  function show(sel, fn) {
    each(sel, function (el) {
      fn(el);
      el.removeAttribute('hidden');
    });
  }
  if (emailAddr) {
    show('[data-contact="email-btn"], [data-contact="email-link"]', function (el) {
      el.setAttribute('href', 'mailto:' + emailAddr);
      if (!el.textContent.trim()) el.textContent = emailAddr;
    });
    show('[data-contact-row="email"]', function () {});
  }
  if (waDigits) {
    show('[data-contact="whatsapp-btn"], [data-contact="whatsapp-link"]', function (el) {
      el.setAttribute('href', 'https://wa.me/' + waDigits);
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener');
      if (!el.textContent.trim()) el.textContent = '+' + String(cfg.whatsapp).replace(/^\+/, '');
    });
    show('[data-contact-row="whatsapp"]', function () {});
  }
  if (cfg.wechatId) {
    each('.qr figcaption', function (el) {
      el.textContent = el.textContent + ' · WeChat: ' + cfg.wechatId;
    });
  }

  /* ────────────────────────────── bootstrap ────────────────────────────── */

  var yearEl = doc.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  applyLang(lang, false);
  positionTabInk();
  positionLangInk();
  onScroll();

  // Fonts/images settling can shift the underline; re-measure once things are in.
  window.addEventListener('load', function () {
    positionTabInk();
    positionLangInk();
  });
  if (doc.fonts && doc.fonts.ready) {
    doc.fonts.ready.then(function () { positionTabInk(); positionLangInk(); });
  }
})();
