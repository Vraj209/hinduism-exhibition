import { festivals, festivalSourceNote } from "./festivals";
import { festivalScenes } from "./festival-scenes";

/**
 * Editorial moments derived from the supplied PDF, plus the user-authorized festival guide.
 * World names, settings, palettes, and visual descriptions are original design
 * interpretations. They are not religious claims or reconstructions of exhibits.
 * Section titles and central messages remain in content/exhibition.ts.
 */
export type StoryMoment = {
  id: string;
  title: string;
  caption: string;
  summary: string;
  takeaway: string;
  sourceLabel: string;
  visualDescription: string;
  sourceHref?: string;
  references?: string[];
  traditionLabel?: string;
  visualSource?: string;
};

export type SectionWorld = {
  sectionId: number;
  worldName: string;
  concept: string;
  setting: string;
  palette: [string, string, string];
  sourceNote: string;
  stories: StoryMoment[];
};

export const storySourceNote =
  "The six section messages come from the supplied exhibition brief. Other sections explore those messages; the expanded festival guide draws on separately linked official BAPS sources. All environments are original architectural interpretations.";

export const worlds: SectionWorld[] = [
  {
    sectionId: 1,
    worldName: "An everyday haveli",
    concept:
      "Give the exhibition’s three everyday examples a quiet place for attention.",
    setting:
      "A carved timber haveli with a central lightwell, three intimate bays and an ivory floor.",
    palette: ["#c49c80", "#efe5d2", "#857457"],
    sourceNote:
      "Food, clothing, and the language of song are the source’s examples. Photographs show BAPS community life; no particular foods, garments, or languages are prescribed by the exhibition brief.",
    stories: [
      {
        id: "food-and-everyday-life",
        title: "Food and everyday life",
        caption:
          "The exhibition places what we eat within the everyday choices through which a sense of worship can be expressed.",
        summary:
          "The opening takeaway begins close to daily experience: what we eat. It places food alongside clothing and the language of song as examples of a way of life that can itself be worship. This moment invites attention to that connection, keeping the exhibition’s focus on everyday living.",
        takeaway:
          "Everyday life is part of the exhibition’s understanding of worship.",
        sourceLabel: "Takeaways for gutko, page 1 · Section 1 · What we eat",
        visualDescription:
          "Conceptual scene: an unadorned shallow stone vessel on a low terrace, framed by carved timber columns. No food, offering, or ritual is depicted.",
      },
      {
        id: "what-we-wear",
        title: "What we wear",
        caption:
          "Clothing appears among the familiar expressions of daily life that the exhibition connects with a sense of worship.",
        summary:
          "What we wear is the second everyday example in this section. The exhibition connects it with the larger idea that the way we live can itself be a form of worship. The emphasis remains on this relationship between ordinary life and devotion, leaving visitors space to consider their own experience.",
        takeaway:
          "The exhibition draws attention to devotion within familiar daily expressions.",
        sourceLabel: "Takeaways for gutko, page 1 · Section 1 · What we wear",
        visualDescription:
          "Conceptual scene: folded neutral textiles and a nonfigural woven relief catch soft side light. The forms suggest texture without depicting a particular garment.",
      },
      {
        id: "the-language-of-song",
        visualSource:
          "https://www.baps.org/News/2011/Pramukh-Swamina-Pagale-A-Musical-Journey-National-Kirtan-Bhakti-Programme-3114.aspx",
        title: "The language of song",
        caption:
          "The language in which we sing completes the exhibition’s three examples of devotion expressed through ordinary life.",
        summary:
          "The source’s third example is the language in which we sing. Alongside food and clothing, song brings the section’s attention to the texture of everyday life. Its message holds these expressions together: the way we live can itself be worship. This moment invites a pause to consider that connection.",
        takeaway:
          "The source connects the language of song with everyday worship.",
        sourceLabel:
          "Takeaways for gutko, page 1 · Section 1 · The language of song",
        visualDescription:
          "An original harmonium object study within a carved timber haveli. Official BAPS kirtan documentation supports this musical context; the exhibition’s source does not prescribe an instrument, song or language.",
      },
    ],
  },
  {
    sectionId: 2,
    worldName: "A courtyard of connection",
    concept:
      "Express the three reminders held within ritual as connected architectural spaces.",
    setting:
      "Three shaded passages converge around an open, softly lit central court.",
    palette: ["#bf967b", "#eadfc9", "#8b7362"],
    sourceNote:
      "The source names duties, relationships, and connection to something greater. Photographs show documented BAPS practices as context; the exhibition brief supplies no particular rite or ritual instruction.",
    stories: [
      {
        id: "remembering-our-duties",
        title: "Remembering our duties",
        caption:
          "The exhibition presents ritual as a reminder of our duties, bringing responsibility into the meaning of a familiar practice.",
        summary:
          "A ritual can call something back to mind. In this section, the first reminder named is our duties. The exhibition asks visitors to look toward the meaning a practice carries, including the responsibilities it recalls. This moment concentrates on that connection between a ritual and what it helps us remember.",
        takeaway: "Ritual is presented as a reminder of our duties.",
        sourceLabel: "Takeaways for gutko, page 1 · Section 2 · Our duties",
        visualDescription:
          "Conceptual scene: a sequence of evenly spaced thresholds creates a measured approach to a simple open alcove. The sequence is a design metaphor, not a ritual procedure.",
      },
      {
        id: "remembering-our-relationships",
        title: "Remembering our relationships",
        caption:
          "Relationships are the second connection named in the exhibition’s account of ritual as a meaningful act of remembrance.",
        summary:
          "The exhibition places relationships beside duties in its account of ritual. A practice can remind us of the connections that matter in our lives. This moment invites visitors to consider the relationships a familiar tradition brings to mind, staying with the source’s emphasis on ritual as a reminder.",
        takeaway: "Ritual can bring our relationships into focus.",
        sourceLabel:
          "Takeaways for gutko, page 1 · Section 2 · Our relationships",
        visualDescription:
          "Conceptual scene: two colonnades face one another across a shared paved court. Their alignment suggests connection without representing a specific ceremony or family custom.",
      },
      {
        id: "a-connection-to-something-greater",
        title: "A connection to something greater",
        caption:
          "The exhibition’s third reminder turns toward a connection to something greater, completing its account of the meaning within ritual.",
        summary:
          "The source joins duties and relationships with a connection to something greater. Together, these three reminders give ritual its meaning in this section. This moment leaves space for reflection on that wider connection while preserving the openness of the exhibition’s wording and the place it gives to remembrance.",
        takeaway:
          "The exhibition connects ritual with duties, relationships, and something greater.",
        sourceLabel:
          "Takeaways for gutko, page 1 · Section 2 · Something greater",
        visualDescription:
          "Conceptual scene: a shaded passage opens to a view of the sky. The opening is an architectural invitation to reflection, not a depiction of a deity or doctrine.",
      },
    ],
  },
  {
    sectionId: 3,
    worldName: "A contemplative path",
    concept:
      "Use an open path and a nonliteral map to invite reflection on the source’s account of the atma.",
    setting:
      "A calm, domed court with an unbroken floor line, a recessed niche, and a carved map-like surface.",
    palette: ["#bb947b", "#eee7d7", "#6f7c76"],
    sourceNote:
      "The source identifies atma as the soul and describes its journey through a map metaphor. Photographs of prayer, visiting a mandir and shared reflection provide context; they do not depict the soul or introduce stages, destinations or doctrines absent from the PDF.",
    stories: [
      {
        id: "atma-the-soul",
        title: "Atma — the soul",
        caption:
          "The exhibition introduces belief and worldview through the atma, using the word soul as its translation in the takeaway.",
        summary:
          "Atma is the central term in the source statement for this section. The takeaway translates it as soul and introduces its journey as a focus of Hindu belief and worldview. This moment begins with that supplied word and translation, giving visitors a clear starting point for the section.",
        takeaway: "The exhibition translates atma as soul.",
        sourceLabel: "Takeaways for gutko, page 1 · Section 3 · Atma (soul)",
        visualDescription:
          "Conceptual scene: a softly lit, empty stone niche creates a place to pause. It is not an image of the soul or a claim about its appearance.",
      },
      {
        id: "the-atmas-journey",
        title: "The atma’s journey",
        caption:
          "The soul’s journey gives this section its focus, inviting visitors to consider the exhibition’s language of movement and understanding.",
        summary:
          "The exhibition describes the atma through the idea of a journey. This moment holds attention on that word and the questions it may open. The source gives a point of departure for reflection; the accompanying photograph provides an everyday context for considering the journey metaphor.",
        takeaway:
          "The atma’s journey is the source’s central theme for this section.",
        sourceLabel:
          "Takeaways for gutko, page 1 · Section 3 · The atma’s journey",
        visualDescription:
          "Conceptual scene: a continuous stone inlay leads through an open court without numbered stages or a depicted endpoint. It must not imply a cosmological route.",
      },
      {
        id: "a-map-for-reflection",
        title: "A map for reflection",
        caption:
          "A detailed map is the exhibition’s metaphor for the understanding of the atma’s journey offered through Hindu belief.",
        summary:
          "The source uses a map to describe understanding of the atma’s journey. A map is therefore the section’s own central metaphor. Here, it becomes a visual prompt for reflection on belief and worldview, with the emphasis remaining on the exhibition’s language rather than on any additional account of the journey.",
        takeaway: "The map is a metaphor supplied by the exhibition.",
        sourceLabel:
          "Takeaways for gutko, page 1 · Section 3 · The map metaphor",
        visualDescription:
          "Conceptual scene: shallow abstract lines cross an uninscribed stone panel. This is a map-like composition, not a sacred diagram, geographical map, or doctrinal chart.",
      },
    ],
  },
  {
    sectionId: 4,
    worldName: "A calendar of celebration",
    concept:
      "Distinct festival tableaux connect the source’s message of light, truth and love to named celebrations.",
    setting:
      "A carved sandstone festival court with a series of individually staged celebrations.",
    palette: ["#bd8a70", "#efe5d4", "#9a7842"],
    sourceNote: festivalSourceNote,
    stories: festivals.map((festival) => ({
      id: festival.id,
      title: festival.name,
      caption: festival.caption,
      summary: festival.summary,
      takeaway: festival.takeaway,
      sourceLabel: "BAPS Swaminarayan Sanstha · " + festival.name,
      sourceHref: festival.sourceUrls[0],
      references: festival.sourceUrls,
      traditionLabel: festival.traditionLabel,
      visualDescription: festivalScenes[festival.id],
    })),
  },
  {
    sectionId: 5,
    worldName: "A garden of kindness",
    concept:
      "Connect the source’s shared humanity, roots in tradition, and acts of kindness through an open garden.",
    setting:
      "A low, welcoming garden pavilion with three shaded resting places on a continuous path.",
    palette: ["#bd967c", "#eae1cf", "#73816a"],
    sourceNote:
      "The source names human values, their roots in tradition, and acts of kindness. Photographs of BAPS community life and service offer examples alongside these themes; the exhibition brief adds no prescribed list of virtues.",
    stories: [
      {
        id: "human-values",
        title: "Human values",
        caption:
          "The exhibition presents the values in this section as human values too, connecting its Hindu setting with shared humanity.",
        summary:
          "The takeaway begins by widening its address: the values it presents are human values as well as Hindu values. This moment concentrates on that shared humanity. It preserves the exhibition’s welcoming emphasis and keeps the connection to tradition and kindness in view, as the source itself does.",
        takeaway: "The exhibition describes these values as human values too.",
        sourceLabel: "Takeaways for gutko, page 1 · Section 5 · Human values",
        visualDescription:
          "Conceptual scene: an open-sided pavilion meets the garden path without a raised threshold. Its welcoming arrangement is a design choice, not a historical claim about the exhibition.",
      },
      {
        id: "rooted-in-tradition",
        title: "Rooted in tradition",
        caption:
          "The source places the roots of these values in an ancient tradition while describing their continuing presence in life today.",
        summary:
          "The exhibition connects values rooted in an ancient tradition with life in the present. Its statement holds those ideas together: roots in tradition and expression through kindness today. This moment invites visitors to consider that continuity, without adding dates or an account of history beyond the source’s own wording.",
        takeaway:
          "The source connects roots in tradition with values lived today.",
        sourceLabel:
          "Takeaways for gutko, page 1 · Section 5 · Rooted in tradition",
        visualDescription:
          "Conceptual scene: a repeated geometric carving continues from weathered sandstone into a softly lit new surface. The pattern is an editorial metaphor for continuity, without dates or sacred motifs.",
      },
      {
        id: "an-act-of-kindness",
        title: "An act of kindness",
        caption:
          "The exhibition gives values a living expression through acts of kindness, bringing its message into the choices of everyday life.",
        summary:
          "Kindness is the concrete example that closes the source statement for this section. The exhibition describes values as alive in each act of kindness today. This moment returns attention to action: the small, visible ways a value can be expressed, and the everyday life in which that expression takes place.",
        takeaway:
          "Acts of kindness give the exhibition’s values a present-day expression.",
        sourceLabel: "Takeaways for gutko, page 1 · Section 5 · Kindness today",
        visualDescription:
          "Conceptual scene: a shaded stone seat and a tray of shared water cups open onto a garden path. This original image of hospitality supports the theme of kindness without depicting a claimed historical event or prescribing a ritual.",
      },
    ],
  },
  {
    sectionId: 6,
    worldName: "A hall of three pillars",
    concept:
      "Bring scripture, sacred space, and living guidance into one connected hall, preserving the source’s three-part relationship.",
    setting:
      "A single domed hall with three connected alcoves and a common central floor.",
    palette: ["#bc9176", "#f0e7d7", "#94764d"],
    sourceNote:
      "These three moments remain within one section. Shastra, Mandir, and Sant — Guru follow this exhibition’s devotional account, including Satpurush. The photographs document BAPS scripture, sacred space and spiritual guidance; this account is not presented as identical across every Hindu tradition.",
    stories: [
      {
        id: "shastra-scripture",
        title: "Shastra — Scripture",
        caption:
          "Shastras govern us, discipline us, and protect us. They are the manual of mankind that teaches us how to live a life of integrity and purpose",
        summary:
          "Shastra is the first of the three pillars named in the final section. The source describes scripture as guidance that disciplines and protects, teaching a life of integrity and purpose. In its shared journey metaphor, scripture gives the map. This moment keeps that role connected with Mandir and Sant — Guru.",
        takeaway:
          "Shastra provides guidance for integrity and purpose in the exhibition’s account.",
        sourceLabel:
          "Takeaways for gutko, page 1 · Section 6A · Shastra — Scripture",
        visualDescription:
          "Conceptual scene: an uninscribed, book-like stone relief rests on a low plinth within the three-bay hall. It suggests scripture without inventing a text, verse, manuscript, or approved religious artifact.",
      },
      {
        id: "mandir-sacred-space",
        title: "Mandir",
        caption:
          "A Mandir is not just a building; it is a center of supreme peace that stabilizes the mind, builds character, and serves the community.",
        summary:
          "Mandir is the second pillar in the source. It is described as a centre of peace that stabilizes the mind, builds character, and serves the community. Within the exhibition’s connected image, the mandir also provides the destination. This moment brings those stated roles together in one place for reflection.",
        takeaway:
          "Mandir joins peace, character, and community in this exhibition’s account.",
        sourceLabel: "Takeaways for gutko, page 1 · Section 6B · Mandir",
        visualDescription:
          "Conceptual scene: a small architectural model of an open courtyard is presented on the hall’s shared plinth. It interprets sacred space architecturally without reproducing a sanctum or adding unapproved murtis.",
      },
      {
        id: "sant-guru-living-guidance",
        title: "Sant — Guru",
        caption:
          "Scripture gives the map, the mandir provides the destination, but the Satpurush is the living guide who has already walked the road and shows us how to reach the end",
        summary:
          "Sant — Guru completes the three pillars. The source describes the Satpurush as a living guide who has already walked the road and shows how to reach its end. Scripture’s map, the mandir’s destination, and this guidance belong together in the exhibition’s account. This moment preserves that specific devotional framing.",
        takeaway:
          "The Satpurush is the living guide in the exhibition’s map, destination, and guide metaphor.",
        sourceLabel: "Takeaways for gutko, page 1 · Section 6C · Sant — Guru",
        visualDescription:
          "Conceptual scene: a clear floor line continues through the shared court within the hall. No person, portrait, footprint, or named guru is invented; the line is a design metaphor for guidance.",
      },
    ],
  },
];
