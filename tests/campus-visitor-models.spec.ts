import { expect, test } from "@playwright/test";
import * as THREE from "three";
import { createVisitorModels, visitorWardrobe, type VisitorPose } from "../lib/campus-visitor-models";
import { CAMPUS_METERS_PER_UNIT } from "../lib/campus";
import { sampleCampusWind } from "../lib/campus-environment";

function pose(overrides: Partial<VisitorPose> = {}): VisitorPose {
  return { time: 0, delta: 1 / 30, distance: 0, speed: 0, yaw: 0, wind: sampleCampusWind(0), detail: "near", paused: false, lookYaw: 0, ...overrides };
}

test("wardrobe has distinct appearances, age and body variety, and all seven garment silhouettes", () => {
  const models = createVisitorModels();
  const people = visitorWardrobe.map((_, index) => models.create(index));
  expect(new Set(people.map((person) => person.signature)).size).toBe(28);
  expect(new Set(people.map((person) => person.outfit)).size).toBe(7);
  expect(new Set(visitorWardrobe.map((person) => person.skin)).size).toBe(7);
  expect(new Set(visitorWardrobe.map((person) => person.age)).size).toBe(4);
  expect(new Set(visitorWardrobe.map((person) => person.build)).size).toBeGreaterThanOrEqual(6);
  for (const person of people) {
    expect(person.diagnostics.drawCalls).toBe(1);
    expect(person.diagnostics.nearTriangles).toBeLessThan(15000);
    expect(person.diagnostics.farTriangles).toBeLessThan(person.diagnostics.nearTriangles * 0.5);
    person.update(pose());
    const mesh = person.group.children[0] as THREE.SkinnedMesh;
    expect(mesh.geometry.getAttribute("position").count).toBeGreaterThan(500);
    const weights = mesh.geometry.getAttribute("skinWeight");
    let weightError = 0;
    for (let i = 0; i < weights.count; i++) weightError = Math.max(weightError, Math.abs(weights.getX(i) + weights.getY(i) + weights.getZ(i) + weights.getW(i) - 1));
    expect(weightError).toBeLessThan(0.00001);
    person.group.updateMatrixWorld(true);
    mesh.computeBoundingBox();
    const bounds = mesh.boundingBox!;
    const height = (bounds.max.y - bounds.min.y) * mesh.scale.y * CAMPUS_METERS_PER_UNIT;
    expect(height).toBeGreaterThan(person.heightMeters * 0.96);
    expect(height).toBeLessThan(person.heightMeters * 1.04);
  }
  console.log("Visitor geometry: one draw each; max triangles", { near: Math.max(...people.map((person) => person.diagnostics.nearTriangles)), mid: Math.max(...people.map((person) => person.diagnostics.midTriangles)), far: Math.max(...people.map((person) => person.diagnostics.farTriangles)) });
  models.dispose();
});

test("stance soles remain grounded and planted as the root advances, and pause freezes the rig", () => {
  const models = createVisitorModels();
  const person = models.create(0);
  const mesh = person.group.children[0] as THREE.SkinnedMesh;
  const left = mesh.skeleton.bones.find((bone) => bone.name === "footL")!;
  const foot = new THREE.Vector3();
  let anchoredZ = 0;
  for (let frame = 0; frame < 15; frame++) {
    const distance = frame * 0.002;
    person.group.position.set(2, 0.06, 10 + distance);
    person.update(pose({ time: frame / 30, distance, speed: 0.06 }));
    person.group.updateMatrixWorld(true);
    left.getWorldPosition(foot);
    if (frame === 0) anchoredZ = foot.z;
    expect(foot.z).toBeCloseTo(anchoredZ, 4);
    expect(foot.y - 0.06 * mesh.scale.y).toBeCloseTo(0.06, 4);
  }
  const matrices = mesh.skeleton.bones.map((bone) => bone.matrixWorld.toArray());
  person.update(pose({ time: 20, distance: 2, speed: 0, paused: true, detail: "far" }));
  person.group.updateMatrixWorld(true);
  expect(mesh.skeleton.bones.map((bone) => bone.matrixWorld.toArray())).toEqual(matrices);
  expect(mesh.geometry.index!.count / 3).toBe(person.diagnostics.farTriangles);
  // An off-screen recycled visitor begins with soles under the new body.
  person.group.position.set(-10, 0.06, 25);
  person.update(pose({ time: 20, distance: 2, speed: 0, paused: true }));
  person.group.updateMatrixWorld(true);
  left.getWorldPosition(foot);
  expect(Math.hypot(foot.x + 10, foot.z - 25)).toBeLessThan(0.1);
  expect(foot.y - 0.06 * mesh.scale.y).toBeCloseTo(0.06, 4);
  models.dispose();
});

test("model instances share geometry resources and one cloth material", () => {
  const models = createVisitorModels();
  const first = models.create(2).group.children[0] as THREE.SkinnedMesh;
  const second = models.create(2).group.children[0] as THREE.SkinnedMesh;
  const other = models.create(4).group.children[0] as THREE.SkinnedMesh;
  expect(first.geometry).toBe(second.geometry);
  expect(first.material).toBe(other.material);
  expect(first.skeleton).not.toBe(second.skeleton);
  models.dispose();
});

test("adult and child feet stay planted through complete walking cycles at campus pace", () => {
  const models = createVisitorModels();
  for (const index of [0, 2, 6]) {
    const person = models.create(index);
    const mesh = person.group.children[0] as THREE.SkinnedMesh;
    const feet = ["footL", "footR"].map((name) => mesh.skeleton.bones.find((bone) => bone.name === name)!);
    const previous = feet.map(() => ({ point: new THREE.Vector3(), stance: false }));
    let distance = 0;
    const dt = 1 / 60;
    for (let frame = 0; frame < 900; frame++) {
      // Smooth direction changes exercise world-space stance locking while the
      // gait runs several complete cycles at the simulation's relaxed pace.
      const yaw = Math.sin(frame / 180) * 0.15;
      const speed = frame < 300 ? 0.24 : frame < 600 ? 0.18 : 0.30;
      distance += speed * dt;
      person.group.position.x += Math.sin(yaw) * speed * dt;
      person.group.position.z += Math.cos(yaw) * speed * dt;
      person.group.rotation.y = yaw;
      person.update(pose({ time: frame * dt, delta: dt, distance, speed, yaw }));
      person.group.updateMatrixWorld(true);
      const phase = (distance / mesh.scale.x / 0.76 + (index * 0.381966) % 1) % 1;
      feet.forEach((foot, side) => {
        const p = (phase + side * 0.5) % 1;
        const stance = p < 0.6;
        const point = foot.getWorldPosition(new THREE.Vector3());
        if (stance) {
          expect(Math.abs(point.y - 0.06 * mesh.scale.y)).toBeLessThan(0.0001);
          if (previous[side].stance) {
            expect(Math.hypot(point.x - previous[side].point.x, point.z - previous[side].point.z)).toBeLessThan(0.0001);
          }
        }
        previous[side].point.copy(point); previous[side].stance = stance;
      });
    }
  }
  models.dispose();
});

test("each sole follows ramp height and pitch while its stance contact stays fixed", () => {
  const models = createVisitorModels();
  for (const slope of [-0.4, 0.4]) {
    const person = models.create(1);
    const mesh = person.group.children[0] as THREE.SkinnedMesh;
    const feet = ["footL", "footR"].map((name) => mesh.skeleton.bones.find((bone) => bone.name === name)!);
    const previous = feet.map(() => ({ point: new THREE.Vector3(), stance: false }));
    const surfaceAt = (_x: number, z: number) => slope * z;
    let groundingError = 0, slidingError = 0;
    for (let frame = 0; frame < 240; frame++) {
      const distance = frame * 0.004;
      person.group.position.set(0, surfaceAt(0, distance), distance);
      person.update(pose({ time: frame / 60, delta: 1 / 60, distance, speed: 0.24, surfaceAt }));
      person.group.updateMatrixWorld(true);
      const phase = (distance / mesh.scale.x / 0.76 + 0.381966) % 1;
      feet.forEach((foot, side) => {
        const stance = (phase + side * 0.5) % 1 < 0.6;
        const point = foot.getWorldPosition(new THREE.Vector3());
        if (stance) {
          groundingError = Math.max(groundingError, Math.abs(point.y - 0.06 * Math.sqrt(1 + slope ** 2) * mesh.scale.y - surfaceAt(point.x, point.z)));
          if (previous[side].stance) slidingError = Math.max(slidingError, point.distanceTo(previous[side].point));
          const normal = new THREE.Vector3(0, 1, 0).applyQuaternion(foot.getWorldQuaternion(new THREE.Quaternion()));
          expect(normal.y).toBeCloseTo(1 / Math.sqrt(1 + slope ** 2), 4);
        }
        previous[side].point.copy(point); previous[side].stance = stance;
      });
    }
    expect(groundingError).toBeLessThan(0.0001);
    expect(slidingError).toBeLessThan(0.0001);
  }
  models.dispose();
});
