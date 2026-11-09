import { expect, test, type Locator, type Page } from "@playwright/test";
import { sectionSlugs, sectionTitles } from "./exhibition-fixtures";
import { chooseSection, expectSectionChoices } from "./section-menu-helpers";

const metersPerUnit = (255 * 0.3048) / 24.8;
const walkingSurface = 0.02;

async function ready(page: Page) {
  const canvas = page.locator(".campus-webgl canvas");
  await expect(canvas).toHaveAttribute("data-camera-phase", "overview");
  await expect(canvas).toHaveAttribute("data-campus-view", "arrival");
  await expect(canvas).toHaveAttribute("data-camera-type", "perspective");
  return canvas;
}

async function pose(canvas: Locator) {
  return {
    position: await canvas.getAttribute("data-camera-position"),
    target: await canvas.getAttribute("data-camera-target"),
    look: await canvas.getAttribute("data-look-offset"),
    fov: await canvas.getAttribute("data-camera-fov"),
  };
}

async function assertHumanView(canvas: Locator) {
  const position = (await canvas.getAttribute("data-camera-position"))!.split(",").map(Number);
  const target = (await canvas.getAttribute("data-camera-target"))!.split(",").map(Number);
  expect((position[1] - walkingSurface) * metersPerUnit).toBeCloseTo(1.7, 2);
  expect(target[1]).toBeCloseTo(position[1], 3);
  expect(target[2]).toBeLessThan(position[2]);
  const fov = Number(await canvas.getAttribute("data-camera-fov"));
  expect(fov).toBeGreaterThanOrEqual(25);
  // Portrait screens need more vertical field for the same overall lens view.
  // Bound the diagonal angle instead of comparing vertical angles across shapes.
  const bounds = await canvas.boundingBox();
  const aspect = bounds!.width / bounds!.height;
  const diagonal = 2 * Math.atan(Math.tan(fov * Math.PI / 360) * Math.sqrt(1 + aspect * aspect)) * 180 / Math.PI;
  expect(diagonal).toBeLessThanOrEqual(106);
  await expect(canvas).toHaveAttribute("data-eye-height-meters", "1.700");
}

async function assertSelector(page: Page) {
  const selector = page.getByRole("combobox", { name: "Choose an exhibition section", exact: true });
  await expect(selector).toBeVisible();
  await expect(selector).toBeInViewport({ ratio: 1 });
  await expectSectionChoices(page);
  return selector;
}

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 834, height: 1194 },
  { width: 390, height: 844 },
  { width: 320, height: 568 },
  { width: 844, height: 390 },
]) {
  test(`entrance hero stays at human eye level and exposes six destinations at ${viewport.width}px`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const canvas = await ready(page);
    await assertHumanView(canvas);
    const bounds = await canvas.boundingBox();
    expect(bounds!.x).toBeCloseTo(0, 0);
    expect(bounds!.y).toBeCloseTo(0, 0);
    expect(bounds!.width).toBeGreaterThanOrEqual(viewport.width - 1);
    expect(bounds!.height).toBeGreaterThanOrEqual(viewport.height - 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await expect(page.getByRole("button", { name: "Campus Map", exact: true })).toBeInViewport({ ratio: 1 });
    await expect(page.getByRole("button", { name: "Reset View", exact: true })).toBeInViewport({ ratio: 1 });
    await assertSelector(page);
    if (viewport.width === 1440) {
      await page.getByRole("combobox", { name: "Choose an exhibition section", exact: true }).click();
      await page.screenshot({ path: "docs/design/custom-section-menu/1440-campus-open.png" });
      await page.locator('[data-section-menu="true"]').screenshot({ path: "docs/design/custom-section-menu/desktop-menu.png" });
      await page.keyboard.press("Escape");
      for (let id = 1; id <= 6; id++) {
        const label = page.locator(`#destination-${id}`);
        await expect(label).toBeVisible();
        await expect(label).toBeInViewport({ ratio: 1 });
        await expect(label).toHaveAccessibleName(new RegExp(sectionTitles[id - 1]));
      }
    }
    if (viewport.width === 1440 || viewport.width === 834) {
      for (const title of await page.locator(".map-pin .pin-title").all()) {
        if (await title.isVisible()) await expect(title).toBeInViewport({ ratio: 1 });
      }
    }
    await page.screenshot({ path: testInfo.outputPath(`eye-level-${viewport.width}.png`), fullPage: false });
    expect(errors).toEqual([]);
  });
}

test("the camera stays still until deliberate keyboard or drag input, clamps look-around and resets", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const canvas = await ready(page);
  const initial = await pose(canvas);
  await page.waitForTimeout(400);
  expect(await pose(canvas)).toEqual(initial);
  const lookRight = page.getByRole("button", { name: "Look right", exact: true });
  await lookRight.focus();
  await page.keyboard.press("Enter");
  await expect.poll(async () => Number(await canvas.getAttribute("data-look-offset"))).toBeGreaterThan(0.01);
  await assertHumanView(canvas);
  for (let count = 0; count < 8; count++) if (await lookRight.isEnabled()) await lookRight.click();
  await expect.poll(async () => Number(await canvas.getAttribute("data-look-offset"))).toBeCloseTo(0.48, 2);
  await page.getByRole("button", { name: "Reset View", exact: true }).click();
  await expect.poll(() => pose(canvas)).toEqual(initial);
  const bounds = await canvas.boundingBox();
  await page.mouse.move(bounds!.x + bounds!.width * 0.50, bounds!.y + bounds!.height * 0.46);
  await page.mouse.down();
  await page.mouse.move(bounds!.x + bounds!.width * 0.67, bounds!.y + bounds!.height * 0.46, { steps: 14 });
  await page.mouse.up();
  await expect.poll(async () => Math.abs(Number(await canvas.getAttribute("data-look-offset")))).toBeGreaterThan(0.03);
  expect(Math.abs(Number(await canvas.getAttribute("data-look-offset")))).toBeLessThanOrEqual(0.481);
  await expect(page.locator(".world-shell")).toHaveCount(0);
  const dragged = await pose(canvas);
  await page.waitForTimeout(350);
  expect(await pose(canvas)).toEqual(dragged);
  await page.getByRole("button", { name: "Reset View", exact: true }).click();
  await expect.poll(() => pose(canvas)).toEqual(initial);
});

test("mobile selector reaches an off-axis section and restores the visitor's previous look", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const canvas = await ready(page);
  await page.getByRole("button", { name: "Look left", exact: true }).click();
  await expect.poll(async () => Number(await canvas.getAttribute("data-look-offset"))).toBeLessThan(-0.01);
  const saved = await pose(canvas);
  await assertSelector(page);
  await chooseSection(page, 6);
  const world = page.getByRole("region", { name: `${sectionTitles[5]} exhibition gallery`, exact: true });
  await expect(world).toHaveAttribute("data-arrived", "true");
  await expect(page).toHaveURL(new RegExp(`#section-${sectionSlugs[5]}`));
  await world.getByRole("link", { name: "Back to Campus", exact: true }).click();
  await expect(canvas).toHaveAttribute("data-camera-phase", "overview");
  await expect(canvas).toHaveAttribute("data-camera-type", "perspective");
  await expect.poll(() => pose(canvas)).toEqual(saved);
  await assertHumanView(canvas);
  // Returning focus must remain on a visible navigation target, even when the
  // selected pavilion is outside the phone's initial field of view.
  expect(await page.evaluate(() => {
    const focused = document.activeElement;
    if (!(focused instanceof HTMLElement)) return false;
    const bounds = focused.getBoundingClientRect();
    return getComputedStyle(focused).visibility === "visible" && bounds.width > 0 && bounds.height > 0 && bounds.left >= 0 && bounds.right <= innerWidth && bounds.top >= 0 && bounds.bottom <= innerHeight;
  })).toBe(true);
});

test("Campus Map is optional and returning to the entrance retains the previous look", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const canvas = await ready(page);
  await page.getByRole("button", { name: "Look right", exact: true }).click();
  await expect.poll(async () => Number(await canvas.getAttribute("data-look-offset"))).toBeGreaterThan(0.01);
  const saved = await pose(canvas);
  await page.getByRole("button", { name: "Campus Map", exact: true }).click();
  await expect(canvas).toHaveAttribute("data-campus-view", "map");
  await expect(canvas).toHaveAttribute("data-camera-type", "orthographic");
  for (let id = 1; id <= 6; id++) await expect(page.locator(`#destination-${id}`)).toBeVisible();
  await page.getByRole("button", { name: "Entrance View", exact: true }).click();
  await expect(canvas).toHaveAttribute("data-campus-view", "arrival");
  await expect(canvas).toHaveAttribute("data-camera-type", "perspective");
  await expect.poll(() => pose(canvas)).toEqual(saved);
});

test("look and reset requests made during the return journey settle on the requested view", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const canvas = await ready(page);
  const centered = await pose(canvas);
  const right = page.getByRole("button", { name: "Look right", exact: true });
  const left = page.getByRole("button", { name: "Look left", exact: true });
  for (const reset of [false, true]) {
    await page.getByRole("button", { name: "Reset View", exact: true }).click();
    await expect.poll(() => pose(canvas)).toEqual(centered);
    await right.click();
    await right.click();
    await expect(canvas).toHaveAttribute("data-look-offset", "0.2000");
    await chooseSection(page, 6);
    const world = page.getByRole("region", { name: `${sectionTitles[5]} exhibition gallery`, exact: true });
    await expect(world).toHaveAttribute("data-arrived", "true");
    await world.getByRole("link", { name: "Back to Campus", exact: true }).click();
    await expect(canvas).toHaveAttribute("data-camera-phase", "returning");
    await left.click();
    if (reset) await page.getByRole("button", { name: "Reset View", exact: true }).click();
    // Inputs occur while the camera is in flight, before its saved pose returns.
    await expect(canvas).toHaveAttribute("data-camera-phase", "returning");
    await expect(canvas).toHaveAttribute("data-camera-phase", "overview");
    await expect(canvas).toHaveAttribute("data-look-offset", reset ? "0.0000" : "0.1000");
    if (reset) await expect.poll(() => pose(canvas)).toEqual(centered);
    else {
      const target = (await canvas.getAttribute("data-camera-target"))!.split(",").map(Number);
      expect(target[0]).toBeCloseTo(Math.sin(0.1) * 95, 2);
      expect(target[2]).toBeCloseTo(46 - Math.cos(0.1) * 95, 2);
      await assertHumanView(canvas);
    }
  }
});

test("crossing a square viewport preserves a continuous level perspective", async ({ page }) => {
  await page.setViewportSize({ width: 899, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const canvas = await ready(page);
  await assertHumanView(canvas);
  const before = await pose(canvas);
  const pinBefore = await page.locator("#destination-3").boundingBox();
  await page.setViewportSize({ width: 901, height: 900 });
  await expect.poll(async () => (await canvas.boundingBox())?.width).toBe(901);
  // Wait for the renderer's resize observer, then compare actual projection.
  await expect.poll(async () => (await pose(canvas)).fov).not.toBe(before.fov);
  const after = await pose(canvas);
  const pinAfter = await page.locator("#destination-3").boundingBox();
  expect(Math.abs(Number(after.fov) - Number(before.fov))).toBeLessThan(0.5);
  expect(after.position).toBe(before.position);
  expect(after.target).toBe(before.target);
  expect(Math.abs(pinAfter!.x - pinBefore!.x)).toBeLessThan(5);
  expect(Math.abs(pinAfter!.y - pinBefore!.y)).toBeLessThan(5);
  await assertHumanView(canvas);
});

test("enabling reduced motion immediately settles an active look animation", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const canvas = await ready(page);
  await page.getByRole("button", { name: "Look right", exact: true }).click();
  expect(Number(await canvas.getAttribute("data-look-offset"))).toBeLessThan(0.1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const settled = await canvas.evaluate(async (element) => {
    for (let frame = 0; frame < 3; frame++) await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    return element.getAttribute("data-look-offset");
  });
  expect(settled).toBe("0.1000");
  const reducedPose = await pose(canvas);
  await page.waitForTimeout(300);
  expect(await pose(canvas)).toEqual(reducedPose);
  await assertHumanView(canvas);
});

test("a deliberate horizontal phone gesture looks around without entering a pavilion", async ({ browser, baseURL }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto(`${baseURL}/`);
  const canvas = await ready(page);
  const session = await context.newCDPSession(page);
  const y = 844 * 0.46;
  await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 260, y }] });
  for (const x of [248, 230, 211, 191, 171, 150])
    await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y }] });
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect.poll(async () => Math.abs(Number(await canvas.getAttribute("data-look-offset")))).toBeGreaterThan(0.03);
  await assertHumanView(canvas);
  await expect(page.locator(".world-shell")).toHaveCount(0);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await session.detach();
  await context.close();
});
