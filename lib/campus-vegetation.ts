import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { CAMPUS_WIND_DIRECTION, sampleCampusWind } from "./campus-environment";
import { campusFlowerBeds, campusTrees, campusGroveBeds } from "./campus-obstacles";
import { makeCampusTreeCanopy } from "./campus-tree-canopy";
export { campusFlowerBeds, campusTrees } from "./campus-obstacles";

type Palette = Record<string, THREE.MeshStandardMaterial>;
type Batch = Map<string, THREE.BufferGeometry[]>;

// A folded, pointed leaf catches light on either half without a texture card.
function leafGeometry() {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      [
        0, 0, 0, -0.48, 0.02, 0.43, 0, 0.12, 0.53, 0, 0, 0, 0, 0.12, 0.53, 0.48,
        0.02, 0.43, -0.48, 0.02, 0.43, 0, 0, 1, 0, 0.12, 0.53, 0, 0.12, 0.53, 0,
        0, 1, 0.48, 0.02, 0.43,
      ],
      3,
    ),
  );
  geometry.setAttribute(
    "uv",
    new THREE.Float32BufferAttribute(
      [
        0.5, 0, 0, 0.43, 0.5, 0.53, 0.5, 0, 0.5, 0.53, 1, 0.43, 0, 0.43, 0.5, 1,
        0.5, 0.53, 0.5, 0.53, 0.5, 1, 1, 0.43,
      ],
      2,
    ),
  );
  geometry.computeVertexNormals();
  return geometry;
}

/** Shared vertex deformation is also compiled into the shadow material. */
const windDeclarations = `
  uniform float gardenTime;
  uniform float gardenStrength;
  attribute vec4 gardenAnchor;
  attribute vec2 gardenResponse;
`;
const windTransform = `
  float bend = max(0., position.y - gardenAnchor.y) / max(.15, gardenAnchor.w);
  float phase = gardenResponse.y;
  float branch = sin(gardenTime * .72 + phase) * .32 + sin(gardenTime * 1.13 + phase * 1.7) * .16;
  float flutter = sin(gardenTime * 2.8 + position.x * 2.4 + position.z * 1.8 + phase) * .09;
  float push = gardenStrength * gardenResponse.x * bend * (.68 + branch + flutter * bend);
  transformed.x += push * ${CAMPUS_WIND_DIRECTION.x.toFixed(4)};
  transformed.z += push * ${CAMPUS_WIND_DIRECTION.z.toFixed(4)};
  transformed.y -= abs(push) * .035 * bend;
`;

export function makeCampusVegetation(palette: Palette, mobile: boolean) {
  const group = new THREE.Group();
  group.name = "Wind-shaped garden planting";
  const batch: Batch = new Map();
  const uniforms = { gardenTime: { value: 0 }, gardenStrength: { value: 0 } };
  const ownedMaterials: THREE.Material[] = [];
  const leaves = ["leaves", "leavesDark", "leavesLight", "leavesOlive"];
  let seed = 41;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const trees = campusTrees;
  const add = (
    material: string,
    geometry: THREE.BufferGeometry,
    anchor: [number, number, number, number],
    strength: number,
    phase: number,
  ) => {
    const count = geometry.getAttribute("position").count;
    const anchors = new Float32Array(count * 4);
    const responses = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      anchors.set(anchor, i * 4);
      responses.set([strength, phase], i * 2);
    }
    geometry.setAttribute(
      "gardenAnchor",
      new THREE.BufferAttribute(anchors, 4),
    );
    geometry.setAttribute(
      "gardenResponse",
      new THREE.BufferAttribute(responses, 2),
    );
    const items = batch.get(material) ?? [];
    items.push(geometry);
    batch.set(material, items);
  };
  let foliageClusters = 0;
  const leaf = leafGeometry();
  const canopy = makeCampusTreeCanopy(palette, mobile, leaf);
  group.add(canopy.group);
  for (const [index, { x, z, scale: s }] of trees.entries()) {
    add("soil", new THREE.CylinderGeometry(0.55 * s, 0.55 * s, 0.06, mobile ? 10 : 16)
      .translate(x, 0.04, z), [x, 0, z, 1], 0, index);
  }
  // Broad, softly irregular mulch islands connect small understory groups.
  for (const [index, bed] of campusGroveBeds.entries()) {
    const shape = new THREE.Shape();
    for (let j = 0; j <= 24; j++) {
      const angle = j * Math.PI * 2 / 24;
      const radius = 0.94 + Math.sin(angle * 3 + index) * 0.04;
      const x = Math.cos(angle) * bed.radiusX * radius;
      const z = Math.sin(angle) * bed.radiusZ * radius;
      if (!j) shape.moveTo(x, z); else shape.lineTo(x, z);
    }
    const anchor: [number, number, number, number] = [bed.x, 0.035, bed.z, 0.5];
    add("soil", new THREE.ShapeGeometry(shape).rotateX(-Math.PI / 2).translate(bed.x, 0.036, bed.z), anchor, 0, index);
    for (let j = 0; j < 9; j++) {
      const angle = j * 2.39996 + index;
      const radius = Math.sqrt((j + 0.5) / 9) * 0.68;
      const x = bed.x + Math.cos(angle) * radius * bed.radiusX;
      const z = bed.z + Math.sin(angle) * radius * bed.radiusZ;
      const height = 0.1 + random() * 0.09;
      const shrub = new THREE.IcosahedronGeometry(1, mobile ? 0 : 1)
        .scale(0.32 + random() * 0.13, height, 0.31 + random() * 0.12)
        .rotateY(angle).translate(x, height + 0.035, z);
      add(leaves[(j + index) % leaves.length], shrub, anchor, 0.055, angle);
      foliageClusters++;
      for (let k = 0; k < (mobile ? 3 : 7); k++) {
        const yaw = k * 2.39996;
        add(leaves[(k + j) % leaves.length], leaf.clone().scale(0.12, 0.08, 0.19)
          .rotateX(-0.35).rotateY(yaw)
          .translate(x + Math.cos(yaw) * 0.28, height * 1.6, z + Math.sin(yaw) * 0.28),
          anchor, 0.07, angle + k * 0.2);
      }
    }
  }
  let flowerCount = 0;
  // At 3.134 metres per unit these blooms top out below .25 units (0.8 m).
  for (const { x, z } of campusFlowerBeds) {
    for (let i = 0; i < 6; i++)
      for (let j = 0; j < 3; j++) {
        const bx = x + (j - 1) * 0.65;
        const bz = z + (i - 2.5) * 0.78;
        const phase = random() * Math.PI * 2;
        const anchor: [number, number, number, number] = [bx, 0.065, bz, 0.18];
        const h = 0.18 + random() * 0.05;
        add(
          "leavesDark",
          new THREE.CylinderGeometry(0.004, 0.006, h - 0.065, 5).translate(
            bx,
            (h + 0.065) / 2,
            bz,
          ),
          anchor,
          0.025,
          phase,
        );
        for (let k = 0; k < 5; k++) {
          const petal = leaf
            .clone()
            .scale(0.055, 0.025, 0.08)
            .rotateY((k * Math.PI * 2) / 5)
            .translate(bx, h, bz);
          add(
            ["flowerCream", "flowerRose", "flowerGold"][(i + j) % 3],
            petal,
            anchor,
            0.03,
            phase,
          );
        }
        for (let k = 0; k < 2; k++)
          add(
            "leaves",
            leaf
              .clone()
              .scale(0.05, 0.025, 0.085)
              .rotateX(-0.4)
              .rotateY(phase + k * Math.PI)
              .translate(bx, h - 0.055, bz),
            anchor,
            0.035,
            phase,
          );
        flowerCount++;
      }
  }
  const windMaterial = (material: THREE.Material) => {
    material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader =
        windDeclarations +
        shader.vertexShader.replace(
          "#include <begin_vertex>",
          "#include <begin_vertex>\n" + windTransform,
        );
    };
    material.customProgramCacheKey = () => "campus-living-foliage-v1";
    ownedMaterials.push(material);
    return material;
  };
  for (const [key, geometries] of batch) {
    const normalized = geometries.map((g) => (g.index ? g.toNonIndexed() : g));
    const merged = mergeGeometries(normalized);
    normalized.forEach((g) => g.dispose());
    geometries.forEach((g) => g.dispose());
    if (!merged) continue;
    const material = (key === "branch" ? palette.trunk : palette[key]).clone();
    material.side = THREE.DoubleSide;
    windMaterial(material);
    const mesh = new THREE.Mesh(merged, material);
    mesh.name = `Garden ${key}`;
    mesh.castShadow = key !== "soil";
    mesh.receiveShadow = true;
    mesh.customDepthMaterial = windMaterial(
      new THREE.MeshDepthMaterial({
        depthPacking: THREE.RGBADepthPacking,
        side: THREE.DoubleSide,
      }),
    );
    group.add(mesh);
  }

  const driftingLeaves = mobile ? 5 : 11;
  const driftMaterial = new THREE.MeshStandardMaterial({
    color: "#92804d",
    roughness: 0.9,
    side: THREE.DoubleSide,
  });
  ownedMaterials.push(driftMaterial);
  const falling = new THREE.InstancedMesh(leaf, driftMaterial, driftingLeaves);
  falling.name = "Sparse drifting and resting leaves";
  falling.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  falling.castShadow = !mobile;
  falling.receiveShadow = true;
  falling.frustumCulled = false;
  group.add(falling);
  const deciduous = trees.filter((tree) => !tree.cypress);
  const dummy = new THREE.Object3D();
  const update = (time: number) => {
    const wind = sampleCampusWind(time);
    canopy.update(time);
    uniforms.gardenTime.value = time;
    uniforms.gardenStrength.value = wind.strength;
    for (let i = 0; i < driftingLeaves; i++) {
      const tree = deciduous[(i * 7 + 2) % deciduous.length];
      const cycle = (time + i * 3.71) % 25;
      const airborne = Math.min(cycle / 11, 1);
      // Integrate the same gentle gust field over this leaf's flight. This
      // changes velocity coherently rather than jumping its position with gusts.
      const flightTime = Math.min(cycle, 11);
      const start = time - cycle;
      let drift = 0;
      for (let sample = 0; sample < 8; sample++) {
        const weather = sampleCampusWind(
          start + ((sample + 0.5) * flightTime) / 8,
        );
        drift += ((0.13 + 0.18 * weather.strength) * flightTime) / 8;
      }
      const groundTime = Math.max(0, cycle - 11);
      for (let sample = 0; sample < 8; sample++) {
        const weather = sampleCampusWind(
          start + 11 + ((sample + 0.5) * groundTime) / 8,
        );
        drift += (Math.max(0, weather.gust - 0.4) * 0.13 * groundTime) / 8;
      }
      const flutter = Math.sin(cycle * 1.1 + i) * 0.22 * (1 - airborne);
      dummy.position.set(
        tree.x + 0.4 + CAMPUS_WIND_DIRECTION.x * drift + flutter,
        0.008 + Math.max(0, 1 - Math.pow(airborne, 1.16)) * 2.8 * tree.scale,
        tree.z +
          CAMPUS_WIND_DIRECTION.z * drift +
          Math.sin(cycle * 0.7 + i) * 0.28 * (1 - airborne),
      );
      dummy.rotation.set(
        airborne < 1 ? Math.sin(cycle * 1.4 + i) * 0.9 : -0.02,
        i * 0.7 + cycle * (airborne < 1 ? 0.3 : 0.025),
        airborne < 1 ? Math.sin(cycle * 0.9) * 0.5 : 0,
      );
      const fade = cycle > 23 ? (25 - cycle) / 2 : Math.min(1, cycle * 2);
      dummy.scale.setScalar(0.2 * fade);
      dummy.updateMatrix();
      falling.setMatrixAt(i, dummy.matrix);
    }
    falling.instanceMatrix.needsUpdate = true;
  };
  update(0);
  return {
    group,
    update,
    prepare: canopy.prepare,
    diagnostics: {
      planting: canopy.diagnostics,
      driftingLeaves,
      foliageClusters,
      flowerCount,
      shadowDeformation: true,
    },
    dispose() {
      group.remove(canopy.group);
      canopy.dispose();
      group.traverse((object) => {
        if (object instanceof THREE.Mesh) object.geometry.dispose();
      });
      ownedMaterials.forEach((material) => material.dispose());
    },
  };
}
