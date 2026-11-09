import { expect, test, type Locator } from "@playwright/test";

async function walkPose(canvas: Locator) {
  return {
    position: await canvas.getAttribute("data-walk-position"),
    yaw: await canvas.getAttribute("data-walk-yaw"),
    pitch: await canvas.getAttribute("data-walk-pitch"),
  };
}

test("gallery visits preserve the outdoor position and look direction across exhibitions", async ({ page }) => {
  test.setTimeout(60_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const canvas = page.locator(".campus-webgl canvas");
  await expect(canvas).toHaveAttribute("data-camera-phase", "overview");
  await page.getByRole("button", { name: "Walk Around", exact: true }).click();
  await expect(canvas).toHaveAttribute("data-walk-suspended", "false");

  // A position away from a doorway, with a non-default view, exposes accidental
  // resets to the entered dome's landing or to the latest exhibition's door.
  await page.locator(".campus-webgl").focus();
  await page.keyboard.press("w");
  await page.keyboard.press("e");
  await page.keyboard.press("r");
  const outside = await walkPose(canvas);
  expect(Number(outside.yaw)).toBeGreaterThan(0);
  expect(Number(outside.pitch)).toBeGreaterThan(0);

  await page.getByRole("combobox", { name: "Open a section directly", exact: true }).selectOption("1");
  await expect(canvas).toHaveAttribute("data-walk-suspended", "true");
  await expect(page.getByRole("link", { name: "Back to Campus", exact: true })).toBeVisible();
  expect(await walkPose(canvas)).toEqual(outside);
  await page.keyboard.press("w");
  await page.keyboard.press("e");
  expect(await walkPose(canvas)).toEqual(outside);

  // The same route transition is used by Next Exhibition. Keep the outdoor
  // snapshot from before the first visit when the active section changes.
  await page.evaluate(() => { window.location.hash = "#section-hindu-riti-parampara"; });
  await expect(page).toHaveURL(/#section-hindu-riti-parampara/);
  await expect(canvas).toHaveAttribute("data-walk-suspended", "true");
  await expect(page.getByRole("link", { name: "Back to Campus", exact: true })).toBeVisible();
  expect(await walkPose(canvas)).toEqual(outside);

  await page.getByRole("link", { name: "Back to Campus", exact: true }).click();
  await expect(canvas).toHaveAttribute("data-camera-phase", "walking");
  await expect(canvas).toHaveAttribute("data-walk-suspended", "false");
  await expect.poll(() => walkPose(canvas)).toEqual(outside);
  await expect(canvas).toHaveAttribute("data-walk-near-dome", "");
});
