# Campus sky animation — November 9, 2026

Implemented in the existing Three.js campus and opt-in garden ambience.

- Three small flocks (12 birds) follow continuous, curved world-space routes. Individual spacing, size, altitude, speed modulation and flap timing vary; smooth envelopes alternate wing beats with short glides. Wide turns carry birds out of the frame without respawning or wrapping positions. Two higher flocks occupy open sky; a lower, farther flock can pass behind the mandir.
- Bird meshes use the normal depth buffer and atmospheric fog. Two oblique routes now pass closer, above the campus, making their wings readable; the third stays behind the mandir. Sampled routes over 1,400 seconds remain more than 8 scene units from the actual mandir bounds and more than 35 units from the arrival camera. The overhead routes stay above 28 units, clear of roofs and trees. Raycasts confirm the mandir occludes part of the distant flight path.
- Cloud detail evolves slowly while all layers continue downwind at 1.6 scene units per second (previously 0.24). A slightly bluer sky improves cloud contrast. Differently scaled density samples reduce recognizable repetition. Existing perspective, horizon haze, soft surface shadows and sunlight modulation (at most 2.5%) remain.
- Original synthesized bird calls begin after 9–14 seconds of enabled ambience, then recur at varied 17–36-second intervals. Four short buffers are reused with varied playback rates and stereo placement. Their gain stays at 9% of the central fountain gain before the shared master volume and limiter. Ended sources disconnect; no additional timer runs.
- Bird/cloud time uses the existing environment clock. Pause, reduced motion, hidden state and leaving the campus viewport stop ambient updates. Resuming does not catch up hidden time. Opt-in sound retains its separate accessibility behavior and suspends with the existing hidden/indoor/mute lifecycle.

| Budget | Desktop | Mobile |
| --- | ---: | ---: |
| Birds / flocks | 12 / 3 | 5 / 2 |
| Added bird draw calls | 2 | 2 |
| Added bird triangles | 108 | 45 |
| Cloud layers | 3 | 2 |
| Cloud density samples per evaluation | 3 | 2 |
| Cloud texture | 512² | 256² |

[Desktop capture](sky-animation/desktop.png) · [Mobile capture](sky-animation/mobile.png)

## Visibility correction

The first implementation advanced its animation clock but was visually too faint. In five-second captures, only 0.17% of sampled desktop sky pixels and 0.08% of mobile sky pixels changed by at least four RGB levels on average. No bird pixels met the silhouette contrast threshold. Counter-only animation checks missed this problem.

After moving two flocks closer, giving their flight paths a diagonal heading, increasing silhouette contrast/size, and increasing cloud drift, the same test finds **10.57%** changed desktop sky pixels and **24.47%** on mobile. It detects **42 desktop / 15 mobile** contrasting bird pixels in the sampled band. Mobile silhouettes have a small readability size adjustment while retaining five birds.

The regression test inspects actual screenshots in the sky band between 25% and 45% of viewport height. It excludes warm architecture/UI colors when finding bird pixels and excludes dark pixels when measuring cloud changes. These measurements verify visibility and change, not perceptual quality on every display.

[Measurements](sky-animation/visibility-metrics.json) · [Desktop after five seconds](sky-animation/desktop-after-five-seconds.png) · [Mobile after five seconds](sky-animation/mobile-after-five-seconds.png)

## Verification

- `npx tsc --noEmit`, `npm run lint`, and `npm run build` pass.
- **13 current Playwright checks pass** across `campus-sky-animation` and `sky-side-fountains`, including actual pixel visibility, five-second cloud movement, pause, reduced motion, hidden-page behavior, audio and route clearance. The preceding 33-check run additionally covered visitor audio, environment and hero camera regressions.
- Coverage includes desktop/mobile rendering, console/WebGL/shader errors, stationary camera, motion pause, initial and live reduced motion, hidden/resume continuity, fountain sightlines/audio, accessibility, indoor return, route clearance and actual-mesh occlusion.
- Real OfflineAudioContext rendering verifies two separated calls, less than 3% audible duty across 54 seconds, nonzero signal, peak below 0.01 at a bird gain of 0.05, and source cleanup. This verifies signal limits; perceived loudness was not calibrated on physical speakers/headphones.
- Current screenshots were inspected at 1440×900 and 390×844. Preceding camera regressions also covered 834px, 320px and landscape-phone widths. These are local Chrome checks, not physical-phone performance benchmarks. Current test artifacts: `/tmp/hinduism-sky-visible-final`.

No deployment was performed. Existing local visitor, walking and title work was preserved.
