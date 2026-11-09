/** Shared, deterministic weather for the entire garden. Scene units are illustrative. */
export const CAMPUS_WIND_DIRECTION = { x: 0.91, z: 0.414 } as const;

export type CampusWind = {
  strength: number;
  gust: number;
  x: number;
  z: number;
};

export type CampusSideFountainId = "left" | "right";
export type CampusFountainSound = {
  id: CampusSideFountainId;
  presence: number;
  pan: number;
  distance: number;
};

export type CampusEnvironmentSample = {
  time: number;
  wind: CampusWind;
  waterPresence: number;
  waterPan: number;
  sideFountains?: CampusFountainSound[];
  foliagePresence?: number;
  /** Nearby visible visitors only; motion is zero when the crowd is still. */
  visitors?: { presence: number; motion: number; pan: number };
  outdoor: number;
};

type SpatialVector = { x: number; y: number; z: number };

export function sampleFoliagePresence(trees: readonly { x: number; z: number }[], listener: SpatialVector) {
  const nearest = trees.reduce((distance, tree) => Math.min(distance, Math.hypot(tree.x - listener.x, tree.z - listener.z, Math.max(0, listener.y - 3))), Infinity);
  return 0.12 + 0.88 / (1 + Math.pow(nearest / 6, 2));
}

/** Independent point sources at the actual basins, relative to the listener. */
export function sampleSideFountainSound(
  sources: readonly { id: CampusSideFountainId; x: number; z: number }[],
  listener: SpatialVector,
  cameraRight: SpatialVector,
  zoom = 1,
): CampusFountainSound[] {
  return sources.map(({ id, x, z }) => {
    const dx = x - listener.x;
    const dy = 0.28 - listener.y;
    const dz = z - listener.z;
    const length = Math.hypot(dx, dy, dz);
    const distance = length / Math.max(0.1, zoom);
    // A broad falloff keeps distant water soft, with detail increasing nearby.
    const presence = 0.04 + 0.96 / (1 + Math.pow(distance / 14, 1.8));
    const azimuth =
      length > 0.001
        ? (dx * cameraRight.x + dy * cameraRight.y + dz * cameraRight.z) / length
        : 0;
    return {
      id,
      presence,
      pan: Math.max(-0.82, Math.min(0.82, azimuth)),
      distance,
    };
  });
}

export function sampleCampusWind(time: number): CampusWind {
  // Long overlapping envelopes make soft gusts, with no abrupt random changes.
  const a = Math.pow((Math.sin(time * 0.23 - 0.7) + 1) / 2, 6);
  const b = Math.pow((Math.sin(time * 0.137 + 1.1) + 1) / 2, 10);
  const gust = Math.min(1, a * 0.72 + b * 0.38);
  const strength = 0.25 + gust * 0.62 + Math.sin(time * 0.49) * 0.025;
  return {
    strength,
    gust,
    x: CAMPUS_WIND_DIRECTION.x * strength,
    z: CAMPUS_WIND_DIRECTION.z * strength,
  };
}
