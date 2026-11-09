# Moving clouds and paired garden fountains

9 November 2026 · America/Toronto

The entrance remains a level 1.7-metre view along the central garden toward the mandir. The six approved pavilions, thematic carvings, inward entrances, central water basin and its five fountain groups remain. Two additional fountains now frame the entrance garden, with animated clouds above and independent spatial water sounds after ambience is enabled.

## Composition and circulation

The matching fountains occupy paired entrance parterres at X = ±6, Z = 29, radius 2.1 scene units. Each basin is approximately 13.2 metres across in the scene's established calibration. Carved courses, rolled coping, a rosette frieze and a lotus bowl use the campus stone palette. The central stream reaches approximately 10.3 metres above grade, with twelve inward arcs, a continuous falling curtain, fine falling droplets, impact splashes, expanding ripples and reflected architecture/sky.

The garden extends from Z = -33 to 33. The side walks retain their four-unit width and run from Z = -35 to 37; the near crosswalk occupies Z = 33 to 37. This preserves continuous circulation around the water and every existing pavilion approach. Fountains clear the inner side-walk edges by 1.4 units (about 4.4 metres). Their inner edges leave a 7.8-unit central opening, and their rear edges clear the original axial basin. Trees and benches remain in their original locations.

The initial farther-side-bay proposal passed footprint checks but was occluded by the pavilions from standing height. It was replaced after screenshot review. The final tests trace sightlines to all 24 sampled rim points and the central plume of each fountain against the actual approved pavilion meshes. Both fountains are visible in the opening desktop and phone compositions.

Desktop retains an 88-degree horizontal field of view. The 390×844 portrait view uses 94 degrees vertically, approximately 53 degrees horizontally, to frame both fountains without raising the camera. A 105-degree diagonal cap keeps intermediate/square aspect ratios bounded; the change through aspect ratios is continuous. The same camera position, level target, deliberate looking controls and saved-view restoration remain.

## Cloud, water and sound behavior

- Original periodic cloud density textures form three world-space layers on desktop and two on phones. Different altitudes, scales and densities create depth. The field drifts along the shared wind direction at 0.24 scene units per second. Clear space and haze around the horizon retain the mandir silhouette.
- The same moving density field casts soft shading on actual stone, paving, grass and foliage. Direct light attenuation is restrained to 9.5% locally; overall sunlight changes by at most 2.5%. Cloud shadows require no additional shadow-map render pass.
- All cloud and water updates use the existing garden clock. Pause, reduced motion, hidden tabs, offscreen campus and completed interior arrival stop unnecessary animation. The idle camera remains still.
- Side fountains use batched stone/stream meshes and instanced droplets. Wind gently offsets fine spray and changes ripple normals. Each basin has a separate one-time cubemap capture; central reflections also include the new sky. Reflections are static captures with animated surface normals, not recurring live cubemap renders.
- Each side fountain has an independent mono noise buffer, filter, gain and stereo panner. Distance, camera orientation and approaching the left/right side change their prominence independently. Distinct 17- and 23-second loops avoid identical channels; the existing central water, air and rustling remain.
- All three water gains share a bounded mix before the existing limiter. Enable, mute, volume, background suspension, indoor fade and return behavior are preserved. No audio starts before explicit enabling. Offline 40-second mix scenarios found no clipping, with maximum peak 0.1434 at the default volume; this measures signal headroom, not perceived loudness on every device. [Scenario evidence](sky-side-fountains/audio-headroom-scenarios.json).

These are original procedural assets, with no downloaded sky images, recordings or third-party meshes. The existing photo-based mandir attribution and geometric limits are unchanged. Shader output follows the [Three.js color-management guidance](https://threejs.org/manual/pages/color-management.html).

## Responsive budgets and evidence

| Added effect | Desktop | Phone |
| --- | --- | --- |
| Cloud layers / density texture | 3 / 512² | 2 / 256² |
| Side-fountain flowing jets | 26 | 26 |
| Side-fountain falling droplets / splashes | 560 / 144 | 220 / 56 |
| Reflection size per side basin | 64² per face | 32² per face |

The local five-second animation samples measured approximately 22 rendered fps at 1440×900 and 19 fps at 390×844, under the existing 30/20 fps animation caps. Camera pose stayed fixed, cloud offsets advanced continuously, and button-driven looking settled in 337/318 ms including browser automation overhead. These measurements were taken in local Chrome while other verification ran; they are not physical-phone or cross-device performance guarantees. [Measured render and interaction data](sky-side-fountains/motion-metrics.json).

Final captures report no JavaScript, WebGL or shader errors at 1440×900, 834×1194, 390×844, 320×568 and 844×390. The 3D overhead view and lightweight SVG map include the two new fountains and connected near circulation.

[Desktop entrance](sky-side-fountains/entrance-1440.png) · [Phone entrance](sky-side-fountains/entrance-390.png) · [Tablet](sky-side-fountains/entrance-834.png) · [Narrow phone](sky-side-fountains/entrance-320.png) · [Landscape phone](sky-side-fountains/entrance-844.png) · [Phone look right](sky-side-fountains/look-right-390.png) · [Overhead](sky-side-fountains/overhead-1440.png) · [Browser measurements](sky-side-fountains/browser-verification.json)

## Validation

TypeScript, ESLint and the production build pass. A separate local production-server smoke test verified the compiled cloud/fountain scene, opt-in sound, section entry, and exact return target with no browser errors; its temporary server was stopped afterward. [Production smoke evidence](sky-side-fountains/production-smoke.json).

The integrated Playwright run passed **71 of 72 checks** in 4.3 minutes. The remaining `/read` navigation encountered a transient localhost connection refusal, then passed unchanged on immediate rerun. Every check has a passing result, with no outstanding assertion failures. Run artifacts: `/tmp/hinduism-sky-fountains-full-final` and `/tmp/hinduism-sky-fountains-reading-recheck`.

The six new environment checks cover actual-mesh sightlines to the basin rims and plumes, path and entrance clearances, stationary camera with moving clouds, pause/visibility/reduced-motion behavior, lower mobile budgets, five real audio sources with distinct left/right buffers, independent approach gains and indoor/return lifecycle. Existing hero, six-section journey, history, fallback and accessibility checks remain covered. The hero FOV check now evaluates diagonal perspective across screen shapes rather than using a portrait-inappropriate vertical limit.

No deployment was performed. The local preview remains at `http://localhost:3000/`.
