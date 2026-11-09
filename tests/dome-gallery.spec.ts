import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { expectedMomentTitles, sectionSlugs, sectionTitles } from "./exhibition-fixtures";

// Gallery behavior must remain available even without a WebGL-capable device.
// The separate campus-return suite covers integration with the live walker.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const native = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      if (type === "webgl" || type === "webgl2" || type === "experimental-webgl") return null;
      return native.apply(this, [type, ...args] as Parameters<typeof native>);
    } as typeof native;
  });
});

async function enter(page: Page, section = 0, suffix = "") {
  await page.goto(`/#section-${sectionSlugs[section]}${suffix}`);
  await expect(page.locator(".dome-gallery")).toHaveAttribute("data-arrived", "true");
  return page.locator(".dome-gallery");
}

async function readMoment(page: Page, index: number) {
  await expect(page.locator(`.gallery-moment[data-moment="${index}"]`)).toHaveAttribute("data-active", "true");
  await expect(page.locator(`.gallery-moment[data-moment="${index}"] .gallery-copy`)).toHaveCSS("opacity", "1");
}

const tags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

test("native scrolling holds text steady, stops with input, and reverses through the same stories", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const gallery = await enter(page);
  await expect(gallery).toHaveAttribute("data-mode", "depth");
  await expect(page.locator(".gallery-moment img")).toHaveCount(1);
  await page.mouse.move(700, 500);
  const step = await page.locator(".gallery-scroll").evaluate((element) => element.clientHeight * 1.15);
  await page.mouse.wheel(0, step * 0.8);
  await readMoment(page, 1);
  const text = page.locator('[data-moment="1"] .gallery-copy');
  const start = await text.boundingBox();
  await page.mouse.wheel(0, step * 0.4);
  await expect.poll(() => page.locator(".gallery-scroll").evaluate((element) => element.scrollTop)).toBeCloseTo(step * 1.2, 0);
  await readMoment(page, 1);
  expect(await text.boundingBox()).toEqual(start);
  const state = await page.locator(".gallery-scroll").evaluate((element) => ({ top: element.scrollTop, hash: location.hash }));
  await page.waitForTimeout(700);
  expect(await page.locator(".gallery-scroll").evaluate((element) => ({ top: element.scrollTop, hash: location.hash }))).toEqual(state);
  expect(await text.boundingBox()).toEqual(start);
  await page.mouse.wheel(0, step);
  await readMoment(page, 2);
  await expect(page.getByRole("heading", { name: "What we wear", exact: true })).toBeVisible();
  await page.mouse.wheel(0, -step);
  await readMoment(page, 1);
  await expect(page.getByRole("heading", { name: "Food and everyday life", exact: true })).toBeVisible();
  await expect(page.locator(".world-webgl")).toHaveCount(0);
});

test("deep links, previous/next buttons, full summary and browser Back retain their narrative positions", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await enter(page, 0, "/story-2");
  await readMoment(page, 2);
  await page.getByRole("button", { name: "Previous story", exact: true }).click();
  await readMoment(page, 1);
  await expect(page).toHaveURL(/#section-hindu-jivan-shaili\/story-1$/);
  for (let index = 2; index <= 4; index++) {
    await page.getByRole("button", { name: "Next story", exact: true }).click();
    await readMoment(page, index);
  }
  await expect(page).toHaveURL(/\/closing$/);
  await expect(page.getByRole("button", { name: "Next story", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Read Full Summary", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading", { name: "Hindu Jivan Shaili", exact: true })).toBeVisible();
  await expect(dialog.locator("h3")).toHaveText(expectedMomentTitles[0]);
  await expect(dialog.locator('a[href="/exhibition-source.pdf#page=1"]')).toHaveCount(3);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Read Full Summary", exact: true })).toBeFocused();
  await page.getByRole("link", { name: "Next Exhibition", exact: true }).click();
  await expect(page).toHaveURL(/#section-hindu-riti-parampara$/);
  await readMoment(page, 0);
  await page.goBack();
  await expect(page).toHaveURL(/#section-hindu-jivan-shaili\/closing$/);
  await readMoment(page, 4);
  await page.getByRole("link", { name: "Back to Campus", exact: true }).click();
  await expect(page).toHaveURL(/#map$/);
  await expect(page.locator(".dome-gallery")).toHaveCount(0);
});

test("the shared gallery preserves every approved story across all six domes", async ({ page }) => {
  test.setTimeout(60_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (let section = 0; section < sectionSlugs.length; section++) {
    const gallery = await enter(page, section);
    await expect(gallery).toHaveAttribute("data-mode", "vertical");
    await expect(gallery.locator(".gallery-moment")).toHaveCount(section === 3 ? 16 : 5);
    await expect(gallery.locator(".gallery-opening h1")).toHaveText(sectionTitles[section]);
    await expect(gallery.locator(".gallery-story h2")).toHaveText(expectedMomentTitles[section]);
    await expect(gallery.locator('[aria-hidden="true"].gallery-moment')).toHaveCount(0);
    await expect(gallery.locator(".gallery-stage")).toHaveCSS("perspective", "none");
    await expect(gallery.locator(".gallery-moment").first()).toHaveCSS("transform", "none");
    await expect(page.getByRole("button", { name: "Previous story", exact: true })).toBeDisabled();
  }
  expect(errors).toEqual([]);
});

for (const width of [320, 390]) {
  test(`phone ${width}px uses vertical scrolling with readable images, clear controls and accessible text`, async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    const gallery = await enter(page, 3);
    await expect(gallery).toHaveAttribute("data-mode", "vertical");
    await page.getByRole("button", { name: "Scroll to Discover", exact: true }).click();
    await readMoment(page, 1);
    const scene = page.locator('[data-moment="1"]');
    const image = scene.locator("img");
    await expect(image).toBeVisible();
    await expect.poll(() => image.evaluate((node) => (node as HTMLImageElement).complete && (node as HTMLImageElement).naturalWidth > 0)).toBe(true);
    const [imageBox, textBox] = await Promise.all([image.boundingBox(), scene.locator(".gallery-copy").boundingBox()]);
    expect(imageBox!.y + imageBox!.height).toBeLessThan(textBox!.y);
    const sizes = await gallery.evaluate((element) => {
      const scroll = element.querySelector(".gallery-scroll")!;
      const caption = element.querySelector('[data-moment="1"] .gallery-caption')!;
      return {
        width: element.clientWidth,
        scrollWidth: scroll.scrollWidth,
        viewportWidth: scroll.clientWidth,
        textSize: parseFloat(getComputedStyle(caption).fontSize),
      };
    });
    expect(sizes.width).toBe(width);
    expect(sizes.scrollWidth).toBeLessThanOrEqual(sizes.viewportWidth);
    expect(sizes.textSize).toBeGreaterThanOrEqual(16);
    await expect(page.getByRole("link", { name: "Back to Campus", exact: true })).toBeInViewport();
    await expect(page.getByRole("button", { name: "Next story", exact: true })).toBeInViewport();
    const result = await new AxeBuilder({ page }).include(".dome-gallery").withTags(tags).analyze();
    expect(result.violations).toEqual([]);
    await page.getByRole("button", { name: "Next story", exact: true }).click();
    await readMoment(page, 2);
    await page.getByRole("button", { name: "Previous story", exact: true }).click();
    await readMoment(page, 1);
  });
}

test("desktop only mounts nearby media and the reading display passes accessibility checks", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await enter(page, 3, "/story-7");
  await readMoment(page, 7);
  await expect(page.locator(".gallery-story img")).toHaveCount(3);
  await expect(page.locator('[data-moment="7"] img')).toBeVisible();
  await expect(page.locator('[data-moment="8"] img')).toHaveCount(1);
  await expect(page.locator('[data-moment="10"] img')).toHaveCount(0);
  const result = await new AxeBuilder({ page }).include(".dome-gallery").withTags(tags).analyze();
  expect(result.violations).toEqual([]);
});

test("deep links focus the active heading and phone resizing preserves the reading offset", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await enter(page, 0, "/story-2");
  await expect(page.getByRole("heading", { name: "What we wear", exact: true })).toBeFocused();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".dome-gallery")).toHaveAttribute("data-mode", "vertical");
  const scroll = page.locator(".gallery-scroll");
  await scroll.evaluate((element) => {
    const story = element.querySelector<HTMLElement>('[data-moment="2"]')!;
    element.scrollTo({ top: story.offsetTop + 120, behavior: "instant" });
  });
  const before = await scroll.evaluate((element) => element.scrollTop);
  await page.setViewportSize({ width: 390, height: 800 });
  // Native scroll anchoring can adjust for changed upstream layout. The reader
  // must not be reset to the start of the current display by ResizeObserver.
  const offset = await scroll.evaluate((element) => element.scrollTop - element.querySelector<HTMLElement>('[data-moment="2"]')!.offsetTop);
  expect(before).toBeGreaterThan(120);
  expect(offset).toBeGreaterThan(60);
  await expect(page.locator('[data-moment="2"]')).toHaveAttribute("data-active", "true");
});
