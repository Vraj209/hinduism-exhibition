import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function holdScripts(page: Page) {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/_next/static/chunks/*.js", async (route) => { await gate; await route.continue(); });
  return release;
}

for (const { width, height, motion } of [
  { width: 1440, height: 900, motion: "no-preference" as const },
  { width: 390, height: 844, motion: "no-preference" as const },
  { width: 320, height: 568, motion: "reduce" as const },
]) {
  test(`sky welcome replaces the loading map at ${width}px with ${motion} motion`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: motion });
    const mapRequests: string[] = [];
    const errors: string[] = [];
    page.on("request", (request) => { if (request.url().includes("campus-layout.svg")) mapRequests.push(request.url()); });
    page.on("pageerror", (error) => errors.push(error.message));
    const release = await holdScripts(page);
    try {
      await page.goto("/", { waitUntil: "commit" });
      const welcome = page.locator(".campus-welcome");
      await expect(welcome.getByRole("heading", { name: "Welcome to Hinduism Exhibition", exact: true })).toBeVisible();
      await expect(page.locator('.fallback-layer, img[src="/campus-layout.svg"]')).toHaveCount(0);
      await expect(page.locator(".hero-dock")).toHaveAttribute("inert", "");
      await expect(page.locator(".campus-welcome-status")).toContainText("Preparing your visit");
      await page.evaluate(() => document.fonts.ready);
      const bounds = await welcome.locator("h1").evaluate((heading) => {
        const range = document.createRange(); range.selectNodeContents(heading);
        const rect = range.getBoundingClientRect();
        return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
      });
      expect(bounds.left).toBeGreaterThanOrEqual(0);
      expect(bounds.right).toBeLessThanOrEqual(width);
      expect(bounds.top).toBeGreaterThanOrEqual(0);
      expect(bounds.bottom).toBeLessThanOrEqual(height);
      const title = await page.locator(".hero-title").boundingBox();
      expect(title).not.toBeNull();
      expect(title!.x).toBeGreaterThanOrEqual(0);
      expect(title!.x + title!.width).toBeLessThanOrEqual(width);
      expect(Math.abs(title!.y + title!.height / 2 - height / 2)).toBeLessThan(1);
      await page.screenshot({ path: `docs/design/sky-welcome/${width}-loading.png` });
      if (motion === "reduce") await expect(page.locator(".campus-welcome-clouds-near")).toHaveCSS("animation-name", "none");
      else await expect(page.locator(".campus-welcome-clouds-near")).toHaveCSS("animation-name", "welcome-cloud-drift");
      const accessibility = await new AxeBuilder({ page }).include(".campus-welcome").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      expect(accessibility.violations).toEqual([]);
    } finally { release(); }
    if (motion !== "reduce") {
      await expect(page.locator(".campus-welcome")).toHaveAttribute("data-ready", "true");
      await expect(page.locator(".campus-welcome-sky")).toHaveCSS("animation-name", "welcome-sky-dissolve");
    }
    await expect(page.locator(".campus-welcome")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Hinduism", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Walk Around", exact: true })).toBeEnabled();
    await expect(page.locator(".campus-hero")).toHaveAttribute("aria-busy", "false");
    await page.screenshot({ path: `docs/design/sky-welcome/${width}-arrived.png` });
    expect(mapRequests).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test("failed rendering and context loss expose the fallback while retries use a fresh welcome", async ({ page }) => {
  await page.addInitScript(() => {
    Reflect.set(window, "testBlockWebGL", true);
    const native = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      if (/webgl/.test(type) && Reflect.get(window, "testBlockWebGL")) return null;
      return native.apply(this, [type, ...args] as Parameters<typeof native>);
    } as typeof native;
  });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator('.fallback-layer img[src="/campus-layout.svg"]')).toBeVisible();
  await expect(page.locator(".campus-welcome")).toHaveCount(0);
  await expect(page.locator(".map-labels a")).toHaveCount(6);
  await page.evaluate(() => Reflect.set(window, "testBlockWebGL", false));
  await page.getByRole("button", { name: "Enable 3D map", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".campus-welcome")).toBeVisible();
  await expect(page.locator(".campus-welcome")).toHaveCount(0);
  await expect(page.locator(".fallback-layer")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Use lightweight map", exact: true })).toBeFocused();
  await page.locator(".campus-webgl canvas").evaluate((canvas) => canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true })));
  await expect(page.getByRole("button", { name: "Enable 3D map", exact: true })).toBeVisible();
  await expect(page.locator(".campus-welcome")).toHaveCount(0);
  await page.getByRole("button", { name: "Enable 3D map", exact: true }).click();
  await expect(page.locator(".campus-welcome")).toBeVisible();
  await expect(page.locator(".campus-welcome")).toHaveCount(0);
  await page.getByRole("button", { name: "Use lightweight map", exact: true }).click();
  await expect(page.locator(".campus-welcome")).toHaveCount(0);
  await expect(page.locator(".fallback-layer")).toBeVisible();
  await page.getByRole("button", { name: "Enable 3D map", exact: true }).click();
  await expect(page.locator(".campus-welcome")).toBeVisible();
  await expect(page.locator(".campus-welcome")).toHaveCount(0);
});

test("a legacy festival link survives the welcome and focuses its photograph", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const release = await holdScripts(page);
  try {
    await page.goto("/#section-hindu-festivals/story-2", { waitUntil: "commit" });
    await expect(page.getByRole("heading", { name: "Welcome to Hinduism Exhibition", exact: true })).toBeVisible();
  } finally { release(); }
  await expect(page.locator(".dome-gallery")).toHaveAttribute("data-arrived", "true");
  await expect(page).toHaveURL(/#section-hindu-festivals\/story-2$/);
  await expect(page.locator('[data-festival="new-year-annakut"] button')).toBeFocused();
  await expect(page.locator('[data-festival="new-year-annakut"] img')).toBeVisible();
});

test("returning from a direct story during the welcome restores focus after the dissolve", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#section-hindu-festivals/story-2");
  await expect(page.locator(".dome-gallery")).toHaveAttribute("data-arrived", "true");
  await expect(page.locator(".campus-hero")).toHaveAttribute("data-welcoming", "true");
  await page.getByRole("link", { name: "Back to Campus", exact: true }).click();
  await expect(page.locator(".campus-welcome")).toHaveCount(0);
  await expect(page.locator(".map-pin:focus, #section-selector:focus")).toHaveCount(1);
});

for (const { width, height } of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
  test(`the title travels from center to top while controls fade in at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.addInitScript(() => {
      const frames: { welcoming: boolean; ready: boolean; values: number[]; sameTitle: boolean; top: number; width: number }[] = [];
      Reflect.set(window, "arrivalFrames", frames);
      let firstTitle: Element | null = null;
      let finishedFrames = 0;
      const sample = () => {
        const campus = document.querySelector<HTMLElement>(".campus-hero");
        const title = campus?.querySelector(".hero-title");
        if (title && !firstTitle) firstTitle = title;
        if (campus && title) {
          const welcoming = campus.dataset.welcoming === "true";
          const ready = campus.dataset.campusReady === "true";
          const nodes = [title, campus.querySelector(".hero-dock"), campus.querySelector(".map-labels")];
          const range = document.createRange();
          range.selectNodeContents(title);
          const rect = range.getBoundingClientRect();
          frames.push({ welcoming, ready, values: nodes.map((node) => node ? Number(getComputedStyle(node).opacity) : -1), sameTitle: title === firstTitle, top: rect.top, width: rect.width });
          if (!welcoming) finishedFrames++;
        }
        if (finishedFrames < 3) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    // Hold hydration so the starting position is sampled even on a warm cache.
    const release = await holdScripts(page);
    try {
      await page.goto("/", { waitUntil: "commit" });
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator(".campus-welcome")).toHaveAttribute("data-ready", "false");
    } finally { release(); }
    await expect(page.locator(".campus-welcome")).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => {
      const frames = Reflect.get(window, "arrivalFrames") as { welcoming: boolean }[];
      return frames.filter((frame) => !frame.welcoming).length;
    })).toBe(3);
    const frames = await page.evaluate(() => Reflect.get(window, "arrivalFrames")) as { welcoming: boolean; ready: boolean; values: number[]; sameTitle: boolean; top: number; width: number }[];
    expect(frames.every((frame) => frame.sameTitle)).toBe(true);
    expect(frames.every((frame) => frame.values[0] === 1)).toBe(true);
    const start = frames.filter((frame) => !frame.ready).at(-1)!;
    const before = frames.filter((frame) => frame.welcoming).at(-1)!;
    const after = frames.find((frame) => !frame.welcoming)!;
    const distance = start.top - after.top;
    expect(distance).toBeGreaterThan(height * .2);
    const travel = frames.filter((frame) => frame.ready && frame.welcoming);
    // The text must occupy intermediate positions, grow, and never jump backward.
    expect(travel.some((frame) => frame.top < start.top - distance * .2 && frame.top > after.top + distance * .2)).toBe(true);
    expect(after.width).toBeGreaterThan(start.width * 1.08);
    for (let index = 1; index < travel.length; index++) {
      expect(travel[index].top - travel[index - 1].top).toBeLessThan(1);
    }
    expect(Math.abs(after.top - before.top)).toBeLessThan(.5);
    expect(Math.abs(after.width - before.width)).toBeLessThan(.5);
    for (let index = 1; index < 3; index++) {
      expect(frames.some((frame) => frame.welcoming && frame.values[index] > .05 && frame.values[index] < .95)).toBe(true);
      expect(Math.abs(after.values[index] - before.values[index])).toBeLessThan(.05);
      expect(after.values[index]).toBe(1);
    }
    await expect(page.locator(".hero-dock")).not.toHaveAttribute("inert", "");
    await expect(page.getByRole("heading", { name: "Hinduism", exact: true })).toBeVisible();
  });
}
