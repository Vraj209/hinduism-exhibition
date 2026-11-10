import photographs from "./festival-photographs.json";
import type { FestivalEntry, FestivalPhoto } from "./festival-gallery-types";

/** The reference calendar is authoritative. Unmatched entries retain their place
 * here but never receive a substitute image or an empty tile in the exhibition. */
const calendar = [
  ["new-year-annakut", "Kartak", "New Year – Annakut", ["New Year", "Annakut"]],
  ["chhath-puja", "Kartak", "Chhath Puja", ["Chhath Puja"]],
  ["gita-jayanti", "Magshar", "Gita Jayanti", ["Gita Jayanti"]],
  ["vaikunth-ekadashi", "Magshar", "Vaikunth Ekadashi", ["Vaikunth Ekadashi"]],
  ["uttarayan", "Posh", "Uttarayan", ["Uttarayan"]],
  ["pongal", "Posh", "Pongal", ["Pongal"]],
  ["vasant-panchami", "Maha", "Vasant Panchami", ["Vasant Panchami"]],
  ["maha-shivratri", "Maha", "Maha Shivratri", ["Maha Shivratri"]],
  ["holi", "Fagan", "Holi", ["Holi"]],
  ["fuldol", "Fagan", "Fuldol", ["Fuldol"]],
  ["ram-navami-shri-hari-jayanti", "Chaitra", "Ram Navami – Shri Hari Jayanti", ["Ram Navami", "Shri Hari Jayanti"]],
  ["gudi-padwa-ugadi", "Chaitra", "Gudi Padwa – Ugadi", ["Gudi Padwa", "Ugadi"]],
  ["akshaya-tritiya", "Vaishakh", "Akshaya Tritiya", ["Akshaya Tritiya"]],
  ["nrusinh-jayanti", "Vaishakh", "Nrusinh Jayanti", ["Nrusinh Jayanti"]],
  ["ganga-dussehra", "Jeth", "Ganga Dussehra", ["Ganga Dussehra"]],
  ["vat-savitri", "Jeth", "Vat Savitri", ["Vat Savitri"]],
  ["rath-yatra", "Ashadh", "Rath Yatra", ["Rath Yatra"]],
  ["guru-purnima", "Ashadh", "Guru Purnima", ["Guru Purnima"]],
  ["janmashtami", "Shravan", "Janmashtami", ["Janmashtami"]],
  ["raksha-bandhan", "Shravan", "Raksha Bandhan", ["Raksha Bandhan"]],
  ["ganesh-chaturthi", "Bhadarvo", "Ganesh Chaturthi", ["Ganesh Chaturthi"]],
  ["onam", "Bhadarvo", "Onam", ["Onam"]],
  ["diwali", "Aso", "Diwali", ["Diwali"]],
  ["navratri-dussehra", "Aso", "Navratri – Dussehra", ["Navratri", "Dussehra"]],
] as const;

export const festivalEntries: FestivalEntry[] = calendar.map(([id, month, name, celebrations]) => {
  const photos = (photographs as FestivalPhoto[]).filter((photo) => photo.festivalId === id && photo.permission.status === "approved");
  return { id, month, name, celebrations, photos, missing: celebrations.filter((celebration) => !photos.some((photo) => photo.celebration === celebration)) };
});

export const festivalGalleryEntries = festivalEntries.filter((entry) => entry.photos.length > 0);
export const festivalGalleryPhotos = festivalGalleryEntries.flatMap((entry) => entry.photos);
