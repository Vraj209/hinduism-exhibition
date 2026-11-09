import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("all six galleries suspend walking and restore the outdoor view after reading", async ({ page }) => {
  test.setTimeout(60_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "Walk Around", exact: true }).click();
  const canvas = page.locator(".campus-webgl canvas");
  await expect(canvas).toHaveAttribute("data-camera-phase", "walking");
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  for (let id = 1; id <= 6; id++) {
    const position = await canvas.getAttribute("data-walk-position");
    const yaw = await canvas.getAttribute("data-walk-yaw");
    await page.getByRole("combobox", { name: "Open a section directly", exact: true }).selectOption(String(id));
    await expect(page.locator(".dome-gallery")).toHaveAttribute("data-arrived", "true");
    await expect(canvas).toHaveAttribute("data-walk-suspended", "true");
    await expect(page.locator(".dome-gallery canvas")).toHaveCount(0);
    await page.getByRole("button", { name: "Scroll to Discover", exact: true }).click();
    await expect(page.locator('[data-moment="1"]')).toHaveAttribute("data-active", "true");
    await page.keyboard.press("w");
    await page.keyboard.press("e");
    await expect(canvas).toHaveAttribute("data-walk-position", position!);
    await expect(canvas).toHaveAttribute("data-walk-yaw", yaw!);
    await page.getByRole("link", { name: "Back to Campus", exact: true }).click();
    await expect(canvas).toHaveAttribute("data-camera-phase", "walking");
    await expect(canvas).toHaveAttribute("data-walk-suspended", "false");
    await expect(canvas).toHaveAttribute("data-walk-position", position!);
    await expect(page.locator(".campus-webgl")).toBeFocused();
  }
  expect(errors).toEqual([]);
});

test("mobile walking controls and gallery navigation pass accessibility checks", async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page.getByRole("button", { name: "Walk Around", exact: true }).click();
  await page.getByRole("combobox", { name: "Choose an exhibition section", exact: true }).selectOption("3");
  await expect(page.getByRole("button", { name: "Stop", exact: true })).toBeVisible();
  const tags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
  const campus = await new AxeBuilder({ page }).include(".campus-hero").withTags(tags).analyze();
  expect(campus.violations).toEqual([]);
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  await page.getByRole("combobox", { name: "Open a section directly", exact: true }).selectOption("4");
  await expect(page.locator(".dome-gallery")).toHaveAttribute("data-arrived", "true");
  await expect(page.locator(".campus-webgl canvas")).toHaveAttribute("data-walk-suspended", "true");
  await page.getByRole("button", { name: "Scroll to Discover", exact: true }).click();
  await expect(page.locator('[data-moment="1"]')).toHaveAttribute("data-active", "true");
  const interior = await new AxeBuilder({ page }).include(".dome-gallery").withTags(tags).analyze();
  expect(interior.violations).toEqual([]);
});
