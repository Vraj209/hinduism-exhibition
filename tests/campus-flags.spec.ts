import { expect, test } from "@playwright/test";
import * as THREE from "three";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import ts from "typescript";
import { campusLayout, pavilions } from "../lib/campus";
import { CAMPUS_WIND_DIRECTION, sampleCampusWind } from "../lib/campus-environment";
import { makeDomedPavilion } from "../lib/domed-pavilion";
import { makeRobbinsvilleMandir } from "../lib/robbinsville-mandir";
import { campusFlagSnapshot, disposeCampusFlag, makeCampusFlagMaterial, makeCampusFlagstaff, prepareCampusFlag, updateCampusFlag } from "../lib/campus-pennant";

function collectFlags(root: THREE.Object3D) {
  const flags: THREE.Mesh[] = [];
  root.traverse(object => { if (object instanceof THREE.Mesh && object.userData.campusFlag) flags.push(object); });
  return flags;
}

function campus(mobile = false) {
  const palette = new Proxy({} as Record<string, THREE.MeshStandardMaterial>, {
    get: (cache, key: string) => cache[key] ?? (cache[key] = new THREE.MeshStandardMaterial()),
  });
  const material = makeCampusFlagMaterial();
  const options = { mobile, material };
  const mandir = makeRobbinsvilleMandir(palette, options);
  mandir.position.set(...campusLayout.mandir);
  const domes = pavilions.map(pavilion => {
    const dome = makeDomedPavilion(pavilion.id, palette, options);
    dome.position.set(...pavilion.position);
    dome.rotation.y = pavilion.rotation;
    return dome;
  });
  const buildings = [mandir, ...domes];
  const flags = buildings.flatMap(collectFlags);
  const dispose = () => {
    buildings.forEach(building => building.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      if (object.userData.campusFlag) disposeCampusFlag(object); else object.geometry.dispose();
    }));
    material.dispose();
    Object.values(palette).forEach(value => value.dispose());
  };
  return { buildings, mandir, domes, flags, dispose };
}

test("supplied artwork is byte-exact, 3:1, opaque, and lit on both sides", async () => {
  const bytes = await readFile("public/textures/baps-flag.png");
  expect(createHash("sha256").update(bytes).digest("hex")).toBe("eef22d04641490020d967ef6f0a6f133ebc721f41343761a06ee15349047caec");
  const metadata = await sharp(bytes).metadata();
  expect([metadata.width, metadata.height, metadata.hasAlpha]).toEqual([636, 212, false]);
  const texture = new THREE.Texture();
  const material = makeCampusFlagMaterial(texture);
  expect(material.map).toBe(texture);
  expect(material.side).toBe(THREE.DoubleSide);
  expect(material.transparent).toBe(false);
  expect(material.opacity).toBe(1);
  expect(material.color.getHex()).toBe(0xffffff);
  material.dispose(); texture.dispose();
});

test("six summit flags and all nine shikhars clear the actual architecture through gusts", () => {
  const model = campus();
  expect(collectFlags(model.mandir)).toHaveLength(9);
  for (const dome of model.domes) expect(collectFlags(dome)).toHaveLength(1);
  expect(new Set(model.flags.map(flag => campusFlagSnapshot(flag).id)).size).toBe(15);
  const main = model.flags.find(flag => campusFlagSnapshot(flag).id === "mandir-principal")!;
  expect(campusFlagSnapshot(main).width).toBeGreaterThan(campusFlagSnapshot(model.flags[0]).width);
  const direction = new THREE.Vector3(CAMPUS_WIND_DIRECTION.x, 0, CAMPUS_WIND_DIRECTION.z).normalize();
  const point = new THREE.Vector3(), origin = new THREE.Vector3(), tip = new THREE.Vector3();
  const ray = new THREE.Raycaster();
  const anchored = new Map<THREE.Mesh, number[]>();
  let clearance = Infinity;
  for (let time = 0; time <= 120; time += 6) {
    for (const building of model.buildings) {
      const architecture = building.children.filter(object => object instanceof THREE.Mesh);
      building.updateMatrixWorld(true);
      for (const flag of collectFlags(building)) {
        updateCampusFlag(flag, time, sampleCampusWind(time));
        const positions = flag.geometry.getAttribute("position"), uv = flag.geometry.getAttribute("uv");
        const edge: number[] = [];
        for (let i = 0; i < positions.count; i++) {
          if (uv.getX(i) === 0) edge.push(positions.getX(i), positions.getY(i), positions.getZ(i));
          if (uv.getY(i) !== 0 || i % 4 !== 0) continue;
          point.fromBufferAttribute(positions, i).applyMatrix4(flag.matrixWorld);
          // Ray down from above all roofs, not from potentially embedded cloth.
          ray.set(origin.set(point.x, 40, point.z), new THREE.Vector3(0, -1, 0));
          const hit = ray.intersectObjects(architecture, false)[0];
          if (hit) clearance = Math.min(clearance, point.y - hit.point.y);
        }
        if (anchored.has(flag)) expect(edge).toEqual(anchored.get(flag)); else anchored.set(flag, edge);
        flag.getWorldPosition(origin);
        tip.fromArray(campusFlagSnapshot(flag).tip).applyMatrix4(flag.matrixWorld).sub(origin).setY(0).normalize();
        expect(tip.dot(direction)).toBeGreaterThan(0.99);
      }
    }
  }
  expect(clearance).toBeGreaterThan(0.35);
  const phases = model.domes.map(dome => {
    const flag = collectFlags(dome)[0];
    updateCampusFlag(flag, 1, sampleCampusWind(1));
    return campusFlagSnapshot(flag).tip[1].toFixed(5);
  });
  expect(new Set(phases).size).toBe(6);
  model.dispose();
});

test("cloth droops in lulls, ripples more in gusts, and mobile LOD preserves the anchored edge", () => {
  const material = makeCampusFlagMaterial();
  const staff = makeCampusFlagstaff("test", 1.5, 1.3, material, { mobile: true, material });
  const flag = collectFlags(staff)[0];
  const camera = new THREE.PerspectiveCamera();
  updateCampusFlag(flag, 5, { ...sampleCampusWind(5), strength: 0, gust: 0 });
  const calm = campusFlagSnapshot(flag);
  updateCampusFlag(flag, 5, { ...sampleCampusWind(5), strength: 1, gust: 1 });
  expect(campusFlagSnapshot(flag).tip[1]).toBeGreaterThan(calm.tip[1] + 0.1);
  const energy = [0, 1].map(gust => {
    let sum = 0;
    for (let t = 0; t < 15; t += 0.1) {
      updateCampusFlag(flag, t, { ...sampleCampusWind(t), strength: 0.25 + gust * 0.6, gust });
      const [x, , z] = campusFlagSnapshot(flag).tip;
      sum += Math.pow(z * CAMPUS_WIND_DIRECTION.x - x * CAMPUS_WIND_DIRECTION.z, 2);
    }
    return sum;
  });
  expect(energy[1]).toBeGreaterThan(energy[0] * 2);
  updateCampusFlag(flag, 8, sampleCampusWind(8));
  const near = campusFlagSnapshot(flag);
  camera.position.set(0, 0, 90);
  expect(prepareCampusFlag(flag, camera)).toBe(true);
  const far = campusFlagSnapshot(flag);
  expect(far.tip).toEqual(near.tip);
  expect(far.vertices).toBe(36);
  expect(far.vertices).toBeLessThan(near.vertices / 2);
  camera.position.z = 10;
  expect(prepareCampusFlag(flag, camera)).toBe(true);
  expect(campusFlagSnapshot(flag).tip).toEqual(near.tip);
  disposeCampusFlag(flag); material.dispose();
  (staff.children[0] as THREE.Mesh).geometry.dispose();
});

for (const width of [1440, 390]) {
  test(`live flags load, move together, pause, and respect reduced motion at ${width}px`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    const canvas = page.locator(".campus-webgl canvas");
    await expect(canvas).toHaveAttribute("data-flag-texture", "ready");
    const state = async () => JSON.parse((await canvas.getAttribute("data-flags"))!) as ReturnType<typeof campusFlagSnapshot>[];
    const before = await state();
    expect(before).toHaveLength(15);
    expect(before.filter(flag => flag.id.startsWith("dome-"))).toHaveLength(6);
    expect(before.filter(flag => flag.id.startsWith("mandir-"))).toHaveLength(9);
    await expect.poll(async () => (await state())[0].time).toBeGreaterThan(before[0].time + 0.3);
    expect((await state()).every((flag, i) => JSON.stringify(flag.tip) !== JSON.stringify(before[i].tip))).toBe(true);
    if (width === 390) {
      expect(before.some(flag => flag.detail === "far")).toBe(true);
      expect(before.some(flag => flag.detail === "near")).toBe(true);
    } else expect(before.every(flag => flag.vertices === 225)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`flags-entrance-${width}.png`) });
    await page.getByRole("button", { name: "Pause garden motion", exact: true }).click();
    await expect(canvas).toHaveAttribute("data-motion", "still");
    // A forced render publishes the final geometry in the existing scene loop.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForTimeout(300);
    const stopped = await state();
    await page.waitForTimeout(350);
    expect(await state()).toEqual(stopped);
    await page.reload();
    await expect(canvas).toHaveAttribute("data-flag-texture", "ready");
    await expect(canvas).toHaveAttribute("data-motion", "still");
    expect((await state()).every(flag => flag.time === 0)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`flags-still-${width}.png`) });
    expect(errors).toEqual([]);
  });
}

// Render the actual production cloth module in an isolated, local WebGL fixture
// so front/reverse artwork and folds can be inspected at useful pixel size.
test("close-up production cloth renders the original emblem on both sides", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1000, height: 500 });
  for (const name of ["campus-pennant", "campus-environment"]) {
    const source = await readFile(`lib/${name}.ts`, "utf8");
    const body = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ES2020 } }).outputText;
    await page.route(`**/__flag-check/${name}`, route => route.fulfill({ contentType: "text/javascript", body }));
  }
  for (const name of ["three.module.js", "three.core.js"]) {
    const body = await readFile(`node_modules/three/build/${name}`, "utf8");
    await page.route(`**/__flag-check/${name}`, route => route.fulfill({ contentType: "text/javascript", body }));
  }
  await page.route("**/__flag-check/view*", route => route.fulfill({ contentType: "text/html", body: `
    <style>body { margin:0; }</style>
    <script type="importmap">{"imports":{"three":"/__flag-check/three.module.js"}}</script>
    <script type="module">
      import * as THREE from 'three';
      import {makeCampusFlagstaff,makeCampusFlagMaterial,updateCampusFlag} from './campus-pennant';
      import {sampleCampusWind} from './campus-environment';
      const scene=new THREE.Scene(); scene.background=new THREE.Color('#527964');
      const renderer=new THREE.WebGLRenderer({antialias:true}); renderer.setSize(1000,500);
      renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.toneMapping=THREE.ACESFilmicToneMapping;
      document.body.appendChild(renderer.domElement);
      scene.add(new THREE.HemisphereLight('#fff7e8','#9c9a7f',1.35));
      const sun=new THREE.DirectionalLight('#fff0d5',2.65); sun.position.set(-42,50,24); scene.add(sun);
      const fill=new THREE.DirectionalLight('#fff8ee',0.45); fill.position.set(20,15,-30); scene.add(fill);
      const texture=await new THREE.TextureLoader().loadAsync('/textures/baps-flag.png');
      texture.colorSpace=THREE.SRGBColorSpace; texture.anisotropy=8;
      const staff=makeCampusFlagstaff('mandir-principal',2.4,1.7,new THREE.MeshStandardMaterial({color:'#9a7842'}),{material:makeCampusFlagMaterial(texture)});
      scene.add(staff);
      const flag=staff.children.find(child=>child.userData.campusFlag);
      const params=new URLSearchParams(location.search), time=Number(params.get('time')||'7');
      updateCampusFlag(flag,time,sampleCampusWind(time));
      const camera=new THREE.PerspectiveCamera(32,2,0.01,20);
      const reverse=params.has('reverse')?-1:1;
      camera.position.set(1.1-1.75*reverse,1.2,0.5+3.85*reverse); camera.lookAt(1.1,1.13,0.5);
      renderer.render(scene,camera); document.body.dataset.ready='true';
    </script>` }));
  for (const view of ["front", "reverse", "flutter"]) {
    await page.goto(`/__flag-check/view?${view === "reverse" ? "reverse=1" : view === "flutter" ? "time=8" : ""}`);
    await expect(page.locator("body")).toHaveAttribute("data-ready", "true");
    const frame = await page.screenshot({ path: testInfo.outputPath(`flag-${view}.png`) });
    const pixels = await sharp(frame).removeAlpha().raw().toBuffer();
    let reds = 0, whites = 0, blacks = 0;
    for (let i = 0; i < pixels.length; i += 3) {
      const [r, g, b] = pixels.subarray(i, i + 3);
      if (r > g * 1.7 && r > b * 1.7 && r > 130) reds++;
      // Warm daylight and the shaded reverse naturally tint the opaque white.
      if (r > 170 && g > 170 && b > 160 && Math.max(r, g, b) - Math.min(r, g, b) < 35) whites++;
      if (r < 90 && g < 90 && b < 90) blacks++;
    }
    expect(reds).toBeGreaterThan(12000);
    expect(whites).toBeGreaterThan(8000);
    expect(blacks).toBeGreaterThan(100);
  }
});
