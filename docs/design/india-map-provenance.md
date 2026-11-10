# Dome 1 India map: geometry and provenance

Prepared on 9 November 2026 for the Bhasha + Bhusha explorer. The map is geographic vector data, not a hand-drawn approximation. It includes 28 state features and 8 union-territory features, with no district outlines.

## Source

- Provider: [geoBoundaries, IND ADM1](https://www.geoboundaries.org/api/current/gbOpen/IND/ADM1/), boundary ID `IND-ADM1-1811400`.
- Original attribution in the provider metadata: **DataMeet India community, Election Commission of India**; [DataMeet maps repository](https://github.com/datameet/maps).
- License: [Creative Commons Attribution 2.5 India](https://creativecommons.org/licenses/by/2.5/in/). Display `DataMeet / geoBoundaries` with a source link alongside the map and retain this notice.
- Pinned source commit: `9469f09592ced973a3448cf66b6100b741b64c0d`.
- [Pinned GeoJSON download](https://media.githubusercontent.com/media/wmgeolab/geoBoundaries/9469f09592ced973a3448cf66b6100b741b64c0d/releaseData/gbOpen/IND/ADM1/geoBoundaries-IND-ADM1_simplified.geojson).
- Download SHA-256: `4c63fe43294a391e8f2de4e9f86f3edb60f8688275b9fee90c61fb2aa0c26061` (5,103,747 bytes).

The provider's metadata labels its represented year `2011`, although direct inspection of the actual feature collection confirms Telangana, separate Jammu and Kashmir / Ladakh, and the merged Dadra and Nagar Haveli and Daman and Diu. Its source-update date is 19 January 2023 and build date is 12 December 2023. Do not describe this as a fresh government survey or official cartographic certification. International boundary depictions follow this source; they have not been edited to settle territorial claims. This is an exhibition navigation map, not a map for legal, navigation or survey use.

## Preparation

1. Download the pinned source above.
2. Use Mapshaper **0.7.101** to simplify the whole feature collection together, retaining shared border topology and small features:

   ```sh
   npx --yes mapshaper@0.7.101 india-source.geojson \
     -simplify dp interval=1200m keep-shapes \
     -o india-display.geojson
   node scripts/prepare-india-map.mjs india-display.geojson
   ```

   [Mapshaper simplification documentation](https://mapshaper.org/docs/guides/simplification.html). Mapshaper reported repairing 84 intersections during simplification. The resulting GeoJSON SHA-256 was `fffaa6a8ef9ce687add1b28609b44d578ce8ab05b6048593490e597f92ba180d`.

3. The preparation script projects the coordinates using a spherical Lambert azimuthal equal-area projection centred at 82° E, 23° N, then uniformly fits all geographic features into a `640 × 720` viewBox with 18 units of padding. Mainland, Lakshadweep, and Andaman and Nicobar Islands retain their geographic positions; there are no relocated island insets.
4. Coordinates are rounded to 0.01 SVG units. Exterior and interior rings remain in each compound path. **Render with `fillRule="evenodd"`** so territorial enclaves and holes are filled correctly.
5. State display names are normalized from the source's transliteration. Source legacy ISO codes `IN-CT`, `IN-OR`, `IN-TG`, and `IN-UT` are mapped to `IN-CG`, `IN-OD`, `IN-TS`, and `IN-UK` respectively. All joins use these consistent IDs. See the [ISO India entry](https://www.iso.org/obp/ui/#iso:code:3166:IN).

`content/india-map.ts` is generated static data (218,420 bytes); there is no added client or runtime GIS dependency. `label` is the centroid of the largest polygon per feature, intended as a name-tooltip anchor, not a capital-city location. Do not use label positions as an authoritative geographic point of interest.

## Validation

- Exactly 36 unique IDs: 28 states and 8 union territories.
- The eight territories are `IN-AN`, `IN-CH`, `IN-DH`, `IN-DL`, `IN-JK`, `IN-LA`, `IN-LD`, and `IN-PY`.
- Every path and label coordinate is nonempty and finite; all geometry is fitted inside the shared viewBox.
- Visually inspected a 640 × 720 rendered SVG/PNG: mainland outlines, state borders, the northeast, and both island groups are present. Chandigarh, Delhi, the merged west-coast territory, Puducherry's separate pieces, and small islands remain separate geometry.
- Small regions need the searchable state/territory selector: making their polygons larger would falsify the geography. Do not use a transparent hit area for one region that blocks selecting its neighbours.
- Details for union territories must stay empty unless separately verified exhibition content exists. Map coverage is not evidence for cultural details.
