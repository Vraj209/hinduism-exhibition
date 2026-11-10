import photographs from "./hindu-values-photographs.json";

export type HinduValue = {
  id: "daya" | "kshama" | "aadar" | "tyag";
  number: string;
  title: string;
  meaning: string;
  description: string;
  gujarati: string | null;
};

// Original exhibition copy supplied by the owner, not quotations or teachings
// attributed to the person in the photographs. Add Gujarati only from an
// approved exhibition source; no approved Gujarati descriptions were supplied.
export const hinduValues: HinduValue[] = [
  {
    id: "daya", number: "01", title: "Daya", meaning: "Compassion",
    description: "Notice the needs of others and respond with kindness. A caring word, a helping hand, and concern for every living being bring compassion into everyday life.",
    gujarati: null,
  },
  {
    id: "kshama", number: "02", title: "Kshama", meaning: "Forgiveness",
    description: "Let go of resentment and respond to mistakes with patience. Forgiveness encourages understanding, offers another chance, and helps us move forward with peace.",
    gujarati: null,
  },
  {
    id: "aadar", number: "03", title: "Aadar", meaning: "Respect",
    description: "Recognize the dignity of every person. Listen attentively, speak gently, and show gratitude to parents, teachers, elders, and everyone who contributes to our lives.",
    gujarati: null,
  },
  {
    id: "tyag", number: "04", title: "Tyag", meaning: "Selflessness",
    description: "Place service above personal recognition. Share your time, effort, and resources, while letting go of ego and unnecessary wants, to contribute to the wellbeing of others.",
    gujarati: null,
  },
];

export const hinduValuePhotographs = photographs;
