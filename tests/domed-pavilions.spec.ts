import { expect, test } from "@playwright/test";
import { sectionTitles } from "./exhibition-fixtures";

test("each pavilion reveals its entrance relief before entering the matching world", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/#map");
  const campus = page.locator(".campus-webgl canvas");
  await expect(campus).toHaveAttribute("data-camera-phase", "overview");
  for (let index = 0; index < sectionTitles.length; index++) {
    await page.locator(`#destination-${index + 1}`).click();
    await expect
      .poll(() => campus.getAttribute("data-camera-phase"), { intervals: [30] })
      .toBe("relief");
    const position = await campus.getAttribute("data-camera-position");
    const target = await campus.getAttribute("data-camera-target");
    await page.waitForTimeout(160);
    await expect(campus).toHaveAttribute("data-camera-phase", "relief");
    await expect(campus).toHaveAttribute("data-camera-position", position!);
    await expect(campus).toHaveAttribute("data-camera-target", target!);
    const world = page.getByRole("region", {
      name: `${sectionTitles[index]} immersive experience`,
      exact: true,
    });
    await expect(world).toHaveAttribute("data-arrived", "true");
    await expect(world.locator(".world-copy h2")).toBeFocused();
    await world.getByRole("link", { name: "Back to map", exact: true }).click();
    await expect(campus).toHaveAttribute("data-camera-phase", "overview");
    await expect(page.locator(`#destination-${index + 1}`)).toBeFocused();
  }
  expect(errors).toEqual([]);
});

test("leaving during the relief reveal cancels entry and restores the selected map label", async ({
  page,
}) => {
  await page.goto("/#map");
  const campus = page.locator(".campus-webgl canvas");
  await expect(campus).toHaveAttribute("data-camera-phase", "overview");
  const position = await campus.getAttribute("data-camera-position");
  const target = await campus.getAttribute("data-camera-target");
  await page.locator("#destination-6").click();
  await expect
    .poll(() => campus.getAttribute("data-camera-phase"), { intervals: [30] })
    .toBe("relief");
  await page.getByRole("link", { name: "Back to map", exact: true }).click();
  await expect(campus).toHaveAttribute("data-camera-phase", "overview");
  await expect(campus).toHaveAttribute("data-camera-position", position!);
  await expect(campus).toHaveAttribute("data-camera-target", target!);
  await expect(page.locator("#destination-6")).toBeFocused();
  // Wait beyond the canceled entry's original completion and interior-settle
  // deadline, so a stale arrival cannot reopen the world after map restoration.
  await page.waitForTimeout(1000);
  await expect(page).toHaveURL(/#map$/);
  await expect(page.locator(".world-shell")).toHaveCount(0);
});
