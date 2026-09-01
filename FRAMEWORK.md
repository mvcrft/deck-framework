# Deck Framework

A reusable, themeable HTML slide deck: full-height scroll-snap slides,
keyboard + presentation-remote nav, light/dark, and a configurable
navigation component. **The design and the engine are two separate git
repos** so they evolve independently:

- **`deck-framework`** (this repo) — the engine: structure, nav, behavior.
  Hardcodes no colors or fonts; consumes CSS variables.
- **`movecraft-design-system`** (sibling repo) — the skin: design tokens +
  fonts. Swap this to re-theme; the framework never changes.

## Reuse in a new project

Clone both repos as siblings (or add them as submodules):
```
your-project/
├── movecraft-design-system/   git clone git@github.com:mvcrft/movecraft-design-system
├── deck-framework/            git clone git@github.com:mvcrft/deck-framework
└── my-deck/index.html
```
Your `index.html` loads the design system, then the framework:
```html
<!-- design system -->
<link rel="stylesheet" href="../movecraft-design-system/theme-movecraft.css">
<link rel="stylesheet" href="../movecraft-design-system/fonts.css"> <!-- open fonts; or fonts-licensed.css for the branded faces -->
<link rel="stylesheet" href="../movecraft-design-system/components.css"> <!-- if using mv-card / mv-btn / etc -->
<!-- framework -->
<link rel="stylesheet" href="../deck-framework/deck.css">
<link rel="stylesheet" href="../deck-framework/deck-nav.css">   <!-- if using the nav -->
...
<script src="../deck-framework/deck.js"></script>
<script src="../deck-framework/deck-nav.js"></script>
```
To re-skin, point at a different design-system repo — nothing in
`deck-framework` changes.

## Files (this repo)

| File | Role |
|------|------|
| `deck.css` | Structure / engine. 100% `var(--token)` — no colors, no fonts. |
| `deck.js` | Navigation engine (scroll-snap, keys, clicker, blackout, theme toggle). |
| `deck-nav.css` | Styles for the nav component (token-based). |
| `deck-nav.js` | The nav component (menu / toc / toggle / off). |
| `logo.svg` | Footer mark. |
| `nav-showcase.html` | Live demo (references the sibling design system). |
| `build-nav-artifact.mjs` | Builds `nav-showcase.artifact.html`, a self-contained (CSS/JS/fonts inlined) copy of the demo for a Claude Artifact. Fetches the open woff2 at build time; output is gitignored. |

Design tokens + fonts live in the **`movecraft-design-system`** repo. It ships
two font sets — `fonts.css` (open Google-hosted Newsreader/Hanken, the default)
and `fonts-licensed.css` (branded Outsiders/Battersea; needs its `fonts/` woff2
via `./fetch-fonts.sh`, which are gitignored there). A deck links exactly one.

## Serve it (don't double-click)

Fonts are referenced woff2, so **Chrome blocks them over `file://`** — serve
over http from the **parent** dir so the sibling paths resolve:
```
cd your-project && python3 -m http.server 8791
# open http://localhost:8791/deck-framework/nav-showcase.html
```

## The nav component (`deck-nav`)

Include `deck-nav.js` **after** `deck.js`, then pick a mode with **one
attribute** on `<body>`:

```html
<body data-deck-nav="menu">     <!-- overlay hub: Contents + Appendix -->
<body data-deck-nav="toc">      <!-- overlay: Contents (section jump) only -->
<body data-deck-nav="toggle">   <!-- 2-page: round "a." to the appendix -->
<body data-deck-nav="off">      <!-- no nav chrome -->
```
(Named `data-deck-nav` so it never clashes with deck.js's `data-nav="prev|next"`.)

**Config attributes** (same element): `data-deck-nav-title`,
`data-deck-nav-label`, `data-deck-nav-target`, `data-deck-nav-dir`
(`forward`|`back`), `data-deck-nav-style` (`drawer` default | `editorial`).

### Modes

- **menu / toc** — a round **hamburger navicon** upper-right (under the theme
  toggle). Hover reveals the word ("menu" / "contents"); click, or press `m`,
  opens the overlay. Two zones:
  - **Contents** — built from slides you tag as section starts:
    `<section class="slide" data-toc="By the Numbers">`. Only tagged slides
    appear (sections, never every slide); falls back to `data-crumb` sections.
    Click → jumps to that section's opening slide (via the engine's dots, so
    it works in scroll and crossfade decks).
  - **Appendix** (menu only) — declared once and cloned in:
    ```html
    <template class="deck-nav-resources">
      <a href="report.html" data-desc="…" data-pdf="pdf/report.pdf">The Written Report</a>
      …
    </template>
    ```
  Style `drawer` (default) slides in from the right and dims the deck;
  `editorial` is a full-bleed index.

- **toggle** — a compact round **"a."** mark, always upper-right, that opens a
  companion page. Put the component on both pages so the mark is persistent:
  ```html
  <body data-deck-nav="toggle">                          <!-- deck: "a." → appendix -->
  <body data-deck-nav="toggle" data-deck-nav-dir="back"> <!-- appendix: "←" → deck -->
  ```

- **off** — no chrome; drive with keys / clicker.

### JS API (optional)
`DeckNav.mount({ mode, title, label, target, dir, style })` and
`DeckNav.unmount()` — used by `nav-showcase.html` to switch modes live. Real
decks just set the attribute and include the script.

## Demo

`nav-showcase.html` — serve it and flip modes/styles/theme with the bottom bar.
