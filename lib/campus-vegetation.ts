import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { CAMPUS_WIND_DIRECTION, sampleCampusWind } from "./campus-environment";

type Palette = Record<string, THREE.MeshStandardMaterial>;
type Tree = { x: number; z: number; scale: number; cypress: boolean };
type Batch = Map<string, THREE.BufferGeometry[]>;

/** Matching parterres plus two low beds framing the entrance court. */
export const campusFlowerBeds = [-1, 1].flatMap((side) => [
  ...[-27, -17, -7, 3, 13, 23].map((z) => ({ x: side * 6, z })),
  { x: side * 3.8, z: 41.5 },
]);

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
  const trees: Tree[] = [];
  for (const side of [-1, 1]) {
    for (const z of [-27, -17, -7, 3, 13, 23])
      trees.push({ x: side * 25, z, scale: 1.15, cypress: false });
    for (const z of [-32, -12, 8, 28])
      trees.push({ x: side * 18, z, scale: 0.95, cypress: false });
    for (const z of [-48, -40, -33])
      trees.push({ x: side * 23, z, scale: 1.05, cypress: true });
  }
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
  for (const [index, tree] of trees.entries()) {
    const { x, z, scale: s, cypress } = tree;
    const phase = index * 2.39996;
    const anchor: [number, number, number, number] = [x, 1.25 * s, z, 2 * s];
    const trunk = new THREE.CylinderGeometry(
      0.085 * s,
      0.14 * s,
      2.1 * s,
      8,
    ).translate(x, 1.05 * s, z);
    add("trunk", trunk, anchor, 0, phase);
    if (cypress) {
      const crown = new THREE.LatheGeometry(
        [
          new THREE.Vector2(0.18 * s, 0),
          new THREE.Vector2(0.48 * s, 0.7 * s),
          new THREE.Vector2(0.45 * s, 1.5 * s),
          new THREE.Vector2(0.25 * s, 2.6 * s),
          new THREE.Vector2(0, 3.65 * s),
        ],
        mobile ? 9 : 12,
      ).translate(x, 0.5, z);
      add("leavesDark", crown, [x, 0.5, z, 3.65 * s], 0.17, phase);
      foliageClusters++;
    } else {
      for (let j = 0; j < 4; j++) {
        const angle = (j / 4) * Math.PI * 2 + random() * 0.45;
        const start = new THREE.Vector3(x, 1.25 * s, z);
        const end = new THREE.Vector3(
          x + Math.cos(angle) * 0.85 * s,
          (2.2 + random() * 0.35) * s,
          z + Math.sin(angle) * 0.85 * s,
        );
        const direction = end.clone().sub(start);
        const branch = new THREE.CylinderGeometry(
          0.026 * s,
          0.065 * s,
          direction.length(),
          6,
        );
        branch.applyQuaternion(
          new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            direction.clone().normalize(),
          ),
        );
        branch.translate(...start.add(end).multiplyScalar(0.5).toArray());
        add("branch", branch, anchor, 0.13, phase);
      }
      const clusters = mobile ? 12 : 18;
      for (let j = 0; j < clusters; j++) {
        const angle = j * 2.39996 + random() * 0.35;
        const elevation = Math.acos(1 - (2 * (j + 0.5)) / clusters);
        const r = (0.72 + random() * 0.25) * s;
        const center = new THREE.Vector3(
          x + Math.cos(angle) * Math.sin(elevation) * r,
          2.35 * s + Math.cos(elevation) * 0.72 * s,
          z + Math.sin(angle) * Math.sin(elevation) * r,
        );
        // Quiet darker volume behind small irregular leaf fans, rather than isolated balls.
        const volume = new THREE.IcosahedronGeometry(
          (0.16 + random() * 0.075) * s,
          1,
        );
        volume
          .scale(1.25, 0.72, 1)
          .rotateY(angle)
          .translate(...center.toArray());
        add("leavesDark", volume, anchor, 0.23, phase);
        foliageClusters++;
        for (let k = 0; k < (mobile ? 8 : 22); k++) {
          const frond = leaf.clone();
          const yaw = angle + k * 2.39996;
          const leafScale = 0.72 + random() * 0.45;
          const spread = (0.13 + random() * 0.2) * s;
          frond
            .scale(0.15 * s * leafScale, 0.13 * s, 0.27 * s * leafScale)
            .rotateX((random() - 0.45) * 1.75)
            .rotateZ((random() - 0.5) * 0.7)
            .rotateY(yaw);
          frond.translate(
            center.x + Math.cos(yaw) * spread,
            center.y + (random() - 0.5) * 0.4 * s,
            center.z + Math.sin(yaw) * spread,
          );
          add(
            leaves[(j + k) % leaves.length],
            frond,
            anchor,
            0.36,
            phase + k * 0.11,
          );
        }
      }
    }
    add(
      "soil",
      new THREE.CylinderGeometry(0.55 * s, 0.55 * s, 0.06, 16).translate(
        x,
        0.04,
        z,
      ),
      anchor,
      0,
      phase,
    );
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
    diagnostics: {
      driftingLeaves,
      foliageClusters,
      flowerCount,
      shadowDeformation: true,
    },
    dispose() {
      group.traverse((object) => {
        if (object instanceof THREE.Mesh) object.geometry.dispose();
      });
      ownedMaterials.forEach((material) => material.dispose());
    },
  };
}
