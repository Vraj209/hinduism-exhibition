# Thematic stone relief plan

The six themes are taken from `docs/Takeaways for gutko.pdf`, page 1. This pass adds original, physically raised architectural carving to the six digital pavilions. It does not reproduce a BAPS carving, present the digital buildings as surveyed mandirs, or turn the separately researched fourteen-festival collection into PDF content.

## Placement and geometry contract

Each entrance receives a clear hero relief above the doorway, with two related wall panels. Reduced motifs repeat on an interior wall, pillar or frieze to connect exterior and interior. Framing has a rear stone substrate, a darker recessed field, two raised moulding courses and bevelled subject geometry. Object silhouettes have actual volume and cast shadows. No raster texture, flat SVG decal, fabricated inscription, portrait or sacred likeness is used.

`addThematicRelief(batch, sectionId, options)` appends geometries to the caller's existing material batches. It creates no materials or mesh groups. Options specify `x`, `y`, `z`, `width`, `height`, optional `depth`, `rotation` (Y radians), uniform `scale`, `variant` (`hero`, `panel`, `band`, `pillar`), optional `motif` (0–2), and `materials: { stone, recess, highlight }`.

Unrotated bounds are x ± width/2, y ± height/2, z 0…depth, measured from the rear plane. All bounds include bevels. Uniform scale and then rotation/translation apply to the completed carving. Default depth is 12% of the smaller face dimension. Subjects fit their physical frame with one XY scale, preserving the proportions of the vessel, hand and book. The final campus uses 1.8 × 1.65 side panels at 0.16 projection and a 2.4 × 0.92 hero above the arch.

Bands no taller than 0.35 and pillar medallions no wider than 0.35 automatically use architectural detail: two raised motifs per band, one per medallion, and a simplified three-depth stone frame. Larger narrow pillars use two stacked, proportionate objects. This keeps the repeated dome-base and column details readable without multiplying the detailed hero geometry.

## Source-to-carving mapping

| Section | Hero subject | Related panel / small motifs | Source relationship and boundary |
| --- | --- | --- | --- |
| Hindu Jivan Shaili | A deep rounded bowl resting on folded cloth | Folded textile layers; a raised rhythm of sound-bearing ribs | Food, clothing and the language of song are named in the PDF. No specific food, garment, sacred text or musical instrument is asserted by these carvings. |
| Hindu Riti/Parampara | Two physically interwoven broad bands joined within a threshold | Paired bands / linked forms; nested open thresholds | Duties, relationships and connection to something greater. The bands are an editorial metaphor, not a named ritual thread. |
| Hindu Manyata | A winding raised path entering a layered open portal | A single uninterrupted route; paired portal frames | The PDF's map and journey metaphor. The path does not depict the appearance of the atma or an invented cosmological route. |
| Hindu Festivals | A clearly modelled diya with a raised flame and joined supporting forms | Light-bearing bowl; connected forms within a shared frame | The original light, truth and love themes. No named festival is attributed to the PDF. The fourteen-festival collection remains a separate editorial extension. |
| Hindu Mulyo | An open supporting hand beneath a round vessel | Two cupped hands; an offered droplet / vessel | Kindness expressed through care. A visual metaphor, not an invented historical event or an additional prescribed practice. |
| Hindu Sanskruti Ādhār Stambh | An open uninscribed book, a mandir profile and a guiding path on one base | Book; mandir and three supports; continuous guide line | Shastra, Mandir and Sant — Guru. No portrait of a guru, divine likeness or fabricated scriptural verse. |

## Architectural references

- [Akshardham mandapams](https://akshardham.com/explore/mandir/mandapams/) support layered sculpted ceilings and carved four/eight-sided pillars as architectural references.
- [BAPS London Haveli art and architecture](https://londonmandir.baps.org/the-haveli/art-architecture/) supports deeply framed floral relief, bracketed columns and cusped architectural framing.

These references inform carving depth and craftsmanship. The thematic compositions are original editorial designs derived from the supplied section messages. Official photography remains research-only unless a separately documented permission permits reuse.

## Validation before use

Check all six hero panels together, all three motif variations, and oblique light to confirm real depth. Check bounds and material batching numerically. Check actual campus and interior placement to ensure no doorway, camera route, text, face or sacred image is obstructed. Final geometry counts and production visual evidence belong in the revision verification report.

## Geometry freeze evidence

Focused validation passed ESLint, TypeScript and a Chrome WebGL fixture with zero page errors. All 72 section / variant / motif combinations passed finite attributes, `position` + `normal` + `uv`, no material groups, and exact physical bounds including bevels. These checks validate the relief module; final campus and interior composition is reviewed separately.

The final oblique studies are saved in [`thematic-relief-evidence`](./thematic-relief-evidence/): wide heroes, narrow interior pillars, tiny drum bands and column medallions. The hand's fingers are deliberately separated in the face plane so their silhouettes survive the depth compression. At the pictured dimensions, heroes use 1,632–2,268 triangles, tiny bands 192–448, and column medallions 132–260. Geometry is appended to the caller's three existing material batches, adding no draw calls of its own.
