# Hindu Manyata — six illuminated belief niches

9 November 2026 · America/Toronto

## Delivered

Dome 3’s dark exhibition now presents six architectural cards in the requested order: Aatma, Karma, Punarjanma, Avatar, Murti, Moksha. The current hero title and message are preserved. Each card has an ivory arched stone surround, delicate floral carving concentrated at the top, a recessed illuminated interior, a numbered medallion and a projecting stone ledge. Titles use the existing Cormorant Garamond serif in deep maroon.

The four original SVG illustrations are explicitly described as abstract visual metaphors: saffron light, blue ripples, a teal continuous journey and an orange open lotus. Avatar uses verified BAPS devotional artwork; Murti uses an approved BAPS event photograph. There is no generated religious likeness.

Desktop uses three cards per row; tablet uses two; phones use one. DOM and visual reading order are both 01–06. All English and Gujarati content remains present without hover, clicking, tapping or flipping. Card height can expand with text, including 200% enlarged text. Cards lift by 4px on pointer hover or keyboard focus and gain soft inner light. Focus is visibly outlined. Native scrolling remains reversible; intersection reveals use 18px travel and a short 85ms stagger. Reduced motion removes reveals, transitions and lifting.

## Exact bilingual content

The user attached the reference during this task. It is preserved at [manyata-beliefs-reference.png](manyata-beliefs-reference.png). Two independent transcriptions agreed, including **મારી** in Karma and **એ જ** in Moksha. No terminal punctuation was added to the Gujarati lines.

| # | Belief | English | Gujarati, verbatim |
| --- | --- | --- | --- |
| 01 | Aatma | I am the soul | હું આત્મા છું |
| 02 | Karma | My choices matter | મારી પસંદગી મહત્વની છે |
| 03 | Punarjanma | The soul travels on | આત્માની યાત્રા ચાલુ રહે છે |
| 04 | Avatar | God comes to guide | ભગવાન માર્ગ બતાવવા પધારે છે |
| 05 | Murti | God is present here | ભગવાન અહીં પ્રત્યક્ષ છે |
| 06 | Moksha | Freedom is the goal | મુક્તિ એ જ અંતિમ લક્ષ્ય |

The Gujarati paragraphs carry `lang="gu"`, a 20px base size and 1.85 line height, with normal letter spacing to preserve conjuncts. Locally hosted Noto Sans Gujarati includes all 31 distinct codepoints used by these sentences, and GSUB/GPOS shaping support. Its full variable font was converted to WOFF2 using existing FontTools/Brotli, retaining all 1,110 glyphs, shaping tables and variable axes. Runtime file: 248,580 bytes, 63.1% smaller than the original TTF. No dependencies were installed.

Font source: [official Google Fonts directory](https://github.com/google/fonts/tree/main/ofl/notosansgujarati), [original variable font](https://github.com/google/fonts/blob/main/ofl/notosansgujarati/NotoSansGujarati%5Bwdth%2Cwght%5D.ttf), [SIL Open Font License](https://github.com/google/fonts/blob/main/ofl/notosansgujarati/OFL.txt). The licence is included under `public/fonts/`.

## Devotional sources

- **Avatar:** Krishna guiding Arjun’s chariot, from the [official BAPS Rath Yatra essay](https://www.baps.org/Article/2011/Rath-Yatra-2171.aspx). The original 350×268 JPEG is displayed complete in its small frame. The publisher is credited; an artist and artwork creation date are not invented. This artwork was expressly requested for the local design. The earlier permission confirmation for event photographs is not represented as a licence for this separate artwork; no independent public reuse licence was established.
- **Murti:** the existing approved photograph `janmashtami-cambridge-2026-murti`, from [Cambridge’s official 2026 Janmashtami gallery](https://www.baps.org/cambridge/news/janmashtami-celebration-2026/gallery). Its actual location, year, exact source and prior owner-confirmed permission remain in the festival manifest. The complete photograph is contained inside the miniature frame without cropping the murti, garments or base.

[Detailed imagery research](manyata-imagery-research.md) records original URLs, attribution and verification. Both visuals are credited on the server-rendered `/references#manyata-visual-credits` route. Next.js supplies responsive local image derivatives; originals retain their natural colours. The four abstract visual metaphors are independently authored vectors and contain no religious portraits.

## Implementation and integration

- `content/beliefs.ts`: exact copy, order, accent palette and source metadata.
- `components/manyata-gallery.tsx` and `.css`: complete card exhibition and responsive architectural styling.
- `components/manyata-motifs.tsx`: original still vector metaphors and carved arch ornament.
- `components/section-experience.tsx`: routes Dome 3 to the belief collection.
- `app/references/page.tsx`: distinct artwork and photograph credits.
- Legacy `story-1` points to Aatma, `story-2` to Punarjanma and `story-3` to the beginning of the belief collection. Direct `belief-<id>` links focus and fully reveal the corresponding card. Footer navigation continues to Dome 4 and supports browser Back.

The separate reading route retains its prior source-based prose. Existing unrelated edits to `content/exhibition.ts` and the prior message assertion in `tests/revision.spec.ts` were preserved. No deployment or Git commit was made.

## Verification

- Production build, ESLint, TypeScript and `git diff --check` passed.
- 28 adapted narrative-gallery/layout/integration regression checks passed during development; historical audit PNGs were not overwritten.
- The focused production checks cover exact bilingual content and loaded Gujarati font, 3/2/1-column layouts at 1440, 1280, 1024, 834, 768, 390 and 320px, 200% text size, authentic imagery, keyboard/hover behavior, reduced motion, legacy links, browser history, source credits without JavaScript and section navigation.
- Desktop and mobile Axe checks reported zero automatically detectable violations. This is not a claim of complete manual accessibility compliance.
- Independent visual/accessibility review found the small saffron/orange medallion numerals had insufficient contrast. All medallion text is now deep maroon on ivory, with a calculated 9.70:1 contrast ratio; the accent borders remain coloured.
- Screenshot review also caught and corrected the card deep-link offset within the positioned grid. Navigation tests now require the full destination card in the viewport, including on phones.
- **17 final production Chrome checks passed in 18.3 seconds** against `http://localhost:3002`, including full-card deep-link visibility on desktop and phone. The five final production captures were saved and reviewed; the live medallion colour was verified as `rgb(102, 44, 54)`.

## Review captures

- [All six cards on desktop](manyata-cards/desktop-six-beliefs.png)
- [Tablet](manyata-cards/tablet.png)
- [Phone](manyata-cards/mobile.png)
- [Avatar on phone](manyata-cards/mobile-avatar.png)
- [Murti on phone](manyata-cards/mobile-murti.png)
