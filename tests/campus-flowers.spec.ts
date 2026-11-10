import { expect, test } from "@playwright/test";
import * as THREE from "three";
import { campusFlowerBeds, campusFlowers, flowerBedPoint } from "../lib/campus-flower-plan";
import { makeCampusFlowers } from "../lib/campus-flowers";
import { flowerHeights } from "../lib/campus-flower-models";
import { campusLayout, pavilions } from "../lib/campus";
import { campusPromenades } from "../lib/campus-obstacles";

function flowers(mobile: boolean) {
  const palette = { soil: new THREE.MeshStandardMaterial(), ivory: new THREE.MeshStandardMaterial() };
  const garden = makeCampusFlowers(palette, mobile);
  return { garden, dispose() { garden.dispose(); Object.values(palette).forEach(m => m.dispose()); } };
}

test("curved flower beds remain symmetric and clear every path, entrance and basin", () => {
  const collisions: string[] = [];
  for (const bed of campusFlowerBeds) {
    expect(campusFlowerBeds.some(other => other.x === -bed.x && other.z === bed.z && other.planting === bed.planting)).toBe(true);
    for (let i = 0; i < 120; i++) {
      const angle = i / 120 * Math.PI * 2;
      const point = flowerBedPoint(bed, Math.cos(angle), Math.sin(angle));
      for (const path of campusPromenades) {
        const dx = Math.abs(point.x - path.x) - path.width / 2;
        const dz = Math.abs(point.z - path.z) - path.depth / 2;
        if (Math.max(dx, dz) <= 0.1) collisions.push(`Path at ${point.x},${point.z}`);
      }
      for (const basin of campusLayout.sideFountains)
        if (Math.hypot(point.x - basin.x, point.z - basin.z) <= basin.radius + 0.15) collisions.push(`Fountain at ${point.x},${point.z}`);
      for (const pavilion of pavilions)
        if (Math.max(Math.abs(point.x - pavilion.position[0]) - 4.3,
          Math.abs(point.z - pavilion.position[2]) - 4.7) <= 0.1) collisions.push(`Pavilion at ${point.x},${point.z}`);
      if (Math.abs(point.x) <= 2.4) collisions.push(`Axis at ${point.x},${point.z}`);
    }
  }
  expect(collisions).toEqual([]);
  for (const plant of campusFlowers) {
    if (plant.species === "sunflower") expect(Math.abs(plant.x)).toBeGreaterThan(16);
    else expect(flowerHeights[plant.species] * plant.height).toBeLessThan(0.31);
  }
  expect(new Set(campusFlowers.filter(f => f.species === "tulip").map(f => f.color)).size).toBe(4);
});

test("mobile reuses eight plant assets and reduces detail without deleting distant blooms", () => {
  const desktop = flowers(false), mobile = flowers(true);
  const camera = new THREE.PerspectiveCamera();
  camera.position.set(3.5, 0.6, 40);
  desktop.garden.prepare(camera); mobile.garden.prepare(camera);
  const high = { ...desktop.garden.diagnostics }, low = mobile.garden.diagnostics;
  expect(low.flowerCount).toBeGreaterThan(1800);
  expect(low.flowerCount).toBe(high.flowerCount);
  expect(low.drawCalls).toBeLessThanOrEqual(10);
  expect(low.geometryTriangles).toBeLessThan(high.geometryTriangles * 0.65);
  expect(low.triangles).toBeLessThan(high.triangles);
  expect(low.buds / low.flowerCount).toBeGreaterThan(0.08);
  expect(low.buds / low.flowerCount).toBeLessThan(0.16);
  const matrices = new Map<string, number[][]>();
  mobile.garden.group.traverse(object => {
    if (object instanceof THREE.InstancedMesh) {
      const matrix = new THREE.Matrix4();
      const entries = matrices.get(object.name.split(" ")[0]) ?? [];
      for (let i = 0; i < object.count; i++) { object.getMatrixAt(i, matrix); entries.push([...matrix.elements]); }
      matrices.set(object.name.split(" ")[0], entries);
    }
  });
  camera.position.fromArray(campusLayout.overhead.position);
  mobile.garden.prepare(camera);
  expect(low.nearFlowers).toBe(0);
  expect(low.farFlowers).toBe(low.flowerCount);
  expect(low.drawCalls).toBe(6);
  mobile.garden.group.traverse(object => {
    if (object instanceof THREE.InstancedMesh && object.count) {
      expect(object.castShadow).toBe(false);
      const matrix = new THREE.Matrix4();
      const positions = new Set(matrices.get(object.name.split(" ")[0])!.map(m => m.join(",")));
      for (let i = 0; i < object.count; i++) { object.getMatrixAt(i, matrix); expect(positions.has(matrix.elements.join(","))).toBe(true); }
    }
  });
  console.log("Flower budget", { desktop: high, mobile: low });
  desktop.dispose(); mobile.dispose();
});

test("flowers and their shadows use the same breeze clock and stay still when time is held", () => {
  const { garden, dispose } = flowers(false);
  const mesh = garden.group.getObjectByName("tulip near flowers") as THREE.InstancedMesh;
  const shaders = [mesh.material as THREE.Material, mesh.customDepthMaterial!].map(material => {
    const shader = { uniforms: {}, vertexShader: "#include <begin_vertex>", fragmentShader: "" } as unknown as THREE.WebGLProgramParametersWithUniforms;
    material.onBeforeCompile(shader, {} as THREE.WebGLRenderer);
    return shader;
  });
  expect(shaders[0].vertexShader).toBe(shaders[1].vertexShader);
  expect(shaders[0].uniforms.flowerTime).toBe(shaders[1].uniforms.flowerTime);
  garden.update(19);
  expect(shaders[0].uniforms.flowerTime.value).toBe(19);
  expect(shaders[0].uniforms.flowerWind.value).toBeGreaterThan(0);
  const wind = shaders[0].uniforms.flowerWind.value;
  garden.update(19);
  expect(shaders[1].uniforms.flowerWind.value).toBe(wind);
  dispose();
});

for (const width of [320, 768]) test(`flower beds render with reduced motion and readable map labels at ${width}px`, async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.setViewportSize({ width, height: width === 320 ? 740 : 1024 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const canvas = page.locator(".campus-webgl canvas");
  await expect(canvas).toHaveAttribute("data-camera-phase", "overview");
  await expect(page.locator(".campus-welcome")).toHaveCount(0);
  const details = JSON.parse((await canvas.getAttribute("data-environment-details"))!).flowers;
  for (const variety of ["tulip", "sunflower", "marigold", "rose"]) expect(details.varieties[variety]).toBeGreaterThan(0);
  expect(details.nearFlowers + details.farFlowers).toBe(details.flowerCount);
  const time = await canvas.getAttribute("data-environment-time");
  await page.waitForTimeout(250);
  expect(await canvas.getAttribute("data-environment-time")).toBe(time);
  await page.screenshot({ path: testInfo.outputPath(`flowers-entrance-${width}.png`) });
  await page.getByRole("button", { name: "Campus Map", exact: true }).click();
  await expect(canvas).toHaveAttribute("data-campus-view", "map");
  for (let id = 1; id <= 6; id++) await expect(page.locator(`#destination-${id}`)).toBeVisible();
  const map = JSON.parse((await canvas.getAttribute("data-environment-details"))!).flowers;
  expect(map.farFlowers).toBe(details.flowerCount);
  await page.screenshot({ path: testInfo.outputPath(`flowers-map-${width}.png`) });
  expect(errors).toEqual([]);
});
