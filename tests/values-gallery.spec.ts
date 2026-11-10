import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// The requested order and copy are independent of the application manifest.
const values = [
  { id: "daya", title: "Daya", meaning: "Compassion", description: "Notice the needs of others and respond with kindness. A caring word, a helping hand, and concern for every living being bring compassion into everyday life." },
  { id: "kshama", title: "Kshama", meaning: "Forgiveness", description: "Let go of resentment and respond to mistakes with patience. Forgiveness encourages understanding, offers another chance, and helps us move forward with peace." },
  { id: "aadar", title: "Aadar", meaning: "Respect", description: "Recognize the dignity of every person. Listen attentively, speak gently, and show gratitude to parents, teachers, elders, and everyone who contributes to our lives." },
  { id: "tyag", title: "Tyag", meaning: "Selflessness", description: "Place service above personal recognition. Share your time, effort, and resources, while letting go of ego and unnecessary wants, to contribute to the wellbeing of others." },
];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const native = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      if (/webgl/.test(type)) return null;
      return native.apply(this, [type, ...args] as Parameters<typeof native>);
    } as typeof native;
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
});

async function enter(page: Page, suffix = "") {
  await page.goto(`/#section-hindu-mulyo${suffix}`);
  const gallery = page.locator(".values-gallery");
  await expect(gallery).toHaveAttribute("data-arrived", "true");
  await expect(gallery).toHaveAttribute("data-mode", "values");
  await page.evaluate(() => document.fonts.ready);
  return gallery;
}

test("the four values retain the requested order, original exhibition copy and distinct sourced photographs", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const gallery = await enter(page);
  await expect(gallery.locator(".gallery-opening h1")).toHaveText("Hindu Mulyo");
  await expect(gallery.locator(".value-card h2")).toHaveText(values.map((value) => value.title));
  await expect(gallery.locator(".value-description")).toHaveText(values.map((value) => value.description));
  await expect(gallery.locator(".value-card blockquote, .value-card q")).toHaveCount(0);
  const sources: string[] = [];
  for (const value of values) {
    const card = gallery.locator(`[data-value="${value.id}"]`);
    await expect(card.locator(".value-copy")).toContainText(value.meaning);
    const image = card.locator("img");
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate((node) => (node as HTMLImageElement).complete && (node as HTMLImageElement).naturalWidth > 0)).toBe(true);
    await expect(image).toHaveAttribute("alt", /Mahant Swami Maharaj/);
    sources.push((await image.getAttribute("src"))!);
    await expect(card.locator("figcaption")).toContainText(/BAPS/);
    await expect(card.locator("figcaption a").first()).toHaveAttribute("href", /^https:\/\/([a-z]+\.)?baps\.org\//);
    expect(await card.locator(".value-copy figcaption").count()).toBe(0);
  }
  expect(new Set(sources).size).toBe(4);
  expect(errors).toEqual([]);
});

for (const width of [1440, 1024, 768, 390, 320]) {
  test(`four cards remain readable with ${width <= 760 ? "image-first stacking" : "alternating balanced columns"} at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const gallery = await enter(page);
    const scroller = gallery.locator(".values-scroll");
    expect(await scroller.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
    let previousBottom: number | null = null;
    for (const [index, value] of values.entries()) {
      const card = gallery.locator(`[data-value="${value.id}"]`);
      await card.scrollIntoViewIfNeeded();
      const geometry = await card.evaluate((node) => {
        const frame = (element: Element) => { const box = element.getBoundingClientRect(); return { x: box.x, y: box.y, width: box.width, height: box.height, right: box.right, bottom: box.bottom }; };
        const scroll = node.closest(".values-scroll")!;
        const copy = node.querySelector(".value-copy")!;
        const description = node.querySelector(".value-description")!;
        return {
          card: frame(node), image: frame(node.querySelector(".value-photo")!), copy: frame(copy),
          documentTop: node.getBoundingClientRect().top + scroll.scrollTop,
          fontSize: parseFloat(getComputedStyle(description).fontSize),
          clipped: [...copy.querySelectorAll("h2, p")].some((element) => element.scrollWidth > element.clientWidth + 1),
        };
      });
      expect(geometry.card.x).toBeGreaterThanOrEqual(0);
      expect(geometry.card.right).toBeLessThanOrEqual(width);
      expect(geometry.clipped).toBe(false);
      expect(geometry.fontSize).toBeGreaterThanOrEqual(16);
      if (width <= 760) {
        expect(geometry.image.bottom).toBeLessThanOrEqual(geometry.copy.y + 1);
      } else {
        expect(index % 2 === 0 ? geometry.image.right <= geometry.copy.x : geometry.copy.right <= geometry.image.x).toBe(true);
        expect(geometry.image.width / geometry.copy.width).toBeGreaterThan(0.8);
        expect(geometry.image.width / geometry.copy.width).toBeLessThan(1.3);
        expect(Math.abs(geometry.image.y + geometry.image.height / 2 - geometry.copy.y - geometry.copy.height / 2)).toBeLessThan(45);
      }
      if (previousBottom !== null) expect(geometry.documentTop - previousBottom).toBeLessThan(160);
      previousBottom = geometry.documentTop + geometry.card.height;
    }
    if ([1440, 390].includes(width)) {
      const result = await new AxeBuilder({ page }).include(".values-gallery").withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
      expect(result.violations).toEqual([]);
    }
    expect(await gallery.locator(".value-card").evaluateAll((cards) => cards.every((card) => card.getAnimations({ subtree: true }).length === 0))).toBe(true);
  });
}

test("value deep links, legacy links, keyboard exploration and return navigation remain usable", async ({ page }) => {
  let gallery = await enter(page, "/value-kshama");
  await expect(gallery.getByRole("heading", { name: "Kshama", exact: true })).toBeInViewport();
  await expect(gallery.getByRole("heading", { name: "Kshama", exact: true })).toBeFocused();
  for (const [suffix, title] of [["story-1", "Daya"], ["story-2", "Aadar"], ["story-3", "Tyag"]]) {
    gallery = await enter(page, `/${suffix}`);
    await expect(gallery.getByRole("heading", { name: title, exact: true })).toBeInViewport();
  }
  gallery = await enter(page);
  const explore = gallery.getByRole("button", { name: "Explore the four values", exact: true });
  await explore.focus();
  await explore.press("Enter");
  await expect(gallery.getByRole("heading", { name: "Daya", exact: true })).toBeInViewport();
  await gallery.locator(".values-scroll").evaluate((node) => { node.scrollTop = node.scrollHeight; });
  const next = gallery.getByRole("link", { name: "Next Exhibition", exact: true });
  await expect(next).toBeInViewport();
  await next.click();
  await expect(page).toHaveURL(/#section-hindu-sanskruti-adhar-stambh$/);
  await page.goBack();
  await expect(page.locator(".values-gallery")).toHaveAttribute("data-arrived", "true");
  await page.getByRole("link", { name: "Back to Campus", exact: true }).click();
  await expect(page).toHaveURL(/#map$/);
  await expect(page.locator(".values-gallery")).toHaveCount(0);
});

test("gentle reveals finish once and leave the text still while reading", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const gallery = await enter(page);
  const card = gallery.locator('[data-value="kshama"]');
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(650);
  await expect.poll(() => card.evaluate((node) => node.getAnimations({ subtree: true }).filter((animation) => animation.playState === "running").length)).toBe(0);
  const copy = card.locator(".value-copy");
  const settled = await copy.boundingBox();
  await page.waitForTimeout(700);
  expect(await copy.boundingBox()).toEqual(settled);
  await gallery.locator(".values-scroll").evaluate((node) => { node.scrollTop = 0; });
  await card.scrollIntoViewIfNeeded();
  expect(await card.evaluate((node) => node.getAnimations({ subtree: true }).filter((animation) => animation.playState === "running").length)).toBe(0);
});
