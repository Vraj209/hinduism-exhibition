# Custom campus destination menu

9 November 2026 · America/Toronto

Replaced both native section selects with the same custom control: the main chooser and the walking-mode direct-entry chooser. The popup uses ivory, bronze rules, numbered rows, serif section titles, short themes and visited checkmarks. It opens toward available space, stays within the viewport and scrolls internally in short windows. Existing section IDs, navigation callbacks and return-focus targets are preserved.

The implementation is in `components/section-menu.tsx` and its colocated CSS module. No dependency was added. A portal keeps the popup clear of the campus overflow boundary. Resize observers keep the anchor and highlighted row usable after responsive reflow. Menu exploration does not move the walking camera or navigate until a destination is confirmed.

The control uses combobox/listbox semantics and active-descendant focus, informed by the [W3C select-only combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-select-only/). Arrow keys, Home/End, Page Up/Down, typing and section numbers navigate the choices; Enter or Space confirms. Escape, Tab, outside interaction and page scrolling dismiss without changing destinations. Pointer and touch selection are supported. Reduced motion disables the opening animation.

## Verification

- Production build, ESLint, TypeScript and `git diff --check` passed.
- Final production build: **10 custom-menu Chrome checks passed in 7.4 seconds**. Includes all six destinations, visited state, keyboard exploration and cancellation, scroll dismissal, live resize with the final option highlighted, touch entry and switching between the two walking controls.
- Popup bounds and first/last-option visibility passed at 1440×900, 1024×768, 768×1024, 390×844, 320×568 and 844×390. Desktop and phone Axe scans found no automatically detectable violations in the menu and trigger. Actual screen-reader use was not tested.
- Twelve affected campus and gallery regression checks passed before the final resize-visibility adjustment: five hero viewports, mobile off-axis entry, deliberate walking, all six walking destinations, touch walking, gallery-pose return and two walking/gallery integration checks. The final ten-check rerun includes touch walking-control integration.
- Earlier checks exposed responsive positioning and highlighted-row visibility issues. The final fixes are covered by the passing resize and short-viewport checks above. Unrelated repository tests were not run.

Production captures were visually reviewed: [desktop campus](custom-section-menu/1440-campus-open.png), [phone campus](custom-section-menu/390-campus-open.png), [320px menu](custom-section-menu/320-open.png), [landscape menu](custom-section-menu/844-open.png), and [walking direct entry](custom-section-menu/390-walking-direct.png). The desktop capture predates only the final resize-visibility correction; its design is unchanged.

Existing workspace changes were preserved. No Git commit or deployment was performed. Local production preview: `http://localhost:3001`.
