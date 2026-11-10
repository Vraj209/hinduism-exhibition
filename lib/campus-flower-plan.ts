export type FlowerSpecies = "tulip" | "sunflower" | "marigold" | "rose";
export type FlowerBed = {
  x: number; z: number; radiusX: number; radiusZ: number; bow: number;
  planting: "tulips" | "sunflowers" | "roses" | "marigolds";
};

/** Mirrored envelopes keep the architecture legible; individual plants are seeded.
 * All dimensions use the campus's 3.134 metres per scene unit. */
export const campusFlowerBeds: FlowerBed[] = [-1, 1].flatMap(side => [
  ...[-27, -17, -7, 3, 13, 23].map(z => ({
    x: side * 6, z, radiusX: 1.05, radiusZ: 2.65, bow: 0.3, planting: "tulips" as const,
  })),
  { x: side * 3.8, z: 41.5, radiusX: 1.12, radiusZ: 2.8, bow: 0.32, planting: "tulips" as const },
  // Low flowers frame the near rim of each side fountain without touching it.
  { x: side * 5.8, z: 31.95, radiusX: 1.2, radiusZ: 0.33, bow: 0.08, planting: "marigolds" as const },
  ...[-31.25, 31.9].map(z => ({
    x: side * 7.75, z, radiusX: 0.55, radiusZ: 0.48, bow: 0, planting: "roses" as const,
  })),
  ...[-30.2, -10.2, 9.8, 29.8, 46.5].map(z => ({
    x: side * 17.1, z, radiusX: 0.85, radiusZ: 1.35, bow: 0.2, planting: "sunflowers" as const,
  })),
]);

/** Curved ellipse used by soil, edging, flowers and navigation envelopes. */
export function flowerBedPoint(bed: FlowerBed, u: number, v: number) {
  return {
    x: bed.x + Math.sign(bed.x) * (u * bed.radiusX + bed.bow * (1 - v * v)),
    z: bed.z + v * bed.radiusZ,
  };
}

export const flowerColors = {
  tulip: ["#e591ad", "#bb3443", "#f2ca57", "#fff3df"],
  sunflower: ["#efbd35", "#e9a82b"],
  marigold: ["#ed8c26", "#f3bd34"],
  rose: ["#bd4b64", "#e5a0a0", "#e9cbb5"],
};

export type CampusFlower = {
  bed: number; species: FlowerSpecies; x: number; z: number;
  height: number; width: number; yaw: number; phase: number; openness: number;
  bloom: number; color: string; tone: number;
};

function makeFlowerPlan(): CampusFlower[] {
  let seed = 7259;
  const random = () => ((seed = seed * 16807 % 2147483647) - 1) / 2147483646;
  const flowers: CampusFlower[] = [];
  campusFlowerBeds.forEach((bed, bedIndex) => {
    const plant = (species: FlowerSpecies, u: number, v: number, band: number) => {
      const point = flowerBedPoint(bed, u, v);
      const colors = flowerColors[species];
      flowers.push({ bed: bedIndex, species, ...point,
        height: 0.82 + random() * 0.35, width: 0.85 + random() * 0.3,
        yaw: random() * Math.PI * 2, phase: random() * Math.PI * 2,
        openness: random() < 0.12 ? 0.32 + random() * 0.12 : 0.84 + random() * 0.16,
        bloom: 0.82 + random() * 0.35, color: colors[band % colors.length], tone: random(),
      });
    };
    const species: FlowerSpecies = bed.planting === "tulips" ? "tulip"
      : bed.planting === "sunflowers" ? "sunflower" : bed.planting === "roses" ? "rose" : "marigold";
    // Jittered staggered rows read as drifts of color, never a rigid dot grid.
    const spacing = species === "sunflower" ? 0.29 : species === "rose" ? 0.16 : 0.22;
    const rows = Math.floor(bed.radiusZ * 1.72 / spacing);
    const columns = Math.floor(bed.radiusX * 1.72 / spacing);
    for (let row = 0; row <= rows; row++) for (let col = 0; col <= columns; col++) {
      const u = ((col + (row % 2) * 0.45) / columns - 0.5) * 1.72 + (random() - 0.5) * 0.07;
      const v = (row / rows - 0.5) * 1.72 + (random() - 0.5) * 0.035;
      if (u * u + v * v > 0.74 || random() < 0.07) continue;
      // Sweeping color bands follow the curve; paired beds have matching palettes.
      plant(species, u, v, Math.floor((v + 1) * 2.2));
    }
    if (species === "tulip" || species === "sunflower") {
      const count = species === "tulip" ? 54 : 32;
      for (let i = 0; i < count; i++) {
        const angle = i / count * Math.PI * 2 + (random() - 0.5) * 0.035;
        // Marigolds edge the path-facing side of taller sunflower groups.
        if (species === "sunflower" && Math.cos(angle) > 0) continue;
        plant("marigold", Math.cos(angle) * 0.9, Math.sin(angle) * 0.92, Math.floor(i / 7));
      }
    }
  });
  return flowers;
}

export const campusFlowers = makeFlowerPlan();
