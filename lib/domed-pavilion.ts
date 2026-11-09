import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { addThematicRelief } from "./pavilion-reliefs";

type Palette = Record<string, THREE.MeshStandardMaterial>;
type Batch = Map<string, THREE.BufferGeometry[]>;

/** A shared original exhibition pavilion. Its façade vocabulary is informed by
 * verified Akshardham exhibition-hall photographs, not the main mandir's shikhars. */
function deposit(
  batch: Batch,
  name: string,
  geometry: THREE.BufferGeometry,
  x = 0,
  y = 0,
  z = 0,
  rotation = 0,
) {
  geometry.rotateY(rotation).translate(x, y, z);
  const pieces = batch.get(name) ?? [];
  pieces.push(geometry);
  batch.set(name, pieces);
}

function block(
  batch: Batch,
  material: string,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
  rotation = 0,
) {
  deposit(batch, material, new THREE.BoxGeometry(w, h, d), x, y, z, rotation);
}

function cylinder(
  batch: Batch,
  material: string,
  x: number,
  y: number,
  z: number,
  radius: number,
  height: number,
  sides = 24,
  top = radius,
) {
  deposit(
    batch,
    material,
    new THREE.CylinderGeometry(top, radius, height, sides),
    x,
    y,
    z,
  );
}

function lathe(
  batch: Batch,
  material: string,
  x: number,
  y: number,
  z: number,
  profile: [number, number][],
  sides = 32,
) {
  deposit(
    batch,
    material,
    new THREE.LatheGeometry(
      profile.map(([r, h]) => new THREE.Vector2(r, h)),
      sides,
    ),
    x,
    y,
    z,
  );
}

function ring(
  batch: Batch,
  material: string,
  x: number,
  y: number,
  z: number,
  radius: number,
  tube: number,
  sides = 32,
) {
  const geo = new THREE.TorusGeometry(radius, tube, 6, sides);
  geo.rotateX(Math.PI / 2);
  deposit(batch, material, geo, x, y, z);
}


function finish(batch: Batch, palette: Palette, parent: THREE.Group, id = 0) {
  for (const [key, geometries] of batch) {
    const normalized = geometries.map((geometry) =>
      geometry.index ? geometry.toNonIndexed() : geometry,
    );
    const merged = mergeGeometries(normalized);
    normalized.forEach((geometry) => geometry.dispose());
    geometries.forEach((geometry) => geometry.dispose());
    if (!merged) continue;
    const mesh = new THREE.Mesh(merged, palette[key]);
    mesh.castShadow = key !== "water";
    mesh.receiveShadow = true;
    mesh.userData.pavilionId = id;
    parent.add(mesh);
  }
}


function petalGeometry(length: number, width: number, depth: number) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.quadraticCurveTo(-width, length * 0.48, 0, length);
  shape.quadraticCurveTo(width, length * 0.48, 0, 0);
  return new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 3, steps: 1 });
}


function rosette(batch: Batch, material: string, x: number, y: number, z: number, radius: number, rotation = 0) {
  const group = new THREE.Matrix4().makeRotationY(rotation);
  group.setPosition(x, y, z);
  for (let i = 0; i < 6; i++) {
    const petal = petalGeometry(radius, radius * 0.34, 0.025);
    petal.rotateZ(i * Math.PI / 3).applyMatrix4(group);
    deposit(batch, material, petal);
  }
  const center = new THREE.SphereGeometry(radius * 0.22, 6, 3);
  center.scale(1, 1, 0.4).applyMatrix4(group);
  deposit(batch, material, center);
}


function lotusCeiling(batch: Batch, x: number, y: number, z: number, radius: number, material = "ivory") {
  for (let band = 0; band < 3; band++) {
    const r = radius * (1 - band * 0.24);
    ring(batch, material, x, y - band * 0.08, z, r, 0.045, 20);
    for (let i = 0; i < 12; i++) {
      const angle = i * Math.PI / 6;
      const petal = petalGeometry(r * 0.4, r * 0.1, 0.04);
      petal.rotateX(Math.PI / 2).rotateY(-angle).translate(Math.sin(angle) * r * 0.52, -band * 0.08, Math.cos(angle) * r * 0.52);
      deposit(batch, material, petal, x, y, z);
    }
  }
  lathe(batch, material, x, y - 0.42, z, [[0.03, 0], [0.14, 0.15], [0.24, 0.27], [0.3, 0.36]], 12);
}


function pillar(batch: Batch, x: number, z: number, height = 3.3, y = 0.85, scale = 1, material = "ivory", thematicFront = false) {
  const trim = material === "wood" ? "woodLight" : "pale";
  const base = material === "wood" ? "wood" : "rose";
  for (const [w, h, at] of [[0.66, 0.12, 0.06], [0.56, 0.1, 0.17], [0.48, 0.12, 0.28]])
    block(batch, base, x, y + at, z, w * scale, h, w * scale);
  const profile: [number, number][] = [
    [0.25, 0.32], [0.27, 0.39], [0.21, 0.46], [0.2, 0.55],
    [0.17, 0.66], [0.16, height * 0.48], [0.21, height * 0.49],
    [0.21, height * 0.54], [0.16, height * 0.55], [0.16, height - 0.75],
    [0.21, height - 0.66], [0.25, height - 0.57], [0.29, height - 0.46],
    [0.31, height - 0.36], [0.27, height - 0.26],
  ].map(([r, h]) => [r * scale, h]);
  lathe(batch, material, x, y, z, profile, 8);
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    cylinder(batch, trim, x + Math.cos(a) * 0.16 * scale, y + height * 0.3, z + Math.sin(a) * 0.16 * scale, 0.018 * scale, height * 0.3, 4);
    const petal = petalGeometry(0.34, 0.085 * scale, 0.035);
    petal.rotateX(-0.4).translate(0, height - 0.67, 0.23 * scale).rotateY(a);
    deposit(batch, trim, petal, x, y, z);
  }
  // Paired curved struts, a characteristic weight-bearing transition under the chhajja.
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2;
    const bracket = new THREE.Shape();
    bracket.moveTo(0.16, 0); bracket.lineTo(0.66 * scale, 0);
    bracket.lineTo(0.66 * scale, -0.1); bracket.quadraticCurveTo(0.37 * scale, -0.12, 0.22 * scale, -0.58);
    bracket.lineTo(0.14, -0.58); bracket.closePath();
    const geometry = new THREE.ExtrudeGeometry(bracket, {depth: 0.13 * scale, bevelEnabled: false, curveSegments: 5});
    geometry.translate(0, height - 0.12, -0.065 * scale);
    deposit(batch, material, geometry, x, y, z, a);
    const scroll = new THREE.TorusGeometry(0.075 * scale, 0.025, 4, 8);
    scroll.translate(0.32 * scale, height - 0.31, 0.075 * scale);
    deposit(batch, trim, scroll, x, y, z, a);
  }
  block(batch, material, x, y + height - 0.05, z, 0.72 * scale, 0.1, 0.72 * scale);
  for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
    if (thematicFront && a === 0) continue;
    rosette(batch, trim, x + Math.sin(a) * 0.17 * scale, y + height * 0.52, z + Math.cos(a) * 0.17 * scale, 0.12 * scale, a);
  }
}


function arch(
  batch: Batch,
  x: number,
  z: number,
  width: number,
  height: number,
  y = 0.85,
  rotation = 0,
  material = "ivory",
) {
  const outer = new THREE.Shape();
  const half = width / 2;
  const spring = height - half * 1.05;
  outer.moveTo(-half - 0.13, spring - 0.15);
  outer.lineTo(-half - 0.13, height + 0.22);
  outer.lineTo(half + 0.13, height + 0.22);
  outer.lineTo(half + 0.13, spring - 0.15);
  outer.lineTo(half, spring - 0.15);
  for (let i = 0; i <= 24; i++) {
    const angle = (i / 24) * Math.PI;
    const scallop = 0.065 * Math.sin(angle * 9);
    outer.lineTo(
      Math.cos(angle) * (half - scallop),
      spring + Math.sin(angle) * half * 1.05 - scallop,
    );
  }
  outer.lineTo(-half, spring - 0.15);
  outer.closePath();
  const geometry = new THREE.ExtrudeGeometry(outer, {
    depth: 0.25,
    bevelEnabled: true,
    bevelSegments: 1,
    steps: 1,
    bevelSize: 0.025,
    bevelThickness: 0.025,
    curveSegments: 6,
  });
  geometry.translate(0, 0, -0.125);
  deposit(batch, material, geometry, x, y, z, rotation);
  const curve: THREE.Vector3[] = [];
  for (let i = 0; i <= 36; i++) {
    const a = (i / 36) * Math.PI;
    const scallop = 0.065 * Math.sin(a * 9);
    curve.push(
      new THREE.Vector3(
        Math.cos(a) * (half - scallop),
        spring + Math.sin(a) * half * 1.05 - scallop,
        0.17,
      ),
    );
  }
  deposit(
    batch,
    material === "wood" ? "woodLight" : "rose",
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(curve),
      24,
      0.045,
      4,
      false,
    ),
    x,
    y,
    z,
    rotation,
  );
}


function frieze(batch: Batch, width: number, depth: number, y: number, x = 0, z = 0, material = "rose") {
  const trim = material === "wood" ? "woodLight" : "ivory";
  // Deeply staggered drip courses and a carved fascia create shadows at campus scale.
  for (const [grow, h, at] of [[0, 0.12, -0.12], [0.14, 0.12, 0], [0.32, 0.09, 0.11], [0.52, 0.09, 0.2], [0.64, 0.07, 0.28], [0.42, 0.08, 0.355]])
    block(batch, material, x, y + at, z, width + grow, h, depth + grow);
  for (const side of [-1, 1]) {
    const count = Math.floor(width / 0.34);
    for (let i = 0; i <= count; i++) {
      const px = x + (i / count - 0.5) * width;
      block(batch, trim, px, y - 0.2, z + side * depth / 2, 0.12, 0.22, 0.2);
      if (i % 3 === 0) rosette(batch, trim, px, y + 0.05, z + side * (depth / 2 + 0.08), 0.09, side < 0 ? Math.PI : 0);
    }
    const countZ = Math.floor(depth / 0.34);
    for (let i = 0; i <= countZ; i++) {
      const pz = z + (i / countZ - 0.5) * depth;
      block(batch, trim, x + side * width / 2, y - 0.2, pz, 0.2, 0.22, 0.12);
    }
  }
}


function stair(
  batch: Batch,
  x: number,
  z: number,
  width: number,
  rotation = 0,
) {
  for (let i = 0; i < 5; i++) {
    const zz = z + (2.1 - i * 0.4) * Math.cos(rotation);
    const xx = x + (2.1 - i * 0.4) * Math.sin(rotation);
    block(
      batch,
      i % 2 ? "pale" : "ivory",
      xx,
      0.1 + i * 0.16,
      zz,
      width,
      0.18,
      0.55,
      rotation,
    );
  }
}

function mouldedPlinth(batch: Batch) {
  // A broad, stepped stone base supports the mass of a wall enclosure.
  for (const [w, d, y, h] of [
    [8.5, 7.3, 0.08, 0.16], [8.3, 7.1, 0.22, 0.12],
    [8.05, 6.85, 0.34, 0.12], [7.85, 6.65, 0.5, 0.2],
    [8.0, 6.8, 0.64, 0.08], [8.18, 6.98, 0.73, 0.1],
    [8.05, 6.85, 0.82, 0.08],
  ]) block(batch, "rose", 0, y, 0, w, h, d);
  for (const side of [-1, 1]) {
    for (let x = -3.6; x < 3.8; x += 0.48)
      block(batch, "roseDark", x, 0.5, side * 3.335, 0.32, 0.12, 0.025);
    for (let z = -3; z <= 3; z += 0.48)
      block(batch, "roseDark", side * 3.935, 0.5, z, 0.025, 0.12, 0.32);
  }
  stair(batch, 0, 3.05, 2.8);
  // Solid side cheeks make the broad approach stair part of the plinth.
  for (const x of [-1.55, 1.55]) for (let i = 0; i < 5; i++)
    block(batch, "rose", x, 0.12 + i * 0.16, 5.15 - i * 0.4, 0.24, 0.24, 0.53);
}

function reliefFrame(batch: Batch, x: number, y: number, z: number, width: number, height: number, rotation = 0, compact = false) {
  const local: Batch = new Map();
  const offset = compact ? 0.04 : 0.1, trim = compact ? 0.07 : 0.13;
  block(local, "roseDark", 0, 0, -0.04, width + 0.1, height + 0.1, 0.08);
  for (const side of [-1, 1]) {
    block(local, "rose", side * (width / 2 + offset), 0, 0.04, trim, height + offset * 2 + trim, 0.2);
    block(local, "ivory", side * (width / 2 + 0.015), 0, 0.09, 0.025, height + 0.06, 0.1);
    block(local, "rose", 0, side * (height / 2 + offset), 0.04, width + offset * 2 + trim, trim, 0.2);
    block(local, "ivory", 0, side * (height / 2 + 0.015), 0.09, width + 0.06, 0.025, 0.1);
  }
  for (const [material, pieces] of local) for (const piece of pieces)
    deposit(batch, material, piece, x, y, z, rotation);
}

function roundSegmentedDome(batch: Batch) {
  // Repeated round domes are an original unifying exhibition-campus choice.
  // Their roof profile is deliberately distinct from the main mandir's shikhars.
  const base = 6.45, radius = 2.9, height = 2.65;
  lathe(batch, "rose", 0, 6.03, 0, [[2.95, 0], [3.03, 0.1], [3.03, 0.2], [2.88, 0.29], [2.88, 0.42]], 48);
  ring(batch, "ivory", 0, 6.12, 0, 2.98, 0.035, 48);
  const profile: [number, number][] = [];
  for (let i = 0; i <= 18; i++) {
    const a = i / 18 * Math.PI / 2;
    profile.push([radius * Math.cos(a), height * Math.sin(a)]);
  }
  lathe(batch, "rose", 0, base, 0, profile, 48);
  for (let rib = 0; rib < 24; rib++) {
    const a = rib / 24 * Math.PI * 2;
    const points: THREE.Vector3[] = [];
    for (let step = 0; step <= 14; step++) {
      const v = step / 14 * Math.PI / 2, r = radius * Math.cos(v) + 0.025;
      points.push(new THREE.Vector3(Math.sin(a) * r, base + height * Math.sin(v), Math.cos(a) * r));
    }
    deposit(batch, "ivory", new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 14, 0.045, 4, false));
    const petal = petalGeometry(0.38, 0.14, 0.04);
    petal.rotateX(-0.45).translate(0, 0.03, radius - 0.03).rotateY(a);
    deposit(batch, "pale", petal, 0, base, 0);
  }
  // A shallow crown and small finial avoid competing with the dome silhouette.
  lathe(batch, "ivory", 0, 9.08, 0, [[0.3, 0], [0.36, 0.08], [0.29, 0.17], [0.15, 0.25]], 24);
  lathe(batch, "gold", 0, 9.3, 0, [[0.12, 0], [0.16, 0.1], [0.1, 0.22], [0.11, 0.29], [0.03, 0.44], [0, 0.57]], 16);
  lotusCeiling(batch, 0, 5.69, 0, 2.25);
}

export function makeDomedPavilion(id: number, palette: Palette) {
  const group = new THREE.Group();
  const batch: Batch = new Map();
  const materials = { stone: "rose", recess: "roseDark", highlight: "ivory" };
  mouldedPlinth(batch);
  // Real thick walls, with a central passage on the front and rear axes.
  for (const side of [-1, 1]) {
    for (const x of [-2.3, 2.3]) block(batch, "rose", x, 3.35, side * 2.7, 2.4, 5, 0.45);
    block(batch, "rose", 0, 5.15, side * 2.7, 2.2, 1.4, 0.45);
    block(batch, "rose", side * 3.28, 3.35, 0, 0.44, 5, 5.4);
    for (const x of [-1.1, 1.1]) block(batch, "roseDark", x, 2.64, side * 2.3, 0.16, 3.55, 1.1);
  }
  // Horizontal stone courses and closely spaced piers follow the verified exhibition facade.
  for (let y = 1.3; y < 5.7; y += 0.64) for (const side of [-1, 1]) {
    for (const x of [-2.3, 2.3]) block(batch, "pale", x, y, side * 2.935, 2.4, 0.022, 0.025);
    block(batch, "pale", side * 3.515, y, 0, 0.025, 0.022, 5.4);
  }
  for (const x of [-3.5, -1.2, 1.2, 3.5]) pillar(batch, x, 3.12, 4.8, 0.85, x === -3.5 || x === 3.5 ? 0.8 : 0.9, "ivory", Math.abs(x) === 1.2);
  for (const x of [-3.5, 3.5]) for (const z of [-2.7, -1.55, 1.55])
    pillar(batch, x, z, 4.8, 0.85, 0.58);
  arch(batch, 0, 3.13, 2.25, 3.6, 0.85);
  arch(batch, 0, -2.95, 2.1, 3.6, 0.85);
  // Concentric portal mouldings lead into a genuine dark, open doorway.
  for (const x of [-1.05, 1.05]) {
    block(batch, "ivory", x, 2.6, 3.15, 0.1, 3.5, 0.22);
    block(batch, "rose", x, 2.6, 2.6, 0.1, 3.5, 0.14);
  }
  for (const [x, motif] of [[-2.35, 1], [2.35, 2]] as const) {
    reliefFrame(batch, x, 2.65, 2.99, 1.8, 1.65);
    addThematicRelief(batch, id, {x, y:2.65, z:3.005, width:1.8, height:1.65, depth:0.17, variant:"panel", motif, materials});
  }
  reliefFrame(batch, 0, 5.21, 3.08, 2.4, 0.92, 0, true);
  addThematicRelief(batch, id, {x:0,y:5.21,z:3.1,width:2.4,height:0.92,depth:0.19,variant:"hero",motif:0,materials});
  // The same subject continues around the side walls, smaller than the front storytelling panel.
  for (const side of [-1, 1]) for (const z of [0]) {
    const rotation = side * Math.PI / 2;
    reliefFrame(batch, side * 3.54, 2.65, z, 2.4, 1.65, rotation);
    addThematicRelief(batch,id,{x:side*3.55,y:2.65,z,width:2.4,height:1.65,depth:0.1,rotation,variant:"panel",motif:side<0?1:2,materials});
  }
  for (const x of [-2.35, 2.35]) addThematicRelief(batch,id,{x,y:1.08,z:3.04,width:1.8,height:0.3,depth:0.065,variant:"band",materials});
  frieze(batch, 7.45, 6.15, 5.78);
  block(batch, "rose", 0, 6.1, 0, 7.9, 0.1, 6.6);
  roundSegmentedDome(batch);
  // Tangential relief segments form a thematic belt around the whole dome drum.
  for (let segment = 0; segment < 8; segment++) {
    const angle = segment * Math.PI / 4;
    addThematicRelief(batch,id,{
      x:Math.sin(angle)*2.94,y:6.3,z:Math.cos(angle)*2.94,
      width:1.05,height:0.24,depth:0.045,rotation:angle,
      variant:"band",motif:(segment%3) as 0|1|2,materials,
    });
  }
  for (const [x,motif] of [[-1.2,1],[1.2,2]] as const)
    addThematicRelief(batch,id,{x,y:3.3,z:3.295,width:0.28,height:0.42,depth:0.065,variant:"pillar",motif,materials});
  finish(batch, palette, group, id);
  return group;
}
