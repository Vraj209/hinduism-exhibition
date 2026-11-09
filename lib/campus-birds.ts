import * as THREE from "three";

const TAU = Math.PI * 2;
const FLOCKS = [
  { count: 5, phase: -0.22, speed: 0.0147, altitude: 30, depth: -12, radius: 100, arc: 30, shear: 0.6 },
  { count: 4, phase: 0.32, speed: -0.0113, altitude: 37, depth: -48, radius: 116, arc: 37, shear: 0.45 },
  { count: 3, phase: 1.67, speed: 0.0091, altitude: 24, depth: -109, radius: 174, arc: 23, shear: 0 },
] as const;

export function campusBirds(mobile: boolean) {
  return FLOCKS.slice(0, mobile ? 2 : 3).flatMap((flock, flockIndex) =>
    Array.from({ length: mobile ? flockIndex === 0 ? 3 : 2 : flock.count }, (_, member) => ({
      flock: flockIndex,
      member,
      phase: member * 1.731 + flockIndex * 2.37,
      scale: (flockIndex === 2 ? 0.7 : 0.94)
        + ((member * 7 + flockIndex * 3) % 5) * 0.035 + (mobile ? 0.5 : 0),
    })),
  );
}
type Bird = ReturnType<typeof campusBirds>[number];

/** Closed, very wide routes: turns happen beyond the campus, with no respawn or
 * position wrap. Even a visitor looking around cannot catch a bird teleporting.
 * Two elevated routes cross the open sky above the campus; a third stays behind
 * the mandir. Oblique approaches keep wings readable instead of always edge-on. */
export function sampleCampusBird(bird: Bird, seconds: number) {
  const flock = FLOCKS[bird.flock];
  const phase = bird.phase;
  const angle = flock.phase + seconds * flock.speed + bird.member * 0.017
    + Math.sin(seconds * 0.11 + phase) * 0.002;
  const speed = flock.speed + Math.cos(seconds * 0.11 + phase) * 0.00022;
  const x = flock.radius * Math.sin(angle);
  const dx = flock.radius * Math.cos(angle) * speed;
  const dz = flock.arc * Math.sin(angle) * speed + dx * flock.shear;
  const cycle = THREE.MathUtils.euclideanModulo(seconds / (6.9 + bird.member * 0.37) + phase, 1);
  const flap = THREE.MathUtils.smootherstep(cycle, 0.04, 0.18)
    * (1 - THREE.MathUtils.smootherstep(cycle, 0.58, 0.74));
  return {
    x,
    y: flock.altitude + Math.sin(angle * 2 + phase * 0.2) * 1.7
      + (bird.member % 3) * 0.65 + Math.sin(seconds * 0.35 + phase) * 0.16,
    z: flock.depth - flock.arc * Math.cos(angle) + x * flock.shear + Math.sin(phase) * 1.9,
    heading: Math.atan2(dx, dz),
    bank: -Math.sin(angle) * Math.sign(speed) * 0.12,
    wing: 0.18 + flap * Math.sin(seconds * TAU * (2.1 + bird.member * 0.13) + phase) * 0.7,
    gliding: flap === 0,
  };
}

export function makeCampusBirds(mobile: boolean) {
  const birds = campusBirds(mobile);
  const group = new THREE.Group();
  group.name = "Distant garden bird flocks";
  const geometry = (vertices: number[], indices: number[]) => {
    const result = new THREE.BufferGeometry();
    result.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    result.setIndex(indices);
    return result;
  };
  const bodyGeometry = geometry([
    0, 0.035, 0.28, -0.055, 0, 0, 0, -0.04, -0.28, 0.055, 0, 0,
    -0.1, 0, -0.37, 0.1, 0, -0.37,
  ], [0, 1, 2, 0, 2, 3, 2, 4, 5]);
  const wingGeometry = geometry([
    0, 0, 0.12, 0.25, 0.025, 0.08, 0.55, 0, -0.14,
    0.31, 0, -0.15, 0, 0, -0.09,
  ], [0, 1, 4, 1, 3, 4, 1, 2, 3]);
  const material = new THREE.MeshBasicMaterial({
    color: "#263940", side: THREE.DoubleSide, fog: true,
    depthTest: true, depthWrite: true,
  });
  const bodies = new THREE.InstancedMesh(bodyGeometry, material, birds.length);
  const wings = new THREE.InstancedMesh(wingGeometry, material, birds.length * 2);
  bodies.name = "Small distant bird silhouettes";
  wings.name = "Independently flapping and gliding wings";
  for (const mesh of [bodies, wings]) {
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    // Tiny fixed instance budget; avoid rebuilding a bounding sphere each frame.
    mesh.frustumCulled = false;
    mesh.castShadow = false;
    group.add(mesh);
  }
  const pose = new THREE.Object3D();
  const wing = new THREE.Object3D();
  const matrix = new THREE.Matrix4();
  let time = 0;
  function update(seconds: number) {
    time = seconds;
    birds.forEach((bird, i) => {
      const state = sampleCampusBird(bird, seconds);
      pose.position.set(state.x, state.y, state.z);
      pose.rotation.set(0, state.heading, state.bank, "YXZ");
      pose.scale.setScalar(bird.scale);
      pose.updateMatrix();
      bodies.setMatrixAt(i, pose.matrix);
      for (const side of [-1, 1]) {
        wing.rotation.z = state.wing * side;
        wing.scale.set(side, 1, 1);
        wing.updateMatrix();
        matrix.multiplyMatrices(pose.matrix, wing.matrix);
        wings.setMatrixAt(i * 2 + (side === 1 ? 1 : 0), matrix);
      }
    });
    bodies.instanceMatrix.needsUpdate = wings.instanceMatrix.needsUpdate = true;
  }
  update(0);
  return {
    group, update,
    diagnostics: { birds: birds.length, flocks: mobile ? 2 : 3, drawCalls: 2, triangles: birds.length * 9 },
    snapshot: () => ({ time, birds: birds.map(bird => sampleCampusBird(bird, time)) }),
    dispose() {
      bodies.dispose(); wings.dispose();
      bodyGeometry.dispose(); wingGeometry.dispose(); material.dispose();
      group.clear();
    },
  };
}
