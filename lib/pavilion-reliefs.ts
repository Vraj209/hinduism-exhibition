import * as THREE from "three";

/** Original raised carving; compatible with the campus and interior material batches. */
export type ReliefBatch = Map<string, THREE.BufferGeometry[]>;
export type ReliefVariant = "hero" | "panel" | "band" | "pillar";
export type ReliefOptions = {
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  depth?: number;
  /** Rotation about the Y axis, in radians. The unrotated face points +Z. */
  rotation?: number;
  scale?: number;
  variant: ReliefVariant;
  motif?: 0 | 1 | 2;
  materials: { stone: string; recess: string; highlight: string };
};
type Role = keyof ReliefOptions["materials"];
type Piece = { role: Role; geometry: THREE.BufferGeometry };
type Pieces = Piece[];

function emit(
  pieces: Pieces,
  role: Role,
  geometry: THREE.BufferGeometry,
  x = 0,
  y = 0,
  z = 0,
) {
  geometry.translate(x, y, z);
  // Callers merge one material at a time. Keep every attribute layout compatible.
  geometry.clearGroups();
  if (!geometry.getAttribute("normal")) geometry.computeVertexNormals();
  if (!geometry.getAttribute("uv"))
    geometry.setAttribute(
      "uv",
      new THREE.BufferAttribute(
        new Float32Array(geometry.getAttribute("position").count * 2),
        2,
      ),
    );
  pieces.push({ role, geometry });
}
function extrude(
  pieces: Pieces,
  role: Role,
  shape: THREE.Shape,
  depth: number,
  z: number,
  bevel = 0.012,
  detail = 5,
) {
  emit(
    pieces,
    role,
    new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: bevel > 0,
      bevelSize: bevel,
      bevelThickness: bevel * 2,
      bevelSegments: 1,
      curveSegments: detail,
      steps: 1,
    }),
    0,
    0,
    z + bevel * 2,
  );
}
function polygon(points: [number, number][]) {
  const shape = new THREE.Shape();
  points.forEach(([x, y], index) =>
    index ? shape.lineTo(x, y) : shape.moveTo(x, y),
  );
  shape.closePath();
  return shape;
}
function roundedRect(width: number, height: number, radius: number) {
  const x = -width / 2,
    y = -height / 2,
    r = Math.min(radius, width / 2, height / 2);
  const s = new THREE.Shape();
  s.moveTo(x + r, y);
  s.lineTo(x + width - r, y);
  s.quadraticCurveTo(x + width, y, x + width, y + r);
  s.lineTo(x + width, y + height - r);
  s.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  s.lineTo(x + r, y + height);
  s.quadraticCurveTo(x, y + height, x, y + height - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  s.closePath();
  return s;
}
function offsetShape(shape: THREE.Shape, x: number, y: number) {
  return new THREE.Shape(
    shape
      .getPoints(4)
      .map((point) => new THREE.Vector2(point.x + x, point.y + y)),
  );
}
function moulding(
  pieces: Pieces,
  role: Role,
  width: number,
  height: number,
  thickness: number,
  z: number,
  depth: number,
) {
  const shape = roundedRect(width, height, 0.045);
  const inner = roundedRect(
    width - thickness * 2,
    height - thickness * 2,
    0.025,
  );
  shape.holes.push(new THREE.Path(inner.getPoints(4).reverse()));
  extrude(pieces, role, shape, depth, z, 0.008, 4);
}
function localTransform(
  pieces: Pieces,
  source: Pieces,
  x: number,
  y: number,
  sx: number,
  sy = sx,
  sz = 1,
  z = 0,
) {
  const matrix = new THREE.Matrix4().makeScale(sx, sy, sz);
  matrix.setPosition(x, y, z);
  for (const piece of source) {
    piece.geometry.applyMatrix4(matrix);
    pieces.push(piece);
  }
}
function leaf(
  pieces: Pieces,
  x: number,
  y: number,
  angle: number,
  size: number,
  z = 0.25,
) {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.quadraticCurveTo(-0.4, 0.45, 0, 1);
  s.quadraticCurveTo(0.4, 0.45, 0, 0);
  const g = new THREE.ExtrudeGeometry(s, {
    depth: 0.08,
    bevelEnabled: true,
    bevelSize: 0.03,
    bevelThickness: 0.02,
    bevelSegments: 1,
    curveSegments: 2,
    steps: 1,
  });
  g.scale(size, size, 1).rotateZ(angle);
  emit(pieces, "highlight", g, x, y, z);
}
function frame(pieces: Pieces, variant: ReliefVariant, compact = false) {
  if (compact) {
    // At frieze scale a quiet three-depth frame preserves legibility and budget.
    emit(
      pieces,
      "stone",
      new THREE.BoxGeometry(0.994, 0.994, 0.11),
      0,
      0,
      0.055,
    );
    emit(
      pieces,
      "recess",
      new THREE.BoxGeometry(0.87, 0.85, 0.045),
      0,
      0,
      0.13,
    );
    for (const side of [-1, 1]) {
      emit(
        pieces,
        "highlight",
        new THREE.BoxGeometry(0.91, 0.025, 0.07),
        0,
        side * 0.44,
        0.18,
      );
      emit(
        pieces,
        "highlight",
        new THREE.BoxGeometry(0.025, 0.855, 0.07),
        side * 0.4425,
        0,
        0.18,
      );
    }
    return;
  }
  extrude(
    pieces,
    "stone",
    roundedRect(0.97, 0.97, 0.055),
    0.09,
    0.025,
    0.012,
    4,
  );
  extrude(
    pieces,
    "recess",
    roundedRect(0.85, 0.83, 0.025),
    0.025,
    0.13,
    0.005,
    3,
  );
  moulding(pieces, "stone", 0.955, 0.945, 0.06, 0.11, 0.11);
  moulding(pieces, "highlight", 0.835, 0.815, 0.018, 0.18, 0.04);
  if (variant === "hero" || variant === "panel") {
    for (const x of [-0.445, 0.445])
      for (const y of [-0.43, 0.43])
        leaf(pieces, x, y, x * y > 0 ? -0.7 : 0.7, 0.052, 0.235);
  }
}

/** A real hollow vessel, with interior, raised lip and a flattened relief back. */
function bowl(
  pieces: Pieces,
  x = 0,
  y = -0.08,
  size = 1,
  role: Role = "stone",
  simple = false,
) {
  const profile = [
    [0, 0],
    [0.22, 0],
    [0.32, 0.08],
    [0.48, 0.31],
    [0.5, 0.37],
    [0.46, 0.4],
    [0.42, 0.33],
    [0.29, 0.12],
    [0, 0.09],
  ].map(([a, b]) => new THREE.Vector2(a, b));
  const g = new THREE.LatheGeometry(profile, simple ? 10 : 20);
  g.scale(0.68 * size, 0.67 * size, 0.5 * size);
  emit(pieces, role, g, x, y, 0.5);
  const lip = new THREE.TorusGeometry(
    0.48,
    0.025,
    simple ? 3 : 5,
    simple ? 12 : 24,
  );
  lip.rotateX(Math.PI / 2).scale(0.68 * size, size, 0.5 * size);
  emit(pieces, "highlight", lip, x, y + 0.245 * size, 0.5);
}
function foldedCloth(pieces: Pieces, simple = false) {
  const layers = simple ? 2 : 3;
  for (let i = 0; i < layers; i++) {
    const s = polygon([
      [-0.36 + i * 0.022, -0.29 + i * 0.042],
      [0.32 - i * 0.025, -0.31 + i * 0.042],
      [0.36 - i * 0.025, -0.18 + i * 0.042],
      [-0.29 + i * 0.022, -0.15 + i * 0.042],
    ]);
    extrude(
      pieces,
      i % 2 ? "highlight" : "stone",
      s,
      0.045,
      0.28 + i * 0.09,
      0.009,
      2,
    );
  }
  if (!simple) {
    for (let i = 0; i < 5; i++) {
      const shape = polygon([
        [-0.29 + i * 0.12, -0.3],
        [-0.26 + i * 0.12, -0.3],
        [-0.27 + i * 0.12, -0.36],
        [-0.3 + i * 0.12, -0.355],
      ]);
      extrude(pieces, "highlight", shape, 0.035, 0.32, 0.004, 2);
    }
  }
}
function rhythm(pieces: Pieces, simple: boolean) {
  const count = simple ? 3 : 5;
  for (let i = 0; i < count; i++) {
    const height = 0.22 + 0.18 * Math.sin(((i + 0.5) / count) * Math.PI);
    const shape = offsetShape(
      roundedRect(0.065, height, 0.03),
      (i - (count - 1) / 2) * 0.12,
      -0.02,
    );
    extrude(
      pieces,
      i % 2 ? "highlight" : "stone",
      shape,
      0.25 + (i % 2) * 0.1,
      0.3,
      0.012,
      4,
    );
  }
  const wave = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.32, -0.29, 0.52),
    new THREE.Vector3(-0.12, -0.24, 0.57),
    new THREE.Vector3(0.12, -0.29, 0.6),
    new THREE.Vector3(0.32, -0.24, 0.52),
  ]);
  emit(pieces, "highlight", new THREE.TubeGeometry(wave, 16, 0.022, 5, false));
}
function everyday(pieces: Pieces, motif: number, simple: boolean) {
  if (motif === 2) return rhythm(pieces, simple);
  foldedCloth(pieces, simple);
  if (motif === 0) bowl(pieces, 0, -0.12, 0.9, "stone", simple);
  else {
    const drape = polygon([
      [-0.24, -0.1],
      [-0.22, 0.3],
      [0.07, 0.28],
      [0.22, 0.09],
      [0.1, -0.15],
    ]);
    extrude(pieces, "stone", drape, 0.2, 0.38, 0.018, 3);
    const fold = polygon([
      [-0.02, 0.28],
      [0.07, 0.28],
      [0.22, 0.09],
      [0.08, 0.05],
    ]);
    extrude(pieces, "highlight", fold, 0.07, 0.6, 0.008, 2);
  }
}
function portal(
  pieces: Pieces,
  width = 0.62,
  height = 0.62,
  z = 0.25,
  role: Role = "stone",
) {
  const h = width / 2,
    lower = -0.3,
    spring = lower + height * 0.48,
    top = lower + height;
  const s = new THREE.Shape();
  s.moveTo(-h, lower);
  s.lineTo(-h, spring);
  s.quadraticCurveTo(-h, top - 0.09, 0, top);
  s.quadraticCurveTo(h, top - 0.09, h, spring);
  s.lineTo(h, lower);
  s.lineTo(h - 0.065, lower);
  s.lineTo(h - 0.065, spring);
  s.quadraticCurveTo(h - 0.065, top - 0.14, 0, top - 0.075);
  s.quadraticCurveTo(-h + 0.065, top - 0.14, -h + 0.065, spring);
  s.lineTo(-h + 0.065, lower);
  s.closePath();
  extrude(pieces, role, s, 0.18, z, 0.012, 5);
}
function wovenLinks(pieces: Pieces, simple: boolean) {
  for (const side of [-1, 1]) {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 32; i++) {
      const a = (i / 32) * Math.PI * 2;
      const xx = Math.cos(a) * 0.205,
        yy = Math.sin(a) * 0.14;
      const twist = side * 0.52;
      points.push(
        new THREE.Vector3(
          xx * Math.cos(twist) - yy * Math.sin(twist) + side * 0.105,
          xx * Math.sin(twist) + yy * Math.cos(twist),
          0.48 + Math.sin(a * 2) * 0.105,
        ),
      );
    }
    emit(
      pieces,
      side < 0 ? "stone" : "highlight",
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(points, true),
        simple ? 16 : 32,
        0.049,
        simple ? 4 : 6,
        true,
      ),
    );
  }
}
function tradition(pieces: Pieces, motif: number, simple: boolean) {
  if (motif === 2) {
    portal(pieces, 0.7, 0.67, 0.24);
    portal(pieces, 0.48, 0.54, 0.45, "highlight");
    return;
  }
  wovenLinks(pieces, simple);
  if (motif === 0 && !simple) portal(pieces, 0.73, 0.69, 0.22);
}
function raisedPath(pieces: Pieces, simple: boolean, role: Role = "highlight") {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.12, -0.32, 0),
    new THREE.Vector3(0.13, -0.2, 0),
    new THREE.Vector3(0.02, -0.02, 0),
    new THREE.Vector3(-0.12, 0.14, 0),
    new THREE.Vector3(0.08, 0.28, 0),
  ]);
  const left: [number, number][] = [],
    right: [number, number][] = [];
  const steps = simple ? 10 : 24;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps,
      p = curve.getPoint(t),
      tangent = curve.getTangent(t);
    left.push([p.x - tangent.y * 0.036, p.y + tangent.x * 0.036]);
    right.push([p.x + tangent.y * 0.036, p.y - tangent.x * 0.036]);
  }
  extrude(
    pieces,
    role,
    polygon([...left, ...right.reverse()]),
    0.14,
    0.45,
    0.01,
    2,
  );
}
function journey(pieces: Pieces, motif: number, simple: boolean) {
  if (motif !== 1) portal(pieces, 0.66, 0.67, 0.25);
  if (motif !== 2) raisedPath(pieces, simple);
  else portal(pieces, 0.46, 0.54, 0.47, "highlight");
}
function flame(pieces: Pieces, x = 0, y = 0.05, size = 1, simple = false) {
  const g = new THREE.LatheGeometry(
    [
      [0, 0],
      [0.085, 0.025],
      [0.13, 0.12],
      [0.105, 0.24],
      [0.055, 0.37],
      [0, 0.52],
    ].map(([r, h]) => new THREE.Vector2(r, h)),
    simple ? 8 : 14,
  );
  const position = g.getAttribute("position");
  for (let i = 0; i < position.count; i++) {
    const yy = position.getY(i);
    position.setX(i, position.getX(i) + 0.07 * Math.sin(yy * 7));
  }
  g.computeVertexNormals();
  g.scale(0.8 * size, 0.66 * size, 0.7 * size);
  emit(pieces, "stone", g, x, y, 0.57);
  const inner = new THREE.SphereGeometry(1, simple ? 6 : 8, simple ? 3 : 5)
    .scale(0.04 * size, 0.1 * size, 0.06 * size)
    .rotateZ(-0.28);
  emit(pieces, "highlight", inner, x + 0.018 * size, y + 0.12 * size, 0.65);
}
function festival(pieces: Pieces, motif: number, simple: boolean) {
  if (motif === 2) {
    wovenLinks(pieces, simple);
    return;
  }
  bowl(pieces, 0, -0.23, 0.86, "stone", simple);
  flame(pieces, motif === 1 ? 0.07 : 0, -0.01, motif === 1 ? 0.78 : 1, simple);
  // A physically modelled wick and pinched pouring tip distinguish the divo.
  const wick = new THREE.CapsuleGeometry(0.018, 0.075, 2, 6).rotateZ(-0.42);
  emit(pieces, "highlight", wick, 0.02, 0.015, 0.57);
  const tip = new THREE.SphereGeometry(1, 8, 4).scale(0.09, 0.035, 0.08);
  emit(pieces, "stone", tip, 0.275, 0.02, 0.5);
  if (!simple && motif === 0) {
    for (const side of [-1, 1])
      leaf(pieces, side * 0.27, -0.31, side * -0.8, 0.12, 0.32);
  }
}
/** An open sculpted palm, individual curled fingers, thumb and a wrist. */
function helpingHand(pieces: Pieces, mirror = false, simple = false) {
  const hand: Pieces = [];
  const palm = new THREE.SphereGeometry(
    1,
    simple ? 8 : 12,
    simple ? 4 : 7,
  ).scale(0.23, 0.095, 0.17);
  emit(hand, "stone", palm, -0.035, -0.18, 0.49);
  const wrist = new THREE.CapsuleGeometry(
    0.07,
    0.17,
    simple ? 1 : 3,
    simple ? 5 : 7,
  )
    .rotateZ(Math.PI / 2)
    .scale(1, 1, 1.25);
  emit(hand, "stone", wrist, -0.27, -0.19, 0.47);
  for (let i = 0; i < (simple ? 2 : 4); i++) {
    const finger = new THREE.CapsuleGeometry(
      simple ? 0.029 : 0.023,
      [0.13, 0.17, 0.16, 0.12][i],
      simple ? 1 : 3,
      simple ? 4 : 6,
    ).rotateZ(-1.04 - i * 0.075);
    // Fan fingers in the face plane: depth-only separation disappears in relief.
    emit(
      hand,
      "highlight",
      finger,
      0.16 + i * 0.012,
      -0.19 + i * (simple ? 0.065 : 0.044),
      0.45 + i * 0.035,
    );
  }
  const thumb = new THREE.CapsuleGeometry(
    0.038,
    0.145,
    simple ? 1 : 3,
    simple ? 5 : 7,
  ).rotateZ(-0.6);
  emit(hand, "stone", thumb, -0.015, -0.075, 0.66);
  if (mirror)
    for (const piece of hand)
      piece.geometry.rotateY(Math.PI).translate(0, 0, 0.98);
  pieces.push(...hand);
}
function kindness(pieces: Pieces, motif: number, simple: boolean) {
  helpingHand(pieces, false, simple);
  if (motif === 0) bowl(pieces, 0.045, -0.045, 0.59, "highlight", simple);
  if (motif === 1) {
    const second: Pieces = [];
    helpingHand(second, true, true);
    localTransform(pieces, second, 0.05, 0.22, 0.8, 0.8, 0.9, 0.02);
  }
  if (motif === 2) {
    const drop = new THREE.LatheGeometry(
      [
        [0, 0],
        [0.09, 0.06],
        [0.1, 0.15],
        [0.055, 0.27],
        [0, 0.36],
      ].map(([r, h]) => new THREE.Vector2(r, h)),
      12,
    ).scale(0.8, 0.8, 0.7);
    emit(pieces, "highlight", drop, 0.06, 0.005, 0.5);
  }
}
function pageWedge(
  pieces: Pieces,
  side: number,
  role: Role,
  zOffset = 0,
  grow = 0,
) {
  const inner = side * 0.015,
    outer = side * (0.31 + grow),
    y = 0.21 + grow;
  const positions = [
    inner,
    -y,
    0.69 + zOffset,
    outer,
    -y + 0.03,
    0.43 + zOffset,
    outer,
    y,
    0.43 + zOffset,
    inner,
    y - 0.035,
    0.69 + zOffset,
    inner,
    -y,
    0.62 + zOffset,
    outer,
    -y + 0.03,
    0.36 + zOffset,
    outer,
    y,
    0.36 + zOffset,
    inner,
    y - 0.035,
    0.62 + zOffset,
  ];
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setIndex([
    0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6, 0, 4, 5, 0, 5, 1, 1, 5, 6, 1, 6, 2, 2,
    6, 7, 2, 7, 3, 3, 7, 4, 3, 4, 0,
  ]);
  if (side < 0) {
    const index = g.index!;
    for (let i = 0; i < index.count; i += 3) {
      const a = index.getX(i);
      index.setX(i, index.getX(i + 2));
      index.setX(i + 2, a);
    }
  }
  g.computeVertexNormals();
  emit(pieces, role, g);
}
function openBook(pieces: Pieces, simple: boolean) {
  for (const side of [-1, 1]) {
    pageWedge(pieces, side, "stone", -0.04, 0.018);
    pageWedge(pieces, side, "highlight");
    if (!simple)
      for (let i = 0; i < 3; i++) {
        const edge = new THREE.CatmullRomCurve3([
          new THREE.Vector3(side * 0.02, -0.21, 0.64 - i * 0.018),
          new THREE.Vector3(side * 0.14, -0.2, 0.53 - i * 0.018),
          new THREE.Vector3(side * 0.31, -0.18, 0.4 - i * 0.018),
        ]);
        emit(pieces, "stone", new THREE.TubeGeometry(edge, 6, 0.006, 3, false));
      }
  }
  emit(
    pieces,
    "stone",
    new THREE.CylinderGeometry(0.023, 0.023, 0.41, 8),
    0,
    -0.015,
    0.67,
  );
}
function mandir(pieces: Pieces, simple: boolean) {
  const body = polygon([
    [-0.25, -0.25],
    [0.25, -0.25],
    [0.25, 0.025],
    [0.17, 0.025],
    [0.13, 0.12],
    [0.1, 0.24],
    [0.06, 0.25],
    [0, 0.4],
    [-0.06, 0.25],
    [-0.1, 0.24],
    [-0.13, 0.12],
    [-0.17, 0.025],
    [-0.25, 0.025],
  ]);
  extrude(pieces, "stone", body, 0.23, 0.3, 0.012, 3);
  const doorway = offsetShape(roundedRect(0.13, 0.19, 0.06), 0, -0.14);
  extrude(pieces, "recess", doorway, 0.03, 0.57, 0.004, 4);
  for (const yy of [0.055, 0.13, 0.205]) {
    const w = 0.34 - yy * 0.75;
    const course = offsetShape(roundedRect(w, 0.03, 0.006), 0, yy);
    extrude(pieces, "highlight", course, 0.055, 0.55, 0.004, 2);
  }
  if (!simple)
    for (const xx of [-0.18, 0.18]) {
      const shaft = new THREE.CylinderGeometry(0.021, 0.026, 0.21, 8);
      emit(pieces, "highlight", shaft, xx, -0.12, 0.59);
    }
}
function pillars(
  pieces: Pieces,
  motif: number,
  simple: boolean,
  hero: boolean,
) {
  if (!hero) {
    if (motif === 0) return openBook(pieces, simple);
    if (motif === 1) return mandir(pieces, simple);
    portal(pieces, 0.62, 0.65, 0.25);
    raisedPath(pieces, simple);
    return;
  }
  const book: Pieces = [],
    building: Pieces = [],
    path: Pieces = [];
  openBook(book, true);
  mandir(building, true);
  raisedPath(path, true);
  localTransform(pieces, book, -0.55, 0.045, 0.68, 0.68, 0.85, 0.02);
  localTransform(pieces, building, 0, 0.06, 0.72, 0.72, 0.9, 0.01);
  localTransform(pieces, path, 0.55, 0.065, 0.7, 0.7, 0.95);
  for (const xx of [-0.55, 0, 0.55]) {
    const g = new THREE.CylinderGeometry(0.035, 0.045, 0.17, 8);
    emit(pieces, "stone", g, xx, -0.25, 0.45);
  }
  const base = offsetShape(roundedRect(1.5, 0.06, 0.015), 0, -0.35);
  extrude(pieces, "highlight", base, 0.18, 0.3, 0.008, 3);
}
function subject(
  section: number,
  motif: number,
  simple: boolean,
  hero: boolean,
): Pieces {
  const pieces: Pieces = [];
  if (section === 1) everyday(pieces, motif, simple);
  else if (section === 2) tradition(pieces, motif, simple);
  else if (section === 3) journey(pieces, motif, simple);
  else if (section === 4) festival(pieces, motif, simple);
  else if (section === 5) kindness(pieces, motif, simple);
  else pillars(pieces, motif, simple, hero);
  return pieces;
}

/** Raised silhouettes for distant drum bands; no tiny geometry is wasted on faces. */
function architecturalSubject(section: number, motif: number): Pieces {
  const pieces: Pieces = [];
  const carve = (shape: THREE.Shape, role: Role = "stone", z = 0.28) =>
    extrude(pieces, role, shape, 0.18, z, 0.006, 1);
  const vessel = (size = 1, x = 0, y = -0.18) => {
    const profile = [
      [0, 0],
      [0.2, 0],
      [0.43, 0.32],
      [0.39, 0.36],
      [0.31, 0.25],
      [0.14, 0.07],
      [0, 0.07],
    ];
    const g = new THREE.LatheGeometry(
      profile.map(([r, h]) => new THREE.Vector2(r, h)),
      8,
    );
    g.scale(size, size, size * 0.65);
    emit(pieces, "highlight", g, x, y, 0.47);
  };
  const route = () =>
    carve(
      polygon([
        [-0.18, -0.32],
        [0.07, -0.14],
        [-0.13, 0.13],
        [0.07, 0.32],
        [0.16, 0.27],
        [-0.02, 0.12],
        [0.18, -0.17],
        [-0.1, -0.37],
      ]),
      "highlight",
    );
  if (section === 1) {
    if (motif === 2) {
      for (let i = 0; i < 3; i++)
        emit(
          pieces,
          "highlight",
          new THREE.BoxGeometry(0.09, 0.23 + (i === 1 ? 0.2 : 0), 0.2),
          (i - 1) * 0.17,
          0,
          0.4,
        );
    } else {
      carve(
        polygon([
          [-0.4, -0.27],
          [0.36, -0.27],
          [0.4, -0.16],
          [-0.35, -0.12],
        ]),
      );
      if (motif === 0) vessel(0.8, 0, -0.12);
      else
        carve(
          polygon([
            [-0.21, -0.08],
            [-0.2, 0.27],
            [0.07, 0.25],
            [0.23, 0.04],
            [0.12, -0.14],
          ]),
          "highlight",
          0.42,
        );
    }
  } else if (section === 2) {
    for (const side of [-1, 1]) {
      const g = new THREE.TorusGeometry(0.2, 0.048, 3, 8);
      g.scale(1, 0.7, 1)
        .rotateZ(side * 0.45)
        .rotateY(side * 0.28);
      emit(pieces, side < 0 ? "stone" : "highlight", g, side * 0.1, 0, 0.43);
    }
  } else if (section === 3) {
    route();
  } else if (section === 4) {
    vessel(0.8, 0, -0.23);
    const g = new THREE.LatheGeometry(
      [
        [0, 0],
        [0.09, 0.05],
        [0.11, 0.16],
        [0.035, 0.33],
        [0, 0.43],
      ].map(([r, h]) => new THREE.Vector2(r, h)),
      6,
    );
    emit(pieces, "stone", g, 0, 0, 0.48);
  } else if (section === 5) {
    carve(
      polygon([
        [-0.39, -0.23],
        [-0.39, -0.11],
        [-0.16, -0.11],
        [-0.04, 0.04],
        [0.01, 0.025],
        [-0.04, -0.1],
        [0.24, -0.015],
        [0.28, 0.025],
        [0.32, -0.005],
        [0.28, -0.1],
        [0.13, -0.2],
        [-0.08, -0.25],
      ]),
    );
    vessel(0.45, 0.04, 0.045);
  } else if (motif === 0) {
    openBook(pieces, true);
  } else if (motif === 1) {
    carve(
      polygon([
        [-0.25, -0.24],
        [0.25, -0.24],
        [0.25, 0.01],
        [0.15, 0.01],
        [0.11, 0.21],
        [0, 0.4],
        [-0.11, 0.21],
        [-0.15, 0.01],
        [-0.25, 0.01],
      ]),
    );
    emit(
      pieces,
      "recess",
      new THREE.BoxGeometry(0.1, 0.17, 0.02),
      0,
      -0.15,
      0.51,
    );
  } else route();
  return pieces;
}

/** Fit object proportions in physical XY space independently from the frame. */
function fitSubject(
  target: Pieces,
  source: Pieces,
  frameWidth: number,
  frameHeight: number,
  cellWidth: number,
  cellHeight: number,
  x = 0,
  y = 0,
) {
  const bounds = new THREE.Box3();
  for (const { geometry } of source) {
    geometry.computeBoundingBox();
    bounds.union(geometry.boundingBox!);
  }
  const size = bounds.getSize(new THREE.Vector3()),
    centre = bounds.getCenter(new THREE.Vector3());
  const fit = Math.min(cellWidth / size.x, cellHeight / size.y);
  for (const piece of source) piece.geometry.translate(-centre.x, -centre.y, 0);
  localTransform(target, source, x, y, fit / frameWidth, fit / frameHeight);
}

/**
 * Adds a physically raised, bevelled stone composition to existing batches.
 * The rear-plane centre is (x,y,z); exact unrotated bounds include all bevels.
 * References and source boundaries: docs/design/thematic-relief-plan.md.
 */
export function addThematicRelief(
  batch: ReliefBatch,
  sectionId: number,
  options: ReliefOptions,
) {
  const width = Math.max(0.01, options.width),
    height = Math.max(0.01, options.height);
  const depth = Math.max(
    0.005,
    options.depth ?? Math.min(width, height) * 0.12,
  );
  const section = Math.max(1, Math.min(6, Math.floor(sectionId))),
    motif = options.motif ?? 0;
  const pieces: Pieces = [];
  const compact =
    (options.variant === "band" && height <= 0.35) ||
    (options.variant === "pillar" && width <= 0.35);
  frame(pieces, options.variant, compact);
  if (options.variant === "band") {
    const count = compact
      ? 2
      : Math.max(3, Math.min(6, Math.round((width / height) * 0.55)));
    for (let i = 0; i < count; i++)
      fitSubject(
        pieces,
        compact
          ? architecturalSubject(section, (motif + i) % 3)
          : subject(section, (motif + i) % 3, true, false),
        width,
        height,
        (width * 0.7) / count,
        height * 0.64,
        ((i - (count - 1) / 2) * 0.78) / count,
      );
  } else if (options.variant === "pillar") {
    for (let i = 0; i < (compact ? 1 : 2); i++)
      fitSubject(
        pieces,
        compact
          ? architecturalSubject(section, motif)
          : subject(section, (motif + i) % 3, true, false),
        width,
        height,
        width * 0.7,
        height * (compact ? 0.7 : 0.3),
        0,
        compact ? 0 : i === 0 ? 0.2 : -0.2,
      );
  } else {
    fitSubject(
      pieces,
      subject(section, motif, false, options.variant === "hero"),
      width,
      height,
      width * 0.76,
      height * 0.7,
    );
  }
  const bounds = new THREE.Box3();
  for (const { geometry } of pieces) {
    geometry.computeBoundingBox();
    bounds.union(geometry.boundingBox!);
  }
  const size = bounds.getSize(new THREE.Vector3()),
    centre = bounds.getCenter(new THREE.Vector3());
  const normalize = new THREE.Matrix4().makeTranslation(
    -centre.x,
    -centre.y,
    -bounds.min.z,
  );
  const sizeMatrix = new THREE.Matrix4().makeScale(
    width / size.x,
    height / size.y,
    depth / size.z,
  );
  normalize.premultiply(sizeMatrix);
  const uniform = options.scale ?? 1;
  const transform = new THREE.Matrix4().compose(
    new THREE.Vector3(options.x, options.y, options.z),
    new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      options.rotation ?? 0,
    ),
    new THREE.Vector3(uniform, uniform, uniform),
  );
  normalize.premultiply(transform);
  let triangles = 0;
  for (const { role, geometry } of pieces) {
    geometry.applyMatrix4(normalize);
    triangles +=
      (geometry.index?.count ?? geometry.getAttribute("position").count) / 3;
    const key = options.materials[role],
      target = batch.get(key) ?? [];
    target.push(geometry);
    batch.set(key, target);
  }
  return {
    triangles,
    width: width * uniform,
    height: height * uniform,
    depth: depth * uniform,
  };
}
