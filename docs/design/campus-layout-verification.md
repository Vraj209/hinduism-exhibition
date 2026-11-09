# Axial campus revision verification

9 November 2026 · America/Toronto

## Scope and reference boundary

The available request specified a straight, symmetric campus. No sketch image was present in the available chat or project reference files. The [simple layout preview](../../public/campus-layout.svg) was created and visually inspected before the detailed landscape, against the written placement requirements. **Comparison with the actual hand-drawn sketch remains pending.**

This is the owner's exhibition campus, not the actual Robbinsville grounds. The six approved pavilion meshes, section identities and thematic carving definitions were retained. The mandir is a separately authored **photo-based reconstruction**, with [official references and unresolved details](robbinsville-mandir-reference.md). No authorized downloadable model or measured plan was established. Its generated outer proportions match the published width:length:height ratio; that does not validate individual towers, roofs, carvings or stair details.

## Layout checked

| Depth from visitor entrance | Left | Right | Scene Z |
| --- | --- | --- | --- |
| Near | 1 | 6 | 18 |
| Middle | 2 | 5 | -2 |
| Far | 3 | 4 | -22 |

- Paired centers are X = ±18, with consistent 20-unit row spacing. Local +Z pavilion doorways rotate inward by ±π/2. Each connects to the adjacent broad side walk.
- Mandir center is X = 0, Z = -49, front facing +Z. The model's stair tip is at Z = -36.475. The north connecting walk occupies Z = -36 to -32, leaving a 0.475-unit level clearance before the stair. The paved forecourt connects them.
- Garden is 18 × 60 scene units; basin is 4.2 × 52, both centered at Z = -3. Five fountains have equal 11-unit spacing. Hedges, beds and fountains remain low. Trees sit outside the entrance approaches and between/behind the pavilions.
- Continuous four-unit side walks join at both ends; pedestrian routes do not cross the water. The mandir is excluded from exhibition selection, so there remain exactly six sections.
- The initial camera is on the axis, above the entrance end. A separate overhead button retains the same left-right orientation. Both camera mode and zoom persist through a section visit.
- All entry and exit points are transformed with the pavilion. Direct section changes first leave through the current doorway, preventing a shortcut through its side wall. A stationary relief-viewing phase remains before entering each world.

Measured scene bounds and pair checks: [geometry-verification.json](axial-campus/geometry-verification.json). Coordinates are display units, not construction measurements.

## Browser evidence

Chrome against the local application, with desktop and emulated phone/tablet viewports. The images and geometry/render measurements below record this layout revision before the separately active environmental-realism update began; they are a dated layout baseline, not performance measurements of that later work:

- 320, 390, 768, 1024 and 1440 px widths; welcome and map routes at each width.
- Six visible labels within the horizontal viewport, no horizontal overflow and no browser/page errors at all ten combinations.
- Atomic browser hit tests check every pin, pair symmetry and near-to-far order at desktop and mobile sizes in both camera modes.
- Screenshot review caught and corrected a water surface hidden under its stone edging, a narrow-phone heading collision, and the original stair/crosswalk conflict.
- At this layout baseline, water-only renders do not republish label positions. Gentle surface/ripple motion was capped at 20 fps and stopped with reduced motion, hidden tabs or an active section. The later environment task extends that renderer; its timing and performance require its own verification. Camera transitions remain cancellable.
- Scene geometry: 494,008 triangles, with 128 maximum draw calls including the first static shadow pass in the captured Chrome runs. This is not a physical-phone performance benchmark.

[Browser measurements](axial-campus/browser-verification.json) · [Welcome desktop](axial-campus/welcome-1440.png) · [Entrance campus](axial-campus/entrance-1440.png) · [Overhead](axial-campus/overhead-1440.png) · [390 px](axial-campus/entrance-390.png) · [320 px](axial-campus/entrance-320.png) · [Lightweight map](axial-campus/lightweight-390.png)

## Automated validation

- TypeScript: `npx tsc --noEmit` passed.
- ESLint: `npm run lint` passed.
- Production build: `npm run build` passed on the completed layout revision; all routes generated. A later repeat during concurrent environmental changes stalled during compilation and was stopped. No final build claim is made for that ongoing combined state.
- Full 48-test run: 44 passed; four were interrupted when the concurrently edited environment scene referenced landscape diagnostics before that API update landed. After the interfaces aligned, all five campus-layout tests and the four affected content tests passed. Two reruns initially collided with the other chat’s trace-output cleanup; both then passed with `--output=/tmp/hinduism-layout-final-checks`. The latest combined state was not rerun as a single full suite.
- Focused checks passed for six relief/doorway entries, interrupted-entry cancellation, rapid selection, restored pose/zoom/focus, overhead toggle, source credits, and direct section-to-section doorway exit.

The active “Build Hinduism exhibition website” chat was adding wind, water, foliage and audio to the same workspace during final verification. Those changes were preserved. Current TypeScript and ESLint checks passed after its interfaces aligned. The layout constants, inward doorways, saved poses, direct-section exit and six destinations were reverified against that combined state.

No deployment was performed. The existing development preview is available at `http://localhost:3000`.
