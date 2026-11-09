# Domed pavilion interior rendering evidence

The frozen interior scenes were recaptured after the thematic stone reliefs were placed and visually approved. All **29 story states** now have refreshed desktop and mobile fallback images: **58 WebP assets** in `public/worlds/`. This includes 15 story states across sections 1, 2, 3, 5 and 6, and all 14 separately researched festival entries in section 4. The reliefs follow the six PDF themes; the named festival collection remains a separate editorial extension.

These are original Three.js illustrations informed by the documented BAPS architectural references. They are not official photographs, surveyed replicas or documentary images of a completed exhibition. The older `interior-baps-rendering.md` and `baps-contact-sheets/` remain historical evidence of the previous image set.

## Capture method

- Desktop viewport and drawing buffer: **1440 × 900**.
- Mobile CSS viewport: **390 × 500**, using the component’s mobile camera and 61-degree field of view. Drawing buffer and saved image: **780 × 1000**. Mobile images are separate renders, not crops of desktop images.
- The existing export harness replaces only the application’s pixel-ratio cap with the device pixel ratio, allowing mobile DPR 2. It makes no scene, geometry, camera, stage, material or lighting substitutions.
- The actual component runs with `active=true`, `paused=true` and `reducedMotion=true`. Every capture validates the requested story index, exactly one selected stage at weight 1, and every other stage at weight 0.
- All twelve section/device contexts retained the same render count during their final **250 ms paused interval**. This checks static capture behavior, not the application’s broader pause, hidden-tab or navigation behavior.
- Desktop WebP quality is 90; mobile quality is 89. Encoding uses the rendered PNG directly. No generative processing or photographic replacement was applied.
- Browser page errors, console errors and scene `onError` callbacks: **zero**. All 58 output hashes are distinct.

The existing recursive compiler captured all eight source files listed below. Their SHA-256 hashes were verified again after rendering and all still matched. `compile-revised-worlds.cjs`, `capture-revised-worlds.cjs` and the local server at port 3088 provided the actual-component fixture. The new contact sheets use the same captured files.

## Measured rendering cost

Counters are from Three.js r187 in local Chrome. Retained geometry includes hidden story groups. Submitted triangles and calls describe the measured frame, including shadow refresh and any reflection rendering; they are not GPU timing benchmarks.

| Section | Retained geometry triangles | Maximum render calls | Maximum submitted triangles | Assets | Bytes |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1 · Hindu Jivan Shaili | 98,148 | 35 | 193,840 | 6 | 717,494 |
| 2 · Hindu Riti / Parampara | 95,816 | 29 | 179,840 | 6 | 873,512 |
| 3 · Hindu Manyata | 56,818 | 53 | 167,954 | 6 | 582,682 |
| 4 · Hindu Festivals | 345,748 | 49 | 261,600 | 28 | 3,862,458 |
| 5 · Hindu Mulyo | 78,284 | 47 | 154,720 | 6 | 497,350 |
| 6 · Hindu Sanskruti Ādhār Stambh | 105,480 | 33 | 197,864 | 6 | 682,794 |

The festival world retains **345,748 triangles across all 14 tableaux**; only the selected tableau is shown. This still exceeds the earlier 200k retained-geometry aspiration. The largest measured submitted frame is 261,600 triangles, including shadow rendering. The maximum measured call count across all worlds is **53**, below the 120-call aspiration. These asset measurements do not establish frame rates on a physical mobile device.

## Visual review

All 58 final images were reviewed in the four contact sheets below, covering every story in both camera compositions. Full-resolution checks also inspected the contemplation tabletop, garden relief and three-pillar hall on mobile. Primary story objects remain within frame and the new carvings do not cover them. Foreground arch, roof, ceiling and column edges are intentionally cropped as architectural framing; a foreground pillar motif can fall outside the narrower mobile composition. Each world’s principal wall or pavilion relief remains present in its mobile scene.

| Section | New carving placement and scene review |
| --- | --- |
| 1 · Everyday life | The bowl-and-cloth hero sits above the far haveli opening; the near-column repetition appears in the desktop frame. The bowl, folded fabric and harmonium retain clear stage silhouettes. |
| 2 · Rites and traditions | Interwoven bands are physically mounted on the freestanding stone screen beside the route. The screen remains to the right of the path, paired structures and open threshold in all three states. |
| 3 · Beliefs and worldview | The path-and-portal relief is mounted on the low perimeter wall beside the pool. The niche, measured route and raised tabletop remain clear beneath the cropped ceiling. The tabletop fits inside the mobile frame. |
| 4 · Festivals | The diya relief remains on the mandir façade; the desktop composition also shows the near-column repeat. It supplies the PDF theme of light while the central tableau identifies the current festival. |
| 5 · Values | The supporting hand and vessel sit on the garden pavilion fascia. The open gathering space, screen and bench arrangements retain their silhouettes and access path. |
| 6 · Three pillars | The linked book, mandir and guiding path sit below the centre roof and above the central opening. The open book, model pavilion and guiding threshold stages remain unobstructed. |

| Frame | Festival | Desktop and mobile observation |
| --- | --- | --- |
| 4-1 | Diwali | Rows of lamps and the taller lamp stands remain distinct on the platform. |
| 4-2 | Annakut | Tiered vegetarian food offerings remain visible and distinct from the Diwali arrangement. |
| 4-3 | Holi | The contained fire, coloured powder bowls and pichkari remain inside the stage composition. |
| 4-4 | Gujarati New Year · Nutan Varsh | The welcome doorway, floral arrangement and lamps remain visible. |
| 4-5 | Pushpadolotsav · Fuldol | The decorated swing, supporting canopy, chains and powder bowls remain clear. |
| 4-6 | Ram Navami | The empty cradle and carved canopy are visible in the daylight setting. |
| 4-7 | Swaminarayan Jayanti · Hari Jayanti | The empty cradle remains visible in the warmer evening setting. |
| 4-8 | Janmashtami | The empty cradle, canopy and adjacent devotional objects remain visible. |
| 4-9 | Maha Shivratri | The Shivaling object study and water vessel remain fully within the platform composition. |
| 4-10 | Raksha Bandhan | The three red threads and floral medallions remain visible on the sloped display. |
| 4-11 | Guru Purnima | The open uninscribed book is visible on its stand; no portrait is introduced. |
| 4-12 | Rath Yatra | The canopy, body and wheels of the chariot remain inside the frame. |
| 4-13 | Makar Sankranti · Uttarayan | All five kites, including the upper kite, and two spools remain visible. |
| 4-14 | Navratri | Two crossed pairs of banded sticks remain visible on the table. |

The three birth-celebration scenes intentionally share a cradle type. Their surrounding objects and lighting differ; the application’s visible titles and explanations establish their distinct identities. No likeness is placed in a cradle. This poster review checks geometry and framing; the production suite separately checks readable UI, source separation, fallback selection and controls.

## Assets and contact sheets

- [Festival desktop contact sheet](domed-interior-contact-sheets/festivals-desktop.webp)
- [Festival mobile contact sheet](domed-interior-contact-sheets/festivals-mobile.webp)
- [Other-world desktop contact sheet](domed-interior-contact-sheets/other-worlds-desktop.webp)
- [Other-world mobile contact sheet](domed-interior-contact-sheets/other-worlds-mobile.webp)
- [Per-image capture metrics and SHA-256 hashes](domed-interior-contact-sheets/capture-metrics.json)
- [Frozen source hashes, verified after capture](domed-interior-contact-sheets/source-hashes.json)

The runtime assets total **7,216,290 bytes** (6.88 MiB). The largest is `public/worlds/2-2.webp`, at **179,176 bytes**. Every desktop/mobile pair uses its own rendering and has different bytes. Review sheets remain outside `public/`.

| Frame prefix | Desktop bytes | Mobile bytes |
| --- | ---: | ---: |
| `1-1` | 146,424 | 90,198 |
| `1-2` | 149,806 | 93,140 |
| `1-3` | 146,952 | 90,974 |
| `2-1` | 175,732 | 114,826 |
| `2-2` | 179,176 | 113,806 |
| `2-3` | 175,488 | 114,484 |
| `3-1` | 126,100 | 69,780 |
| `3-2` | 126,296 | 70,750 |
| `3-3` | 122,774 | 66,982 |
| `4-1` | 167,130 | 109,368 |
| `4-2` | 173,536 | 111,452 |
| `4-3` | 160,612 | 103,632 |
| `4-4` | 175,002 | 112,596 |
| `4-5` | 178,120 | 116,058 |
| `4-6` | 172,496 | 112,452 |
| `4-7` | 166,348 | 107,048 |
| `4-8` | 166,538 | 107,066 |
| `4-9` | 156,092 | 101,052 |
| `4-10` | 164,106 | 106,130 |
| `4-11` | 167,004 | 107,446 |
| `4-12` | 166,774 | 107,608 |
| `4-13` | 164,438 | 105,822 |
| `4-14` | 168,090 | 108,442 |
| `5-1` | 108,352 | 58,074 |
| `5-2` | 109,198 | 58,088 |
| `5-3` | 106,916 | 56,722 |
| `6-1` | 141,316 | 80,566 |
| `6-2` | 151,292 | 82,530 |
| `6-3` | 144,568 | 82,522 |

## Frozen source fingerprints

| Source | SHA-256 |
| --- | --- |
| `components/world-scene.tsx` | `17a4101d33490c2e2ae0c38ccec91eba3adef6c8204fdd66cfb3457ddb447340` |
| `lib/festival-world.ts` | `0a9bcced832f8d8a80981bcb86a379960d11a28cee604428ee3401d2576537a4` |
| `content/festivals.ts` | `7e953d62a190abbcbcde35b77b80af16e3d80a34f56f797a83d6c5188f2ed3ac` |
| `lib/world-geometry.ts` | `c16ddace36b629cab3a4493118190ec710976ff9fb59abf21c66ec0415027be9` |
| `lib/world-garden.ts` | `6adb4417f86f0c16fbd338471c9ec5cb1a976a9fef76e07cf8cd96924b29fc85` |
| `lib/world-architecture.ts` | `e6f45eaf7b49e1cf934a1fd4e18823c75e7c310c49c18a5972782329fbd32d07` |
| `lib/interior-carving.ts` | `acfae80aa1001b7817f4684498dba7cbd1419abe49704e4ca15e03138f89855b` |
| `lib/pavilion-reliefs.ts` | `dd8aad95ac29f8aaa4cafbb544f89d0527d877accf088eaa977e18e277c7543d` |

The hashes above were captured before rendering and verified unchanged afterwards. Application build and browser regression results are recorded separately in the domed-pavilion verification report.
