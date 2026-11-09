import { campusLayout, pavilions } from "./campus";
import {
  campusBenches,
  campusFlowerBeds,
  campusGroveBeds,
  campusPromenades,
  campusTrees,
  CAMPUS_PROMENADE_SURFACE,
  pavilionRamp,
  pavilionRampSurface,
} from "./campus-obstacles";

export type WalkPoint = { x: number; y: number; z: number };
type GroundPoint = { x: number; z: number };
type Rect = { x: number; z: number; halfX: number; halfZ: number };

/** Approximately half a metre of clearance, in the calibrated scene scale. */
export const CAMPUS_WALKER_RADIUS = 0.16;
const footprint = Array.from({ length: 12 }, (_, i) => ({
  x: Math.cos(i * Math.PI / 6) * CAMPUS_WALKER_RADIUS,
  z: Math.sin(i * Math.PI / 6) * CAMPUS_WALKER_RADIUS,
}));
const pavilionFrames = pavilions.map((p) => ({ ...p, cos: Math.cos(p.rotation), sin: Math.sin(p.rotation) }));
const rectangles: Rect[] = [
  // Include the stone foundations, coping and raised soil, not just the water.
  { x: 0, z: -3, halfX: 2.45, halfZ: 26.35 },
  ...campusFlowerBeds.map(({ x, z }) => ({ x, z, halfX: 1.425, halfZ: 3.125 })),
  ...campusGroveBeds.map(({ x, z, radiusX, radiusZ }) => ({ x, z, halfX: radiusX, halfZ: radiusZ })),
  ...[-8.8, 8.8].map((x) => ({ x, z: 0, halfX: 0.19, halfZ: 32.75 })),
  ...[-5.125, 5.125].map((x) => ({ x, z: -32.75, halfX: 3.725, halfZ: 0.19 })),
  ...[-5.8, 5.8].map((x) => ({ x, z: 32.75, halfX: 2.95, halfZ: 0.19 })),
  ...campusBenches.map(({ x, z }) => ({ x, z, halfX: 0.1, halfZ: 0.325 })),
  ...[-1, 1].flatMap((side) => Array.from({ length: 8 }, (_, i) => ({ x: side * 9.1, z: -30 + i * 8, halfX: 0.06, halfZ: 0.06 }))),
];
const circles = [
  ...campusLayout.sideFountains.map(({ x, z, radius }) => ({ x, z, radius: radius + 0.03 })),
  // The tree's raised planting disk is wider than its trunk.
  ...campusTrees.map(({ x, z, scale }) => ({ x, z, radius: 0.55 * scale })),
];

function inRect(x: number, z: number, minX: number, maxX: number, minZ: number, maxZ: number) {
  return x >= minX && x <= maxX && z >= minZ && z <= maxZ;
}

/** The union of visible paving, before the visitor's footprint is considered. */
function rawSurface(x: number, z: number): number | null {
  if (x < -22.7 || x > 22.7 || z < -35.9 || z > 54.7) return null;
  for (const p of pavilionFrames) {
    const dx = x - p.position[0], dz = z - p.position[2];
    const localX = p.cos * dx - p.sin * dz;
    const localZ = p.sin * dx + p.cos * dz;
    if (Math.abs(localX) <= pavilionRamp.width / 2 && localZ >= pavilionRamp.back && localZ <= pavilionRamp.front)
      return pavilionRampSurface(localZ);
    // Only the center portal corridor crosses the plinth/stairs. Side walls,
    // stair cheeks, columns and all other building interiors stay inaccessible.
    if (Math.abs(localX) <= 4.45 && localZ >= -3.85 && localZ <= 3.85) return null;
    if (Math.abs(localX) <= 1.72 && localZ >= 3.25 && localZ <= 5.45) return null;
    if (Math.abs(localX) <= 1.72 && localZ >= pavilionRamp.front && localZ <= 7) return 0.055;
  }
  for (const path of campusPromenades)
    if (Math.abs(x - path.x) <= path.width / 2 && Math.abs(z - path.z) <= path.depth / 2)
      return CAMPUS_PROMENADE_SURFACE;
  if (inRect(x, z, -22.7, 22.7, 33, 54.7)) return 0.02;
  if (inRect(Math.abs(x), z, 9.65, 13.35, -34.9, 36.9)) return 0.02;
  if (inRect(x, z, -13.3, 13.3, -35.9, -32.1) || inRect(x, z, -13.3, 13.3, 33, 36.9)) return 0.02;
  return null;
}

function hitsObstacle(x: number, z: number) {
  const radiusSq = CAMPUS_WALKER_RADIUS ** 2;
  for (const rect of rectangles) {
    const dx = Math.max(0, Math.abs(x - rect.x) - rect.halfX);
    const dz = Math.max(0, Math.abs(z - rect.z) - rect.halfZ);
    if (dx * dx + dz * dz <= radiusSq) return true;
  }
  for (const circle of circles)
    if ((x - circle.x) ** 2 + (z - circle.z) ** 2 <= (circle.radius + CAMPUS_WALKER_RADIUS) ** 2) return true;
  return false;
}

/** Returns the walking surface at the visitor's feet, never their eye height. */
export function walkSurfaceAt(x: number, z: number): number | null {
  if (!Number.isFinite(x) || !Number.isFinite(z)) return null;
  const y = rawSurface(x, z);
  if (y === null || hitsObstacle(x, z)) return null;
  for (const offset of footprint) {
    const edge = rawSurface(x + offset.x, z + offset.z);
    // A step of a few centimetres at a paving junction is fine. This rejects
    // walking off the raised ramp's sides onto the lower stairs or promenade.
    if (edge === null || Math.abs(edge - y) > 0.08) return null;
  }
  return y;
}

export function isCampusWalkable(x: number, z: number) {
  return walkSurfaceAt(x, z) !== null;
}

function pointAt(x: number, z: number): WalkPoint | null {
  const y = walkSurfaceAt(x, z);
  return y === null ? null : { x, y, z };
}

/** A small near-edge tap may snap to paving; large invalid targets never do. */
export function nearestWalkable(point: GroundPoint, maxDistance = 0.8): WalkPoint | null {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.z) || !Number.isFinite(maxDistance) || maxDistance < 0) return null;
  const exact = pointAt(point.x, point.z);
  if (exact) return exact;
  const limit = Math.min(maxDistance, 8);
  for (let radius = Math.min(0.1, limit); radius <= limit + 0.000001 && radius > 0; radius = Math.min(radius + 0.1, limit)) {
    const samples = Math.max(12, Math.ceil(2 * Math.PI * radius / 0.1));
    for (let i = 0; i < samples; i++) {
      const angle = i * 2 * Math.PI / samples;
      const candidate = pointAt(point.x + Math.cos(angle) * radius, point.z + Math.sin(angle) * radius);
      if (candidate) return candidate;
    }
    if (radius === limit) break;
  }
  return null;
}

const SWEEP_STEP = 0.06;
function segmentIsClear(from: GroundPoint, to: GroundPoint) {
  const distance = Math.hypot(to.x - from.x, to.z - from.z);
  const steps = Math.max(1, Math.ceil(distance / SWEEP_STEP));
  for (let i = 0; i <= steps; i++)
    if (!isCampusWalkable(from.x + (to.x - from.x) * i / steps, from.z + (to.z - from.z) * i / steps)) return false;
  return true;
}

/** Substeps prevent tunnelling during a delayed frame; blocked motion slides. */
export function moveOnCampus(from: WalkPoint, dx: number, dz: number): WalkPoint {
  if (!Number.isFinite(dx) || !Number.isFinite(dz) || !isCampusWalkable(from.x, from.z)) return { ...from };
  const distance = Math.hypot(dx, dz);
  if (!distance) return pointAt(from.x, from.z)!;
  // Campus-sized requests are still swept rather than teleporting to an endpoint.
  const steps = Math.ceil(distance / SWEEP_STEP);
  let point = pointAt(from.x, from.z)!;
  const stepX = dx / steps, stepZ = dz / steps;
  for (let i = 0; i < steps; i++) {
    const forward = pointAt(point.x + stepX, point.z + stepZ);
    if (forward) { point = forward; continue; }
    const axes = Math.abs(stepX) >= Math.abs(stepZ) ? [[stepX, 0], [0, stepZ]] : [[0, stepZ], [stepX, 0]];
    for (const [x, z] of axes) {
      const sliding = pointAt(point.x + x, point.z + z);
      if (sliding) point = sliding;
    }
  }
  return point;
}

const GRID_STEP = 0.25;
const GRID_MIN_X = -23, GRID_MIN_Z = -36;
const GRID_WIDTH = 185, GRID_DEPTH = 365;
let grid: Float32Array | undefined;
function getGrid() {
  if (grid) return grid;
  grid = new Float32Array(GRID_WIDTH * GRID_DEPTH);
  for (let row = 0; row < GRID_DEPTH; row++) {
    for (let column = 0; column < GRID_WIDTH; column++) {
      const y = walkSurfaceAt(GRID_MIN_X + column * GRID_STEP, GRID_MIN_Z + row * GRID_STEP);
      grid[row * GRID_WIDTH + column] = y ?? NaN;
    }
  }
  return grid;
}
function gridPoint(index: number): GroundPoint {
  return { x: GRID_MIN_X + index % GRID_WIDTH * GRID_STEP, z: GRID_MIN_Z + Math.floor(index / GRID_WIDTH) * GRID_STEP };
}
function gridAnchor(point: GroundPoint, surfaces: Float32Array) {
  const column = Math.round((point.x - GRID_MIN_X) / GRID_STEP);
  const row = Math.round((point.z - GRID_MIN_Z) / GRID_STEP);
  let best = -1, bestDistance = Infinity;
  for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) {
    const x = column + dx, z = row + dz;
    if (x < 0 || x >= GRID_WIDTH || z < 0 || z >= GRID_DEPTH) continue;
    const index = z * GRID_WIDTH + x;
    if (Number.isNaN(surfaces[index])) continue;
    const candidate = gridPoint(index);
    const distance = Math.hypot(candidate.x - point.x, candidate.z - point.z);
    if (distance < bestDistance && segmentIsClear(point, candidate)) { bestDistance = distance; best = index; }
  }
  return best;
}

class MinHeap {
  private items: { index: number; score: number }[] = [];
  get length() { return this.items.length; }
  push(index: number, score: number) {
    const item = { index, score };
    let at = this.items.length;
    this.items.push(item);
    while (at > 0) {
      const parent = (at - 1) >> 1;
      if (this.items[parent].score <= score) break;
      this.items[at] = this.items[parent]; at = parent;
    }
    this.items[at] = item;
  }
  pop() {
    const result = this.items[0].index;
    const last = this.items.pop()!;
    if (!this.items.length) return result;
    let at = 0;
    while (at * 2 + 1 < this.items.length) {
      let child = at * 2 + 1;
      if (child + 1 < this.items.length && this.items[child + 1].score < this.items[child].score) child++;
      if (this.items[child].score >= last.score) break;
      this.items[at] = this.items[child]; at = child;
    }
    this.items[at] = last;
    return result;
  }
}

/** Cached quarter-unit A*. Both endpoints and every simplified segment are
 * checked against the same clearance predicate used by manual movement. */
export function findCampusPath(start: GroundPoint, target: GroundPoint): WalkPoint[] | null {
  const first = pointAt(start.x, start.z), last = pointAt(target.x, target.z);
  if (!first || !last) return null;
  if (segmentIsClear(first, last)) return [first, last];
  const surfaces = getGrid();
  const source = gridAnchor(first, surfaces), destination = gridAnchor(last, surfaces);
  if (source < 0 || destination < 0) return null;
  const costs = new Float64Array(surfaces.length).fill(Infinity);
  const previous = new Int32Array(surfaces.length).fill(-1);
  const closed = new Uint8Array(surfaces.length);
  const queue = new MinHeap();
  costs[source] = 0;
  queue.push(source, 0);
  let reached = false;
  while (queue.length) {
    const current = queue.pop();
    if (closed[current]) continue;
    if (current === destination) { reached = true; break; }
    closed[current] = 1;
    const x = current % GRID_WIDTH, z = Math.floor(current / GRID_WIDTH);
    const currentPoint = gridPoint(current);
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      if ((!dx && !dz) || x + dx < 0 || x + dx >= GRID_WIDTH || z + dz < 0 || z + dz >= GRID_DEPTH) continue;
      const next = current + dz * GRID_WIDTH + dx;
      if (closed[next] || Number.isNaN(surfaces[next])) continue;
      // Forbid diagonal corner cuts even when the diagonal endpoint is valid.
      if (dx && dz && (Number.isNaN(surfaces[current + dx]) || Number.isNaN(surfaces[current + dz * GRID_WIDTH]))) continue;
      const cost = costs[current] + Math.hypot(dx, dz) * GRID_STEP;
      if (cost >= costs[next]) continue;
      const nextPoint = gridPoint(next);
      if (!segmentIsClear(currentPoint, nextPoint)) continue;
      costs[next] = cost;
      previous[next] = current;
      queue.push(next, cost + Math.hypot(nextPoint.x - last.x, nextPoint.z - last.z));
    }
  }
  if (!reached) return null;
  const reverse: GroundPoint[] = [last];
  for (let index = destination; index !== -1; index = previous[index]) reverse.push(gridPoint(index));
  const raw = [first, ...reverse.reverse()];
  const result: WalkPoint[] = [first];
  let index = 0;
  while (index < raw.length - 1) {
    let next = raw.length - 1;
    while (next > index + 1 && !segmentIsClear(raw[index], raw[next])) next--;
    const point = pointAt(raw[next].x, raw[next].z);
    if (!point || !segmentIsClear(raw[index], point)) return null;
    result.push(point); index = next;
  }
  return result;
}

export function campusDoor(id: number): { outside: WalkPoint; inside: WalkPoint; yaw: number } {
  const pavilion = pavilionFrames.find((p) => p.id === id);
  if (!pavilion) throw new RangeError(`Unknown exhibition dome ${id}`);
  const at = (z: number, y: number): WalkPoint => ({ x: pavilion.position[0] + pavilion.sin * z, y, z: pavilion.position[2] + pavilion.cos * z });
  return { outside: at(3.55, pavilionRamp.top), inside: at(1.4, 0.86), yaw: -pavilion.rotation };
}

export function nearbyCampusDoor(point: GroundPoint, radius = 0.7): number | null {
  if (!isCampusWalkable(point.x, point.z) || !Number.isFinite(radius) || radius < 0) return null;
  let closest: number | null = null, distance = radius;
  for (const pavilion of pavilions) {
    const door = campusDoor(pavilion.id).outside;
    const next = Math.hypot(point.x - door.x, point.z - door.z);
    if (next <= distance) { closest = pavilion.id; distance = next; }
  }
  return closest;
}
