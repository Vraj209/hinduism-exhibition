import { expect, test, type Locator, type Page } from "@playwright/test";
import * as THREE from "three";
import { sectionTitles } from "./exhibition-fixtures";
import { makeDomedPavilion } from "../lib/domed-pavilion";

type Fountain = {
  id?: "left" | "right";
  x: number;
  z: number;
  radius: number;
  stoneMaxY?: number;
  waterPeakY?: number;
};
type SpatialSource = { id: "left" | "right"; presence: number; pan: number; distance: number };
type ActualSource = { id: "left" | "right"; gain: number; pan: number; cutoff: number };
type Pavilion = { id: number; position: [number, number, number]; rotation: number };
type ObservedWindow = Window & {
  __fountainAudio: {
    contexts: AudioContext[];
    sources: AudioBufferSourceNode[];
    panners: StereoPannerNode[];
    gains: GainNode[];
  };
};

const browserErrors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  browserErrors.set(page, errors);
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => {
    if (message.type() === "error") errors.push(message.text());
  });
});
test.afterEach(async ({ page }) => {
  expect(browserErrors.get(page) ?? [], "No JavaScript, WebGL or shader errors").toEqual([]);
});

async function ready(page: Page) {
  const canvas = page.locator(".campus-webgl canvas");
  await expect(canvas).toHaveAttribute("data-camera-phase", "overview");
  await expect(canvas).toHaveAttribute("data-central-fountain-count", "5");
  await expect(canvas).toHaveAttribute("data-side-fountains", /\[/);
  return canvas;
}
async function json<T>(element: Locator, name: string): Promise<T> {
  return JSON.parse((await element.getAttribute(name))!);
}
async function number(element: Locator, name: string) {
  return Number(await element.getAttribute(name));
}
async function cameraPose(canvas: Locator) {
  return Promise.all(["position", "target", "fov"].map(key => canvas.getAttribute(`data-camera-${key}`)));
}
async function skyState(canvas: Locator) {
  return Promise.all(["sky-time", "cloud-offset", "cloud-shadow-offset", "sunlight-intensity", "environment-time"].map(key => canvas.getAttribute(`data-${key}`)));
}
async function setHidden(page: Page, hidden: boolean) {
  // Deterministic visibility event coverage; this does not simulate an OS tab manager.
  await page.evaluate(value => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => value });
    document.dispatchEvent(new Event("visibilitychange"));
  }, hidden);
}
async function assertStopped(canvas: Locator) {
  await expect(canvas).toHaveAttribute("data-motion", "still");
  await canvas.page().waitForTimeout(160);
  const before = await skyState(canvas);
  const frames = await canvas.getAttribute("data-render-count");
  await canvas.page().waitForTimeout(300);
  expect(await skyState(canvas)).toEqual(before);
  await expect(canvas).toHaveAttribute("data-render-count", frames!);
}

function assertFountainSightlines(fountains: Fountain[], pavilions: Pavilion[], position: number[]) {
  // Use the actual approved building meshes, not rectangular stand-ins. Being
  // inside the frustum alone does not establish visibility behind a pavilion.
  const materials: Record<string, THREE.MeshStandardMaterial> = {};
  const palette = new Proxy(materials, {
    get: (cache, key: string) => cache[key] ?? (cache[key] = new THREE.MeshStandardMaterial()),
  });
  const buildings = pavilions.map(pavilion => {
    const building = makeDomedPavilion(pavilion.id, palette);
    building.position.set(...pavilion.position);
    building.rotation.y = pavilion.rotation;
    building.updateMatrixWorld(true);
    return building;
  });
  const origin = new THREE.Vector3().fromArray(position);
  const ray = new THREE.Raycaster();
  const blocked: string[] = [];
  try {
    for (const fountain of fountains) {
      const anchors = Array.from({ length: 24 }, (_, index) => {
        const angle = index * Math.PI / 12;
        return new THREE.Vector3(fountain.x + Math.cos(angle) * fountain.radius, 0.34, fountain.z + Math.sin(angle) * fountain.radius);
      });
      const peak = fountain.waterPeakY ?? 2.2;
      for (const height of [0.76, peak / 2, peak - 0.01]) anchors.push(new THREE.Vector3(fountain.x, height, fountain.z));
      anchors.forEach((anchor, index) => {
        ray.set(origin, anchor.clone().sub(origin).normalize());
        ray.far = origin.distanceTo(anchor) - 0.02;
        const hit = ray.intersectObjects(buildings, true)[0];
        if (hit) blocked.push(`${fountain.id ?? fountain.x} anchor ${index} is hidden by dome ${hit.object.userData.pavilionId}`);
      });
    }
    expect(blocked, "The full basin rim and central plume must clear the approved pavilion silhouettes").toEqual([]);
  } finally {
    for (const building of buildings) building.traverse(object => {
      if (object instanceof THREE.Mesh) object.geometry.dispose();
    });
    Object.values(materials).forEach(material => material.dispose());
  }
}

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  test(`matching side fountains preserve clear paths and the entrance view at ${viewport.width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const canvas = await ready(page);
    const fountains = await json<Fountain[]>(canvas, "data-side-fountains");
    expect(fountains).toHaveLength(2);
    const [left, right] = [...fountains].sort((a, b) => a.x - b.x);
    expect(left.x).toBeLessThan(0);
    expect(right.x).toBeGreaterThan(0);
    expect(left.x).toBeCloseTo(-right.x, 5);
    expect(left.z).toBeCloseTo(right.z, 5);
    expect(left.radius).toBeCloseTo(right.radius, 5);
    expect(left.radius).toBeGreaterThan(1.5);
    for (const fountain of fountains) {
      // The four-unit side walks occupy |X|=9.5..13.5. Garden-side islands
      // and outer islands are both valid, but no basin may occupy the walk.
      const innerEdge = Math.abs(fountain.x) - fountain.radius;
      const outerEdge = Math.abs(fountain.x) + fountain.radius;
      expect(outerEdge < 9.5 || innerEdge > 13.5).toBe(true);
      for (const row of [18, -2, -22]) {
        const approachX = Math.max(11 - Math.abs(fountain.x), Math.abs(fountain.x) - 17, 0);
        const approachZ = Math.max(Math.abs(fountain.z - row) - 1.9, 0);
        expect(Math.hypot(approachX, approachZ)).toBeGreaterThan(fountain.radius);
        const forecourtX = Math.max(13 - Math.abs(fountain.x), Math.abs(fountain.x) - 23, 0);
        const forecourtZ = Math.max(Math.abs(fountain.z - row) - 5.5, 0);
        expect(Math.hypot(forecourtX, forecourtZ)).toBeGreaterThan(fountain.radius);
      }
      expect(fountain.z - fountain.radius).toBeGreaterThan(-32);
      expect(fountain.z + fountain.radius).toBeLessThan(33);
      // The original axial water basin remains clear, including its stone rim.
      const basinX = Math.max(Math.abs(fountain.x) - 2.35, 0);
      const basinZ = Math.max(-29.26 - fountain.z, fountain.z - 23.26, 0);
      expect(Math.hypot(basinX, basinZ)).toBeGreaterThan(fountain.radius);
    }
    await expect(canvas).toHaveAttribute("data-eye-height-meters", "1.700");
    await expect(canvas).toHaveAttribute("data-camera-type", "perspective");
    const position = (await canvas.getAttribute("data-camera-position"))!.split(",").map(Number);
    const target = (await canvas.getAttribute("data-camera-target"))!.split(",").map(Number);
    expect(position[0]).toBe(0);
    expect(target[0]).toBe(0);
    expect(target[1]).toBeCloseTo(position[1], 3);
    assertFountainSightlines(fountains, await json<Pavilion[]>(canvas, "data-pavilion-positions"), position);
    // Both centers must enter the actual opening horizontal frustum, including
    // portrait phones. This supplements the saved composition screenshots.
    const vertical = (await number(canvas, "data-camera-fov")) * Math.PI / 180;
    const horizontalTangent = Math.tan(vertical / 2) * viewport.width / viewport.height;
    for (const fountain of fountains) {
      expect(Math.abs(fountain.x / ((position[2] - fountain.z) * horizontalTangent))).toBeLessThan(0.96);
      for (let index = 0; index < 24; index++) {
        const angle = index * Math.PI / 12;
        const x = fountain.x + Math.cos(angle) * fountain.radius;
        const z = fountain.z + Math.sin(angle) * fountain.radius;
        expect(Math.abs(x / ((position[2] - z) * horizontalTangent)), "The full basin rim fits the entrance frame").toBeLessThan(1);
      }
    }
    const selector = page.getByRole("combobox", { name: "Choose an exhibition section", exact: true });
    await expect(selector).toBeInViewport({ ratio: 1 });
    for (const title of sectionTitles) await expect(selector.locator("option").filter({ hasText: title })).toHaveCount(1);
    if (viewport.width === 1440) {
      for (let id = 1; id <= 6; id++) await expect(page.locator(`#destination-${id}`)).toBeInViewport({ ratio: 1 });
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`sky-side-fountains-${viewport.width}.png`) });
  });
}

test("clouds and fountain motion advance around a stationary camera with smaller mobile budgets", async ({ page }) => {
  const budgets: { clouds: number; texture: number; jets: number; splashes: number; reflection: number }[] = [];
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    if (width === 390) await page.reload();
    const canvas = await ready(page);
    await expect(canvas).toHaveAttribute("data-motion", "ambient");
    const pose = await cameraPose(canvas);
    const time = await number(canvas, "data-sky-time");
    const offset = await canvas.getAttribute("data-cloud-offset");
    const shadow = await canvas.getAttribute("data-cloud-shadow-offset");
    await expect.poll(() => number(canvas, "data-sky-time")).toBeGreaterThan(time + 0.35);
    await expect(canvas).not.toHaveAttribute("data-cloud-offset", offset!);
    await expect(canvas).not.toHaveAttribute("data-cloud-shadow-offset", shadow!);
    expect(await cameraPose(canvas)).toEqual(pose);
    expect(await number(canvas, "data-sunlight-intensity")).toBeGreaterThan(0);
    const sky = await json<{ cloudLayers: number; textureSize: number }>(canvas, "data-sky-details");
    const environment = await json<{ sideJetDroplets: number; sideSplashDroplets: number; sideReflectionSize: number }>(canvas, "data-environment-details");
    budgets.push({ clouds: sky.cloudLayers, texture: sky.textureSize, jets: environment.sideJetDroplets, splashes: environment.sideSplashDroplets, reflection: environment.sideReflectionSize });
  }
  for (const key of ["clouds", "texture", "jets", "splashes", "reflection"] as const) {
    expect(budgets[1][key], `Mobile ${key} remain present`).toBeGreaterThan(0);
    expect(budgets[1][key], `Mobile ${key} use a lower budget`).toBeLessThan(budgets[0][key]);
  }
});

test("pause, hidden state and reduced motion freeze cloud and fountain updates", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const canvas = await ready(page);
  const pose = await cameraPose(canvas);
  await page.getByRole("button", { name: "Pause garden motion", exact: true }).click();
  await assertStopped(canvas);
  await page.getByRole("button", { name: "Resume garden motion", exact: true }).click();
  const resumed = await number(canvas, "data-sky-time");
  await expect.poll(() => number(canvas, "data-sky-time")).toBeGreaterThan(resumed + 0.2);
  await setHidden(page, true);
  await assertStopped(canvas);
  await setHidden(page, false);
  await expect(canvas).toHaveAttribute("data-motion", "ambient");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await assertStopped(canvas);
  expect(await cameraPose(canvas)).toEqual(pose);
});

async function observeAudio(page: Page) {
  await page.addInitScript(() => {
    const Original = window.AudioContext;
    const observed: ObservedWindow["__fountainAudio"] = { contexts: [], sources: [], panners: [], gains: [] };
    (window as unknown as ObservedWindow).__fountainAudio = observed;
    class Observed extends Original {
      constructor(options?: AudioContextOptions) { super(options); observed.contexts.push(this); }
      createBufferSource() { const source = super.createBufferSource(); observed.sources.push(source); return source; }
      createStereoPanner() { const pan = super.createStereoPanner(); observed.panners.push(pan); return pan; }
      createGain() { const gain = super.createGain(); observed.gains.push(gain); return gain; }
    }
    Object.defineProperty(window, "AudioContext", { configurable: true, value: Observed });
  });
}
async function audioSnapshot(page: Page) {
  return page.evaluate(() => {
    const observed = (window as unknown as ObservedWindow).__fountainAudio;
    const sources = observed.sources.filter(source => source.loop).slice(-2);
    return {
      states: observed.contexts.map(context => context.state),
      sourceCount: observed.sources.length,
      panCount: observed.panners.length,
      sidePans: observed.panners.slice(-2).map(panner => panner.pan.value),
      sideGains: observed.gains.slice(-2).map(gain => gain.gain.value),
      loops: sources.map(source => source.loop),
      separateBuffers: sources.length === 2 && sources[0].buffer !== sources[1].buffer,
      sampleValues: sources.map(source => source.buffer?.getChannelData(0)[100]),
    };
  });
}

test("both side fountains create separate gesture-gated spatial audio sources", async ({ page }) => {
  await observeAudio(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const canvas = await ready(page);
  expect((await audioSnapshot(page)).sourceCount).toBe(0);
  const spatial = await json<SpatialSource[]>(canvas, "data-side-fountain-sound");
  expect(spatial.map(source => source.id)).toEqual(["left", "right"]);
  expect(spatial[0].presence).toBeCloseTo(spatial[1].presence, 4);
  expect(spatial[0].pan).toBeLessThan(0);
  expect(spatial[1].pan).toBeGreaterThan(0);
  const ambience = page.getByRole("group", { name: "Garden ambience", exact: true });
  await ambience.getByRole("button", { name: "Enable Ambience", exact: true }).click();
  await expect.poll(async () => (await audioSnapshot(page)).states).toEqual(["running"]);
  await expect(ambience).toHaveAttribute("data-side-fountain-sources", "2");
  await expect.poll(async () => (await audioSnapshot(page)).sidePans[0]).toBeLessThan(-0.01);
  await expect.poll(async () => (await audioSnapshot(page)).sidePans[1]).toBeGreaterThan(0.01);
  const actual = await audioSnapshot(page);
  expect(actual.sourceCount).toBe(7); // Five garden/visitor loops and two fountains.
  expect(actual.panCount).toBe(8); // Includes the silent, gesture-gated bird bus.
  expect(actual.loops).toEqual([true, true]);
  expect(actual.separateBuffers).toBe(true);
  expect(actual.sampleValues[0]).not.toBe(actual.sampleValues[1]);
  const diagnostics = await json<ActualSource[]>(ambience, "data-side-fountain-audio");
  expect(diagnostics.map(source => source.id)).toEqual(["left", "right"]);
  // AudioParam ramps advance on the audio clock; the UI samples them periodically.
  // Wait for that real fade-in rather than requiring the first published zero
  // to have already reached its target.
  await expect.poll(async () => (await json<ActualSource[]>(ambience, "data-side-fountain-audio")).every(source => source.gain > 0 && source.cutoff > 0)).toBe(true);
  await ambience.getByRole("button", { name: "Mute ambience", exact: true }).click();
  await expect.poll(async () => (await audioSnapshot(page)).states).toEqual(["suspended"]);
});

test("approaching either side makes that fountain more prominent and preserves ambience on return", async ({ page }) => {
  await observeAudio(page);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const canvas = await ready(page);
  await page.getByRole("button", { name: "Enable Ambience", exact: true }).click();
  for (const [id, sideIndex] of [[2, 0], [5, 1]]) {
    const initial = await json<SpatialSource[]>(canvas, "data-side-fountain-sound");
    const samples: { presence: number; difference: number; gainDifference: number }[] = [];
    await page.getByRole("combobox", { name: "Choose an exhibition section", exact: true }).selectOption(String(id));
    const world = page.getByRole("region", { name: `${sectionTitles[id - 1]} exhibition gallery`, exact: true });
    await expect.poll(async () => {
      const spatial = await json<SpatialSource[]>(canvas, "data-side-fountain-sound");
      const audio = await audioSnapshot(page);
      samples.push({ presence: spatial[sideIndex].presence, difference: spatial[sideIndex].presence - spatial[1 - sideIndex].presence, gainDifference: audio.sideGains[sideIndex] - audio.sideGains[1 - sideIndex] });
      return world.getAttribute("data-arrived");
    }, { intervals: [40] }).toBe("true");
    expect(Math.max(...samples.map(sample => sample.presence))).toBeGreaterThan(initial[sideIndex].presence + 0.04);
    expect(Math.max(...samples.map(sample => sample.difference))).toBeGreaterThan(0.04);
    expect(Math.max(...samples.map(sample => sample.gainDifference))).toBeGreaterThan(0.005);
    await expect.poll(async () => (await audioSnapshot(page)).states).toEqual(["suspended"]);
    await world.getByRole("link", { name: "Back to Campus", exact: true }).click();
    await expect(canvas).toHaveAttribute("data-camera-phase", "overview");
    await expect.poll(async () => (await audioSnapshot(page)).states).toEqual(["running"]);
  }
});
