# BAPS photography across all six domes

9 November 2026 · America/Toronto

## Delivered

Replaced all fifteen active rendered story illustrations in the five non-festival domes with relevant photographs from official BAPS pages. The fourteen existing festival photographs remain unchanged. All twenty-nine story photographs have local WebP assets, factual alt text, original image URLs, source-page links and BAPS credits. The public sources page lists all twenty-nine photographs, including without JavaScript. Summary dialogs use the corresponding photograph descriptions and source context.

The dark scroll component and its stylesheet are byte-for-byte unchanged from the start of this follow-up. The six sections, approved captions, opening/closing bookends and all forty-one display positions remain intact. One obsolete summary sentence describing a rendered path was replaced with a description of the photograph's contextual role. Source notes now distinguish documented BAPS practices from general exhibition teachings.

Photographs remain uncropped and unfiltered in the gallery. Prayer, walking toward a mandir and discussion accompany the atma theme as contexts for reflection; they do not claim to depict a soul or prescribed stages of its journey. The scripture photograph is described by its visible Devanagari script without inventing a text title or language.

## New photographs

The fifteen new WebPs total **2,387,766 bytes**. The full twenty-nine-image set totals **4,546,254 bytes**. Sources below are official context pages; individual image provenance and dimensions are in `content/gallery-media.ts`.

| Story ID | Photograph context | Official source |
| --- | --- | --- |
| `food-and-everyday-life` | Samuh Bhojan — shared meals, BAPS family activities | [BAPS source](https://na.baps.org/learn/our-values/family) |
| `what-we-wear` | Traditional dance, Chino Hills, California | [BAPS source](https://na.baps.org/learn/our-values/culture) |
| `the-language-of-song` | Devotional singing, Janmashtami, London, 2023 | [BAPS source](https://londonmandir.baps.org/2023/09/shri-krishna-janmashtami-celebrations-3/) |
| `remembering-our-duties` | Seva — volunteer service, BAPS satsang activities | [BAPS source](https://na.baps.org/learn/our-values/spirituality) |
| `remembering-our-relationships` | Ghar sabha — a family gathering at home | [BAPS source](https://na.baps.org/learn/our-values/family) |
| `a-connection-to-something-greater` | Family puja at home, BAPS spirituality and satsang | [BAPS source](https://na.baps.org/learn/our-values/spirituality) |
| `atma-the-soul` | Morning puja, Chino Hills, California. A photographed moment of prayer and reflection, used as context for the atma theme rather than a depiction of the soul | [BAPS source](https://na.baps.org/learn/our-values/spirituality) |
| `the-atmas-journey` | A family visiting BAPS Shri Swaminarayan Mandir, Chicago, Illinois. The approach to a sacred space is an editorial connection to the journey theme, not a representation of the atma’s path | [BAPS source](https://na.baps.org/learn/our-values/spirituality) |
| `a-map-for-reflection` | Goshti, or group discussion, pictured on the official BAPS North America spirituality page. Shared reflection provides context for the exhibition’s map metaphor; no doctrinal chart is depicted | [BAPS source](https://na.baps.org/learn/our-values/spirituality) |
| `human-values` | Mahant Swami Maharaj plants a tree in Toronto · BAPS North America service | [BAPS source](https://na.baps.org/learn/our-values/service) |
| `rooted-in-tradition` | Value-based learning · BAPS Swaminarayan Research education | [BAPS source](https://research.baps.org/about-education/) |
| `an-act-of-kindness` | Great British Spring Clean · London · 30 March 2024 | [BAPS source](https://londonmandir.baps.org/2024/03/great-british-spring-clean/) |
| `shastra-scripture` | Textual learning · BAPS Swaminarayan Research education | [BAPS source](https://research.baps.org/about-education/) |
| `mandir-sacred-space` | BAPS Shri Swaminarayan Mandir, London · official mandir gallery | [BAPS source](https://londonmandir.baps.org/images/the-mandir-moods/) |
| `sant-guru-living-guidance` | Mahant Swami Maharaj · official BAPS London profile | [BAPS source](https://londonmandir.baps.org/about/his-holiness-mahant-swami-maharaj/) |

## Verification

- `npm run build` — passed; production build serves `/`, `/read` and `/references` as static routes.
- `npm run lint`, `npx tsc --noEmit` and `git diff --check` — passed.
- **16 production Chrome checks passed in 30.4 seconds** against `http://localhost:3001`: six all-display layout checks, six gallery/summary accessibility checks, two all-story image/source checks and two reading/no-JavaScript credit checks.
- All 41 displays checked at 1440×900, 1024×768, 768×680, 390×844, 320×740 and 844×390. All 29 photographs loaded at desktop and mobile widths.
- Twelve Axe scans across the six mobile galleries and their summaries reported zero automatically detectable WCAG violations. This does not establish complete manual accessibility compliance.
- Independent metadata audit: 29 exact story matches, unique image URLs and unique image hashes; all WebP dimensions match their metadata; old fourteen festival entries unchanged; all fifteen new photographs visually inspected against their documented context.
- Gallery implementation and stylesheet compared against the pre-follow-up copies and confirmed byte-identical.

The final screenshot capture waits for the existing entrance fade to finish. All six responsive layout checks passed again in 16.8 seconds after adding that capture readiness check. Final desktop and phone screenshots were visually reviewed for all five updated domes, plus the centered guru portrait. These are focused checks for this change, not a full repository regression run.

## Scope

Original rendered images remain stored as historical assets. Campus rendering, architecture, navigation and audio behavior were not changed by this follow-up. This is a local implementation; no deployment or Git commit was made.

## Review images

Production desktop and phone captures for each updated dome:

| Dome | Desktop | Phone |
| --- | --- | --- |
| Hindu Jivan Shaili | [Shared meal](dark-gallery/1440-hindu-jivan-shaili-1.png) | [Shared meal](dark-gallery/390-hindu-jivan-shaili-1.png) |
| Hindu Riti/Parampara | [Volunteer service](dark-gallery/1440-hindu-riti-parampara-1.png) | [Volunteer service](dark-gallery/390-hindu-riti-parampara-1.png) |
| Hindu Manyata | [Prayer](dark-gallery/1440-hindu-manyata-1.png) | [Prayer](dark-gallery/390-hindu-manyata-1.png) |
| Hindu Mulyo | [Tree planting](dark-gallery/1440-hindu-mulyo-1.png) | [Tree planting](dark-gallery/390-hindu-mulyo-1.png) |
| Hindu Sanskruti Adhar Stambh | [Scripture](dark-gallery/1440-hindu-sanskruti-adhar-stambh-1.png) | [Scripture](dark-gallery/390-hindu-sanskruti-adhar-stambh-1.png) |

The [guru portrait](dark-gallery/1440-hindu-sanskruti-adhar-stambh-3.png) also verifies the centered image treatment.
