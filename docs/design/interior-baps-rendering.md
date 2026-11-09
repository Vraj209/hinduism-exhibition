# Revised interior rendering evidence

All 29 story states were rendered from the frozen Three.js components into 58 static fallback images. The final set contains 15 moments across sections 1, 2, 3, 5 and 6, plus 14 source-backed festival entries in section 4. These are original digital illustrations, not official BAPS photographs or documentary images of the proposed exhibition. No external photograph is embedded as a scene texture or redistributed in this asset set.

## Capture method

- Desktop: CSS viewport and drawing buffer **1440 × 900**; one image for every story.
- Mobile: CSS viewport **390 × 500**, invoking the actual mobile camera and 61-degree field of view; drawing buffer and output **780 × 1000**. This is a separate render, not a crop of the desktop image.
- The temporary export harness raises the mobile pixel ratio to 2 solely for native-resolution static images. The application's 1.25 pixel-ratio cap is unchanged. No architecture, camera, materials or stage objects are substituted by the harness.
- The source component settles with `active=true`, `paused=true`, and `reducedMotion=true`. Every capture asserts that exactly the selected stage has weight 1 and all others have weight 0.
- Renderer counters are sampled after a mood application that refreshes the shadow map, avoiding artificially low cached-shadow measurements on the first story.
- The screenshots are encoded as WebP (desktop quality 90, mobile 89). No generative image processing or photo replacement is used.

The mobile application stage has the matching 0.78 aspect ratio. Its contained fallback image therefore preserves this composition rather than cropping it into the entire phone viewport.

## Measured rendering cost

Measurements are from Three.js r187 in local Chrome. Retained triangles count every mesh, including hidden story groups. Submitted triangles and render calls count the measured frame, including shadow refresh and any reflection pass. They are not GPU frame-time benchmarks.

| Section | Retained geometry triangles | Maximum render calls | Maximum submitted triangles | Assets | Bytes |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1 · Hindu Jivan Shaili | 95,004 | 29 | 187,552 | 6 | 703,814 |
| 2 · Hindu Riti / Parampara | 92,344 | 23 | 172,896 | 6 | 859,996 |
| 3 · Hindu Manyata | 52,250 | 44 | 154,250 | 6 | 574,202 |
| 4 · Hindu Festivals | 341,980 | 43 | 254,064 | 28 | 3,816,632 |
| 5 · Hindu Mulyo | 74,396 | 41 | 146,944 | 6 | 497,398 |
| 6 · Hindu Sanskruti Ādhār Stambh | 101,496 | 27 | 189,896 | 6 | 679,816 |

The festival world retains **341,980 triangles across all 14 tableaux**. That exceeds the earlier 200k total-geometry aspiration; only the active tableau is displayed. Its maximum measured frame is 254,064 submitted triangles including shadow rendering, at 43 calls. The highest call count across all six worlds is 44, comfortably below 120. Non-festival worlds each retain fewer than 102,000 triangles.

The source schedules ambient rendering at at most 24 fps for Festivals and 12 fps for other worlds. Static capture checks observed zero additional frames over a 250 ms paused window in every desktop/mobile context. This asset check does not replace the application's full pause, hidden-tab and interaction regression tests.

## Visual review

All 58 final images contain rendered architecture and their intended stage. No primary object is cropped out by either camera composition. Foreground arches and ceiling edges are intentionally cropped as architectural framing. The contemplation ceiling is visible along the top edge while the pool, niche/path and model-table moments remain unobstructed.

Two mobile legibility issues were corrected before final capture: Rakhi loops became red cotton threads with floral medallions on a sloped display, and Navratri's small single cross became two longer, thicker pairs with contrasting bands. Holi gained the powder bowls and pichkari required by its visual brief.

| Frame | Festival | Final visual observation |
| --- | --- | --- |
| 4-1 | Diwali | Rows of terracotta lamps and taller lamp stands remain distinct on the raised platform. |
| 4-2 | Annakut | Four tiers of vegetarian food bowls remain legible in both compositions. |
| 4-3 | Holi | Contained bonfire, three colored powder bowls and a pichkari are all visible; the front objects were added after review. |
| 4-4 | Gujarati New Year · Nutan Varsh | Open carved doorway, floral welcome pattern and lamps distinguish the New Year moment. |
| 4-5 | Pushpadolotsav · Fuldol | Flower-covered swing, chains and five powder bowls remain readable. |
| 4-6 | Ram Navami | Cradle beneath a carved canopy is visible in the daylight setting. |
| 4-7 | Swaminarayan Jayanti · Hari Jayanti | Cradle and canopy remain visible in a deeper evening setting; the caption identifies the distinct observance. |
| 4-8 | Janmashtami | Cradle with adjacent devotional objects remains visible; the caption distinguishes it from the other birth celebrations. |
| 4-9 | Maha Shivratri | Unoccupied Shivaling object study with a water vessel is visible on the raised platform. |
| 4-10 | Raksha Bandhan | Three red cotton rakhis with floral centers and thread ends are clearly visible on the revised sloped display. |
| 4-11 | Guru Purnima | Open book on a stand forms the central object study; there is no invented portrait or inscription. |
| 4-12 | Rath Yatra | Wheeled, canopied chariot is fully within frame. |
| 4-13 | Makar Sankranti · Uttarayan | Five colored kites and two spools remain visible, including the upper kite. |
| 4-14 | Navratri | Two larger crossed pairs of striped ras sticks fill the table and remain readable on mobile. |

Other-world subjects were also reviewed: the everyday haveli's bowl, folded fabric and harmonium; the threshold hall's measured path, facing colonnades and open portal; the contemplation world's niche, path and tabletop; the garden's original gathering-space arrangements; and the three-pillar hall's book, mandir model and guiding path.

The three birth-celebration scenes intentionally share the cradle object type. Their lighting and surrounding objects differ, while the visible names and source text establish their distinct religious identities. These frames do not introduce a deity likeness into an empty cradle.

## Assets and review sheets

- Runtime assets: `public/worlds/{{section}}-{{story}}.webp` and `public/worlds/{{section}}-{{story}}-mobile.webp`.
- [Festival desktop contact sheet](baps-contact-sheets/festivals-desktop.webp)
- [Festival mobile contact sheet](baps-contact-sheets/festivals-mobile.webp)
- [Other-world desktop contact sheet](baps-contact-sheets/other-worlds-desktop.webp)
- [Other-world mobile contact sheet](baps-contact-sheets/other-worlds-mobile.webp)

Review sheets are in `docs/design/baps-contact-sheets/`, outside the served public asset set.

The 58 runtime WebP files total **7,131,858 bytes** (6.80 MiB). All 58 SHA-256 hashes are distinct. The largest file is `public/worlds/2-2.webp` at 174,846 bytes. Browser page errors, scene `onError` callbacks and console errors were zero during the final capture run.

| Frame prefix | Desktop bytes | Mobile bytes |
| --- | ---: | ---: |
| `1-1` | 142,392 | 89,434 |
| `1-2` | 146,024 | 92,344 |
| `1-3` | 143,570 | 90,050 |
| `2-1` | 171,442 | 114,832 |
| `2-2` | 174,846 | 113,544 |
| `2-3` | 171,162 | 114,170 |
| `3-1` | 124,138 | 68,968 |
| `3-2` | 124,312 | 69,892 |
| `3-3` | 120,748 | 66,144 |
| `4-1` | 164,602 | 109,234 |
| `4-2` | 169,880 | 111,548 |
| `4-3` | 157,658 | 103,530 |
| `4-4` | 171,480 | 112,652 |
| `4-5` | 174,526 | 116,088 |
| `4-6` | 169,056 | 112,478 |
| `4-7` | 163,422 | 107,086 |
| `4-8` | 163,494 | 107,000 |
| `4-9` | 156,808 | 101,068 |
| `4-10` | 160,634 | 106,178 |
| `4-11` | 163,448 | 107,530 |
| `4-12` | 163,470 | 107,420 |
| `4-13` | 157,256 | 106,010 |
| `4-14` | 164,620 | 108,456 |
| `5-1` | 107,870 | 57,888 |
| `5-2` | 108,832 | 59,678 |
| `5-3` | 106,560 | 56,570 |
| `6-1` | 140,746 | 80,202 |
| `6-2` | 150,628 | 82,090 |
| `6-3` | 144,070 | 82,080 |

## Frozen source fingerprints

The six source files were hashed before capture and rechecked afterwards; all matched. The only export-only alteration is the drawing-buffer pixel ratio described above.

| Source | SHA-256 |
| --- | --- |
| `components/world-scene.tsx` | `6202d2fec27da081088f3483ed7eef469e0c6b9ae7c8498351dc2c2038f2dc83` |
| `lib/festival-world.ts` | `78dba839730cc1c8810c5ba119fa468b8237da04bb2c346ec5c6542c03d4f5d6` |
| `content/festivals.ts` | `7e953d62a190abbcbcde35b77b80af16e3d80a34f56f797a83d6c5188f2ed3ac` |
| `lib/world-geometry.ts` | `c16ddace36b629cab3a4493118190ec710976ff9fb59abf21c66ec0415027be9` |
| `lib/world-garden.ts` | `6adb4417f86f0c16fbd338471c9ec5cb1a976a9fef76e07cf8cd96924b29fc85` |
| `lib/world-architecture.ts` | `e6f45eaf7b49e1cf934a1fd4e18823c75e7c310c49c18a5972782329fbd32d07` |

The temporary harness and detailed per-image counters remain in `/tmp/hinduism-campus-preview/`; runtime assets and this report are the durable deliverables. Application-level accessibility, navigation, fallback switching and browser regression checks are handled separately.
