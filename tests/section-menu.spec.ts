import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { sectionSlugs } from "./exhibition-fixtures";

async function campus(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    const native = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      if (/webgl/.test(type)) return null;
      return native.apply(this, [type, ...args] as Parameters<typeof native>);
    } as typeof native;
  });
  await page.goto("/");
  return page.getByRole("combobox", { name: "Choose an exhibition section", exact: true });
}

test("custom destination menu supports keyboard exploration without navigating until confirmed", async ({ page }) => {
  const trigger = await campus(page);
  const options = page.getByRole("option");
  await trigger.focus();
  await trigger.press("ArrowDown");
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(trigger).toBeFocused();
  await expect(options).toHaveCount(6);
  await expect(trigger).toHaveAttribute("aria-activedescendant", "section-selector-option-0");
  await trigger.press("End");
  await expect(options.nth(5)).toHaveAttribute("aria-selected", "true");
  await trigger.press("Home");
  await trigger.press("ArrowDown");
  await expect(options.nth(1)).toHaveAttribute("aria-selected", "true");
  await expect(page).not.toHaveURL(/#section-/);
  await trigger.press("Escape");
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.press("f");
  await expect(options.nth(3)).toHaveAttribute("aria-selected", "true");
  await trigger.press("Tab");
  await expect(trigger).not.toBeFocused();
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await expect(page).not.toHaveURL(/#section-/);
  await trigger.click();
  await page.getByRole("heading", { name: "Hinduism", exact: true }).click({ force: true });
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.focus();
  await trigger.press("6");
  await trigger.press("Enter");
  await expect(page).toHaveURL(/#section-hindu-sanskruti-adhar-stambh$/);
  await expect(page.locator(".dome-gallery")).toHaveAttribute("data-arrived", "true");
});

test("custom destination choices open all six galleries and expose visited state on return", async ({ page }) => {
  const trigger = await campus(page);
  await expect(page.locator("select")).toHaveCount(0);
  for (const [index, slug] of sectionSlugs.entries()) {
    await trigger.click();
    await page.locator(`[role="option"][data-section-id="${index + 1}"]`).click();
    await expect(page).toHaveURL(new RegExp(`#section-${slug}$`));
    await expect(page.locator(".dome-gallery")).toHaveAttribute("data-arrived", "true");
    await page.getByRole("link", { name: "Back to Campus", exact: true }).click();
    await expect(page.locator(".gallery-container")).toHaveCount(0);
  }
  await trigger.click();
  await expect(page.getByRole("option").filter({ hasText: "Visited" })).toHaveCount(6);
});

test("scrolling away dismisses the custom menu without changing the destination", async ({ page }) => {
  const trigger = await campus(page);
  await trigger.click();
  await expect(page.getByRole("listbox")).toBeVisible();
  await page.evaluate(() => window.scrollTo({ top: 1100, behavior: "instant" }));
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await expect(page).not.toHaveURL(/#section-/);
});

for (const [width, height] of [[1440, 900], [1024, 768], [768, 1024], [390, 844], [320, 568], [844, 390]]) {
  test(`custom destination popup fits and scrolls at ${width} by ${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const trigger = await campus(page);
    await trigger.click();
    const panel = page.locator('[data-section-menu="true"]');
    const box = (await panel.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(11);
    expect(box.y).toBeGreaterThanOrEqual(11);
    expect(box.x + box.width).toBeLessThanOrEqual(width - 11);
    expect(box.y + box.height).toBeLessThanOrEqual(height - 11);
    await trigger.press("End");
    await expect(page.getByRole("option").last()).toBeInViewport({ ratio: 1 });
    await trigger.press("Home");
    await expect(page.getByRole("option").first()).toBeInViewport({ ratio: 1 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    if ([1440, 390, 320, 844].includes(width)) {
      await page.screenshot({ path: `docs/design/custom-section-menu/${width}-open.png` });
    }
    if ([1440, 390].includes(width)) {
      const accessibility = await new AxeBuilder({ page }).include('[data-section-menu="true"]').include("#section-selector").withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
      expect(accessibility.violations).toEqual([]);
    }
    if (width === 1440) {
      await trigger.press("End");
      await page.setViewportSize({ width: 320, height: 568 });
      await expect.poll(async () => (await panel.boundingBox())!.width).toBeLessThanOrEqual(296);
      await expect(page.getByRole("option").last()).toBeInViewport({ ratio: 1 });
      await page.getByRole("option").last().click();
      await expect(page).toHaveURL(/#section-hindu-sanskruti-adhar-stambh$/);
    }
  });
}

test.describe("touch destination controls", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  test("walking menus switch cleanly and support touch entry without moving on keyboard exploration", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const canvas = page.locator(".campus-webgl canvas");
    await expect(canvas).toHaveAttribute("data-camera-phase", "overview");
    const chooser = page.getByRole("combobox", { name: "Choose an exhibition section", exact: true });
    await chooser.tap();
    await page.screenshot({ path: "docs/design/custom-section-menu/390-campus-open.png" });
    await chooser.press("Escape");
    await page.getByRole("button", { name: "Walk Around", exact: true }).tap();
    await expect(canvas).toHaveAttribute("data-walking", "true");
    const position = await canvas.getAttribute("data-walk-position");
    await chooser.tap();
    await chooser.press("End");
    await chooser.press("w");
    expect(await canvas.getAttribute("data-walk-position")).toBe(position);
    await page.getByRole("combobox", { name: "Open a section directly", exact: true }).tap();
    await expect(chooser).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByRole("listbox")).toHaveCount(1);
    await expect(page.getByRole("listbox", { name: "Open a section directly", exact: true })).toBeVisible();
    await page.screenshot({ path: "docs/design/custom-section-menu/390-walking-direct.png" });
    await page.locator('[role="option"][data-section-id="1"]').tap();
    await expect(page.locator(".dome-gallery")).toHaveAttribute("data-arrived", "true");
    await page.getByRole("link", { name: "Back to Campus", exact: true }).tap();
    await expect(canvas).toHaveAttribute("data-walk-position", position!);
  });
});
