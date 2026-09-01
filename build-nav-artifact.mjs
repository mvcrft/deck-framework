// Assembles a SELF-CONTAINED showcase of the deck-nav component for
// hosting as an Artifact (fonts + component CSS/JS inlined; no external
// requests). Output: nav-showcase.artifact.html (page content only — no
// <html>/<head>/<body>, per the Artifact wrapper).
//   node build-nav-artifact.mjs
import { readFileSync, writeFileSync } from 'fs';

const navCss  = readFileSync(new URL('./deck-nav.css', import.meta.url), 'utf8');
// deck-nav.js's header comment contains a literal </script> (usage example),
// which would close the inlined <script> early — neutralise it.
const navJs   = readFileSync(new URL('./deck-nav.js', import.meta.url), 'utf8')
  .replace(/<\/script/gi, '<\\/script');

// The design system serves fonts as external woff2. An Artifact is hosted
// under a strict CSP that blocks external requests, so for THIS demo we
// base64-inline the fonts at build time. We use the OPEN faces (Newsreader
// display + Hanken Grotesk body) fetched from Google's CDN — same URLs the
// design system's fonts.css points at — so the output is public-safe and
// needs no local font files.
const OPEN_FONTS = [
  // registered font-style:normal on purpose — Newsreader is the italic file,
  // treated as pre-slanted (matches the design system's convention).
  { family: 'Newsreader',      url: 'https://fonts.gstatic.com/s/newsreader/v26/cY9CfjOCX1hbuyalUrK439vCjohCBJWxZA.woff2' },
  { family: 'Hanken Grotesk',  url: 'https://fonts.gstatic.com/s/hankengrotesk/v12/ieVn2YZDLWuGJpnzaiwFXS9tYtpd59CxCis4.woff2' },
];
async function fontFace({ family, url }) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`font fetch ${res.status} for ${url}`);
  const b64 = Buffer.from(await res.arrayBuffer()).toString('base64');
  return `@font-face{font-family:'${family}';` +
    `src:url(data:font/woff2;base64,${b64}) format('woff2');` +
    `font-weight:normal;font-style:normal;font-display:swap;}`;
}
const fontFaces = (await Promise.all(OPEN_FONTS.map(fontFace))).join('\n');

const page = `<style>
${fontFaces}

/* ---- Movecraft theme tokens (light default, dark on toggle/OS) ---- */
:root {
  color-scheme: light;
  --paper:#faf8f5; --surface:#ffffff; --ink:#181818; --muted:#767676;
  --faint:#949494; --accent:#c4154f; --accent-dark:#a01040; --gold:#8a6835;
  --rule:#e8e2d9; --rule-strong:#d6ccbd; --num-faint:#ddd5c8; --tint:#fff5f8;
  --font-title:'Newsreader', Georgia, 'Times New Roman', serif;
  --font-body:'Hanken Grotesk', -apple-system, system-ui, sans-serif;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    color-scheme: dark;
    --paper:#12100d; --surface:#1c1915; --ink:#f2ede4; --muted:#a49a8c;
    --faint:#7a7268; --accent:#e0325f; --accent-dark:#c4154f; --gold:#c79b53;
    --rule:#2a251f; --rule-strong:#3a332a; --num-faint:#3a332a; --tint:#241a1e;
  }
}
:root[data-theme="dark"] {
  color-scheme: dark;
  --paper:#12100d; --surface:#1c1915; --ink:#f2ede4; --muted:#a49a8c;
  --faint:#7a7268; --accent:#e0325f; --accent-dark:#c4154f; --gold:#c79b53;
  --rule:#2a251f; --rule-strong:#3a332a; --num-faint:#3a332a; --tint:#241a1e;
}

* { box-sizing: border-box; }
body { margin: 0; background: var(--paper); color: var(--ink);
  font-family: var(--font-body); -webkit-font-smoothing: antialiased; }

/* ---- minimal deck backdrop (stands in for a real deck) ---- */
.deck { height: 100svh; overflow-y: auto; scroll-snap-type: y mandatory; }
.slide { height: 100svh; scroll-snap-align: start; display: grid; place-items: center;
  padding: clamp(32px, 8vw, 120px); }
.slide__inner { width: min(1040px, 100%); }
.kicker { font-size: .72rem; letter-spacing: .16em; text-transform: uppercase;
  color: var(--gold); margin: 0 0 14px; }
.title { font-family: var(--font-title); font-synthesis: none; color: var(--accent);
  text-transform: lowercase; font-weight: 500; line-height: 1;
  font-size: clamp(3rem, 11vw, 7rem); margin: 0; }
.statement { font-size: clamp(1.2rem, 2.6vw, 1.9rem); color: var(--ink);
  max-width: 32ch; margin: 28px 0 0; line-height: 1.35; }
.deck-footer { position: fixed; left: 0; right: 0; bottom: 0; z-index: 40;
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px clamp(18px, 4vw, 40px); font-size: .72rem; color: var(--faint);
  text-transform: uppercase; letter-spacing: .1em; pointer-events: none; }

/* deck.js isn't loaded here, so stand in for its theme button */
.deck-theme { position: fixed; top: 18px; right: 20px; z-index: 70;
  width: 34px; height: 34px; border-radius: 50%; border: 1px solid var(--rule-strong);
  background: var(--surface); color: var(--muted); cursor: pointer; font-size: .9rem;
  display: flex; align-items: center; justify-content: center; opacity: .55; }

/* ---- the component under test ---- */
${navCss}

/* ---- showcase controls (not part of the framework) ---- */
.sc-bar { position: fixed; z-index: 200; left: 50%; bottom: 20px; transform: translateX(-50%);
  display: flex; gap: 8px; flex-wrap: wrap; align-items: center; justify-content: center;
  padding: 10px 12px; background: var(--surface); border: 1px solid var(--rule-strong);
  box-shadow: 0 8px 34px rgba(0,0,0,.16); font-size: .72rem; text-transform: uppercase;
  letter-spacing: .1em; max-width: calc(100vw - 24px); }
.sc-bar__grp { display: flex; gap: 4px; align-items: center; }
.sc-bar__lab { color: var(--gold); margin-right: 4px; }
.sc-bar button { font: inherit; text-transform: uppercase; letter-spacing: .1em;
  padding: 6px 11px; background: transparent; color: var(--muted);
  border: 1px solid var(--rule-strong); cursor: pointer; }
.sc-bar button:hover { color: var(--accent); border-color: var(--accent); }
.sc-bar button[aria-pressed="true"] { color: var(--paper); background: var(--accent); border-color: var(--accent); }
.sc-bar__sep { width: 1px; height: 22px; background: var(--rule-strong); margin: 0 2px; }
.sc-hint { position: fixed; z-index: 200; left: 50%; bottom: 74px; transform: translateX(-50%);
  font-size: .72rem; color: var(--faint); background: color-mix(in srgb, var(--surface) 88%, transparent);
  padding: 4px 10px; white-space: nowrap; }
.sc-appendix { position: fixed; inset: 0; z-index: 10; background: var(--paper);
  display: none; overflow-y: auto; padding: clamp(48px,8vh,90px) clamp(24px,6vw,64px); }
.sc-appendix.is-on { display: block; }
body.sc-appendix-on .deck, body.sc-appendix-on .deck-footer { display: none !important; }
.sc-appendix h1 { font-family: var(--font-title); font-synthesis: none; color: var(--accent);
  text-transform: lowercase; font-weight: 500; font-size: clamp(2.4rem,6vw,3.4rem);
  border-bottom: 2px solid var(--ink); padding-bottom: 14px; margin: 0 0 24px; }
.sc-appendix p { color: var(--muted); max-width: 60ch; line-height: 1.618; }
@media (max-width: 640px) { .sc-bar { font-size: .64rem; } .sc-bar button { padding: 5px 8px; } }
</style>

<button type="button" class="deck-theme" id="scTheme" aria-label="Toggle dark mode">&#9790;</button>

<main class="deck">
  <section class="slide" data-crumb="none"><div class="slide__inner">
    <p class="kicker">deck-nav &middot; framework component</p>
    <h1 class="title">navigation</h1>
    <p class="statement">One configurable component. Switch modes with the bar below &mdash; each one is how a different deck would ship.</p>
  </div></section>
  <section class="slide" data-toc="The Work" data-crumb="work"><div class="slide__inner">
    <p class="kicker">the work</p><h1 class="title">the work</h1>
    <p class="statement">Motion design, title sequences, and generative visuals.</p>
  </div></section>
  <section class="slide" data-toc="Downloads" data-crumb="downloads"><div class="slide__inner">
    <p class="kicker">open source</p><h1 class="title">downloads</h1>
    <p class="statement">Every source file &mdash; After Effects, Illustrator, Photoshop, Cinema 4D &mdash; free to learn from.</p>
  </div></section>
  <section class="slide" data-toc="Instructions" data-crumb="instructions"><div class="slide__inner">
    <p class="kicker">how to use</p><h1 class="title">instructions</h1>
    <p class="statement">Grab Source Files Part 1 &amp; 2 and dig in. Learn, remix, and share.</p>
  </div></section>
  <section class="slide" data-toc="Credits" data-crumb="credits"><div class="slide__inner">
    <p class="kicker">credits</p><h1 class="title">have fun</h1>
    <p class="statement">Movecraft is the work of Colin Evoy Sebestyen.</p>
  </div></section>
</main>

<footer class="deck-footer"><span>deck-nav showcase</span><span>movecraft</span></footer>

<template class="deck-nav-resources">
  <a href="#part1"  data-desc="A directory of Adobe (AE/AI/PSD) and Cinema 4D source files." data-pdf="#part1.zip" data-dl="zip">Source Files &mdash; Part 1</a>
  <a href="#part2"  data-desc="The rest of the project directories, plus a few VDMX5 files." data-pdf="#part2.zip" data-dl="zip">Source Files &mdash; Part 2</a>
  <a href="#splice" data-desc="Festival title package &mdash; After Effects + Cinema 4D." data-pdf="#splice.zip" data-dl="zip">Splice Festival</a>
  <a href="#pixel"  data-desc="Generative visual system &mdash; VDMX5 + Cinema 4D." data-pdf="#pixel.zip" data-dl="zip">Pixel Spirit</a>
</template>

<div class="sc-appendix" id="scAppendix">
  <h1>downloads.</h1>
  <p>This is where the 2-page paradigm (toggle mode) lands you &mdash; one click from the deck to here, one click back. No overlay. Good for a companion page like a downloads index.</p>
  <p style="margin-top:24px"><em>In a real deck this is your downloads.html: every source file, free to learn from.</em></p>
</div>

<div class="sc-hint" id="scHint"></div>
<div class="sc-bar" role="group" aria-label="Showcase controls">
  <div class="sc-bar__grp"><span class="sc-bar__lab">mode</span>
    <button type="button" data-mode="menu"   aria-pressed="true">menu</button>
    <button type="button" data-mode="toc"    aria-pressed="false">toc</button>
    <button type="button" data-mode="toggle" aria-pressed="false">toggle</button>
    <button type="button" data-mode="off"    aria-pressed="false">off</button>
  </div>
  <span class="sc-bar__sep"></span>
  <div class="sc-bar__grp" id="scStyleGrp"><span class="sc-bar__lab">style</span>
    <button type="button" data-style="editorial" aria-pressed="false">editorial</button>
    <button type="button" data-style="drawer"    aria-pressed="true">drawer</button>
  </div>
</div>

<script>
${navJs}
</script>
<script>
(function () {
  var mode = 'menu', style = 'drawer';
  var hint = document.getElementById('scHint');
  var appendix = document.getElementById('scAppendix');
  var styleGrp = document.getElementById('scStyleGrp');
  function press(sel, val, attr) {
    document.querySelectorAll(sel).forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute(attr) === val));
    });
  }
  function remount() {
    appendix.classList.remove('is-on');
    document.body.classList.remove('sc-appendix-on');
    var overlayMode = (mode === 'menu' || mode === 'toc');
    styleGrp.style.opacity = overlayMode ? '1' : '.35';
    styleGrp.style.pointerEvents = overlayMode ? 'auto' : 'none';
    if (mode === 'toggle') {
      DeckNav.mount({ mode: 'toggle', target: '#', dir: 'forward' });
      hint.innerHTML = 'click the round <strong>a.</strong> (upper-right) &mdash; then <strong>&larr;</strong> to return';
    } else if (mode === 'off') {
      DeckNav.unmount();
      hint.innerHTML = 'no nav chrome &mdash; drive with keys / clicker only';
    } else {
      DeckNav.mount({ mode: mode, title: (mode === 'toc' ? 'contents' : 'menu'), resLabel: 'downloads', style: style });
      hint.innerHTML = 'hover the navicon (upper-right) to reveal <strong>' +
        (mode === 'toc' ? 'contents' : 'menu') + '</strong>, click to open &mdash; or press <strong>m</strong>';
    }
  }
  document.querySelectorAll('[data-mode]').forEach(function (b) {
    b.addEventListener('click', function () {
      mode = b.getAttribute('data-mode'); press('[data-mode]', mode, 'data-mode'); remount();
    });
  });
  document.querySelectorAll('[data-style]').forEach(function (b) {
    b.addEventListener('click', function () {
      style = b.getAttribute('data-style'); press('[data-style]', style, 'data-style'); remount();
    });
  });
  document.body.addEventListener('click', function (e) {
    var pill = e.target.closest('.deck-nav-btn--toggle');
    if (!pill) return;
    e.preventDefault();
    if (pill.getAttribute('data-dir') === 'back') {
      appendix.classList.remove('is-on');
      document.body.classList.remove('sc-appendix-on');
      DeckNav.mount({ mode: 'toggle', target: '#', dir: 'forward' });
    } else {
      appendix.classList.add('is-on');
      document.body.classList.add('sc-appendix-on');
      DeckNav.mount({ mode: 'toggle', target: '#', dir: 'back' });
    }
  });
  var themeBtn = document.getElementById('scTheme');
  function isDark() {
    var t = document.documentElement.getAttribute('data-theme');
    if (t) return t === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  function syncThemeBtn() { themeBtn.innerHTML = isDark() ? '&#9728;' : '&#9790;'; }
  themeBtn.addEventListener('click', function () {
    document.documentElement.setAttribute('data-theme', isDark() ? 'light' : 'dark');
    syncThemeBtn();
  });
  syncThemeBtn();
  remount();
})();
</script>`;

writeFileSync(new URL('./nav-showcase.artifact.html', import.meta.url), page);
console.log('wrote nav-showcase.artifact.html (' + (page.length / 1024).toFixed(0) + ' KB)');
