/** Shared design positions keep planting, sound and navigation in agreement. */
export const campusFlowerBeds = [-1, 1].flatMap((side) => [
  ...[-27, -17, -7, 3, 13, 23].map((z) => ({ x: side * 6, z })),
  { x: side * 3.8, z: 41.5 },
]);

export { campusTrees, campusGroveBeds } from "./campus-planting";

export const campusBenches = [-1, 1].flatMap((side) => [-12, 8].map((z) => ({ x: side * 14.6, z })));

/** The low stone promenades are rendered from the same dimensions used by walking. */
export const campusPromenades = [
  ...[-3.5, 3.5].map((x) => ({ x, z: -3.5, width: 1.4, depth: 55 })),
  ...[-31, 24].map((z) => ({ x: 0, z, width: 8.4, depth: 1.4 })),
  { x: 0, z: 29.5, width: 2.8, depth: 11 },
  { x: 0, z: -32.5, width: 2.8, depth: 3 },
  ...[-3.3, 3.3].map((x) => ({ x, z: 27.7, width: 1.1, depth: 7.4 })),
  { x: 0, z: 31.3, width: 7.7, depth: 1.1 },
];

export const CAMPUS_PROMENADE_SURFACE = 0.06;

/** A central stone ramp clears each approved stair tread; the side stairs remain.
 * Coordinates are in pavilion-local space, with its entrance facing positive Z. */
export const pavilionRamp = {
  width: 1.25,
  front: 5.8625,
  landingFront: 3.8,
  back: 3.3,
  bottom: 0.055,
  top: 0.88,
};

export function pavilionRampSurface(z: number) {
  return z <= pavilionRamp.landingFront
    ? pavilionRamp.top
    : pavilionRamp.top - (z - pavilionRamp.landingFront) * 0.4;
}
