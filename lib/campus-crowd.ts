import * as THREE from "three";
import { CAMPUS_METERS_PER_UNIT } from "./campus";
import { createCampusVisitors, visitorSurfaceAt, type VisitorState } from "./campus-visitors";
import { createVisitorModels } from "./campus-visitor-models";
import type { CampusWind } from "./campus-environment";

/** Hysteresis prevents a momentary shader compilation from changing the crowd.
 * Detail is reduced before population, and population changes are off-screen. */
export function createCrowdQuality(mobile: boolean, constrained = false) {
  const capacity = mobile ? 16 : 28;
  let level = constrained ? 1 : 0;
  let average = 0, samples = 0, slow = 0, fast = 0;
  return {
    get level() { return level; },
    get budget() { return level < 2 ? capacity : mobile ? 10 : 18; },
    get frameMs() { return average; },
    observe(milliseconds: number) {
      if (!Number.isFinite(milliseconds) || milliseconds <= 0) return;
      average = samples++ ? average * 0.94 + milliseconds * 0.06 : milliseconds;
      if (samples < 45) return;
      slow = average > (mobile ? 34 : 25) ? slow + 1 : 0;
      fast = average < (mobile ? 15 : 12) ? fast + 1 : 0;
      if (slow >= 60 && level < 2) { level++; slow = fast = 0; }
      if (fast >= 240 && level > (constrained ? 1 : 0)) { level--; slow = fast = 0; }
    },
  };
}

export function makeCampusCrowd({ mobile, constrained = false }: { mobile: boolean; constrained?: boolean }) {
  const simulation = createCampusVisitors({ mobile });
  const resources = createVisitorModels();
  const quality = createCrowdQuality(mobile, constrained);
  const group = new THREE.Group();
  group.name = "Campus visitors in Indian traditional attire";
  const models = simulation.visitors.map((visitor) => {
    const model = resources.create(visitor.id);
    group.add(model.group);
    return model;
  });
  const surfaces = simulation.visitors.map(visitor => (x: number, z: number) => visitorSurfaceAt(x, z, visitor.domeId));
  const frustum = new THREE.Frustum();
  const matrix = new THREE.Matrix4();
  const sphere = new THREE.Sphere(new THREE.Vector3(), 0.8);
  const cameraRight = new THREE.Vector3();
  let time = 0;
  let delta = 0;
  let wind: CampusWind = { strength: 0, gust: 0, x: 0, z: 0 };
  let isPaused = false;
  let visible = 0;
  let frameDelay = 0;
  const detailCounts = { near: 0, mid: 0, far: 0 };
  function isVisible(visitor: VisitorState) {
    // Generous whole-body bounds keep hats, pallus and shadows from popping at
    // the image edge when the adaptive population budget changes.
    sphere.center.set(visitor.position.x, visitor.position.y + 0.3, visitor.position.z);
    return frustum.intersectsSphere(sphere);
  }
  function cameraFrustum(camera: THREE.Camera) {
    camera.updateMatrixWorld();
    matrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    frustum.setFromProjectionMatrix(matrix);
  }
  function prepare(camera: THREE.Camera, paused: boolean) {
    isPaused = paused;
    cameraFrustum(camera);
    visible = 0;
    detailCounts.near = detailCounts.mid = detailCounts.far = 0;
    simulation.visitors.forEach((visitor, index) => {
      const model = models[index];
      model.group.visible = visitor.active;
      if (!visitor.active) return;
      model.group.position.set(visitor.position.x, visitor.position.y, visitor.position.z);
      model.group.rotation.y = visitor.yaw;
      const distance = model.group.position.distanceTo(camera.position);
      const near = quality.level ? 3.4 : mobile ? 5 : 7;
      const far = quality.level ? 11 : mobile ? 18 : 26;
      const detail = distance < near ? "near" : distance < far ? "mid" : "far";
      detailCounts[detail]++;
      if (isVisible(visitor)) visible++;
      model.update({ time, delta, distance: visitor.distance, speed: paused ? 0 : visitor.speed, yaw: visitor.yaw, wind, detail, paused, lookYaw: visitor.lookYaw, surfaceAt: surfaces[index] });
    });
    delta = 0;
  }
  return {
    group,
    prepare,
    update(seconds: number, elapsed: number, camera: THREE.Camera, weather: CampusWind) {
      time = seconds;
      delta = elapsed;
      wind = weather;
      cameraFrustum(camera);
      simulation.update(elapsed, seconds, camera.position, { isVisible, budget: quality.budget });
    },
    observeFrame(milliseconds: number) {
      // Include missed ambient frames, which also catches GPU-bound devices
      // whose render() call can return before the GPU finishes its work.
      frameDelay = Math.max(0, milliseconds - (mobile ? 50 : 1000 / 30) - 8);
    },
    observeRender(milliseconds: number) {
      quality.observe(Math.max(milliseconds, frameDelay));
      frameDelay = 0;
    },
    canTraverse(from: { x: number; y: number; z: number }, to: { x: number; y: number; z: number }) {
      const dx = to.x - from.x, dz = to.z - from.z;
      const lengthSq = dx * dx + dz * dz;
      return simulation.visitors.every(visitor => {
        if (!visitor.active || Math.abs(visitor.position.y - to.y) > 0.7) return true;
        const vx = visitor.position.x - from.x, vz = visitor.position.z - from.z;
        const fraction = lengthSq ? THREE.MathUtils.clamp((vx * dx + vz * dz) / lengthSq, 0, 1) : 0;
        const closest = Math.hypot(vx - dx * fraction, vz - dz * fraction);
        // Always allow retreat from an overlap caused by immediate travel.
        return closest >= 0.26 || (Math.hypot(vx, vz) < 0.26 && dx * vx + dz * vz <= 0 && lengthSq > 0.000001);
      });
    },
    sound(camera: THREE.Camera) {
      cameraRight.set(1, 0, 0).applyQuaternion(camera.quaternion);
      let presence = 0, motion = 0, pan = 0;
      for (const visitor of simulation.visitors) {
        if (!visitor.active) continue;
        const dx = visitor.position.x - camera.position.x;
        const dz = visitor.position.z - camera.position.z;
        const dy = visitor.position.y + 0.4 - camera.position.y;
        const distance = Math.hypot(dx, dy, dz);
        const weight = 1 / (1 + (distance / 2.5) ** 2);
        presence += weight;
        motion += weight * Math.min(1, visitor.speed * CAMPUS_METERS_PER_UNIT / 1.1);
        pan += weight * (dx * cameraRight.x + dz * cameraRight.z) / Math.max(0.1, distance);
      }
      return {
        presence: Math.min(1, presence / 3),
        motion: isPaused ? 0 : Math.min(1, motion / Math.max(0.1, presence)),
        pan: THREE.MathUtils.clamp(pan / Math.max(0.1, presence), -0.8, 0.8),
      };
    },
    snapshot() {
      return {
        ...simulation.diagnostics(),
        quality: quality.level,
        budget: quality.budget,
        framePressureMs: Number(quality.frameMs.toFixed(2)),
        visible,
        detail: { ...detailCounts },
        paused: isPaused,
        visitors: simulation.visitors.map((visitor, index) => ({
          id: visitor.id, active: visitor.active, groupId: visitor.groupId,
          position: [visitor.position.x, visitor.position.y, visitor.position.z].map(value => Number(value.toFixed(4))),
          speed: Number(visitor.speed.toFixed(4)), distance: Number(visitor.distance.toFixed(4)),
          activity: visitor.activity, outfit: models[index].outfit,
          signature: models[index].signature, heightMeters: models[index].heightMeters,
          appearance: models[index].appearance,
        })),
      };
    },
    dispose() { group.removeFromParent(); resources.dispose(); },
  };
}
