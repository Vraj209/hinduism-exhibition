# Standing at the campus entrance

9 November 2026 · America/Toronto

This records the entrance-camera baseline before the later [cloud and side-fountain update](sky-side-fountains-verification.md), which extends the near garden and adjusts portrait framing to include both fountains. The saved images and field-of-view values below remain the earlier revision's evidence.

This revision replaces the elevated opening with a full-screen perspective view from the entrance. The approved six pavilion meshes, thematic carvings, section content and axial arrangement are retained: left 1/2/3, right 6/5/4, with the Robbinsville-inspired landmark centered at the far end. The environment's breeze, foliage shadows, fountains, ripples, drifting leaves and opt-in ambience remain integrated.

## Camera and scale

The mandir model's 24.8-unit width corresponds to the official 255-foot width reported in the [BAPS backgrounder](https://media.baps.dev/wp-content/uploads/2023/09/03155408/03_BAPS-Swaminarayan-Akshardham-Backgrounder.pdf). This gives **3.134032258 metres per scene unit**. The camera is at `(0, 0.02 + 1.7 / 3.134032258, 46)` above paving at Y=0.02. Its initial target is `(0, cameraY, -49)`: a level optical axis, no roll, no automatic orbit or idle camera movement.

Wide screens use an 88-degree horizontal field of view; phone portrait uses a 58-degree vertical field. Intermediate aspect ratios blend continuously, including through square viewports. A small off-center lens shift allocates room to the buildings while keeping the camera level and verticals parallel. It does not raise or tilt the camera. At 1440×900 the vertical field is 62.227 degrees.

The camera sits farther back to separate all six pavilion silhouettes on desktop. Foreground paving uses approximately 1.25-metre slabs; paired low planting frames the approach. Walks, fountain rims, jets, benches, hedges and flowers are scaled consistently with the camera. The low front hedge opens at the axis so the basin remains visible from standing height. The narrower portrait view gives priority to the mandir and garden; off-screen sections remain reachable through the selector and deliberate looking.

This scale is a design calibration, not a measured exhibition-site survey. The mandir remains an explicitly labeled **photo-based reconstruction**, with the [same documented unresolved geometry](robbinsville-mandir-reference.md). The [official Explore reference](https://usa.akshardham.org/explore) informed the architectural reference review. No sketch image was accessible in this chat or the available project files; the arrangement follows the written instructions and has not been compared to that missing drawing.

## Visitor controls and return behavior

- Horizontal drag/touch begins only after a deliberate seven-pixel movement. Vertical touch remains available for page scrolling. Looking is bounded to ±0.48 radians (approximately ±27.5 degrees), with no momentum or automatic recentering.
- Look left/right buttons and the focused scene's arrow keys provide keyboard alternatives. Home and Reset View restore the central axis. Button-driven looking settles in 260 ms; reduced motion applies it immediately.
- Requests made during a return transition are retained, so a new Look or Reset request takes effect after the camera returns. The latest request wins. A change to reduced motion cancels an in-progress look animation.
- Campus Map switches to an overhead orthographic view with optional zoom. Entrance View restores the previous horizontal look.
- Selecting any of the six labeled pavilions or selector options retains the existing entrance, relief-viewing and interior journey. Returning restores the saved campus mode, camera position, direction and map zoom. Focus returns to the selected visible pavilion label; if it is off screen, focus returns to the section selector.
- The quiet introduction and primary action occupy open sky. Navigation sits at the edges. The central mandir is not a seventh destination. Ambience starts only after explicit enabling; pause and reduced-motion behavior are preserved.

## Browser evidence

Local Chrome and emulated viewports: 1440×900, 1280×720, 834×1194, 390×844, 320×568, 844×390 and 640×360. Captures use reduced motion for repeatability. These are browser/emulation checks, not physical-device performance measurements.

[Desktop](hero-entrance/hero-1440.png) · [1280 px desktop](hero-entrance/hero-1280.png) · [Tablet](hero-entrance/hero-834.png) · [Phone](hero-entrance/hero-390.png) · [Narrow phone](hero-entrance/hero-320.png) · [Landscape phone](hero-entrance/hero-844.png) · [Short landscape](hero-entrance/hero-640.png) · [Campus Map](hero-entrance/campus-map-1440.png) · [Browser measurements](hero-entrance/browser-verification.json)

The captures report no page errors, no horizontal overflow and no clipped hero controls. Automated checks verify actual camera pose/target, calibrated eye height, idle stability, bounded mouse/keyboard/touch looking, six-section access, saved view restoration and responsive framing.

## Validation

- `npx tsc --noEmit`: passed.
- `npm run lint`: passed.
- `npm run build`: passed; all routes generated. A sandboxed repeat stalled at CSS compilation and was stopped; the final build succeeded with local worker permissions.
- Full integrated Playwright suite: **66/66 passed** in 3.5 minutes, isolated output `/tmp/hinduism-hero-full-clean`.
- After the final tablet label-only adjustment, all **17/17 affected hero and campus-layout checks passed** in 48.6 seconds (`/tmp/hinduism-hero-tablet-final`), including explicit bounds checks for every visible desktop/tablet caption. TypeScript, ESLint and the production build passed again on that final state.
- Twelve hero-specific checks cover desktop, tablet, portrait/landscape phones, eye height and level target, six accessible destinations, true idle stability, bounded keyboard/mouse/touch controls, saved views, queued Look/Reset during return, continuous square-aspect resizing and reduced motion enabled during a look animation.
- Existing regressions cover all six entrance/relief/interior journeys, exact camera and focus restoration, cancellation, browser history, fallback, ambient audio lifecycle and accessibility scans. A return-focus race discovered during the first run was fixed and rechecked; no failing expectation was removed to mask it.
- Seven viewport captures report no page errors, horizontal overflow or clipped hero controls. Manual review corrected short-landscape introduction overlap and tablet edge-caption clipping.

No deployment was performed. The existing local preview runs at `http://localhost:3000`.
