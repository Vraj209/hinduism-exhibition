# BAPS / Akshardham revision verification

## Production result — 9 November 2026

All **41 regression checks have passing evidence against the final local production build**, across the full run and the focused correction described below. The target was `http://localhost:3001`, using installed Chrome on macOS through Playwright. The suite used the existing server; it did not deploy or restart it.

| Run | Result | Boundary |
| --- | --- | --- |
| Final full production run | 40 passed, 1 failed; 1.3 minutes | The remaining failure was the test sending `d` and `n` too quickly to a native select. Chrome combined them in its timed type-ahead buffer. All other checks passed, including every source, asset and Axe check. |
| Corrected keyboard/history/resume test, repeated three times | 3/3 passed; 24.6 seconds | A single `n` type-ahead selection after reload verifies native keyboard selection without concatenating two separate intended searches. Each repetition also verifies rapid changes, Back/Forward, reload and saved re-entry at festival 14. No application change was required. |

```bash
PLAYWRIGHT_BASE_URL=http://localhost:3001 npm run test:e2e
PLAYWRIGHT_BASE_URL=http://localhost:3001 npm run test:e2e -- tests/revision.spec.ts --grep 'rapid festival selection' --repeat-each=3
```

This is **not a claim of a single clean 41/41 full-suite run**. The 40 passing checks and the corrected remaining check were verified on the same frozen application build. No further full rerun was performed. Final application build, repository TypeScript and ESLint checks passed; test-file lint also passed. The earlier Phase 2 report concerns the previous 18-moment design and is not used as evidence for this revision.

Tests are in `tests/exhibition.spec.ts`, `tests/immersive.spec.ts`, and `tests/revision.spec.ts`. Independent expected titles, displayed PDF quotations and source destinations live in `tests/exhibition-fixtures.ts`; they are not imported from application content. Section 6 displays the supplied 6C Satpurush/map quotation rather than the source's opening historical-duration statement.

## Source and content checks

- Exactly six section titles, original sequence and six central messages remain. Festival retains the PDF's light/darkness, truth/ego and love/separation message.
- All six displayed source quotations match the supplied PDF, including the selected section-6 statement.
- Fourteen named festivals are labeled as additional BAPS research, with the non-exhaustive scope stated. Annakut and Gujarati New Year remain separate; Ram Navami and Swaminarayan Jayanti remain distinct.
- Every festival summary's primary source link and official-guide link target its expected BAPS page. A separate link identifies the original theme's PDF page. The reading route and source footer distinguish these two bodies of content.
- With JavaScript disabled, `/read` exposes all six section articles and all **29** native story disclosures. Each opens to visible explanatory body text, a takeaway and its correct source link.
- `/references` works without JavaScript at 320px, contains six architecture reference articles and fourteen festival entries, and explicitly distinguishes original artwork from research photographs.

## Navigation, motion and fallback checks

- Keyboard entry selects the actual campus pavilion, moves through its entrance and focuses the story heading. Returning restores the exact overview pose, target, zoom and selected map label focus.
- The Festival sequence retains one canvas while selecting all fourteen stages. Each selected festival produces the expected 14-component stage-weight state, story identifier, title and URL.
- Native chooser selection, guided navigation, the six-section chooser, selecting the current section, direct links, browser Back/Forward, reload and saved progress preserve the intended story. Saved re-entry at story 14 is explicitly checked, guarding against the former three-story limit.
- Rapid pavilion and festival changes cancel stale transitions and leave the intended final world interactive.
- Pause stops ambient render frames; Resume restarts them. Summary reading pauses automatically. A simulated document-hidden event stops rendering.
- Sound starts off, with no AudioContext before an explicit gesture. Its context runs after the sound gesture, suspends for a summary or simulated hidden state, remains muted on return from hidden state, and closes when returning to the map.
- Reduced motion, manual static mode, forced WebGL failure and denied local storage retain story navigation and reading access.

## Responsive assets and layout

All **58** desktop/mobile WebP files returned successfully and decoded. Posters are distinct within each world and variant; each mobile file also differs from its desktop counterpart. All 29 story selections were traversed at 1440px and 390px, checking the visible title, actual responsive image `currentSrc` and corresponding summary source.

File dimensions and sizes were independently read from `public/worlds/`:

| Variant | Count | Dimensions | Total bytes |
| --- | ---: | --- | ---: |
| Desktop | 29 | 1440 × 900 | 4,377,694 |
| Mobile | 29 | 780 × 1000 | 2,754,164 |
| Total | 58 | — | 7,131,858 |

Festival maps to `4-1` through `4-14`; the other five worlds have three moments each. Mobile filenames add `-mobile`. The [asset register](asset-register.md) records the exact mapping and provenance.

Long titles were checked at **390 × 844, 320 × 568, 844 × 390 and 640 × 360**, including section 6, “A connection to something greater,” and “Swaminarayan Jayanti · Hari Jayanti.” Actual navigation, sound, summary and chooser controls remain fully in the viewport. The festival selector does not overlap the readable title/caption region and remains between the header and controls. Long text scrolls within its allotted region, and the short-landscape summary action remains reachable. Map and reading layout also passed at 834 × 1194.

During validation, the 640 × 360 selector/title overlap was corrected and protected by an intersection assertion. The primary festival source link and the reading-route footer were also corrected to identify the additional BAPS research accurately.

## Accessibility and visual evidence

**Sixteen Axe scans returned zero detected violations** for the configured WCAG A/AA tags:

- Home, map, `/read`, and `/references`.
- All six mobile world views.
- All six mobile summary dialogs.

Keyboard checks cover entry and arrival focus, native festival selection, Escape closing a summary, return focus to its trigger and return focus to the selected map label. Native select type-ahead was tested in Chrome on macOS; other platforms may use different native keyboard conventions.

Root's final production browser inspection covered arrival/campus, entrance from the map into Festival, the Annakut selector, pause state, summary source separation and subject/control visibility at 390 × 844. These observations are scoped to the inspected views rather than all festival compositions.

Final production captures use reduced motion for a stable frame and were visually inspected:

- `baps-arrival.png` — arrival and campus at 1440 × 1000.
- `baps-desktop.png` — Annakut at 1440 × 1000.
- `baps-mobile.png` — Annakut at 390 × 844.

State weights, file hashes and image-source checks establish distinct files and correct selection. They do not independently prove cultural authenticity or the visual correctness of every object. Architectural and festival provenance is recorded in [the visual audit](baps-visual-audit.md) and [asset register](asset-register.md).

## Practical limits

This is local production-build verification, not a public deployment check. Desktop Chrome viewport tests do not establish physical-phone GPU speed, touch hardware behavior, thermal performance, battery use or mobile-network loading. No field Core Web Vitals or Lighthouse score is claimed.

The hidden-document checks inject a visibility event to verify application lifecycle handling; they do not measure operating-system background scheduling. Audio checks inspect real AudioContext states, not perceptual listening quality. Automated accessibility scans and keyboard checks do not replace VoiceOver, NVDA or other screen-reader review.

Official photographs remain research references. The application uses original architecture and object illustrations, not documentary reconstructions or licensed official photography. The named festival collection is broad and explicitly non-exhaustive; the one-page PDF remains the source for the original six exhibition messages.
