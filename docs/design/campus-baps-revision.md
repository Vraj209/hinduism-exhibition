# Campus architectural revision

Revised 8 November 2026. This is an original digital exhibition campus informed by official BAPS and Swaminarayan Akshardham architectural references. It is not a reconstruction, measured architectural survey, official BAPS design, or documentary exhibition photograph. The source PDF defines the six themes; it does not provide a site plan or building design.

## Reference study

The following official photographs were visually inspected, alongside the organizations' architectural descriptions. Reference photographs were used for study only. They are not included in public assets; redistribution rights have not been confirmed.

| Official source | Observed architectural vocabulary used |
| --- | --- |
| [Swaminarayan Akshardham, New Delhi: Mandir](https://akshardham.com/explore/mandir/) — [exterior photograph](https://akshardham.com/newdelhi/wp-content/uploads/2015/06/swaminarayan_akshardham_mandir.jpg) | Pink sandstone massing, multiple recessed plinth courses, carved friezes, broad projecting eaves, layered roof composition, small gold finials. |
| [Akshardham: Mandapams](https://akshardham.com/explore/mandir/mandapams/) — [ceiling detail](https://akshardham.com/newdelhi/wp-content/uploads/2015/03/mandap-09.jpg) | Concentric ceiling bands, deeply modelled floral relief and radial petal organization. The photographed figurative center is not reproduced. |
| [BAPS London: Mandir Art & Architecture](https://londonmandir.baps.org/the-mandir/art-and-architecture/) — [porch detail](https://londonmandir.baps.org/images/pages/01_art_main.jpg) | Light stone columns, projecting carved brackets, undulating arches, ornament concentrated at the column-to-beam transition. Figurative brackets are not reproduced. |
| [BAPS London: shikhar photograph](https://londonmandir.baps.org/images/pages/01_shikhar_large.jpg) | Broad curving shoulders, continuous vertical projections, subordinate horizontal courses, smaller clustered towers and a fluted crown. The model omits the reference's flag, icons and figures. |
| [BAPS London: Haveli Art & Architecture](https://londonmandir.baps.org/the-haveli/art-architecture/) — [carved timber detail](https://londonmandir.baps.org/images/pages/02_haveli_main.jpg) | Warm carved timber, paired angled struts, fluted columns, floral/geometric relief, projecting eaves and courtyard/lightwell character. |

## Original design changes

1. **Hindu Jivan Shaili:** a carved teak colonnade, stepped hipped canopy and raised central lightwell replace the smooth central dome. The entrance remains the right-hand arch used by the camera.
2. **Hindu Riti / Parampara:** sandstone gate piers now contain geometric teak door panels. A timber entrance frame connects the exterior to the interior palette.
3. **Hindu Manyata:** a broad, curved shikhara with vertically rising projections and four subsidiary towers replaces the narrow tiered cone. Rear piers leave the axial passage open during entrance travel.
4. **Hindu Festivals:** four connected kiosks retain one continuous foundation. Their roofs now have corbelled courses, carved petal drums, hanging ceiling details and small finials.
5. **Hindu Mulyo:** an ivory octagonal mandapam uses bracket capitals and a concentric floral ceiling.
6. **Hindu Sanskruti Ādhār Stambh:** three articulated roof bays share a stone colonnade, carved plinth and deeper moulded eaves.

The common detailing includes original six-petal relief rosettes, shallow floral capitals, curved struts, stepped mouldings and lattice balustrades. No murtis, human likenesses, sacred symbols, inscriptions or claims of iconographic equivalence are introduced.

| Material | Color |
| --- | --- |
| Sandstone | `#bd8a70` |
| Carved stone recess | `#91614d` |
| Warm marble | `#efe5d4` |
| Marble highlight | `#fff7e6` |
| Teak | `#70452d` |
| Timber relief | `#9b6842` |
| Restrained brass finials | `#9a7842` |
| Water | `#739b91` |

## Render and interaction evidence

The actual Three.js scene was rendered in local Chrome at 900 × 650. Geometry is merged by material within each pavilion and landscape group. This revision does not change the six positions, camera API, saved overview pose, perspective entrance path, selection callbacks, reduced-motion behavior or render-on-demand lifecycle.

| Measurement | Revised campus |
| --- | ---: |
| Unique scene geometry triangles | 265,234 |
| Triangles submitted in overview, including shadow pass | 530,326 |
| Overview render calls, including shadow pass | 96 |
| Static fallback dimensions | 900 × 650 |
| Static WebP bytes | 69,762 |
| Campus idle animation | None; render on demand |
| Pixel-ratio cap | Desktop 1.5; mobile 1.25 |

The added architectural relief increases geometry from the earlier 199,438-triangle model by approximately 33%; render calls increase from 90 to 96. The unique geometry now exceeds the earlier 200k aspiration. Calls remain below 120. These are renderer measurements, not measured hardware frame-rate benchmarks.

Validation completed:

- TypeScript checking and scoped ESLint pass.
- All six instant entrance paths settle in the expected perspective camera pose and invoke the matching selection callback.
- Return to map restores exact overview position, target and zoom 1.3.
- Rapid 1 → 6 → 3 → map requests cancel prior travel and settle at the overview.
- All six projected labels remain in bounds at 390 × 430.
- No browser page errors in the isolated scene harness.

The harness matches React's selected-prop update before issuing camera moves and waits for animation-frame settling. Full application UI regression remains the parent agent's validation responsibility.

Artifacts:

- `public/campus-overview.webp`: refreshed fallback, captured from actual geometry.
- `docs/design/campus-baps-overview.png`: uncompressed review frame.
- `docs/design/campus-baps-mobile.png`: actual 390 × 430 canvas frame.
- `docs/design/campus-baps-projections.json`: exact percentage anchors for the 900 × 650 fallback image.
- `docs/design/campus-baps-verification.json`: measured scene metadata and entrance/return evidence.
