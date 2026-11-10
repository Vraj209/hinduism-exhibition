import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { campusLayout, pavilions } from "./campus";
import { makeCampusVegetation } from "./campus-vegetation";
import { makeCampusWater } from "./campus-water";
import { makeCampusSideFountains } from "./campus-side-fountains";
import { campusPromenades, CAMPUS_PROMENADE_SURFACE, pavilionRamp } from "./campus-obstacles";

type Palette = Record<string, THREE.MeshStandardMaterial>;
type Batch = Map<string, THREE.BufferGeometry[]>;

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

/** Original exhibition site, not the physical Robbinsville grounds.
 * Human-scale furnishings use 3.134032258 metres per scene unit, calibrated from
 * the mandir's 24.8-unit width and published 255-foot width. Path tops are y=.02.
 * These are design dimensions, not surveyed landscape measurements. */
export function makeCampusLandscape(
  palette: Palette,
  options: { mobile?: boolean } = {},
) {
  const batch: Batch = new Map();
  const group = new THREE.Group();
  group.name = "Exhibition fountain garden and continuous walks";
  block(batch, "ground", 0, -0.16, -8, 58, 0.2, 136);
  block(batch, "grass", 0, -0.06, -7, 56, 0.12, 136);
  // The walks meet across both ends. No circulation crosses the basin.
  for (const x of [-campusLayout.walkwayX, campusLayout.walkwayX]) {
    block(batch, "path", x, -0.04, 1, 4, 0.12, 72);
    for (const edge of [-1, 1])
      block(batch, "ivory", x + edge * 1.97, 0.025, 1, 0.09, 0.05, 72);
    for (let z = -34; z <= 37; z += 2)
      block(batch, "pathLine", x, 0.022, z, 3.8, 0.004, 0.018);
  }
  for (const z of [-34, 35]) block(batch, "path", 0, -0.04, z, 27, 0.12, 4);
  block(batch, "plaza", 0, -0.04, -39, 28, 0.12, 10);
  // The standing camera remains over paving, with visible slab joints supplying
  // foreground depth. The axial route stays clear between the paired beds.
  block(batch, "path", 0, -0.04, 41.5, 46, 0.12, 27);
  for (let x = -22.4; x <= 22.4; x += 0.4)
    block(batch, "pathLine", x, 0.022, 41.5, 0.004, 0.003, 26.8);
  for (let z = 28.4; z <= 54.6; z += 0.4)
    block(batch, "pathLine", 0, 0.022, z, 45.8, 0.003, 0.004);
  for (const x of [-22.9, 22.9])
    block(batch, "ivory", x, 0.025, 41.5, 0.2, 0.05, 27);
  for (const p of pavilions) {
    const [x, , z] = p.position;
    block(batch, "ivory", x, -0.07, z, 10, 0.12, 11);
    block(batch, "path", Math.sign(x) * 14, -0.005, z, 6, 0.12, 3.8);
    for (const side of [-1, 1])
      block(
        batch,
        "rose",
        Math.sign(x) * 14,
        0.06,
        z + side * 1.9,
        6,
        0.12,
        0.12,
      );
    // A quiet central ramp follows the existing entrance orientation. It clears
    // every tread while preserving the approved pavilion and its side stairs.
    const profile = new THREE.Shape();
    profile.moveTo(pavilionRamp.back, 0.04);
    profile.lineTo(pavilionRamp.front, 0.04);
    profile.lineTo(pavilionRamp.front, pavilionRamp.bottom);
    profile.lineTo(pavilionRamp.landingFront, pavilionRamp.top);
    profile.lineTo(pavilionRamp.back, pavilionRamp.top);
    profile.closePath();
    const ramp = new THREE.ExtrudeGeometry(profile, { depth: pavilionRamp.width, steps: 1, bevelEnabled: false });
    ramp.rotateY(-Math.PI / 2).translate(pavilionRamp.width / 2, 0, 0);
    deposit(batch, "ivory", ramp, x, 0, z, p.rotation);
  }
  // Rectangular garden: stone edging, continuous low hedges and paired parterres.
  block(batch, "ivory", 0, 0.015, 0, 18.6, 0.06, 66.6);
  block(batch, "grass", 0, 0.015, 0, 18, 0.05, 66);
  for (const x of [-8.8, 8.8])
    block(batch, "hedge", x, 0.13, 0, 0.38, 0.2, 65.5);
  // The axial opening joins the inner promenade to the mandir-end crosswalk.
  for (const x of [-5.125, 5.125])
    block(batch, "hedge", x, 0.13, -32.75, 7.45, 0.2, 0.38);
  // A low open center at the near edge reveals the water from human eye level.
  for (const x of [-5.8, 5.8])
    block(batch, "hedge", x, 0.13, 32.75, 5.9, 0.2, 0.38);
  for (const path of campusPromenades)
    block(batch, "path", path.x, CAMPUS_PROMENADE_SURFACE - 0.02, path.z, path.width, 0.04, path.depth);
  block(batch, "rose", 0, 0.045, -3, 4.9, 0.12, 52.7);
  for (const x of [-2.23, 2.23])
    block(batch, "ivory", x, 0.135, -3, 0.25, 0.07, 52.5);
  for (const z of [-29.13, 23.13])
    block(batch, "ivory", 0, 0.135, z, 4.7, 0.07, 0.25);
  block(batch, "water", 0, 0.12, -3, 4.2, 0.03, 52);
  for (const side of [-1, 1]) {
    // Small inset warm lights and shared benches; nothing tall on the central axis.
    for (let z = -30; z <= 26; z += 8) {
      block(batch, "gold", side * 9.1, 0.1, z, 0.12, 0.16, 0.12);
      block(batch, "lamp", side * 9.1, 0.195, z, 0.1, 0.03, 0.1);
    }
    for (const z of [-12, 8]) {
      block(batch, "ivory", side * 14.6, 0.135, z, 0.2, 0.03, 0.65);
      for (const dz of [-0.22, 0.22])
        block(batch, "rose", side * 14.6, 0.07, z + dz, 0.16, 0.1, 0.04);
    }
  }
  for (const z of campusLayout.fountains) {
    cylinder(batch, "ivory", 0, 0.16, z, 0.2, 0.04, 24);
    cylinder(batch, "gold", 0, 0.185, z, 0.035, 0.03, 12);
  }
  finish(batch, palette, group);

  const vegetation = makeCampusVegetation(palette, options.mobile ?? false);
  const water = makeCampusWater(options.mobile ?? false);
  const sideFountains = makeCampusSideFountains(palette, options.mobile ?? false);
  group.add(vegetation.group, water.group, sideFountains.group);
  return {
    group,
    prepare: vegetation.prepare,
    diagnostics: { ...vegetation.diagnostics, ...water.diagnostics, ...sideFountains.diagnostics },
    captureReflection(renderer: THREE.WebGLRenderer, scene: THREE.Scene) {
      water.captureReflection(renderer, scene);
      sideFountains.captureReflection(renderer, scene);
    },
    update(seconds: number) {
      vegetation.update(seconds);
      water.update(seconds);
      sideFountains.update(seconds);
    },
    dispose() {
      vegetation.dispose();
      water.dispose();
      sideFountains.dispose();
    },
  };
}
