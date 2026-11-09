import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { CAMPUS_WIND_DIRECTION, sampleCampusWind } from "./campus-environment";
import { campusGroveBeds, campusTrees, type CampusTree } from "./campus-planting";

type Palette = Record<string, THREE.MeshStandardMaterial>;
type TreeForm = CampusTree["form"];
const forms: TreeForm[] = ["spreading", "rounded", "upright", "cypress"];

// Both levels share the same branch skeleton and crown lobes. Only tessellation
// and individual leaf fans change, so distant trees retain their silhouette.
function treeAsset(form: TreeForm, detailed: boolean, mobile: boolean, leaf: THREE.BufferGeometry) {
  const wood: THREE.BufferGeometry[] = [], foliage: THREE.BufferGeometry[] = [];
  let seed = 83 + forms.indexOf(form) * 197;
  const random = () => ((seed = seed * 16807 % 2147483647) - 1) / 2147483646;
  function add(parts: THREE.BufferGeometry[], geometry: THREE.BufferGeometry, flex: number, color = new THREE.Color("#ffffff")) {
    const g = geometry.index ? geometry.toNonIndexed() : geometry;
    if (g !== geometry) geometry.dispose();
    const count = g.getAttribute("position").count;
    const colors = new Float32Array(count * 3), response = new Float32Array(count);
    for (let i = 0; i < count; i++) { color.toArray(colors, i * 3); response[i] = flex; }
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    g.setAttribute("treeFlex", new THREE.BufferAttribute(response, 1));
    parts.push(g);
  }
  const trunk = new THREE.CylinderGeometry(0.065, 0.14, 2.45, detailed ? 7 : 5, 3).translate(0, 1.225, 0);
  add(wood, trunk, 0.025);
  const color = new THREE.Color();
  if (form === "cypress") {
    const crown = new THREE.LatheGeometry([
      new THREE.Vector2(0.15, 0.65), new THREE.Vector2(0.44, 1.1),
      new THREE.Vector2(0.52, 1.9), new THREE.Vector2(0.36, 2.9),
      new THREE.Vector2(0.19, 3.7), new THREE.Vector2(0, 4.2),
    ], detailed ? 10 : 7);
    add(foliage, crown, 0.19, color.set("#5d784c"));
  } else {
    const wide = form === "spreading" ? 1.32 : form === "upright" ? 0.78 : 1;
    const tall = form === "upright" ? 1.25 : form === "spreading" ? 0.8 : 1;
    for (let j = 0; j < 5; j++) {
      const angle = j * Math.PI * 2 / 5 + 0.27;
      const start = new THREE.Vector3(0, 1.35 + (j % 2) * 0.2, 0);
      const end = new THREE.Vector3(Math.cos(angle) * 0.85 * wide, 2.65, Math.sin(angle) * 0.85 * wide);
      const direction = end.clone().sub(start);
      const branch = new THREE.CylinderGeometry(0.02, 0.065, direction.length(), detailed ? 6 : 4, 2);
      branch.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize()));
      branch.translate(...start.add(end).multiplyScalar(0.5).toArray());
      add(wood, branch, 0.16);
    }
    for (let j = 0; j < 23; j++) {
      // Per-lobe seeds keep low/high detail crown centers identical.
      seed = 557 + j * 113 + forms.indexOf(form) * 197;
      const angle = j * 2.39996;
      const elevation = Math.acos(1 - 2 * (j + 0.5) / 23);
      const r = 0.7 + random() * 0.24;
      const center = new THREE.Vector3(Math.cos(angle) * Math.sin(elevation) * r * wide,
        2.65 + Math.cos(elevation) * 0.78 * tall, Math.sin(angle) * Math.sin(elevation) * r);
      const volume = new THREE.IcosahedronGeometry(0.28 + random() * 0.12, detailed && !mobile ? 1 : 0);
      const positions = volume.getAttribute("position");
      for (let vertex = 0; vertex < positions.count; vertex++) {
        const x = positions.getX(vertex), y = positions.getY(vertex), z = positions.getZ(vertex);
        const uneven = 1 + 0.12 * Math.sin(x * 23 + j) * Math.cos(y * 19 - z * 17);
        positions.setXYZ(vertex, x * uneven, y * uneven, z * uneven);
      }
      volume.computeVertexNormals();
      volume.scale(wide, 0.8 * tall, 1).rotateY(angle).translate(...center.toArray());
      color.setHSL(0.23 + random() * 0.035, 0.24, 0.14 + random() * 0.09);
      add(foliage, volume, 0.25, color);
      for (let k = 0; k < (detailed ? mobile ? 8 : 16 : 2); k++) {
        const yaw = angle + k * 2.39996;
        const spread = 0.2 + random() * 0.19;
        const frond = leaf.clone().scale(0.13, 0.1, 0.23)
          .rotateX((random() - 0.45) * 1.8).rotateZ((random() - 0.5) * 0.6).rotateY(yaw)
          .translate(center.x + Math.cos(yaw) * spread * wide, center.y + (random() - 0.5) * 0.55 * tall, center.z + Math.sin(yaw) * spread);
        color.setHSL(0.22 + random() * 0.055, 0.23 + random() * 0.1, 0.21 + random() * 0.12);
        add(foliage, frond, 0.36, color);
      }
    }
  }
  const merge = (parts: THREE.BufferGeometry[]) => {
    const geometry = mergeGeometries(parts)!;
    parts.forEach(part => part.dispose());
    return geometry;
  };
  return [merge(wood), merge(foliage)];
}

const windDeclarations = `
  uniform float treeTime;
  uniform float treeStrength;
  attribute float treeFlex;
  attribute vec2 treeMotion;
`;
const windTransform = `
  float bend = clamp((position.y - .65) / 2.9, 0., 1.3);
  float phase = treeMotion.x;
  float branch = sin(treeTime * .72 + phase) * .24 + sin(treeTime * 1.13 + phase * 1.7) * .12;
  float flutter = sin(treeTime * 2.8 + position.x * 2.4 + position.z * 1.8 + phase) * .055;
  float push = treeStrength * treeMotion.y * treeFlex * bend * (.68 + branch + flutter * bend);
  vec2 breeze = vec2(${CAMPUS_WIND_DIRECTION.x}, ${CAMPUS_WIND_DIRECTION.z});
  // Undo each tree's yaw/scale so the whole grove bends with the SAME breeze.
  vec2 localWind = vec2(dot(instanceMatrix[0].xz, breeze), dot(instanceMatrix[2].xz, breeze))
    / vec2(dot(instanceMatrix[0].xyz, instanceMatrix[0].xyz), dot(instanceMatrix[2].xyz, instanceMatrix[2].xyz));
  transformed.xz += localWind * push;
  transformed.y -= abs(push) * .025 * bend;
`;

export function makeCampusTreeCanopy(palette: Palette, mobile: boolean, leaf: THREE.BufferGeometry) {
  const group = new THREE.Group();
  group.name = "Layered campus woodland";
  const uniforms = { treeTime: { value: 0 }, treeStrength: { value: 0 } };
  const materials: THREE.Material[] = [];
  const geometries = new Set<THREE.BufferGeometry>();
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  const lod = new Int8Array(campusTrees.length).fill(-1);
  const buckets: { form: TreeForm; detailed: boolean; meshes: THREE.InstancedMesh[]; ids: number[] }[] = [];
  const diagnostics = {
    treeCount: campusTrees.length, treeForms: forms.length, groveBeds: campusGroveBeds.length,
    nearTrees: 0, farTrees: 0, treeDrawCalls: 0, treeTriangles: 0,
    treeGeometryTriangles: 0, farTreeShadows: !mobile, windShadowDeformation: true,
  };
  function windMaterial<T extends THREE.Material>(material: T) {
    material.onBeforeCompile = shader => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = windDeclarations + shader.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\n" + windTransform);
    };
    material.customProgramCacheKey = () => "campus-instanced-woodland-v1";
    materials.push(material);
    return material;
  }
  const woodMaterial = windMaterial(palette.trunk.clone());
  woodMaterial.vertexColors = true;
  const foliageMaterial = windMaterial(palette.leaves.clone());
  foliageMaterial.color.set("#ffffff");
  foliageMaterial.vertexColors = true;
  foliageMaterial.side = THREE.DoubleSide;
  const depthMaterial = windMaterial(new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, side: THREE.DoubleSide }));
  for (const form of forms) for (const detailed of [true, false]) {
    const capacity = campusTrees.filter(tree => tree.form === form).length;
    const assets = treeAsset(form, detailed, mobile, leaf);
    const meshes = assets.map((geometry, part) => {
      geometries.add(geometry);
      geometry.setAttribute("treeMotion", new THREE.InstancedBufferAttribute(new Float32Array(capacity * 2), 2).setUsage(THREE.DynamicDrawUsage));
      const mesh = new THREE.InstancedMesh(geometry, part === 0 ? woodMaterial : foliageMaterial, capacity);
      mesh.name = `${form} ${detailed ? "near" : "far"} ${part === 0 ? "branches" : "foliage"}`;
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.customDepthMaterial = depthMaterial;
      mesh.castShadow = detailed || !mobile;
      mesh.receiveShadow = true;
      mesh.count = 0;
      group.add(mesh);
      diagnostics.treeGeometryTriangles += (geometry.index?.count ?? geometry.getAttribute("position").count) / 3;
      return mesh;
    });
    buckets.push({ form, detailed, meshes, ids: [] });
  }
  function prepare(camera: THREE.Camera) {
    let changed = false;
    campusTrees.forEach((tree, i) => {
      const distance = Math.hypot(tree.x - camera.position.x, 2.5 * tree.scale - camera.position.y, tree.z - camera.position.z);
      const threshold = (mobile ? 34 : 58) + (lod[i] === 1 ? 3 : -3);
      const next = distance < threshold ? 1 : 0;
      if (lod[i] !== next) { changed = true; lod[i] = next; }
    });
    if (!changed) return false;
    diagnostics.nearTrees = 0; diagnostics.farTrees = 0;
    diagnostics.treeDrawCalls = 0; diagnostics.treeTriangles = 0;
    for (const bucket of buckets) {
      bucket.ids = campusTrees.flatMap((tree, i) => tree.form === bucket.form && (lod[i] === 1) === bucket.detailed ? [i] : []);
      for (const mesh of bucket.meshes) {
        mesh.count = bucket.ids.length;
        mesh.visible = mesh.count > 0;
        const motion = mesh.geometry.getAttribute("treeMotion") as THREE.InstancedBufferAttribute;
        bucket.ids.forEach((id, i) => {
          const tree = campusTrees[id];
          dummy.position.set(tree.x, 0, tree.z);
          dummy.rotation.set(0, tree.yaw, 0);
          const spread = Math.sqrt(tree.girth);
          dummy.scale.set(tree.scale * spread, tree.scale, tree.scale * spread);
          dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix);
          color.setHSL(0.12 + tree.tone * 0.08, 0.05 + tree.tone * 0.08, 0.76 + tree.tone * 0.18);
          mesh.setColorAt(i, color);
          motion.setXY(i, id * 2.39996, 0.78 + tree.tone * 0.44);
        });
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        motion.needsUpdate = true;
        mesh.computeBoundingSphere();
        // Include the vertex-shader wind displacement in CPU-side culling.
        if (mesh.boundingSphere) mesh.boundingSphere.radius += 0.5;
        if (mesh.count) diagnostics.treeDrawCalls++;
        diagnostics.treeTriangles += mesh.count * (mesh.geometry.index?.count ?? mesh.geometry.getAttribute("position").count) / 3;
      }
      if (bucket.detailed) diagnostics.nearTrees += bucket.ids.length;
      else diagnostics.farTrees += bucket.ids.length;
    }
    return true;
  }

  // Soft local occlusion grounds every tree even when distant mobile shadows
  // are disabled. It is one instanced draw and never needs a shadow-map pass.
  const shadowGeometry = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  geometries.add(shadowGeometry);
  const contactMaterial = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1,
    uniforms: { contactColor: { value: new THREE.Color("#39452b") } },
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.); }`,
    fragmentShader: `uniform vec3 contactColor; varying vec2 vUv;
      void main() { float r = length(vUv - .5) * 2.; float alpha = (1. - smoothstep(.1, 1., r)) * .2;
      gl_FragColor = vec4(contactColor, alpha);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`,
  });
  materials.push(contactMaterial);
  const contacts = new THREE.InstancedMesh(shadowGeometry, contactMaterial, campusTrees.length);
  contacts.name = "Soft tree contact shadows";
  campusTrees.forEach((tree, i) => {
    dummy.position.set(tree.x, 0.072, tree.z); dummy.rotation.set(0, tree.yaw, 0);
    dummy.scale.set(tree.scale * (tree.cypress ? 1.5 : 3), 1, tree.scale * 2.6);
    dummy.updateMatrix(); contacts.setMatrixAt(i, dummy.matrix);
  });
  contacts.computeBoundingSphere(); group.add(contacts);

  return {
    group, diagnostics, prepare,
    update(time: number) {
      uniforms.treeTime.value = time;
      uniforms.treeStrength.value = sampleCampusWind(time).strength;
    },
    dispose() {
      group.traverse(object => { if (object instanceof THREE.InstancedMesh) object.dispose(); });
      geometries.forEach(geometry => geometry.dispose());
      materials.forEach(material => material.dispose());
    },
  };
}
