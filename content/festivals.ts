/**
 * User-authorized editorial extension, researched from official BAPS sources.
 * These named festivals are additional material, not claims from the one-page PDF.
 * Source pages were checked on 8 November 2026 (America/Toronto).
 */
export type Festival = {
  id: string;
  name: string;
  caption: string;
  summary: string;
  takeaway: string;
  sourceUrls: string[];
  visualBrief: string;
  sourceNote: string;
  traditionLabel: string;
  accent: string;
};

export const festivalSourceNote =
  "An expanded selection researched from official BAPS sources at the user’s request. These named celebrations extend the original exhibition brief. Practices vary by region and tradition; this is an introduction, not a complete Hindu festival calendar.";

const researchNote =
  "Additional festival research from BAPS Swaminarayan Sanstha; not part of the supplied one-page exhibition brief.";

const festivalBase =
  "https://www.baps.org/cultureandheritage/Traditions/AnnualCelebrationsandFestivals/";

/** Editorial order: Diwali, Annakut and Holi first; not calendar order. */
export const festivals: Festival[] = [
  {
    id: "diwali",
    name: "Diwali",
    caption: "Rows of lamps, a welcoming rangoli, and the hope of inner light.",
    summary:
      "Diwali is a festival of light and the victory of good over evil. BAPS describes homes and mandirs illuminated with divos, or lamps, and entrances decorated with rangoli. Families prepare sweets and gather for celebration. Alongside the visible brightness, lighting a lamp expresses a prayer for ignorance to give way to inner understanding.",
    takeaway:
      "Light can express a hope for understanding as well as celebration.",
    sourceUrls: [`${festivalBase}Diwali.aspx`],
    visualBrief:
      "An original carved-stone entrance at dusk, shallow earthen divos along the steps, and a clearly visible floor rangoli. Warm flame light is the focal point. Author the rangoli independently; do not trace a BAPS photograph or reproduce its branding.",
    sourceNote: researchNote,
    traditionLabel: "A Hindu festival, introduced through BAPS sources",
    accent: "#d2a250",
  },
  {
    id: "annakut",
    name: "Annakut",
    caption:
      "An abundant offering of vegetarian food expresses gratitude through devotion and care.",
    summary:
      "Annakut brings lovingly prepared vegetarian dishes together as an offering to God. Its name evokes a mountain of food. BAPS presents the offering as an expression of gratitude, closely associated with New Year celebrations. The many dishes and their careful arrangement make devotion visible through preparation, generosity, and the shared work of a community.",
    takeaway: "Careful preparation becomes an expression of gratitude.",
    sourceUrls: [
      `${festivalBase}NutanVarsh/NewYearAnnakut.aspx`,
      "https://londonmandir.baps.org/2023/11/diwali-hindu-new-year-annakut-celebrations-2023/",
    ],
    visualBrief:
      "Tiered trays of distinctly modeled vegetarian sweets, fruit, breads and bowls of food before a carved mandir backdrop. This is an original illustrative offering, not a photograph or inventory of a particular mandir’s Annakut.",
    sourceNote: researchNote,
    traditionLabel: "An offering prominent in BAPS New Year celebrations",
    accent: "#c79353",
  },
  {
    id: "holi",
    name: "Holi",
    caption:
      "Spring colour and the story of Prahlad bring celebration and steadfast devotion together.",
    summary:
      "Holi welcomes spring with colour and celebrates the victory of good over evil. BAPS recounts the traditional story of Prahlad, whose devotion endures his father’s hostility and the danger of a fire. Its account also describes coloured powder and water in the celebrations. The story and the colours give this festival both a reflective and a joyful character.",
    takeaway:
      "The celebration joins spring’s colour with the strength of devotion.",
    sourceUrls: [`${festivalBase}Holi.aspx`],
    visualBrief:
      "A spring courtyard with bowls of dry gulal, a pichkari and a small contained ceremonial bonfire at a safe visual distance. Use colour in the actual objects, not a generic floating particle cloud. Do not depict a child in flames.",
    sourceNote: researchNote,
    traditionLabel: "A spring festival; BAPS account of the Prahlad tradition",
    accent: "#ae5f65",
  },
  {
    id: "nutan-varsh",
    name: "Gujarati New Year · Nutan Varsh",
    caption:
      "A new beginning is welcomed with prayer, greetings, and a visit to the mandir.",
    summary:
      "Nutan Varsh is the New Year observed in the Gujarati tradition represented here. BAPS describes devotees visiting the mandir, joining the first aarti of the year, and exchanging warm greetings. It is closely linked with Annakut, but this moment focuses on beginning again together. It does not imply that every Hindu community marks New Year in the same way.",
    takeaway:
      "A new beginning offers a moment for prayer and renewed relationships.",
    sourceUrls: [
      `${festivalBase}NutanVarsh/NewYearAnnakut.aspx`,
      "https://www.baps.org/losangeles/events/diwali-festival-of-lights-2026",
    ],
    visualBrief:
      "Morning light at an open carved haveli doorway, an aarti lamp and a welcoming approach. Keep the food-offering display in the related Annakut scene so the two moments remain distinct.",
    sourceNote: researchNote,
    traditionLabel: "Gujarati New Year in the BAPS tradition",
    accent: "#b78a49",
  },
  {
    id: "pushpadolotsav",
    name: "Pushpadolotsav · Fuldol",
    caption:
      "Flowers, a decorated swing, and coloured water give devotion a joyful expression.",
    summary:
      "Pushpadolotsav, also called Fuldol, is the festival of flowers and colours associated with the period after Holi. BAPS describes a flower-covered hindolo, or swing, bearing a murti, as well as coloured water and gulal. In its devotional interpretation, the festival expresses a wish for life to be coloured by bhakti and for God to remain close to the heart.",
    takeaway: "Flowers and colour express the wish to live with bhakti.",
    sourceUrls: [`${festivalBase}Fuldol.aspx`],
    visualBrief:
      "A flower-covered hindolo with fine chains and a pichkari nearby, framed by a carved timber bay. The swing and floral structure provide the illustration; any murti likeness requires a separately approved religious asset. Distinguish this from Holi’s bonfire scene.",
    sourceNote: researchNote,
    traditionLabel: "A festival with a distinctive Swaminarayan observance",
    accent: "#b17671",
  },
  {
    id: "ram-navami",
    name: "Ram Navami",
    caption:
      "The birth of Shri Ram is remembered through prayer and reflection on his example.",
    summary:
      "Ram Navami celebrates the birth of Shri Ram. In the BAPS account, devotees remember his life, pray to develop his virtues, and offer aarti at midday. The festival invites reflection on ethical conduct and the responsibilities expressed in his story. Although celebrated alongside Swaminarayan Jayanti in BAPS, it honours Shri Ram and retains its own identity.",
    takeaway:
      "Remembering Shri Ram’s life invites reflection on ethical conduct.",
    sourceUrls: [
      `${festivalBase}RamNavami.aspx`,
      "https://londonmandir.baps.org/2003/04/shri-hari-jayanti-tithi-ram-navami/",
    ],
    visualBrief:
      "A decorated birth cradle beneath a carved canopy with an aarti lamp in clear midday light. BAPS London documents devotees rocking Shri Ram’s cradle. The canopy design is original; an unoccupied cradle is an editorial object study, not an official devotional image.",
    sourceNote: researchNote,
    traditionLabel: "Shri Ram’s birth celebration",
    accent: "#c59a63",
  },
  {
    id: "swaminarayan-jayanti",
    name: "Swaminarayan Jayanti · Hari Jayanti",
    caption:
      "Devotional song and evening aarti celebrate the birth of Bhagwan Swaminarayan.",
    summary:
      "Hari Jayanti marks the birth of Bhagwan Swaminarayan in Chhapaiya, near Ayodhya. The BAPS account describes devotees gathering at mandirs, singing bhajans, recalling his life and teachings, and performing aarti at his evening birth hour. It is a celebration within the Swaminarayan tradition. Its shared observance with Ram Navami does not make the two commemorations identical.",
    takeaway:
      "Song and remembrance honour Bhagwan Swaminarayan’s life and teachings.",
    sourceUrls: [
      `${festivalBase}HariJayanti.aspx`,
      "https://londonmandir.baps.org/2003/04/shri-hari-jayanti-tithi-ram-navami/",
    ],
    visualBrief:
      "A small gilded cradle framed by carved timber brackets, an aarti lamp and deep evening light. BAPS documents cradle-rocking at Hari Jayanti. Keep it visually distinct from Ram Navami’s sunlit stone canopy; any Swaminarayan likeness is a separate approved religious asset.",
    sourceNote: researchNote,
    traditionLabel: "Swaminarayan tradition",
    accent: "#b77b4e",
  },
  {
    id: "janmashtami",
    name: "Janmashtami",
    caption:
      "A small swing and devotional song recall the birth and life of Shri Krishna.",
    summary:
      "Janmashtami celebrates Shri Krishna’s birth. BAPS describes devotees remembering his life and teachings, offering aarti at midnight, and singing bhajans around a swing holding a child murti of Krishna. Readings associated with the Bhagavata Purana and Bhagavad Gita also form part of its account. This introduction centres on remembrance and devotion rather than presenting one observance as universal.",
    takeaway:
      "The celebration brings remembrance of Shri Krishna into shared devotion.",
    sourceUrls: [`${festivalBase}Janmashtami.aspx`],
    visualBrief:
      "A small decorated cradle-like swing under a carved canopy in midnight blue and warm lamp light. Model its textiles, chains and floral trim. Treat any child-Krishna murti as a separate approved asset; an unoccupied swing is an editorial object study.",
    sourceNote: researchNote,
    traditionLabel: "Shri Krishna’s birth celebration; BAPS account",
    accent: "#758b9b",
  },
  {
    id: "maha-shivratri",
    name: "Maha Shivratri",
    caption:
      "A night of prayer honours Shiva through worship, vigil, and offerings.",
    summary:
      "Maha Shivratri is dedicated to Shiva. BAPS describes night-time worship, devotional singing, and the offering of bili leaves and water in abhishek of the Shivaling. Its account includes the traditional story of a hunter whose actions become an offering and whose heart changes. Here the emphasis is attentive worship and reflection, rather than instructions for undertaking a fast or ritual.",
    takeaway:
      "The night’s observance places attention and devotion at its centre.",
    sourceUrls: [`${festivalBase}MahaShivratri.aspx`],
    visualBrief:
      "A respectful original object study of a Shivaling form with bili leaves, a water vessel and restrained night lighting within a stone mandap. Keep the setting grounded and still; do not add psychedelic effects or imagery of intoxicants.",
    sourceNote: researchNote,
    traditionLabel: "A festival dedicated to Shiva; BAPS account",
    accent: "#7b8a88",
  },
  {
    id: "raksha-bandhan",
    name: "Raksha Bandhan",
    caption:
      "A decorated thread expresses a bond of care, protection, and remembrance.",
    summary:
      "Raksha Bandhan gives visible form to a relationship of care through the tying of a rakhi. BAPS describes sisters tying the decorated thread to their brothers and praying for their protection. It also records a Swaminarayan observance in which sadhus tie rakhis for devotees. These related practices connect family affection with the tradition’s understanding of divine protection.",
    takeaway: "A small thread can carry a strong promise of care.",
    sourceUrls: [`${festivalBase}RakshaBandhan.aspx`],
    visualBrief:
      "A close view of an original woven rakhi on a metal puja tray, with small separate portions of kumkum and rice. Make the thread’s knot and textile texture legible. Avoid a generic infinity sign or a bracelet presented as a documented artifact.",
    sourceNote: researchNote,
    traditionLabel: "Family observance and its Swaminarayan devotional context",
    accent: "#ad6657",
  },
  {
    id: "guru-purnima",
    name: "Guru Purnima",
    caption:
      "Gratitude is offered to the guru for spiritual guidance and support.",
    summary:
      "Guru Purnima is an occasion to honour the guru and express gratitude for spiritual guidance. BAPS also identifies it as Vyas Purnima, recalling Ved Vyas. Its account describes praise, prayer, and guru-puja, with the guru understood as a guide who helps dispel ignorance. This devotional framing belongs to the tradition presented here and does not prescribe one relationship for every visitor.",
    takeaway: "Guidance is met with gratitude and a renewed wish to learn.",
    sourceUrls: [
      `${festivalBase}GuruPurnima.aspx`,
      "https://londonmandir.baps.org/worship/festivals/",
    ],
    visualBrief:
      "An intimate carved teaching alcove with an open uninscribed book and an offering tray, composed as a quiet place of learning. These objects are editorial staging, not a prescribed ritual arrangement. Use no invented guru portrait or sacred quotation.",
    sourceNote: researchNote,
    traditionLabel: "A guru-honouring festival; BAPS devotional framing",
    accent: "#b4a070",
  },
  {
    id: "rath-yatra",
    name: "Rath Yatra",
    caption:
      "A decorated chariot carries devotion from the mandir into a shared procession.",
    summary:
      "Rath Yatra is a festival of chariots associated especially with Jagannath Puri. BAPS distinguishes that tradition from its own celebrations, where a small murti of Harikrishna Maharaj travels in a chariot around a mandir complex or through a city. The procession offers a public expression of devotion and, in the BAPS interpretation, a prayer for guidance through life.",
    takeaway:
      "The chariot procession joins shared devotion with a prayer for guidance.",
    sourceUrls: [`${festivalBase}RathYatra.aspx`],
    visualBrief:
      "A compact decorated wooden chariot with visible wheels, pulling ropes, a cloth canopy and a clear stone processional path. Use an original design; do not label it a reconstruction of the Puri chariots or include an unapproved murti likeness.",
    sourceNote: researchNote,
    traditionLabel: "Puri association, with a distinct BAPS mandir observance",
    accent: "#b77e52",
  },
  {
    id: "makar-sankranti",
    name: "Makar Sankranti · Uttarayan",
    caption:
      "Colourful kites share the sky while giving and community remain central below.",
    summary:
      "Makar Sankranti is introduced here through BAPS’s account of Uttarayan, with its emphasis on kite-flying and giving. Families gather to fly colourful kites, while donations of grain, food and other resources serve the community. The festival offers a meeting of celebration and generosity. This Gujarati-facing presentation does not treat every regional harvest observance as the same festival.",
    takeaway: "Celebration can make room for giving to the community.",
    sourceUrls: [`${festivalBase}Uttarayan.aspx`],
    visualBrief:
      "A sunlit haveli terrace with paper kites, a wooden thread reel and a bowl of grain in the foreground. Keep a few kites visible against open sky. The grain refers to giving; do not invent a ritual or collapse Pongal and Lohri into this scene.",
    sourceNote: researchNote,
    traditionLabel: "Uttarayan emphasis associated with Gujarat",
    accent: "#b99557",
  },
  {
    id: "navratri",
    name: "Navratri",
    caption:
      "Nine nights bring devotional celebration in remembrance of the Goddess’s victory over evil.",
    summary:
      "Navratri honours the Goddess, named in the BAPS account as Shakti, Amba and Durga among other names. The account describes nine nights of devotional celebration and dancing, recalling her victory over evil. BAPS mandirs host observances within their religious setting. This introduction presents that setting without suggesting that the forms of worship and celebration are identical across Hindu communities.",
    takeaway:
      "Shared celebration recalls the Goddess and the victory of good over evil.",
    sourceUrls: [
      `${festivalBase}Navratri.aspx`,
      "https://www.baps.org/News/2008/Symbolic-Festival-Celebration-Navratri-Diwali--Annakut-Amdavad-742.aspx",
      "https://www.baps.org/glossary.aspx",
    ],
    visualBrief:
      "A pair of decorated ras sticks in a warm courtyard arranged for circular devotional gathering. BAPS documents ras sticks at a Navratri celebration and defines the paired-stick dance. The cloth borders and circle are original staging; no unverified garba pot or invented Goddess image is included.",
    sourceNote: researchNote,
    traditionLabel:
      "Goddess-centred observance, introduced through BAPS sources",
    accent: "#a85346",
  },
];
