import { expect, test, type Locator } from "@playwright/test";

async function expectResolution(canvas: Locator, ratio: number) {
  await expect.poll(() => canvas.evaluate((element, expectedRatio) => {
    const image = element as HTMLCanvasElement;
    return image.width === Math.floor(image.clientWidth * expectedRatio)
      && image.height === Math.floor(image.clientHeight * expectedRatio);
  }, ratio)).toBe(true);
}

test.describe("high-density mobile campus", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
  });

  test("retains a sharp drawing buffer through rotation, map view and animation", async ({ page }) => {
    test.setTimeout(60_000);
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto("/");
    const canvas = page.locator(".campus-webgl canvas");
    await expect(canvas).toHaveAttribute("data-camera-phase", "overview");
    await expectResolution(canvas, 2);

    await page.getByRole("button", { name: "Campus Map", exact: true }).click();
    await expect(canvas).toHaveAttribute("data-campus-view", "map");
    await expectResolution(canvas, 2);
    await page.setViewportSize({ width: 844, height: 390 });
    await expectResolution(canvas, 2);
    // A fresh landscape load must also retain phone quality above 768 CSS pixels.
    await page.reload();
    await expect(canvas).toHaveAttribute("data-camera-phase", "overview");
    await expectResolution(canvas, 2);
    await page.setViewportSize({ width: 390, height: 844 });
    await expectResolution(canvas, 2);

    await page.emulateMedia({ reducedMotion: "no-preference" });
    await expect(canvas).toHaveAttribute("data-motion", "ambient");
    const rendered = Number(await canvas.getAttribute("data-render-count"));
    await expect.poll(async () => Number(await canvas.getAttribute("data-render-count"))).toBeGreaterThan(rendered + 2);
    await expectResolution(canvas, 2);
    expect(errors).toEqual([]);
  });
});

test.describe("standard-density mobile campus", () => {
  test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, reducedMotion: "reduce" });

  test("uses the screen's native resolution without unnecessary oversampling", async ({ page }) => {
    await page.goto("/");
    const canvas = page.locator(".campus-webgl canvas");
    await expect(canvas).toHaveAttribute("data-camera-phase", "overview");
    await expectResolution(canvas, 1);
  });
});
