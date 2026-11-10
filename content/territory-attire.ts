import type { CulturalState } from "./jivan-shaili";

/** Additional territory content requested separately from the 28-state poster. */
export type TerritoryAttire = {
  id: "IN-JK" | "IN-LA";
  name: string;
  languages: CulturalState["languages"];
  languageSources: { title: string; href: string }[];
  attire: CulturalState["attire"];
  variationNote: string;
  sources: { title: string; href: string }[];
};

export const territoryAttire: TerritoryAttire[] = [
  {
    id: "IN-JK",
    name: "Jammu and Kashmir",
    languages: ["Kashmiri", "Dogri", "Gojri", "Pahari", "Punjabi", "Urdu", "Hindi"].map((name) => ({ name })),
    languageSources: [
      { title: "District Udhampur — Language", href: "https://udhampur.nic.in/language/" },
      { title: "IGNCA — Bhasha Parv: Languages and Dialects of Jammu and Kashmir", href: "https://ignca.gov.in/hi/events/bhasha-parv-multilingual-kavi-sammelan-on-languages-and-dialects-of-jk/" },
    ],
    attire: {
      men: "Woollen pheran & trousers",
      women: "Embroidered pheran & headscarf",
      menGujarati: null,
      womenGujarati: null,
      community: "Kashmiri attire example",
      communityGujarati: null,
      image: {
        src: "/attire/in-jk.webp",
        alt: "Generated illustration of a Kashmiri man in a woollen pheran and trousers and a woman in an embroidered pheran and headscarf, with both full outfits visible.",
        width: 1024,
        height: 1536,
        kind: "generated-illustration",
      },
    },
    variationNote: "This is a Kashmiri attire example. Clothing varies across the regions, communities and occasions of Jammu and Kashmir.",
    sources: [
      { title: "Press Information Bureau — Traditional Kashmiri clothing", href: "https://www.pib.gov.in/newsite/erelcontent.aspx?lang=2&reg=48&relid=116916" },
    ],
  },
  {
    id: "IN-LA",
    name: "Ladakh",
    languages: ["Ladakhi", "Purgi", "Balti", "Shina"].map((name) => ({ name })),
    languageSources: [
      { title: "Administration of Ladakh — Regional Language Courses at GDC Kargil", href: "https://ladakh.gov.in/gdc-kargil-introduces-ability-enhancement-courses-in-regional-languages-of-ladakh/" },
      { title: "India Cine Hub — Ladakh", href: "https://www.indiacinehub.gov.in/location/states-union-territories/ladakh" },
    ],
    attire: {
      men: "Goncha (robe) & waist sash",
      women: "Sulma dress & perak headdress",
      menGujarati: null,
      womenGujarati: null,
      community: "Ladakhi ceremonial attire example",
      communityGujarati: null,
      image: {
        src: "/attire/in-la.webp",
        alt: "Generated illustration of a Ladakhi man in a goncha robe and waist sash and a woman in a sulma dress and turquoise perak headdress, with both full outfits visible.",
        width: 1024,
        height: 1536,
        kind: "generated-illustration",
      },
    },
    variationNote: "This is a Ladakhi ceremonial attire example featuring a perak headdress. Clothing varies across communities and occasions.",
    sources: [
      { title: "Monisha Ahmed / Sahapedia — Ladakhi Dress and Costume", href: "https://www.sahapedia.org/ladakhi-dress-and-costume" },
      { title: "Bowers Museum — Perak Headdresses from Ladakh", href: "https://www.bowers.org/index.php/collection/collections-blog/snakes-and-stones-perak-headdresses-from-ladakh" },
    ],
  },
];

export const territoryGeneratedNote =
  "AI-generated illustration informed by cultural references; not an original photograph or an entry from the supplied Bhusha poster.";
