import { addThematicRelief } from "./pavilion-reliefs";
import {
  box,
  finish,
  type Batch,
  type Palette,
  type WorldBuilt,
} from "./world-geometry";

/** Repeated, physically mounted stone motifs connect each doorway to its world. */
export function addInteriorCarvings(
  world: WorldBuilt,
  palette: Palette,
  sectionId: number,
) {
  const batch: Batch = new Map();
  if (sectionId === 2) {
    // A carved screen beside the circulation route supplies a real stone support.
    box(batch, "gatewayStone", 9, 2.15, -8.4, 3.6, 4.3, 0.35);
    box(batch, "gatewayIvory", 9, 0.18, -8.4, 3.9, 0.3, 0.7);
    box(batch, "gatewayIvory", 9, 4.35, -8.4, 3.9, 0.18, 0.65);
  }
  const placements: Record<
    number,
    [number, number, number, number, number, number?][]
  > = {
    1: [
      [3, 8.05, -8.65, 3.2, 1.35],
      [-4.5, 5.8, 10.45, 0.65, 1.3],
    ],
    2: [
      [9, 2.6, -8.18, 3.1, 2.1],
      [-3.8, 5.8, 10.4, 0.65, 1.3],
    ],
    3: [
      [10.93, 1.25, -11.93, 3, 1.15, -Math.PI / 4],
      [13.2, 3.1, 0.38, 0.55, 1.5],
      [-5.2, 3.1, 0.38, 0.55, 1.5],
    ],
    4: [
      [4, 8.1, -12.75, 2.5, 1.25],
      [-4, 6.2, 10.45, 0.65, 1.3],
    ],
    5: [
      [4, 5.52, -0.35, 2.15, 0.8],
      [-6.3, 3.1, 10.43, 0.65, 1.6],
    ],
    6: [
        [3.5, 6.4, -8.45, 3.2, 1.15],
      [-6, 6.2, 10.45, 0.65, 1.3],
    ],
  };
  for (const [index, [x, y, z, width, height, rotation]] of placements[
    sectionId
  ].entries()) {
    addThematicRelief(batch, sectionId, {
      x,
      y,
      z,
      width,
      height,
      rotation,
      depth: index === 0 ? 0.2 : 0.13,
      variant: index === 0 ? "hero" : "pillar",
      materials: {
        stone: "gatewayStone",
        recess: "gatewayRecess",
        highlight: "gatewayIvory",
      },
    });
  }
  finish(batch, palette, world.group);
}
