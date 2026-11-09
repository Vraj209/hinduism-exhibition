/** Exhibition owner's layout; metre conversion is calibrated to the mandir's published 255 ft width.
 * This establishes a consistent camera/landscape scale, not a surveyed exhibition site. */
export const CAMPUS_METERS_PER_UNIT = (255 * 0.3048) / 24.8;
export const CAMPUS_WALKING_SURFACE = 0.02;
export const CAMPUS_EYE_HEIGHT = 1.7 / CAMPUS_METERS_PER_UNIT;
export const CAMPUS_LOOK_LIMIT = 0.48;
export const campusLayout = {
  mandir: [0, 0, -49] as [number, number, number],
  garden: { width: 18, length: 66, centerZ: 0 },
  basin: { width: 4.2, length: 52, centerZ: -3 },
  fountains: [-25, -14, -3, 8, 19],
  sideFountains: [
    { id: "left" as const, x: -6, z: 29, radius: 2.1 },
    { id: "right" as const, x: 6, z: 29, radius: 2.1 },
  ],
  walkwayX: 11.5,
  arrival: { position: [0, CAMPUS_WALKING_SURFACE + CAMPUS_EYE_HEIGHT, 46], target: [0, CAMPUS_WALKING_SURFACE + CAMPUS_EYE_HEIGHT, -49] },
  overhead: { position: [0, 110, -18.9], target: [0, 0, -19] },
};

export type PavilionConfig = {
  id: number;
  position: [number, number, number];
  rotation: number;
  accent: string;
  concept: string;
  motif: string;
  lighting: string;
  signature: string;
};

export const pavilions: PavilionConfig[] = [
  {
    id: 1,
    position: [-18, 0, 18],
    rotation: Math.PI / 2,
    accent: "#9c7450",
    concept: "A domed hall for everyday life",
    motif: "Food, clothing and the language of song carved into a shared stone facade",
    lighting: "Soft morning light",
    signature: "A deep central doorway beneath a segmented dome",
  },
  {
    id: 2,
    position: [-18, 0, -2],
    rotation: Math.PI / 2,
    accent: "#a97060",
    concept: "A domed hall of traditions",
    motif: "Shared thresholds and connected forms in carved stone",
    lighting: "Warm light across the entrance",
    signature: "A deep central doorway beneath a segmented dome",
  },
  {
    id: 3,
    position: [-18, 0, -22],
    rotation: Math.PI / 2,
    accent: "#798b88",
    concept: "A domed hall for contemplation",
    motif: "A continuous path through a portal in original stone relief",
    lighting: "Clear light across carved stone",
    signature: "A deep central doorway beneath a segmented dome",
  },
  {
    id: 4,
    position: [18, 0, -22],
    rotation: -Math.PI / 2,
    accent: "#b18943",
    concept: "A domed hall of celebration",
    motif: "Light and gathering expressed through carved relief",
    lighting: "Warm light around a welcoming court",
    signature: "A deep central doorway beneath a segmented dome",
  },
  {
    id: 5,
    position: [18, 0, -2],
    rotation: -Math.PI / 2,
    accent: "#7e8a62",
    concept: "A domed hall of values",
    motif: "Kindness, responsibility and generosity in carved stone",
    lighting: "Dappled garden light",
    signature: "A deep central doorway beneath a segmented dome",
  },
  {
    id: 6,
    position: [18, 0, 18],
    rotation: -Math.PI / 2,
    accent: "#94774d",
    concept: "A domed hall of the three pillars",
    motif: "Scripture, mandir and the guiding presence in stone relief",
    lighting: "An even, gentle wash of light",
    signature: "A deep central doorway beneath a segmented dome",
  },
];
