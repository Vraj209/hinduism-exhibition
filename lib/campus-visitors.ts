import { CAMPUS_METERS_PER_UNIT, pavilions } from "./campus";
import { findCampusPath, walkSurfaceAt, type WalkPoint } from "./campus-navigation";

type Point = { x: number; z: number };
export type VisitorActivity = "walking" | "admiring architecture" | "watching fountain" | "reading exhibition sign" | "entering dome" | "leaving dome" | "yielding";
export type VisitorState = {
  id: number;
  position: WalkPoint;
  yaw: number;
  lookYaw: number;
  /** Actual distance travelled, in scene units; shared gait clips use this clock. */
  distance: number;
  speed: number;
  active: boolean;
  groupId: number;
  activity: VisitorActivity;
  domeId?: number;
};
type Route = { points: WalkPoint[]; lengths: number[]; length: number };
type Member = { state: VisitorState; route: Route; progress: number; start: number; baseSpeed: number; homeActivity: VisitorActivity; lookAt: Point; companions: Member[] };
type GroupPlan = { count: number; points: Point[]; start: number; speed: number; activity: VisitorActivity; lookAt: Point; domeId?: number; singleFile?: boolean };

export const CAMPUS_VISITOR_LIMITS = { desktop: 28, mobile: 16 } as const;
/** Roughly 1.1 m between centers, with a wider comfortable camera envelope. */
export const CAMPUS_VISITOR_SPACE = 0.35;
export const CAMPUS_VISITOR_CAMERA_SPACE = 0.58;
const TAU = Math.PI * 2;
const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const wrap = (x: number, length: number) => ((x % length) + length) % length;
const angleDelta = (a: number, b: number) => wrap(b - a + Math.PI, TAU) - Math.PI;
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.z - b.z);

function localPoint(id: number, x: number, z: number): Point {
  const p = pavilions[id - 1], c = Math.cos(p.rotation), s = Math.sin(p.rotation);
  return { x: p.position[0] + c * x + s * z, z: p.position[2] - s * x + c * z };
}

/**
 * The user navigator stops at the doorway so it can switch to the exhibition.
 * Visitors may also use its real open portal and floor: this narrow corridor
 * never grants access through a facade, pillar, stair cheek or planting bed.
 */
export function visitorSurfaceAt(x: number, z: number, domeId?: number): number | null {
  const outside = walkSurfaceAt(x, z);
  if (outside !== null || !domeId) return outside;
  const p = pavilions[domeId - 1];
  if (!p) return null;
  const dx = x - p.position[0], dz = z - p.position[2];
  const localX = Math.cos(p.rotation) * dx - Math.sin(p.rotation) * dz;
  const localZ = Math.sin(p.rotation) * dx + Math.cos(p.rotation) * dz;
  // The plinth's upper slab is centered at y=.82 with .08 thickness and
  // extends to local z=±3.425. The turnaround stays behind the camera's
  // exhibition handoff at z=1.4, so a paused crowd cannot block that journey.
  return Math.abs(localX) <= 0.48 && localZ >= 0.65 && localZ <= 3.55 ? 0.86 : null;
}

function safeSegment(a: Point, b: Point, domeId?: number) {
  const steps = Math.max(1, Math.ceil(distance(a, b) / 0.05));
  for (let step = 0; step <= steps; step++) {
    const t = step / steps;
    if (visitorSurfaceAt(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t, domeId) === null) return false;
  }
  return true;
}

const point = (x: number, z: number): Point => ({ x, z });
function domeRoute(id: number): Point[] {
  const side = Math.sign(pavilions[id - 1].position[0]), z = pavilions[id - 1].position[2];
  // Separate inbound/outbound lanes leave the middle of the ramp open.
  return [point(side * 12, z + 3), point(side * 12, z + 0.3), localPoint(id, -0.29, 5.7), localPoint(id, -0.29, 3.5), localPoint(id, -0.29, 0.9), localPoint(id, 0.29, 0.9), localPoint(id, 0.29, 3.5), localPoint(id, 0.29, 5.7), point(side * 11.6, z - 0.3), point(side * 11.6, z + 3)];
}

const plans: GroupPlan[] = [
  { count: 3, points: [point(-1.5, 46.5), point(-1.5, 35.5), point(-7, 35.5), point(-7, 46.5)], start: 0.2, speed: 0.25, activity: "admiring architecture", lookAt: point(0, -49) },
  { count: 2, points: domeRoute(1), start: 0.16, speed: 0.23, activity: "reading exhibition sign", lookAt: point(-18, 18), domeId: 1, singleFile: true },
  { count: 3, points: [point(-3.65, 22), point(-3.65, -28), point(-3.2, -28), point(-3.2, 22)], start: 0.13, speed: 0.24, activity: "watching fountain", lookAt: point(0, 8), singleFile: true },
  { count: 2, points: domeRoute(6), start: 0.64, speed: 0.255, activity: "admiring architecture", lookAt: point(18, 18), domeId: 6, singleFile: true },
  { count: 1, points: [point(-3.3, 30.8), point(-3.3, 25.2), point(-3.45, 25.2), point(-3.45, 30.8)], start: 0.04, speed: 0.19, activity: "watching fountain", lookAt: point(-6, 29), singleFile: true },
  { count: 3, points: [point(1.5, 46.5), point(1.5, 35.5), point(7, 35.5), point(7, 46.5)], start: 0.22, speed: 0.245, activity: "admiring architecture", lookAt: point(0, -49) },
  { count: 2, points: [point(3.25, 21.5), point(3.25, -27.5), point(3.8, -27.5), point(3.8, 21.5)], start: 0.73, speed: 0.27, activity: "watching fountain", lookAt: point(0, -14), singleFile: true },
  { count: 2, points: [point(-10.2, 33.5), point(-10.2, -29), point(-10.9, -29), point(-10.9, 33.5)], start: 0.36, speed: 0.26, activity: "reading exhibition sign", lookAt: point(-18, -2) },
  { count: 1, points: domeRoute(2), start: 0.25, speed: 0.22, activity: "reading exhibition sign", lookAt: point(-18, -2), domeId: 2, singleFile: true },
  { count: 2, points: domeRoute(4), start: 0.72, speed: 0.24, activity: "admiring architecture", lookAt: point(18, -22), domeId: 4, singleFile: true },
  { count: 3, points: [point(10.2, 32.8), point(10.2, -29.5), point(10.9, -29.5), point(10.9, 32.8)], start: 0.38, speed: 0.25, activity: "reading exhibition sign", lookAt: point(18, -2) },
  { count: 2, points: [point(-8, -34.3), point(8, -34.3), point(8, -33.8), point(-8, -33.8)], start: 0.27, speed: 0.21, activity: "admiring architecture", lookAt: point(0, -49), singleFile: true },
  { count: 2, points: [point(3.12, 30.8), point(3.12, 25.3), point(3.62, 25.3), point(3.62, 30.8)], start: 0.32, speed: 0.22, activity: "watching fountain", lookAt: point(6, 29), singleFile: true },
];

function compileRoute(plan: GroupPlan, lane: number): Route {
  const shifted = plan.points.map((p, i) => {
    if (!lane) return p;
    const prev = plan.points[wrap(i - 1, plan.points.length)], next = plan.points[(i + 1) % plan.points.length];
    const dx = next.x - prev.x, dz = next.z - prev.z, length = Math.hypot(dx, dz);
    const shifted = { x: p.x - dz / length * lane, z: p.z + dx / length * lane };
    return visitorSurfaceAt(shifted.x, shifted.z, plan.domeId) === null ? p : shifted;
  });
  const points: WalkPoint[] = [];
  for (let i = 0; i < shifted.length; i++) {
    const a = shifted[i], b = shifted[(i + 1) % shifted.length];
    const direct = safeSegment(a, b, plan.domeId);
    const segment = direct ? [a, b] : findCampusPath(a, b);
    if (!segment) throw new Error(`Visitor route has no safe connection at ${a.x},${a.z}`);
    for (const p of segment.slice(0, -1)) {
      const y = visitorSurfaceAt(p.x, p.z, plan.domeId);
      if (y === null) throw new Error("Visitor route is outside the campus paving");
      points.push({ ...p, y });
    }
  }
  const lengths = points.map((p, i) => distance(p, points[(i + 1) % points.length]));
  return { points, lengths, length: lengths.reduce((sum, x) => sum + x, 0) };
}

function routePoint(route: Route, progress: number) {
  let remaining = wrap(progress, route.length);
  for (let i = 0; i < route.points.length; i++) {
    const a = route.points[i], b = route.points[(i + 1) % route.points.length], length = route.lengths[i];
    if (remaining <= length || i === route.points.length - 1) {
      const t = length ? remaining / length : 0;
      return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t, yaw: Math.atan2(b.x - a.x, b.z - a.z), segment: i };
    }
    remaining -= length;
  }
  throw new Error("Empty visitor route");
}

export function createCampusVisitors({ mobile }: { mobile: boolean }) {
  const maximum = mobile ? CAMPUS_VISITOR_LIMITS.mobile : CAMPUS_VISITOR_LIMITS.desktop;
  const members: Member[] = [];
  for (const [groupId, plan] of plans.entries()) {
    for (let index = 0; index < plan.count && members.length < maximum; index++) {
      const lane = plan.singleFile ? 0 : index === 0 ? -0.23 : index === 1 ? 0.23 : 0;
      const route = compileRoute(plan, lane);
      const progress = plan.start * route.length - (plan.singleFile ? index * 0.68 : index === 2 ? 0.68 : 0);
      const at = routePoint(route, progress), id = members.length;
      const state: VisitorState = { id, position: { x: at.x, y: visitorSurfaceAt(at.x, at.z, plan.domeId)!, z: at.z }, yaw: at.yaw, lookYaw: 0, distance: id * 0.073, speed: 0, active: true, groupId, activity: "walking", domeId: plan.domeId };
      members.push({ state, route, progress, start: progress, baseSpeed: plan.speed * (0.97 + (id % 5) * 0.015), homeActivity: plan.activity, lookAt: plan.lookAt, companions: [] });
    }
  }
  for (const member of members) member.companions = members.filter((other) => other !== member && other.state.groupId === member.state.groupId);
  const visitors = members.map((m) => m.state);
  let updates = 0;
  let budget: number = maximum;
  let lastTime = 0;
  function update(delta: number, time: number, camera: { x: number; y: number; z: number }, options: { isVisible?: (v: VisitorState) => boolean; budget?: number; paused?: boolean } = {}) {
    if (!Number.isFinite(delta) || delta <= 0 || options.paused) {
      for (const v of visitors) v.speed = 0;
      return;
    }
    const dt = Math.min(delta, 0.1);
    lastTime = time;
    updates++;
    budget = Math.round(clamp(options.budget ?? maximum, 8, maximum));
    // Never remove or introduce a person in view. No respawning or teleporting
    // is needed: inactive visitors keep their place until safely reintroduced.
    for (const v of visitors) {
      const wanted = v.id < budget;
      if (v.active === wanted || !options.isVisible || options.isVisible(v) || distance(v.position, camera) <= 2) continue;
      // A parked position may now be occupied by a passing visitor. Recovery
      // waits for a clear space; it never materializes an overlapping body.
      if (wanted && visitors.some(other => other !== v && other.active && Math.abs(other.position.y - v.position.y) < 0.3 && distance(other.position, v.position) < CAMPUS_VISITOR_SPACE + 0.001)) continue;
      v.active = wanted;
    }
    for (const member of members) {
      const v = member.state;
      if (!v.active) { v.speed = 0; continue; }
      const cameraNear = camera.y - v.position.y < 2.5 && Math.abs(camera.y - v.position.y) < 3;
      const cameraDistance = cameraNear ? distance(v.position, camera) : Infinity;
      const current = routePoint(member.route, member.progress);
      const ownPhase = (member.progress - member.start) / member.route.length;
      const slowestPhase = member.companions.reduce((min, other) => other.state.active ? Math.min(min, (other.progress - other.start) / other.route.length) : min, ownPhase);
      const ahead = (ownPhase - slowestPhase) * member.route.length;
      // The family advances at its slowest member's pace. Each gait remains
      // independent, including a small trailing space for the third member.
      const groupSpeed = member.baseSpeed * clamp(1 - Math.max(0, ahead - 0.25) * 2, 0, 1);
      // Cohorts pause together with small individual timing differences. Narrow
      // thresholds are always traversed, never used as sightseeing points.
      const inDoor = Boolean(v.domeId && Math.abs(v.position.x) > 12.1);
      const pausePhase = wrap(time + v.groupId * 3.1 + (v.id % 3) * 0.18, 24 + v.groupId * 1.7);
      const waiting = pausePhase < 2.2 + (v.groupId % 4) * 0.65 && !inDoor && cameraDistance > 1.2;
      const step = waiting ? 0 : groupSpeed * dt;
      const next = routePoint(member.route, member.progress + step);
      let dx = next.x - v.position.x, dz = next.z - v.position.z;
      // A gentle rightward passing bias avoids deadlock at opposing traffic.
      for (const other of visitors) {
        if (!other.active || other === v) continue;
        const d = distance(v.position, other.position);
        if (d < 0.8 && Math.cos(v.yaw - other.yaw) < -0.3) {
          dx += Math.cos(v.yaw) * dt * 0.08;
          dz -= Math.sin(v.yaw) * dt * 0.08;
        }
      }
      let yielding = false;
      if (cameraDistance < 1.35) {
        const awayX = (v.position.x - camera.x) / Math.max(0.001, cameraDistance), awayZ = (v.position.z - camera.z) / Math.max(0.001, cameraDistance);
        const toward = dx * awayX + dz * awayZ;
        if (toward < 0 || cameraDistance < CAMPUS_VISITOR_CAMERA_SPACE + 0.12) {
          yielding = true;
          const strength = clamp((1.15 - cameraDistance) / 0.5, 0.15, 1);
          dx = awayX * dt * 0.38 * strength; dz = awayZ * dt * 0.38 * strength;
        }
      }
      // Pursuit recovery is bounded so a pause or camera detour cannot snap a
      // person back onto a path. Actual movement is the animation's only clock.
      const desired = Math.hypot(dx, dz), maxStep = dt * (yielding ? 0.42 : 0.38);
      if (desired > maxStep) { dx *= maxStep / desired; dz *= maxStep / desired; }
      const canMove = (x: number, z: number) => {
        if (!safeSegment(v.position, { x, z }, v.domeId)) return false;
        if (cameraNear && Math.hypot(x - camera.x, z - camera.z) < CAMPUS_VISITOR_CAMERA_SPACE && Math.hypot(x - camera.x, z - camera.z) < cameraDistance - 0.00001) return false;
        for (const other of visitors) {
          if (other === v || !other.active || Math.abs(other.position.y - v.position.y) > 0.3) continue;
          const before = distance(v.position, other.position), after = Math.hypot(x - other.position.x, z - other.position.z);
          if (after < CAMPUS_VISITOR_SPACE && after < before - 0.00001) return false;
        }
        return true;
      };
      let x = v.position.x + dx, z = v.position.z + dz;
      if (!canMove(x, z)) {
        const sideX = Math.cos(v.yaw) * dt * 0.14, sideZ = -Math.sin(v.yaw) * dt * 0.14;
        const alternatives = yielding ? [[-dz, dx], [dz, -dx], [dx, 0], [0, dz]] : [[dx, 0], [0, dz], [sideX, sideZ], [-sideX, -sideZ]];
        const alternative = alternatives.find(([ax, az]) => Math.hypot(ax, az) > 0.00001 && canMove(v.position.x + ax, v.position.z + az));
        if (alternative) { x = v.position.x + alternative[0]; z = v.position.z + alternative[1]; }
        else { x = v.position.x; z = v.position.z; }
      }
      const moved = Math.hypot(x - v.position.x, z - v.position.z);
      v.speed = moved / dt;
      v.distance += moved;
      if (moved > 0.00001) {
        const targetYaw = Math.atan2(x - v.position.x, z - v.position.z);
        v.yaw += clamp(angleDelta(v.yaw, targetYaw), -dt * 2.5, dt * 2.5);
      }
      v.position = { x, y: visitorSurfaceAt(x, z, v.domeId)!, z };
      const trackingDistance = distance(v.position, next);
      if (!yielding && trackingDistance < 0.055) member.progress += step;
      // After giving way, follow the existing route from the current progress.
      // A stopped visitor never advances its gait or route clock in place.
      v.activity = yielding || (!waiting && moved < 0.00001) ? "yielding" : waiting ? member.homeActivity : inDoor ? (current.segment < 5 ? "entering dome" : "leaving dome") : "walking";
      const looking = waiting ? angleDelta(v.yaw, Math.atan2(member.lookAt.x - x, member.lookAt.z - z)) : Math.sin(time * 0.27 + v.id * 1.73) * 0.12;
      v.lookYaw += (clamp(looking, -0.65, 0.65) - v.lookYaw) * Math.min(1, dt * 2.2);
    }
  }
  return {
    visitors,
    update,
    diagnostics() {
      const active = visitors.filter((v) => v.active);
      return { count: active.length, maximum, budget, groups: new Set(active.map((v) => v.groupId)).size, moving: active.filter((v) => v.speed > 0.02).length, paused: active.filter((v) => v.speed <= 0.02).length, updates, time: lastTime, scaleMetersPerUnit: CAMPUS_METERS_PER_UNIT, spaceMeters: CAMPUS_VISITOR_SPACE * CAMPUS_METERS_PER_UNIT };
    },
  };
}
