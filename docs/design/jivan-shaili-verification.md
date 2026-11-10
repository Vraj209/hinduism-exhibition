# Dome 1 — Hindu Jivan Shaili verification

Verified locally on 9 November 2026 in Chrome against the Next.js preview at `http://localhost:3000`.

## Result

The existing hero leads to the combined Bhasha/Bhusha state explorer, then Bhojan (photograph left), Bhajan (photograph right), and the next exhibition. Phones use ordinary vertical scrolling with text before each story photograph. The map and content share stable region IDs; changing state leaves the map and reading position stable.

**Latest territory-language update: all 18 current cases in `tests/jivan-gallery.spec.ts` passed in 17.0 seconds.** This includes both territory language lists, both image paths, successful image loading and generated-image provenance at 1440px and 390px, the existing state explorer, layout, accessibility and legacy navigation checks. Targeted ESLint, `tsc --noEmit` and `git diff --check` also passed.

The earlier initial implementation passed **34 distinct automated scenarios across focused and campus integration runs**. Those historical results below predate removal of the hero chapter-link row and the two territory-image additions. The full focused run passed 28 of its then-29 cases; its sole failure was a test incorrectly expecting keyboard focus styling immediately after pointer-driven programmatic focus. That test was changed to use real Home/ArrowRight input and passed. A subsequent same-hash navigation regression was added and passed before those links were removed.

## Commands and coverage

```sh
npx playwright test tests/jivan-gallery.spec.ts tests/dome-gallery.spec.ts tests/gallery-layout.spec.ts --reporter=list
npx playwright test tests/jivan-gallery.spec.ts --grep 'search, no-results|every poster state|all four chapter links' --reporter=list
npx playwright test tests/exhibition.spec.ts tests/campus-walking.spec.ts tests/campus-layout.spec.ts --grep 'six accessible destinations|closing action follows|all six walking destinations|moving directly between sections' --reporter=list
npx eslint tests/jivan-gallery.spec.ts
```

- Focused suites: 30 distinct cases, including 17 Dome 1 cases, 7 generic narrative-gallery cases, and 6 narrative layout cases. The final targeted rerun passed all 3 selected cases in 4.9 seconds after the last artwork/navigation changes.
- Campus integration: 4/4 passed, covering keyboard entrance, all six exhibition closing links, all six walking destinations and return positions, and direct doorway transitions.
- Dome 1 widths: 320, 390, 768, 1024 and 1440 pixels. No horizontal overflow; native selector targets are at least 44 pixels tall.
- All 36 map regions are selectable through the native selector; one region is marked selected at a time. Search does not change the selected state, no-result searches recover, and small states are reachable without precise map taps.
- Rajasthan pointer hover/click, visible state-name feedback, keyboard Home/ArrowRight navigation, Enter/Space selection, and the visible keyboard-focus stroke were verified.
- Legacy `story-1`, `story-2`, `story-3` and `closing` links retain their destinations after refresh. All four hero chapter links also work when clicked repeatedly at the same hash after scrolling back to the hero.
- Reduced motion leaves no active gallery animations. Axe checks with WCAG 2 A/AA, 2.1 A/AA and 2.2 AA tags reported no violations in the Dome 1 gallery.
- The desktop food/music arrangements, real BAPS source links, image loading, Gujarati HTML text, generated attire disclosure and `object-fit: contain` were verified.

Generic depth-gallery tests now exercise Dome 2. Existing collection-wide tests treat the culture explorer separately from narrative galleries, as they already do for the belief and festival collections.

## Geographic coverage

All 36 unique IDs were exercised against the map and panel. Geometry is sourced from DataMeet / geoBoundaries and keeps islands and separate territory pieces in their geographic positions. See [map provenance and limitations](india-map-provenance.md).

States (28):

```text
IN-AP IN-AR IN-AS IN-BR IN-CG IN-GA IN-GJ IN-HR IN-HP IN-JH
IN-KA IN-KL IN-MP IN-MH IN-MN IN-ML IN-MZ IN-NL IN-OD IN-PB
IN-RJ IN-SK IN-TN IN-TS IN-TR IN-UP IN-UK IN-WB
```

Union territories (8):

```text
IN-AN IN-CH IN-DH IN-DL IN-JK IN-LA IN-LD IN-PY
```

Union territories remain distinct. Jammu and Kashmir and Ladakh have separately requested, reference-informed attire illustrations; the other six territories carry an explicit missing-content notice. Compound SVG paths use the even-odd fill rule so enclaves are preserved. No district boundaries clutter the initial map.

## Attire assets and source limits

The **28 original poster-state** WebP files were decoded and validated after the last Andhra Pradesh, Assam and Bihar footwear refinements. Their SHA-256 hashes are distinct and their dimensions match the image manifest:

| Assets | Dimensions |
| --- | --- |
| 14 | 1024 × 1536 |
| 14 | 960 × 1440 |

The original asset set totals **4,835,206 bytes** (approximately 4.61 MiB); individual files range from 95,892 to 382,528 bytes. Next Image supplies responsive derivatives. Browser checks verified the Gujarat image loads at desktop and mobile sizes and remains contained within its ivory image area.

The user authorized generated individual illustrations when the original individual photographs were unavailable. These are reference-derived generated images, not original photographs or independent evidence of garment accuracy. Each carries a visible generated-image disclosure and generated-image alt text. Full source photos have not been supplied. See the state content audit and individual-generation manifests for transcription and review notes.

State language lists now follow the user's subsequent 28-state table of regional languages and varieties; the references page retains its eight supplied citations. The lists are explicitly non-exhaustive. Unreadable Gujarati garment labels remain explicitly pending. State names and readable poster content are accessible HTML; no enlargement of tiny poster photographs or whole-poster interactive content is used. Regional/community identifications and the traditional-dress variation note are retained.

The later Jammu and Kashmir and Ladakh addition uses a separate territory inventory. Both map entries show generated full-outfit illustrations, their Kashmiri or Ladakhi ceremonial example labels, and distinct reference-based provenance. Their subsequently requested Bhasha sections show researched regional language examples using the existing horizontal, wrapping list. They retain the “Union territory” header and do not receive fabricated poster numbers or Gujarati translations. The other six union territories retain the unavailable-content panel. Targeted browser checks cover the language lists, image loading, containment, disclosures and horizontal overflow at desktop and phone widths.

Both additional WebP images are 1024 × 1536: `in-jk.webp` is 294,084 bytes and `in-la.webp` is 340,404 bytes. Exact prompts, source references, dimensions and SHA-256 hashes are in `attire-generated-territories.json`.

## Visual review and paint correction

The final captures show the warm ivory, maroon and gold treatment, full Gujarat headwear and footwear, a complete state map alongside the attire panel, and the alternating authentic BAPS photographs. A Chrome paint issue could omit the header in sequential captures with WebGL enabled despite correct geometry and hit testing. A scoped `translateZ(0)` on the Dome 1 header restored its visible paint without changing layout; final captures confirm the header is present.

The no-WebGL test harness deliberately makes Three.js log a context-creation failure, which produces a development issue badge. This is expected fallback-test setup. Normal WebGL screenshots have no red error badge. A small Next.js development indicator remains in the preview captures.

Screenshots:

- [Complete map and Gujarat outfit, 1440 × 1100](jivan-shaili/1440-explorer-detail.png)
- [Desktop hero](jivan-shaili/1440-hero.png), [map introduction](jivan-shaili/1440-map.png), [Bhojan](jivan-shaili/1440-bhojan.png), [Bhajan](jivan-shaili/1440-bhajan.png)
- [Mobile hero](jivan-shaili/390-hero.png), [map introduction](jivan-shaili/390-map.png), [state details](jivan-shaili/390-state-details.png), [full attire](jivan-shaili/390-state-attire.png), [Bhojan](jivan-shaili/390-bhojan.png), [Bhajan](jivan-shaili/390-bhajan.png)

Automated checks verify content reachability, rendering and accessibility mechanics. They do not certify the cultural or photographic accuracy of generated illustrations; source verification and the visible limitations remain necessary.

## Final production build

`npm run build` passed after all 28 final assets and the repeated chapter-link fix were integrated: compilation, TypeScript and static generation completed successfully. The first final build stalled at compilation under the restricted sandbox and was interrupted; the normal-permission retry completed without code changes. Targeted ESLint, `npx tsc --noEmit` and `git diff --check` also passed.
