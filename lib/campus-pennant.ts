import * as THREE from "three";
import { CAMPUS_WIND_DIRECTION, type CampusWind } from "./campus-environment";

/** Plain cloth only; existing landmark flag positions and poles are preserved. */
export function makeCampusPennant(
  size: number,
  material: THREE.MeshStandardMaterial,
) {
  const geometry = new THREE.PlaneGeometry(1, 1, 12, 3);
  const positions = geometry.getAttribute("position");
  const uv = geometry.getAttribute("uv");
  for (let i = 0; i < positions.count; i++) {
    const u = uv.getX(i);
    positions.setXYZ(
      i,
      CAMPUS_WIND_DIRECTION.x * u * 0.48 * size,
      (uv.getY(i) - 0.5) * 0.21 * size * (1 - u) - 0.105 * size,
      CAMPUS_WIND_DIRECTION.z * u * 0.48 * size,
    );
  }
  geometry.computeVertexNormals();
  const cloth = material.clone();
  cloth.side = THREE.DoubleSide;
  cloth.roughness = 0.94;
  const flag = new THREE.Mesh(geometry, cloth);
  flag.name = "Breeze-shaped plain pennant";
  flag.userData.campusPennant = {
    size,
    rest: Float32Array.from(positions.array),
  };
  flag.castShadow = true;
  flag.receiveShadow = true;
  flag.frustumCulled = false;
  return flag;
}

export function updateCampusPennant(
  flag: THREE.Mesh,
  time: number,
  wind: CampusWind,
) {
  const { size, rest } = flag.userData.campusPennant as {
    size: number;
    rest: Float32Array;
  };
  const positions = flag.geometry.getAttribute("position");
  const uv = flag.geometry.getAttribute("uv");
  for (let i = 0; i < positions.count; i++) {
    const u = uv.getX(i);
    const wave =
      Math.sin(u * 9 - time * 3.2 + flag.position.y) *
      u *
      size *
      (0.025 + wind.strength * 0.045);
    positions.setXYZ(
      i,
      rest[i * 3] - CAMPUS_WIND_DIRECTION.z * wave,
      rest[i * 3 + 1] + wave * 0.24,
      rest[i * 3 + 2] + CAMPUS_WIND_DIRECTION.x * wave,
    );
  }
  positions.needsUpdate = true;
  flag.geometry.computeVertexNormals();
}
