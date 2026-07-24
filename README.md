# Deck Framework

A small, reusable HTML slide-deck engine — full-height scroll-snap slides,
keyboard + presentation-remote navigation, light/dark, and a configurable
**navigation component** (menu / table-of-contents / 2-page toggle). It
hardcodes no colors or fonts; it reads CSS variables, so you skin it by
pairing it with a design system.

Pairs with **[movecraft-design-system-open](https://github.com/mvcrft/movecraft-design-system-open)**.

## Quick start

Clone both as siblings and serve the parent over http:
```bash
git clone https://github.com/mvcrft/movecraft-design-system-open
git clone https://github.com/mvcrft/deck-framework-open
python3 -m http.server 8791
# open http://localhost:8791/deck-framework-open/nav-showcase.html
```

Your deck's `index.html` loads the design system, then the framework:
```html
<link rel="stylesheet" href="../movecraft-design-system-open/theme-movecraft.css">
<link rel="stylesheet" href="../movecraft-design-system-open/fonts.css">
<link rel="stylesheet" href="../deck-framework-open/deck.css">
<link rel="stylesheet" href="../deck-framework-open/deck-nav.css">   <!-- if using the nav -->
<script src="../deck-framework-open/deck.js"></script>
<script src="../deck-framework-open/deck-nav.js"></script>
```

## Files

| File | Role |
|------|------|
| `deck.css` / `deck.js` | The slide engine — scroll-snap, keys, clicker, blackout, theme toggle. |
| `deck-nav.css` / `deck-nav.js` | Configurable nav component. `<body data-deck-nav="menu\|toc\|toggle\|off">`. |
| `nav-showcase.html` | Live demo (pairs with the sibling design system). |
| `logo.svg` | Footer mark. |
| `FRAMEWORK.md` | Full build guide — components, nav modes, theming, extending. |

See **[`FRAMEWORK.md`](FRAMEWORK.md)** for the complete guide.

## License

MIT © Colin Evoy Sebestyen (see `LICENSE`). Fonts come from the paired design
system (Google Fonts, under their own OFL licenses).
