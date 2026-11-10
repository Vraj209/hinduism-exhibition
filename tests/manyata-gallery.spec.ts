import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { beliefs, beliefImages } from "../content/beliefs";

const titles = ["Aatma", "Karma", "Punarjanma", "Avatar", "Murti", "Moksha"];
const english = ["I am the soul", "My choices matter", "The soul travels on", "God comes to guide", "God is present here", "Freedom is the goal"];
// Exact transcription of the supplied reference; not a generated translation.
const gujarati = ["હું આત્મા છું", "મારી પસંદગી મહત્વની છે", "આત્માની યાત્રા ચાલુ રહે છે", "ભગવાન માર્ગ બતાવવા પધારે છે", "ભગવાન અહીં પ્રત્યક્ષ છે", "મુક્તિ એ જ અંતિમ લક્ષ્ય"];
const tags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const native = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      if (/webgl/.test(type)) return null;
      return native.apply(this, [type, ...args] as Parameters<typeof native>);
    } as typeof native;
  });
});

async function enter(page: Page) {
  await page.goto("/#section-hindu-manyata");
  await expect(page.locator(".manyata-gallery")).toHaveAttribute("data-arrived", "true");
  await expect(page.locator("article[data-belief]")).toHaveCount(6);
  await page.evaluate(() => document.fonts.ready);
  return page.locator(".manyata-gallery");
}

async function assertReadableCards(page: Page) {
  for (const card of await page.locator("article[data-belief]").all()) {
    const label = await card.getAttribute("data-belief");
    const geometry = await card.evaluate((element) => {
      const outer = element.getBoundingClientRect();
      return {
        text: [...element.querySelectorAll(".belief-copy h2, .belief-copy p")].map((node) => {
          const box = node.getBoundingClientRect();
          const style = getComputedStyle(node);
          return { left: box.left - outer.left, right: box.right - outer.right, bottom: box.bottom - outer.bottom, top: box.top - outer.top, scrollWidth: node.scrollWidth, clientWidth: node.clientWidth, display: style.display, visibility: style.visibility, opacity: style.opacity };
        }),
      };
    });
    for (const box of geometry.text) {
      expect(box.left, `${label}: text left edge`).toBeGreaterThanOrEqual(0);
      expect(box.right, `${label}: text right edge`).toBeLessThanOrEqual(1);
      expect(box.top, `${label}: text top edge`).toBeGreaterThanOrEqual(0);
      expect(box.bottom, `${label}: text bottom edge`).toBeLessThanOrEqual(1);
      expect(box.scrollWidth, `${label}: line overflow`).toBeLessThanOrEqual(box.clientWidth + 1);
      expect(box.display).not.toBe("none");
      expect(box.visibility).toBe("visible");
      expect(box.opacity).toBe("1");
    }
  }
}

test("six belief cards preserve the supplied order and exact bilingual wording with a loaded Gujarati font", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const gallery = await enter(page);
  expect(beliefs.map((belief) => belief.title)).toEqual(titles);
  expect(beliefs.map((belief) => belief.english)).toEqual(english);
  expect(beliefs.map((belief) => belief.gujarati)).toEqual(gujarati);
  await expect(gallery.locator(".belief-card h2")).toHaveText(titles);
  await expect(gallery.locator(".belief-english")).toHaveText(english);
  await expect(gallery.locator(".belief-gujarati")).toHaveText(gujarati);
  await expect(gallery.locator(".belief-medallion")).toHaveText(["01", "02", "03", "04", "05", "06"]);
  await expect(gallery.locator(".belief-card button, .belief-card details, .belief-card [hidden]")).toHaveCount(0);
  await expect(gallery.locator(".belief-card[aria-hidden='true']")).toHaveCount(0);
  for (const line of await gallery.locator(".belief-gujarati").all()) {
    await expect(line).toHaveAttribute("lang", "gu");
    const font = await line.evaluate((element) => {
      const style = getComputedStyle(element);
      const family = style.fontFamily.split(",")[0].trim().replaceAll('"', "");
      return { size: parseFloat(style.fontSize), loaded: [...document.fonts].some((face) => face.family.replaceAll('"', "") === family && face.status === "loaded"), glyphs: document.fonts.check(`${style.fontSize} "${family}"`, element.textContent ?? "") };
    });
    expect(font.size).toBeGreaterThanOrEqual(18);
    expect(font.loaded).toBe(true);
    expect(font.glyphs).toBe(true);
  }
  await assertReadableCards(page);
});

for (const [width, columns] of [[1440, 3], [1280, 3], [1024, 2], [834, 2], [768, 2], [390, 1], [320, 1]]) {
  test(`belief niches form ${columns} columns at ${width}px with no clipped text`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await enter(page);
    const grid = page.locator(".belief-grid");
    expect(await grid.evaluate((element) => getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/).length)).toBe(columns);
    expect(await page.locator(".manyata-scroll").evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    const rows = await grid.locator(".belief-reveal").evaluateAll((elements) => elements.map((element) => Math.round(element.getBoundingClientRect().top)));
    expect(new Set(rows).size).toBe(6 / columns);
    await assertReadableCards(page);
  });
}

test("all six cards accommodate 200 percent text size without truncation", async ({ page }) => {
  await page.setViewportSize({ width: 720, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await enter(page);
  await page.locator(".belief-copy h2, .belief-copy p").evaluateAll((elements) => {
    for (const element of elements) (element as HTMLElement).style.fontSize = `${parseFloat(getComputedStyle(element).fontSize) * 2}px`;
  });
  await assertReadableCards(page);
  expect(await page.locator(".manyata-scroll").evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
});

test("the four original motifs are described as metaphors and authentic images retain their sources", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const gallery = await enter(page);
  await expect(gallery.locator(".belief-visual [role='img']")).toHaveCount(4);
  for (const motif of await gallery.locator(".belief-visual [role='img']").all()) await expect(motif).toHaveAccessibleName(/abstract metaphor/i);
  for (const id of ["avatar", "murti"] as const) {
    const image = gallery.locator(`[data-belief='${id}'] img`);
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate((element) => (element as HTMLImageElement).complete && (element as HTMLImageElement).naturalWidth > 0)).toBe(true);
    await expect(image).toHaveAttribute("alt", beliefImages[id].alt);
    await expect(image).toHaveCSS("object-fit", "contain");
    const dimensions = await image.evaluate((element) => { const box = element.getBoundingClientRect(); return { width: box.width, height: box.height }; });
    expect(dimensions.width).toBeGreaterThan(50);
    expect(dimensions.height).toBeGreaterThan(50);
    expect(beliefImages[id].sourcePageUrl).toMatch(/^https:\/\/www\.baps\.org\//);
  }
  await page.goto("/references#manyata-visual-credits");
  const credits = page.locator("#manyata-visual-credits");
  await expect(credits).toBeVisible();
  for (const id of ["avatar", "murti"] as const) await expect(credits.locator(`a[href='${beliefImages[id].sourcePageUrl}']`)).toHaveCount(1);
});

test("keyboard order, visible focus and subtle hover preserve all card content", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await enter(page);
  const first = page.locator("[data-belief='aatma']");
  await first.scrollIntoViewIfNeeded();
  await page.waitForTimeout(850);
  const initial = await first.boundingBox();
  await first.hover();
  await expect.poll(async () => (await first.boundingBox())!.y).toBeLessThan(initial!.y);
  const hovered = await first.boundingBox();
  expect(initial!.y - hovered!.y).toBeLessThanOrEqual(8);
  await page.mouse.move(10, 100);
  await first.focus();
  const ids = beliefs.map((belief) => belief.id);
  for (const id of ids) {
    const card = page.locator(`[data-belief='${id}']`);
    await expect(card).toBeFocused();
    const outline = await card.evaluate((element) => ({ width: parseFloat(getComputedStyle(element).outlineWidth), style: getComputedStyle(element).outlineStyle }));
    expect(outline.width).toBeGreaterThanOrEqual(2);
    expect(outline.style).not.toBe("none");
    await expect(card.locator(".belief-copy h2")).toBeVisible();
    await expect(card.locator(".belief-english")).toBeVisible();
    await expect(card.locator(".belief-gujarati")).toBeVisible();
    await page.keyboard.press("Tab");
  }
});

test("reduced motion leaves the full collection immediately readable without reveal animations", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const gallery = await enter(page);
  await page.getByRole("button", { name: "Explore the six beliefs", exact: true }).click();
  await page.locator("[data-belief='moksha']").scrollIntoViewIfNeeded();
  expect(await gallery.evaluate((element) => element.getAnimations({ subtree: true }).length)).toBe(0);
  await assertReadableCards(page);
});

test("legacy belief links and exhibition navigation retain useful focus and browser history", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await enter(page);
  for (const [story, id] of [[1, "aatma"], [2, "punarjanma"], [3, "aatma"]] as const) {
    await page.evaluate((number) => { location.hash = `section-hindu-manyata/story-${number}`; }, story);
    await expect(page.locator(`[data-belief='${id}']`)).toBeFocused();
    await expect(page.locator(`[data-belief='${id}']`)).toBeInViewport({ ratio: 1 });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => { location.hash = "section-hindu-manyata/belief-avatar"; });
  await expect(page.locator("[data-belief='avatar']")).toBeFocused();
  await expect(page.locator("[data-belief='avatar']")).toBeInViewport({ ratio: 1 });
  await page.locator(".manyata-end").scrollIntoViewIfNeeded();
  await expect(page).toHaveURL(/#section-hindu-manyata\/closing$/);
  await page.getByRole("link", { name: "Next Exhibition", exact: true }).click();
  await expect(page.locator(".festival-gallery")).toHaveAttribute("data-arrived", "true");
  await page.goBack();
  await expect(page.locator(".manyata-gallery")).toHaveAttribute("data-arrived", "true");
  await expect(page.locator(".manyata-next")).toBeFocused();
  await page.getByRole("link", { name: "Back to Campus", exact: true }).click();
  await expect(page).toHaveURL(/#map$/);
  await expect(page.locator(".manyata-gallery")).toHaveCount(0);
  await expect(page.locator(".map-pin:focus, #section-selector:focus")).toHaveCount(1);
});

for (const width of [1440, 390]) {
  test(`bilingual belief exhibits pass automatic accessibility checks at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await enter(page);
    await page.getByRole("button", { name: "Explore the six beliefs", exact: true }).click();
    expect((await new AxeBuilder({ page }).include(".manyata-gallery").withTags(tags).analyze()).violations).toEqual([]);
    expect(errors).toEqual([]);
  });
}
