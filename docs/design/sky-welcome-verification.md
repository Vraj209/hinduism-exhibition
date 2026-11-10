# Sky welcome loading screen

9 November 2026 · America/Toronto

The initial server-rendered screen now reads “Welcome to Hinduism Exhibition” over an original CSS sky with softly drifting cloud layers. The existing local Dancing Script font is reused. No new image, video, font or dependency is downloaded.

The welcome stays visible until the campus reports its first rendered frame. “Welcome to,” “Exhibition” and the status fade away while the same visible “Hinduism” title moves from the center to the top. The sky dissolves and clouds disperse over 1.5 seconds before the campus controls become available. Reduced-motion preferences skip the animation. The 2D schematic is mounted only for explicit lightweight mode or renderer failure; successful loading never requests it. Errors and the existing 12-second timeout expose the fallback immediately.

Retrying 3D resets readiness and starts a fresh welcome. Campus controls and pins remain inert during loading. Keyboard focus is restored after a retry and after returning from a direct-linked story during the dissolve. Existing gallery arrival and story hashes are preserved.

## Verification

- Production build, ESLint, TypeScript and `git diff --check` passed.
- **Nine production Chrome welcome checks passed in 33.6 seconds:** delayed-script loading at 1440px and 390px, reduced motion at 320px, renderer failure and context-loss retries, direct story links, returning to the campus during the dissolve, and continuous title motion at desktop, phone and landscape sizes.
- Loading checks confirm the exact heading, complete text bounds, inactive campus controls, no schematic request, animated/reduced-motion styles and successful arrival. Three focused Axe scans found no automatically detectable violations. Manual screen-reader testing was not performed.
- Seven campus regression checks and two transition captures passed in 21.3 seconds: five responsive hero layouts, walking activation/exit, gallery pose restoration, and desktop/phone captures.
- Desktop and phone loading screenshots were visually reviewed. This is a local change; no deployment or Git commit was performed.

Screenshots: [desktop welcome](sky-welcome/1440-loading.png), [phone welcome](sky-welcome/390-loading.png), [narrow phone](sky-welcome/320-loading.png), [campus after arrival](sky-welcome/1440-arrived.png).

## Continuous title journey

The title stays mounted and fully opaque above the welcome sky. Its full-height positioning layer centers it without JavaScript measurements, including on short screens. After a 50ms pause, compositor transforms move it upward and scale it from 90% to full size over 1350ms with a gentle start and finish. There is no text replacement or opacity handoff.

Controls fade over 800ms after 550ms; destination labels fade over 700ms after 650ms. Everything settles before the 1500ms loading-layer removal. Controls remain inert until completion. Reduced motion skips transitions, and ordinary gallery returns do not replay them.

Frame sampling at 1440×900, 390×844 and 844×390 confirms the title remains the same DOM element at full opacity, moves through intermediate positions without moving backward, grows smoothly, and changes by less than 0.5px in position or width when the welcome unmounts. Controls and labels pass through intermediate opacities and change by less than 0.05 at that handoff.

Review captures: [desktop moving](title-travel/1440-moving.png), [phone moving](title-travel/390-moving.png), [desktop settled](title-travel/1440-settled.png), [phone settled](title-travel/390-settled.png).
