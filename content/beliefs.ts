import { festivalGalleryPhotos } from "./festival-gallery";

export type BeliefId = "aatma" | "karma" | "punarjanma" | "avatar" | "murti" | "moksha";
export type Belief = {
  id: BeliefId;
  number: string;
  title: string;
  english: string;
  gujarati: string;
  accent: string;
  visualDescription: string;
};

/** English from the brief; Gujarati transcribed verbatim from the supplied
 * reference, independently checked. Do not translate or normalize the wording. */
export const beliefs: readonly Belief[] = [
  { id: "aatma", number: "01", title: "Aatma", english: "I am the soul", gujarati: "હું આત્મા છું", accent: "#b96921", visualDescription: "A calm, radiant point of light: an abstract metaphor for the soul." },
  { id: "karma", number: "02", title: "Karma", english: "My choices matter", gujarati: "મારી પસંદગી મહત્વની છે", accent: "#37668e", visualDescription: "Concentric ripples: an abstract metaphor for the effects of our actions." },
  { id: "punarjanma", number: "03", title: "Punarjanma", english: "The soul travels on", gujarati: "આત્માની યાત્રા ચાલુ રહે છે", accent: "#357a78", visualDescription: "A continuous circular path: an abstract metaphor for the soul’s ongoing journey." },
  { id: "avatar", number: "04", title: "Avatar", english: "God comes to guide", gujarati: "ભગવાન માર્ગ બતાવવા પધારે છે", accent: "#a65169", visualDescription: "BAPS devotional artwork depicts Shri Krishna guiding Arjun’s chariot." },
  { id: "murti", number: "05", title: "Murti", english: "God is present here", gujarati: "ભગવાન અહીં પ્રત્યક્ષ છે", accent: "#4f784b", visualDescription: "A decorated Shri Krishna murti at the Janmashtami celebration in Cambridge, Ontario, 2026." },
  { id: "moksha", number: "06", title: "Moksha", english: "Freedom is the goal", gujarati: "મુક્તિ એ જ અંતિમ લક્ષ્ય", accent: "#bb642d", visualDescription: "An open lotus in soft light: an abstract metaphor for freedom." },
];

export const beliefImages = {
  avatar: {
    src: "/beliefs/krishna-guides-arjun.jpg",
    width: 350,
    height: 268,
    alt: "Devotional artwork of Shri Krishna guiding Arjun’s chariot, published by BAPS with its Rath Yatra article.",
    credit: "Devotional artwork via BAPS Swaminarayan Sanstha",
    sourcePageUrl: "https://www.baps.org/Article/2011/Rath-Yatra-2171.aspx",
    sourceImageUrl: "https://www.baps.org/Data/Sites/1/Media/OtherImages/2171/Webimages/krishnarath.jpg",
    permissionBasis: "Verified official artwork used for the local implementation at the user’s explicit request. The prior event-photography permission is not represented as an artwork licence; no independent public reuse licence was established.",
  },
  murti: festivalGalleryPhotos.find((photo) => photo.id === "janmashtami-cambridge-2026-murti")!,
};
