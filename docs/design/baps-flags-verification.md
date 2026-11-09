# BAPS flags verification — 2026-11-09

The campus now carries 15 rectangular BAPS flags: one on each of the six exhibition domes, one on the principal mandir shikhar, and eight on the secondary shikhars. Existing crowns, kalash profiles, and stonework are preserved. The mandir's nine lower pyramidal roofs and decorative stone spire motifs are not counted as the nine main shikhars.

## Artwork and mounting

- `public/textures/baps-flag.png` is the original, unmodified attachment: 636 × 212 RGB PNG, no alpha channel. SHA-256: `eef22d04641490020d967ef6f0a6f133ebc721f41343761a06ee15349047caec`.
- The full 3:1 UV rectangle retains the bands, emblem, and lettering. One shared sRGB texture uses mipmaps and up to 8× anisotropic filtering. White material color avoids tinting the supplied texture; the fabric is opaque and double-sided.
- Widths are 2.4 scene units on the principal shikhar, 1.2 on secondary shikhars, and 1.5 on domes. Slender gold staffs extend above the existing finial tips.
- Destination labels have screen-space clearance above the flags in the entrance view, including the smaller distant domes.

## Motion and rendering

- Cloth uses the same `sampleCampusWind(environmentTime)` as the foliage and the existing scene clock. Parent rotations are inverted when applying the prevailing wind, so the opposing pavilion orientations cannot reverse it.
- The entire pole edge stays fixed. Two traveling waves produce folds and finer flutter, with deterministic per-flag phase variation. Shared gust strength increases ripples; weak wind increases droop.
- Normals are recomputed on the small cloth meshes for directional fold shading. The normal shadow pass uses the same deformed geometry. Poles remain rigid.
- Desktop flags have 225 vertices each. Mobile flags use 102 vertices nearby and 36 at distance, with hysteresis around the detail switch. All flags retain the same texture and outline; they are never culled by a distance budget.
- Existing garden pause, reduced-motion, visibility, and offscreen lifecycle controls govern the shared clock. The texture load triggers a render even on an initial reduced-motion visit. Texture, materials, and both detail geometries are disposed with the scene.

## Observed validation

- `npx playwright test tests/campus-flags.spec.ts tests/domed-pavilions.spec.ts tests/hero-camera.spec.ts`: **20 passed**.
- Geometry checks cover all 15 mounts, unique IDs, fixed pole edges, common world-space direction, phase variation, lull droop, stronger gust ripples, and unchanged edge positions across mobile detail changes.
- Bottom-edge samples were ray-tested against the actual building meshes over 120 seconds of weather. Every sampled clearance exceeded 0.35 scene units.
- Chrome renders at 1440 × 900 and 390 × 844 confirmed texture loading, moving geometry, pause, and initial reduced-motion behavior without browser console errors. Existing camera coverage also passed at 320, 834, and 844 px widths, including phone landscape and navigation through all six pavilions.
- An isolated WebGL fixture imports the actual production flag module and texture for close-up inspection. Both faces retain red/white bands and the emblem; the reverse lettering is naturally mirrored. Two poses one second apart change 17,032 image pixels, confirming visible cloth movement.
- `npx tsc --noEmit`, ESLint on the five changed source/test files, `git diff --check`, and `npm run build`: **passed**. One sandboxed build stalled at compilation; the subsequent permitted build completed successfully.

## Visual evidence

- [Desktop entrance](baps-flags/entrance-desktop.png)
- [Mobile entrance](baps-flags/entrance-mobile.png)
- [Close-up front](baps-flags/close-up-front.png)
- [Close-up reverse](baps-flags/close-up-reverse.png)
- [Close-up alternate cloth pose](baps-flags/close-up-flutter.png)

The six dome flags are visible from the desktop entrance. Some rear mandir flags are naturally occluded by its architecture from this fixed viewpoint; geometry checks verify all nine mounts. Fine lettering is readable nearby, while distant flags resolve mainly as red/white bands. Mobile checks use Chrome viewport emulation, not physical phone hardware.
