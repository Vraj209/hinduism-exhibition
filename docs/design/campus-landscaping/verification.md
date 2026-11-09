# Campus landscaping — 2026-11-09

The campus now contains 129 trees (previously 26), four canopy forms and 20 low
shrub islands. Planting includes a dense perimeter, four trees assigned to each
of the six pavilion groves, paired shade-tree rows at 20-unit intervals, balanced
entrance islands, and side/rear greenery around the mandir.

The shared planting plan feeds rendering, foliage sound proximity and walking
obstacles. All pavilion entrance corridors and the axial fountain garden remain
open. Geometry checks compare the instanced crowns against pavilion walls and
the mandir envelope; navigation checks cover all 36 pavilion-to-pavilion routes.

Trees reuse eight geometry pairs (four forms at two detail levels). Camera
distance selects detail with hysteresis. Both levels retain matching crown
centers and branch skeletons. Branch/leaf phase and response vary per instance;
color and depth passes share the existing weather clock. Soft contact shadows
remain beneath distant trees when their mobile shadow-map contribution is off.
Existing reduced-motion, pause and background suspension controls apply.

## Verification

- 28 distinct Playwright tests passed across planting, campus layout, walking,
  navigation, walk controller and environment suites. The final canopy-shape
  and shrub-height refinement was followed by all 12 planting/navigation/walk
  controller tests again.
- TypeScript, scoped ESLint, `git diff --check` and production build passed.
- Headless Chrome checks at 320, 390, 768, 1024 and 1440 pixels reported no
  JavaScript/WebGL errors or horizontal overflow; all six map labels remained.
- At the entrance, desktop uses 224,508 instanced tree triangles and mobile
  106,520 (52.6% fewer), retaining all 129 trees. Tree geometry storage is 13,322
  triangles desktop and 6,974 mobile. The overhead view uses eight tree draw
  calls; near/far mixtures use at most sixteen, excluding soil/contact shadows.
- These are geometry budgets measured with viewport emulation, not physical
  phone frame-rate benchmarks. Production was built locally, not deployed.

See `verification.json` for observed scene budgets and `entrance-1440.png`,
`entrance-390.png`, `map-1440.png` and `map-390.png` for final previews.
