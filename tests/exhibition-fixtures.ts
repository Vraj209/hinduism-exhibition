// Independent expected copy and source destinations; do not import app content.
export const sectionTitles = [
  "Hindu Jivan Shaili",
  "Hindu Riti/Parampara",
  "Hindu Manyata",
  "Hindu Festivals",
  "Hindu Mulyo",
  "Hindu Sanskruti Ādhār Stambh",
];
export const sectionSlugs = [
  "hindu-jivan-shaili",
  "hindu-riti-parampara",
  "hindu-manyata",
  "hindu-festivals",
  "hindu-mulyo",
  "hindu-sanskruti-adhar-stambh",
];
// Transcribed from the supplied one-page brief, not the application module.
export const sectionQuotations = [
  "The way we live — what we eat, what we wear, what language we sing in — is itself a form of worship.",
  "Every ritual is a reminder — of our duties, our relationships, and our connection to something greater.",
  "Hinduism offers one of the world’s most detailed maps of the atma’s (soul’s) journey.",
  "Every Hindu festival is a celebration of a cosmic victory — light over darkness, truth over ego, love over separation.",
  "These are not Hindu values alone. They are human values — rooted in an ancient tradition, alive in every act of kindness today.",
  "Scripture gives the map, the mandir provides the destination, but the Satpurush is the living guide who has already walked the road and shows us how to reach the end",
];
export const expectedFestivals = [
  ["diwali", "Diwali", "Diwali.aspx"],
  ["annakut", "Annakut", "NutanVarsh/NewYearAnnakut.aspx"],
  ["holi", "Holi", "Holi.aspx"],
  [
    "nutan-varsh",
    "Gujarati New Year · Nutan Varsh",
    "NutanVarsh/NewYearAnnakut.aspx",
  ],
  ["pushpadolotsav", "Pushpadolotsav · Fuldol", "Fuldol.aspx"],
  ["ram-navami", "Ram Navami", "RamNavami.aspx"],
  [
    "swaminarayan-jayanti",
    "Swaminarayan Jayanti · Hari Jayanti",
    "HariJayanti.aspx",
  ],
  ["janmashtami", "Janmashtami", "Janmashtami.aspx"],
  ["maha-shivratri", "Maha Shivratri", "MahaShivratri.aspx"],
  ["raksha-bandhan", "Raksha Bandhan", "RakshaBandhan.aspx"],
  ["guru-purnima", "Guru Purnima", "GuruPurnima.aspx"],
  ["rath-yatra", "Rath Yatra", "RathYatra.aspx"],
  ["makar-sankranti", "Makar Sankranti · Uttarayan", "Uttarayan.aspx"],
  ["navratri", "Navratri", "Navratri.aspx"],
].map(([id, name, sourcePath]) => ({
  id,
  name,
  sourceUrl: `https://www.baps.org/cultureandheritage/Traditions/AnnualCelebrationsandFestivals/${sourcePath}`,
}));

export const expectedMomentTitles = [
  ["Food and everyday life", "What we wear", "The language of song"],
  [
    "Remembering our duties",
    "Remembering our relationships",
    "A connection to something greater",
  ],
  ["Atma — the soul", "The atma’s journey", "A map for reflection"],
  expectedFestivals.map((festival) => festival.name),
  ["Human values", "Rooted in tradition", "An act of kindness"],
  ["Shastra — Scripture", "Mandir", "Sant — Guru"],
];

export function expectedStorySource(sectionIndex: number, storyIndex: number) {
  return sectionIndex === 3
    ? expectedFestivals[storyIndex].sourceUrl
    : "/exhibition-source.pdf#page=1";
}
