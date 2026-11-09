import { expect, test } from "@playwright/test";
import { pavilions } from "../lib/campus";
import { CAMPUS_VISITOR_CAMERA_SPACE, CAMPUS_VISITOR_SPACE, createCampusVisitors, visitorSurfaceAt } from "../lib/campus-visitors";

const distantCamera = { x: 0, y: 110, z: -19 };

test("all visitors start on paving at calibrated scale, with complete mobile cohorts", () => {
  for (const mobile of [false, true]) {
    const crowd = createCampusVisitors({ mobile });
    expect(crowd.visitors).toHaveLength(mobile ? 16 : 28);
    expect(new Set(crowd.visitors.map((v) => v.id)).size).toBe(crowd.visitors.length);
    expect(crowd.visitors.some((v) => v.domeId)).toBe(true);
    expect(crowd.visitors.some((v) => Math.abs(v.position.x) < 4 && v.position.z < 24)).toBe(true);
    for (const v of crowd.visitors) expect(v.position.y).toBe(visitorSurfaceAt(v.position.x, v.position.z, v.domeId));
  }
});

test("four minutes of mixed activity stay grounded, separated and continuously moving", () => {
  const crowd = createCampusVisitors({ mobile: false });
  const activities = new Set<string>();
  let minimumSpacing = Infinity, maximumStep = 0, maximumGroupSpread = 0;
  const starts = crowd.visitors.map((v) => v.distance);
  for (let frame = 1; frame <= 2400; frame++) {
    const previous = crowd.visitors.map((v) => ({ ...v.position }));
    crowd.update(0.1, frame * 0.1, distantCamera);
    for (const [i, v] of crowd.visitors.entries()) {
      if (visitorSurfaceAt(v.position.x, v.position.z, v.domeId) !== v.position.y) throw new Error(`Ungrounded visitor ${i} at frame ${frame}`);
      if (v.domeId) {
        const p = pavilions[v.domeId - 1], dx = v.position.x - p.position[0], dz = v.position.z - p.position[2];
        const localX = Math.cos(p.rotation) * dx - Math.sin(p.rotation) * dz;
        const localZ = Math.sin(p.rotation) * dx + Math.cos(p.rotation) * dz;
        // Include the entire doorway camera transition down to its z=1.4
        // interior handoff; checking only the ramp misses the return crosswalk.
        if (localZ > 1.4 && localZ < 5.65) {
          if (Math.abs(localX) < 0.265) throw new Error(`Visitor ${i} blocks the center of dome ${v.domeId}`);
          if (v.activity === "admiring architecture" || v.activity === "reading exhibition sign") throw new Error(`Visitor ${i} pauses on the ramp`);
        }
      }
      maximumStep = Math.max(maximumStep, Math.hypot(v.position.x - previous[i].x, v.position.z - previous[i].z));
      activities.add(v.activity);
      for (const other of crowd.visitors.slice(i + 1)) {
        if (Math.abs(v.position.y - other.position.y) < 0.3) minimumSpacing = Math.min(minimumSpacing, Math.hypot(v.position.x - other.position.x, v.position.z - other.position.z));
        if (v.groupId === other.groupId) maximumGroupSpread = Math.max(maximumGroupSpread, Math.hypot(v.position.x - other.position.x, v.position.z - other.position.z));
      }
    }
  }
  expect(minimumSpacing).toBeGreaterThanOrEqual(CAMPUS_VISITOR_SPACE - 0.001);
  expect(maximumStep).toBeLessThanOrEqual(0.043);
  for (const expected of ["walking", "watching fountain", "admiring architecture", "reading exhibition sign", "entering dome", "leaving dome"]) expect(activities.has(expected), expected).toBe(true);
  const travelled = crowd.visitors.map((v, i) => v.distance - starts[i]);
  console.log({ minimumSpacing, maximumStep, maximumGroupSpread, travelled: travelled.map((d) => Number(d.toFixed(2))), activities: [...activities] });
  expect(maximumGroupSpread).toBeLessThan(1.6);
  expect(Math.min(...travelled)).toBeGreaterThan(30);
});

test("visitors yield to a nearby walking camera without jumping or crossing its envelope", () => {
  const crowd = createCampusVisitors({ mobile: true });
  const first = crowd.visitors[0];
  const camera = { x: first.position.x + Math.sin(first.yaw) * 1.2, y: first.position.y + 0.54, z: first.position.z + Math.cos(first.yaw) * 1.2 };
  let minimum = Infinity, yielded = false;
  for (let frame = 0; frame < 180; frame++) {
    crowd.update(0.05, frame * 0.05, camera);
    minimum = Math.min(minimum, Math.hypot(first.position.x - camera.x, first.position.z - camera.z));
    yielded ||= first.activity === "yielding";
  }
  expect(yielded).toBe(true);
  expect(minimum).toBeGreaterThanOrEqual(CAMPUS_VISITOR_CAMERA_SPACE - 0.001);
});

test("density changes defer every visible visitor and pause freezes all gait clocks", () => {
  const crowd = createCampusVisitors({ mobile: false });
  crowd.update(0.05, 1, distantCamera, { budget: 12, isVisible: () => true });
  expect(crowd.visitors.filter((v) => v.active)).toHaveLength(28);
  crowd.update(0.05, 2, distantCamera, { budget: 12, isVisible: () => false });
  expect(crowd.visitors.filter((v) => v.active)).toHaveLength(12);
  crowd.update(0.05, 3, distantCamera, { budget: 28, isVisible: () => true });
  expect(crowd.visitors.filter((v) => v.active)).toHaveLength(12);
  const before = crowd.visitors.map((v) => ({ p: { ...v.position }, distance: v.distance, yaw: v.yaw }));
  crowd.update(0.05, 4, distantCamera, { paused: true });
  expect(crowd.visitors.map((v) => ({ p: v.position, distance: v.distance, yaw: v.yaw }))).toEqual(before);
  crowd.update(0.05, 5, distantCamera, { budget: 28, isVisible: () => false });
  expect(crowd.visitors.filter((v) => v.active)).toHaveLength(28);
});

test("population recovery waits until a parked visitor's position is unoccupied", () => {
  const crowd = createCampusVisitors({ mobile: false });
  const options = { budget: 10, isVisible: () => false };
  crowd.update(0.05, 1, distantCamera, options);
  const parked = crowd.visitors[26], passing = crowd.visitors[0];
  expect(parked.active).toBe(false);
  passing.position = { ...parked.position };
  crowd.update(0.05, 2, distantCamera, { ...options, budget: 28 });
  expect(parked.active).toBe(false);
  passing.position = { ...parked.position, z: parked.position.z + 1 };
  crowd.update(0.05, 3, distantCamera, { ...options, budget: 28 });
  expect(parked.active).toBe(true);
  expect(Math.hypot(parked.position.x - passing.position.x, parked.position.z - passing.position.z)).toBeGreaterThan(CAMPUS_VISITOR_SPACE);
});
