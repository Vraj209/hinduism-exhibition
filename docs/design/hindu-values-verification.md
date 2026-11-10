# Dome 5: Hindu Mulyo

Verified 9 November 2026 (America/Toronto).

## Delivered

- Four continuous image-and-text cards follow the existing section hero: Daya / Compassion, Kshama / Forgiveness, Aadar / Respect, Tyag / Selflessness.
- Equal desktop columns alternate image left, right, left, right. At 760px and below, every photograph precedes its text. Text stays vertically centered beside each complete photographic figure on wider screens.
- Burgundy surfaces, warm ivory display typography, restrained gold rules and faint original floral ornament continue the exhibition atmosphere. Full photographic frames preserve natural colors, faces, hands and surrounding context.
- The owner's four supplied English descriptions appear verbatim as original exhibition copy, without quotation markup or attribution to Mahant Swami Maharaj. No approved Gujarati descriptions were located; the data retains explicit nullable Gujarati fields, and no translation was invented.
- Separate captions show the actual event context, location, date and BAPS credit. The source register and `/references#hindu-values-credits` retain each official source page and original photograph URL. See [photograph provenance](hindu-values-photography.md).
- Native vertical scrolling replaces the old depth-driven Dome 5 gallery. Cards fade in once over 550ms without moving their text; reduced-motion preferences cancel the reveals and smooth scrolling.
- Back-to-campus, next-exhibition and legacy story links continue to work. New value links use `#section-hindu-mulyo/value-daya`, `value-kshama`, `value-aadar` and `value-tyag`.

## Validation

- Production build: `npm run build` passed.
- TypeScript: `npx --no-install tsc --noEmit` passed.
- ESLint on the implementation, references integration and changed tests passed.
- Playwright: **25 passed** across `values-gallery.spec.ts`, `dome-gallery.spec.ts` and `exhibition.spec.ts`.
- Responsive geometry checked at 320, 390, 768, 1024 and 1440 pixels. No horizontal overflow; all four photographs load; desktop columns remain balanced and alternate correctly; mobile images precede the text.
- Automated axe scans of the new gallery at desktop and phone widths returned no WCAG A/AA violations. Keyboard navigation, focused deep links, reduced motion and stable text after reveals passed. These checks do not claim manual screen-reader or physical-device testing.
- The final production preview rendered without page errors. Its credits section contains all four entries and eight source/original links.
- Screenshots in `hindu-values/` were recaptured from the production build, using the existing non-WebGL fallback to isolate the HTML gallery. Full desktop and phone cards were visually inspected. The complete photo frame and expressive gestures remain visible in every card.
- `git diff --check` passed. Earlier uncommitted work was preserved.

## Next.js feedback pass

Reviewed the request for qualifying Next.js friction. No candidates remained. Browser sandbox restrictions and an occupied preview port were environment conditions; both were resolved without application changes. No feedback submission was required.
