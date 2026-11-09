import { expect, test } from "@playwright/test";
import * as THREE from "three";
import { campusLayout, pavilions } from "../lib/campus";
import { campusTrees, campusGroveBeds } from "../lib/campus-planting";
import { isCampusWalkable } from "../lib/campus-navigation";
import { makeCampusVegetation } from "../lib/campus-vegetation";

function vegetation(mobile: boolean) {
  const palette = new Proxy({} as Record<string, THREE.MeshStandardMaterial>, {
    get: (cache, key: string) => cache[key] ?? (cache[key] = new THREE.MeshStandardMaterial()),
  });
  const garden = makeCampusVegetation(palette, mobile);
  const camera = new THREE.PerspectiveCamera();
  camera.position.fromArray(campusLayout.arrival.position);
  garden.prepare(camera);
  return { garden, camera, dispose() { garden.dispose(); Object.values(palette).forEach(material => material.dispose()); } };
}

test("layered planting shelters every pavilion without closing the axis, entrances or walks", () => {
  expect(campusTrees.length).toBeGreaterThanOrEqual(120);
  expect(campusTrees.filter(tree => tree.zone === "boundary").length).toBeGreaterThanOrEqual(60);
  expect(new Set(campusTrees.map(tree => tree.form)).size).toBe(4);
  expect(Math.max(...campusTrees.map(tree => tree.scale)) - Math.min(...campusTrees.map(tree => tree.scale))).toBeGreaterThan(0.5);
  for (const pavilion of pavilions) {
    const grove = campusTrees.filter(tree => tree.pavilionId === pavilion.id);
    expect(grove.length).toBeGreaterThanOrEqual(4);
    expect(grove.some(tree => Math.abs(tree.x) > 24)).toBe(true);
    expect(grove.some(tree => Math.abs(tree.z - pavilion.position[2]) > 6)).toBe(true);
  }
  for (let i = 0; i < campusTrees.length; i++) {
    const tree = campusTrees[i];
    // Background trees are beyond the building; none occupy the axial garden.
    if (tree.z > -70) expect(Math.abs(tree.x)).toBeGreaterThan(14);
    for (const other of campusTrees.slice(i + 1))
      expect(Math.hypot(tree.x - other.x, tree.z - other.z)).toBeGreaterThanOrEqual(1.8);
  }
  for (const side of [-1, 1]) {
    const avenue = campusTrees.filter(tree => tree.zone === "walk" && Math.sign(tree.x) === side);
    expect(avenue).toHaveLength(4);
    for (let i = 1; i < avenue.length; i++) expect(avenue[i].z - avenue[i - 1].z).toBe(20);
    for (let z = -34; z < 37; z += 0.5) expect(isCampusWalkable(side * 11.5, z)).toBe(true);
  }
  for (let z = 34; z < 54; z += 0.5) expect(isCampusWalkable(0, z)).toBe(true);
  for (const bed of campusGroveBeds) expect(isCampusWalkable(bed.x, bed.z)).toBe(false);
});

test("instanced crowns clear the pavilion walls and mandir while keeping mobile density", () => {
  const desktop = vegetation(false), mobile = vegetation(true);
  const matrix = new THREE.Matrix4();
  const buildings = [
    ...pavilions.map(p => new THREE.Box3(
      new THREE.Vector3(p.position[0] - 4.2, 0, p.position[2] - 4.6),
      new THREE.Vector3(p.position[0] + 4.2, 10, p.position[2] + 4.6),
    )),
    new THREE.Box3(new THREE.Vector3(-12.4, 0, -70.04), new THREE.Vector3(12.4, 18.6, -36.47)),
  ];
  desktop.garden.group.traverse(object => {
    if (!(object instanceof THREE.InstancedMesh) || !/foliage$/.test(object.name)) return;
    object.geometry.computeBoundingBox();
    for (let i = 0; i < object.count; i++) {
      object.getMatrixAt(i, matrix);
      const bounds = object.geometry.boundingBox!.clone().applyMatrix4(matrix);
      for (const building of buildings)
        expect(bounds.intersectsBox(building), `${object.name} at ${new THREE.Vector3().setFromMatrixPosition(matrix).toArray()}`).toBe(false);
    }
  });
  const high = desktop.garden.diagnostics.planting, low = mobile.garden.diagnostics.planting;
  expect(high.treeCount).toBe(low.treeCount);
  expect(low.treeTriangles).toBeLessThan(high.treeTriangles * 0.65);
  expect(low.treeGeometryTriangles).toBeLessThan(high.treeGeometryTriangles * 0.65);
  expect(low.treeDrawCalls).toBeLessThanOrEqual(16);
  mobile.garden.group.traverse(object => {
    if (object instanceof THREE.InstancedMesh && /far (foliage|branches)$/.test(object.name)) expect(object.castShadow).toBe(false);
  });
  mobile.camera.position.fromArray(campusLayout.overhead.position);
  mobile.garden.prepare(mobile.camera);
  expect(low.nearTrees).toBe(0);
  expect(low.farTrees).toBe(campusTrees.length);
  expect(low.treeDrawCalls).toBe(8);
  desktop.dispose(); mobile.dispose();
});

test("branch, foliage and shadow passes share the weather clock and instance phases", () => {
  const { garden, dispose } = vegetation(false);
  const mesh = garden.group.getObjectByName("spreading near foliage") as THREE.InstancedMesh;
  const motion = mesh.geometry.getAttribute("treeMotion");
  expect(new Set(Array.from({ length: mesh.count }, (_, i) => motion.getX(i))).size).toBe(mesh.count);
  const shaders = [mesh.material as THREE.Material, mesh.customDepthMaterial!].map(material => {
    const shader = { uniforms: {}, vertexShader: "#include <begin_vertex>", fragmentShader: "" } as unknown as THREE.WebGLProgramParametersWithUniforms;
    material.onBeforeCompile(shader, {} as THREE.WebGLRenderer);
    return shader;
  });
  expect(shaders[0].vertexShader).toBe(shaders[1].vertexShader);
  expect(shaders[0].uniforms.treeTime).toBe(shaders[1].uniforms.treeTime);
  garden.update(17);
  expect(shaders[0].uniforms.treeTime.value).toBe(17);
  expect(shaders[0].uniforms.treeStrength.value).toBeGreaterThan(0);
  garden.update(17);
  expect(shaders[1].uniforms.treeTime.value).toBe(17);
  dispose();
});

for (const width of [1440, 390]) test(`woodland renders and pauses with the garden at ${width}px`, async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
  await page.goto("/");
  const canvas = page.locator(".campus-webgl canvas");
  await expect(canvas).toHaveAttribute("data-camera-phase", "overview");
  const planting = JSON.parse((await canvas.getAttribute("data-environment-details"))!).planting;
  expect(planting.treeCount).toBe(campusTrees.length);
  expect(planting.nearTrees).toBeGreaterThan(0);
  expect(planting.farTrees).toBeGreaterThan(0);
  const time = Number(await canvas.getAttribute("data-environment-time"));
  await expect.poll(async () => Number(await canvas.getAttribute("data-environment-time"))).toBeGreaterThan(time + 0.25);
  await page.getByRole("button", { name: "Pause garden motion", exact: true }).click();
  await expect(canvas).toHaveAttribute("data-motion", "still");
  const stopped = await canvas.getAttribute("data-environment-time");
  await page.waitForTimeout(300);
  expect(await canvas.getAttribute("data-environment-time")).toBe(stopped);
  await page.screenshot({ path: testInfo.outputPath(`planting-entrance-${width}.png`) });
  await page.getByRole("button", { name: "Campus Map", exact: true }).click();
  await expect(canvas).toHaveAttribute("data-campus-view", "map");
  await expect(canvas).toHaveAttribute("data-camera-phase", "overview");
  for (let id = 1; id <= 6; id++) await expect(page.locator(`#destination-${id}`)).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath(`planting-map-${width}.png`) });
  expect(errors).toEqual([]);
});
