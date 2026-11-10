import { createHash } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { sectionTitles as titles, sectionSlugs as slugs, expectedMomentIds, expectedMomentTitles, expectedStorySource } from "./exhibition-fixtures";

async function noWebGL(page: Page) {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      if (["webgl", "webgl2", "experimental-webgl"].includes(type)) return null;
      return Reflect.apply(original, this, [type, ...args]);
    } as typeof original;
  });
}

async function galleryReady(page: Page, section = 3, story = 0) {
  const gallery = page.getByRole("region", { name: `${titles[section]} exhibition gallery`, exact: true });
  await expect(gallery).toHaveAttribute("data-arrived", "true");
  if (story) {
    await expect(gallery.locator(`[data-moment="${story}"]`)).toHaveAttribute("data-active", "true");
    await expect(gallery.locator(`[data-moment="${story}"] h2`)).toHaveText(expectedMomentTitles[section][story - 1]);
  }
  return gallery;
}

async function fullSummary(page: Page) {
  await page.locator(".gallery-scroll").evaluate((element) => element.scrollTo({ top: element.scrollHeight, behavior: "instant" }));
  await expect(page.locator(".gallery-closing")).toHaveAttribute("data-active", "true");
  await page.getByRole("button", { name: "Read Full Summary", exact: true }).click();
  const dialog = page.locator(".gallery-summary");
  await expect(dialog).toBeVisible();
  return dialog;
}

test("rapid pavilion selections cancel stale arrivals and leave only the final gallery interactive", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/#map");
  const canvas = page.locator(".campus-webgl canvas");
  await expect(canvas).toHaveAttribute("data-camera-phase", "overview");
  for (const section of [0, 3, 1, 5]) {
    await page.evaluate((slug) => { window.location.hash = `section-${slug}`; }, slugs[section]);
    await page.waitForTimeout(90);
  }
  const gallery = await galleryReady(page, 5);
  await expect(page).toHaveURL(/#section-hindu-sanskruti-adhar-stambh$/);
  await expect(page.locator(".dome-gallery:not([aria-hidden='true'])")).toHaveCount(1);
  await expect(gallery.locator(".gallery-opening h1")).toBeFocused();
  await expect(gallery.locator(".gallery-entering")).toHaveCount(0);
  await expect(canvas).toHaveAttribute("data-camera-position", "17.000,2.300,18.000");
  expect(errors).toEqual([]);
});

test("the festival gallery creates no audio context or animation canvas during browsing or lightbox navigation", async ({ page }) => {
  await noWebGL(page);
  await page.addInitScript(() => {
    const NativeAudioContext = window.AudioContext;
    let created = 0;
    class ObservedContext extends NativeAudioContext {
      constructor(options?: AudioContextOptions) { super(options); created++; }
    }
    Object.defineProperty(window, "AudioContext", { value: ObservedContext, configurable: true });
    Object.defineProperty(window, "__galleryAudioContexts", { get: () => created });
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#section-hindu-festivals/story-1");
  const gallery = await galleryReady(page);
  const photograph = gallery.locator('[data-festival="diwali"] button');
  await expect(photograph).toBeFocused();
  await expect(gallery.locator("canvas, video, audio")).toHaveCount(0);
  await photograph.click();
  const lightbox = page.getByRole("dialog", { name: "Festival photographs", exact: true });
  await expect(lightbox).toBeVisible();
  const counter = lightbox.locator(".festival-lightbox-counter");
  const initialCounter = await counter.textContent();
  await lightbox.getByRole("button", { name: "Next photograph", exact: true }).click();
  await expect(counter).not.toHaveText(initialCounter!);
  await expect(lightbox.locator("canvas, video, audio")).toHaveCount(0);
  await lightbox.getByRole("button", { name: "Close photographs", exact: true }).click();
  await expect(photograph).toBeFocused();
  expect(await page.evaluate(() => Reflect.get(window, "__galleryAudioContexts"))).toBe(0);
});

test("WebGL failure retains the six campus destinations, festival photographs and complete reading route", async ({ page }) => {
  await noWebGL(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#map");
  await expect(page.getByRole("button", { name: "Enable 3D map", exact: true })).toBeVisible();
  await expect(page.locator(".map-labels").getByRole("link")).toHaveCount(6);
  await page.locator("#destination-4").click();
  const gallery = await galleryReady(page);
  await gallery.getByRole("button", { name: "Scroll to Discover", exact: true }).click();
  const photograph = gallery.locator('[data-festival="new-year-annakut"] img');
  await expect(photograph).toBeInViewport();
  await expect.poll(() => photograph.evaluate((image) => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0)).toBe(true);
  await expect(photograph).toHaveAttribute("alt", /\S+/);
  await gallery.getByRole("link", { name: "Credits", exact: true }).click();
  await expect(page).toHaveURL(/\/references#festival-photo-credits$/);
  await page.getByRole("link", { name: "Read all six sections", exact: false }).click();
  await expect(page.getByRole("article")).toHaveCount(6);
  await expect(page.locator("details[id^='story-']")).toHaveCount(29);
});

test("denied storage does not block festival photographs, browser history, refresh or lightbox access", async ({ page }) => {
  await noWebGL(page);
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", { get() { throw new DOMException("Storage denied", "SecurityError"); } });
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#section-hindu-festivals/story-14");
  await galleryReady(page);
  const photograph = page.locator('[data-festival="navratri-dussehra"] button');
  await expect(photograph).toBeFocused();
  await expect(photograph).toBeInViewport();
  await page.reload();
  await galleryReady(page);
  await expect(photograph).toBeFocused();
  await expect(photograph).toBeInViewport();
  await photograph.click();
  const lightbox = page.getByRole("dialog", { name: "Festival photographs", exact: true });
  await expect(lightbox).toBeVisible();
  await lightbox.getByRole("button", { name: "Close photographs", exact: true }).click();
  await expect(photograph).toBeFocused();
  await page.locator(".festival-end").scrollIntoViewIfNeeded();
  await expect(page).toHaveURL(/#section-hindu-festivals\/closing$/);
  await page.getByRole("link", { name: "Next Exhibition", exact: true }).click();
  await galleryReady(page, 4);
  await page.goBack();
  await galleryReady(page, 3);
  await expect(page).toHaveURL(/#section-hindu-festivals\/closing$/);
  await expect(page.locator(".festival-end")).toBeInViewport();
  await page.goForward();
  await galleryReady(page, 4);
  expect(errors).toEqual([]);
});

for (const viewport of [{ width: 390, height: 844 }, { width: 320, height: 568 }, { width: 844, height: 390 }, { width: 640, height: 360 }]) {
  test(`long titles and summaries remain reachable without covering navigation at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    test.setTimeout(60_000);
    await noWebGL(page);
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const [section, story] of [[5, 3], [1, 3], [2, 3]]) {
      await page.goto(`/#section-${slugs[section]}/story-${story}`);
      const gallery = await galleryReady(page, section, story);
      const heading = gallery.locator(`[data-moment="${story}"] h2`);
      await heading.scrollIntoViewIfNeeded();
      const [header, title, footer] = await Promise.all([
        gallery.locator(".gallery-header").boundingBox(), heading.boundingBox(), gallery.locator(".gallery-footer").boundingBox(),
      ]);
      expect(title!.x).toBeGreaterThanOrEqual(0);
      expect(title!.x + title!.width).toBeLessThanOrEqual(viewport.width);
      expect(title!.y).toBeGreaterThanOrEqual(header!.y + header!.height - 1);
      expect(title!.y + title!.height).toBeLessThanOrEqual(footer!.y + 1);
      await expect(gallery.getByRole("link", { name: "Back to Campus", exact: true })).toBeInViewport({ ratio: 1 });
      await expect(gallery.getByRole("button", { name: "Next story", exact: true })).toBeInViewport({ ratio: 1 });
      expect(await gallery.locator(".gallery-scroll").evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
      const dialog = await fullSummary(page);
      await expect(dialog.getByRole("button", { name: "Close summary", exact: true })).toBeInViewport({ ratio: 1 });
      const source = dialog.locator(".gallery-summary-body section").nth(story - 1).locator("a").first();
      await source.scrollIntoViewIfNeeded();
      await expect(source).toBeInViewport();
      await expect(source).toHaveAttribute("href", expectedStorySource(section, story - 1));
      await page.keyboard.press("Escape");
      await expect(page.getByRole("button", { name: "Read Full Summary", exact: true })).toBeFocused();
    }
  });
}

test("the original fifty-eight desktop and mobile illustrations remain distinct and available", async ({ request }) => {
  for (let section = 1; section <= 6; section++) {
    const storyCount = expectedMomentTitles[section - 1].length;
    const desktopHashes = new Map<number, string>();
    for (const suffix of ["", "-mobile"]) {
      const hashes = new Set<string>();
      for (let story = 1; story <= storyCount; story++) {
        const response = await request.get(`/worlds/${section}-${story}${suffix}.webp`);
        expect(response.status()).toBe(200);
        expect(response.headers()["content-type"]).toContain("image/webp");
        const hash = createHash("sha256").update(await response.body()).digest("hex");
        hashes.add(hash);
        if (!suffix) desktopHashes.set(story, hash);
        else expect(hash).not.toBe(desktopHashes.get(story));
      }
      expect(hashes.size).toBe(storyCount);
    }
  }
});

for (let section = 0; section < titles.length; section++) {
  if (section === 3) continue; // Photographic gallery accessibility is covered in festival-gallery.spec.ts.
  test(`section ${section + 1} mobile gallery and full summary meet automatic WCAG checks`, async ({ page }) => {
    await noWebGL(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/#section-${slugs[section]}/story-2`);
    await galleryReady(page, section, 2);
    for (const state of ["gallery", "summary"]) {
      if (state === "summary") await fullSummary(page);
      const result = await new AxeBuilder({ page }).exclude("nextjs-portal").withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
      expect(result.violations.map((issue) => ({ id: issue.id, nodes: issue.nodes.map((node) => node.target) })), state).toEqual([]);
    }
  });
}

for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
  test(`all fifteen narrative gallery stories pair correct imagery with their actual source at ${viewport.width}px`, async ({ page }) => {
    test.setTimeout(60_000);
    await noWebGL(page);
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (let section = 0; section < 6; section++) {
      if (section === 3) continue;
      await page.goto(`/#section-${slugs[section]}/story-1`);
      const gallery = await galleryReady(page, section, 1);
      for (let story = 0; story < expectedMomentTitles[section].length; story++) {
        if (story) await gallery.getByRole("button", { name: "Next story", exact: true }).click();
        await galleryReady(page, section, story + 1);
        const image = gallery.locator(`[data-moment="${story + 1}"] img`);
        const expectedPath = `/gallery/${expectedMomentIds[section][story]}.webp`;
        await image.scrollIntoViewIfNeeded();
        await expect.poll(() => image.evaluate((element) => (element as HTMLImageElement).complete && (element as HTMLImageElement).naturalWidth > 0)).toBe(true);
        await expect.poll(() => image.evaluate((element) => new URL((element as HTMLImageElement).currentSrc).pathname)).toBe(expectedPath);
        await expect(image).toHaveAttribute("alt", /\S+/);
        await expect(gallery.locator(`[data-moment="${story + 1}"] figcaption`)).toContainText("Photo: BAPS Swaminarayan Sanstha");
        await expect(gallery.locator(`[data-moment="${story + 1}"] figcaption a`)).toHaveAttribute("href", /^https:\/\/([a-z]+\.)?baps\.org\//);
      }
      const dialog = await fullSummary(page);
      const storySummaries = dialog.locator(".gallery-summary-body section");
      await expect(storySummaries.locator("h3")).toHaveText(expectedMomentTitles[section]);
      for (let story = 0; story < expectedMomentTitles[section].length; story++) {
        await expect(storySummaries.nth(story).locator("a").first()).toHaveAttribute("href", expectedStorySource(section, story));
      }
    }
  });
}
