import { attireImages } from "./attire-images";

/**
 * Dome 1 content, transcribed from the supplied 28-entry Bhusha poster.
 * State names and English garment labels are readable in that source. Gujarati
 * garment captions and the original individual photographs were not supplied at
 * a usable resolution. The user subsequently requested generated attire images;
 * these are explicitly labelled illustrations, not original photographs.
 * Regional languages and varieties come from the user's subsequent 28-state
 * table, with its supplied references retained below. The lists are not exhaustive.
 * See docs/design/jivan-shaili-content.md for the source audit and open gaps.
 */
export type CulturalState = {
  id: `IN-${string}`;
  posterNumber: number;
  name: string;
  nameGujarati: string;
  languages: { name: string; nativeName?: string }[];
  attire: {
    men: string;
    women: string;
    menGujarati: string | null;
    womenGujarati: string | null;
    community: string | null;
    communityGujarati: string | null;
    image: {
      src: string;
      alt: string;
      width: number;
      height: number;
      kind: "generated-illustration" | "source-photograph";
    } | null;
  };
  sourceNote: string;
};

type PosterEntry = [
  id: CulturalState["id"],
  name: string,
  nameGujarati: string,
  men: string,
  women: string,
  community?: string,
];

const posterEntries: PosterEntry[] = [
  ["IN-AP", "Andhra Pradesh", "આંધ્ર પ્રદેશ", "Pancha, Kurta & Kanduva", "Pattu (Silk) Saree"],
  ["IN-AR", "Arunachal Pradesh", "અરુણાચલ પ્રદેશ", "Galuk (Jacket) & Cane Hat", "Gale (Wrap Skirt) & Bead Necklaces", "Adi community"],
  ["IN-AS", "Assam", "આસામ", "Dhoti, Kurta & Gamosa", "Mekhela Chador (Muga Silk)"],
  ["IN-BR", "Bihar", "બિહાર", "Dhoti, Kurta & Mithila Paag", "Bhagalpuri Silk Saree"],
  ["IN-CG", "Chhattisgarh", "છત્તીસગઢ", "Dhoti, Kurta & Pagdi", "Lugda (Kachhora Style) & Polkha"],
  ["IN-GA", "Goa", "ગોવા", "Shirt & Kashti", "Kunbi Saree"],
  ["IN-GJ", "Gujarat", "ગુજરાત", "Kediyu, Chorno & Pagdi", "Chaniya Choli & Odhni"],
  ["IN-HR", "Haryana", "હરિયાણા", "Dhoti, Kurta & Pagri", "Daaman, Kurti & Chunder"],
  ["IN-HP", "Himachal Pradesh", "હિમાચલ પ્રદેશ", "Chola & Kullu Topi", "Pattu (Woollen Wrap) & Dhatu", "Kullu"],
  ["IN-JH", "Jharkhand", "ઝારખંડ", "Dhoti & Gamchha", "Santhali Phuta Saree", "Santhal community"],
  ["IN-KA", "Karnataka", "કર્ણાટક", "Panche, Shalya & Mysore Peta", "Mysore Silk Saree"],
  ["IN-KL", "Kerala", "કેરળ", "Kasavu Mundu & Melmundu", "Mundum Neriyathum"],
  ["IN-MP", "Madhya Pradesh", "મધ્ય પ્રદેશ", "Dhoti, Bandi & Safa", "Maheshwari Saree"],
  ["IN-MH", "Maharashtra", "મહારાષ્ટ્ર", "Dhoti, Kurta & Pheta", "Nauvari Saree & Nath"],
  ["IN-MN", "Manipur", "મણિપુર", "Pheijom, Kurta & Koyet", "Phanek & Inaphi", "Meitei community"],
  ["IN-ML", "Meghalaya", "મેઘાલય", "Jymphong & Turban", "Jainsem & Tapmoh", "Khasi community"],
  ["IN-MZ", "Mizoram", "મિઝોરમ", "Thangchhuah Kawr & Puan", "Puanchei & Kawrchei", "Mizo community"],
  ["IN-NL", "Nagaland", "નાગાલેન્ડ", "Cowrie Kilt & Lohe Shawl", "Pfemhou Skirt & Loramhoushu Shawl", "Angami community"],
  ["IN-OD", "Odisha", "ઓડિશા", "Dhoti, Kurta & Gamuchha", "Sambalpuri Saree"],
  ["IN-PB", "Punjab", "પંજાબ", "Kurta, Tehmat & Pagg", "Salwar Kameez & Phulkari"],
  ["IN-RJ", "Rajasthan", "રાજસ્થાન", "Angarkha, Dhoti & Safa", "Ghagra, Kanchli & Odhni"],
  ["IN-SK", "Sikkim", "સિક્કિમ", "Bakhu (Kho) & Boots", "Bakhu & Pangden", "Bhutia community"],
  ["IN-TN", "Tamil Nadu", "તમિલનાડુ", "Veshti & Angavastram", "Kanchipuram Silk Saree"],
  ["IN-TS", "Telangana", "તેલંગાણા", "Pancha, Kurta & Kanduva", "Pochampally Ikat Saree"],
  ["IN-TR", "Tripura", "ત્રિપુરા", "Rikutu & Kamchwlwi Borok", "Rignai, Risa & Rikutu", "Tripuri community"],
  ["IN-UP", "Uttar Pradesh", "ઉત્તર પ્રદેશ", "Chikankari Kurta & Churidar", "Banarasi Silk Saree"],
  ["IN-UK", "Uttarakhand", "ઉત્તરાખંડ", "Kurta, Churidar & Pahadi Topi", "Ghagra, Pichhaura & Nath", "Kumaon"],
  ["IN-WB", "West Bengal", "પશ્ચિમ બંગાળ", "Dhoti & Panjabi", "Laal Paar Saree"],
];

// Preserve the supplied names and order; these are not official-language lists.
const languagesByState: Record<CulturalState["id"], string[]> = {
  "IN-AP": ["Telugu"],
  "IN-AR": ["Nyishi", "Adi", "Galo", "Apatani", "Monpa"],
  "IN-AS": ["Assamese", "Bodo", "Bengali", "Mising", "Karbi"],
  "IN-BR": ["Maithili", "Bhojpuri", "Magahi", "Angika", "Hindi", "Urdu"],
  "IN-CG": ["Chhattisgarhi", "Hindi", "Gondi", "Halbi"],
  "IN-GA": ["Konkani", "Marathi"],
  "IN-GJ": ["Gujarati", "Kutchi"],
  "IN-HR": ["Haryanvi", "Hindi", "Punjabi"],
  "IN-HP": ["Kangri", "Mandeali", "Kullui", "Kinnauri", "Hindi"],
  "IN-JH": ["Khortha", "Nagpuri", "Santali", "Mundari", "Ho", "Kurukh", "Hindi"],
  "IN-KA": ["Kannada", "Tulu", "Kodava", "Konkani"],
  "IN-KL": ["Malayalam"],
  "IN-MP": ["Hindi", "Malvi", "Bundeli", "Bagheli", "Nimadi", "Gondi", "Bhili"],
  "IN-MH": ["Marathi", "Konkani"],
  "IN-MN": ["Meitei (Manipuri)", "Tangkhul", "Thadou", "Paite", "Hmar"],
  "IN-ML": ["Khasi", "Garo", "Pnar (Jaintia)"],
  "IN-MZ": ["Mizo", "Lai", "Mara", "Hmar", "Chakma"],
  "IN-NL": ["Ao", "Angami", "Sumi", "Lotha", "Konyak", "Other Naga languages"],
  "IN-OD": ["Odia", "Sambalpuri", "Kui", "Santali"],
  "IN-PB": ["Punjabi"],
  "IN-RJ": ["Marwari", "Mewari", "Dhundhari", "Other Rajasthani varieties", "Hindi"],
  "IN-SK": ["Nepali", "Sikkimese (Bhutia)", "Lepcha", "Limbu"],
  "IN-TN": ["Tamil"],
  "IN-TS": ["Telugu", "Urdu"],
  "IN-TR": ["Bengali", "Kokborok"],
  "IN-UP": ["Hindi", "Urdu", "Awadhi", "Bhojpuri", "Braj", "Bundeli"],
  "IN-UK": ["Garhwali", "Kumaoni", "Jaunsari", "Hindi"],
  "IN-WB": ["Bengali", "Nepali", "Santali", "Rajbanshi"],
};

// References supplied with the language table; tracking parameters omitted.
export const languageReferences = [
  { state: "Arunachal Pradesh", title: "Department of Cultural Affairs — Philology", href: "https://research.arunachal.gov.in/?page_id=184" },
  { state: "Bihar", title: "Census of India — Linguistic Survey of India: Bihar", href: "https://censusindia.gov.in/nada/index.php/catalog/45247/download/48954/LSI_BIHAR.pdf" },
  { state: "Himachal Pradesh", title: "Linguistic Survey of India: Himachal Pradesh", href: "https://ruralindiaonline.org/library/resource/linguistic-survey-of-india---himachal-pradesh" },
  { state: "Jharkhand", title: "Linguistic Survey of India: Jharkhand", href: "https://wagtail.ruralindiaonline.org/en/library/resource/linguistic-survey-of-india--jharkhand/" },
  { state: "Meghalaya", title: "Government of Meghalaya — About Meghalaya", href: "https://www.megipr.gov.in/about-meghalaya.html" },
  { state: "Nagaland", title: "DIPR Nagaland — Notification of 19 local languages", href: "https://ipr.nagaland.gov.in/NAGALAND-NOTIFIES-19-LOCAL-LANGUAGES-FOR-ENGAGEMENT-OF-GRAMIN-DAK-SEVAKS" },
  { state: "Rajasthan", title: "Census of India — Population by mother tongue, Rajasthan, 2011", href: "https://censusindia.gov.in/nada/index.php/catalog/10220" },
  { state: "Sikkim", title: "Sikkim Tourism — About Sikkim", href: "https://www.sikkimtourism.gov.in/about/sikkim" },
];

export const culturalStates: CulturalState[] = posterEntries.map(
  ([id, name, nameGujarati, men, women, community], index) => ({
    id,
    posterNumber: index + 1,
    name,
    nameGujarati,
    languages: languagesByState[id].map((language) => ({ name: language })),
    attire: {
      men,
      women,
      menGujarati: null,
      womenGujarati: null,
      community: community ?? null,
      communityGujarati: null,
      image: attireImages[id] ?? null,
    },
    sourceNote: `Supplied Bhusha poster · Entry ${index + 1}`,
  }),
);

export const attireVariationNote =
  "These are examples of traditional dress from the exhibition poster. Clothing varies across regions, communities and occasions within each state.";

export const languageSourceNote =
  "Languages vary across regions and communities. This list is not exhaustive.";

export const attireImageNote =
  "The original individual attire photograph is awaiting supply. The poster’s small images have not been enlarged.";

export const jivanShailiCopy = {
  bhojan: {
    title: "Bhojan",
    kicker: "Food",
    introduction:
      "What we eat is part of how we live. The exhibition places food alongside clothing and song as an everyday expression of devotion.",
    points: [
      "Daily life and worship are connected.",
      "Familiar practices invite us to notice devotion in the everyday.",
    ],
    sourceLabel: "Takeaways for gutko · Page 1 · Section 1",
  },
  bhajan: {
    title: "Bhajan",
    kicker: "Devotional singing",
    introduction:
      "The language in which we sing is one of the exhibition’s expressions of everyday worship. Together with food and clothing, song reminds us that the way we live can itself be a form of devotion.",
    points: [],
    sourceLabel: "Takeaways for gutko · Page 1 · Section 1",
  },
};
