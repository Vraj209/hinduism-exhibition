import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { FlowerSpecies } from "./campus-flower-plan";

export const flowerHeights: Record<FlowerSpecies, number> = {
  tulip: 0.23, sunflower: 0.67, marigold: 0.105, rose: 0.25,
};

/** A gently cupped petal, with a folded midrib and a rounded, irregular lip. */
function petal(width: number, length: number, cup: number, rows: number, columns: number, rounded = false) {
  const positions: number[] = [], indices: number[] = [];
  for (let row = 0; row <= rows; row++) for (let col = 0; col <= columns; col++) {
    const v = row / rows, u = col / columns * 2 - 1;
    const edge = Math.pow(Math.sin(Math.PI * v * (rounded ? 0.8 : 1)), 0.65);
    positions.push(u * width * edge, cup * v * v + width * 0.2 * (1 - u * u) * edge
      - (rounded ? width * 0.25 * u * u * v ** 4 : 0),
      length * v + Math.cos(u * Math.PI / 2) * length * 0.08 * v);
    if (row < rows && col < columns) {
      const a = row * (columns + 1) + col, b = a + columns + 1;
      indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/** Eight shared assets (four species × two detail levels), with per-vertex
 * foliage/petal colors. Instancing varies bloom color without tinting leaves. */
export function makeFlowerModel(species: FlowerSpecies, detailed: boolean, mobile: boolean) {
  const parts: THREE.BufferGeometry[] = [];
  const height = flowerHeights[species];
  const crownY = height - (species === "tulip" ? 0.06 : 0);
  const tilt = species === "sunflower" ? 1.05 : 0.12;
  const rows = detailed ? (mobile ? 3 : 5) : 2;
  const columns = detailed ? (mobile ? 2 : 3) : 1;
  function add(source: THREE.BufferGeometry, color: string, head = false, tinted = false) {
    if (head) source.rotateX(tilt).translate(0, crownY, 0);
    const geometry = source.index ? source.toNonIndexed() : source;
    if (geometry !== source) source.dispose();
    geometry.deleteAttribute("uv");
    const count = geometry.getAttribute("position").count;
    const rgb = new THREE.Color(color), colors = new Float32Array(count * 3);
    const crowns = new Float32Array(count * 4), petals = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      colors.set(rgb.toArray(), i * 3);
      crowns.set([0, crownY, 0, head ? 1 : 0], i * 4);
      petals[i] = tinted ? 1 : 0;
    }
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("flowerCrown", new THREE.BufferAttribute(crowns, 4));
    geometry.setAttribute("flowerPetal", new THREE.BufferAttribute(petals, 1));
    parts.push(geometry);
  }
  add(new THREE.CylinderGeometry(species === "sunflower" ? 0.009 : 0.004,
    species === "sunflower" ? 0.012 : 0.006, crownY, detailed ? 5 : 3)
    .translate(0, crownY / 2, 0), "#527145");
  const leafCount = detailed ? (species === "sunflower" ? 5 : species === "rose" ? 5 : 3) : 2;
  for (let i = 0; i < leafCount; i++) {
    const broad = species === "sunflower" || species === "rose";
    const length = species === "sunflower" ? 0.15 : species === "tulip" ? 0.13 : 0.075;
    add(petal(broad ? length * 0.36 : length * 0.18, length, length * 0.25, rows, 2)
      .rotateX(species === "tulip" ? -0.85 : -0.25)
      .rotateY(i * 2.39996).translate(0, crownY * (0.16 + i * 0.13), 0),
    i % 2 ? "#64854c" : "#42693c");
  }
  if (species === "tulip") {
    for (let i = 0; i < 6; i++) {
      const inner = i % 2 === 0;
      add(petal(inner ? 0.039 : 0.046, inner ? 0.047 : 0.06, inner ? 0.067 : 0.059, rows, columns, true)
        .translate(0, inner ? 0.006 : 0, 0.007).rotateY(i * Math.PI / 3),
      inner ? "#fff9ee" : "#e7d7ce", true, true);
    }
    if (detailed) add(new THREE.SphereGeometry(0.012, 5, 3).scale(1, 0.4, 1).translate(0, 0.014, 0), "#8a7033", true);
  } else if (species === "sunflower") {
    const count = detailed ? 17 : 10;
    for (let i = 0; i < count; i++)
      add(petal(0.022, 0.095, 0.009, rows, columns).translate(0, 0, 0.038)
        .rotateY(i * Math.PI * 2 / count), i % 3 ? "#fff4ca" : "#e5c78b", true, true);
    add(new THREE.SphereGeometry(0.052, detailed ? 12 : 7, detailed ? 6 : 3)
      .scale(1, 0.28, 1).translate(0, 0.012, 0), "#5d3c24", true);
    if (detailed && !mobile) for (let i = 0; i < 13; i++) {
      const a = i * 2.39996, r = Math.sqrt(i / 13) * 0.043;
      add(new THREE.IcosahedronGeometry(0.005, 0).translate(Math.cos(a) * r, 0.025, Math.sin(a) * r), "#9c7440", true);
    }
  } else {
    const rose = species === "rose";
    const rings = detailed ? 3 : 2;
    for (let ring = 0; ring < rings; ring++) {
      const count = detailed ? (rose ? 7 : 9) : 5;
      const size = 1 - ring * 0.24;
      for (let i = 0; i < count; i++)
        add(petal((rose ? 0.038 : 0.023) * size, (rose ? 0.064 : 0.047) * size,
          (rose ? 0.025 : 0.018) * size, rows, columns, true)
          .rotateY(i * Math.PI * 2 / count + ring * 0.57).translate(0, ring * 0.013, 0),
        ring === 1 ? "#eddbce" : "#fff5e4", true, true);
    }
    add(new THREE.SphereGeometry(rose ? 0.016 : 0.012, 5, 3)
      .scale(1, 0.8, 1).translate(0, 0.035, 0), "#e2bd87", true, true);
  }
  const geometry = mergeGeometries(parts)!;
  parts.forEach(part => part.dispose());
  return geometry;
}
