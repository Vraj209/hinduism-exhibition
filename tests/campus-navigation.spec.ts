import { expect, test } from "@playwright/test";
import { campusLayout, pavilions } from "../lib/campus";
import {
  campusDoor,
  findCampusPath,
  isCampusWalkable,
  moveOnCampus,
  nearbyCampusDoor,
  nearestWalkable,
  walkSurfaceAt,
  type WalkPoint,
} from "../lib/campus-navigation";

const entrance = { x: 0, y: 0.02, z: 46 };

function assertSafeRoute(route: WalkPoint[] | null) {
  expect(route).not.toBeNull();
  for (let index = 0; index < route!.length; index++) {
    const point = route![index];
    expect(point.y).toBeCloseTo(walkSurfaceAt(point.x, point.z)!, 8);
    if (!index) continue;
    const previous = route![index - 1];
    const steps = Math.max(1, Math.ceil(Math.hypot(point.x - previous.x, point.z - previous.z) / 0.025));
    for (let step = 0; step <= steps; step++) {
      const x = previous.x + (point.x - previous.x) * step / steps;
      const z = previous.z + (point.z - previous.z) * step / steps;
      if (!isCampusWalkable(x, z)) throw new Error(`Route passes an obstacle at ${x},${z}`);
    }
  }
}

test("all six exhibition entrances connect to arrival and have safe portal transitions", () => {
  let firstRouteMs = 0;
  for (const pavilion of pavilions) {
    const door = campusDoor(pavilion.id);
    expect(door.outside.x).toBeCloseTo(pavilion.position[0] + Math.sign(-pavilion.position[0]) * 3.55);
    expect(door.outside.z).toBeCloseTo(pavilion.position[2]);
    const started = performance.now();
    const route = findCampusPath(entrance, door.outside);
    if (pavilion.id === 1) firstRouteMs = performance.now() - started;
    assertSafeRoute(route);
    expect(route!.at(-1)).toEqual(door.outside);
    expect(door.outside.y).toBe(0.88);
    expect(nearbyCampusDoor(door.outside)).toBe(pavilion.id);
    expect(isCampusWalkable(door.inside.x, door.inside.z)).toBe(false);
    expect(Math.sin(door.yaw) * (door.inside.x - door.outside.x)).toBeGreaterThan(0);
  }
  console.log(`Cold navigation grid and first route: ${Math.round(firstRouteMs)} ms`);
});

test("garden loop, both fountain viewpoints and mandir forecourt are connected", () => {
  const destinations = [
    { x: -3.5, z: 0 }, { x: 3.5, z: 0 },
    { x: -3.3, z: 29 }, { x: 3.3, z: 29 },
    { x: 0, z: -34.5 },
  ];
  for (const destination of destinations) assertSafeRoute(findCampusPath(entrance, destination));
  assertSafeRoute(findCampusPath(destinations[0], destinations[1]));
  expect(walkSurfaceAt(0, -36)).toBeNull();
});

test("all 36 dome pairs connect with obstacle-safe routes and swept movement", () => {
  for (let start = 1; start <= 6; start++) {
    for (let end = 1; end <= 6; end++) {
      const outside = campusDoor(end).outside;
      const route = findCampusPath(campusDoor(start).outside, outside);
      assertSafeRoute(route);
      if ((start <= 3) !== (end <= 3))
        expect(route!.some((point) => point.z > 33 || point.z < -33)).toBe(true);
      let walker = route![0];
      for (const next of route!.slice(1)) {
        walker = moveOnCampus(walker, next.x - walker.x, next.z - walker.z);
        expect(walker.x).toBeCloseTo(next.x, 6);
        expect(walker.z).toBeCloseTo(next.z, 6);
      }
      expect(walker.y).toBeCloseTo(outside.y, 8);
      // Also stress a .025-unit waypoint tolerance with small frames so a
      // smoothed corner cannot strand a walker a little short of its waypoint.
      walker = route![0];
      for (const next of route!.slice(1)) {
        let remaining = Math.hypot(next.x - walker.x, next.z - walker.z);
        while (remaining >= 0.025) {
          const step = Math.min(0.02, remaining);
          const advanced = moveOnCampus(walker, (next.x - walker.x) / remaining * step, (next.z - walker.z) / remaining * step);
          if (Math.hypot(advanced.x - walker.x, advanced.z - walker.z) < 0.000001)
            throw new Error(`Automatic route ${start}→${end} stalls near ${walker.x},${walker.z}`);
          walker = advanced;
          remaining = Math.hypot(next.x - walker.x, next.z - walker.z);
        }
      }
      expect(nearbyCampusDoor(walker)).toBe(end);
    }
  }
});

test("basins, raised planting, stairs, walls, trees and the campus boundary reject destinations", () => {
  const blocked = [
    { x: 0, z: 0 }, ...campusLayout.sideFountains,
    { x: 3.8, z: 41.5 }, { x: -6, z: 13 },
    { x: -18, z: 18 }, { x: -13, z: 19.2 },
    { x: -18, z: 28 }, { x: 9, z: 13 },
    { x: 0, z: -49 }, { x: 24, z: 46 },
  ];
  for (const point of blocked) {
    expect(isCampusWalkable(point.x, point.z), JSON.stringify(point)).toBe(false);
    expect(findCampusPath(entrance, point)).toBeNull();
  }
  expect(nearestWalkable({ x: 0, z: 0 }, 0.8)).toBeNull();
  expect(nearestWalkable({ x: 0, z: NaN })).toBeNull();
  expect(findCampusPath({ x: Infinity, z: 0 }, entrance)).toBeNull();
});

test("swept movement cannot cross water, flower beds or leave the campus", () => {
  const garden = { x: -3.5, y: 0.06, z: 0 };
  const blockedByBasin = moveOnCampus(garden, 7, 0);
  expect(blockedByBasin.x).toBeLessThan(-2.6);
  expect(isCampusWalkable(blockedByBasin.x, blockedByBasin.z)).toBe(true);
  const blockedByBed = moveOnCampus({ x: 0, y: 0.02, z: 41.5 }, 8, 0);
  // The conservative arrival-bed envelope starts at x=2.6; stop short of it.
  expect(blockedByBed.x).toBeLessThan(2.6);
  expect(isCampusWalkable(blockedByBed.x, blockedByBed.z)).toBe(true);
  const boundary = moveOnCampus(entrance, 0, 40);
  expect(boundary.z).toBeLessThan(54.55);
  expect(isCampusWalkable(boundary.x, boundary.z)).toBe(true);
  const sliding = moveOnCampus(garden, 2, -2);
  expect(sliding.x).toBeLessThan(-2.6);
  expect(sliding.z).toBeLessThan(-1.8);
});

test("entrance ramp follows a continuous visible profile with a level landing", () => {
  for (const pavilion of pavilions) {
    let lastHeight = 0;
    for (let z = 5.85; z >= 3.5; z -= 0.025) {
      const xWorld = pavilion.position[0] + Math.sin(pavilion.rotation) * z;
      const zWorld = pavilion.position[2] + Math.cos(pavilion.rotation) * z;
      const y = walkSurfaceAt(xWorld, zWorld);
      expect(y, `Dome ${pavilion.id}, local Z ${z}`).not.toBeNull();
      expect(y!).toBeGreaterThanOrEqual(lastHeight - 0.00001);
      if (lastHeight) expect(y! - lastHeight).toBeLessThanOrEqual(0.011);
      // Independent approved-mesh tread positions: the ramp cannot intersect
      // any of the five visible stair treads under its center corridor.
      for (let tread = 0; tread < 5; tread++) {
        const center = 5.15 - tread * 0.4;
        if (Math.abs(z - center) <= 0.275) expect(y!).toBeGreaterThan(0.19 + tread * 0.16);
      }
      lastHeight = y!;
    }
    expect(lastHeight).toBeCloseTo(0.88);
  }
});
