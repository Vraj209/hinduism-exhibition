import * as THREE from "three";
import {
  put,
  box,
  cyl,
  torus,
  finish,
  column,
  arch,
  cornice,
  dome,
  lattice,
  storyStage,
  type Batch,
  type Palette,
  type WorldBuilt,
} from "./world-geometry";
/** An original garden setting for the source's values, continuity, and kindness. */
export function makeGarden(palette: Palette): WorldBuilt {
  const group = new THREE.Group();
  const batch: Batch = new Map();
  const gardenColors: Record<string, string> = {
    gardenGrass: "#8c9971",
    gardenSoil: "#7f735c",
    gardenTrunk: "#6e604c",
    gardenLeaves: "#70845a",
    gardenLeavesDark: "#4f6d48",
    gardenLeavesLight: "#91a477",
    gardenLeavesOlive: "#7b8955",
    weatheredStone: "#987b63",
  };
  for (const [name, color] of Object.entries(gardenColors)) {
    palette[name] = new THREE.MeshStandardMaterial({ color, roughness: 0.94 });
  }
  box(batch, "gardenGrass", 1, -0.23, -1, 40, 0.4, 42);
  box(batch, "floor", 1, -0.06, -1, 29, 0.15, 31);
  // The path and pavilion floor share the same level, with no entrance stair.
  box(batch, "ivory", 4, 0.023, 2, 4.8, 0.065, 24);
  for (const x of [1.65, 6.35])
    box(batch, "rose", x, 0.058, 2, 0.07, 0.012, 24);
  for (let z = -9; z <= 13; z += 1.7)
    box(batch, "joint", 4, 0.06, z, 4.6, 0.008, 0.018);
  for (const x of [-5.1, 10.7]) {
    for (const z of [-5.5, 3.3]) {
      box(batch, "rose", x, 0.03, z, 4.8, 0.08, 6.5);
      box(batch, "gardenSoil", x, 0.065, z, 4.65, 0.04, 6.35);
      box(batch, "gardenGrass", x, 0.085, z, 4.55, 0.04, 6.25);
    }
  }
  // An open octagonal pavilion is reached along the continuous garden path.
  const cx = 4,
    cz = -5,
    radius = 3.85,
    height = 5.2;
  cyl(batch, "pale", cx, 0.018, cz, 4.55, 0.07, 8);
  torus(batch, "rose", cx, 0.061, cz, 4.2, 0.025, 32);
  for (let i = 0; i < 8; i++) {
    const a = ((i + 0.5) / 8) * Math.PI * 2;
    column(
      batch,
      cx + Math.cos(a) * radius,
      cz + Math.sin(a) * radius,
      height,
      0.06,
      0.91,
    );
    const mid = a + Math.PI / 8;
    const inner = radius * Math.cos(Math.PI / 8);
    const rot = -mid - Math.PI / 2;
    arch(
      batch,
      cx + Math.cos(mid) * inner,
      cz + Math.sin(mid) * inner,
      2.82,
      height,
      0.06,
      rot,
    );
    if (Math.sin(mid) < -0.2) {
      lattice(
        batch,
        cx + Math.cos(mid) * inner,
        cz + Math.sin(mid) * inner,
        2.35,
        1.2,
        0.55,
        rot,
      );
    }
  }
  cyl(batch, "rose", cx, 5.43, cz, 4.25, 0.24, 8);
  cyl(batch, "ivory", cx, 5.63, cz, 4.42, 0.16, 8);
  cyl(batch, "rose", cx, 5.8, cz, 4.5, 0.18, 8);
  dome(batch, cx, 5.98, cz, 3.25, 1.75);
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * Math.PI * 2;
    box(
      batch,
      "pale",
      cx + Math.cos(a) * 4.05,
      5.26,
      cz + Math.sin(a) * 4.05,
      0.18,
      0.23,
      0.18,
      -a,
    );
  }
  // A low shaded colonnade marks the garden edge without closing the sky.
  for (const x of [-10, -6.6, -3.2, 0.2])
    column(batch, x, -11.8, 4.4, 0.06, 0.85);
  for (const x of [-8.3, -4.9, -1.5]) arch(batch, x, -11.8, 3.3, 4.4, 0.06);
  cornice(batch, -4.9, -12.2, 11.4, 2.5, 4.62);
  box(batch, "rose", -4.9, 0.5, -12.8, 11.4, 0.95, 0.35);
  box(batch, "ivory", -4.9, 1.03, -12.8, 11.65, 0.13, 0.48);
  for (const x of [-8.4, -3.3]) {
    box(batch, "rose", x, 0.3, -10.7, 2.6, 0.6, 0.75);
    box(batch, "ivory", x, 0.65, -10.7, 2.85, 0.14, 0.95);
    box(batch, "rose", x, 1.1, -11.05, 2.65, 0.8, 0.15);
  }
  let seed = 83;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const leaves = [
    "gardenLeaves",
    "gardenLeavesDark",
    "gardenLeavesLight",
    "gardenLeavesOlive",
  ];
  function tree(x: number, z: number, scale: number) {
    cyl(
      batch,
      "gardenTrunk",
      x,
      1.5 * scale,
      z,
      0.13 * scale,
      3 * scale,
      7,
      0.075 * scale,
    );
    for (let j = 0; j < 3; j++) {
      const a = (j / 3) * Math.PI * 2 + rand() * 0.5;
      const from = new THREE.Vector3(x, 1.5 * scale, z);
      const to = new THREE.Vector3(
        x + Math.cos(a) * scale * 1.1,
        (2.7 + rand() * 0.5) * scale,
        z + Math.sin(a) * scale * 1.1,
      );
      const direction = to.clone().sub(from);
      const branch = new THREE.CylinderGeometry(
        0.04 * scale,
        0.095 * scale,
        direction.length(),
        6,
      );
      branch.applyQuaternion(
        new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          direction.clone().normalize(),
        ),
      );
      const center = from.add(to).multiplyScalar(0.5);
      put(batch, "gardenTrunk", branch, center.x, center.y, center.z);
    }
    for (let j = 0; j < 24; j++) {
      const a = j * 2.39996 + rand() * 0.7;
      const elevation = Math.acos(1 - (2 * (j + 0.5)) / 24);
      const radius = (0.9 + rand() * 0.55) * scale;
      const geo = new THREE.IcosahedronGeometry(
        (0.29 + rand() * 0.2) * scale,
        1,
      );
      geo.scale(1.2 + rand() * 0.45, 0.7 + rand() * 0.3, 0.9 + rand() * 0.25);
      put(
        batch,
        leaves[j % 4],
        geo,
        x + Math.cos(a) * Math.sin(elevation) * radius,
        3.2 * scale + Math.cos(elevation) * scale,
        z + Math.sin(a) * Math.sin(elevation) * radius,
      );
    }
  }
  for (const [x, z, scale] of [
    [-10, 3, 1.45],
    [-9, -5, 1.2],
    [-11, -15, 1.25],
    [-4, -16, 1.15],
    [4, -17, 1.1],
    [11, -14, 1.3],
    [12, -6, 1.3],
    [10.3, 2.5, 1.25],
    [11, 7, 0.85],
    [-8.5, 9, 0.95],
    [9, -1, 0.75],
  ])
    tree(x, z, scale);
  cyl(batch, "gardenSoil", 9, 0.055, -1, 0.65, 0.08, 18);
  cyl(batch, "gardenGrass", 9, 0.1, -1, 0.61, 0.025, 18);
  // Low shrub clusters soften the beds while leaving every path open.
  for (const x of [-6.3, -3.9, 9.5, 11.9])
    for (const z of [-7.6, -3.5, 1.2, 5.4]) {
      for (let j = 0; j < 3; j++) {
        const geo = new THREE.IcosahedronGeometry(0.4 + rand() * 0.12, 0);
        geo.scale(1.1, 0.7, 1);
        put(
          batch,
          leaves[j % 4],
          geo,
          x + (j - 1) * 0.32,
          0.38 + rand() * 0.07,
          z,
        );
      }
    }
  // The near-left column provides depth without a gate across the open path.
  column(batch, -6.3, 10, 7.5, 0.06, 1.3);
  cornice(batch, -6.3, 10, 2.2, 2.2, 7.75);
  finish(batch, palette, group);
  const welcome: Batch = new Map();
  // A flush stone inlay leads continuously through the open pavilion.
  box(welcome, "pale", 4, 0.07, 1.4, 1.45, 0.018, 17.5);
  for (const x of [3.25, 4.75])
    box(welcome, "gold", x, 0.081, 1.4, 0.035, 0.008, 17.5);
  const continuity: Batch = new Map();
  // The same abstract geometry crosses two surfaces; there is no inscription.
  box(continuity, "rose", 4, 0.22, 0.8, 5.7, 0.44, 1.25);
  box(continuity, "weatheredStone", 2.65, 1.25, 0.8, 2.65, 1.8, 0.42);
  box(continuity, "ivory", 5.35, 1.25, 0.8, 2.65, 1.8, 0.42);
  box(continuity, "pale", 4, 2.2, 0.8, 5.8, 0.13, 0.6);
  for (let row = 0; row < 3; row++)
    for (let col = 0; col < 12; col++) {
      const diamond = new THREE.TorusGeometry(0.22, 0.028, 4, 4);
      diamond.rotateZ(Math.PI / 4);
      put(
        continuity,
        col < 6 ? "rose" : "gold",
        diamond,
        1.55 + col * 0.445,
        0.64 + row * 0.5,
        1.04,
      );
    }
  const kindness: Batch = new Map();
  // An empty seat beside the shared path: no people or invented act is depicted.
  box(kindness, "rose", 2.5, 0.35, 1.1, 0.38, 0.7, 0.9);
  box(kindness, "rose", 5.5, 0.35, 1.1, 0.38, 0.7, 0.9);
  box(kindness, "ivory", 4, 0.78, 1.1, 4.1, 0.24, 1.25);
  box(kindness, "rose", 4, 1.35, 0.55, 4, 0.95, 0.18);
  box(kindness, "pale", 4, 1.87, 0.55, 4.2, 0.1, 0.28);
  for (const x of [2.05, 5.95]) {
    box(kindness, "rose", x, 1.16, 1.05, 0.18, 0.65, 1.15);
    box(kindness, "pale", x, 1.53, 1.05, 0.3, 0.12, 1.25);
  }
  lattice(kindness, 4, 0.68, 3.5, 0.55, 1.02);
  // A shared water tray is an editorial image of hospitality, not a ritual claim.
  box(kindness, "rose", 7, 0.6, 1.3, 1.8, 0.18, 1.2);
  for (const x of [6.45, 7, 7.55])
    cyl(kindness, "ivory", x, 0.92, 1.3, 0.16, 0.4, 16);
  return {
    group,
    flames: [],
    bridgeFlames: [],
    storyStages: [
      storyStage(welcome, palette),
      storyStage(continuity, palette),
      storyStage(kindness, palette),
    ],
  };
}
