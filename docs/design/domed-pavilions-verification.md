# Domed pavilion revision verification

## Final production result

On **9 November 2026**, the complete suite passed **43/43 tests in 1.9 minutes**, with one worker, no retries and installed Chrome against `http://localhost:3001`:

```sh
PLAYWRIGHT_BASE_URL=http://localhost:3001 npm run test:e2e
```

The root agent reported a successful final production build, ESLint and TypeScript checks before this run. All **16 Axe scans reported zero automatically detectable WCAG A/AA violations**. This is a fresh result for the domed-pavilion build; earlier revision results are not being reused.

After the suite, the campus fallback alone was recaptured to match the page's `#f7f0e3` background. Runtime code, geometry, camera projections and all 58 story posters remained unchanged. The final fallback was then verified through its production HTTP response and a forced-WebGL-failure screenshot. The full suite was not repeated for that background-only asset change.

## Functional and source coverage

- All six map destinations enter their matching world after a stable, stationary entrance-relief reveal. The test samples the camera during the hold, then verifies the correct world and return focus.
- Canceling during the relief reveal restores the map and selected label. The check waits another second after restoration, beyond the canceled arrival deadline, to catch a stale callback reopening the world.
- The first doorway center is `-11,2.3,8`, without the previous side offset. Exact overview position, target and zoom restoration remain covered.
- Keyboard entry, section selection, rapid interruptions, deep links, browser Back/Forward, reload and saved progress passed. Festival story 14 resumes correctly after returning to the map; native keyboard selection was exercised in Chrome on macOS.
- Pause stops new render frames; summary reading pauses automatically. No AudioContext is created before the sound gesture, and audio lifecycle checks cover summary, hidden state and map return.
- Reduced motion, manual static mode, forced WebGL failure and denied storage preserve the reading/navigation paths.
- All 14 festival choices select the intended scene weights, title, hash and official BAPS source. Six original PDF messages and selected exact quotations remain separate from this labeled research extension.
- The no-JavaScript reading route exposes all 29 story summaries. No-JavaScript references include the identified Hall 1 gallery, the original-dome qualification, six carving descriptions and 14 festival references.
- All 58 desktop/mobile poster URLs load successfully, with distinct data and correct story mapping. All 29 actual static selections were exercised at 1440px and 390px.
- Long section and festival names were checked at 390 × 844, 320 × 568, 844 × 390 and 640 × 360. Essential controls remain fully within the viewport; the short-landscape picker does not overlap the reading copy, header or footer.

The 16 accessibility scans cover home, map, reading, references, and all six mobile world/summary pairs. Exact source assertions and state/file checks protect content boundaries and selection behavior; they do not independently authenticate visual subject matter.

## Production visual evidence

The following fresh screenshots were captured from the final local production server after the fallback correction. All four capture sessions reported no page errors, and each screenshot was visually inspected:

| View                          | Evidence                                  | Observation                                                                                                                                                                                                                                |
| ----------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Arrival, 1440 × 1000 viewport | [Arrival](domed-arrival.png)              | The coherent six-dome family, primary invitation and six section cards are visible.                                                                                                                                                        |
| Map, 1440 × 1000 viewport     | [Desktop map](domed-campus-desktop.png)   | All six entrances, domes and text labels are visible; shared proportions/materials and distinct relief subjects read together.                                                                                                             |
| Map, 390 × 844 viewport       | [Mobile map](domed-campus-mobile.png)     | All six numbered destinations remain visible; full names remain available in the section cards below. The page scrolls naturally.                                                                                                          |
| Forced WebGL failure          | [Fallback map](domed-campus-fallback.png) | The original rendered fallback matches the live architectural family and label positions, with the corrected paper background. Its lower-resolution image clips peripheral platform edges, while all six pavilion subjects remain visible. |

The root agent also inspected the live desktop/mobile campus, the section 2 approach at both sizes, all six interior carving placements and actual section 2 UI entry. The campus agent's [six entrance contact sheet](domed-pavilion-family/entrance-contact-sheet.webp) and [full entrance images](domed-campus-rendering.md) show the individual reliefs at the stationary viewing positions. This verification additionally inspected that contact sheet and full-size entrance 6; the long theme remains readable and its relief sits below the cornice.

The interior capture agent reviewed all 58 frames in [four new contact sheets](domed-interior-rendering.md), plus full-resolution mobile views 3-3, 5-1 and 6-2. Primary story subjects remain visible; narrow mobile compositions may omit a near-column repeat while retaining the principal thematic relief. These visual reviews are distinct from automated image-hash and scene-state checks.

## Final assets and reproducibility

| Asset set              | Count and dimensions |         Bytes |
| ---------------------- | -------------------- | ------------: |
| Campus fallback        | 1 WebP, 900 × 650    |        82,518 |
| Desktop story posters  | 29 WebP, 1440 × 900  |     4,456,676 |
| Mobile story posters   | 29 WebP, 780 × 1000  |     2,759,614 |
| Combined story posters | 58 files             | **7,216,290** |

The final campus fallback returned HTTP 200 with SHA-256 `cd428ff4cab3b0d39eecf1b49b3cf40cf45ff0968b79428b2782b30a9fa3a4ca`. The capture agent checked its paper color as RGB 247,240,227 before WebP export. Mobile story images use the actual mobile camera at 390 × 500 CSS pixels and export DPR 2, rather than cropping the desktop render.

All four [campus source fingerprints](domed-pavilion-family/source-hashes.json) and all eight [interior source fingerprints](domed-interior-contact-sheets/source-hashes.json) were independently compared with the final workspace and matched. Interior per-frame hashes and capture metrics are retained in [capture-metrics.json](domed-interior-contact-sheets/capture-metrics.json). All 12 paused capture contexts maintained an unchanged render count during a 250ms sample, with no browser, console or scene errors reported by the capture agent.

## Geometry and rendering cost

The [campus evidence](domed-campus-rendering.md) and [interior evidence](domed-interior-rendering.md) distinguish retained geometry from render submissions that repeat work for shadows or reflections:

| Scene                                    | Retained geometry triangles | Peak render calls | Peak submitted triangles |
| ---------------------------------------- | --------------------------: | ----------------: | -----------------------: |
| Six-pavilion campus                      |                     271,162 |                92 |                  542,182 |
| World 1                                  |                      98,148 |                35 |                  193,840 |
| World 2                                  |                      95,816 |                29 |                  179,840 |
| World 3                                  |                      56,818 |                53 |                  167,954 |
| World 4, all 14 festival stages retained |                     345,748 |                49 |                  261,600 |
| World 5                                  |                      78,284 |                47 |                  154,720 |
| World 6                                  |                     105,480 |                33 |                  197,864 |

The campus ordinarily uses 47 calls; its peak includes the initial shadow pass, which is cached afterward. Only the selected festival stage renders, so retained festival geometry exceeds a single frame's submitted triangles. Campus and Festival exceed the earlier 200k retained-geometry aspiration; calls remain below 120. These measured counters are not hardware frame-rate benchmarks.

The [relief validation](thematic-relief-evidence/geometry-validation.json) covers 72 section/variant/motif cases: finite positions/normals/UVs, no material groups, and correct physical bounds including bevels. Component lint, TypeScript and isolated Chrome render checks passed. The [hero](thematic-relief-evidence/hinduism-relief-hero.png), [drum](thematic-relief-evidence/hinduism-relief-band.png), [medallion](thematic-relief-evidence/hinduism-relief-medallion.png), and [pillar](thematic-relief-evidence/hinduism-relief-pillar.png) studies were visually inspected: raised forms, bevelled frames and cast shadows establish actual geometry rather than image decals.

## Source and verification limits

The [reference plan](domed-pavilions-reference-plan.md) identifies official archival photographs of **Exhibition Hall 1 at Akshardham New Delhi**. They support façade vocabulary. The prominent dome family and its proportions are original, user-requested design choices; the photographs do not establish that large dome profile. The [thematic relief plan](thematic-relief-plan.md) ties the six carvings to the supplied PDF. The Festival exterior remains based on light, truth and love; the 14 named festivals remain separately sourced research inside that destination. No official photograph is imported into the application.

Checks ran on local production in installed desktop Chrome, including emulated mobile viewports. No public deployment, physical-device, screen-reader, Lighthouse or hardware FPS claim is made. Automated accessibility checks do not replace assistive-technology testing. Simulated visibility events verify application lifecycle handling, not operating-system scheduling; AudioContext observations do not assess listening quality.
