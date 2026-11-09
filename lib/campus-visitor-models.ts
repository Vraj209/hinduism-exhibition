import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { CAMPUS_METERS_PER_UNIT } from "./campus";
import type { CampusWind } from "./campus-environment";

export type VisitorOutfit = "sari" | "salwar" | "anarkali" | "kurta" | "sherwani" | "waistcoat" | "dhoti";
export type VisitorDetail = "near" | "mid" | "far";
export type VisitorPose = {
  time: number;
  delta: number;
  /** Total actual ground distance travelled, in campus units. */
  distance: number;
  speed: number;
  yaw: number;
  wind: CampusWind;
  detail: VisitorDetail;
  paused: boolean;
  lookYaw: number;
  /** Ground height at each sole, including exhibition ramps. */
  surfaceAt?: (x: number, z: number) => number | null;
};
export type VisitorAppearance = {
  outfit: VisitorOutfit;
  color: string;
  accent: string;
  lower: string;
  skin: string;
  hair: "bun" | "braid" | "waves" | "short" | "silver" | "parted";
  age: "child" | "young adult" | "adult" | "older adult";
  heightMeters: number;
  build: number;
  pattern: number;
  accessory: "earrings" | "bangles" | "glasses" | "stole" | "brooch";
};

const outfits: VisitorOutfit[] = ["sari", "kurta", "salwar", "waistcoat", "anarkali", "dhoti", "sherwani"];
const colors = ["#9a4652", "#d6c4a2", "#397d79", "#344f70", "#b87948", "#ddd1b2", "#6a567b", "#38756b", "#976a43", "#b76f82", "#77774e", "#486c8d", "#b49a70", "#803e4d", "#bc8651", "#728993", "#6f537b", "#6c8063", "#c17d65", "#c3ad8b", "#316b71", "#6c587e", "#b49461", "#437a8e", "#91584c", "#6e8b71", "#c8b39a", "#626785"];
const accents = ["#d8b775", "#a58359", "#c6a56c", "#c2a27e", "#efd8aa", "#ad8750", "#bdaa7b"];
const skins = ["#a46f4d", "#795039", "#b78158", "#694b3a", "#c3916b", "#926147", "#d0a17b"];
const hairstyles: VisitorAppearance["hair"][] = ["bun", "short", "braid", "parted", "waves", "silver", "short"];
const accessories: VisitorAppearance["accessory"][] = ["earrings", "stole", "bangles", "glasses", "earrings", "glasses", "brooch"];

/** A deliberately authored palette; every slot has a different complete appearance. */
export const visitorWardrobe: readonly VisitorAppearance[] = colors.map((color, i) => {
  const child = i === 2 || i === 9 || i === 22;
  const older = i === 5 || i === 14 || i === 19 || i === 26;
  return {
    outfit: outfits[i % outfits.length], color, accent: accents[(i + Math.floor(i / 7)) % 7],
    lower: i % 3 === 0 ? "#e4d5bb" : i % 3 === 1 ? "#cfc0a5" : "#a9a58f",
    skin: skins[(i * 3 + Math.floor(i / 7)) % 7],
    hair: older ? "silver" : hairstyles[i % 7],
    age: child ? "child" : older ? "older adult" : i % 3 === 0 ? "young adult" : "adult",
    heightMeters: child ? (i === 9 ? 1.18 : i === 2 ? 1.26 : 1.32) : [1.61, 1.79, 1.66, 1.73, 1.58, 1.69, 1.83][i % 7] - (older ? 0.035 : 0),
    build: child ? 0.86 : [1, 0.96, 1.12, 1.18, 0.94, 1.05, 1.02][(i + Math.floor(i / 7)) % 7],
    pattern: i % 4,
    accessory: accessories[(i + Math.floor(i / 7)) % 7],
  };
});

export type VisitorModel = {
  group: THREE.Group;
  heightMeters: number;
  outfit: VisitorOutfit;
  signature: string;
  appearance: VisitorAppearance;
  diagnostics: { nearTriangles: number; midTriangles: number; farTriangles: number; drawCalls: number };
  update: (pose: VisitorPose) => void;
};

type Part = { geometry: THREE.BufferGeometry; bone: number; color: string; cloth?: number };
const UP = new THREE.Vector3(0, 1, 0);
const DOWN = new THREE.Vector3(0, -1, 0);
const TAU = Math.PI * 2;
const bones = { pelvis: 0, chest: 1, head: 2, thighL: 3, shinL: 4, footL: 5, thighR: 6, shinR: 7, footR: 8, armL: 9, forearmL: 10, handL: 11, armR: 12, forearmR: 13, handR: 14, hemL: 15, hemR: 16, cloth: 17, clothEnd: 18 };

function signatureFor(a: VisitorAppearance, index: number) {
  return `${index}:${a.outfit}:${a.color}:${a.accent}:${a.pattern}:${a.hair}:${a.accessory}:${a.heightMeters}:${a.build}`;
}

/** Shared primitives, one textile atlas and one material for the whole crowd.
 * Each assembled character is a single skinned draw, including face and trims. */
export function createVisitorModels() {
  const primitives = new Map<string, THREE.BufferGeometry>();
  const assembled = new Map<string, THREE.BufferGeometry>();
  const skeletons = new Set<THREE.Skeleton>();
  const textureData = new Uint8Array(128 * 128 * 4);
  for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
    const at = (y * 128 + x) * 4;
    const thread = (x % 3 === 0 ? -3 : 0) + (y % 3 === 0 ? -2 : 0);
    const grain = ((x * 13 + y * 29) % 3) - 1;
    const value = x < 3 && y < 3 ? 255 : 248 + thread + grain;
    textureData[at] = textureData[at + 1] = textureData[at + 2] = value;
    textureData[at + 3] = 255;
  }
  const textile = new THREE.DataTexture(textureData, 128, 128);
  textile.wrapS = textile.wrapT = THREE.RepeatWrapping;
  textile.magFilter = THREE.LinearFilter;
  textile.minFilter = THREE.LinearMipmapLinearFilter;
  textile.generateMipmaps = true;
  textile.colorSpace = THREE.SRGBColorSpace;
  textile.needsUpdate = true;
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, map: textile, roughness: 0.82, metalness: 0, side: THREE.DoubleSide });
  // Weave is visible only on fabric. Skin and metal details sample the white
  // corner of the shared atlas, avoiding noisy skin or a separate material draw.
  material.name = "campus-visitors-shared-woven-fabric";

  function sphere(quality: number) {
    const key = `sphere-${quality}`;
    if (!primitives.has(key)) primitives.set(key, new THREE.SphereGeometry(1, quality === 0 ? 12 : quality === 1 ? 8 : 6, quality === 0 ? 8 : quality === 1 ? 6 : 4));
    return primitives.get(key)!;
  }
  function cylinder(quality: number) {
    const key = `cylinder-${quality}`;
    if (!primitives.has(key)) primitives.set(key, new THREE.CylinderGeometry(1, 1, 1, quality === 0 ? 12 : quality === 1 ? 8 : 6, 1));
    return primitives.get(key)!;
  }
  function torus(quality: number) {
    const key = `torus-${quality}`;
    if (!primitives.has(key)) primitives.set(key, new THREE.TorusGeometry(1, 0.07, quality ? 3 : 4, quality ? 8 : 14));
    return primitives.get(key)!;
  }
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const position = new THREE.Vector3();
  const scale = new THREE.Vector3();
  function makeGeometry(a: VisitorAppearance, index: number, quality: number) {
    const key = `${index}:${quality}`;
    const cached = assembled.get(key);
    if (cached) return cached;
    const parts: Part[] = [];
    const w = a.build;
    const female = ["sari", "salwar", "anarkali"].includes(a.outfit);
    const skin = a.skin;
    const hair = a.hair === "silver" ? "#87827b" : index % 5 === 0 ? "#342820" : "#221f1c";
    const shoe = index % 3 === 0 ? "#664c35" : "#483b31";
    const headBase = 1.53;
    const add = (base: THREE.BufferGeometry, bone: number, color: string, x: number, y: number, z: number, sx: number, sy: number, sz: number, cloth = 0, rotation?: THREE.Euler) => {
      const geometry = base.clone();
      quaternion.setFromEuler(rotation ?? new THREE.Euler());
      matrix.compose(position.set(x, y, z), quaternion, scale.set(sx, sy, sz));
      geometry.applyMatrix4(matrix);
      parts.push({ geometry, bone, color, cloth });
    };
    const ellipsoid = (bone: number, color: string, x: number, y: number, z: number, sx: number, sy: number, sz: number, cloth = 0) => add(sphere(quality), bone, color, x, y, z, sx, sy, sz, cloth);
    const rod = (bone: number, color: string, from: [number, number, number], to: [number, number, number], radius: number, cloth = 0, flatten = 1) => {
      const direction = new THREE.Vector3(...to).sub(new THREE.Vector3(...from));
      const q = new THREE.Quaternion().setFromUnitVectors(UP, direction.clone().normalize());
      const geometry = cylinder(quality).clone();
      geometry.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...from).add(new THREE.Vector3(...to)).multiplyScalar(0.5), q, new THREE.Vector3(radius, direction.length(), radius * flatten)));
      parts.push({ geometry, bone, color, cloth });
    };
    // Smooth elliptical garment with small modeled pleats. Profile is [height,
    // width, depth]. Rest vertices already occupy the skeleton's bind space.
    const garment = (profile: [number, number, number][], color: string, cloth: number, skirt = false, start = 0, sweep = TAU) => {
      const radial = quality === 0 ? 24 : quality === 1 ? 16 : 10;
      const positions: number[] = [], uv: number[] = [], indices: number[] = [], weights: number[] = [], boneIds: number[] = [];
      for (let row = 0; row < profile.length; row++) {
        const [y, width, depth] = profile[row];
        for (let i = 0; i <= radial; i++) {
          const theta = start + sweep * i / radial;
          const pleat = skirt && row < profile.length - 2 ? 1 + Math.sin(theta * 12) * 0.035 : 1;
          const x = Math.sin(theta) * width * w * pleat;
          const z = Math.cos(theta) * depth * pleat;
          positions.push(x, y, z); uv.push(i / radial * (cloth === 2 ? 3 : 2), y * 3);
          const hem = skirt ? Math.max(0, Math.min(0.65, (0.72 - y) * 0.8)) : 0;
          const chest = y > 1.01 ? Math.min(1, (y - 1.01) / 0.23) : 0;
          boneIds.push(bones.pelvis, bones.chest, x < 0 ? bones.hemL : bones.hemR, 0);
          weights.push(1 - chest - hem, chest, hem, 0);
          if (row < profile.length - 1 && i < radial) {
            const at = row * (radial + 1) + i;
            indices.push(at, at + radial + 1, at + 1, at + 1, at + radial + 1, at + radial + 2);
          }
        }
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
      geometry.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(boneIds, 4));
      geometry.setAttribute("skinWeight", new THREE.Float32BufferAttribute(weights, 4));
      geometry.setIndex(indices); geometry.computeVertexNormals();
      parts.push({ geometry, bone: bones.pelvis, color, cloth });
    };
    const strip = (points: [number, number, number][], width: number, color: string, cloth: number, hanging = false) => {
      const positions: number[] = [], uv: number[] = [], indices: number[] = [], ids: number[] = [], weights: number[] = [];
      points.forEach(([x, y, z], row) => {
        for (let side = 0; side <= 4; side++) {
          positions.push(x + (side / 4 - 0.5) * width, y, z + Math.sin(side * Math.PI) * 0.005);
          uv.push(side / 4, row / (points.length - 1) * 3);
          const end = hanging ? Math.max(0, (row / (points.length - 1) - 0.15) / 0.85) : 0;
          ids.push(hanging ? bones.cloth : bones.chest, bones.clothEnd, 0, 0);
          weights.push(1 - end, end, 0, 0);
          if (row < points.length - 1 && side < 4) {
            const at = row * 5 + side;
            indices.push(at, at + 5, at + 1, at + 1, at + 5, at + 6);
          }
        }
      });
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
      geometry.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(ids, 4));
      geometry.setAttribute("skinWeight", new THREE.Float32BufferAttribute(weights, 4));
      geometry.setIndex(indices); geometry.computeVertexNormals();
      parts.push({ geometry, bone: bones.chest, color, cloth });
    };

    // Neck, face and ears have human proportions, independent of outfit size.
    ellipsoid(bones.chest, skin, 0, 1.42, 0, 0.047, 0.09, 0.045);
    ellipsoid(bones.head, skin, 0, headBase + 0.035, 0, 0.087, 0.121, 0.087);
    ellipsoid(bones.head, skin, 0, headBase - 0.025, 0.025, 0.066, 0.069, 0.069);
    for (const side of [-1, 1]) ellipsoid(bones.head, skin, side * 0.086, headBase + 0.025, -0.005, 0.015, 0.026, 0.012);
    // Hairline and back volume; hairstyles remain recognizable at middle LOD.
    ellipsoid(bones.head, hair, 0, headBase + 0.105, -0.01, 0.088, 0.054, 0.083);
    if (female || a.hair === "silver") ellipsoid(bones.head, hair, 0, headBase + 0.025, -0.054, 0.085, 0.105, 0.039);
    if (a.hair === "bun" || (a.hair === "silver" && female)) ellipsoid(bones.head, hair, 0, headBase + 0.025, -0.103, 0.051, 0.046, 0.041);
    if (a.hair === "braid") for (let knot = 0; knot < (quality === 2 ? 3 : 7); knot++) ellipsoid(bones.chest, hair, 0.02 * Math.sin(knot * 2), 1.48 - knot * 0.047, -0.119, 0.024 - knot * 0.001, 0.038, 0.021);
    if (a.hair === "waves") for (const side of [-1, 1]) ellipsoid(bones.head, hair, side * 0.069, 1.48, -0.061, 0.034, 0.11, 0.043);
    if (quality < 2) {
      // Nose bridge, lips and recessed eyes keep the face calm at walking range.
      ellipsoid(bones.head, skin, 0, 1.566, 0.086, 0.016, 0.025, 0.026);
      ellipsoid(bones.head, "#805348", 0, 1.524, 0.084, 0.025, 0.004, 0.005);
      for (const side of [-1, 1]) {
        ellipsoid(bones.head, "#2f2924", side * 0.034, 1.588, 0.078, 0.011, 0.005, 0.005);
        rod(bones.head, hair, [side * 0.019, 1.603, 0.077], [side * 0.049, 1.607, 0.07], 0.003);
      }
      if (female && index % 2 === 0) ellipsoid(bones.head, "#974d3e", 0, 1.621, 0.081, 0.004, 0.005, 0.003);
      if (a.accessory === "glasses") {
        for (const side of [-1, 1]) add(torus(quality), bones.head, "#8c775b", side * 0.035, 1.586, 0.084, 0.025, 0.018, 0.018);
        rod(bones.head, "#8c775b", [-0.011, 1.59, 0.086], [0.011, 1.59, 0.086], 0.0025);
      }
      if (a.accessory === "earrings" || female) for (const side of [-1, 1]) ellipsoid(bones.head, a.accent, side * 0.092, 1.527, 0, 0.008, 0.016, 0.007);
    }

    const hips = 0.092 * w;
    const fullSkirt = a.outfit === "sari" || a.outfit === "anarkali";
    for (const [side, thigh, shin, foot] of [[-1, bones.thighL, bones.shinL, bones.footL], [1, bones.thighR, bones.shinR, bones.footR]]) {
      const pants = a.outfit === "dhoti" ? skin : a.lower;
      // Tapered lower limbs under the garments; knees flex, feet stay planted.
      // Covered thighs are omitted, like production clothing meshes: they can
      // never poke through a sari, sherwani or kurta during knee flexion.
      if (!fullSkirt) {
        ellipsoid(thigh, a.lower, side * hips, 0.512, 0, 0.049 * w, 0.065, 0.049, 1);
        if (a.outfit === "dhoti") ellipsoid(shin, pants, side * hips, 0.291, 0, 0.043 * w, 0.219, 0.045);
        else {
          // Tapered cloth tubes retain fabric volume at knees and ankles;
          // disconnected oval calves would read as a wooden mannequin.
          const trouser = cylinder(quality).clone();
          const vertices = trouser.getAttribute("position");
          for (let v = 0; v < vertices.count; v++) {
            const y = vertices.getY(v), radius = 0.031 + (y + 0.5) * (a.outfit === "salwar" ? 0.029 : 0.016);
            vertices.setXYZ(v, side * hips + vertices.getX(v) * radius * w, 0.285 + y * 0.43, vertices.getZ(v) * radius);
          }
          trouser.computeVertexNormals();
          parts.push({ geometry: trouser, bone: shin, color: pants, cloth: 1 });
        }
      }
      ellipsoid(foot, shoe, side * hips, 0.035, 0.043, 0.047, 0.035, 0.106);
      if (quality === 0) rod(foot, a.accent, [side * hips - 0.039, 0.054, 0.052], [side * hips + 0.039, 0.054, 0.052], 0.007);
    }
    // Anatomical trunk, concealed under the different tailored silhouettes.
    ellipsoid(bones.pelvis, a.color, 0, 0.953, 0, 0.16 * w, 0.15, 0.106, 1);
    garment([[0.94, 0.148, 0.1], [1.12, female ? 0.135 : 0.158, 0.105], [1.31, 0.174, 0.112], [1.365, 0.164, 0.095], [1.405, 0.052, 0.052]], a.color, 1);
    const longSleeve = a.outfit !== "sari";
    for (const [side, arm, forearm, hand] of [[-1, bones.armL, bones.forearmL, bones.handL], [1, bones.armR, bones.forearmR, bones.handR]]) {
      const x = side * 0.205 * w;
      ellipsoid(arm, a.color, x, 1.25, 0, 0.052 * w, longSleeve ? 0.145 : 0.10, 0.055, 1);
      ellipsoid(arm, longSleeve ? a.color : skin, x, 1.158, 0, 0.042 * w, 0.105, 0.042, longSleeve ? 1 : 0);
      ellipsoid(forearm, longSleeve ? a.color : skin, x, 0.99, 0, 0.04 * w, 0.135, 0.04, longSleeve ? 1 : 0);
      ellipsoid(hand, skin, x, 0.823, 0.006, 0.034, 0.055, 0.024);
      if (quality < 2) ellipsoid(hand, skin, x - side * 0.027, 0.836, 0.015, 0.013, 0.032, 0.012);
      if (a.accessory === "bangles" || female) for (let ring = 0; ring < (quality === 0 ? 3 : 1); ring++) add(torus(quality), forearm, a.accent, x, 0.888 + ring * 0.012, 0, 0.043, 0.043, 0.043, 0, new THREE.Euler(Math.PI / 2, 0, 0));
    }
    const hem = a.outfit === "sherwani" ? 0.49 : a.outfit === "kurta" || a.outfit === "waistcoat" ? 0.56 : 0.58;
    if (a.outfit === "sari") {
      garment([[0.075, 0.20, 0.17], [0.14, 0.205, 0.173], [0.55, 0.17, 0.135], [0.94, 0.16, 0.119], [1.04, 0.145, 0.11]], a.color, 2, true);
      garment([[0.078, 0.202, 0.173], [0.124, 0.208, 0.177]], a.accent, 1, true);
      strip([[0.137, 0.99, 0.123], [0.08, 1.12, 0.126], [-0.035, 1.26, 0.129], [-0.145, 1.395, 0.09]], 0.19, a.accent, 2);
      const side = index % 2 ? 1 : -1;
      strip([[side * 0.147, 1.402, -0.06], [side * 0.158, 1.20, -0.14], [side * 0.175, 0.96, -0.155], [side * 0.17, 0.67, -0.16], [side * 0.17, 0.50, -0.17]], 0.19, a.color, 2, true);
      strip([[side * 0.17, 0.56, -0.173], [side * 0.17, 0.50, -0.176]], 0.192, a.accent, 1, true);
    } else if (a.outfit === "anarkali") {
      garment([[0.14, 0.29, 0.245], [0.19, 0.28, 0.235], [0.50, 0.233, 0.195], [0.83, 0.175, 0.135], [1.07, 0.135, 0.109]], a.color, 2, true);
      garment([[0.14, 0.293, 0.249], [0.19, 0.284, 0.239]], a.accent, 1, true);
      garment([[1.035, 0.142, 0.115], [1.065, 0.141, 0.114]], a.accent, 1);
    } else if (a.outfit === "dhoti") {
      garment([[0.40, 0.192, 0.14], [0.60, 0.225, 0.17], [0.92, 0.165, 0.129], [1.00, 0.16, 0.116]], a.lower, 2, true);
      strip([[0.03, 0.95, 0.146], [0.02, 0.7, 0.183], [0, 0.42, 0.161]], 0.15, a.accent, 1);
      garment([[0.85, 0.18, 0.14], [1.05, 0.16, 0.115]], a.color, 1, true);
    } else {
      garment([[hem, 0.20, 0.145], [hem + 0.045, 0.20, 0.145], [0.95, 0.166, 0.119], [1.09, 0.15, 0.11]], a.color, 1, true);
      garment([[hem, 0.203, 0.148], [hem + 0.025, 0.203, 0.148]], a.accent, 1, true);
      if (a.outfit === "waistcoat") {
        garment([[0.96, 0.17, 0.13], [1.15, 0.17, 0.12], [1.345, 0.165, 0.115], [1.403, 0.055, 0.057]], a.accent, 2);
        // Open-front placket and neckline read as a tailored waistcoat.
        rod(bones.chest, a.color, [0, 1.36, 0.116], [0, 1.1, 0.13], 0.012, 1);
        rod(bones.chest, a.color, [-0.05, 1.396, 0.06], [0, 1.31, 0.128], 0.009, 1);
        rod(bones.chest, a.color, [0.05, 1.396, 0.06], [0, 1.31, 0.128], 0.009, 1);
      }
    }
    if (a.outfit === "salwar" || a.outfit === "anarkali" || a.accessory === "stole") {
      const scarf = a.outfit === "salwar" || a.outfit === "anarkali" ? a.accent : a.lower;
      strip([[-0.145, 1.39, 0.075], [-0.10, 1.30, 0.13], [0.015, 1.28, 0.14], [0.145, 1.385, 0.08]], 0.09, scarf, 2);
      strip([[-0.148, 1.38, -0.08], [-0.18, 1.16, -0.145], [-0.185, 0.90, -0.16], [-0.20, 0.62, -0.17]], 0.125, scarf, 2, true);
    }
    // Narrow collars, plackets and restrained embroidery distinguish ceremonial
    // sherwanis from everyday cotton kurtas without excessive shiny decoration.
    if (!female) {
      garment([[1.365, 0.055, 0.055], [1.42, 0.052, 0.05]], a.outfit === "sherwani" ? a.accent : a.color, 1);
      rod(bones.chest, a.accent, [0, 1.35, 0.12], [0, 1.11, 0.121], a.outfit === "sherwani" ? 0.009 : 0.004, 1);
      if (quality < 2) for (let button = 0; button < 4; button++) ellipsoid(bones.chest, a.accent, 0.012, 1.32 - button * 0.061, 0.127, 0.005, 0.005, 0.004);
    }
    if (quality === 0 && (a.pattern > 0 || a.outfit === "sherwani")) {
      for (let row = 0; row < 3; row++) for (const side of [-1, 1]) {
        const y = 0.68 + row * 0.13;
        const z = a.outfit === "anarkali" ? 0.18 - row * 0.02 : a.outfit === "sari" ? 0.15 : 0.148;
        // Small woven buti motifs, each embedded in the garment surface.
        ellipsoid(bones.pelvis, a.accent, side * (0.075 + (row % 2) * 0.025), y, z, 0.007, 0.012, 0.002, 1);
      }
    }
    if (quality < 2 && a.accessory === "brooch") ellipsoid(bones.chest, a.accent, -0.09 * w, 1.30, 0.118, 0.016, 0.019, 0.005);

    const color = new THREE.Color();
    for (const part of parts) {
      const count = part.geometry.getAttribute("position").count;
      color.set(part.color);
      const colors = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) colors.set([color.r, color.g, color.b], i * 3);
      part.geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      if (!part.geometry.getAttribute("skinIndex")) {
        const ids = new Uint16Array(count * 4), weights = new Float32Array(count * 4);
        for (let i = 0; i < count; i++) { ids[i * 4] = part.bone; weights[i * 4] = 1; }
        part.geometry.setAttribute("skinIndex", new THREE.BufferAttribute(ids, 4));
        part.geometry.setAttribute("skinWeight", new THREE.BufferAttribute(weights, 4));
      }
      const uv = part.geometry.getAttribute("uv");
      for (let i = 0; i < count; i++) {
        if (!part.cloth) uv.setXY(i, 0.005, 0.005);
        else uv.setXY(i, uv.getX(i) * 2, uv.getY(i) * 2);
      }
      part.geometry.clearGroups();
    }
    const geometry = mergeGeometries(parts.map((part) => part.geometry), false)!;
    parts.forEach((part) => part.geometry.dispose());
    geometry.computeBoundingBox(); geometry.computeBoundingSphere();
    assembled.set(key, geometry);
    return geometry;
  }

  function create(index: number): VisitorModel {
    const slot = ((index % visitorWardrobe.length) + visitorWardrobe.length) % visitorWardrobe.length;
    const a = visitorWardrobe[slot];
    const w = a.build;
    const group = new THREE.Group();
    group.name = `visitor-${index}-${a.outfit}`;
    const scale = a.heightMeters / 1.655 / CAMPUS_METERS_PER_UNIT;
    const mesh = new THREE.SkinnedMesh(makeGeometry(a, slot, 0), material);
    mesh.name = "visitor-clothing-body-and-face";
    mesh.scale.setScalar(scale);
    mesh.castShadow = true; mesh.receiveShadow = true;
    // Pose bounds are conservative; do not recompute skinned bounds per frame.
    mesh.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0.85, 0), 1.12);
    const boneList = Array.from({ length: 19 }, () => new THREE.Bone());
    for (const [name, id] of Object.entries(bones)) boneList[id].name = name;
    const attach = (id: number, parent: number | null, x: number, y: number, z: number) => {
      boneList[id].position.set(x, y, z);
      if (parent === null) mesh.add(boneList[id]); else boneList[parent].add(boneList[id]);
    };
    attach(bones.pelvis, null, 0, 0.9, 0);
    attach(bones.chest, bones.pelvis, 0, 0.36, 0);
    attach(bones.head, bones.chest, 0, 0.27, 0);
    const hip = 0.092 * w;
    for (const [side, thigh, shin, foot, arm, forearm, hand] of [[-1, 3, 4, 5, 9, 10, 11], [1, 6, 7, 8, 12, 13, 14]]) {
      attach(thigh, bones.pelvis, side * hip, 0, 0);
      attach(shin, thigh, 0, -0.42, 0);
      attach(foot, shin, 0, -0.42, 0);
      attach(arm, bones.chest, side * 0.205 * w, 0.11, 0);
      attach(forearm, arm, 0, -0.28, 0);
      attach(hand, forearm, 0, -0.25, 0);
    }
    attach(bones.hemL, bones.pelvis, -0.13 * w, -0.43, 0);
    attach(bones.hemR, bones.pelvis, 0.13 * w, -0.43, 0);
    attach(bones.cloth, bones.chest, -0.14, 0.12, -0.09);
    attach(bones.clothEnd, bones.cloth, 0, -0.7, -0.07);
    mesh.updateMatrixWorld(true);
    const skeleton = new THREE.Skeleton(boneList);
    mesh.bind(skeleton);
    skeletons.add(skeleton);
    group.add(mesh);
    const mid = makeGeometry(a, slot, 1), far = makeGeometry(a, slot, 2);
    const lod = [mesh.geometry, mid, far];
    const diagnostics = {
      nearTriangles: lod[0].index!.count / 3, midTriangles: mid.index!.count / 3,
      farTriangles: far.index!.count / 3, drawCalls: 1,
    };
    group.userData.visitor = { ...a, signature: signatureFor(a, index), ...diagnostics };
    const feet = [-1, 1].map(() => ({ world: new THREE.Vector3(), start: new THREE.Vector3(), stance: true, initialized: false, yaw: 0 }));
    const target = new THREE.Vector3(), local = new THREE.Vector3(), desired = new THREE.Vector3();
    const footTargets = [new THREE.Vector3(), new THREE.Vector3()];
    const footRotations = [new THREE.Quaternion(), new THREE.Quaternion()];
    const soleNormal = new THREE.Vector3(), soleYaw = new THREE.Quaternion();
    const hipPosition = new THREE.Vector3(), knee = new THREE.Vector3();
    const thighDirection = new THREE.Vector3(), shinDirection = new THREE.Vector3(), bendDirection = new THREE.Vector3();
    const thighQuaternion = new THREE.Quaternion(), shinQuaternion = new THREE.Quaternion();
    const forward = new THREE.Vector3(), right = new THREE.Vector3(), lastRootPosition = new THREE.Vector3();
    let gaitOffset = (index * 0.381966) % 1;
    let lastDistance = -1, lastTime = -1, lastYaw = 0, lastLookYaw = 0;
    let settled = 0;
    let wasMoving = false;
    function update(pose: VisitorPose) {
      mesh.geometry = lod[pose.detail === "near" ? 0 : pose.detail === "mid" ? 1 : 2];
      mesh.castShadow = pose.detail !== "far";
      const relocated = lastTime >= 0 && group.position.distanceToSquared(lastRootPosition) > 0.16;
      if (relocated) feet.forEach((foot) => { foot.initialized = false; });
      if (pose.paused && lastTime >= 0 && !relocated) return;
      if (!relocated && pose.time === lastTime && pose.distance === lastDistance && pose.yaw === lastYaw && pose.lookYaw === lastLookYaw) return;
      const dt = Math.min(0.1, Math.max(0, pose.delta));
      const groundAt = (point: THREE.Vector3) => pose.surfaceAt?.(point.x, point.z) ?? group.position.y;
      const moving = pose.speed > 0.003;
      if (lastDistance > pose.distance + 0.01) { feet.forEach((foot) => { foot.initialized = false; }); gaitOffset = (index * 0.381966) % 1; }
      const stride = 0.76;
      const phase = (pose.distance / scale / stride + gaitOffset) % 1;
      settled = moving ? 0 : Math.min(1, settled + dt * 2.5);
      const gait = moving ? Math.sin(phase * TAU) : Math.sin(phase * TAU) * (1 - settled);
      const sway = pose.detail === "far" ? 0 : Math.sin(phase * TAU) * 0.008;
      boneList[bones.pelvis].position.y = 0.86 + (moving ? Math.cos(phase * TAU * 2) * 0.006 : 0);
      boneList[bones.pelvis].position.x = sway;
      boneList[bones.chest].rotation.set(0, -gait * 0.018, -gait * 0.01);
      boneList[bones.head].rotation.set(pose.detail === "near" ? Math.sin(pose.time * 0.67 + index) * 0.015 : 0, THREE.MathUtils.clamp(pose.lookYaw, -0.45, 0.45) + (pose.detail === "far" ? 0 : Math.sin(pose.time * 0.38 + index) * 0.035), 0);
      forward.set(Math.sin(pose.yaw), 0, Math.cos(pose.yaw));
      right.set(Math.cos(pose.yaw), 0, -Math.sin(pose.yaw));
      for (let i = 0; i < 2; i++) {
        const side = i === 0 ? -1 : 1;
        const foot = feet[i];
        const p = (phase + i * 0.5) % 1;
        const stance = p < 0.6 || !moving;
        const front = stride * 0.3;
        desired.copy(group.position).addScaledVector(right, side * hip * scale).addScaledVector(forward, front * scale);
        desired.y = groundAt(desired);
        if (!foot.initialized) {
          const offset = moving && p < 0.6 ? front - p * stride : 0;
          foot.world.copy(group.position).addScaledVector(right, side * hip * scale).addScaledVector(forward, offset * scale);
          foot.world.y = groundAt(foot.world);
          foot.yaw = pose.yaw;
          foot.start.copy(foot.world); foot.stance = stance; foot.initialized = true;
        }
        if (moving && foot.stance && !stance) foot.start.copy(foot.world);
        if (moving && !foot.stance && stance) { foot.world.copy(desired); foot.yaw = pose.yaw; }
        if (!stance) {
          foot.yaw = pose.yaw;
          const swing = (p - 0.6) / 0.4;
          const ease = swing * swing * (3 - 2 * swing);
          target.copy(foot.start).lerp(desired, ease);
          target.y += Math.sin(swing * Math.PI) * 0.065 * scale;
          foot.world.copy(target);
        } else if (!moving && wasMoving) {
          // A stopped walker plants their current foot, then lifts only the
          // trailing foot into a relaxed stand over a short settling interval.
          foot.start.copy(foot.world);
        } else if (!moving && settled < 1 && i === (phase < 0.5 ? 1 : 0)) {
          desired.copy(group.position).addScaledVector(right, side * hip * scale);
          desired.y = groundAt(desired);
          const ease = settled * settled * (3 - 2 * settled);
          foot.world.copy(foot.start).lerp(desired, ease);
          foot.world.y += Math.sin(settled * Math.PI) * 0.025 * scale;
        }
        foot.stance = stance;
        // Convert world-locked soles to the moving body's local frame. This
        // accounts for turns and speed changes, rather than sliding a sine gait.
        local.copy(foot.world).sub(group.position);
        const sample = (x: number, z: number) => pose.surfaceAt?.(x, z) ?? foot.world.y;
        const sx = Math.cos(foot.yaw) * 0.02, sz = -Math.sin(foot.yaw) * 0.02;
        const fx = Math.sin(foot.yaw) * 0.02, fz = Math.cos(foot.yaw) * 0.02;
        const across = (sample(foot.world.x + sx, foot.world.z + sz) - sample(foot.world.x - sx, foot.world.z - sz)) / 0.04;
        const along = (sample(foot.world.x + fx, foot.world.z + fz) - sample(foot.world.x - fx, foot.world.z - fz)) / 0.04;
        soleNormal.set(-across, 1, -along).normalize();
        soleYaw.setFromAxisAngle(UP, foot.yaw - pose.yaw);
        footRotations[i].setFromUnitVectors(UP, soleNormal).premultiply(soleYaw);
        footTargets[i].set(local.dot(right) / scale, (foot.world.y - group.position.y) / scale + 0.06 / soleNormal.y, local.dot(forward) / scale);
      }
      // Both soles choose the pelvis height before either knee is solved. This
      // lets the downhill leg reach its planted point on the 0.4-slope ramps
      // without stretching, dragging a foot, or sinking the uphill sole.
      for (let i = 0; i < 2; i++) {
        const sole = footTargets[i];
        const horizontal = (sole.x - (i === 0 ? -hip : hip) - sway) ** 2 + sole.z ** 2;
        const reach = Math.sqrt(Math.max(0.1, 0.838 ** 2 - horizontal));
        boneList[bones.pelvis].position.y = Math.min(boneList[bones.pelvis].position.y, sole.y + reach);
      }
      for (let i = 0; i < 2; i++) {
        const side = i === 0 ? -1 : 1;
        target.copy(footTargets[i]);
        hipPosition.set(side * hip + sway, boneList[bones.pelvis].position.y, 0);
        const distance = Math.min(0.838, Math.max(0.12, hipPosition.distanceTo(target)));
        desired.copy(target).sub(hipPosition).normalize();
        const bend = Math.sqrt(Math.max(0, 0.42 ** 2 - (distance / 2) ** 2));
        knee.copy(hipPosition).addScaledVector(desired, distance / 2);
        // Knee bends forward in the sagittal plane, perpendicular to the leg.
        bendDirection.set(0, -desired.z, desired.y).normalize().multiplyScalar(-1);
        knee.addScaledVector(bendDirection, bend);
        thighDirection.copy(knee).sub(hipPosition).normalize();
        shinDirection.copy(target).sub(knee).normalize();
        thighQuaternion.setFromUnitVectors(DOWN, thighDirection);
        shinQuaternion.setFromUnitVectors(DOWN, shinDirection);
        const thighId = i === 0 ? bones.thighL : bones.thighR;
        const shinId = i === 0 ? bones.shinL : bones.shinR;
        const footId = i === 0 ? bones.footL : bones.footR;
        boneList[thighId].quaternion.copy(thighQuaternion);
        boneList[shinId].quaternion.copy(thighQuaternion).invert().multiply(shinQuaternion);
        boneList[footId].quaternion.copy(shinQuaternion).invert().multiply(footRotations[i]);
      }
      const amplitude = moving ? Math.min(0.19, pose.speed / scale * 0.21) : (1 - settled) * 0.08;
      boneList[bones.armL].rotation.set(-gait * amplitude, 0, 0.06);
      boneList[bones.armR].rotation.set(gait * amplitude, 0, -0.06);
      boneList[bones.forearmL].rotation.x = -0.11 - Math.max(0, gait) * amplitude * 0.45;
      boneList[bones.forearmR].rotation.x = -0.11 - Math.max(0, -gait) * amplitude * 0.45;
      const detailAmount = pose.detail === "far" ? 0 : pose.detail === "mid" ? 0.4 : 1;
      const fabricWeight = a.outfit === "sherwani" ? 0.38 : a.outfit === "dhoti" ? 0.55 : a.outfit === "sari" ? 0.7 : a.outfit === "salwar" || a.outfit === "anarkali" ? 1 : 0.65;
      const clothAmount = detailAmount * fabricWeight;
      const windLocalX = pose.wind.x * Math.cos(pose.yaw) - pose.wind.z * Math.sin(pose.yaw);
      const windLocalZ = pose.wind.x * Math.sin(pose.yaw) + pose.wind.z * Math.cos(pose.yaw);
      const flutter = Math.sin(pose.time * 2.2 + index * 1.7) * 0.012 * pose.wind.strength;
      boneList[bones.hemL].position.z = clothAmount * (Math.max(0, gait) * 0.026 + windLocalZ * 0.014);
      boneList[bones.hemR].position.z = clothAmount * (Math.max(0, -gait) * 0.026 + windLocalZ * 0.014);
      // Loose ends only move away from the back. Their anchors remain sewn to
      // the shoulder; the bounded displacement cannot cross the torso.
      boneList[bones.clothEnd].position.x = clothAmount * (windLocalX * 0.035 + flutter);
      boneList[bones.clothEnd].position.z = -0.07 - clothAmount * (0.015 + Math.abs(windLocalZ) * 0.04 + Math.abs(gait) * 0.012);
      mesh.updateMatrixWorld(true);
      lastTime = pose.time; lastDistance = pose.distance; lastYaw = pose.yaw; lastLookYaw = pose.lookYaw; wasMoving = moving;
      lastRootPosition.copy(group.position);
    }
    return { group, heightMeters: a.heightMeters, outfit: a.outfit, signature: signatureFor(a, index), appearance: a, diagnostics, update };
  }
  return {
    create,
    dispose() {
      skeletons.forEach((skeleton) => skeleton.dispose());
      assembled.forEach((geometry) => geometry.dispose());
      primitives.forEach((geometry) => geometry.dispose());
      textile.dispose(); material.dispose();
      skeletons.clear(); assembled.clear(); primitives.clear();
    },
  };
}
