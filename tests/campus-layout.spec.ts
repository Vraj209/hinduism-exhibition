import { expect, test, type Locator, type Page } from "@playwright/test";
import { sectionTitles } from "./exhibition-fixtures";
import { expectSectionChoices } from "./section-menu-helpers";

// Independent expectations from the requested campus arrangement, not app imports.
const expectedPavilions = [
  { id: 1, position: [-18, 0, 18], rotation: Math.PI / 2 },
  { id: 2, position: [-18, 0, -2], rotation: Math.PI / 2 },
  { id: 3, position: [-18, 0, -22], rotation: Math.PI / 2 },
  { id: 4, position: [18, 0, -22], rotation: -Math.PI / 2 },
  { id: 5, position: [18, 0, -2], rotation: -Math.PI / 2 },
  { id: 6, position: [18, 0, 18], rotation: -Math.PI / 2 },
];

async function campusReady(page: Page) {
  const campus = page.locator(".campus-webgl canvas");
  await expect(campus).toHaveAttribute("data-campus-layout", "axial");
  await expect(campus).toHaveAttribute("data-camera-phase", "overview");
  return campus;
}

async function pose(canvas: Locator) {
  return {
    position: await canvas.getAttribute("data-camera-position"),
    target: await canvas.getAttribute("data-camera-target"),
    zoom: await canvas.getAttribute("data-camera-zoom"),
    view: await canvas.getAttribute("data-campus-view"),
  };
}

async function assertSelectableArrangement(page: Page, projection: "perspective" | "overhead") {
  await expect(page.locator(".map-labels a")).toHaveCount(6);
  for (let id = 1; id <= 6; id++) {
    const link = page.locator(`#destination-${id}`);
    await expect(link).toBeVisible();
    await expect(link).toHaveAccessibleName(new RegExp(sectionTitles[id - 1]));
  }
  // Camera rendering publishes label positions through React. Read the stage,
  // every pin, and their hit targets together so one sample never mixes views.
  await expect.poll(() => page.evaluate((mode) => {
    const stage = document.querySelector(".campus-stage")?.getBoundingClientRect();
    if (!stage) return ["Campus stage is missing"];
    const problems: string[] = [];
    const centers: { x: number; y: number }[] = [];
    for (let id = 1; id <= 6; id++) {
      const link = document.getElementById(`destination-${id}`);
      const marker = link?.querySelector(".pin-number")?.getBoundingClientRect();
      if (!link || !marker) return [`Dome ${id} marker is missing`];
      const center = { x: marker.x + marker.width / 2, y: marker.y + marker.height / 2 };
      if (!(center.x > stage.x && center.x < stage.right && center.y > stage.y && center.y < stage.bottom))
        problems.push(`Dome ${id} is outside the campus stage`);
      if (marker.width === 0 || marker.height === 0 || getComputedStyle(link).visibility !== "visible")
        problems.push(`Dome ${id} is hidden`);
      const hit = document.elementFromPoint(center.x, center.y);
      if (!hit || !link.contains(hit)) problems.push(`Dome ${id} is not selectable at its marker`);
      centers.push(center);
    }
    const axis = stage.x + stage.width / 2;
    for (const [left, right] of [[1, 6], [2, 5], [3, 4]]) {
      if (!(centers[left - 1].x < axis && centers[right - 1].x > axis))
        problems.push(`Domes ${left}/${right} are on the wrong sides`);
      if (Math.abs(centers[left - 1].y - centers[right - 1].y) >= 2)
        problems.push(`Domes ${left}/${right} are not opposite each other`);
      if (Math.abs((centers[left - 1].x + centers[right - 1].x) / 2 - axis) >= 2)
        problems.push(`Domes ${left}/${right} are not symmetric about the axis`);
    }
    for (const [near, middle, far] of [[1, 2, 3], [6, 5, 4]]) {
      // A human-height perspective converges toward the axis with distance;
      // an overhead view separates the same rows vertically.
      const coordinate = (id: number) => mode === "overhead"
        ? centers[id - 1].y : Math.abs(centers[id - 1].x - axis);
      const minimumGap = mode === "overhead" ? 20 : 10;
      if (!(coordinate(near) - coordinate(middle) > minimumGap))
        problems.push(`Domes ${near}/${middle} have incorrect near-to-far order or overlap`);
      if (!(coordinate(middle) - coordinate(far) > minimumGap))
        problems.push(`Domes ${middle}/${far} have incorrect near-to-far order or overlap`);
    }
    return problems;
  }, projection), { message: "All six settled campus markers must be visible, selectable and symmetrically arranged" }).toEqual([]);
}

for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
  test(`axial campus exposes the correct opposing pairs at ${viewport.width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/#map");
    const campus = await campusReady(page);
    await expect(campus).toHaveAttribute("data-mandir-position", "0,0,-49");
    const actual = JSON.parse((await campus.getAttribute("data-pavilion-positions"))!);
    expect(actual).toHaveLength(6);
    expectedPavilions.forEach((expected) => {
      const pavilion = actual.find((item: { id: number }) => item.id === expected.id);
      expect(pavilion.position).toEqual(expected.position);
      expect(pavilion.rotation).toBeCloseTo(expected.rotation, 5);
    });
    if (viewport.width >= 1000) await assertSelectableArrangement(page, "perspective");
    else {
      const selector = page.getByRole("combobox", { name: "Choose an exhibition section", exact: true });
      await expect(selector).toBeVisible();
      await expectSectionChoices(page);
    }
    await page.screenshot({ path: testInfo.outputPath("entrance-campus.png"), fullPage: true });
    await page.getByRole("button", { name: "Campus Map", exact: true }).click();
    await expect(campus).toHaveAttribute("data-campus-view", "map");
    await expect(campus).toHaveAttribute("data-camera-phase", "overview");
    await assertSelectableArrangement(page, "overhead");
    await page.screenshot({ path: testInfo.outputPath("overhead-campus.png"), fullPage: true });
    await page.getByRole("button", { name: "Entrance View", exact: true }).click();
    await expect(campus).toHaveAttribute("data-campus-view", "arrival");
    if (viewport.width >= 1000) await assertSelectableArrangement(page, "perspective");
    else await expect(page.getByRole("combobox", { name: "Choose an exhibition section", exact: true })).toBeInViewport({ ratio: 1 });
  });
}

for (const reducedMotion of [false, true]) {
  test(`${reducedMotion ? "reduced-motion overhead" : "animated entrance"} journey restores the previous campus view`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.emulateMedia({ reducedMotion: reducedMotion ? "reduce" : "no-preference" });
    await page.goto("/#map");
    const campus = await campusReady(page);
    if (reducedMotion) {
      await page.getByRole("button", { name: "Campus Map", exact: true }).click();
      await expect(campus).toHaveAttribute("data-campus-view", "map");
      await page.getByRole("button", { name: "Zoom in", exact: true }).click();
      await expect(campus).toHaveAttribute("data-camera-zoom", "1.100");
    }
    const saved = await pose(campus);
    await page.locator("#destination-6").click();
    const world = page.getByRole("region", { name: `${sectionTitles[5]} exhibition gallery`, exact: true });
    await expect(world).toHaveAttribute("data-arrived", "true");
    const inside = (await campus.getAttribute("data-camera-position"))!.split(",").map(Number);
    const target = (await campus.getAttribute("data-camera-target"))!.split(",").map(Number);
    // Right-hand dome entrance is on its garden-facing west side; camera crosses inward.
    expect(inside[0]).toBeLessThan(18);
    expect(inside[2]).toBeCloseTo(18, 2);
    expect(target[0]).toBeGreaterThan(inside[0]);
    expect(target[2]).toBeCloseTo(18, 2);
    await world.getByRole("link", { name: "Back to Campus", exact: true }).click();
    await expect(campus).toHaveAttribute("data-camera-phase", "overview");
    expect(await pose(campus)).toEqual(saved);
    await expect(page.locator("#destination-6")).toBeFocused();
    await expect(page.locator(".map-labels a")).toHaveCount(6);
    expect(errors).toEqual([]);
  });
}

test("moving directly between sections leaves through the current doorway first", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#section-hindu-jivan-shaili");
  const campus = page.locator(".campus-webgl canvas");
  const first = page.getByRole("region", { name: `${sectionTitles[0]} exhibition gallery`, exact: true });
  await expect(first).toHaveAttribute("data-arrived", "true");
  for (let moment = 2; moment <= 5; moment++) {
    await first.getByRole("button", { name: "Next story", exact: true }).click();
    await expect(first.getByRole("progressbar")).toHaveAttribute("aria-valuenow", String(moment));
  }
  await first.getByRole("link", { name: "Next Exhibition", exact: true }).click();
  const samples: number[][] = [];
  await expect.poll(async () => {
    const sample = await campus.evaluate((canvas) => ({
      phase: canvas.getAttribute("data-camera-phase"),
      position: canvas.getAttribute("data-camera-position")?.split(",").map(Number),
    }));
    if (sample.phase === "exiting" && sample.position) samples.push(sample.position);
    return samples.length;
  }, { intervals: [20], message: "The previous pavilion must have a visible doorway exit before the next approach" }).toBeGreaterThanOrEqual(3);
  for (const [x, y, z] of samples) {
    // Dome 1 faces east: leave along world +X at Z=18, clear of its side walls.
    expect(x).toBeGreaterThanOrEqual(-17);
    expect(x).toBeLessThanOrEqual(-9.2);
    expect(y).toBeGreaterThanOrEqual(2.3);
    expect(z).toBeCloseTo(18, 2);
  }
  expect(samples.at(-1)![0]).toBeGreaterThanOrEqual(samples[0][0]);
  await expect(page.getByRole("region", { name: `${sectionTitles[1]} exhibition gallery`, exact: true }))
    .toHaveAttribute("data-arrived", "true");
  expect(errors).toEqual([]);
});
