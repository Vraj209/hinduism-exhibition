# Verification and delivery record

Date: 8 November 2026, America/Toronto. Local implementation; no public deployment performed.

## Source fidelity

The source audit is in `../exhibition-source-outline.md`. The one supplied PDF page was extracted and visually inspected. All six exact headings, their order and the three subdivisions inside section 6 were verified. `public/exhibition-source.pdf` is byte-identical to the original. Both experiences consume `content/exhibition.ts`.

No floor plan, approved exhibition photography, named festival stories or full religious teaching panels were supplied. The campus and its architectural motifs are explicitly identified as original digital interpretations. Concise summaries do not invent additional history or religious teachings. Section 6 preserves and attributes the exhibition's Sant — Guru / Satpurush perspective.

## Delivery sequence

1. Recorded the source outline, proposed campus, six architectural concepts, material/typographic system, interaction plan and budgets in `experience-plan.md` before extending the environments.
2. Implemented the first pavilion with detailed arches, pillars, plinths and dome; inspected its overview/entrance renders and verified map → camera → reading → return on mobile.
3. Extended the shared architectural system to six distinct silhouettes, refined trees and carving details, and optimized geometry.
4. Captured the final real 3D camera as the fallback image; HTML labels use corresponding projections corrected for the containing image's aspect ratio.
5. Verified the complete production build and recorded browser/accessibility evidence below.

## Build and code checks

- `npm run build`: passes; `/`, `/read`, `/_not-found` and `/icon.svg` are statically prerendered.
- `npm run lint`: passes without warnings.
- `npx tsc --noEmit`: passes.
- `git diff --check`: passes.
- Fixed the starter's Tailwind Turbopack rule to exclude CSS Modules, preserving native CSS-module processing.
- Production server preview: `http://localhost:3001`; development preview: `http://localhost:3000`.

## Browser verification

Chrome at desktop 1440 × 1000, mobile 390 × 844, and tablet 834 × 1194. Additional reading-only tests used 768 × 1024 and 1440 × 1100. Tests are in `tests/exhibition.spec.ts`, with a reusable Playwright config and `npm run test:e2e` script. The existing local server is not started or stopped by the tests.

**Final production result:** `PLAYWRIGHT_BASE_URL=http://localhost:3001 npx playwright test` passed **15/15 tests in 17.4 seconds**.

Covered outcomes:

- Exactly six independently named accessible destinations and the source's exact sequence.
- Keyboard entry and visible focus; reading heading receives focus after camera arrival.
- Normal camera travel takes approximately 1.5 seconds; reduced motion skips travel.
- Guided next/previous navigation, completion, direct section hashes and browser Back/Forward.
- Rapid, interrupted selection settles on the final selected pavilion.
- Clicking the current pavilion again leaves its reading panel available. The actual canvas-raycast regression was observed failing against the previous build and passing after the same-target guard was added.
- Returning restores overview zoom and focuses the previously selected destination.
- All six summaries work without WebGL; `/read` works with JavaScript disabled.
- Storage denial does not interrupt navigation or reading.
- Mobile and tablet have no horizontal overflow. Returning from mobile reading restores the map's viewport.
- Mobile headline spacing and caption/control separation are explicitly checked.
- Four axe scans: home, map, full reading view and mobile section 6 with expanded takeaways. Zero detected WCAG A/AA violations after correcting contrast and accessible-name alignment.
- Native About dialog provides a named dialog, focus containment, close control and source links.

## Measured asset budgets

| Metric | Established target | Measured result |
| --- | --- | --- |
| Actual geometry | < 200,000 triangles | 199,438 |
| Renderer submissions including shadow pass | Report separately | 398,734 triangles |
| Draw calls including shadows | < 120 | 90 |
| Deferred Three.js bundle | < 250 KB gzip | 149,463 bytes gzip |
| Local font files combined | < 200 KB | 74,572 bytes |
| Rendered fallback map | < 300 KB | 58,102 bytes, 900 × 650 WebP |
| External image/texture requests | None | None; small procedural stone texture |

Geometry is merged by material. Pixel ratio is capped at 1.5 on desktop and 1.25 on mobile. The scene renders on demand during resizing, hover and camera movement; there is no idle animation loop. All mesh geometry, materials, textures, observers and event handlers are disposed on unmount. The useful fallback and HTML navigation precede the separately loaded 3D scene.

## Visual evidence

- `desktop-preview.png`: final production page, 1440 × 1087 full-page capture.
- `mobile-preview.png`: final production page, 390 × 1675 full-page capture.
- `reading-verification.md`: independent source and reading-route audit.

## Practical limits

Responsive browser testing does not measure a physical phone or iPad GPU, touch hardware, thermal behavior, battery consumption or real mobile network performance. No Lighthouse lab score or field Core Web Vitals result is claimed. Automated accessibility scans do not replace manual screen-reader testing; VoiceOver/NVDA were not tested. The architecture is a detailed original digital scale model, not a photogrammetric reconstruction of the mandir. Full exhibition panels and approved images would be needed to expand the source content beyond the supplied takeaway sheet.
