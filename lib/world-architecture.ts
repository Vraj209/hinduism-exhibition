import { festivals } from "@/content/festivals";

/** Digital storytelling environments, not reconstructions of the physical exhibition. */
export type WorldMood = {
  lampStrength: number;
  bridgeStrength: number;
  shaftStrength: number;
  waterStillness: number;
  ambient: number;
};
export type WorldArchitecture = {
  id: number;
  name: string;
  sky: string;
  horizon: string;
  stone: string;
  ivory: string;
  floor: string;
  accent: string;
  moods: WorldMood[];
  lightColor?: string;
  lightIntensity?: number;
};
export const worldArchitectures: Record<number, WorldArchitecture> = {
  1: {
    id: 1,
    name: "An everyday haveli",
    sky: "#9eada8",
    horizon: "#ceb79a",
    stone: "#70452d",
    ivory: "#9b6842",
    floor: "#e4d4b9",
    accent: "#b49a66",
    lightColor: "#fff1db",
    lightIntensity: 2.25,
    moods: [
      {
        lampStrength: 0.3,
        bridgeStrength: 0,
        shaftStrength: 0,
        waterStillness: 1,
        ambient: 1.15,
      },
      {
        lampStrength: 0.2,
        bridgeStrength: 0,
        shaftStrength: 0,
        waterStillness: 1,
        ambient: 1.02,
      },
      {
        lampStrength: 0.25,
        bridgeStrength: 0,
        shaftStrength: 0,
        waterStillness: 1,
        ambient: 1.23,
      },
    ],
  },
  2: {
    id: 2,
    name: "A courtyard of connection",
    sky: "#7d8584",
    horizon: "#c8aa8a",
    stone: "#bd8a70",
    ivory: "#eadfc9",
    floor: "#8b7362",
    accent: "#aa8453",
    lightColor: "#ffe3bd",
    lightIntensity: 2.4,
    moods: [
      {
        lampStrength: 0.2,
        bridgeStrength: 0,
        shaftStrength: 0,
        waterStillness: 1,
        ambient: 0.9,
      },
      {
        lampStrength: 0.3,
        bridgeStrength: 0,
        shaftStrength: 0,
        waterStillness: 1,
        ambient: 1.15,
      },
      {
        lampStrength: 0.15,
        bridgeStrength: 0,
        shaftStrength: 0,
        waterStillness: 1,
        ambient: 1.4,
      },
    ],
  },
  3: {
    id: 3,
    name: "A contemplative path",
    sky: "#536c75",
    horizon: "#acb8ae",
    stone: "#ded0ba",
    ivory: "#fff7e6",
    floor: "#d5c8ad",
    accent: "#b6a37c",
    lightColor: "#e0ebdf",
    lightIntensity: 1.8,
    moods: [
      {
        lampStrength: 0.1,
        bridgeStrength: 0,
        shaftStrength: 0,
        waterStillness: 1,
        ambient: 1.3,
      },
      {
        lampStrength: 0.2,
        bridgeStrength: 0,
        shaftStrength: 0,
        waterStillness: 1,
        ambient: 1.12,
      },
      {
        lampStrength: 0.15,
        bridgeStrength: 0,
        shaftStrength: 0,
        waterStillness: 1,
        ambient: 1.45,
      },
    ],
  },
  5: {
    id: 5,
    name: "A garden of kindness",
    sky: "#9caf9f",
    horizon: "#d5cab0",
    stone: "#c8b298",
    ivory: "#eae1cf",
    floor: "#73816a",
    accent: "#a68d5e",
    lightColor: "#fff5db",
    lightIntensity: 2.2,
    moods: [
      {
        lampStrength: 0.1,
        bridgeStrength: 0,
        shaftStrength: 0,
        waterStillness: 1,
        ambient: 1.3,
      },
      {
        lampStrength: 0.2,
        bridgeStrength: 0,
        shaftStrength: 0,
        waterStillness: 1,
        ambient: 1.1,
      },
      {
        lampStrength: 0.15,
        bridgeStrength: 0,
        shaftStrength: 0,
        waterStillness: 1,
        ambient: 1.4,
      },
    ],
  },
  6: {
    id: 6,
    name: "A hall of three pillars",
    sky: "#354749",
    horizon: "#8c7461",
    stone: "#bd8a70",
    ivory: "#f0e7d7",
    floor: "#94764d",
    accent: "#bd9a5c",
    lightColor: "#ffe4b5",
    lightIntensity: 2.45,
    moods: [
      {
        lampStrength: 0.2,
        bridgeStrength: 0,
        shaftStrength: 0,
        waterStillness: 1,
        ambient: 1.05,
      },
      {
        lampStrength: 0.25,
        bridgeStrength: 0,
        shaftStrength: 0,
        waterStillness: 1,
        ambient: 1.25,
      },
      {
        lampStrength: 0.15,
        bridgeStrength: 0,
        shaftStrength: 0,
        waterStillness: 1,
        ambient: 1.15,
      },
    ],
  },
  4: {
    id: 4,
    name: "A calendar of celebration",
    sky: "#172934",
    horizon: "#664938",
    stone: "#bd8a70",
    ivory: "#efe5d4",
    floor: "#ba9d7e",
    accent: "#9a7842",
    lightColor: "#ffe6c2",
    lightIntensity: 2.8,
    moods: festivals.map((festival) => ({
      lampStrength: [
        "diwali",
        "holi",
        "swaminarayan-jayanti",
        "janmashtami",
        "maha-shivratri",
      ].includes(festival.id)
        ? 1
        : 0.35,
      bridgeStrength: 0,
      shaftStrength: 0,
      waterStillness: 1,
      ambient: [
        "diwali",
        "holi",
        "swaminarayan-jayanti",
        "janmashtami",
        "maha-shivratri",
      ].includes(festival.id)
        ? 0.82
        : 1.55,
    })),
  },
};
