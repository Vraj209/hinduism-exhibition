import * as THREE from "three";
import { CAMPUS_WIND_DIRECTION, sampleCampusWind, type CampusWind } from "./campus-environment";

/** Unmodified owner-supplied 636 × 212 RGB artwork, including opaque whites. */
export const BAPS_FLAG_TEXTURE = "/textures/baps-flag.png";
export const BAPS_FLAG_ASPECT = 3;

export type CampusFlagOptions = {
  material?: THREE.MeshStandardMaterial;
  mobile?: boolean;
};

type FlagState = {
  id: string;
  width: number;
  height: number;
  phase: number;
  poleRadius: number;
  near: THREE.PlaneGeometry;
  far: THREE.PlaneGeometry;
  time: number;
  direction: THREE.Vector3;
  inverse: THREE.Quaternion;
};

export function makeCampusFlagMaterial(texture: THREE.Texture | null = null) {
  return new THREE.MeshStandardMaterial({
    map: texture,
    color: 0xffffff,
    side: THREE.DoubleSide,
    roughness: 0.92,
    metalness: 0,
    transparent: false,
    opacity: 1,
    // Small lift keeps the unlit reverse legible without flattening the folds.
    emissive: 0xffffff,
    emissiveMap: texture,
    emissiveIntensity: 0.045,
  });
}

/** Mount origin is the existing kalash tip. Only the slender staff enters it. */
export function makeCampusFlagstaff(
  id: string,
  width: number,
  poleHeight: number,
  poleMaterial: THREE.MeshStandardMaterial,
  options: CampusFlagOptions = {},
) {
  const group = new THREE.Group();
  group.name = `BAPS flagstaff — ${id}`;
  const poleRadius = width * 0.009;
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(poleRadius * 0.75, poleRadius, poleHeight + 0.08, 8),
    poleMaterial,
  );
  pole.name = `Stable flagpole — ${id}`;
  pole.position.y = (poleHeight - 0.08) / 2;
  pole.castShadow = true;
  group.add(pole);

  const near = new THREE.PlaneGeometry(1, 1, options.mobile ? 16 : 24, options.mobile ? 5 : 8);
  const far = options.mobile ? new THREE.PlaneGeometry(1, 1, 8, 3) : near;
  for (const geometry of new Set([near, far])) {
    (geometry.getAttribute("position") as THREE.BufferAttribute).setUsage(THREE.DynamicDrawUsage);
    (geometry.getAttribute("normal") as THREE.BufferAttribute).setUsage(THREE.DynamicDrawUsage);
    // Conservative for all folds/droop, independent of the current wind yaw.
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, -width / 6, 0), width * 1.15);
  }
  const flag = new THREE.Mesh(near, options.material ?? makeCampusFlagMaterial());
  flag.name = `BAPS flag — ${id}`;
  flag.position.y = poleHeight - 0.08;
  const seed = Array.from(id).reduce((value, letter) => (value * 31 + letter.charCodeAt(0)) % 997, 7);
  const phase = (seed * 2.3999632297) % (Math.PI * 2);
  flag.userData.campusFlag = {
    id, width, height: width / BAPS_FLAG_ASPECT, phase, poleRadius,
    near, far, time: 0, direction: new THREE.Vector3(), inverse: new THREE.Quaternion(),
  } satisfies FlagState;
  flag.castShadow = true;
  flag.receiveShadow = true;
  group.add(flag);
  updateCampusFlag(flag, 0, sampleCampusWind(0));
  return group;
}

/** CPU deformation also reaches the ordinary depth pass: no detached shadows. */
export function updateCampusFlag(flag: THREE.Mesh, time: number, wind: CampusWind) {
  const state = flag.userData.campusFlag as FlagState;
  const { width, height, phase, poleRadius, direction, inverse } = state;
  // Pavilions face opposite directions. Undo each complete world rotation so
  // their cloth still streams with the same trees, never against one another.
  flag.getWorldQuaternion(inverse).invert();
  direction.set(CAMPUS_WIND_DIRECTION.x, 0, CAMPUS_WIND_DIRECTION.z).normalize().applyQuaternion(inverse);
  const strength = THREE.MathUtils.clamp(wind.strength, 0, 1);
  const gust = THREE.MathUtils.clamp(wind.gust, 0, 1);
  const positions = flag.geometry.getAttribute("position");
  const uv = flag.geometry.getAttribute("uv");
  for (let i = 0; i < positions.count; i++) {
    const u = uv.getX(i), v = uv.getY(i);
    // u=0 stays firmly attached along the entire hoist. Waves travel toward
    // u=1; phase differs per flag, while the gust envelope is shared campus-wide.
    const fold = Math.sin(u * 9.5 - time * 3.1 + phase + v * 0.65);
    const flutter = Math.sin(u * 20 - time * 6.7 + phase * 1.7 - v * 1.8);
    const wave = width * u * ((0.012 + strength * 0.024 + gust * 0.018) * fold + (0.003 + gust * 0.008) * u * flutter);
    const reach = poleRadius + width * u * (0.96 + strength * 0.035);
    const droop = height * (0.055 + (1 - strength) * 0.24) * u * u;
    positions.setXYZ(
      i,
      direction.x * reach - direction.z * wave,
      (v - 1) * height - droop + height * 0.035 * u * fold,
      direction.z * reach + direction.x * wave,
    );
  }
  positions.needsUpdate = true;
  flag.geometry.computeVertexNormals();
  state.time = time;
}

const flagWorldPosition = new THREE.Vector3();

/** Mobile keeps all flags/artwork; only distant cloth tessellation is reduced. */
export function prepareCampusFlag(flag: THREE.Mesh, camera: THREE.PerspectiveCamera | THREE.OrthographicCamera) {
  const state = flag.userData.campusFlag as FlagState;
  if (state.near === state.far) return false;
  flag.getWorldPosition(flagWorldPosition);
  const distance = flagWorldPosition.distanceTo(camera.position) / camera.zoom;
  // Hysteresis avoids repeatedly switching geometry at a walking threshold.
  const near = distance < (flag.geometry === state.near ? 48 : 40);
  const geometry = near ? state.near : state.far;
  if (flag.geometry === geometry) return false;
  flag.geometry = geometry;
  updateCampusFlag(flag, state.time, sampleCampusWind(state.time));
  return true;
}

export function campusFlagSnapshot(flag: THREE.Mesh) {
  const state = flag.userData.campusFlag as FlagState;
  const positions = flag.geometry.getAttribute("position");
  const tipIndex = (flag.geometry as THREE.PlaneGeometry).parameters.widthSegments;
  return {
    id: state.id, width: state.width, height: state.height,
    detail: flag.geometry === state.near ? "near" : "far",
    vertices: positions.count, time: state.time,
    tip: [positions.getX(tipIndex), positions.getY(tipIndex), positions.getZ(tipIndex)],
  };
}

export function disposeCampusFlag(flag: THREE.Mesh) {
  const state = flag.userData.campusFlag as FlagState;
  for (const geometry of new Set([state.near, state.far])) geometry.dispose();
}
