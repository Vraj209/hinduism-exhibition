# Campus walking verification

Verified locally on 2026-11-09.

## Implemented behavior

- Walk Around starts at the approved entrance. A calibrated 1.7-metre eye height follows paving and the six entrance ramps. Movement has acceleration and stopping, a level horizon, and no head bobbing.
- Desktop WASD/arrows walk; Q/E turns, R/F adjusts the limited vertical look, and Home levels it. Mouse/touch dragging looks around. A distinct click/tap on a valid path starts a route with a destination marker. Keyboard commands require focus in the walking area and ignore page controls and dialogs.
- One collision predicate governs manual motion and cached-grid A* routing. Basins, planting beds, hedge walls, trees, pavilion walls, stair cheeks and boundaries block movement. Routes use the outer paths, inner fountain promenades, crosswalks and pavilion approaches. The approved pavilion meshes remain unchanged; separate narrow stone ramps clear their existing stair treads.
- Stop and Go Directly accompany automatic travel. Reduced motion uses immediate destination changes. Each dome arrival identifies its section and offers Enter Exhibition; doorway travel leads to a safe interior position. Direct section navigation remains available.
- The six interiors have defined Entrance, Gallery and Courtyard routes, with Stop and Go Directly. These routes avoid their pools, exhibits and raised surfaces. Summaries and section dialogs pause movement. Returning to campus restores the same dome's outside landing.
- Campus Map preserves the walking pose; Resume Walk restores it. Exit Walk Mode and Return to Entrance work outside, inside and from dialogs. Touch navigation only captures gestures in the active canvas.
- Water sound uses the listener's actual position and independent fountain sources. Shared tree positions supply foliage proximity. Outdoor sound fades indoors and resumes with the retained preference. Immediate/stopped journeys force a final spatial sample, including when reduced motion leaves the garden still.

## Checks

- `npm run build`: passed, including TypeScript and static page generation.
- Scoped ESLint for all changed implementation and new test files: passed. `git diff --check`: passed.
- `tests/campus-navigation.spec.ts`: 6 passed. Covers all six entrance routes, all 36 dome pairs, the garden loop, fountain viewing points, mandir forecourt, blocked destinations, swept collision, ramp continuity and clearance above every approved stair tread. Cold navigation grid plus first route measured approximately 65–75 ms in Node; this is not a phone benchmark.
- `tests/walk-controller.spec.ts`: 1 passed. Runs the real controller and Three.js camera with deterministic animation frames through all six complete automatic routes, without shortcuts. Every rendered sample remains on a valid walking surface at the calibrated eye height.
- `tests/campus-walking.spec.ts`: 5 scenarios passed across focused runs. Covers keyboard/focus isolation, click versus drag, real browser touch events, stopping, direct travel, all six entry/summary/return journeys, map/entrance/exit actions indoors, and spatial sound preference and proximity.
- `tests/walk-interiors.spec.ts`: 3 passed across focused runs. Covers all six interior routes, reduced motion, normal movement, summary pause, Stop/resume/direct travel, and mobile accessibility.
- Existing regression suite: 68/72 passed on the broad run; four scene-loading timeouts passed individually in a subsequent four-test run. No failing behavior remained reproduced. The existing 72 checks cover the approved arrangement, hero framing, direct section journeys, history, summaries, sound, environmental motion, fallback, reading pages and accessibility.
- Responsive browser inspection: 320×568, 390×844, 834×1194, 844×390 and desktop. Main walking controls remain in view with at least 44-pixel heights; no horizontal overflow. Automated axe checks found zero WCAG 2/2.1/2.2 A/AA violations in the mobile walking campus and interior, including active-route controls.

In total, 87 distinct checks have passing results. Browser checks used installed Chrome with mobile/touch emulation; physical iOS/Android hardware and Safari were not tested. The mandir remains the previously documented photo-based reconstruction, and the surrounding exhibition campus remains the owner's design.
