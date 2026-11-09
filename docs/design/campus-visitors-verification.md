# Campus visitors — 9 November 2026

The campus now contains 28 authored visitor appearances on desktop and 16 on mobile. All seven clothing families are present in both budgets: sari, salwar kameez, anarkali, kurta-pajama, sherwani, waistcoat with kurta, and dhoti-kurta. The roster varies colors, borders, modeled folds, motifs, accessories, hair, skin tones, height, age and build. The arrival view includes a family with a child and a separate group on the opposite side of the open central approach.

## Movement and access

- Static route segments are validated against the same paving, planting, fountain and building boundaries used by walking mode. A narrow extension through each actual open portal allows visitors to enter and leave; it does not grant passage through the facade.
- Cohorts follow their slowest member, with independent gait phase, pace and slightly staggered pauses. Visitors look toward the mandir, fountains or exhibition signage. Small wall-mounted plaques use the existing exact exhibition titles and themes.
- Personal clearance is 0.35 campus units (about 1.10 metres between centers). Visitors start yielding before the camera reaches them. A swept collision check also protects the camera when the garden is paused. Manual walking can slide along a clear axis; an obstructed automatic route stops instead of walking through a person.
- Opposing doorway traffic uses edge lanes, reserving the center of the ramp. Visitors do not stop to sightsee on the ramp. Four-minute simulation tests cover all positions, spacing, continuous progress, group cohesion and doorway centers.
- Visitors remain on continuous loops; no recycling teleport occurs. Adaptive removal and reintroduction require the entire padded visitor bound to be outside the camera frustum and more than two scene units from the camera.

## Rendering and sound

Each visitor uses one skinned draw per pass, one shared textile material, cached garment modules and the same procedural pose solver. Three mesh detail levels reduce geometry; distant visitors lose cloth flutter and dynamic shadows first. Sustained render cost or missed ambient frames then lowers the population budget, with hysteresis before recovery. Nearby outfits retain their distinctive colors and silhouette.

The pose clock follows actual distance traveled, including avoidance, rather than time alone. Stance feet are locked in world space and a two-link leg solver maintains ground contact. Pallus, dupattas and hems use bounded shoulder/hem bones driven by stride and the existing world-space breeze. Hidden body surfaces beneath clothing are omitted to prevent obvious intersections.

The crowd shares the existing garden pause, reduced-motion, hidden-tab and indoor suspension. The audio context is still created only by Enable Ambience. Very quiet procedural sole contacts and unvoiced, indistinct hubbub have proximity/pan controls below the water budget. Paused movement silences footfalls; mute, indoor fade and context disposal cover all layers.

## Evidence and limits

- Production build, full ESLint and all 34 targeted checks passed. The five navigation simulation checks were rerun after the final portal adjustment; the remaining 29 checks passed in the integrated run. Coverage includes model scale, full gait cycles and ramps, wardrobe variety, audio lifecycle, static navigation, camera walking, mobile controls and garden pause/visibility behavior.
- The final four-minute simulation measured minimum center spacing of 0.350008 units (1.097 metres), maximum per-frame displacement of 0.038 units and maximum group spread of 1.35928 units. Every visitor traveled at least 32.81 units. Full-cycle and ramp tests held planted soles within 0.0001 campus units of their contact points.
- [Desktop arrival](campus-visitors-desktop.png), [mobile arrival](campus-visitors-mobile.png), [walking view](campus-visitors-walking.png), and [close-up wardrobe](campus-visitors-wardrobe.png) were inspected for scale, visibility, clothing intersections and open approaches.
- [Browser measurements](campus-visitors-metrics.json) retain viewport, frame counts, geometry, detail levels and JavaScript/WebGL error results. These are desktop Chrome and Chrome mobile emulation measurements, not physical-phone GPU or thermal measurements.
- In the final five-second development-server sample, desktop produced 111 ambient frames in 5.023 seconds with 28 visitors; mobile emulation produced 96 in 5.004 seconds with 16. Both recorded no JavaScript/WebGL errors. The measured browser animation-frame 95th percentile was 16.8 ms desktop and 16.7 ms mobile emulation; this browser scheduling measure does not imply that the deliberately capped campus renders at 60 fps.
- Characters are original procedural game models, not scanned humans. Cloth uses constrained skeletal motion rather than a cloth simulation. Footsteps and conversation are synthesized ambience, not recordings or intelligible speech. No external character assets or new runtime dependencies were added.

The existing scene remains capped at 30 ambient updates per second on desktop and 20 on mobile. Measured counts may be lower because of browser frame scheduling and scene workload; this is not a claim of a guaranteed frame rate on every device.
