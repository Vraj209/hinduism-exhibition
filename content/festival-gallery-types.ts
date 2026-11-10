export type FestivalPhoto = {
  id: string;
  festivalId: string;
  celebration: string;
  src: string;
  fullSrc: string;
  width: number;
  height: number;
  alt: string;
  sourcePageUrl: string;
  sourceImageUrl: string;
  location: string;
  year: number;
  credit: string;
  permission: { status: "pending" | "approved"; evidence: string | null };
};

export type FestivalEntry = {
  id: string;
  month: string;
  name: string;
  celebrations: readonly string[];
  photos: FestivalPhoto[];
  missing: string[];
};
