# Hinduism: exhibition experience plan

## Source and scope

The sole supplied source, `docs/Takeaways for gutko.pdf`, contains one page of six numbered takeaways. The section outline and terminology are recorded in `docs/exhibition-source-outline.md`. No existing models, textures, exhibition photographs, approved religious imagery, or floor plan were supplied. The campus is an explicitly labeled proposed digital interpretation, not a reconstruction of the mandir. Concise summaries remain proportionate to the source instead of introducing unsourced history or doctrine.

## Campus proposal

Six pavilions surround an open arrival court and a shallow reflecting pool. A continuous sandstone path connects their entrances. The court and garden are navigation space, never a seventh destination. The numbered route progresses around the campus; every pavilion is also independently selectable. The initial camera is an elevated three-quarter view. A small map remains available while reading.

| # | Exact section title | Architectural interpretation | Motif / accent / light | Signature moment |
|---|---|---|---|---|
| 1 | Hindu Jivan Shaili | Rhythmic colonnade expressing daily practice | Repeated stone bays; muted terracotta; morning light | A sequence of shaded pillars leading to an open entrance |
| 2 | Hindu Riti/Parampara | Terraced ceremonial threshold | Layered arch profiles; sandstone rose; warm grazing light | An entrance framed by nested arches |
| 3 | Hindu Manyata | Tall, contemplative pavilion | Rising stepped stone profiles; pale ivory; soft overhead light | A distinct central spire above a still court |
| 4 | Hindu Festivals | A joined pavilion of four small domed bays | Repeating lamp-like profiles; restrained amber; warm light | A shared open forecourt framed by domes |
| 5 | Hindu Mulyo | Open, octagonal gathering pavilion | Repeated lattice and balanced columns; muted sage; diffuse daylight | Views through the pavilion in several directions |
| 6 | Hindu Sanskruti Ādhār Stambh | One broad hall with three related domes | Three repeated architectural bays; antique gold; afternoon light | Three bays read as one connected structure |

These motifs are design interpretations, not claims about traditional religious symbolism. The three bays in section 6 refer to the source's Shastra, Mandir and Sant. No divine figures or invented sacred inscriptions are used.

## Architectural reference research

Official references inspected on November 8, 2026:
- https://akshardham.com/explore/mandir/ : sandstone and marble, richly articulated plinths, layered relief and architectural rhythm.
- https://akshardham.com/download/photo-galleries/ : architecture, carvings and exhibition gallery categories.
- https://akshardham.com/newdelhi/wp-content/uploads/2015/06/swaminarayan_akshardham_mandir.jpg : official photograph reviewed for dome profiles, column proportions, pink sandstone and ivory relationship, central stairs and side colonnades.
- https://akshardham.com/explore/exhibitions/ : spatial storytelling references only. Its three exhibitions are not substituted for this project's six sections.

Official photographs are research references; they are not represented as photographs of this exhibition or redistributed as exhibition assets.

## Visual system

- Stone dominates: warm ivory `#f4f0e8`, sandstone rose, muted terracotta, brown text, aged gold detail.
- Cormorant Garamond for display and section titles; DM Sans for navigation and paragraphs. Fonts are self-hosted with SIL license files. No unapproved Hindi translation.
- Symmetrical architectural composition with an asymmetric editorial introduction; calm white space; thin engraved rules.
- Warm key light, soft shadows, restrained reflected light. No rotating camera, particles or autoplay audio.
- Buttons have modest radii; map number pins are circles; reading surfaces are unrounded editorial panels.

## Complete interaction plan

1. Arrival immediately presents the title, a source-grounded introduction, Begin the Journey, Explore the Map and Read All Sections.
2. Begin goes to section 1; Map gives a complete overview. Native links provide free section selection and keyboard activation.
3. Hover or focus previews each section and highlights its architecture. Selection moves from the current camera position to a composed entrance view over approximately 1.5 seconds.
4. A reading panel appears after arrival. Reduced motion removes the travel. The panel contains the source title, message, concise summary, takeaways, editorial reflection and a page-level source link.
5. Back to Map restores the overview and zoom. Previous/Next follow the source order. All Six Sections gives a fully server-rendered reading view.
6. Hash links encode selected sections and map state; browser Back/Forward restores them. Rapid selection cancels previous motion; stale callbacks cannot reveal the wrong panel.
7. Section headings receive focus on arrival; controls have visible focus rings. On mobile the scene is above a naturally scrolling reading panel. No scroll hijacking.
8. An illustrated map and native HTML links remain usable without WebGL. The reading route works without JavaScript. Browser context loss switches to the fallback.
9. Visited sections are remembered locally when storage is available. Storage failure does not block navigation.

## Asset pipeline and budgets established before production

- Existing assets: one source PDF, no 3D models or photographs.
- Build reusable code-native column profiles, arches, domes, spires, lattice, plinth and landscape parts. Combine geometry by material to avoid thousands of draw calls.
- Validate the first complete pavilion and camera journey before adding the remaining five silhouettes.
- Share geometry and materials, render only when state changes, cap device pixel ratio at 1.5 desktop / 1.25 mobile.
- Targets: under 200,000 visible triangles; under 120 draw calls; no external texture downloads; no detailed mesh downloads; compressed fonts below 200 KB combined; render fallback below 300 KB; deferred Three.js chunk below 250 KB gzip.
- Actual measurements and limitations belong in `docs/design/verification.md`; targets are not claimed as measured performance.
- Take a rendered overview from the final 3D scene for the lightweight fallback, maintaining the same campus identity.

## Delivery gates

1. Source outline, campus, six concepts, visual system and interaction plan (this document).
2. One complete pavilion: map, selection, transition, readable summary, return; browser/mobile inspection.
3. Six distinct pavilions and source-linked content; full keyboard, history, reduced-motion, no-WebGL and reading checks.
4. Production build and lint; capture actual scene budgets and automated browser checks. No deployment is implied.
