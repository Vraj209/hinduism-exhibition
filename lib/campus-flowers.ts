import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { CAMPUS_WIND_DIRECTION, sampleCampusWind } from "./campus-environment";
import { campusFlowerBeds, campusFlowers, flowerBedPoint, type FlowerSpecies } from "./campus-flower-plan";
import { makeFlowerModel } from "./campus-flower-models";

type Palette = Record<string, THREE.MeshStandardMaterial>;
const species: FlowerSpecies[] = ["tulip", "sunflower", "marigold", "rose"];
const declarations = `
  uniform float flowerTime;
  uniform float flowerWind;
  attribute vec4 flowerCrown;
  attribute float flowerPetal;
  attribute vec4 flowerTraits;
  attribute vec3 flowerTint;
`;
const deformation = `
  vec3 headOffset = transformed - flowerCrown.xyz;
  float opening = mix(1., flowerTraits.z, flowerPetal);
  headOffset.xz *= opening * flowerTraits.y;
  headOffset.y *= flowerTraits.y;
  transformed = mix(transformed, flowerCrown.xyz + headOffset, flowerCrown.w);
  float bend = clamp(position.y / max(.1, flowerCrown.y), 0., 1.5);
  float phase = flowerTraits.x;
  float wave = .68 + sin(flowerTime * .72 + phase) * .23 + sin(flowerTime * 1.13 + phase * 1.7) * .12;
  float push = flowerWind * flowerTraits.w * bend * bend * wave;
  vec2 breeze = vec2(${CAMPUS_WIND_DIRECTION.x}, ${CAMPUS_WIND_DIRECTION.z});
  vec2 localWind = vec2(dot(instanceMatrix[0].xz, breeze), dot(instanceMatrix[2].xz, breeze))
    / vec2(dot(instanceMatrix[0].xyz, instanceMatrix[0].xyz), dot(instanceMatrix[2].xyz, instanceMatrix[2].xyz));
  transformed.xz += localWind * push;
  transformed.y -= abs(push) * .06 * bend;
`;

export function makeCampusFlowers(palette: Palette, mobile: boolean) {
  const group = new THREE.Group();
  group.name = "Curved tulip beds, marigold borders, roses and sunflowers";
  const materials: THREE.Material[] = [];
  const geometries = new Set<THREE.BufferGeometry>();
  const uniforms = { flowerTime: { value: 0 }, flowerWind: { value: 0 } };
  const diagnostics = {
    bedCount: campusFlowerBeds.length, flowerCount: campusFlowers.length,
    varieties: Object.fromEntries(species.map(name => [name, campusFlowers.filter(f => f.species === name).length])),
    buds: campusFlowers.filter(f => f.openness < 0.5).length,
    nearFlowers: 0, farFlowers: 0, drawCalls: 0, triangles: 0, geometryTriangles: 0,
    windShadowDeformation: true,
  };
  function windMaterial<T extends THREE.Material>(material: T) {
    material.onBeforeCompile = shader => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = declarations + shader.vertexShader
        .replace("#include <begin_vertex>", "#include <begin_vertex>\n" + deformation)
        .replace("#include <color_vertex>", "#include <color_vertex>\n#ifdef USE_COLOR\nvColor.xyz *= mix(vec3(1.), flowerTint, flowerPetal);\n#endif");
    };
    material.customProgramCacheKey = () => "campus-varied-flowers-v1";
    materials.push(material);
    return material;
  }
  const material = windMaterial(new THREE.MeshStandardMaterial({
    color: "#ffffff", vertexColors: true, side: THREE.DoubleSide, roughness: 0.83,
  }));
  const depth = windMaterial(new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, side: THREE.DoubleSide }));
  const lod = new Int8Array(campusFlowerBeds.length).fill(-1);
  const dummy = new THREE.Object3D(), color = new THREE.Color();
  const buckets = species.flatMap(name => [true, false].map(detailed => {
    const plants = campusFlowers.filter(f => f.species === name);
    const geometry = makeFlowerModel(name, detailed, mobile);
    geometry.setAttribute("flowerTraits", new THREE.InstancedBufferAttribute(new Float32Array(plants.length * 4), 4).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute("flowerTint", new THREE.InstancedBufferAttribute(new Float32Array(plants.length * 3), 3).setUsage(THREE.DynamicDrawUsage));
    geometries.add(geometry);
    diagnostics.geometryTriangles += geometry.getAttribute("position").count / 3;
    const mesh = new THREE.InstancedMesh(geometry, material, plants.length);
    mesh.name = `${name} ${detailed ? "near" : "far"} flowers`;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.customDepthMaterial = depth;
    mesh.castShadow = detailed;
    mesh.receiveShadow = true;
    mesh.count = 0;
    group.add(mesh);
    return { plants, detailed, mesh };
  }));

  // Soil and warm limestone coping follow the exact same curved outline.
  const soilParts: THREE.BufferGeometry[] = [], stoneParts: THREE.BufferGeometry[] = [];
  for (const bed of campusFlowerBeds) {
    const shape = new THREE.Shape();
    const points = Array.from({ length: 64 }, (_, i) => {
      const angle = i / 64 * Math.PI * 2;
      return flowerBedPoint(bed, Math.cos(angle), Math.sin(angle));
    });
    points.forEach((p, i) => { if (!i) shape.moveTo(p.x, -p.z); else shape.lineTo(p.x, -p.z); });
    shape.closePath();
    soilParts.push(new THREE.ShapeGeometry(shape).rotateX(-Math.PI / 2).translate(0, 0.068, 0));
    for (let i = 0; i < points.length; i++) {
      const a = points[i], b = points[(i + 1) % points.length];
      const length = Math.hypot(b.x - a.x, b.z - a.z);
      stoneParts.push(new THREE.BoxGeometry(0.075, 0.075, length * 0.97)
        .rotateY(Math.atan2(b.x - a.x, b.z - a.z)).translate((a.x + b.x) / 2, 0.077, (a.z + b.z) / 2));
    }
  }
  for (const [name, parts, source] of [["Exposed planting soil", soilParts, palette.soil], ["Limestone flower bed edging", stoneParts, palette.ivory]] as const) {
    const geometry = mergeGeometries(parts)!;
    parts.forEach(part => part.dispose()); geometries.add(geometry);
    const surface = source.clone();
    if (name === "Exposed planting soil") surface.color.set("#68513c");
    materials.push(surface);
    const mesh = new THREE.Mesh(geometry, surface);
    mesh.name = name; mesh.receiveShadow = true;
    group.add(mesh);
  }

  function prepare(camera: THREE.Camera) {
    let changed = false;
    campusFlowerBeds.forEach((bed, i) => {
      const distance = Math.hypot(bed.x - camera.position.x, camera.position.y, bed.z - camera.position.z);
      // Hysteresis avoids repeated uploads when walking along a detail boundary.
      const next = distance < (mobile ? 15 : 24) + (lod[i] === 1 ? 2 : -2) ? 1 : 0;
      if (lod[i] !== next) { lod[i] = next; changed = true; }
    });
    if (!changed) return false;
    diagnostics.nearFlowers = 0; diagnostics.farFlowers = 0;
    diagnostics.drawCalls = 2; diagnostics.triangles = 0;
    for (const { plants, detailed, mesh } of buckets) {
      const traits = mesh.geometry.getAttribute("flowerTraits") as THREE.InstancedBufferAttribute;
      const tint = mesh.geometry.getAttribute("flowerTint") as THREE.InstancedBufferAttribute;
      let count = 0;
      for (const plant of plants) {
        if ((lod[plant.bed] === 1) !== detailed) continue;
        dummy.position.set(plant.x, 0.07, plant.z);
        dummy.rotation.set(0, plant.yaw, 0);
        dummy.scale.set(plant.width, plant.height, plant.width);
        dummy.updateMatrix(); mesh.setMatrixAt(count, dummy.matrix);
        color.set(plant.color).multiplyScalar(0.91 + plant.tone * 0.14);
        tint.setXYZ(count, color.r, color.g, color.b);
        traits.setXYZW(count, plant.phase, plant.bloom, plant.openness, plant.species === "sunflower" ? 0.035 : 0.012);
        count++;
      }
      mesh.count = count; mesh.visible = count > 0;
      mesh.instanceMatrix.needsUpdate = true; traits.needsUpdate = true; tint.needsUpdate = true;
      mesh.computeBoundingSphere();
      if (mesh.boundingSphere) mesh.boundingSphere.radius += 0.15;
      if (count) diagnostics.drawCalls++;
      diagnostics.triangles += count * mesh.geometry.getAttribute("position").count / 3;
      if (detailed) diagnostics.nearFlowers += count; else diagnostics.farFlowers += count;
    }
    return true;
  }
  return {
    group, diagnostics, prepare,
    update(time: number) {
      uniforms.flowerTime.value = time;
      uniforms.flowerWind.value = sampleCampusWind(time).strength;
    },
    dispose() {
      buckets.forEach(({ mesh }) => mesh.dispose());
      geometries.forEach(geometry => geometry.dispose());
      materials.forEach(material => material.dispose());
    },
  };
}
