# Source and reading-view verification

Verified against the local development server at `http://localhost:3000/read` on 8 November 2026 (America/Toronto). Browser: installed Chrome, driven headlessly by Playwright. This is local verification, not a deployed-site or physical-device performance result.

## Source audit

- Extracted and visually inspected the entire supplied `docs/Takeaways for gutko.pdf`: exactly one page.
- Verified all six exact section titles, their order, source subtitles, and the three subdivisions within section 6.
- `content/exhibition.ts` is the shared content source for the architectural view and reading page.
- Short editorial summaries stay within the supplied messages. The source does not support detailed stories, named festivals, doctrine lists, approved religious imagery, or physical layout reconstruction.
- The source’s Sant — Guru / Satpurush account is identified as this exhibition’s devotional perspective.
- The suggested closing paragraph is not represented as a finalized or scriptural quotation. The historical duration stated in section 6 is not independently asserted in the summaries.
- Public `/exhibition-source.pdf` is byte-identical to the supplied PDF. HTTP retrieval returned 200 and 73,912 bytes.

## Browser results

| Viewport | Articles | Contents links | Horizontal overflow | Browser page errors |
| --- | --- | --- | --- | --- |
| Desktop, 1440 × 1100 | 6 | 6 | None | None |
| Tablet, 768 × 1024 | 6 | 6 | None | None |
| Mobile, 390 × 844 | 6 | 6 | None | None |

Visually inspected screenshots of the desktop layout, mobile contents, and a mobile article. Typography, source disclosure, title wrapping, and reading spacing remain legible. The desktop contents use a left column; mobile contents wrap into two columns above the articles. No text is rendered into a canvas or image.

## No-JavaScript and navigation checks

With JavaScript disabled and reduced motion requested:

- All six articles remain rendered with scoped styling.
- First keyboard Tab focuses “Skip to the sections”.
- Native contents navigation reaches `/read#hindu-manyata`.
- The native “Words from the exhibition” disclosure opens.
- After navigating to section 6, browser Back returns to `/read#hindu-manyata`.
- Source links point to PDF page 1.
- All six “Explore this pavilion” links match the architectural view’s `/#section-{slug}` convention.

## Implementation correction

The initial project’s Turbopack rule applied `as: '*.css'` to every CSS file, including CSS Modules. It produced an unscoped `read.module.css.css` stylesheet and undefined module class exports. The minimal fix excludes `/\.module\.css$/` from that Tailwind rule. A subsequent browser check confirmed scoped class names, actual flex layout, and the screenshots described above.

Focused ESLint check passed for `app/read/page.tsx` and `content/exhibition.ts`. Root-level build, type checks, architectural transitions, and deployed verification are tracked separately.
