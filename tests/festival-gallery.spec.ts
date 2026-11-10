import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { festivalEntries, festivalGalleryEntries, festivalGalleryPhotos } from "../content/festival-gallery";
import rawPhotos from "../content/festival-photographs.json";

const names = [
  "New Year – Annakut", "Chhath Puja", "Gita Jayanti", "Vaikunth Ekadashi",
  "Uttarayan", "Pongal", "Vasant Panchami", "Maha Shivratri", "Holi", "Fuldol",
  "Ram Navami – Shri Hari Jayanti", "Gudi Padwa – Ugadi", "Akshaya Tritiya", "Nrusinh Jayanti",
  "Ganga Dussehra", "Vat Savitri", "Rath Yatra", "Guru Purnima", "Janmashtami", "Raksha Bandhan",
  "Ganesh Chaturthi", "Onam", "Diwali", "Navratri – Dussehra",
];
const months = ["Kartak", "Magshar", "Posh", "Maha", "Fagan", "Chaitra", "Vaishakh", "Jeth", "Ashadh", "Shravan", "Bhadarvo", "Aso"];
const tags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const native = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      if (type === "webgl" || type === "webgl2" || type === "experimental-webgl") return null;
      return native.apply(this, [type, ...args] as Parameters<typeof native>);
    } as typeof native;
  });
});

async function enter(page: Page) {
  await page.goto("/#section-hindu-festivals");
  await expect(page.locator(".festival-gallery")).toHaveAttribute("data-arrived", "true");
  await expect(page.locator(".festival-photo-button")).toHaveCount(festivalGalleryEntries.length);
  return page.locator(".festival-gallery");
}

async function openFirst(page: Page) {
  const button = page.locator(".festival-photo-button").first();
  await button.scrollIntoViewIfNeeded();
  await button.click();
  const dialog = page.getByRole("dialog", { name: "Festival photographs", exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(".festival-lightbox-full")).toHaveAttribute("data-loaded", "true");
  return { button, dialog };
}

test("the calendar preserves the exact 24 ordered entries and records provenance and gaps without substitutions", async () => {
  expect(festivalEntries.map((entry) => entry.name)).toEqual(names);
  expect(festivalEntries.map((entry) => entry.month)).toEqual(months.flatMap((month) => [month, month]));
  expect(new Set(rawPhotos.map((photo) => photo.id)).size).toBe(rawPhotos.length);
  expect(festivalGalleryPhotos.length).toBeGreaterThan(0);
  const notes = readFileSync("docs/design/dome-4-gallery-verification.md", "utf8");
  for (const photo of rawPhotos) {
    const entry = festivalEntries.find((candidate) => candidate.id === photo.festivalId);
    expect(entry, photo.id).toBeDefined();
    expect([...entry!.celebrations, entry!.celebrations.join("–")], photo.id).toContain(photo.celebration);
    expect(photo.permission.status, photo.id).toBe("approved");
    expect(photo.permission.evidence, photo.id).toBeTruthy();
    for (const key of ["sourcePageUrl", "sourceImageUrl"] as const) {
      const parsed = new URL(photo[key]);
      expect(parsed.protocol).toBe("https:");
      const officialPage = parsed.hostname === "baps.org" || parsed.hostname.endsWith(".baps.org");
      const officialImageCdn = key === "sourceImageUrl" && parsed.hostname === "static.wn.baps-apps.org";
      expect(officialPage || officialImageCdn, `${photo.id}: ${photo[key]}`).toBe(true);
    }
    expect(photo.alt.length, photo.id).toBeGreaterThan(25);
    expect(photo.location, photo.id).toBeTruthy();
    expect(photo.year, photo.id).toBeGreaterThan(1900);
    expect(photo.credit, photo.id).toContain("BAPS");
    expect(photo.width, photo.id).toBeGreaterThan(0);
    expect(photo.height, photo.id).toBeGreaterThan(0);
    expect(photo.fullSrc, photo.id).not.toBe(photo.src);
  }
  for (const entry of festivalEntries) {
    const represented = new Set(entry.photos.map((photo) => photo.celebration));
    expect(entry.missing).toEqual(entry.celebrations.filter((celebration) => !represented.has(celebration)));
    for (const missing of entry.missing) expect(notes, `Undocumented gap: ${missing}`).toContain(missing);
  }
});

test("Dome 4 shows one image-only lead per covered entry and never fetches full-size files before opening", async ({ page }) => {
  const fullPaths = new Set(festivalGalleryPhotos.map((photo) => new URL(photo.fullSrc, "http://localhost").pathname));
  const requestedFull: string[] = [];
  page.on("request", (request) => {
    const path = new URL(request.url()).pathname;
    if (fullPaths.has(path)) requestedFull.push(path);
  });
  const gallery = await enter(page);
  await expect(gallery.locator(".festival-hero h1")).toHaveText("Hindu Festivals");
  expect(await gallery.locator(".festival-print").evaluateAll((prints) => prints.map((print) => print.getAttribute("data-festival")))).toEqual(festivalGalleryEntries.map((entry) => entry.id));
  await expect(gallery.locator(".festival-compositions")).toHaveText("");
  await expect(gallery.locator(".festival-compositions :is(h2, h3, p, figcaption, [title])")).toHaveCount(0);
  await expect(gallery.locator(".gallery-story")).toHaveCount(0);
  for (const image of await gallery.locator(".festival-photo-button img").all()) {
    await expect(image).toHaveAttribute("loading", "lazy");
    await expect(image).toHaveAttribute("srcset", /\d+w/);
    await expect(image).toHaveAttribute("width", /[1-9]\d*/);
    await expect(image).toHaveAttribute("height", /[1-9]\d*/);
  }
  expect(requestedFull).toEqual([]);
  const { dialog } = await openFirst(page);
  expect(requestedFull).toEqual([new URL(festivalGalleryPhotos[0].fullSrc, "http://localhost").pathname]);
  await expect(dialog.locator(".festival-lightbox-full")).toHaveCSS("object-fit", "contain");
  await expect(dialog.locator(".festival-lightbox-credit")).toContainText(festivalGalleryPhotos[0].location);
  await expect(dialog.locator(".festival-lightbox-credit a")).toHaveAttribute("href", festivalGalleryPhotos[0].sourcePageUrl);
});

test("natural scroll stops with input and reverses without snapping or advancing automatically", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await enter(page);
  const scroll = page.locator(".festival-scroll");
  const box = await scroll.boundingBox();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.wheel(0, 525);
  await expect.poll(() => scroll.evaluate((element) => element.scrollTop)).toBeCloseTo(525, 0);
  const position = await scroll.evaluate((element) => element.scrollTop);
  await page.waitForTimeout(500);
  expect(await scroll.evaluate((element) => element.scrollTop)).toBe(position);
  await page.mouse.wheel(0, -325);
  await expect.poll(() => scroll.evaluate((element) => element.scrollTop)).toBeCloseTo(200, 0);
  await page.mouse.wheel(0, -200);
  await expect.poll(() => scroll.evaluate((element) => element.scrollTop)).toBe(0);
});

test("legacy festival links retain their destinations across hash navigation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await enter(page);
  for (const [story, festival] of [[2, "new-year-annakut"], [13, "uttarayan"], [7, "ram-navami-shri-hari-jayanti"], [14, "navratri-dussehra"]] as const) {
    await page.evaluate((ordinal) => { location.hash = `section-hindu-festivals/story-${ordinal}`; }, story);
    await expect(page.locator(`[data-festival="${festival}"] button`)).toBeFocused();
    await expect(page.locator(`[data-festival="${festival}"]`)).toBeInViewport();
  }
  await page.evaluate(() => { location.hash = "section-hindu-festivals"; });
  await expect(page.locator(".festival-hero h1")).toBeFocused();
  expect(await page.locator(".festival-scroll").evaluate((element) => element.scrollTop)).toBe(0);
});

test("lightbox keyboard navigation, focus containment, Escape and return position work with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const gallery = await enter(page);
  const { button, dialog } = await openFirst(page);
  const scroll = page.locator(".festival-scroll");
  const position = await scroll.evaluate((element) => element.scrollTop);
  const close = dialog.getByRole("button", { name: "Close photographs", exact: true });
  await expect(close).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(dialog.locator(".festival-lightbox-full")).toHaveAttribute("alt", festivalGalleryPhotos[1].alt);
  await page.keyboard.press("ArrowLeft");
  await expect(dialog.locator(".festival-lightbox-full")).toHaveAttribute("alt", festivalGalleryPhotos[0].alt);
  await page.keyboard.press("ArrowLeft");
  await expect(dialog.locator(".festival-lightbox-full")).toHaveAttribute("alt", festivalGalleryPhotos.at(-1)!.alt);
  await page.keyboard.press("Home");
  await expect(dialog.locator(".festival-lightbox-full")).toHaveAttribute("alt", festivalGalleryPhotos[0].alt);
  for (let index = 0; index < 7; index++) {
    await page.keyboard.press("Tab");
    expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press("Shift+Tab");
  expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  expect((await new AxeBuilder({ page }).include(".festival-lightbox").withTags(tags).analyze()).violations).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(button).toBeFocused();
  expect(await scroll.evaluate((element) => element.scrollTop)).toBe(position);
  await expect(scroll).not.toHaveCSS("overflow-y", "hidden");
  expect(await gallery.locator(".festival-print").evaluateAll((prints) => prints.flatMap((print) => print.getAnimations()).length)).toBe(0);
});

for (const width of [320, 390, 768, 1440]) {
  test(`photo exhibition and complete lightbox fit ${width}px without horizontal overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await enter(page);
    const scroll = page.locator(".festival-scroll");
    expect(await scroll.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    const first = page.locator(".festival-photo-button").first();
    await first.scrollIntoViewIfNeeded();
    await expect.poll(() => first.locator("img").evaluate((image) => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0)).toBe(true);
    const buttonBox = await first.boundingBox();
    expect(buttonBox!.width).toBeGreaterThanOrEqual(280);
    expect(buttonBox!.height).toBeGreaterThan(44);
    expect((await new AxeBuilder({ page }).include(".festival-gallery").withTags(tags).analyze()).violations).toEqual([]);
    const { dialog } = await openFirst(page);
    expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth && element.scrollHeight <= element.clientHeight)).toBe(true);
    await expect(dialog.getByRole("button", { name: "Close photographs", exact: true })).toBeInViewport();
    const imageBox = await dialog.locator(".festival-lightbox-full").boundingBox();
    expect(imageBox!.x).toBeGreaterThanOrEqual(0);
    expect(imageBox!.x + imageBox!.width).toBeLessThanOrEqual(width);
    expect(imageBox!.y).toBeGreaterThanOrEqual(0);
    expect(imageBox!.y + imageBox!.height).toBeLessThanOrEqual(844);
    const displayedRatio = imageBox!.width / imageBox!.height;
    expect(displayedRatio).toBeCloseTo(festivalGalleryPhotos[0].width / festivalGalleryPhotos[0].height, 1);
    expect(errors).toEqual([]);
    await dialog.getByRole("button", { name: "Close photographs", exact: true }).click();
    await expect(dialog).toHaveCount(0);
  });
}

test("phone horizontal swipes change images while short and vertical gestures do not", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await enter(page);
  const { dialog } = await openFirst(page);
  const stage = dialog.locator(".festival-lightbox-stage");
  const pointer = { pointerType: "touch", isPrimary: true, pointerId: 1 };
  await stage.dispatchEvent("pointerdown", { ...pointer, clientX: 300, clientY: 300 });
  await stage.dispatchEvent("pointerup", { ...pointer, clientX: 100, clientY: 310 });
  await expect(dialog.locator(".festival-lightbox-full")).toHaveAttribute("alt", festivalGalleryPhotos[1].alt);
  await stage.dispatchEvent("pointerdown", { ...pointer, clientX: 100, clientY: 300 });
  await stage.dispatchEvent("pointerup", { ...pointer, clientX: 300, clientY: 310 });
  await expect(dialog.locator(".festival-lightbox-full")).toHaveAttribute("alt", festivalGalleryPhotos[0].alt);
  await stage.dispatchEvent("pointerdown", { ...pointer, clientX: 300, clientY: 300 });
  await stage.dispatchEvent("pointerup", { ...pointer, clientX: 280, clientY: 300 });
  await expect(dialog.locator(".festival-lightbox-full")).toHaveAttribute("alt", festivalGalleryPhotos[0].alt);
  await stage.dispatchEvent("pointerdown", { ...pointer, clientX: 300, clientY: 300 });
  await stage.dispatchEvent("pointerup", { ...pointer, clientX: 200, clientY: 600 });
  await expect(dialog.locator(".festival-lightbox-full")).toHaveAttribute("alt", festivalGalleryPhotos[0].alt);
  const nextBox = await dialog.getByRole("button", { name: "Next photograph", exact: true }).boundingBox();
  expect(nextBox!.width).toBeGreaterThanOrEqual(44);
  expect(nextBox!.height).toBeGreaterThanOrEqual(44);
});
