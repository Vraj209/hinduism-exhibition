/**
 * Source: docs/Takeaways for gutko.pdf, the single supplied page.
 * Exact titles, subtitles and exhibition statements are preserved. Summaries and
 * reflection questions are editorial paraphrases, not additional religious claims.
 * The source is a takeaway sheet, so short summaries are intentional.
 */
export type ExhibitionSection = {
  id: number;
  slug: string;
  title: string;
  theme: string;
  message: string;
  summary: string;
  takeaways: string[];
  reflection: string;
  sourcePages: number[];
  sourceLabel: string;
  quotation: string;
};

export const sourcePdfHref = "/exhibition-source.pdf";
export const exhibitionSourceNote =
  "The six section messages come from the exhibition’s one-page takeaway sheet. The expanded festival guide is additional, separately sourced BAPS research; the architectural campus is an original digital interpretation.";

export const sections: ExhibitionSection[] = [
  {
    id: 1,
    slug: "hindu-jivan-shaili",
    title: "Hindu Jivan Shaili",
    theme: "The Hindu Way of Life",
    message: "The way we live can itself be a form of worship.",
    summary:
      "The journey begins with everyday life. This section draws attention to what we eat, what we wear, and the language in which we sing. In the exhibition’s telling, these familiar expressions of daily life can themselves be a form of worship. The invitation is to look at ordinary habits with renewed attention and to recognise the place of devotion within them.",
    takeaways: [
      "Daily life and worship are presented as connected.",
      "Food, clothing, and the language of song are the source’s examples.",
      "Devotion can be expressed through familiar, everyday practices.",
    ],
    reflection: "Where do you find a sense of devotion in your everyday life?",
    sourcePages: [1],
    sourceLabel: "Takeaways for gutko, page 1 · Section 1",
    quotation:
      "The way we live — what we eat, what we wear, what language we sing in — is itself a form of worship.",
  },
  {
    id: 2,
    slug: "hindu-riti-parampara",
    title: "Hindu Riti/Parampara",
    theme: "Rites & Traditions",
    message:
      "Rituals remind us of our duties, our relationships, and a connection to something greater.",
    summary:
      "From the rhythm of daily life, the exhibition turns to rites and traditions. Its central message presents ritual as a reminder: of our duties, of the relationships that matter to us, and of our connection to something greater. The emphasis is on what a practice calls to mind and the meaning it carries. This section invites a thoughtful encounter with tradition through those three connections.",
    takeaways: [
      "Ritual is presented as a meaningful reminder.",
      "Traditions bring duties and relationships into focus.",
      "Rites point toward a connection to something greater.",
    ],
    reflection:
      "Which tradition reminds you of a relationship or responsibility you cherish?",
    sourcePages: [1],
    sourceLabel: "Takeaways for gutko, page 1 · Section 2",
    quotation:
      "Every ritual is a reminder — of our duties, our relationships, and our connection to something greater.",
  },
  {
    id: 3,
    slug: "hindu-manyata",
    title: "Hindu Manyata",
    theme: "Beliefs & Worldview",
    message:
      "The exhibition introduces Hindu belief through the journey of the atma, or soul.",
    summary:
      "Hindu Manyata introduces the exhibition’s account of belief and worldview through the atma, translated in the source as the soul. The takeaway uses the image of a detailed map to describe Hinduism’s understanding of the atma’s journey. This gives the section its central focus: a way of considering the soul and its journey.",
    takeaways: [
      "The atma is identified in the source as the soul.",
      "The soul’s journey is the section’s central theme.",
      "The exhibition uses a map as a metaphor for belief and worldview.",
    ],
    reflection:
      "What questions does the idea of the atma’s journey open for you?",
    sourcePages: [1],
    sourceLabel: "Takeaways for gutko, page 1 · Section 3",
    quotation:
      "Hinduism offers one of the world’s most detailed maps of the atma’s (soul’s) journey.",
  },
  {
    id: 4,
    slug: "hindu-festivals",
    title: "Hindu Festivals",
    theme: "Celebrations of Light & Life",
    message:
      "Every Hindu festival is a celebration of a cosmic victory — light over darkness, truth over ego, love over separation.",
    summary:
      "The exhibition presents festivals as celebrations with a deeper meaning. Its takeaway brings together three images of victory: light over darkness, truth over ego, and love over separation. These images invite visitors to consider what is being celebrated as well as the celebration itself. Light, truth, and love give this section its emotional centre.",
    takeaways: [
      "Light overcoming darkness is one of the section’s central images.",
      "Truth overcoming ego gives celebration an inward meaning.",
      "Love overcoming separation places connection at the heart of celebration.",
    ],
    reflection:
      "How might a celebration bring more light, truth, or connection into your life?",
    sourcePages: [1],
    sourceLabel: "Takeaways for gutko, page 1 · Section 4",
    quotation:
      "Every Hindu festival is a celebration of a cosmic victory — light over darkness, truth over ego, love over separation.",
  },
  {
    id: 5,
    slug: "hindu-mulyo",
    title: "Hindu Mulyo",
    theme: "Core Values — Values to Light Our Lives",
    message:
      "Values rooted in Hindu tradition come alive in everyday acts of kindness.",
    summary:
      "Hindu Mulyo brings the journey to the values we live. The exhibition presents these as human values rooted in an ancient tradition and made present through acts of kindness today. Its message connects inherited values with the choices people make in everyday life. Kindness is the concrete example given in the source: a way for values to become visible through action.",
    takeaways: [
      "The exhibition presents Hindu values as human values too.",
      "Their roots in tradition connect with life today.",
      "Acts of kindness bring values into everyday practice.",
    ],
    reflection:
      "What small act of kindness could give a value you hold a visible form today?",
    sourcePages: [1],
    sourceLabel: "Takeaways for gutko, page 1 · Section 5",
    quotation:
      "These are not Hindu values alone. They are human values — rooted in an ancient tradition, alive in every act of kindness today.",
  },
  {
    id: 6,
    slug: "hindu-sanskruti-adhar-stambh",
    title: "Hindu Sanskruti Ādhār Stambh",
    theme: "The Three Pillars",
    message:
      "Hindu culture has endured for over five thousand years because it rests on three unshakeable pillars — scripture, sacred space, and the living saint.",
    summary:
      "The final section gathers the exhibition’s message around three pillars: Shastra, Mandir, and Sant — Guru. Shastra, or scripture, is presented as guidance for a life of integrity and purpose. Mandir is described as a centre of peace that steadies the mind, builds character, and serves the community. Sant — Guru introduces the Satpurush as a living guide who has already walked the road. The source connects them through a shared image: scripture gives the map, the mandir makes the destination visible, and the Satpurush guides the journey. This account preserves the exhibition’s specific devotional framing; it is not presented as a definition shared identically by every Hindu tradition.",
    takeaways: [
      "Shastra — Scripture: guidance, discipline, integrity, and purpose.",
      "Mandir: peace, character, and service to the community.",
      "Sant — Guru: the Satpurush as a living guide.",
      "The exhibition connects the three through the image of map, destination, and guide.",
    ],
    reflection:
      "How do learning, sacred space, and living guidance support one another?",
    sourcePages: [1],
    sourceLabel: "Takeaways for gutko, page 1 · Section 6, 6A–6C",
    quotation:
      "Scripture gives the map, the mandir provides the destination, but the Satpurush is the living guide who has already walked the road and shows us how to reach the end",
  },
];
