# Dome 4 — photographic exhibition

9 November 2026 · America/Toronto

## Result

The content immediately after Dome 4’s existing hero is a naturally scrolling, image-only exhibition on a near-black background. The exact 24 reference entries and month order are maintained in `content/festival-gallery.ts`. **17 entries have verified photography: 47 photographs in total, with one lead per covered entry and 30 additional photographs in the full-screen lightbox. Seven entries remain missing; there are no substitute photos or empty festival cards.**

The hero preserves the current title, theme and central message. Other domes retain their story layouts; the older fourteen-entry text research in the separate reading route remains available. The gallery has no visible festival headings, labels, hover titles, descriptions or information cards. Visible gallery text is limited to the retained hero, navigation and photography credit. Meaningful alt text remains available to screen readers.

## Exact calendar and coverage

| Month | Requested entry | Verified photo coverage |
| --- | --- | --- |
| Kartak | New Year – Annakut | 4 photos · Cambridge, Ontario, Canada (2025); London, United Kingdom (2023) |
| Kartak | Chhath Puja | **Missing: no suitable verified official photograph found.** |
| Magshar | Gita Jayanti | **Missing: no suitable verified official photograph found.** |
| Magshar | Vaikunth Ekadashi | **Missing: no suitable verified official photograph found.** |
| Posh | Uttarayan | 2 photos · Secunderabad, Telangana, India (2025) |
| Posh | Pongal | **Missing: no suitable verified official photograph found.** |
| Maha | Vasant Panchami | 2 photos · Ahmedabad, Gujarat, India (2013) |
| Maha | Maha Shivratri | 2 photos · London, United Kingdom (2025) |
| Fagan | Holi | 2 photos · London, United Kingdom (2023) |
| Fagan | Fuldol | 3 photos · Sarangpur, Gujarat, India (2026) |
| Chaitra | Ram Navami – Shri Hari Jayanti | 3 photos · Cambridge, Ontario, Canada (2026) |
| Chaitra | Gudi Padwa – Ugadi | 3 photos · Secunderabad, Telangana, India (2025); New Delhi, India (2026) |
| Vaishakh | Akshaya Tritiya | 2 photos · Robbinsville, New Jersey, USA (2023) |
| Vaishakh | Nrusinh Jayanti | 2 photos · London, United Kingdom (2023) |
| Jeth | Ganga Dussehra | **Missing: no suitable verified official photograph found.** |
| Jeth | Vat Savitri | **Missing: no suitable verified official photograph found.** |
| Ashadh | Rath Yatra | 3 photos · Toronto, Ontario, Canada (2023) |
| Ashadh | Guru Purnima | 3 photos · Sarangpur, Gujarat, India (2026) |
| Shravan | Janmashtami | 3 photos · Cambridge, Ontario, Canada (2026) |
| Shravan | Raksha Bandhan | 3 photos · Abu Dhabi, UAE (2026) |
| Bhadarvo | Ganesh Chaturthi | 3 photos · Abu Dhabi, UAE (2026) |
| Bhadarvo | Onam | **Missing: no suitable verified official photograph found.** |
| Aso | Diwali | 3 photos · Cambridge, Ontario, Canada (2025) |
| Aso | Navratri – Dussehra | 4 photos · Junagadh, Gujarat, India (2026); New Delhi, India (2025) |

**Missing photographs:** Chhath Puja, Gita Jayanti, Vaikunth Ekadashi, Pongal, Ganga Dussehra, Vat Savitri, Onam. This describes the results of this research pass, not a claim that BAPS has never photographed these events.

All four combined entries have separately identified photographs for both celebrations. The Cambridge joint Ram Navami / Shri Hari Jayanti performance is an additional joint-event scene; separate Ramayana and Harikrishna photographs establish the two celebrations individually. The Cambridge Annakut image is not used to claim a New Year prayer scene: that photograph comes from London, correctly credited.

Akshaya Tritiya photographs show the documented **Adhik Maas observance in Robbinsville on 20 July 2023**, not the ordinary annual Vaishakh date. The source caption supports this context, which is retained in permanent metadata. Cambridge site archives also include worldwide news: appearances in those lists were not taken as evidence that an event happened in Cambridge.

## Sources and permission

Cambridge, Ontario was searched first for every entry, followed by other official BAPS galleries. The selected Cambridge photographs cover Annakut (2025), Ram Navami / Shri Hari Jayanti (2026), Janmashtami (2026) and Diwali (2025). Older clear event photographs are retained where newer relevant Cambridge photographs could not be found.

Individual event URLs, original image URLs, celebration, actual location, year, credit, source dimensions and SHA-256 hashes are in `content/festival-photographs.json`. Both research notes describe searches, exclusions and exact source-page verification:

- [Kartak–Chaitra research](dome-4-photo-research-first.md)
- [Vaishakh–Aso research](dome-4-photo-research-second.md)

The exhibition owner explicitly confirmed in this chat: **permission covers official BAPS event photos**. This is the recorded website-use permission basis for every image; it is not presented as a public blanket licence or official endorsement. Copyright and credits remain with BAPS Swaminarayan Sanstha. Public image credits and source links are server-rendered at `/references#festival-photo-credits`; the lightbox also displays the current photo’s actual location, year and linked BAPS credit.

## Presentation and loading

Wide lead images alternate with staggered two-column compositions and occasional three-image arrangements. Phones use large vertical photographs with a few modest width changes. Every photograph is shown in its original aspect ratio without cropping, filters or content alteration; faces, murtis and ritual objects remain intact.

Native scrolling is reversible. One-time intersection reveals move photographs by only 20 pixels and fade them gently into view. No scroll interception, pinning, automated slideshow or zoom loop is used. Reduced motion disables reveals and lightbox transitions.

The gallery uses local WebP derivatives and Next.js responsive `srcset`/`sizes`, lazy loading, explicit source dimensions and CSS intrinsic aspect ratios. Derivatives total **8.42 MiB** across all 47 images; only the 17 leads render in the scrolling gallery. Full originals total **17.94 MiB** on disk and are requested only for the selected lightbox photograph. The source files’ actual resolution is retained, never represented as higher than the original.

The modal preserves the full photograph, supports arrow controls and keys, Home/End, touch swipe, a discreet counter, visible close control, native modal semantics, explicit Tab wrapping, and focus restoration without moving the gallery. No festival name is shown as a lightbox heading. A failed original image retains the preview with a source link.

`scripts/prepare-festival-photographs.mjs` reproduces assets from the verified research catalogs, reusing originals or fetching only recorded official source URLs. Temporary research paths are not used by runtime code.

## Validation

- `npm run lint`, `npx tsc --noEmit`, `npm run build`, and `git diff --check` — passed. Production compilation required an unsandboxed retry after a sandboxed compiler stalled; the final build completed successfully.
- **15 final production Chrome checks passed in 16.6 seconds** against `http://localhost:3002`. These cover the exact calendar and metadata, image-only presentation, responsive image sources and deferred originals, reversible scrolling, legacy link destinations, keyboard/focus handling, touch swipe, 320/390/768/1440 layouts, no audio creation, denied storage, browser history, exhibition-to-exhibition navigation and JavaScript-free credits.
- Gallery and lightbox Axe scans reported zero automatically detectable violations. Automated scans do not establish complete manual accessibility compliance.
- **29 existing narrative-gallery, layout and integration checks** passed during development, including the five other domes at six viewport sizes. These were targeted checks, not a full repository-wide regression run.
- An independent audit freshly downloaded all **47 official source images** and matched their SHA-256 hashes to the local originals and permanent metadata. All 47 originals are JPEG, all 47 preview derivatives are WebP, source dimensions and preview proportions match, and no IDs, source URLs or image hashes are duplicated.
- Desktop and phone production screenshots were visually inspected. The older Vasant Panchami portrait is limited to 450px on desktop to avoid excessive enlargement. Mobile spacing was tightened after visual review.
- Verification caught and fixed modal focus restoration, desktop image containment, arrow-button movement caused by a global active style, footer navigation history and legacy same-page festival link handling. Legacy story 13 continues to lead to Uttarayan.

No deployment or Git commit was made. Existing unrelated edits in `content/exhibition.ts`, `content/stories.ts` and the prior message updates in `tests/revision.spec.ts` were preserved.

## Review captures

- [Desktop opening photograph](dome-4-gallery/desktop-lead.png)
- [Desktop staggered composition](dome-4-gallery/desktop-composition.png)
- [Phone gallery](dome-4-gallery/mobile-gallery.png)
- [Phone lightbox](dome-4-gallery/mobile-lightbox.png)
