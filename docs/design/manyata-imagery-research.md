# Hindu Manyata — devotional imagery verification

9 November 2026 · America/Toronto

## Recommended Murti photograph

Reuse the existing approved photograph `janmashtami-cambridge-2026-murti` from `content/festival-photographs.json`.

- Local preview: `/gallery/festivals/janmashtami-cambridge-2026-murti.webp`.
- Original: `/gallery/festivals/full/janmashtami-cambridge-2026-murti.jpg`.
- Source dimensions: **1333 × 2000**.
- Event: Janmashtami, **5 September 2026**, Cambridge, Ontario, Canada.
- [Official event page](https://www.baps.org/cambridge/news/janmashtami-celebration-2026) and [official gallery](https://www.baps.org/cambridge/news/janmashtami-celebration-2026/gallery).
- [Exact original image](https://static.wn.baps-apps.org/photo%2Fwebnext%2F2026%2Fcambridge%2Fnews%2F24198%2Fdisplay%2F05a.cambridge_janmashtami_2026_display-1789229913191.jpg).
- Alt: “A richly dressed Krishna murti on a red velvet platform at the Janmashtami celebration in Cambridge, Ontario.”
- Credit: **Photo: BAPS Swaminarayan Sanstha**.
- Permission basis: the exhibition owner previously confirmed that permission covers official BAPS event photographs. The existing manifest records this confirmation; it is not a claim of a public reuse licence.

The complete original was visually inspected. Its subject is distinct and intact, with the decorated head, face, hands, garment and seat visible. Place it within the requested miniature frame using `object-fit: contain`; retain the natural colours and avoid cropping the turban or base.

The official BAPS [Murti Pratishtha explanation](https://www.baps.org/cultureandheritage/Traditions/HinduPractices/MurtiPratishtha.aspx) describes consecration as invoking divine presence. Its role here supports the supplied Murti sentence, without independently asserting the consecration history of this particular photographed object.

## Avatar — closest visual match

A standalone devotional illustration of **Krishna guiding Arjun's chariot** is published with BAPS's [Rath Yatra essay](https://www.baps.org/Article/2011/Rath-Yatra-2171.aspx). The surrounding “Mahabharat Rath” section identifies Krishna as Arjun's charioteer and guide. This is a direct visual fit for the user's supplied English sentence, “God comes to guide.” BAPS's [Brahmi Sthiti Yoga essay](https://www.baps.org/Enlightening%20Essays/2011/Brahmi-Sthiti-Yoga-%28Part-8%29-2844.aspx) explicitly identifies Krishna as an avatar.

- [Exact artwork file](https://www.baps.org/Data/Sites/1/Media/OtherImages/2171/Webimages/krishnarath.jpg).
- Local original: `/beliefs/krishna-guides-arjun.jpg`.
- The local implementation uses the smaller original JPEG through responsive Next.js image optimization; an unused larger WebP derivative was discarded.
- Dimensions: **350 × 268**, JPEG, 26,579 bytes.
- Alt: “BAPS-published devotional artwork of Krishna guiding Arjun's horse-drawn chariot.”
- Suggested credit: **Devotional artwork via BAPS Swaminarayan Sanstha**.
- The source does not name an individual artist. The artwork's creation year is unknown; do not treat the archive URL's 2011 segment or the essay's 2001 festival date as the artwork's creation date.

The artwork was visually inspected against its source. It is already an authored religious depiction; no AI-generated likeness, redraw or invented iconography is needed. At approximately 160–220px wide inside the card, it remains within the original resolution. Preserve the full illustration, including the figures, horses and chariot, and add the rose accent in the surrounding card rather than recolouring the religious image.

The current request expressly asks for verified BAPS devotional artwork, and that request authorizes this local implementation. The earlier permission confirmation specifically referred to **event photographs**; that narrower record is not copied into this artwork's metadata as if it explicitly covered this separate illustration. No independent public reproduction licence was established, and this change has not been deployed. The original JPEG was copied into `public/beliefs/` for the requested local design.

## Avatar — already-approved photographic option

The existing `nrusinh-london-2023-reverence` photograph shows a garlanded **devotional artwork of Nrusinh Bhagwan**, with Mahant Swami Maharaj offering reverence before it.

- Local preview: `/gallery/festivals/nrusinh-london-2023-reverence.webp`.
- Original: `/gallery/festivals/full/nrusinh-london-2023-reverence.jpg`.
- Dimensions: **899 × 781**.
- Event: Nrusinh Jayanti, **4 May 2023**, London, United Kingdom.
- [Official event page](https://www.baps.org/Vicharan/2023/04-May-2023-23513.aspx); image **53 of 55**, whose caption identifies Nrusinh Bhagwan and the occasion.
- [Exact source photograph](https://www.baps.org/Data/Sites/1/Media/GalleryImages/27155/WebImages/230504_london_vicharan_B__7_.JPG).
- Alt: “Mahant Swami Maharaj offers reverence before a garlanded devotional image of Nrusinh Bhagwan in London.”
- Credit: **Photo: BAPS Swaminarayan Sanstha**.
- Permission: covered by the previously recorded owner confirmation for official event photography.

BAPS's [Nrusinh Jayanti account](https://www.baps.org/cultureandheritage/Traditions/AnnualCelebrationsandFestivals/NrusinhJayanti.aspx) identifies Nrusinh as an incarnation of Vishnu and explains the connection to Prahlad. The unaltered full photograph is therefore an authentic, conceptually appropriate event photograph containing devotional artwork. It is not the same deliverable as a standalone illustration; describe that distinction honestly in implementation notes if this option is selected. Do not extract, perspective-correct or redraw the painted figure from it and imply that the resulting standalone work has separately verified permission.

The wider alternative `nrusinh-london-2023-arti` (1199 × 800) also contains the same devotional artwork, but much of the frame is occupied by the back of the worshipper; the reverence photograph is the stronger small-card composition.

## Verification and supplied reference

- Inspected all three existing full photographs and the standalone Krishna artwork directly.
- Re-fetched the two selected event-gallery pages: the Cambridge source includes the exact murti URL; the London source includes the exact Nrusinh filename in its gallery markup, and its published caption identifies the subject and event.
- The reference was initially absent. The user subsequently attached it in this chat; it is preserved as `docs/design/manyata-beliefs-reference.png`. All six Gujarati sentences were independently transcribed and checked against that image.
- The final Gujarati is verbatim from the supplied reference. No translation or inferred Gujarati copy was created.
- The other four visual motifs can be independently authored abstract metaphors: radiant point, ripples, circular journey and illuminated lotus. They should not be presented as documentary religious depictions.

## Suggested application metadata

```ts
{
  id: "krishna-guides-arjun",
  kind: "devotional-artwork",
  src: "/beliefs/krishna-guides-arjun.jpg",
  originalSrc: "/beliefs/krishna-guides-arjun.jpg",
  width: 350,
  height: 268,
  alt: "BAPS-published devotional artwork of Krishna guiding Arjun's horse-drawn chariot.",
  sourcePageUrl: "https://www.baps.org/Article/2011/Rath-Yatra-2171.aspx",
  sourceImageUrl: "https://www.baps.org/Data/Sites/1/Media/OtherImages/2171/Webimages/krishnarath.jpg",
  credit: "Devotional artwork via BAPS Swaminarayan Sanstha",
  useBasis: "Explicitly requested by the exhibition owner for this local Manyata card design.",
  publicReuseLicence: "Not independently established.",
  artist: null,
  artworkYear: null,
}
```

Murti metadata can reference the existing `janmashtami-cambridge-2026-murti` manifest entry directly, retaining its event-photo approval, source URLs, actual location/year and credit.
