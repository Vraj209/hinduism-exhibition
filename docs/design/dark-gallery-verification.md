# Dark dome gallery — implementation and verification

9 November 2026 · America/Toronto

This records the initial dark-gallery implementation. The later [all-dome photography follow-up](all-dome-photography-verification.md) replaces the remaining fifteen rendered story illustrations with BAPS photographs and records its separate validation.

## Delivered

All six dome interiors now share a dark HTML scroll gallery, informed by the presentation of [BAPS Akshardham Discover](https://usa.akshardham.org/discover). The outdoor campus, planting, architecture and walking controls retain their existing presentation.

Five domes contain an opening, three approved story moments and a closing. Festivals preserves all fourteen previously approved celebrations with opening and closing bookends. Total: 41 displays, including all 29 existing stories. The PDF themes remain separate from the later BAPS festival research.

Desktop displays approach with restrained perspective, remain stationary during a broad reading interval, and fade away as the next image approaches. Scroll position is the only narrative clock. Backward scrolling and previous/next buttons revisit the same sequence. Important text is accessible HTML. Phones, short windows and reduced-motion preferences use ordinary vertical flow.

The entry surface fades from the campus into charcoal darkness with a faint floor, warm-white text and restrained gold. Photographs remain unfiltered and use containment rather than subject cropping. The current gallery is silent: outdoor ambience fades and suspends while preserving the visitor's enabled state and volume, then resumes outside. No interior AudioContext, autoplaying video or continuous 3D render loop is introduced.

Back to Campus remains reachable. Closing displays provide Next Exhibition, Return to Campus and a native full-summary dialog. Existing story hashes remain stable; section-only routes open the introduction, and `/closing` opens the takeaway. Scrolling replaces the current history entry. Browser Back/Forward retains exhibition routes.

## Integration corrections

- Capture the outdoor walking position, yaw and pitch once on entry and retain them across successive dome visits. Restore that exact snapshot on return.
- Synchronize the section-navigation hash subscriber before rendering instant arrivals. This prevents a delayed native hash event from clearing a completed reduced-motion arrival.
- Suspend outdoor movement/look inputs in a gallery and restore focus on return.
- Preserve native mobile reading offsets during viewport-height changes; do not snap readers to a display's beginning.
- Focus the active heading when entering through a story or closing deep link.
- Preload the gallery module on approach instead of the retired interior WebGL module.

## Media

`content/gallery-media.ts` records all fourteen official BAPS photographs with local path, original image URL, source event page, subject description, event context, dimensions and credit. The optimized WebP set totals 2,158,488 bytes. No subject compositing or image darkening is applied. Annakut, Fuldol and Guru Purnima portraits retain their full subjects. Navratri depicts devotional singing at its documented celebration.

At the initial implementation stage, the remaining fifteen story visuals reused the existing original exhibition illustrations and were labelled accordingly. The linked follow-up supersedes those fifteen visuals. The public sources page and gallery summary expose credits. Photo provenance does not assert independent licensing or BAPS endorsement. This revision has not been deployed or published.

## Validation

- `npm run build` — passed; all four application routes built, with `/`, `/read`, and `/references` statically rendered.
- `npm run lint` — passed.
- `npx tsc --noEmit` and `git diff --check` — passed.
- 14 production Chrome checks in `dome-gallery.spec.ts`, `gallery-layout.spec.ts`, and `gallery-campus-return.spec.ts` — passed against `http://localhost:3001`.
- 31 migrated Chrome checks in `exhibition.spec.ts`, `immersive.spec.ts`, `revision.spec.ts`, and `walk-interiors.spec.ts` — passed.
- 12 affected campus integration checks across walking, campus layout, camera, fountains, environment/audio and domed-pavilion suites — passed. One development audio run was interrupted by Fast Refresh; its clean production rerun passed.

The 14 production checks include all 41 display bounds at 1440×900, 1024×768, 768×680, 390×844, 320×740 and 844×390, desktop/mobile axe checks, normal and reduced-motion flow, backward progression, stationary reading, progressive loading, deep-link focus, browser history, summary focus restoration, resize position and exact walking-pose return. The migrated suites also check all 29 stories, their media and official sources, no-JavaScript reading/credits, denied storage, and WebGL failure.

These are focused regression runs, not a claim that every unrelated repository test ran. Existing working-tree changes were preserved. No deployment or Git commit was made.

## Review images

Production screenshots are in `docs/design/dark-gallery/`:

- `1440-hindu-jivan-shaili-0.png` — opening.
- `1440-hindu-festivals-1.png` — Diwali, image/text composition.
- `1440-hindu-festivals-2.png` — Annakut, reversed composition and portrait containment.
- `1440-hindu-festivals-7.png` — long festival heading.
- `1440-hindu-festivals-14.png` — Navratri.
- `1440-hindu-sanskruti-adhar-stambh-3.png` — centered image and caption.
- `390-hindu-festivals-1.png` — mobile Diwali.
- `390-hindu-festivals-2.png` — mobile Annakut.
- `390-hindu-festivals-15.png` — mobile closing actions.
