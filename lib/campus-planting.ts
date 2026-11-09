import { pavilions } from "./campus";

export type CampusTree = {
  x: number;
  z: number;
  scale: number;
  cypress: boolean;
  form: "spreading" | "rounded" | "upright" | "cypress";
  zone: "boundary" | "grove" | "walk" | "entrance" | "mandir";
  pavilionId?: number;
  yaw: number;
  girth: number;
  tone: number;
};

/** Design planting, in scene units. The fountain axis and all six east/west
 * entrance corridors stay open. Seeded variation keeps navigation and rendering
 * on exactly the same plan, including on smaller devices. */
function plantingPlan() {
  const trees: CampusTree[] = [];
  let seed = 1867;
  const random = () => ((seed = seed * 16807 % 2147483647) - 1) / 2147483646;
  function plant(x: number, z: number, scale: number, zone: CampusTree["zone"], form?: CampusTree["form"], pavilionId?: number) {
    if (trees.some(tree => Math.hypot(x - tree.x, z - tree.z) < 1.8)) return;
    const shape = form ?? (["rounded", "spreading", "upright"] as const)[Math.floor(random() * 3)];
    trees.push({ x, z, scale, zone, form: shape, cypress: shape === "cypress", pavilionId,
      yaw: random() * Math.PI * 2, girth: 0.8 + random() * 0.4, tone: random() });
  }
  for (const side of [-1, 1]) {
    // The regular rhythm follows the walks, with clear gaps at every doorway.
    for (const z of [-32, -12, 8, 28]) {
      plant(side * 15.25, z, 1.4 + random() * 0.12, "walk", "spreading");
      plant(side * 18, z, 1.12 + random() * 0.22, "grove", "rounded");
    }
    for (const pavilion of pavilions.filter(p => Math.sign(p.position[0]) === side)) {
      const z = pavilion.position[2];
      for (const [x, dz, scale] of [[24.8, -2.3, 1.35], [24.9, 2.4, 1.38], [21, -7.2, 1.28], [20.8, 7.1, 1.42]])
        plant(side * x, z + dz, scale + random() * 0.12, "grove", x > 24 ? "upright" : "rounded", pavilion.id);
    }
    // Keep the mandir forecourt and its full facade free; these flank its sides.
    for (let i = 0; i < 7; i++)
      plant(side * (17.4 + (i % 2) * 3.5), -40.5 - i * 4.25,
        1.45 + random() * 0.45, "mandir", i % 3 === 0 ? "cypress" : "rounded");
    // Paired islands leave a broad arrival court and both outer walks clear.
    for (const z of [38.5, 48.5]) {
      plant(side * 18, z, 1.65, "entrance", "spreading");
      plant(side * 20.1, z + 1.1, 1.12, "entrance", "upright");
    }
    // Staggered, loosely interlocking crowns form a sheltered outer edge.
    for (let i = 0; i < 27; i++) {
      plant(side * (26.5 + random() * 0.45), -67 + i * 4.5 + random() * 0.9,
        1.35 + random() * 0.4, "boundary", i % 6 === 2 ? "cypress" : "rounded");
    }
  }
  // This rear screen is entirely behind the mandir's rear plinth (Z ~= -70).
  for (let i = 0; i < 13; i++)
    plant(-24 + i * 4, -73.3 + random() * 0.5, 1.45 + random() * 0.4, "boundary");
  return trees;
}

export const campusTrees = plantingPlan();

/** Low, organic understory islands; the same envelopes exclude walking taps. */
export const campusGroveBeds = [
  ...pavilions.flatMap(p => [-1, 1].map(side => ({
    x: Math.sign(p.position[0]) * 21, z: p.position[2] + side * 7.2,
    radiusX: 1.65, radiusZ: 1.25,
  }))),
  ...[-1, 1].flatMap(side => [38.5, 48.5].map(z => ({
    x: side * 18.7, z: z + 0.35, radiusX: 2.75, radiusZ: 2.05,
  }))),
  ...[-1, 1].flatMap(side => [-44.75, -61.75].map(z => ({
    x: side * 20.9, z, radiusX: 2.1, radiusZ: 1.8,
  }))),
];
