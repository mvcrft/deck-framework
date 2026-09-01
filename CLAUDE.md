# CLAUDE.md — deck-framework

Context for Claude / agents working in this repo. **`FRAMEWORK.md` is the full
build guide** — read it for component patterns, nav modes, and extending.

## What this is

A reusable HTML **slide-deck engine** + a configurable **navigation component**.
Full-height scroll-snap slides, keyboard + presentation-remote nav, light/dark.
It hardcodes **no colors or fonts** — it reads CSS variables, so it's skinned by
a paired design system.

- **Public, MIT** (`mvcrft/deck-framework`). Pairs with
  **`movecraft-design-system`** (the skin). One repo each — the private/open
  twins were collapsed 2026-09-01; old private history is archived in
  `~/Desktop/MDI/_archive/deck-framework-private.bundle`.
- This repo stays font/brand-agnostic and free of any CoH/MDI content.

## Files

| File | Role |
|------|------|
| `deck.css` / `deck.js` | The slide engine — scroll-snap, keys, clicker (PageDown/PageUp), `f` fullscreen, `b`/`.` blackout, `d` theme toggle, progress/dots, crossfade + breadcrumbs. 100% `var(--token)`. |
| `deck-nav.css` / `deck-nav.js` | The nav component (add-on; include **after** deck.js). |
| `nav-showcase.html` | Live demo; loads the sibling `../movecraft-design-system/`. |
| `build-nav-artifact.mjs` | Assembles `nav-showcase.artifact.html` — a fully self-contained (CSS/JS/fonts inlined) build of the demo for pasting into a Claude Artifact. Fetches the open Newsreader + Hanken woff2 from gstatic at build time; output is public-safe. `node build-nav-artifact.mjs`. The output is gitignored. |
| `logo.svg` | Footer mark. |
| `FRAMEWORK.md` | Full guide. |

## The nav component

One attribute on `<body>` picks the mode:
`data-deck-nav="menu | toc | toggle | off"`.
Config: `data-deck-nav-{title,label,target,dir,style,appendix}`, and per
resource-link `data-dl` (download label). Contents is built from slides tagged
`data-toc="Section"` (falls back to `data-crumb` sections) — **sections, never
every slide**. Resources come from a `<template class="deck-nav-resources">`.
JS API: `DeckNav.mount(opts)` / `DeckNav.unmount()`.

## Conventions / gotchas

- **Font/brand-agnostic:** everything is `var(--token)`; never hardcode colors
  or fonts here — that's the design system's job.
- **Attribute name is `data-deck-nav`, NOT `data-nav`** — deck.js already uses
  `data-nav="prev|next"` on the arrow buttons; don't collide.
- **`.deck-nav-overlay[hidden] { display:none }`** is required — the overlay's
  `display:flex` otherwise beats the UA `[hidden]` rule and the closed scrim
  covers the page.
- **Serve over http from the PARENT dir** so `../movecraft-design-system/`
  resolves (`cd .. && python3 -m http.server`, open
  `deck-framework/nav-showcase.html`).
- **Fonts are the design system's call.** A deck links one of
  `../movecraft-design-system/fonts.css` (open Newsreader/Hanken, default) or
  `fonts-licensed.css` (branded Outsiders/Battersea — run the design system's
  `./fetch-fonts.sh` first; those woff2 are gitignored there).
- Menu/toc jump reuses the engine's auto-built dots, so it works in scroll and
  crossfade decks.
- Keep motion restrained; update `FRAMEWORK.md` whenever you add a feature.
