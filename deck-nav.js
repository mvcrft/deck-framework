/* =============================================================
   DECK FRAMEWORK — deck-nav.js   (optional add-on module)
   A configurable navigation component. Include AFTER deck.js:
       <script src="deck.js"></script>
       <script src="deck-nav.js"></script>

   Pick the mode per deck with one attribute on <body>:
       data-deck-nav="menu"    overlay hub: Contents + Appendix/Resources
       data-deck-nav="toc"     overlay with Contents (section jump) only
       data-deck-nav="toggle"  2-page paradigm: one button to a target
                               page, one click back (prezo <-> appendix)
       data-deck-nav="off"     no nav chrome (default if attribute absent)
   (Named data-deck-nav, not data-nav, so it never clashes with deck.js's
    own data-nav="prev|next" on the arrow buttons.)

   Config attributes (on the same element that carries data-deck-nav):
       data-deck-nav-title    overlay heading         (default "menu")
       data-deck-nav-appendix resource-zone label     (default "appendix")
                              e.g. "downloads"; each <a> may set data-dl
                              ("zip"/"doc"/…) for its download-link label
       data-deck-nav-label    button glyph / text
                           toggle glyph default "a." (fwd) / "←" (back)
                           menu default "menu"
       data-deck-nav-target   toggle: URL the button opens
                           (default appendix.html fwd / index.html back)
       data-deck-nav-dir      toggle: "forward" (default) | "back"
       data-deck-nav-style    menu look: "drawer" (default) | "editorial"

   Toggle (2-page) usage — the "a." mark is persistent in the upper-right
   on BOTH pages, so a click always flips prezo <-> appendix:
       deck:      <body data-deck-nav="toggle">
       appendix:  <body data-deck-nav="toggle" data-deck-nav-dir="back">

   Contents (menu / toc) is built from the deck itself:
       <section class="slide" data-toc="By the Numbers"> ...
   If no slide carries data-toc, it falls back to the breadcrumb
   sections (data-crumb). Slides with neither are skipped.

   Appendix/Resources (menu only) is declared once, anywhere in the
   body, and cloned into the overlay:
       <template class="deck-nav-resources">
         <a href="report.html" data-desc="The full findings"
            data-pdf="pdf/report.pdf">The Written Report</a>
       </template>

   Programmatic API (used by the showcase; optional in real decks):
       DeckNav.mount({ mode, title, label, target, dir, style })
       DeckNav.unmount()
   ============================================================= */
(function (global) {
  'use strict';

  var mounted = null;   // teardown state for the active instance

  function slidesList() {
    return Array.prototype.slice.call(document.querySelectorAll('.slide'));
  }

  // Reuse the engine's navigation: deck.js wires each auto-built dot to
  // goTo(), which works in scroll AND crossfade modes. So to jump we
  // click the matching dot; with no dots, scroll the slide directly.
  function jumpTo(index) {
    var dots = document.querySelectorAll('.deck-dots button');
    var slides = slidesList();
    if (dots && dots[index]) { dots[index].click(); }
    else if (slides[index]) {
      slides[index].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  function buildContents() {
    var slides = slidesList(), out = [];
    slides.forEach(function (s, i) {
      var t = s.getAttribute('data-toc');
      if (t) out.push({ label: t, index: i });
    });
    if (out.length) return out;
    var seen = {};
    slides.forEach(function (s, i) {
      var c = s.getAttribute('data-crumb');
      if (c && c !== 'none' && !seen[c]) { seen[c] = 1; out.push({ label: c, index: i }); }
    });
    return out;
  }

  function buildResources() {
    var src = document.querySelector('template.deck-nav-resources, .deck-nav-resources');
    if (!src) return [];
    var root = (src.tagName === 'TEMPLATE') ? src.content : src;
    return Array.prototype.slice.call(root.querySelectorAll('a')).map(function (a) {
      return {
        href: a.getAttribute('href'),
        text: a.textContent.trim(),
        desc: a.getAttribute('data-desc') || '',
        pdf:  a.getAttribute('data-pdf') || '',
        dl:   a.getAttribute('data-dl') || 'pdf',   // download link label
        blank: a.hasAttribute('target') || a.getAttribute('data-blank') === 'true'
      };
    });
  }

  function unmount() {
    if (!mounted) return;
    mounted.nodes.forEach(function (n) { if (n && n.parentNode) n.parentNode.removeChild(n); });
    if (mounted.onKey) document.removeEventListener('keydown', mounted.onKey);
    mounted = null;
  }

  function mount(opts) {
    unmount();
    opts = opts || {};
    var mode = (opts.mode || 'off').toLowerCase();
    if (mode === 'off') { mounted = { nodes: [], onKey: null }; return; }

    /* ---- MODE: toggle ------------------------------------- */
    // A compact round mark in the upper-right (matches the theme toggle).
    // Forward shows "a." and opens the appendix; on the appendix page mount
    // with dir:"back" for a persistent return-to-deck glyph in the same slot.
    if (mode === 'toggle') {
      var dir    = opts.dir    || 'forward';
      var target = opts.target || (dir === 'back' ? 'index.html' : 'appendix.html');
      var glyph  = opts.label  || (dir === 'back' ? '←' : 'a.');   // ← / a.
      var mark = document.createElement('a');
      mark.className = 'deck-nav-btn deck-nav-btn--toggle';
      mark.href = target;
      mark.setAttribute('data-dir', dir);
      mark.setAttribute('aria-label', dir === 'back' ? 'Back to the deck' : 'Open the appendix');
      mark.setAttribute('title', dir === 'back' ? 'back to the deck' : 'appendix');
      mark.innerHTML = '<span class="deck-nav-btn__txt">' + glyph + '</span>';
      document.body.appendChild(mark);
      mounted = { nodes: [mark], onKey: null };
      return;
    }

    /* ---- MODE: menu / toc --------------------------------- */
    var showResources = (mode === 'menu');
    var style    = opts.style || 'drawer';
    var title    = opts.title || 'menu';
    var resLabel = opts.resLabel || 'appendix';   // zone label for the resource list
    var btnText  = opts.label || title;   // word revealed on hover of the navicon

    var contents  = buildContents();
    var resources = showResources ? buildResources() : [];
    if (!contents.length && !resources.length) { mounted = { nodes: [], onKey: null }; return; }

    var overlay = document.createElement('div');
    overlay.className = 'deck-nav-overlay';
    overlay.setAttribute('data-nav-style', style);
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', title);
    overlay.hidden = true;

    var html = '' +
      '<div class="deck-nav-scrim" data-close></div>' +
      '<div class="deck-nav-panel">' +
        '<div class="deck-nav-head">' +
          '<h2 class="deck-nav-title">' + title + '.</h2>' +
          '<button type="button" class="deck-nav-x" data-close aria-label="Close menu">&times;</button>' +
        '</div>' +
        '<div class="deck-nav-zones">';

    if (contents.length) {
      html += '<nav class="deck-nav-zone deck-nav-zone--toc" aria-label="Contents">' +
        '<p class="deck-nav-zlabel">contents</p><ul class="deck-nav-list">';
      contents.forEach(function (c, i) {
        html += '<li><button type="button" class="deck-nav-item" data-jump="' + c.index + '">' +
          '<span class="deck-nav-num">' + pad2(i + 1) + '</span>' +
          '<span class="deck-nav-label">' + c.label + '</span></button></li>';
      });
      html += '</ul></nav>';
    }

    if (resources.length) {
      html += '<nav class="deck-nav-zone deck-nav-zone--res" aria-label="' + resLabel + '">' +
        '<p class="deck-nav-zlabel">' + resLabel + '</p><ul class="deck-nav-list">';
      resources.forEach(function (r, i) {
        html += '<li class="deck-nav-res">' +
          '<a class="deck-nav-item deck-nav-item--link" href="' + r.href + '"' +
            (r.blank ? ' target="_blank" rel="noopener"' : '') + '>' +
            '<span class="deck-nav-num">' + pad2(i + 1) + '</span>' +
            '<span class="deck-nav-label">' + r.text +
              (r.desc ? '<span class="deck-nav-desc">' + r.desc + '</span>' : '') +
            '</span>' +
            '<span class="deck-nav-arw" aria-hidden="true">&rarr;</span>' +
          '</a>' +
          (r.pdf ? '<a class="deck-nav-pdf" href="' + r.pdf + '" download>' + r.dl + ' &darr;</a>' : '') +
        '</li>';
      });
      html += '</ul></nav>';
    }

    html += '</div></div>';
    overlay.innerHTML = html;
    document.body.appendChild(overlay);

    // hamburger navicon; the word (btnText) slides out on hover / focus
    var HAMBURGER = '<svg class="deck-nav-ham" width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">' +
      '<line x1="2" y1="5" x2="16" y2="5"/><line x1="2" y1="9" x2="16" y2="9"/><line x1="2" y1="13" x2="16" y2="13"/></svg>';
    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'deck-nav-btn deck-nav-btn--menu';
    trigger.setAttribute('aria-label', 'Open ' + title);
    trigger.setAttribute('aria-expanded', 'false');
    trigger.innerHTML = '<span class="deck-nav-btn__label">' + btnText + '</span>' + HAMBURGER;
    document.body.appendChild(trigger);

    var isOpen = false;
    function open() {
      overlay.hidden = false;
      requestAnimationFrame(function () { overlay.classList.add('is-open'); });
      trigger.setAttribute('aria-expanded', 'true');
      isOpen = true;
    }
    function close() {
      overlay.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
      isOpen = false;
      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) { overlay.hidden = true; }
      else { setTimeout(function () { if (!isOpen) overlay.hidden = true; }, 320); }
    }
    function toggle() { isOpen ? close() : open(); }

    trigger.addEventListener('click', toggle);
    overlay.addEventListener('click', function (e) {
      var t = e.target;
      if (t.hasAttribute('data-close') || t.closest('[data-close]')) { close(); return; }
      var jumpBtn = t.closest('[data-jump]');
      if (jumpBtn) { close(); jumpTo(parseInt(jumpBtn.getAttribute('data-jump'), 10)); return; }
      if (t.closest('.deck-nav-item--link')) { close(); }
    });

    var onKey = function (e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isOpen && e.key === 'Escape') { e.preventDefault(); close(); return; }
      if ((e.key === 'm' || e.key === 'M') &&
          !/^(input|textarea|select)$/i.test((e.target.tagName || ''))) {
        e.preventDefault(); toggle();
      }
    };
    document.addEventListener('keydown', onKey);

    mounted = { nodes: [overlay, trigger], onKey: onKey };
  }

  function autoInit() {
    var host = document.querySelector('[data-deck-nav]') || document.body;
    var mode = host.getAttribute('data-deck-nav');
    if (!mode) return;
    function ga(n, d) { var v = host.getAttribute(n); return (v === null || v === '') ? d : v; }
    mount({
      mode:   mode,
      title:  ga('data-deck-nav-title', 'menu'),
      resLabel: ga('data-deck-nav-appendix', 'appendix'),
      label:  ga('data-deck-nav-label', null),
      target: ga('data-deck-nav-target', null),
      dir:    ga('data-deck-nav-dir', 'forward'),
      style:  ga('data-deck-nav-style', 'drawer')
    });
  }

  global.DeckNav = { mount: mount, unmount: unmount };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }
})(window);
