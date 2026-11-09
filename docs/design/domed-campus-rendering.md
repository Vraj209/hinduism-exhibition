# Coherent domed campus: final rendering evidence

Captured 9 November 2026. All six exhibition sections now use one original pavilion family with identical footprint, scale and material treatment. The exterior references are the verified Akshardham New Delhi **exhibition halls**, rather than the main mandir's shikhars. The large repeated round dome is a user-requested original design choice, not a measured reconstruction of an exhibition roof.

The [reference plan](domed-pavilions-reference-plan.md) distinguishes directly observed architecture from the original design. The [thematic relief plan](thematic-relief-plan.md) records the section-specific meanings and source boundaries.

## Architecture

The shared builder in `lib/domed-pavilion.ts` gives each pavilion a 7 × 5.8 wall enclosure, a broad stepped plinth approximately 8.5 × 7.3, floor level 0.85, and one central open doorway. A round 5.8-diameter dome rises above a carved drum and deep eave. No central column blocks any entrance. All six entrances face +Z and are visible from the preserved overview orientation.

The verified exhibition-hall photographs inform horizontal rusticated stone courses, narrow carved pilasters, substantial stepped bases and deep projecting eaves. The six equal footprint placements, round dome proportions, relief compositions, landscape and navigation sequence are original exhibition design.

Every pavilion includes actual raised geometry in:

- one hero relief above the entrance, wholly between the arch lintel and cornice;
- two recessed front panels and two side panels;
- two compact front-pillar medallions;
- eight tangentially oriented thematic segments around the dome drum;
- two small bands alongside the lower doorway.

The original relief shapes are batched into the pavilion's existing stone materials. Small drum bands and pillar medallions use simpler geometry than the main panels. The same carved-stone palette is used on all six pavilions; distinct content carries the theme.

## Camera and interaction

The existing public component API is preserved. The new sequence is approach → stationary `cameraPhase="relief"` → doorway pass → matching `onSettled(id)` callback. The complete exterior travel lasts 2 seconds, including approximately 446 ms of stationary relief viewing. Reduced motion moves directly to the interior pose on the next animation frame.

The close facade reveal stays within the gap between neighboring pavilions. A raised approach control point clears foreground roofs; this prevents the reveal for halls 2 and 4 from starting inside halls 1 and 5. Desktop reveal field of view is 48 degrees, mobile 61 degrees. Every final doorway position is the pavilion center X, Y=2.3, and pavilion Z+1. Pavilion 1's previous side offset has been removed.

Cancellation from the stationary relief phase returns directly toward the saved overview. Only cancellation from a doorway pass or inside pose uses an exit curve. The exact overview position, target and zoom preservation remains in place.

The isolated actual-component harness verified all six matching settled callbacks and their expected central positions, a stable 180 ms sample inside every relief hold, mobile entrances 1/2/4/6, in-bounds mobile labels and cancellation during the relief phase. No page or console errors occurred. TypeScript and scoped ESLint passed. The full application regression suite is separate.

## Measured rendering cost

| Measurement | Final campus |
| --- | ---: |
| Unique scene geometry triangles | 271,162 |
| Normal overview render calls | 47 |
| Maximum calls, including initial shadow pass | 92 |
| Normal overview submitted triangles | 271,162 |
| Maximum submitted triangles, including initial shadow pass | 542,182 |
| Static fallback dimensions | 900 × 650 |
| Capture paper background | `#f7f0e3` |
| Static fallback bytes | 82,518 |
| Idle animation | None; render on demand |
| Runtime pixel-ratio cap | 1.5 desktop; 1.25 mobile |

The scene retains more than the original 200k geometry aspiration to support real relief and enclosed architecture. Material batching keeps calls below 120. Architecture and sunlight are static, so the directional shadow map is generated once and reused throughout camera motion. This reduces repeated rendering cost without altering the shadows. `data-max-draw-calls` and `data-max-render-triangles` preserve the initial shadow-pass peak for inspection; ordinary frame counters report current work. These are renderer counters, not measured hardware frame-rate benchmarks.

## Durable artifacts

- Runtime fallback: `public/campus-overview.webp`, recaptured against the application paper color `#f7f0e3` with unchanged geometry, camera and projections.
- [Final fallback asset fingerprint](domed-pavilion-family/fallback-asset.json).
- [Arrival canvas](domed-pavilion-family/arrival-campus.png) and [overview](domed-pavilion-family/overview.png), captured at the actual overview camera.
- [Six entrance detail contact sheet](domed-pavilion-family/entrance-contact-sheet.webp).
- Full entrance details: [1](domed-pavilion-family/entrance-1.png), [2](domed-pavilion-family/entrance-2.png), [3](domed-pavilion-family/entrance-3.png), [4](domed-pavilion-family/entrance-4.png), [5](domed-pavilion-family/entrance-5.png), [6](domed-pavilion-family/entrance-6.png).
- [Mobile overview](domed-pavilion-family/mobile-overview.png); [mobile entrance 2](domed-pavilion-family/mobile-entrance-2.png).
- [Exact 900 × 650 projection percentages](domed-pavilion-family/projection-900x650.json), copied into `components/fallback-map.tsx`.
- [Renderer and camera measurements](domed-pavilion-family/metrics.json).
- [Frozen source fingerprints](domed-pavilion-family/source-hashes.json), rechecked after capture.

These pictures are rendered from original programmatic geometry. No official reference photograph is redistributed as a site asset. The earlier heterogeneous shikhara/haveli campus images and their metrics are superseded by this coherent dome-family revision.
