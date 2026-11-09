import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
export type Batch = Map<string, THREE.BufferGeometry[]>;
export type Palette = Record<string, THREE.MeshStandardMaterial>;
export function put(
  batch: Batch,
  material: string,
  geometry: THREE.BufferGeometry,
  x = 0,
  y = 0,
  z = 0,
  rotation = 0,
) {
  geometry.rotateY(rotation).translate(x, y, z);
  const parts = batch.get(material) ?? [];
  parts.push(geometry);
  batch.set(material, parts);
}
export function box(
  batch: Batch,
  m: string,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
  r = 0,
) {
  put(batch, m, new THREE.BoxGeometry(w, h, d), x, y, z, r);
}
export function cyl(
  batch: Batch,
  m: string,
  x: number,
  y: number,
  z: number,
  radius: number,
  height: number,
  sides = 20,
  top = radius,
) {
  put(
    batch,
    m,
    new THREE.CylinderGeometry(top, radius, height, sides),
    x,
    y,
    z,
  );
}
export function lathe(
  batch: Batch,
  m: string,
  x: number,
  y: number,
  z: number,
  points: [number, number][],
  sides = 20,
  faceted = false,
) {
  let geometry: THREE.BufferGeometry = new THREE.LatheGeometry(
    points.map(([a, b]) => new THREE.Vector2(a, b)),
    sides,
  );
  if (faceted) {
    const original = geometry;
    geometry = geometry.toNonIndexed();
    geometry.computeVertexNormals();
    original.dispose();
  }
  put(batch, m, geometry, x, y, z);
}
export function torus(
  batch: Batch,
  m: string,
  x: number,
  y: number,
  z: number,
  radius: number,
  tube: number,
  sides = 24,
) {
  const g = new THREE.TorusGeometry(radius, tube, 5, sides);
  g.rotateX(Math.PI / 2);
  put(batch, m, g, x, y, z);
}
export function finish(batch: Batch, palette: Palette, group: THREE.Group) {
  for (const [name, originals] of batch) {
    const normalized = originals.map((g) => (g.index ? g.toNonIndexed() : g));
    const merged = mergeGeometries(normalized);
    normalized.forEach((g) => g.dispose());
    originals.forEach((g) => g.dispose());
    if (!merged) continue;
    const mesh = new THREE.Mesh(merged, palette[name]);
    mesh.castShadow = !["flame", "bridgeFlame"].includes(name);
    mesh.receiveShadow = true;
    group.add(mesh);
  }
}
/** Simple original leaf relief, not a traced temple carving. Local face is +Z. */
function leafGeometry(
  length: number,
  width: number,
  depth: number,
  detail = 2,
) {
  const leaf = new THREE.Shape();
  leaf.moveTo(0, 0);
  leaf.quadraticCurveTo(width * 0.55, length * 0.3, width * 0.3, length * 0.64);
  leaf.quadraticCurveTo(width * 0.12, length * 0.88, 0, length);
  leaf.quadraticCurveTo(
    -width * 0.12,
    length * 0.88,
    -width * 0.3,
    length * 0.64,
  );
  leaf.quadraticCurveTo(-width * 0.55, length * 0.3, 0, 0);
  return new THREE.ExtrudeGeometry(leaf, {
    depth,
    bevelEnabled: false,
    curveSegments: detail,
    steps: 1,
  });
}
function transfer(
  batch: Batch,
  detail: Batch,
  x: number,
  y: number,
  z: number,
  rotation = 0,
) {
  for (const [material, pieces] of detail)
    for (const geometry of pieces)
      put(batch, material, geometry, x, y, z, rotation);
}
function rosette(
  batch: Batch,
  x: number,
  y: number,
  z: number,
  radius: number,
  rotation = 0,
  material = "ivory",
  petals = 6,
  detail = 2,
) {
  for (let i = 0; i < petals; i++) {
    const leaf = leafGeometry(
      radius * 0.76,
      radius * 0.64,
      radius * 0.14,
      detail,
    );
    leaf.translate(0, radius * 0.16, 0).rotateZ((i / petals) * Math.PI * 2);
    put(batch, material, leaf, x, y, z, rotation);
  }
  put(
    batch,
    material,
    new THREE.SphereGeometry(radius * 0.23, 6, 3)
      .scale(1, 1, 0.38)
      .translate(0, 0, radius * 0.1),
    x,
    y,
    z,
    rotation,
  );
}

/** A framed, nonfigural floral relief. Its centre is (x,y,z), facing +Z. */
export function floralPanel(
  batch: Batch,
  x: number,
  y: number,
  z: number,
  width = 1,
  height = 1,
  rotation = 0,
  material = "ivory",
) {
  const b: Batch = new Map();
  const edge = Math.min(width, height) * 0.075;
  box(b, "rose", 0, 0, -0.035, width, height, 0.07);
  for (const xx of [-width / 2 + edge / 2, width / 2 - edge / 2])
    box(b, material, xx, 0, 0.025, edge, height, 0.06);
  for (const yy of [-height / 2 + edge / 2, height / 2 - edge / 2])
    box(b, material, 0, yy, 0.025, width, edge, 0.06);
  const size = Math.min(width, height) * 0.36;
  rosette(b, 0, 0, 0.035, size, 0, material, 4);
  transfer(batch, b, x, y, z, rotation);
}

/**
 * Faceted pillars, relief panels and foliate brackets draw on the architectural
 * vocabulary documented at Akshardham's mandapams and BAPS London's haveli.
 * Figurative narratives and sacred sculptures are deliberately not reproduced.
 */
export function column(
  batch: Batch,
  x: number,
  z: number,
  height = 6,
  y = 0,
  scale = 1,
) {
  const b: Batch = new Map();
  const foot = Math.min(0.9, height * 0.2),
    head = Math.min(1.1, height * 0.25);
  box(b, "rose", 0, 0.13, 0, 1.02 * scale, 0.26, 1.02 * scale);
  box(b, "ivory", 0, 0.3, 0, 0.88 * scale, 0.08, 0.88 * scale);
  box(b, "rose", 0, 0.4, 0, 0.77 * scale, 0.12, 0.77 * scale);
  lathe(
    b,
    "ivory",
    0,
    0,
    0,
    [
      [0.4 * scale, 0.46],
      [0.4 * scale, 0.52],
      [0.33 * scale, 0.62],
      [0.3 * scale, foot],
      [0.265 * scale, foot + 0.12],
      [0.245 * scale, height - head],
      [0.31 * scale, height - head + 0.13],
      [0.39 * scale, height - head + 0.2],
      [0.4 * scale, height - head + 0.28],
    ],
    8,
    true,
  );
  // A square, carved lower block makes the four/eight-sided construction legible.
  const panelHeight = Math.min(0.73, height * 0.2),
    panelY = foot + panelHeight * 0.65;
  box(b, "ivory", 0, panelY, 0, 0.63 * scale, panelHeight, 0.63 * scale);
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    floralPanel(
      b,
      Math.sin(angle) * 0.32 * scale,
      panelY,
      Math.cos(angle) * 0.32 * scale,
      0.53 * scale,
      panelHeight * 0.82,
      angle,
      "pale",
    );
  }
  const vineBottom = panelY + panelHeight * 0.7;
  const vineLength = height - head - vineBottom - 0.18;
  if (vineLength > 0.5) {
    for (let face = 0; face < 4; face++) {
      const angle = (face * Math.PI) / 2;
      const vine: Batch = new Map();
      const points = [0, 0.25, 0.5, 0.75, 1].map(
        (t) =>
          new THREE.Vector3(
            Math.sin(t * Math.PI * 2) * 0.055 * scale,
            t * vineLength,
            0.25 * scale,
          ),
      );
      put(
        vine,
        "pale",
        new THREE.TubeGeometry(
          new THREE.CatmullRomCurve3(points),
          8,
          0.016 * scale,
          3,
          false,
        ),
      );
      for (let i = 0; i < 3; i++) {
        const leaf = leafGeometry(
          Math.min(0.34, vineLength * 0.22),
          0.16 * scale,
          0.024 * scale,
        );
        leaf
          .rotateZ(i % 2 ? -0.6 : 0.6)
          .translate(0, vineLength * (0.14 + i * 0.28), 0.255 * scale);
        put(vine, "pale", leaf);
      }
      transfer(b, vine, 0, vineBottom, 0, angle);
    }
  }
  for (const yy of [height * 0.49, height - head]) {
    cyl(b, "rose", 0, yy, 0, 0.29 * scale, 0.12, 8);
    cyl(b, "pale", 0, yy + 0.085, 0, 0.3 * scale, 0.055, 8);
  }
  // Broad, visibly carved supports replace the previous smooth bead capital.
  const bracket = new THREE.Shape();
  bracket.moveTo(0.12, 0.03);
  bracket.lineTo(0.24, 0.04);
  bracket.quadraticCurveTo(0.6, 0.22, 0.84, 0.7);
  bracket.lineTo(0.84, 0.87);
  bracket.lineTo(0.56, 0.87);
  bracket.quadraticCurveTo(0.48, 0.5, 0.25, 0.37);
  bracket.quadraticCurveTo(0.08, 0.31, 0.12, 0.03);
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    const geometry = new THREE.ExtrudeGeometry(bracket, {
      depth: 0.2,
      bevelEnabled: true,
      bevelSize: 0.025,
      bevelThickness: 0.025,
      bevelSegments: 1,
      curveSegments: 3,
      steps: 1,
    });
    geometry.translate(0, 0, -0.1).scale(scale, head / 1.1, scale);
    put(b, "ivory", geometry, 0, height - head + 0.12, 0, angle);
    const leaf = leafGeometry(0.45, 0.24, 0.04);
    leaf
      .rotateZ(-0.55)
      .translate(0.24, 0.2, 0.13)
      .scale(scale, head / 1.1, scale);
    put(b, "pale", leaf, 0, height - head + 0.12, 0, angle);
  }
  box(b, "ivory", 0, height - 0.18, 0, 1.4 * scale, 0.16, 1.4 * scale);
  box(b, "rose", 0, height - 0.05, 0, 1.5 * scale, 0.1, 1.5 * scale);
  transfer(batch, b, x, y, z);
}

export function arch(
  batch: Batch,
  x: number,
  z: number,
  width: number,
  height: number,
  y = 0,
  r = 0,
) {
  const b: Batch = new Map(),
    half = width / 2;
  const spring = Math.max(height * 0.38, height - half * 0.78),
    rise = height - spring;
  const shape = new THREE.Shape();
  shape.moveTo(-half - 0.16, spring - 0.12);
  shape.lineTo(-half - 0.16, height + 0.28);
  shape.lineTo(half + 0.16, height + 0.28);
  shape.lineTo(half + 0.16, spring - 0.12);
  shape.lineTo(half, spring - 0.12);
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= 40; i++) {
    const a = (i / 40) * Math.PI,
      cusp = Math.min(0.16, width * 0.035) * Math.abs(Math.sin(a * 9));
    const px = Math.cos(a) * (half - cusp),
      py = spring + Math.sin(a) * rise - cusp * 0.65;
    shape.lineTo(px, py);
    points.push(new THREE.Vector3(px, py, 0.28));
  }
  shape.lineTo(-half, spring - 0.12);
  shape.closePath();
  const opening = new THREE.ExtrudeGeometry(shape, {
    depth: 0.52,
    bevelEnabled: true,
    bevelSize: 0.035,
    bevelThickness: 0.045,
    bevelSegments: 1,
    steps: 1,
  });
  opening.translate(0, 0, -0.26);
  put(b, "rose", opening);
  for (let layer = 0; layer < 2; layer++) {
    const carvedEdge = points.map(
      (p) =>
        new THREE.Vector3(
          p.x * (1 - layer * 0.025),
          p.y + layer * 0.12,
          p.z + layer * 0.045,
        ),
    );
    put(
      b,
      layer ? "ivory" : "pale",
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(carvedEdge),
        40,
        layer ? 0.025 : 0.065,
        4,
        false,
      ),
    );
  }
  const radius = Math.min(0.24, width * 0.07);
  for (const side of [-1, 1])
    rosette(b, side * half * 0.73, height - 0.22, 0.29, radius, 0, "ivory", 4);
  transfer(batch, b, x, y, z, r);
}

export function cornice(
  batch: Batch,
  x: number,
  z: number,
  width: number,
  depth: number,
  y: number,
) {
  box(batch, "rose", x, y, z, width, 0.32, depth);
  box(batch, "ivory", x, y + 0.22, z, width + 0.22, 0.12, depth + 0.22);
  box(batch, "rose", x, y + 0.35, z, width + 0.45, 0.13, depth + 0.45);
  box(batch, "pale", x, y + 0.46, z, width + 0.34, 0.08, depth + 0.34);
  const count = Math.max(1, Math.floor(width / 1.05));
  for (let i = 0; i < count; i++) {
    const xx = x + (i - (count - 1) / 2) * 1.05;
    for (const side of [-1, 1]) {
      rosette(
        batch,
        xx,
        y,
        z + side * (depth / 2 + 0.015),
        0.135,
        side < 0 ? Math.PI : 0,
        "ivory",
        4,
        1,
      );
      box(
        batch,
        "ivory",
        xx - 0.26,
        y - 0.24,
        z + (side * depth) / 2,
        0.14,
        0.18,
        0.18,
      );
      box(
        batch,
        "ivory",
        xx + 0.26,
        y - 0.24,
        z + (side * depth) / 2,
        0.14,
        0.18,
        0.18,
      );
    }
  }
}

/** Layered stone roof; only the small finial is metallic. */
export function dome(
  batch: Batch,
  x: number,
  y: number,
  z: number,
  r: number,
  h: number,
) {
  cyl(batch, "rose", x, y, z, r * 1.08, 0.2, 24);
  cyl(batch, "ivory", x, y + 0.13, z, r * 1.035, 0.08, 24);
  const profile: [number, number][] = [[r, 0.18]];
  const levels = 7;
  for (let i = 1; i <= levels; i++) {
    const t = i / levels,
      rr = r * Math.sqrt(Math.max(0, 1 - t * t));
    const previous = profile[profile.length - 1][0];
    profile.push(
      [previous, 0.18 + h * t - h * 0.075],
      [rr, 0.18 + h * t - h * 0.045],
      [rr, 0.18 + h * t],
    );
  }
  lathe(batch, "ivory", x, y, z, profile, 24);
  for (const ratio of [0.3, 0.58, 0.8]) {
    const rr = r * Math.sqrt(1 - ratio * ratio);
    torus(batch, "pale", x, y + 0.18 + h * ratio, z, rr, 0.025, 24);
  }
  lathe(
    batch,
    "gold",
    x,
    y + h + 0.18,
    z,
    [
      [0.16, 0],
      [0.2, 0.1],
      [0.11, 0.22],
      [0.11, 0.32],
      [0.045, 0.5],
      [0, 0.67],
    ],
    12,
  );
}

/**
 * A sculpted ceiling viewed from beneath: concentric corbelled rings, repeated
 * floral relief and a central rosette. No murti or narrative relief is invented.
 */
export function carvedCeiling(
  batch: Batch,
  x: number,
  y: number,
  z: number,
  radius: number,
) {
  const b: Batch = new Map(),
    drop = radius * 0.2;
  const profile: [number, number][] = [
    [0, -drop],
    [radius * 0.11, -drop],
    [radius * 0.15, -drop * 0.78],
    [radius * 0.28, -drop * 0.78],
    [radius * 0.31, -drop * 0.57],
    [radius * 0.48, -drop * 0.57],
    [radius * 0.52, -drop * 0.35],
    [radius * 0.7, -drop * 0.35],
    [radius * 0.74, -drop * 0.16],
    [radius, 0],
  ];
  lathe(b, "ivory", 0, 0, 0, profile, 32);
  for (const [ratio, yy] of [
    [0.13, -0.8],
    [0.29, -0.61],
    [0.5, -0.39],
    [0.73, -0.2],
    [0.97, -0.02],
  ]) {
    torus(
      b,
      "pale",
      0,
      drop * yy - 0.025,
      0,
      radius * ratio,
      radius * 0.012,
      32,
    );
  }
  for (const [ratio, count, yy, length] of [
    [0.19, 12, -0.79, 0.075],
    [0.36, 20, -0.58, 0.1],
    [0.57, 28, -0.36, 0.1],
    [0.8, 40, -0.16, 0.13],
  ]) {
    for (let i = 0; i < count; i++) {
      const petal = leafGeometry(
        radius * length,
        radius * length * 1.1,
        radius * 0.016,
      );
      petal
        .translate(0, radius * ratio, 0)
        .rotateZ((i / count) * Math.PI * 2)
        .rotateX(Math.PI / 2);
      put(b, "ivory", petal, 0, drop * yy - 0.035, 0);
    }
  }
  const central = new THREE.SphereGeometry(radius * 0.075, 12, 6).scale(
    1,
    0.45,
    1,
  );
  put(b, "pale", central, 0, -drop - radius * 0.015, 0);
  for (let i = 0; i < 8; i++) {
    const petal = leafGeometry(radius * 0.1, radius * 0.05, radius * 0.018);
    petal.rotateZ((i / 8) * Math.PI * 2).rotateX(Math.PI / 2);
    put(b, "ivory", petal, 0, -drop - radius * 0.01, 0);
  }
  transfer(batch, b, x, y, z);
}

export function lattice(
  batch: Batch,
  x: number,
  z: number,
  width: number,
  height: number,
  y: number,
  r = 0,
) {
  box(batch, "rose", x, y, z, width + 0.15, 0.14, 0.16, r);
  box(batch, "gold", x, y + height, z, width + 0.15, 0.1, 0.2, r);
  const cols = Math.floor(width / 0.36),
    rows = Math.floor(height / 0.4);
  for (let row = 0; row < rows; row++)
    for (let col = 0; col < cols; col++) {
      const offset = (col - (cols - 1) / 2) * 0.36;
      const g = new THREE.TorusGeometry(0.21, 0.027, 4, 4);
      g.rotateZ(Math.PI / 4);
      put(
        batch,
        "ivory",
        g,
        x + offset * Math.cos(r),
        y + 0.25 + row * 0.4,
        z - offset * Math.sin(r),
        r,
      );
    }
}
export function stairs(
  batch: Batch,
  x: number,
  z: number,
  width: number,
  steps: number,
  r = 0,
  y = 0,
) {
  for (let i = 0; i < steps; i++)
    box(
      batch,
      i % 2 ? "pale" : "rose",
      x + Math.sin(r) * (steps - i) * 0.4,
      y + 0.09 + i * 0.17,
      z + Math.cos(r) * (steps - i) * 0.4,
      width,
      0.18,
      0.5,
      r,
    );
}
export function lantern(
  batch: Batch,
  x: number,
  z: number,
  y: number,
  flames: THREE.Vector3[],
  bridge = false,
) {
  const mat = bridge ? "bridgeFlame" : "flame";
  cyl(batch, "gold", x, y + 0.08, z, 0.22, 0.16, 12);
  lathe(
    batch,
    "rose",
    x,
    y + 0.16,
    z,
    [
      [0.18, 0],
      [0.26, 0.1],
      [0.3, 0.15],
      [0.26, 0.2],
    ],
    16,
  );
  put(
    batch,
    mat,
    new THREE.SphereGeometry(0.085, 6, 4).scale(1, 2.2, 1),
    x,
    y + 0.44,
    z,
  );
  flames.push(new THREE.Vector3(x, y + 0.45, z));
}
export type WorldBuilt = {
  group: THREE.Group;
  flames: THREE.Vector3[];
  bridgeFlames: THREE.Vector3[];
  storyStages?: THREE.Group[];
  pool?: {
    x: number;
    z: number;
    width: number;
    depth: number;
  };
};
/** Each story-stage owns its materials so a change can dissolve safely. */
export function storyStage(batch: Batch, palette: Palette) {
  const group = new THREE.Group();
  const ownPalette: Palette = {};
  for (const name of batch.keys()) ownPalette[name] = palette[name].clone();
  finish(batch, ownPalette, group);
  group.traverse((object) => {
    if (object instanceof THREE.Mesh) object.castShadow = false;
  });
  return group;
}
