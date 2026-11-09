import { expect, test, type Page } from "@playwright/test";
import * as THREE from "three";
import sharp from "sharp";
import { campusBirds, makeCampusBirds, sampleCampusBird } from "../lib/campus-birds";
import { campusLayout } from "../lib/campus";
import { makeRobbinsvilleMandir } from "../lib/robbinsville-mandir";
import { makeCampusSky } from "../lib/campus-sky";
import { createCampusBirdAudio } from "../lib/campus-bird-audio";

test("distant curved flight corridors clear the real mandir and never wrap or teleport", () => {
  const palette = new Proxy({} as Record<string, THREE.MeshStandardMaterial>, {
    get: (cache, key: string) => cache[key] ?? (cache[key] = new THREE.MeshStandardMaterial()),
  });
  const mandir = makeRobbinsvilleMandir(palette);
  mandir.position.set(...campusLayout.mandir);
  const bounds = new THREE.Box3().setFromObject(mandir);
  const arrival = new THREE.Vector3(...campusLayout.arrival.position);
  const point = new THREE.Vector3();
  let minimumClearance = Infinity, minimumCameraDistance = Infinity, maxStep = 0;
  let minX = Infinity, maxX = -Infinity, glides = 0, flaps = 0;
  let minimumOverheadAltitude = Infinity, rearMaxZ = -Infinity;
  for (const bird of campusBirds(false)) {
    for (let time = 0; time <= 1400; time += 0.5) {
      const state = sampleCampusBird(bird, time);
      point.set(state.x, state.y, state.z);
      minimumClearance = Math.min(minimumClearance, bounds.distanceToPoint(point));
      minimumCameraDistance = Math.min(minimumCameraDistance, arrival.distanceTo(point));
      minX = Math.min(minX, state.x); maxX = Math.max(maxX, state.x);
      const next = sampleCampusBird(bird, time + 1 / 20);
      maxStep = Math.max(maxStep, Math.hypot(next.x - state.x, next.y - state.y, next.z - state.z));
      if (state.gliding) glides++; else flaps++;
      if (bird.flock === 2) rearMaxZ = Math.max(rearMaxZ, state.z);
      else minimumOverheadAltitude = Math.min(minimumOverheadAltitude, state.y);
    }
  }
  expect(minimumClearance).toBeGreaterThan(8);
  expect(rearMaxZ).toBeLessThan(-83);
  expect(minimumOverheadAltitude).toBeGreaterThan(28);
  expect(minimumCameraDistance).toBeGreaterThan(35);
  expect(maxStep).toBeLessThan(0.12);
  expect(minX).toBeLessThan(-173); expect(maxX).toBeGreaterThan(173);
  expect(glides / (glides + flaps)).toBeGreaterThan(0.25);
  expect(glides / (glides + flaps)).toBeLessThan(0.4);
  const raycaster = new THREE.Raycaster();
  let occluded = 0;
  const rearBird = campusBirds(false).find(bird => bird.flock === 2)!;
  for (let time = 490; time < 525; time += 0.5) {
    const state = sampleCampusBird(rearBird, time);
    point.set(state.x, state.y, state.z).sub(arrival);
    raycaster.far = point.length();
    raycaster.set(arrival, point.normalize());
    if (raycaster.intersectObject(mandir, true).length) occluded++;
  }
  expect(occluded, "A distant flock passes behind actual mandir geometry").toBeGreaterThan(0);
  mandir.traverse(object => {
    if (object instanceof THREE.Mesh) {
      object.geometry.dispose();
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) material.dispose();
    }
  });
});

test("birds use scene depth, bounded instances and a smaller mobile budget", () => {
  const desktop = makeCampusBirds(false), mobile = makeCampusBirds(true);
  expect(desktop.diagnostics.birds).toBe(12);
  expect(mobile.diagnostics.birds).toBe(5);
  expect(desktop.group.children).toHaveLength(2);
  for (const object of desktop.group.children as THREE.InstancedMesh[]) {
    expect((object.material as THREE.Material).depthTest).toBe(true);
    expect(object.renderOrder).toBe(0);
    expect(object.castShadow).toBe(false);
  }
  desktop.update(34);
  const before = desktop.snapshot();
  desktop.update(34);
  expect(desktop.snapshot()).toEqual(before);
  expect(new Set(before.birds.map(bird => bird.wing)).size).toBeGreaterThan(6);
  desktop.dispose(); mobile.dispose();
});

test("cloud advection stays continuous over long sessions with subtle sunlight variation", () => {
  const sky = makeCampusSky(false), mobile = makeCampusSky(true);
  expect(mobile.diagnostics.cloudLayers).toBeLessThan(sky.diagnostics.cloudLayers);
  expect(mobile.diagnostics.densitySamples).toBeLessThan(sky.diagnostics.densitySamples);
  for (const time of [0, 59.99, 60, 599.99, 600, 3600, 86400]) {
    const sunlight = sky.update(time);
    const before = sky.snapshot();
    sky.update(time + 0.05);
    const after = sky.snapshot();
    expect(Math.hypot(after.offset[0] - before.offset[0], after.offset[1] - before.offset[1])).toBeCloseTo(0.08, 4);
    expect(sunlight).toBeGreaterThanOrEqual(0.975);
    expect(sunlight).toBeLessThanOrEqual(1);
  }
  sky.dispose(); mobile.dispose();
});

async function hidden(page: Page, value: boolean) {
  // Deterministic lifecycle event, not a claim to emulate the OS tab manager.
  await page.evaluate(value => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => value });
    document.dispatchEvent(new Event("visibilitychange"));
  }, value);
}

for (const width of [1440, 390]) {
  test(`sky renders and pauses without clock jumps at ${width}px`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    const canvas = page.locator(".campus-webgl canvas");
    await expect(canvas).toHaveAttribute("data-camera-phase", "overview");
    const state = async () => JSON.parse((await canvas.getAttribute("data-bird-state"))!) as { time: number; birds: unknown[] };
    const initial = await state();
    expect(initial.birds).toHaveLength(width === 390 ? 5 : 12);
    await expect.poll(async () => (await state()).time).toBeGreaterThan(initial.time + 0.3);
    await page.evaluate(() => document.fonts.ready);
    // A moving clock alone missed the original visibility regression. Inspect
    // actual sky pixels: dark blue-grey bird silhouettes and cloud displacement
    // over a normal five-second glance, excluding the warm architecture/UI.
    const firstFrame = await page.screenshot({ path: testInfo.outputPath(`sky-${width}-start.png`) });
    await page.waitForTimeout(5000);
    const secondFrame = await page.screenshot({ path: testInfo.outputPath(`sky-${width}-end.png`) });
    const firstPixels = await sharp(firstFrame).removeAlpha().raw().toBuffer();
    const secondPixels = await sharp(secondFrame).removeAlpha().raw().toBuffer();
    const height = width === 390 ? 844 : 900;
    let birdPixels = 0, cloudPixels = 0, changedCloudPixels = 0;
    for (let y = Math.floor(height * 0.25); y < height * 0.45; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 3;
        const [r, g, b] = firstPixels.subarray(i, i + 3);
        if (r < 130 && g < 155 && b < 170 && b > r + 5 && g > r + 4 && b >= g * 0.95) birdPixels++;
        if (r < 150 || g < 150 || b < 150) continue;
        const difference = (Math.abs(r - secondPixels[i]) + Math.abs(g - secondPixels[i + 1]) + Math.abs(b - secondPixels[i + 2])) / 3;
        if (difference >= 4) changedCloudPixels++;
        cloudPixels++;
      }
    }
    const changedSky = changedCloudPixels / cloudPixels;
    await testInfo.attach("visible-sky-metrics", { body: JSON.stringify({ width, birdPixels, changedSky }), contentType: "application/json" });
    expect(birdPixels, "Visible bird silhouettes, not subpixel specks").toBeGreaterThanOrEqual(width === 390 ? 8 : 20);
    expect(changedSky, "Cloud drift is visible within five seconds").toBeGreaterThan(width === 390 ? 0.12 : 0.04);
    const stopped = async () => {
      await expect(canvas).toHaveAttribute("data-motion", "still");
      const before = await state();
      const clouds = await canvas.getAttribute("data-cloud-offset");
      const frames = await canvas.getAttribute("data-render-count");
      await page.waitForTimeout(350);
      expect(await state()).toEqual(before);
      expect(await canvas.getAttribute("data-cloud-offset")).toEqual(clouds);
      expect(await canvas.getAttribute("data-render-count")).toEqual(frames);
      return before;
    };
    await page.screenshot({ path: testInfo.outputPath(`sky-${width}.png`) });
    await page.getByRole("button", { name: "Pause garden motion", exact: true }).click();
    await stopped();
    await page.getByRole("button", { name: "Resume garden motion", exact: true }).click();
    await hidden(page, true);
    const paused = await stopped();
    await hidden(page, false);
    await expect.poll(async () => (await state()).time).toBeGreaterThan(paused.time);
    expect((await state()).time - paused.time).toBeLessThan(0.3);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await stopped();
    // On an initial reduced-motion visit the sky is a static composition.
    await page.reload();
    await expect(canvas).toHaveAttribute("data-bird-state", /birds/);
    expect((await stopped()).time).toBe(0);
    expect(errors).toEqual([]);
  });
}

test("bird calls are opt-in and suspend with the whole outdoor ambience", async ({ page }) => {
  test.setTimeout(45_000);
  await page.goto("/");
  const controls = page.getByRole("group", { name: "Garden ambience", exact: true });
  await expect(controls).toHaveAttribute("data-audio-context", "not-created");
  await page.getByRole("button", { name: "Enable Ambience", exact: true }).click();
  const sound = async () => JSON.parse((await controls.getAttribute("data-bird-audio"))!) as { calls: number; active: number; gain: number };
  await expect.poll(async () => (await sound()).calls, { timeout: 20_000 }).toBe(1);
  expect((await sound()).gain).toBeGreaterThan(0);
  expect((await sound()).gain).toBeLessThan(0.05);
  await expect.poll(async () => (await sound()).active).toBe(0);
  await hidden(page, true);
  await expect(controls).toHaveAttribute("data-audio-context", "suspended");
  const paused = await sound();
  await page.waitForTimeout(400);
  expect(await sound()).toEqual(paused);
  await hidden(page, false);
  await expect(controls).toHaveAttribute("data-audio-context", "running");
  await page.getByRole("button", { name: "Mute ambience", exact: true }).click();
  await expect(controls).toHaveAttribute("data-audio-context", "suspended");
});

test("real offline bird audio has long quiet gaps and bounded signal headroom", async ({ page }) => {
  await page.goto("/read");
  const result = await page.evaluate(async source => {
    // Exercise the production generator in real Web Audio, independent of UI
    // timing. No microphone or speaker output is involved in offline rendering.
    const create = new Function(`return (${source})`)() as typeof createCampusBirdAudio;
    const context = new OfflineAudioContext(2, 22050 * 54, 22050);
    const birds = create(context as unknown as AudioContext, context.destination);
    birds.gain.gain.value = 0.05; // Upper bound above the ordinary arrival mix.
    const first = birds.snapshot().nextCall;
    const pause = context.suspend(first + 0.02);
    const rendered = context.startRendering();
    await pause;
    birds.update();
    const second = birds.snapshot().nextCall;
    const pauseAgain = context.suspend(second + 0.02);
    await context.resume();
    await pauseAgain;
    birds.update();
    await context.resume();
    const buffer = await rendered;
    let peak = 0, energy = 0, audibleSamples = 0;
    for (const value of buffer.getChannelData(0)) {
      peak = Math.max(peak, Math.abs(value));
      energy += value * value;
      if (Math.abs(value) > 0.00001) audibleSamples++;
    }
    const state = birds.snapshot();
    birds.release();
    return { first, gap: second - first, peak, energy, duty: audibleSamples / buffer.length, calls: state.calls, active: birds.snapshot().active };
  }, createCampusBirdAudio.toString());
  expect(result.first).toBeGreaterThan(9);
  expect(result.gap).toBeGreaterThan(17);
  expect(result.gap).toBeLessThan(36.1);
  expect(result.calls).toBe(2);
  expect(result.active).toBe(0);
  expect(result.peak).toBeLessThan(0.01);
  expect(result.energy).toBeGreaterThan(0);
  expect(result.duty).toBeLessThan(0.03);
});
