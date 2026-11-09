import { expect, test } from "@playwright/test";
import { createCrowdQuality, makeCampusCrowd } from "../lib/campus-crowd";

test("crowd detail drops before density and recovery needs sustained headroom", () => {
  const quality = createCrowdQuality(true);
  for (let i = 0; i < 110; i++) quality.observe(42);
  expect(quality.level).toBe(1);
  expect(quality.budget).toBe(16);
  for (let i = 0; i < 70; i++) quality.observe(42);
  expect(quality.level).toBe(2);
  expect(quality.budget).toBe(10);
  for (let i = 0; i < 30; i++) quality.observe(4);
  expect(quality.level).toBe(2);
  for (let i = 0; i < 280; i++) quality.observe(4);
  expect(quality.level).toBe(1);
  expect(quality.budget).toBe(16);
});

test("the walking camera cannot sweep through a stationary visitor", () => {
  const crowd = makeCampusCrowd({ mobile: true });
  try {
    const person = crowd.snapshot().visitors.find(visitor => visitor.active)!;
    const [x, y, z] = person.position;
    expect(crowd.canTraverse({ x: x - 1, y, z }, { x: x + 1, y, z })).toBe(false);
    expect(crowd.canTraverse({ x: x - 0.3, y, z }, { x: x + 1, y, z })).toBe(false);
    expect(crowd.canTraverse({ x: x - 0.1, y, z }, { x: x + 1, y, z })).toBe(false);
    // At least one retreat direction is available; a companion can occupy
    // another direction, so the camera must still respect that second body.
    expect(Array.from({ length: 12 }, (_, i) => crowd.canTraverse({ x, y, z },
      { x: x + Math.cos(i * Math.PI / 6) * 0.5, y, z: z + Math.sin(i * Math.PI / 6) * 0.5 })).some(Boolean)).toBe(true);
  } finally { crowd.dispose(); }
});

type Snapshot = ReturnType<ReturnType<typeof makeCampusCrowd>["snapshot"]>;

for (const mobile of [false, true]) {
  test(`${mobile ? "mobile" : "desktop"} visitors render, move, and respect the scene pause`, async ({ page }) => {
    test.setTimeout(60_000);
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    const canvas = page.locator(".campus-webgl canvas");
    await expect(canvas).toHaveAttribute("data-camera-phase", "overview");
    await expect(canvas).toHaveAttribute("data-crowd", /visitors/);
    const snapshot = async (): Promise<Snapshot> => JSON.parse((await canvas.getAttribute("data-crowd"))!);
    const initial = await snapshot();
    expect(initial.visitors).toHaveLength(mobile ? 16 : 28);
    expect(new Set(initial.visitors.map(visitor => visitor.signature)).size).toBe(initial.visitors.length);
    expect(new Set(initial.visitors.map(visitor => visitor.outfit)).size).toBeGreaterThanOrEqual(7);
    expect(initial.visible).toBeGreaterThan(0);
    expect(initial.visitors.every(visitor => visitor.heightMeters >= 1.05 && visitor.heightMeters <= 1.95)).toBe(true);
    await expect.poll(async () => (await snapshot()).visitors.reduce((sum, visitor) => sum + visitor.distance, 0))
      .toBeGreaterThan(initial.visitors.reduce((sum, visitor) => sum + visitor.distance, 0) + 0.15);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(canvas).toHaveAttribute("data-motion", "still");
    await expect.poll(async () => (await snapshot()).paused).toBe(true);
    const stopped = await snapshot();
    await page.waitForTimeout(400);
    expect((await snapshot()).visitors.map(visitor => visitor.position)).toEqual(stopped.visitors.map(visitor => visitor.position));
    expect(errors).toEqual([]);
    await page.screenshot({ path: `docs/design/campus-visitors-${mobile ? "mobile" : "desktop"}.png`, fullPage: false });
  });
}
