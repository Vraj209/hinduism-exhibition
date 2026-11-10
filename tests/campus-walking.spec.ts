import { expect, test, type Locator, type Page } from "@playwright/test";
import { sectionTitles } from "./exhibition-fixtures";
import { chooseSection, expectSectionChoices } from "./section-menu-helpers";

const metersPerUnit = (255 * 0.3048) / 24.8;

async function beginWalk(page: Page, reduced = false) {
  await page.emulateMedia({ reducedMotion: reduced ? "reduce" : "no-preference" });
  await page.goto("/");
  const canvas = page.locator(".campus-webgl canvas");
  await expect(canvas).toHaveAttribute("data-camera-phase", "overview");
  await page.getByRole("button", { name: "Walk Around", exact: true }).click();
  await expect(canvas).toHaveAttribute("data-walking", "true");
  await expect(canvas).toHaveAttribute("data-walk-suspended", "false");
  await expect(page.getByRole("button", { name: "Exit Walk Mode", exact: true })).toBeVisible();
  return canvas;
}

async function position(canvas: Locator) {
  return (await canvas.getAttribute("data-walk-position"))!.split(",").map(Number);
}

async function assertEyeHeight(canvas: Locator) {
  const [, height] = await position(canvas);
  const surface = Number(await canvas.getAttribute("data-walk-surface"));
  expect((height - surface) * metersPerUnit).toBeCloseTo(1.7, 2);
  expect(Math.abs(Number(await canvas.getAttribute("data-walk-pitch")))).toBeLessThanOrEqual(0.35);
}

test("desktop walking is deliberate, stays at eye height, and respects focus and suspension", async ({ page }) => {
  const canvas = await beginWalk(page);
  await assertEyeHeight(canvas);
  const initial = await position(canvas);
  expect(initial[0]).toBe(0);
  expect(initial[2]).toBe(46);
  await page.keyboard.down("w");
  await expect.poll(async () => (await position(canvas))[2]).toBeLessThan(initial[2] - 0.02);
  await page.keyboard.up("w");
  await expect(canvas).toHaveAttribute("data-walk-moving", "false");
  await assertEyeHeight(canvas);
  const stopped = await position(canvas);
  await page.waitForTimeout(180);
  expect(await position(canvas)).toEqual(stopped);

  await page.keyboard.down("e");
  await expect.poll(async () => Number(await canvas.getAttribute("data-walk-yaw"))).toBeGreaterThan(0.03);
  await page.keyboard.up("e");
  const turned = await canvas.getAttribute("data-walk-yaw");
  await page.getByRole("combobox", { name: "Choose an exhibition section", exact: true }).focus();
  await page.keyboard.press("w");
  expect(await position(canvas)).toEqual(stopped);
  expect(await canvas.getAttribute("data-walk-yaw")).toBe(turned);
  expect(await page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur();
    const arrow = new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true });
    document.body.dispatchEvent(arrow);
    return arrow.defaultPrevented;
  })).toBe(false);
  expect(await position(canvas)).toEqual(stopped);

  await page.getByRole("button", { name: "Campus Map", exact: true }).click();
  await expect(canvas).toHaveAttribute("data-walk-suspended", "true");
  await expect(canvas).toHaveAttribute("data-camera-type", "orthographic");
  await page.keyboard.press("ArrowUp");
  expect(await position(canvas)).toEqual(stopped);
  await page.getByRole("button", { name: "Resume Walk", exact: true }).click();
  await expect(canvas).toHaveAttribute("data-walk-suspended", "false");
  await expect(canvas).toHaveAttribute("data-camera-type", "perspective");
  expect(await position(canvas)).toEqual(stopped);
  expect(await canvas.getAttribute("data-walk-yaw")).toBe(turned);

  await page.getByRole("button", { name: "Return to Entrance", exact: true }).click();
  await expect.poll(() => position(canvas)).toEqual(initial);
  await page.getByRole("button", { name: "Exit Walk Mode", exact: true }).click();
  await expect(canvas).toHaveAttribute("data-walking", "false");
  await expect(canvas).toHaveAttribute("data-camera-phase", "overview");
  const outside = await canvas.getAttribute("data-camera-position");
  await page.keyboard.press("w");
  expect(await canvas.getAttribute("data-camera-position")).toBe(outside);
  await expect(page.getByRole("button", { name: "Walk Around", exact: true })).toBeFocused();
});

test("clicking a path creates a route, dragging only looks, and Stop and Go Directly work", async ({ page }) => {
  const canvas = await beginWalk(page);
  const box = (await canvas.boundingBox())!;
  const click = { x: box.x + box.width * 0.5, y: box.y + box.height * 0.7 };
  await page.mouse.click(click.x, click.y);
  await expect(canvas).toHaveAttribute("data-walk-automatic", "true");
  await expect(canvas).toHaveAttribute("data-walk-marker-visible", "true");
  const destination = JSON.parse((await canvas.getAttribute("data-walk-destination"))!) as number[];
  expect(destination[2]).toBeLessThan(46);
  expect(destination[2]).toBeGreaterThan(33);
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  await expect(canvas).toHaveAttribute("data-walk-moving", "false");
  const stopped = await position(canvas);
  await page.waitForTimeout(180);
  expect(await position(canvas)).toEqual(stopped);

  await page.mouse.move(box.x + box.width * 0.45, box.y + box.height * 0.6);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.45, { steps: 8 });
  await page.mouse.up();
  await expect.poll(async () => Math.abs(Number(await canvas.getAttribute("data-walk-yaw")))).toBeGreaterThan(0.1);
  await expect(canvas).toHaveAttribute("data-walk-automatic", "false");
  expect(await position(canvas)).toEqual(stopped);
  await assertEyeHeight(canvas);

  await chooseSection(page, 6);
  await expect(canvas).toHaveAttribute("data-walk-target-dome", "6");
  await expect(canvas).toHaveAttribute("data-walk-automatic", "true");
  const route = JSON.parse((await canvas.getAttribute("data-walk-route"))!) as number[][];
  expect(route.length).toBeGreaterThan(2);
  const end = route.at(-1)!;
  expect(end[0]).toBeGreaterThan(14);
  expect(end[2]).toBeCloseTo(18, 1);
  await page.getByRole("button", { name: "Go Directly", exact: true }).click();
  await expect(canvas).toHaveAttribute("data-walk-automatic", "false");
  await expect(canvas).toHaveAttribute("data-walk-near-dome", "6");
  await expect(page.getByRole("button", { name: "Enter Exhibition", exact: true })).toBeVisible();
  await assertEyeHeight(canvas);
  expect((await position(canvas))[0]).toBeCloseTo(end[0], 3);
});

test("all six walking destinations enter their exhibition and return outside the same door", async ({ page }) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  const canvas = await beginWalk(page, true);
  for (let id = 1; id <= 6; id++) {
    await chooseSection(page, id);
    await expect(canvas).toHaveAttribute("data-walk-near-dome", String(id));
    await expect(canvas).toHaveAttribute("data-walk-automatic", "false");
    await assertEyeHeight(canvas);
    const outside = await position(canvas);
    expect(outside[0] < 0).toBe(id <= 3);
    expect(outside[2]).toBeCloseTo([18, -2, -22, -22, -2, 18][id - 1], 2);
    await page.getByRole("button", { name: "Enter Exhibition", exact: true }).click();
    const world = page.getByRole("region", { name: `${sectionTitles[id - 1]} exhibition gallery`, exact: true });
    await expect(canvas).toHaveAttribute("data-camera-phase", "inside");
    await expect(world).toHaveAttribute("data-arrived", "true");
    await expect(world.locator(".interior-walk-toolbar")).toHaveCount(0);
    await expect(canvas).toHaveAttribute("data-walk-suspended", "true");
    if (id === 4) {
      await world.locator(".festival-photo-button").first().click();
      await expect(page.locator(".festival-lightbox")).toBeVisible();
    } else {
      await world.getByRole("button", { name: "Read Full Summary", exact: true }).click();
      await expect(page.locator(".gallery-summary")).toBeVisible();
    }
    await page.keyboard.press("w");
    expect(await position(canvas)).toEqual(outside);
    await page.getByRole("button", { name: id === 4 ? "Close photographs" : "Close summary", exact: true }).click();
    await world.getByRole("link", { name: "Back to Campus", exact: true }).click();
    await expect(world).toHaveCount(0);
    await expect(canvas).toHaveAttribute("data-walk-suspended", "false");
    await expect(canvas).toHaveAttribute("data-walk-near-dome", String(id));
    await expect.poll(() => position(canvas)).toEqual(outside);
  }
  expect(errors).toEqual([]);
});

test("ordinary walking doorway travel reveals the gallery and restores the outdoor landing", async ({ page }) => {
  const canvas = await beginWalk(page);
  await chooseSection(page, 1);
  await page.getByRole("button", { name: "Go Directly", exact: true }).click();
  await expect(canvas).toHaveAttribute("data-walk-near-dome", "1");
  const outside = await position(canvas);
  await page.getByRole("button", { name: "Enter Exhibition", exact: true }).click();
  const gallery = page.getByRole("region", { name: `${sectionTitles[0]} exhibition gallery`, exact: true });
  await expect(canvas).toHaveAttribute("data-camera-phase", "walk-doorway");
  await expect(canvas).toHaveAttribute("data-walk-suspended", "true");
  await expect(gallery).toHaveAttribute("data-arrived", "true");
  await expect(canvas).toHaveAttribute("data-camera-phase", "inside");
  await gallery.getByRole("link", { name: "Back to Campus", exact: true }).click();
  await expect(canvas).toHaveAttribute("data-camera-phase", "walking");
  await expect.poll(() => position(canvas)).toEqual(outside);
});

test("gallery return preserves location and sound before campus map, entrance and exit actions", async ({ page }) => {
  test.setTimeout(60_000);
  await page.addInitScript(() => {
    const contexts: AudioContext[] = [];
    Object.defineProperty(window, "__walkingAudioContexts", { value: contexts });
    const Original = window.AudioContext;
    class Observed extends Original {
      constructor(options?: AudioContextOptions) { super(options); contexts.push(this); }
    }
    Object.defineProperty(window, "AudioContext", { configurable: true, value: Observed });
  });
  const canvas = await beginWalk(page, true);
  const ambience = page.locator(".campus-ambience");
  await ambience.getByRole("button", { name: "Enable Ambience", exact: true }).click();
  await expect(ambience).toHaveAttribute("data-enabled", "true");
  await expect(ambience).toHaveAttribute("data-status", "playing");
  const entranceFoliage = Number(await canvas.getAttribute("data-foliage-presence"));
  const sounds = async () => JSON.parse((await canvas.getAttribute("data-side-fountain-sound"))!) as { presence: number }[];
  async function enter(id: number) {
    await chooseSection(page, id);
    await expect(canvas).toHaveAttribute("data-walk-near-dome", String(id));
    const outside = await position(canvas);
    if (id === 1 || id === 6) {
      await expect.poll(async () => {
        const spatial = await sounds();
        return spatial[id === 1 ? 0 : 1].presence - spatial[id === 1 ? 1 : 0].presence;
      }).toBeGreaterThan(0.01);
      await expect.poll(async () => Number(await canvas.getAttribute("data-foliage-presence"))).toBeGreaterThan(entranceFoliage);
    }
    await page.getByRole("button", { name: "Enter Exhibition", exact: true }).click();
    const world = page.getByRole("region", { name: `${sectionTitles[id - 1]} exhibition gallery`, exact: true });
    await expect(world).toHaveAttribute("data-arrived", "true");
    // Campus controls unmount indoors; observe the real audio context instead.
    await expect.poll(() => page.evaluate(() =>
      (window as typeof window & { __walkingAudioContexts: AudioContext[] }).__walkingAudioContexts[0]?.state,
    )).toBe("suspended");
    return { world, outside };
  }

  const first = await enter(1);
  await first.world.getByRole("link", { name: "Back to Campus", exact: true }).click();
  await expect(first.world).toHaveCount(0);
  await expect.poll(() => position(canvas)).toEqual(first.outside);
  await page.getByRole("button", { name: "Return to Entrance", exact: true }).click();
  await expect(canvas).toHaveAttribute("data-walk-suspended", "false");
  await expect.poll(async () => (await position(canvas))[2]).toBe(46);
  await expect(canvas).toHaveAttribute("data-walk-near-dome", "");
  await expect(ambience).toHaveAttribute("data-status", "playing");

  const sixth = await enter(6);
  await sixth.world.getByRole("link", { name: "Back to Campus", exact: true }).click();
  await expect(sixth.world).toHaveCount(0);
  await expect.poll(() => position(canvas)).toEqual(sixth.outside);
  await page.getByRole("button", { name: "Campus Map", exact: true }).click();
  await expect(canvas).toHaveAttribute("data-campus-view", "map");
  await expect(canvas).toHaveAttribute("data-walk-suspended", "true");
  await page.getByRole("button", { name: "Resume Walk", exact: true }).click();
  await expect(canvas).toHaveAttribute("data-walk-suspended", "false");
  await expect.poll(() => position(canvas)).toEqual(sixth.outside);
  await expect(ambience).toHaveAttribute("data-status", "playing");

  const second = await enter(2);
  await second.world.getByRole("link", { name: "Back to Campus", exact: true }).click();
  await expect(second.world).toHaveCount(0);
  await expect.poll(() => position(canvas)).toEqual(second.outside);
  await page.getByRole("button", { name: "Exit Walk Mode", exact: true }).click();
  await expect(canvas).toHaveAttribute("data-walking", "false");
  await expect(canvas).toHaveAttribute("data-campus-view", "arrival");
  await expect(page.getByRole("button", { name: "Walk Around", exact: true })).toBeVisible();
  await expect(ambience).toHaveAttribute("data-enabled", "true");
  await expect(ambience).toHaveAttribute("data-status", "playing");
});

test.describe("touch walking", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("touch taps route, swipes look without walking, and controls remain reachable", async ({ page }) => {
    const canvas = await beginWalk(page);
    const box = (await canvas.boundingBox())!;
    for (const name of ["Exit Walk Mode", "Campus Map", "Return to Entrance"]) {
      const control = page.getByRole("button", { name, exact: true });
      await expect(control).toBeInViewport({ ratio: 1 });
      expect((await control.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
    await expect(canvas).toHaveCSS("touch-action", "none");
    await page.touchscreen.tap(box.x + box.width * 0.5, box.y + box.height * 0.65);
    await expect(canvas).toHaveAttribute("data-walk-automatic", "true");
    await expect(canvas).toHaveAttribute("data-walk-marker-visible", "true");
    const stop = page.getByRole("button", { name: "Stop", exact: true });
    await expect(stop).toBeInViewport({ ratio: 1 });
    await stop.tap();
    await expect(canvas).toHaveAttribute("data-walk-moving", "false");
    const stopped = await position(canvas);
    const cdp = await page.context().newCDPSession(page);
    const start = { x: box.x + box.width * 0.3, y: box.y + box.height * 0.5 };
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [start] });
    for (let step = 1; step <= 8; step++) {
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: start.x + step * 14, y: start.y - step * 6 }] });
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await cdp.detach();
    await expect.poll(async () => Math.abs(Number(await canvas.getAttribute("data-walk-yaw")))).toBeGreaterThan(0.1);
    await expect(canvas).toHaveAttribute("data-walk-automatic", "false");
    expect(await position(canvas)).toEqual(stopped);
    await assertEyeHeight(canvas);
    const selector = page.getByRole("combobox", { name: "Choose an exhibition section", exact: true });
    await expect(selector).toBeInViewport({ ratio: 1 });
    await expectSectionChoices(page);
    await chooseSection(page, 3);
    await expect(canvas).toHaveAttribute("data-walk-target-dome", "3");
    await page.getByRole("button", { name: "Go Directly", exact: true }).tap();
    await expect(canvas).toHaveAttribute("data-walk-near-dome", "3");
    await expect(page.getByRole("button", { name: "Enter Exhibition", exact: true })).toBeInViewport({ ratio: 1 });
    await page.getByRole("button", { name: "Exit Walk Mode", exact: true }).tap();
    await expect(canvas).toHaveAttribute("data-walking", "false");
    await expect(canvas).not.toHaveCSS("touch-action", "none");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  });
});
