# Hero cursive typography

Verified locally on November 9, 2026, with headless Chrome against the running Next.js app.

The initial measurements below are historical. The later size and button-placement follow-up at the end records the current presentation.

The real `h1` uses Dancing Script 600, served as a 25,808-byte Latin WOFF2 through `next/font/local`. The font is scoped to the hero title, preloaded, and paired with a metric-adjusted fallback. Its [SIL Open Font License](../../public/fonts/Dancing-Script-OFL.txt) is included. Font sources: [Google Fonts CSS API](https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600&display=swap) and [upstream license](https://github.com/google/fonts/blob/main/ofl/dancingscript/OFL.txt).

The heading retains `#523b29`, natural letter spacing, and a single line. A reserved line box includes flourish padding; the button position follows that box. A height cap and a compact landscape rule preserve the campus view. Map and walking modes retain their compact and visually hidden heading treatments, respectively.

## Responsive checks

| Viewport | Title size |
| --- | ---: |
| 320 × 568 | 56px |
| 390 × 844 | 62.9px |
| 430 × 932 | 67.3px |
| 768 × 1024 | 104.5px |
| 834 × 1194 | 111.7px |
| 1024 × 768 | 132.6px |
| 1280 × 800 | 160.8px |
| 1440 × 900 | 178.4px |
| 1920 × 1080 | 200px |
| 1440 × 600 | 132px |
| 844 × 390 | 42.9px |
| 667 × 375 | 41.3px |
| 568 × 320 | 36px |

All 13 viewports passed checks for loaded font, full-word fit within side padding, no horizontal page overflow, separation from the button and visible dome labels, unchanged interface fonts, and no page JavaScript errors. Screenshots were captured with garden motion enabled. Visual inspection confirmed clear letterforms and unobstructed mandir and navigation.

At 320px and 1440px, holding the font request until after initial render and then releasing it left the heading's dimensions and position, and the button's vertical position, unchanged. One same-origin hero font preload was present. Keyboard activation of Walk Around, focus restoration on exit, and title/button separation in map mode passed.

Additional checks passed:

- `npx eslint components/hero-title.tsx components/exhibition.tsx`
- `npx tsc --noEmit`
- `npm run build`

These checks used browser viewports, not physical devices. Detailed measurements are in [metrics.json](hero-typography/metrics.json).

## Screenshots

- [Narrow phone](hero-typography/phone.png)
- [Tablet](hero-typography/tablet.png)
- [Desktop](hero-typography/desktop.png)
- [Mobile landscape](hero-typography/landscape.png)

## Larger title and bottom walking button — 9 November 2026

At the user's request, Walk Around now occupies a centered row in the bottom control dock. Its existing activation, loading state and return-focus ID are preserved. The title is approximately 25–30% larger at common desktop and phone widths: 225.6px at 1440px, 78.6px at 390px, and 72px at 320px. Short landscape windows retain a separate size cap; the title stays compact in map mode and visually hidden while walking.

Production build, lint, TypeScript and diff checks passed. Six existing Chrome checks passed in 13.6 seconds, covering five responsive hero layouts plus walking activation and restored focus. Additional measurements at eight desktop, tablet, phone and landscape sizes confirmed that the complete title and button fit, the button clears the navigation row, and the page has no horizontal overflow. At 568×320, the taller bottom controls begin just above the lower 40% of the viewport; all controls remain visible.

Current evidence: [desktop](bottom-walk-title/1440.png), [phone](bottom-walk-title/390.png), [narrow phone](bottom-walk-title/320.png), [landscape](bottom-walk-title/844.png), and [measurements](bottom-walk-title/metrics.json). These are local browser checks; no deployment was performed.
