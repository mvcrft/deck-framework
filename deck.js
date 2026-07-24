/* =============================================================
   DECK FRAMEWORK — deck.js
   Scroll-snap navigation engine with keyboard + presentation-remote
   support. Reusable across decks: it just drives whatever
   <section class="slide"> elements live inside <main class="deck">.
   ============================================================= */
(function () {
  'use strict';

  var deck   = document.querySelector('.deck');
  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  if (!deck || !slides.length) return;

  var current = 0;
  var locked  = false;                 // debounce during programmatic scroll
  var blackout = document.querySelector('.deck-blackout');

  // Crossfade mode: <main class="deck deck--fade"> stacks the slides and
  // fades between them instead of scrolling. Same nav, same .is-active hook.
  var fadeMode = deck.classList.contains('deck--fade');
  var reducedMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- build progress bar + dots ---------------------------- */
  var progress = document.querySelector('.deck-progress');
  var dotsWrap = document.querySelector('.deck-dots');
  var dots = [];
  if (dotsWrap) {
    slides.forEach(function (s, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Go to slide ' + (i + 1));
      b.addEventListener('click', function () { goTo(i); });
      dotsWrap.appendChild(b);
      dots.push(b);
    });
  }

  var prevBtn = document.querySelector('[data-nav="prev"]');
  var nextBtn = document.querySelector('[data-nav="next"]');
  if (prevBtn) prevBtn.addEventListener('click', function () { prev(); });
  if (nextBtn) nextBtn.addEventListener('click', function () { next(); });

  var hint = document.querySelector('.deck-hint');

  /* ---- breadcrumbs ------------------------------------------ */
  // Slides declare a section with data-crumb="name"; slides without one
  // inherit the previous slide's section; data-crumb="none" clears it.
  // The trail is built from unique sections in first-appearance order into
  // an optional <nav class="deck-crumbs"> element. Clicking a crumb jumps
  // to the first slide of that section.
  var crumbWrap = document.querySelector('.deck-crumbs');
  var crumbOf = [];                    // resolved section per slide (or null)
  var crumbBtns = {};                  // section name -> button
  (function buildCrumbs() {
    var last = null, order = [], firstSlide = {};
    slides.forEach(function (s, i) {
      var c = s.getAttribute('data-crumb');
      if (c === 'none' || c === '') last = null;
      else if (c) last = c;
      crumbOf[i] = last;
      if (last && !(last in firstSlide)) { firstSlide[last] = i; order.push(last); }
    });
    if (!crumbWrap || !order.length) return;
    order.forEach(function (name) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = name;
      b.setAttribute('data-crumb', name);
      b.addEventListener('click', function () { goTo(firstSlide[name]); });
      crumbWrap.appendChild(b);
      crumbBtns[name] = b;
    });
  })();

  function setCrumb(i) {
    var active = crumbOf[i];
    Object.keys(crumbBtns).forEach(function (name) {
      if (name === active) crumbBtns[name].setAttribute('aria-current', 'true');
      else crumbBtns[name].removeAttribute('aria-current');
    });
    if (crumbWrap) crumbWrap.classList.toggle('is-idle', !active);
  }

  /* ---- navigation ------------------------------------------- */
  function goTo(i) {
    i = Math.max(0, Math.min(slides.length - 1, i));
    if (i === current && slides[current].classList.contains('is-active')) return;
    current = i;
    locked = true;
    if (!fadeMode) slides[i].scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActive(i);
    setTimeout(function () { locked = false; }, fadeMode ? 650 : 550);
  }
  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  // Pre-decode images on nearby slides so a big photo is ready to paint
  // the instant its slide fades in (hidden slides defer decode otherwise).
  function predecode(i) {
    for (var n = Math.max(0, i - 1); n <= Math.min(slides.length - 1, i + 2); n++) {
      Array.prototype.forEach.call(slides[n].querySelectorAll('img'), function (img) {
        if (img.decode) img.decode().catch(function () {});
      });
    }
  }

  function setActive(i) {
    slides.forEach(function (s, n) {
      s.classList.toggle('is-active', n === i);
      // fade mode: keep neighbors rasterized (visible at opacity 0) so a
      // big photo paints the instant its crossfade starts
      s.classList.toggle('is-near', fadeMode && n !== i && Math.abs(n - i) <= 2);
    });
    predecode(i);
    dots.forEach(function (d, n) {
      if (n === i) d.setAttribute('aria-current', 'true');
      else d.removeAttribute('aria-current');
    });
    if (progress) progress.style.width = ((i) / (slides.length - 1) * 100) + '%';
    if (prevBtn) prevBtn.disabled = (i === 0);
    if (nextBtn) nextBtn.disabled = (i === slides.length - 1);
    if (hint && i > 0) hint.classList.add('is-hidden');
    setCrumb(i);
  }

  /* ---- keep state in sync with manual scroll / swipe -------- */
  if (!fadeMode) {
    var io = new IntersectionObserver(function (entries) {
      if (locked) return;
      entries.forEach(function (e) {
        if (e.isIntersecting && e.intersectionRatio >= 0.55) {
          var i = slides.indexOf(e.target);
          if (i !== -1) { current = i; setActive(i); }
        }
      });
    }, { threshold: [0.55] });
    slides.forEach(function (s) { io.observe(s); });
  } else {
    // Fade mode has no native scrolling — translate wheel + touch swipes
    // into slide navigation, one step per gesture.
    var wheelAcc = 0, wheelAt = 0;
    deck.addEventListener('wheel', function (e) {
      e.preventDefault();
      if (locked) return;
      var now = Date.now();
      if (now - wheelAt > 400) wheelAcc = 0;   // stale ticks don't accumulate
      wheelAt = now;
      wheelAcc += e.deltaY;
      if (wheelAcc > 60)       { wheelAcc = 0; next(); }
      else if (wheelAcc < -60) { wheelAcc = 0; prev(); }
    }, { passive: false });

    var touchY = null;
    deck.addEventListener('touchstart', function (e) {
      touchY = e.touches[0].clientY;
    }, { passive: true });
    deck.addEventListener('touchend', function (e) {
      if (touchY === null) return;
      var dy = touchY - e.changedTouches[0].clientY;
      touchY = null;
      if (Math.abs(dy) < 40) return;
      if (dy > 0) next(); else prev();
    }, { passive: true });
  }

  /* ---- keyboard + presentation-remote ----------------------- */
  // Bluetooth clickers typically emit PageDown/PageUp (and sometimes
  // arrows, Escape to end, or "." to blank). We cover the common set.
  var NEXT = { 'ArrowRight': 1, 'ArrowDown': 1, 'PageDown': 1, ' ': 1,
               'Spacebar': 1, 'Enter': 1, 'j': 1, 'l': 1 };
  var PREV = { 'ArrowLeft': 1, 'ArrowUp': 1, 'PageUp': 1, 'Backspace': 1,
               'k': 1, 'h': 1 };

  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var k = e.key;

    // blank/black screen — common clicker + presenter habit
    if (k === 'b' || k === 'B' || k === '.') {
      if (blackout) { e.preventDefault(); blackout.classList.toggle('is-on'); }
      return;
    }
    if (blackout && blackout.classList.contains('is-on')) {
      // any key wakes from blackout
      e.preventDefault(); blackout.classList.remove('is-on'); return;
    }

    // fullscreen for presenting
    if (k === 'f' || k === 'F') { e.preventDefault(); toggleFullscreen(); return; }

    if (k === 'Home') { e.preventDefault(); goTo(0); return; }
    if (k === 'End')  { e.preventDefault(); goTo(slides.length - 1); return; }

    if (NEXT[k]) { e.preventDefault(); next(); }
    else if (PREV[k]) { e.preventDefault(); prev(); }
  });

  function toggleFullscreen() {
    var el = document.documentElement;
    if (!document.fullscreenElement) {
      (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
    } else {
      (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    }
  }

  /* ---- staggered entrance ----------------------------------- */
  // Give each child of a stagger container an index (--i) so CSS can
  // delay its entrance. Add a container to this list to make it stagger.
  document.querySelectorAll('.wordgrid, .vma-defs, [data-stagger]').forEach(function (group) {
    Array.prototype.forEach.call(group.children, function (child, i) {
      child.style.setProperty('--i', i);
    });
  });

  /* ---- init ------------------------------------------------- */
  setActive(0);
})();

/* =============================================================
   THEME TOGGLE — framework feature (2026-07-19)
   Light is the default (deck.css declares color-scheme: light so
   browser auto-dark can't force-invert). "d" or the .deck-theme
   button toggles; choice persists in localStorage. A deck can also
   honor ?theme=dark|light at load (see the CoH deck for the two-
   line snippet).
   ============================================================= */
(function () {
  'use strict';
  var THEME_KEY = 'deck-theme';
  function applyTheme(mode) {
    document.documentElement.classList.toggle('theme-dark', mode === 'dark');
    var btn = document.querySelector('.deck-theme');
    if (btn) btn.textContent = mode === 'dark' ? '☀' : '☾';
    try { localStorage.setItem(THEME_KEY, mode); } catch (e) {}
  }
  function toggleTheme() {
    var dark = document.documentElement.classList.contains('theme-dark');
    applyTheme(dark ? 'light' : 'dark');
  }
  var btn = document.querySelector('.deck-theme');
  if (!btn) {
    btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'deck-theme';
    btn.setAttribute('aria-label', 'Toggle dark mode');
    document.body.appendChild(btn);
  }
  btn.addEventListener('click', toggleTheme);
  var saved = null;
  try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
  applyTheme(saved === 'dark' ? 'dark' : 'light');
  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'd' || e.key === 'D') { e.preventDefault(); toggleTheme(); }
  });
})();
