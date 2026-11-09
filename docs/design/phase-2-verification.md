# Phase 2 verification

## Production browser result

On 8 November 2026 (America/Toronto), this command passed **35/35 tests in 49.3 seconds** against the local production build:

```bash
PLAYWRIGHT_BASE_URL=http://localhost:3001 npm run test:e2e
```

The tests use installed Chrome through Playwright. The server was already running; the suite did not start, stop, or deploy it. Regression files are `tests/exhibition.spec.ts` and `tests/immersive.spec.ts`.

This final full-suite run followed the desktop story-index spacing adjustment, section-6 conceptual scene-description correction, and formatting-only cleanup. The final production build, ESLint, and TypeScript checks also passed. An earlier production checkpoint passed 35/35 in 48.4 seconds; the result above is the later rebuilt version.

## Verified behavior

- Exactly six accessible campus destinations preserve the PDF’s titles and sequence. Keyboard entry selects the actual pavilion, changes to a perspective entrance camera, and focuses the story heading at arrival.
- The Festival world supports all three source-bound moments. Story changes retain the same world canvas and the exterior entrance pose; they do not repeat the campus approach.
- Each moment’s summary includes the whole section context, takeaways, source link, and optional scene explanation. The Festival explanation explicitly records that no named festivals or festival stories were supplied.
- Guided section navigation, the six-section chooser, same-current-section selection, direct story links, browser Back/Forward, reload, and optional saved progress preserve the intended section and moment.
- Rapid section selections cancel stale arrivals and leave only the final world interactive.
- Returning to the map restores the exact overview position, target, zoom, and selected label focus. An initially observed reduced-motion focus race was fixed and its regression passed in the production suite.
- Pause stops the ambient render loop; Resume restarts it. Opening a summary automatically pauses rendering. A simulated document-hidden event stops ambient frames.
- No native `AudioContext` is created before an explicit sound-button gesture. Sound is off initially. The native context runs after that gesture, suspends while reading a summary, suspends and stays muted after a simulated hidden/visible cycle, and closes after returning to the map.
- Reduced motion disables ambient movement without removing the stories. Manual static mode, a forced WebGL failure, and denied local storage preserve navigation and reading.
- All eighteen static story images load successfully. Each world has three distinct image files; the UI selects the matching section/story filename and presents its corresponding summary and source link.
- With JavaScript disabled, `/read` contains all six section articles and all eighteen native story disclosures. Every disclosure opens and exposes its summary, takeaway, and page-1 PDF link.

## Responsive and accessibility checks

World controls and summaries were exercised at 390 × 844, 320 × 568, 844 × 390, and 640 × 360. The long section-6 heading and the section-2 moment “A connection to something greater” were both checked. Text regions stay between the header and controls; short landscape layouts provide a reachable summary action and scrolling text. The map and reading route were also checked at 834 × 1194.

Fifteen Axe scans returned zero detected violations for the configured WCAG A/AA rule tags:

- Home, map, and reading route.
- Each of all six mobile world views.
- Each of all six mobile summary dialogs.

Keyboard checks cover entry, focus at arrival, Escape closing a summary, focus returning to its trigger, and focus returning to the selected map label. These checks do not constitute VoiceOver, NVDA, or other screen-reader testing.

## Renderer and asset evidence

The renderer inspection recorded these model counts and maximum sampled submissions across the three moments of each world. **Geometry triangles count the meshes in a world. Rendered triangles and draw calls include repeated submissions for shadows and, where used, reflection; they are not additional unique model geometry.** Cached shadows mean later ambient frames can submit less work than the sampled maximum.

| World | Geometry triangles | Maximum sampled draw calls | Maximum sampled rendered triangles |
| --- | ---: | ---: | ---: |
| 1 · Hindu Jivan Shaili | 62,192 | 27 | 121,928 |
| 2 · Hindu Riti/Parampara | 54,808 | 25 | 101,904 |
| 3 · Hindu Manyata | 35,726 | 44 | 104,678 |
| 4 · Hindu Festivals | 88,642 | 39 | 263,894 |
| 5 · Hindu Mulyo | 58,804 | 41 | 116,168 |
| 6 · Hindu Sanskruti Ādhār Stambh | 58,336 | 27 | 107,656 |

These numbers were checked against the renderer agent’s captured canvas datasets in `/tmp/hinduism-campus-preview/world-metrics.json` and the section-3 recapture `world-metrics-3.json`. The campus remains a separate 199,438-triangle model, retained to preserve map orientation. These are local rendering counters, not physical-device GPU or memory benchmarks.

Configured controls include an ambient cap of 12 frames per second for the other five worlds and 24 for Festival, device-pixel ratio capped at 1.25, and Festival reflection textures of 256 × 256 on mobile / 512 × 512 on desktop. Pause and reduced motion halt ambient frame production. Shadow maps for static architectural geometry are cached.

The eighteen 1440 × 900 WebP story images total **2,374,362 bytes**, verified from the files in `public/worlds/`. Each image is the fallback for its corresponding moment. Only the chosen world and moment need to be shown to the visitor.

## Visual evidence

Production captures, inspected visually:

- `phase-2-desktop.png`: Festival moment 1, 1440 × 1000, with the architectural world, readable caption, story navigation, summary action, and atmosphere controls.
- `phase-2-mobile.png`: the same moment at 390 × 844.

Both captures were refreshed after the final rebuilt production suite passed, including the corrected desktop story-index spacing. The renderer agent separately inspected the eighteen poster frames.

## Practical limits

This is local production-build verification. It is not a public deployment check. Headless Chrome viewport tests do not establish physical phone/iPad GPU speed, touch hardware behavior, thermal performance, battery use, or real mobile-network loading. No field Core Web Vitals or Lighthouse score is claimed.

The document-hidden checks deliberately inject a visibility event to exercise lifecycle handling; they do not measure OS background-tab scheduling. Audio checks observe actual `AudioContext` lifecycle states; they are not a perceptual listening-quality assessment. Automated accessibility scans supplement the keyboard checks and do not replace screen-reader review.

The exhibition source remains a one-page takeaway sheet. The worlds, story scenes, and visual metaphors are original digital interpretations, not documentary reconstructions or approved religious media. No absent festival names, detailed doctrines, ritual instructions, historical episodes, or attributed quotations were added to the source-backed summaries.
