# Living campus environment

## Scope

This revision adds a coordinated outdoor environment to the existing six-pavilion campus, long central fountain garden and Robbinsville-inspired landmark. It preserves the exhibition layout, source content and inward-facing entrances.

The visual effects and garden sound are original procedural work. They are a designed interpretation, not documentary recordings or a simulation of measured weather at either Akshardham site.

## Coordinated effects

- One deterministic breeze direction and overlapping soft gust envelopes drive the complete garden. Individual tree and plant phases prevent synchronized swaying. Trunks remain fixed; branches, canopy leaf fans, flower stems and petals use different responses. Matching visible and depth shaders keep foliage shadows aligned with the moving planting.
- Sparse folded leaf geometry starts at broadleaf tree canopies, follows a descending wind path, settles, and briefly drifts along the ground during stronger gusts. The scene does not add a dense autumn leaf storm to an otherwise green garden.
- Five fountains retain eight orderly parabolic streams each, plus central jets. Moving fringe droplets and short ballistic splashes meet the basin at the ripple origins. Overlapping impact waves combine with wind-directed surface movement. Damp nozzle stone is darker and less rough.
- A small cubemap captures the surrounding architectural geometry once for restrained water reflections. It is not a live full-scene reflection pass on every frame. Fine surface waves and sunlight glints continue to animate over that captured environment.
- The camera remains stationary in the overview while the environment moves. The garden pause control is separate from sound. Reduced motion and hidden-tab state stop the visual loop; entering a pavilion stops the outdoor environment after the approach.
- Original stereo fountain, air and leaf textures use different seamless loop durations. The shared gust controls rustling; camera distance controls water level and clarity, with gentle stereo pan. Audio begins only after **Enable Ambience**, fades before suspension, and retains the visitor's volume/mute intent through pavilion visits.

## Device budgets

| Detail                  | Desktop | Mobile |
| ----------------------- | ------: | -----: |
| Drifting leaves         |      11 |      5 |
| Jet-edge droplets       |     200 |     80 |
| Splash droplets         |     120 |     40 |
| Foliage clusters        |     366 |    246 |
| Flower blooms           |     216 |    216 |
| Reflection cubemap face |  128 px |  64 px |

These are construction-time quality budgets for the initial device viewport. Counts describe retained scene details, not simultaneous visible objects. The same 40 arcing streams remain on both devices.

## Verification coverage

- Confirm that desktop and mobile show active vegetation, sparse leaves, flowing jets and impact ripples while the overview camera remains stationary.
- Verify that reduced motion, the garden pause control, hidden-tab lifecycle and pavilion arrival stop unnecessary outdoor rendering.
- Verify that no AudioContext exists before the ambience gesture; volume, mute, visibility and pavilion transitions affect the actual audio lifecycle.
- Verify that camera approach changes water presence and stereo position, with a smooth outdoor fade on entrance and restoration on return.
- Verify that sound remains available independently of reduced motion and lightweight rendering.
- Check controls with keyboard input, accessibility scans and small mobile viewports.
- Re-run the existing exhibition suite against the final production build.

## Final production result

On **9 November 2026**, the complete production suite passed **54/54 tests in 2.5 minutes**, using installed Chrome, one worker and no retries against `http://localhost:3001`:

```sh
PLAYWRIGHT_BASE_URL=http://localhost:3001 npm run test:e2e
```

All **17 automated accessibility scans reported zero violations**. The six focused environmental checks captured no page or console errors, including shader errors. They verify desktop/mobile quality budgets and a stationary camera; pause and hidden-state frame stops; actual AudioContext creation, volume, mute and suspension; spatial response during approach; interior fade and outdoor restoration; and independent sound in reduced-motion/lightweight modes. The 320px check covers the complete environment control bar with ambience enabled, including actual sound-on and mute context states.

The full run also preserves all existing campus arrangement, six entrance, history, keyboard, summary, content-source, 29-story, 58-poster, WebGL-fallback and storage-failure coverage. An earlier scan identified a motion-button name mismatch; visible text now supplies its accessible name in every state, and the final full run includes that correction.

The root agent reported a successful final production build (session `60675`), ESLint (session `21056`), TypeScript and whitespace checks. The final browser test session was `22190`. No public deployment is claimed.

The root agent also verified the production UI directly: enable ambience, pause garden motion while sound continues, resume motion, enter pavilion 1, and return to the map. During that approach, water presence rose from **0.2215 to 0.6511**, with pan changing from **0 to 0.4265**. Inside, the actual context suspended and the outdoor output target reached zero; returning restored the enabled sound. The preview was left muted with the default browser viewport restored.

## Final visual evidence and rendering cost

Fresh screenshots were captured from the corrected production build and visually reviewed at [desktop entrance view](environment-desktop.png), [390px mobile view](environment-mobile.png), and [overhead view](environment-overhead.png). All six destinations, the garden axis, fountains and Robbinsville-inspired landmark remain visible. The ambience and motion controls stay separate and readable, including the narrow mobile layout. Every capture reported zero page and console errors.

The capture compared actual decoded canvas pixels at a fixed camera, first with motion active and then paused. The active samples, 650ms apart, changed **2,962 desktop**, **328 mobile** and **2,539 overhead** pixels by more than two channel levels. The paused samples, 350ms apart after settling, had **zero changed pixels and zero channel difference** in every view. Camera positions matched across each moving pair. These measurements confirm visible environmental motion and an actually still paused image; they do not quantify naturalness or a hardware frame rate.

| Main campus frame                          |   Desktop |  Mobile |
| ------------------------------------------ | --------: | ------: |
| Retained geometry triangles                |   539,424 | 502,480 |
| Ordinary draw calls                        |        72 |      72 |
| Peak draw calls including shadow refresh   |       137 |     136 |
| Ordinary submitted triangles               |   545,844 | 504,876 |
| Peak submitted triangles including shadows | 1,072,728 | 997,972 |

The environment loop is capped at 30 updates per second on desktop and 20 on mobile. The shadow map refreshes at most eight/four times per second, retaining actual moving foliage shadows without repeating that pass on every frame. The low-resolution reflection cubemap renders six views once during construction; its startup work is separate from these main-frame counters. Camera travel may render at the display's cadence. Paused, hidden, offscreen and completed indoor states stop the unnecessary outdoor loop.

[environment-render-metrics.json](environment-render-metrics.json) retains the final canvas counters, quality budgets, audio targets, label bounds, pixel comparisons, browser version and SHA-256 fingerprints of all 13 involved runtime files. No runtime file changed during this final capture.

The separate [audio signal check](environment-audio-verification.md) rendered the actual Web Audio graph for 40 seconds. The tested mix retained energy at loop boundaries and stayed below clipping. That evidence establishes signal continuity and headroom; it is not a listening-quality claim.

## Test limits

Browser checks use installed desktop Chrome and emulated mobile dimensions. Automated accessibility checks do not replace physical-device or assistive-technology testing. A simulated visibility event verifies the application's lifecycle handler, not operating-system tab scheduling. Rendering counters measure submissions, not hardware frame rate. AudioContext and parameter checks verify the sound graph and transitions; listening quality requires a listening review.
