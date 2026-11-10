# Varied campus flower beds

Verified November 9, 2026.

The campus now has 30 mirrored, stone-edged beds with 2,938 seeded plants: 1,672 tulips, 268 sunflowers, 933 marigolds, and 65 roses. Tulips form curved pink, red, yellow, and white drifts. Orange/yellow marigolds edge the tulips and the path-facing side of sunflower clusters, with additional low beds beside the twin fountains. Roses mark four central-garden corners. Sunflowers occupy outer garden islands near the tree groups.

Plants vary in height, spread, yaw, bloom size, tint, and breeze phase. There are 373 buds among the open flowers. Soil remains exposed between stems. Shared vertex deformation moves the stems and heads with the existing weather clock and uses the same deformation in the shadow pass; pause and reduced motion require no separate timer.

Four species use eight instanced assets across near/far detail levels. Mobile near assets use fewer petal subdivisions, distant flowers retain their positions and colors, and distant flowers skip shadow-map rendering. The flower subsystem uses at most eight plant draws plus two bed-surface draws in the color pass, dropping to six total in the overhead view. Mobile source plant geometry has 1,628 triangles versus 3,294 on desktop. The overhead plants total 200,496 rendered triangles; this excludes bed surfaces and the rest of the campus. These are geometry/draw budgets, not a physical-phone frame-rate benchmark.

Validation:

- Production build, TypeScript, targeted ESLint, and whitespace checks passed.
- All 16 tests across `campus-flowers.spec.ts`, `campus-navigation.spec.ts`, and `campus-planting.spec.ts` passed.
- Bed boundaries clear the inner promenades, basins, pavilion footprints, and central axis. All six entrances, all 36 dome-to-dome routes, and the fountain viewpoints remain reachable.
- Chrome rendered without page or console errors at 320, 390, 768, and 1440 pixels. All six map labels remained visible. Animation pause and reduced motion were verified.
- An earlier shared test-output-directory collision was resolved by using an isolated output directory. A stalled sandboxed build was stopped and rerun successfully outside the sandbox.

`entrance-*.png` and `map-*.png` show the actual campus at each tested width. `tulips-marigolds-detail.png`, `sunflowers-detail.png`, and `roses-detail.png` are isolated close-up renders of the same production flower subsystem, used to inspect geometry and shadows without architecture obscuring the plants.
