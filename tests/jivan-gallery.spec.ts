import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";
import { culturalStates } from "../content/jivan-shaili";
import { chooseRegion } from "./region-menu-helpers";

// Independent inventory from the supplied Bhusha poster, not the application data.
const states = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
];
const territories = [
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi",
  "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];
const pending = /pending|await|not yet|not supplied|not available|not included|unavailable/i;
const tags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

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

async function enter(page: Page, suffix = "/story-2") {
  await page.goto(`/#section-hindu-jivan-shaili${suffix}`);
  const gallery = page.locator(".jivan-gallery");
  await expect(gallery).toHaveAttribute("data-arrived", "true");
  await expect(gallery).toHaveAttribute("data-mode", "culture");
  return gallery;
}

const selector = (page: Page) => page.getByRole("combobox", { name: "Select a state or union territory", exact: true });
const search = (page: Page) => page.getByRole("searchbox", { name: "Find a state or union territory", exact: true });

test("all 28 poster states and 8 union territories have unique selectable regions and reachable details", async ({ page }) => {
  test.setTimeout(60_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const gallery = await enter(page);
  await expect(gallery.locator(".gallery-opening h1")).toHaveText("Hindu Jivan Shaili");
  const regions = gallery.locator(".india-map [data-region][role='button']");
  await expect(regions).toHaveCount(36);
  const regionIds = await regions.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-region")));
  expect(new Set(regionIds).size).toBe(36);
  for (const name of [...states, ...territories]) {
    await chooseRegion(page, name);
    await expect(gallery.locator(".culture-panel h3")).toContainText(name);
    await expect(selector(page)).toHaveText(name);
    const selected = await gallery.locator(".culture-panel").getAttribute("data-state");
    await expect(gallery.locator(`.india-map [data-region='${selected}']`)).toHaveAttribute("aria-pressed", "true");
    await expect(gallery.locator(".india-map [data-region][aria-pressed='true']")).toHaveCount(1);
  }
  expect(errors).toEqual([]);
});

test("state changes preserve the map and reader position while keeping verified labels and source gaps explicit", async ({ page }) => {
  const gallery = await enter(page);
  const panel = gallery.locator(".culture-panel");
  await chooseRegion(page, "Gujarat");
  await expect(panel).toContainText("Kediyu, Chorno & Pagdi");
  await expect(panel).toContainText("Chaniya Choli & Odhni");
  await expect(panel.locator('[lang="gu"]').first()).toBeVisible();
  await expect(panel).toContainText(pending);
  const initial = await gallery.locator(".india-map").boundingBox();
  const scrollTop = await gallery.locator(".jivan-scroll").evaluate((node) => node.scrollTop);
  await chooseRegion(page, "Arunachal Pradesh");
  await expect(panel).toContainText(/Adi community/i);
  expect(await gallery.locator(".india-map").boundingBox()).toEqual(initial);
  expect(await gallery.locator(".jivan-scroll").evaluate((node) => node.scrollTop)).toBe(scrollTop);
  await chooseRegion(page, "Lakshadweep");
  await expect(panel).toContainText(/union territory/i);
  await expect(panel).toContainText(pending);
  // Territories without supplied cultural content retain their empty state.
  await expect(panel.locator("img")).toHaveCount(0);
});

test("search, no-results recovery and keyboard selection reach small states without precise map taps", async ({ page }) => {
  const gallery = await enter(page);
  const selected = await gallery.locator(".culture-panel").getAttribute("data-state");
  await search(page).fill("sikk");
  await selector(page).click();
  await expect(page.getByRole("option")).toHaveText(["Sikkim"]);
  await expect(gallery.locator(".culture-panel")).toHaveAttribute("data-state", selected!);
  await page.getByRole("option", { name: "Sikkim", exact: true }).click();
  await expect(gallery.locator(".culture-panel h3")).toContainText("Sikkim");
  await search(page).fill("zzzz-no-state");
  await expect(gallery.getByText(/no (states|results|matches)/i)).toBeVisible();
  await expect(selector(page)).toBeDisabled();
  await search(page).fill("");
  await chooseRegion(page, "Goa");
  await expect(gallery.locator(".culture-panel h3")).toContainText("Goa");
  const rajasthan = gallery.locator(".india-map [data-region='IN-RJ']");
  await rajasthan.hover();
  await expect(gallery.locator(".india-map-name")).toHaveText("Rajasthan");
  await rajasthan.click();
  await expect(gallery.locator(".culture-panel")).toHaveAttribute("data-state", "IN-RJ");
  const gujarat = gallery.locator(".india-map [data-region='IN-GJ']");
  const unfocusedStroke = await gujarat.evaluate((node) => getComputedStyle(node).stroke);
  await rajasthan.focus();
  await page.keyboard.press("Home");
  const gujaratIndex = [...states, ...territories].sort((a, b) => a.localeCompare(b)).indexOf("Gujarat");
  for (let index = 0; index < gujaratIndex; index++) await page.keyboard.press("ArrowRight");
  await expect(gujarat).toBeFocused();
  await expect(gallery.locator(".india-map-name")).toHaveText("Gujarat");
  const focus = await gujarat.evaluate((node) => ({ stroke: getComputedStyle(node).stroke, width: parseFloat(getComputedStyle(node).strokeWidth) }));
  expect(focus.stroke).not.toBe(unfocusedStroke);
  expect(focus.width).toBeGreaterThanOrEqual(3);
  await page.keyboard.press("Enter");
  await expect(gallery.locator(".culture-panel")).toHaveAttribute("data-state", "IN-GJ");
  await expect(gujarat).toBeFocused();
  const goa = gallery.locator(".india-map [data-region='IN-GA']");
  await goa.focus();
  await page.keyboard.press("Space");
  await expect(gallery.locator(".culture-panel")).toHaveAttribute("data-state", "IN-GA");
  await expect(goa).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(gujarat).toBeFocused();
  await expect(gallery.locator(".culture-panel")).toHaveAttribute("data-state", "IN-GA");
  await page.keyboard.press("Enter");
  await expect(gallery.locator(".culture-panel")).toHaveAttribute("data-state", "IN-GJ");
});

test("custom region menu supports keyboard exploration, committed selection and dismissal", async ({ page }) => {
  const gallery = await enter(page);
  const trigger = selector(page);
  const menu = page.getByRole("listbox", { name: "Select a state or union territory", exact: true });
  await expect(gallery.locator("select")).toHaveCount(0);
  await trigger.press("ArrowDown");
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute("aria-activedescendant", "culture-state-select-option-IN-GJ");
  await expect(menu.getByRole("group", { name: "States", exact: true }).getByRole("option")).toHaveCount(28);
  await expect(menu.getByRole("group", { name: "Union territories", exact: true }).getByRole("option")).toHaveCount(8);
  await trigger.press("End");
  await expect(menu.getByRole("option").last()).toBeInViewport({ ratio: 1 });
  await expect(menu.getByRole("option", { selected: true })).toHaveText("Gujarat");
  await expect(gallery.locator(".culture-panel")).toHaveAttribute("data-state", "IN-GJ");
  await trigger.press("Home");
  await expect(menu.getByRole("option").first()).toBeInViewport({ ratio: 1 });
  await trigger.press("Escape");
  await expect(menu).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.press("l");
  await trigger.press("a");
  await trigger.press("d");
  await expect(trigger).toHaveAttribute("aria-activedescendant", "culture-state-select-option-IN-LA");
  await trigger.press("Enter");
  await expect(trigger).toHaveText("Ladakh");
  await expect(gallery.locator(".culture-panel")).toHaveAttribute("data-state", "IN-LA");
  await trigger.click();
  await expect(menu.getByRole("option", { selected: true })).toHaveText("Ladakh");
  await expect(menu.getByRole("option", { name: "Ladakh", exact: true })).toBeInViewport({ ratio: 1 });
  await page.screenshot({ path: "/tmp/custom-region-menu-1440.png" });
  const accessibility = await new AxeBuilder({ page }).include("[data-region-menu]").include("#culture-state-select").withTags(tags).analyze();
  expect(accessibility.violations).toEqual([]);
  await trigger.press("Tab");
  await expect(menu).toHaveCount(0);
  await expect(trigger).not.toBeFocused();
  await trigger.click();
  await search(page).click();
  await expect(menu).toHaveCount(0);
  await trigger.click();
  await gallery.locator(".jivan-scroll").evaluate((node) => { node.scrollTop += 80; });
  await expect(menu).toHaveCount(0);
  await expect(gallery.locator(".culture-panel")).toHaveAttribute("data-state", "IN-LA");
});

test("desktop pairs the map with details and alternates the two authentic BAPS photographs", async ({ page }) => {
  const gallery = await enter(page);
  const map = (await gallery.locator(".india-map").boundingBox())!;
  const panel = (await gallery.locator(".culture-panel").boundingBox())!;
  expect(map.x + map.width).toBeLessThanOrEqual(panel.x + 1);
  for (const [sectionClass, title, imageFirst] of [[".jivan-bhojan", "Bhojan", true], [".jivan-bhajan", "Bhajan", false]] as const) {
    const section = gallery.locator(sectionClass);
    await section.scrollIntoViewIfNeeded();
    const image = section.locator("img");
    await expect.poll(() => image.evaluate((node) => (node as HTMLImageElement).complete && (node as HTMLImageElement).naturalWidth > 0)).toBe(true);
    const imageBox = (await image.boundingBox())!;
    const headingBox = (await section.getByRole("heading", { name: title, exact: true }).boundingBox())!;
    expect(imageFirst ? imageBox.x < headingBox.x : headingBox.x < imageBox.x).toBe(true);
    await expect(image).toHaveAttribute("alt", /\S+/);
    await expect(section.locator("figcaption a")).toHaveAttribute("href", /^https:\/\/([a-z]+\.)?baps\.org\//);
    expect(imageBox.width).toBeGreaterThan(350);
  }
});

for (const width of [320, 390, 768, 1024]) {
  test(`culture journey at ${width}px has no overflow and retains comfortable ordinary scrolling`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    const gallery = await enter(page);
    const scroll = gallery.locator(".jivan-scroll");
    expect(await scroll.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
    const select = selector(page);
    const selectBox = (await select.boundingBox())!;
    expect(selectBox.height).toBeGreaterThanOrEqual(44);
    await select.click();
    const popup = page.locator("[data-region-menu]");
    const popupBox = (await popup.boundingBox())!;
    expect(popupBox.x).toBeGreaterThanOrEqual(11);
    expect(popupBox.y).toBeGreaterThanOrEqual(11);
    expect(popupBox.x + popupBox.width).toBeLessThanOrEqual(width - 11);
    expect(popupBox.y + popupBox.height).toBeLessThanOrEqual(844 - 11);
    expect(await popup.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
    await select.press("End");
    await expect(page.getByRole("option").last()).toBeInViewport({ ratio: 1 });
    await select.press("Home");
    await expect(page.getByRole("option").first()).toBeInViewport({ ratio: 1 });
    if (width === 320 || width === 390) await page.screenshot({ path: `/tmp/custom-region-menu-${width}.png` });
    await select.press("Escape");
    if (width <= 760) {
      const map = (await gallery.locator(".india-map").boundingBox())!;
      const panel = (await gallery.locator(".culture-panel").boundingBox())!;
      expect(map.y + map.height).toBeLessThanOrEqual(panel.y + 1);
      for (const sectionClass of [".jivan-bhojan", ".jivan-bhajan"]) {
        const section = gallery.locator(sectionClass);
        const image = (await section.locator("img").boundingBox())!;
        const heading = (await section.locator("h2").boundingBox())!;
        expect(heading.y).toBeLessThan(image.y);
      }
    }
    await scroll.evaluate((node) => node.scrollTo({ top: node.scrollHeight, behavior: "instant" }));
    await expect(gallery.locator(".jivan-end")).toBeInViewport();
    await expect(gallery.getByRole("link", { name: "Next Exhibition", exact: true })).toBeInViewport();
  });
}

test.describe("touch region menu", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  test("touch selection updates the map and details and preserves the reader position", async ({ page }) => {
    const gallery = await enter(page);
    await search(page).fill("Ladakh");
    const scrollTop = await gallery.locator(".jivan-scroll").evaluate((node) => node.scrollTop);
    await selector(page).tap();
    await page.getByRole("option", { name: "Ladakh", exact: true }).tap();
    await expect(selector(page)).toHaveText("Ladakh");
    await expect(gallery.locator(".culture-panel")).toHaveAttribute("data-state", "IN-LA");
    await expect(gallery.locator('.india-map [data-region="IN-LA"]')).toHaveAttribute("aria-pressed", "true");
    expect(await gallery.locator(".jivan-scroll").evaluate((node) => node.scrollTop)).toBe(scrollTop);
    await expect(page.getByRole("listbox")).toHaveCount(0);
  });
});

test("reduced motion, map controls and the complete bilingual content pass automatic accessibility checks", async ({ page }) => {
  const gallery = await enter(page);
  await page.evaluate(() => document.fonts.ready);
  expect(await gallery.evaluate((node) => node.getAnimations({ subtree: true }).length)).toBe(0);
  const result = await new AxeBuilder({ page }).include(".jivan-gallery").withTags(tags).analyze();
  expect(result.violations.map((issue) => ({ id: issue.id, targets: issue.nodes.map((node) => node.target) }))).toEqual([]);
});

test("every poster state has a distinct full-resolution generated illustration with honest attribution", async () => {
  expect(culturalStates.map((state) => state.name)).toEqual(states);
  const hashes = new Set<string>();
  for (const state of culturalStates) {
    const illustration = state.attire.image;
    expect(illustration, `${state.name}: illustration`).not.toBeNull();
    if (!illustration) continue;
    expect(illustration.kind).toBe("generated-illustration");
    expect(illustration.alt).toMatch(/^Generated illustration/);
    const bytes = await readFile(resolve(process.cwd(), "public", illustration.src.replace(/^\//, "")));
    hashes.add(createHash("sha256").update(bytes).digest("hex"));
    const metadata = await sharp(bytes).metadata();
    expect(metadata.width, `${state.name}: width`).toBeGreaterThanOrEqual(960);
    expect(metadata.height, `${state.name}: height`).toBeGreaterThanOrEqual(1440);
    expect(illustration.width).toBe(metadata.width);
    expect(illustration.height).toBe(metadata.height);
  }
  expect(hashes.size).toBe(28);
});

for (const width of [1440, 390]) {
  test(`generated attire at ${width}px loads without cropping and identifies its source`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const gallery = await enter(page);
    const panel = gallery.locator(".culture-panel");
    const illustration = panel.locator(".culture-attire-image img");
    await illustration.scrollIntoViewIfNeeded();
    await expect.poll(() => illustration.evaluate((node) => (node as HTMLImageElement).complete && (node as HTMLImageElement).naturalWidth > 0)).toBe(true);
    await expect(illustration).toHaveAttribute("alt", /^Generated illustration/);
    await expect(illustration).toHaveCSS("object-fit", "contain");
    await expect(panel.locator(".culture-generated-note")).toContainText(/Generated illustration based on the supplied Bhusha poster/);
    await expect(panel.locator(".culture-generated-note")).toContainText(/not an original photograph/);
    const frame = (await panel.locator(".culture-attire-image").boundingBox())!;
    const image = (await illustration.boundingBox())!;
    expect(image.x).toBeGreaterThanOrEqual(frame.x);
    expect(image.x + image.width).toBeLessThanOrEqual(frame.x + frame.width);
    expect(image.y + image.height).toBeLessThanOrEqual(frame.y + frame.height);
  });

  test(`Jammu and Kashmir and Ladakh languages and attire at ${width}px retain distinct provenance`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const gallery = await enter(page);
    const panel = gallery.locator(".culture-panel");
    for (const { name, id, example, languages } of [
      { name: "Jammu and Kashmir", id: "IN-JK", example: "Kashmiri attire example", languages: ["Kashmiri", "Dogri", "Gojri", "Pahari", "Punjabi", "Urdu", "Hindi"] },
      { name: "Ladakh", id: "IN-LA", example: "Ladakhi ceremonial attire example", languages: ["Ladakhi", "Purgi", "Balti", "Shina"] },
    ]) {
      await chooseRegion(page, name);
      await expect(panel).toHaveAttribute("data-state", id);
      await expect(panel.locator(".culture-state-header .jivan-kicker")).toHaveText("Union territory");
      await expect(panel.locator(".culture-community")).toHaveText(example);
      await expect(panel.locator(".culture-language li")).toHaveText(languages);
      await expect(panel.locator(".culture-language")).toContainText("This list is not exhaustive.");
      const illustration = panel.locator(".culture-attire-image img");
      await illustration.scrollIntoViewIfNeeded();
      await expect(illustration).toHaveAttribute("src", new RegExp(`${id.toLowerCase()}\\.webp`));
      await expect.poll(() => illustration.evaluate((node) => (node as HTMLImageElement).complete && (node as HTMLImageElement).naturalWidth > 0)).toBe(true);
      await expect(illustration).toHaveAttribute("alt", /^Generated illustration/);
      await expect(illustration).toHaveCSS("object-fit", "contain");
      await expect(panel.locator(".culture-generated-note")).toContainText("AI-generated illustration informed by cultural references");
      await expect(panel.locator(".culture-generated-note")).toContainText("not an original photograph or an entry from the supplied Bhusha poster");
      expect(await gallery.locator(".jivan-scroll").evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
    }
  });
}

for (const [suffix, target] of [["/story-1", ".jivan-bhojan"], ["/story-2", ".culture-explorer"], ["/story-3", ".jivan-bhajan"], ["/closing", ".jivan-end"]]) {
  test(`legacy ${suffix} links keep their original subject reachable after refresh`, async ({ page }) => {
    const gallery = await enter(page, suffix);
    await expect(gallery.locator(target)).toBeInViewport();
    await expect(gallery.locator(".gallery-header")).toBeInViewport({ ratio: 1 });
    await page.reload();
    await expect(gallery).toHaveAttribute("data-arrived", "true");
    await expect(gallery.locator(target)).toBeInViewport();
    await expect(gallery.locator(".gallery-header")).toBeInViewport({ ratio: 1 });
  });
}
