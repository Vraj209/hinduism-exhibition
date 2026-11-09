# Robbinsville Mahamandir reconstruction

Reference review: 2026-11-09. Asset: `lib/robbinsville-mandir.ts`.

This is an original, photo-based procedural reconstruction of the **BAPS Swaminarayan Akshardham Mahamandir in Robbinsville, New Jersey**. It is not an exact replica, surveyed building model, or BAPS-authorized geometry. No verified, licensed downloadable model was found in the targeted official-site/model search. No third-party mesh or photo texture is redistributed.

The six surrounding exhibition domes remain the existing, Delhi-inspired exhibition designs. Their new campus, linear fountain garden, paths and placement are the user's exhibition design, not a model of the actual Robbinsville grounds.

## Sources inspected

- [Official Explore page](https://usa.akshardham.org/explore): distinguishes the 2023 Mahamandir from the separate traditional mandir. Contains the photographs below and official garden/courtyard imagery.
- [Official front elevation photograph](https://media.baps.dev/wp-content/uploads/2023/09/09181239/04.-BAPS-Swaminarayan-Akshardham.jpeg): visually inspected. Establishes the tall central shikhar, broad plinth, single front stair, central columned entrance, smaller curved shikhars, stepped/pyramidal mandap roofs and pale stone color.
- [Official low oblique photograph](https://media.baps.dev/wp-content/uploads/2023/09/09181238/13.-BAPS-Swaminarayan-Akshardham.jpeg): visually inspected. Shows projecting entrance, layered side elevation, low foreground fountain and surrounding colonnades.
- [Official illuminated oblique photograph](https://media.baps.dev/wp-content/uploads/2023/09/09181229/29.-Fireworks-during-the-inauguration-scaled.jpg): visually inspected. Clarifies horizontal base courses, frontal roof overlaps, main shikhar mass and stair projection.
- [Official BAPS fact sheet](https://media.baps.dev/wp-content/uploads/2023/09/03155413/02_BAPS-Swaminarayan-Akshardham-Fact-Sheet.pdf): reports overall dimensions of 255 × 345 × 191 feet, one main shrine, twelve sub-shrines, nine shikhars, nine pyramidal shikhars and an elliptical stone dome. Also identifies limestone, marble, granite and sandstone among the stones used.
- [Official BAPS backgrounder, page 2](https://media.baps.dev/wp-content/uploads/2023/09/03155408/03_BAPS-Swaminarayan-Akshardham-Backgrounder.pdf): explicitly identifies the axes as 255 feet **width**, 345 feet **length**, and 191 feet **height**. This resolves inconsistent axis descriptions in secondary sources. The reconstruction's overall bounding proportions use these axes.

Official photographs remain on their owners' servers. Temporary local review copies are not shipped as site assets. Reading photographs as references does not imply BAPS endorsement or authorization.

## Implemented exterior characteristics

The silhouette is led by a tall, curved central **shikhar**, not a hemispherical dome copied from the exhibition pavilions. Eight subordinate shikhars, nine lower stepped/pyramidal roofs, projecting side bays, an articulated raised base, deep axial portico and broad front stair form the silhouette. Layered mouldings, banded pillars, shallow geometric niches and floral friezes suggest the stone surface at the campus camera's scale. Materials use pale ivory and limestone tones with restrained gold finials.

The interior elliptical dome is documented in the official fact sheet but its precise geometry and exterior expression have not been established by these photographs. It is not replaced with an invented exposed bulbous dome. Figurative sacred carvings and emblems are likewise not invented; the reconstruction uses abstract geometric relief where exact sculpture is unresolved.

## Unresolved geometry and limits

- No measured plans, elevations, photogrammetry, CAD/BIM or licensed mesh were supplied. The published overall dimensions do not resolve individual tower spacing or section depths.
- Roof placement, relative heights, rear elevation, drum sections, exact stair counts and tread sizes, portico spans, niches, carving programs, and fine surface detail remain photo-based approximations.
- The scene uses display units rather than a surveyed real-world model. Overall bounds are approximately 24.8 units wide, 33.553 long and 18.576 high, preserving the published **255:345:191** proportion. Front stairs project to z=12.525 and the rear base reaches z=-21.028. The plinth and chamber extend rearward, with repeated facade bays and redistributed roof centers; columns, carving profiles and tower cross-sections are not stretched. Matching overall bounds does not establish measured component dimensions or a verified roof plan.
- Exactly nine modeled principal/subordinate curved shikhars and nine pyramidal roof elements preserve documented counts, but their full arrangement is inferred. Small applied relief spires are decorative parts of the principal tower, not additional shrines.
- Pale material colors are visual approximations under the exhibition's lighting; they are not calibrated stone samples.

For an exact replica, replace this reconstruction with geometry provided or licensed by the building's authorized source, or obtain measured plans and elevation/roof references and verify the resulting model with the source. The current asset must remain labeled “photo-based reconstruction.”

## Integration

The entrance-hero revision calibrates one scene unit to `(255 × 0.3048) / 24.8 = 3.134032258` metres using the published width. The standing camera is 1.7 metres above the paved surface in this scale. Landscape furnishings use the same conversion. This calibration preserves consistent visual scale; it does not supply measured plans or verify the inferred architectural details above.

`makeRobbinsvilleMandir(palette?)` returns a `THREE.Group`, front facing local +Z. Pass the scene palette to reuse its materials and disposal path. Materials used: `pale`, `ivory`, `pathLine`, `gold`, `wood`. If omitted, the function creates five materials, which the caller must dispose with the geometry. Meshes intentionally carry no `pavilionId`; this landmark is not a seventh exhibition section.
