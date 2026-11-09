import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { makeCampusPennant } from "./campus-pennant";

type Palette = Record<string, THREE.MeshStandardMaterial>;
type Stone = "pale" | "ivory" | "pathLine" | "gold" | "wood";

/** Photo-referenced exterior reconstruction, NOT surveyed or authorized geometry.
 * References and unresolved dimensions: docs/design/robbinsville-mandir-reference.md.
 * Front faces +Z; no pavilion ID is attached: the landmark is not an exhibition. */
export function makeRobbinsvilleMandir(palette?: Palette): THREE.Group {
  const group = new THREE.Group();
  group.name = "Robbinsville Akshardham — photo-based reconstruction";
  group.userData = {
    landmark: "Robbinsville Akshardham Mahamandir",
    reconstruction: "photo-based",
    exactGeometry: false,
    reference: "https://usa.akshardham.org/explore",
  };
  const materials =
    palette ??
    Object.fromEntries(
      Object.entries({
        pale: "#f5f1e8",
        ivory: "#ded9cc",
        pathLine: "#b8ad98",
        gold: "#ae8540",
        wood: "#4c4235",
      }).map(([key, color]) => [
        key,
        new THREE.MeshStandardMaterial({
          color,
          roughness: 0.86,
          metalness: key === "gold" ? 0.35 : 0,
        }),
      ]),
    );
  const batches = new Map<Stone, THREE.BufferGeometry[]>();
  const add = (
    stone: Stone,
    geometry: THREE.BufferGeometry,
    x = 0,
    y = 0,
    z = 0,
    angle = 0,
  ) => {
    geometry.rotateY(angle).translate(x, y, z);
    const pieces = batches.get(stone) ?? [];
    pieces.push(geometry);
    batches.set(stone, pieces);
  };
  const box = (
    stone: Stone,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    angle = 0,
  ) => add(stone, new THREE.BoxGeometry(w, h, d), x, y, z, angle);
  const cylinder = (
    stone: Stone,
    x: number,
    y: number,
    z: number,
    radius: number,
    height: number,
    top = radius,
    sides = 16,
  ) =>
    add(stone, new THREE.CylinderGeometry(top, radius, height, sides), x, y, z);
  const ring = (
    stone: Stone,
    x: number,
    y: number,
    z: number,
    radius: number,
    thickness: number,
  ) => {
    const geometry = new THREE.TorusGeometry(radius, thickness, 4, 24);
    geometry.rotateX(Math.PI / 2);
    add(stone, geometry, x, y, z);
  };
  const lathe = (
    stone: Stone,
    x: number,
    y: number,
    z: number,
    profile: [number, number][],
    sides = 16,
  ) =>
    add(
      stone,
      new THREE.LatheGeometry(
        profile.map(([r, h]) => new THREE.Vector2(r, h)),
        sides,
      ),
      x,
      y,
      z,
    );

  // Overall width:length:height follows the official 255:345:191 dimensions.
  // Stretch the building plan by extending/re-spacing architectural bays, never
  // scaling columns, carvings or the circular cross-sections of the shikhars.
  // Keep the entrance stair tip fixed so it meets the exhibition's garden court.
  const width = 24.8;
  const stairTip = 12.525;
  const rear = stairTip - (width * 345) / 255;
  const baseFront = 8.4;
  const baseDepth = baseFront - rear;
  const baseCenter = (baseFront + rear) / 2;
  const extension = baseDepth - 16.8;
  const rearOffset = extension;
  const chamberCenter = -0.8 - extension / 2;

  // Broad, articulated limestone base and horizontal mouldings visible in the
  // official frontal photograph; scene units are illustrative, not feet/metres.
  box("ivory", 0, 0.19, baseCenter, width, 0.38, baseDepth);
  box("pale", 0, 0.48, baseCenter, 24.2, 0.2, baseDepth - 0.6);
  box("ivory", 0, 1.35, baseCenter, 23.6, 1.54, baseDepth - 1.2);
  for (const y of [0.7, 1.95, 2.17, 2.36])
    box("pale", 0, y, baseCenter, 24.1, 0.14, baseDepth - 0.7);

  // Pilastered plinth, with shallow niches rather than invented deity carvings.
  for (const side of [-1, 1]) {
    for (let x = -10.8; x <= 10.8; x += 1.2) {
      if (side === 1 && Math.abs(x) < 4.5) continue;
      const endOffset = side === 1 ? 0 : -rearOffset;
      box("pathLine", x, 1.26, side * 7.83 + endOffset, 0.64, 0.79, 0.04);
      box("pale", x - 0.43, 1.28, side * 7.94 + endOffset, 0.16, 1.02, 0.22);
      box("pale", x + 0.43, 1.28, side * 7.94 + endOffset, 0.16, 1.02, 0.22);
      box("pale", x, 1.8, side * 7.94 + endOffset, 0.99, 0.13, 0.22);
    }
    for (let z = -6.8 - rearOffset; z <= 6.8; z += 1.15) {
      box("pathLine", side * 11.83, 1.26, z, 0.04, 0.79, 0.64);
      box("pale", side * 11.94, 1.28, z, 0.22, 1.02, 0.17);
    }
  }

  // Main chamber is kept behind the projecting pillared entrance porch.
  box("ivory", 0, 4.42, chamberCenter, 19.7, 4.02, 12.1 + extension);
  for (const y of [2.7, 3.05, 5.55, 5.9, 6.23, 6.48]) {
    box("pale", 0, y, chamberCenter, 20.25, 0.17, 12.55 + extension);
    box("ivory", 0, y + 0.1, chamberCenter, 20.6, 0.08, 12.8 + extension);
  }

  const column = (
    x: number,
    z: number,
    base = 2.45,
    height = 3.4,
    radius = 0.24,
  ) => {
    box("ivory", x, base + 0.12, z, radius * 3.4, 0.24, radius * 3.4);
    lathe(
      "pale",
      x,
      base,
      z,
      [
        [radius * 1.5, 0.22],
        [radius * 1.5, 0.36],
        [radius * 1.12, 0.48],
        [radius, 0.68],
        [radius * 0.87, height - 0.72],
        [radius * 1.1, height - 0.56],
        [radius * 1.48, height - 0.36],
        [radius * 1.7, height - 0.16],
      ],
      12,
    );
    for (let y = 0.85; y < height - 0.6; y += 0.38)
      ring("ivory", x, base + y, z, radius * 1.03, 0.045);
    box("pale", x, base + height - 0.08, z, radius * 3.8, 0.16, radius * 3.8);
  };

  // Layered facade bays: a rhythmic relief impression at campus viewing distance.
  for (const side of [-1, 1]) {
    for (let x = -9; x <= 9; x += 1.5) {
      if (side === 1 && Math.abs(x) < 3.1) continue;
      column(x, side === 1 ? 5.4 : -7 - rearOffset, 2.45, 3.45, 0.19);
    }
    for (let z = -5.7 - rearOffset; z <= 4.9; z += 1.5)
      column(side * 10.05, z, 2.45, 3.45, 0.19);
  }

  // Dark recessed central portal, open portico and broad, single axial stair.
  box("wood", 0, 4.02, 5.27, 2.5, 3.1, 0.07);
  box("ivory", 0, 2.5, 6.5, 7.2, 0.18, 3.5);
  for (const x of [-3, -1.15, 1.15, 3]) column(x, 7.6, 2.55, 3.6, 0.27);
  for (const x of [-3, 3]) column(x, 6, 2.55, 3.6, 0.25);
  box("pale", 0, 6.19, 6.4, 7.3, 0.28, 3.7);
  box("ivory", 0, 6.4, 6.4, 7.7, 0.14, 4);
  for (let i = 0; i < 15; i++) {
    const h = (i + 1) * 0.17;
    box(i % 2 ? "pale" : "ivory", 0, h / 2, 12.35 - i * 0.3, 7.2, h, 0.34);
    // Stair cheeks rise with the individual treads, leaving the approach clear.
    for (const side of [-1, 1])
      box(
        "pale",
        side * 3.92,
        h / 2 + 0.12,
        12.35 - i * 0.3,
        0.5,
        h + 0.24,
        0.35,
      );
  }
  for (const side of [-1, 1]) {
    box("ivory", side * 5.3, 1.16, 8.55, 2.4, 2.32, 2.2);
    box("pale", side * 5.3, 2.42, 8.55, 2.65, 0.2, 2.4);
    for (let x = 4.2; x <= 6.4; x += 0.34)
      column(side * x, 9.5, 2.52, 0.66, 0.07);
    box("pale", side * 5.3, 3.19, 9.5, 2.6, 0.1, 0.22);
  }

  const finial = (
    x: number,
    y: number,
    z: number,
    size: number,
    flag = true,
  ) => {
    lathe(
      "gold",
      x,
      y,
      z,
      [
        [0.2 * size, 0],
        [0.27 * size, 0.13 * size],
        [0.18 * size, 0.29 * size],
        [0.05 * size, 0.46 * size],
        [0, 0.62 * size],
      ],
      12,
    );
    if (flag) {
      cylinder("gold", x, y + 0.96 * size, z, 0.022 * size, 0.95 * size);
      // Plain pale pennant: no unverified sacred emblem is invented.
      const pennant = makeCampusPennant(size, materials.pale);
      pennant.position.set(x, y + 1.26 * size, z);
      group.add(pennant);
    }
  };

  const shikhar = (
    x: number,
    z: number,
    base: number,
    radius: number,
    height: number,
    principal = false,
  ) => {
    // Curved Nagara silhouette, with many horizontal stone courses and
    // clustered miniature spires. The main shikhar dominates the roofscape.
    const steps = principal ? 25 : 15;
    const radiusAt = (t: number) =>
      radius * (0.23 + 0.77 * Math.pow(1 - t, 1.55));
    cylinder("pale", x, base - 0.22, z, radius * 1.14, 0.32, radius * 1.14, 12);
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const h = height / steps;
      const r = radiusAt(t);
      cylinder(
        i % 3 === 0 ? "ivory" : "pale",
        x,
        base + h * (i + 0.5),
        z,
        r,
        h,
        radiusAt((i + 1) / steps),
        12,
      );
      cylinder(
        "ivory",
        x,
        base + h * i,
        z,
        r + radius * 0.035,
        h * 0.12,
        r + radius * 0.035,
        12,
      );
      // Raised stone ribs make the shikhar read as carved masonry, not a cone.
      for (let j = 0; j < 12; j++) {
        const a = (j * Math.PI) / 6;
        box(
          "pale",
          x + Math.sin(a) * r,
          base + h * (i + 0.48),
          z + Math.cos(a) * r,
          radius * 0.1,
          h * 0.77,
          radius * 0.075,
          a,
        );
      }
    }
    ring("pale", x, base + height + 0.04, z, radius * 0.3, radius * 0.08);
    cylinder(
      "ivory",
      x,
      base + height + 0.16,
      z,
      radius * 0.31,
      0.16,
      radius * 0.25,
      16,
    );
    finial(x, base + height + 0.25, z, principal ? 1 : 0.55);
    if (principal) {
      for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
        for (let i = 0; i < 3; i++) {
          const y = base + i * height * 0.19;
          const r = radiusAt(i * 0.19) * 0.96;
          const sx = x + Math.sin(a) * r;
          const sz = z + Math.cos(a) * r;
          lathe(
            "pale",
            sx,
            y,
            sz,
            [
              [radius * 0.19, 0],
              [radius * 0.21, 0.23],
              [radius * 0.15, 0.7],
              [radius * 0.07, 1.12],
              [0.04, 1.28],
            ],
            8,
          );
          ring("ivory", sx, y + 0.27, sz, radius * 0.2, 0.05);
        }
      }
    }
  };

  const samaran = (
    x: number,
    z: number,
    base: number,
    radius: number,
    height: number,
  ) => {
    for (let i = 0; i < 8; i++) {
      const t = i / 8;
      const r = radius * (1 - t * 0.9);
      const y = base + (i * height) / 8;
      cylinder("pale", x, y + height / 16, z, r, height / 8, r * 0.84, 8);
      cylinder("ivory", x, y, z, r * 1.08, 0.09, r * 1.08, 8);
      for (let j = 0; j < 8; j++) {
        const a = (j * Math.PI) / 4;
        const ornament = new THREE.SphereGeometry(radius * 0.055, 5, 4);
        ornament.scale(1, 1.45, 1);
        add(
          "pale",
          ornament,
          x + Math.sin(a) * r * 0.85,
          y + 0.15,
          z + Math.cos(a) * r * 0.85,
        );
      }
    }
    finial(x, base + height, z, 0.45, false);
  };

  // 1 principal + 8 subordinate shikhars. Counts are officially documented;
  // these placements and relative dimensions are inferred from photographs.
  const towers = [
    [-8.1, 4.1, 1.2, 3.05],
    [8.1, 4.1, 1.2, 3.05],
    [-4.65, 2.75, 1.28, 3.8],
    [4.65, 2.75, 1.28, 3.8],
    [-8.1, -4.4 - rearOffset, 1.32, 3.55],
    [8.1, -4.4 - rearOffset, 1.32, 3.55],
    [-4.5, -4.9 - rearOffset, 1.35, 4.2],
    [4.5, -4.9 - rearOffset, 1.35, 4.2],
  ];
  for (const [x, z, r, h] of towers) {
    cylinder("ivory", x, 4.35, z, r * 1.27, 3.8, r * 1.27, 12);
    for (const y of [2.7, 3, 4, 5.35, 5.65, 6.1, 6.45])
      cylinder("pale", x, y, z, r * 1.4, 0.15, r * 1.4, 12);
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI) / 5;
      column(
        x + Math.sin(a) * r * 1.27,
        z + Math.cos(a) * r * 1.27,
        3.1,
        2.1,
        0.12,
      );
    }
    shikhar(x, z, 6.65, r, h);
  }

  // Main upper drum is horizontally layered, beneath the tall central shikhar.
  const mainTowerZ = -1.8 - extension / 2;
  cylinder("ivory", 0, 7, mainTowerZ, 3.3, 1.65, 3.3, 12);
  for (const y of [6.45, 6.8, 7.4, 7.75])
    cylinder("pale", 0, y, mainTowerZ, 3.6, 0.17, 3.6, 12);
  shikhar(0, mainTowerZ, 7.9, 3.05, (width * 191) / 255 - 9.585, true);

  // Nine lower pyramidal roofs; the elliptical interior dome cannot be verified
  // externally and is deliberately not represented as an invented bulbous roof.
  for (const [x, z, r, h, y] of [
    [0, 6.4, 3.7, 2.65, 6.5],
    [0, 0.3, 3.2, 2.85, 7],
    [0, -6.1 - rearOffset, 2.1, 2.3, 6.5],
    [-7.3, -0.2 - extension / 2, 2.6, 2.75, 6.5],
    [7.3, -0.2 - extension / 2, 2.6, 2.75, 6.5],
    [-9.3, 6, 1.65, 1.65, 6.15],
    [9.3, 6, 1.65, 1.65, 6.15],
    [-4.9, 6.2, 1.45, 1.85, 6.3],
    [4.9, 6.2, 1.45, 1.85, 6.3],
  ])
    samaran(x, z, y, r, h);

  // Geometric floral frieze, kept separate from unverified figurative carvings.
  for (let x = -10.5; x <= 10.5; x += 0.52) {
    if (Math.abs(x) < 3.5) continue;
    for (const y of [3.35, 5.2]) {
      const rosette = new THREE.TorusGeometry(0.12, 0.035, 4, 8);
      add("pale", rosette, x, y, 5.59);
    }
  }

  for (const [stone, pieces] of batches) {
    const normalized = pieces.map((piece) =>
      piece.index ? piece.toNonIndexed() : piece,
    );
    const geometry = mergeGeometries(normalized);
    for (const piece of new Set([...pieces, ...normalized])) piece.dispose();
    if (!geometry) continue;
    geometry.computeBoundingSphere();
    const mesh = new THREE.Mesh(geometry, materials[stone]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = `Robbinsville reconstruction — ${stone}`;
    group.add(mesh);
  }
  return group;
}
