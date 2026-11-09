import { expect, test, type Locator, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { sectionTitles } from "./exhibition-fixtures";

type ObservedAudioWindow = Window & { __gardenContexts: AudioContext[] };
const browserErrors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  browserErrors.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
});

test.afterEach(async ({ page }) => {
  expect(
    browserErrors.get(page) ?? [],
    "No JavaScript, WebGL or shader errors",
  ).toEqual([]);
});

async function observeAudio(page: Page) {
  await page.addInitScript(() => {
    const Original = window.AudioContext;
    const contexts: AudioContext[] = [];
    (window as unknown as ObservedAudioWindow).__gardenContexts = contexts;
    class Observed extends Original {
      constructor(options?: AudioContextOptions) {
        super(options);
        contexts.push(this);
      }
    }
    Object.defineProperty(window, "AudioContext", {
      configurable: true,
      value: Observed,
    });
  });
}

async function audioStates(page: Page) {
  return page.evaluate(() =>
    (window as unknown as ObservedAudioWindow).__gardenContexts.map(
      (context) => context.state,
    ),
  );
}

async function setHidden(page: Page, hidden: boolean) {
  // This supplies a deterministic visibility event, not an OS background-tab claim.
  await page.evaluate((value) => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => value,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  }, hidden);
}

async function numberAttribute(element: Locator, name: string) {
  return Number(await element.getAttribute(name));
}

async function ready(page: Page) {
  const canvas = page.locator(".campus-webgl canvas");
  await expect(canvas).toHaveAttribute("data-camera-phase", "overview");
  return canvas;
}

async function stopped(canvas: Locator) {
  await expect(canvas).toHaveAttribute("data-motion", "still");
  await canvas.page().waitForTimeout(160);
  const frames = await numberAttribute(canvas, "data-render-count");
  const time = await canvas.getAttribute("data-environment-time");
  await canvas.page().waitForTimeout(320);
  expect(await numberAttribute(canvas, "data-render-count")).toBe(frames);
  await expect(canvas).toHaveAttribute("data-environment-time", time!);
}

test("desktop and mobile gardens move around a stationary camera with reduced mobile particles", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const counts: { leaves: number; jets: number; splashes: number }[] = [];
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/#map");
    // A hash navigation can retain the previous document. Mount the mobile
    // renderer at its real viewport so its construction-time budget is tested.
    if (width === 390) await page.reload();
    const canvas = await ready(page);
    await expect(canvas).toHaveAttribute("data-motion", "ambient");
    const pose = await canvas.getAttribute("data-camera-position");
    const target = await canvas.getAttribute("data-camera-target");
    const start = await numberAttribute(canvas, "data-environment-time");
    const frames = await numberAttribute(canvas, "data-render-count");
    await expect
      .poll(() => numberAttribute(canvas, "data-environment-time"))
      .toBeGreaterThan(start + 0.3);
    expect(await numberAttribute(canvas, "data-render-count")).toBeGreaterThan(
      frames + 2,
    );
    await expect(canvas).toHaveAttribute("data-camera-position", pose!);
    await expect(canvas).toHaveAttribute("data-camera-target", target!);
    counts.push({
      leaves: await numberAttribute(canvas, "data-drifting-leaves"),
      jets: await numberAttribute(canvas, "data-jet-droplets"),
      splashes: await numberAttribute(canvas, "data-splash-droplets"),
    });
    await expect(page.locator(".map-labels a")).toHaveCount(6);
    if (width === 1440) {
      for (let id = 1; id <= 6; id++) await expect(page.locator(`#destination-${id}`)).toBeVisible();
    } else {
      const selector = page.getByRole("combobox", { name: "Choose an exhibition section", exact: true });
      await expect(selector).toBeInViewport({ ratio: 1 });
      for (const title of sectionTitles) await expect(selector.locator("option").filter({ hasText: title })).toHaveCount(1);
    }
  }
  for (const key of ["leaves", "jets", "splashes"] as const) {
    expect(counts[1][key], `Mobile ${key} must remain present`).toBeGreaterThan(
      0,
    );
    expect(counts[1][key], `Mobile must reduce ${key}`).toBeLessThan(
      counts[0][key],
    );
  }
  expect(errors).toEqual([]);
});

test("garden pause and hidden state stop outdoor frames without moving the camera", async ({
  page,
}) => {
  await page.goto("/#map");
  const canvas = await ready(page);
  const position = await canvas.getAttribute("data-camera-position");
  await page
    .getByRole("button", { name: "Pause garden motion", exact: true })
    .click();
  await stopped(canvas);
  await page
    .getByRole("button", { name: "Resume garden motion", exact: true })
    .click();
  await expect(canvas).toHaveAttribute("data-motion", "ambient");
  const resumed = await numberAttribute(canvas, "data-render-count");
  await expect
    .poll(() => numberAttribute(canvas, "data-render-count"))
    .toBeGreaterThan(resumed + 2);
  await setHidden(page, true);
  await stopped(canvas);
  await setHidden(page, false);
  await expect(canvas).toHaveAttribute("data-motion", "ambient");
  await expect(canvas).toHaveAttribute("data-camera-position", position!);
});

test("ambience requires a gesture and supports keyboard volume, mute and hidden-tab suspension", async ({
  page,
}) => {
  await observeAudio(page);
  await page.goto("/#map");
  await ready(page);
  const ambience = page.getByRole("group", {
    name: "Garden ambience",
    exact: true,
  });
  expect(await audioStates(page)).toEqual([]);
  const enable = ambience.getByRole("button", {
    name: "Enable Ambience",
    exact: true,
  });
  await enable.focus();
  await page.keyboard.press("Enter");
  await expect.poll(() => audioStates(page)).toEqual(["running"]);
  const volume = ambience.getByRole("slider", {
    name: "Ambience volume",
    exact: true,
  });
  await volume.focus();
  await page.keyboard.press("Home");
  await expect(volume).toHaveValue("0");
  await page.keyboard.press("End");
  await expect(volume).toHaveValue("100");
  await page.keyboard.press("ArrowLeft");
  await expect(volume).toHaveValue("99");
  await ambience
    .getByRole("button", { name: "Mute ambience", exact: true })
    .click();
  await expect.poll(() => audioStates(page)).toEqual(["suspended"]);
  await ambience
    .getByRole("button", { name: "Unmute ambience", exact: true })
    .click();
  await expect.poll(() => audioStates(page)).toEqual(["running"]);
  await setHidden(page, true);
  await expect.poll(() => audioStates(page)).toEqual(["suspended"]);
  const updates = await ambience.getAttribute("data-audio-updates");
  await page.waitForTimeout(300);
  await expect(ambience).toHaveAttribute("data-audio-updates", updates!);
  await setHidden(page, false);
  await expect.poll(() => audioStates(page)).toEqual(["running"]);
  expect(await volume.inputValue()).toBe("99");
});

test("approaching the garden changes spatial water sound and entering a pavilion fades it out", async ({
  page,
}) => {
  await observeAudio(page);
  await page.goto("/#map");
  const canvas = await ready(page);
  const ambience = page.getByRole("group", {
    name: "Garden ambience",
    exact: true,
    includeHidden: true,
  });
  await ambience
    .getByRole("button", { name: "Enable Ambience", exact: true })
    .click();
  await expect.poll(() => audioStates(page)).toEqual(["running"]);
  await expect
    .poll(() => numberAttribute(ambience, "data-outdoor-gain"))
    .toBeGreaterThan(0.1);
  const distant = await numberAttribute(ambience, "data-water-presence");
  await page.locator("#destination-1").click();
  const samples: { presence: number; pan: number }[] = [];
  const world = page.getByRole("region", {
    name: `${sectionTitles[0]} immersive experience`,
    exact: true,
  });
  await expect
    .poll(
      async () => {
        samples.push({
          presence: await numberAttribute(canvas, "data-water-presence"),
          pan: await numberAttribute(canvas, "data-water-pan"),
        });
        return world.getAttribute("data-arrived");
      },
      { intervals: [40] },
    )
    .toBe("true");
  expect(Math.max(...samples.map((sample) => sample.presence))).toBeGreaterThan(
    distant + 0.02,
  );
  expect(
    Math.max(...samples.map((sample) => Math.abs(sample.pan))),
  ).toBeGreaterThan(0.02);
  await expect.poll(() => audioStates(page)).toEqual(["suspended"]);
  // The quiet hero dock unmounts in a section; the actual audio context must
  // still finish fading and suspend, then resume when its controls return.
  await expect(ambience).toHaveCount(0);
  await stopped(canvas);
  await world.getByRole("link", { name: "Back to map", exact: true }).click();
  await expect(canvas).toHaveAttribute("data-camera-phase", "overview");
  await expect.poll(() => audioStates(page)).toEqual(["running"]);
  await expect
    .poll(() => numberAttribute(ambience, "data-outdoor-gain"))
    .toBeGreaterThan(0.1);
});

test("reduced motion and lightweight rendering remain independent of garden sound", async ({
  page,
}) => {
  await observeAudio(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#map");
  const canvas = await ready(page);
  await stopped(canvas);
  const ambience = page.getByRole("group", {
    name: "Garden ambience",
    exact: true,
  });
  await ambience
    .getByRole("button", { name: "Enable Ambience", exact: true })
    .click();
  await expect.poll(() => audioStates(page)).toEqual(["running"]);
  const updates = await numberAttribute(ambience, "data-audio-updates");
  await expect
    .poll(() => numberAttribute(ambience, "data-audio-updates"))
    .toBeGreaterThan(updates + 2);
  await stopped(canvas);
  await page
    .getByRole("button", { name: "Use lightweight map", exact: true })
    .click();
  await expect(page.locator(".campus-webgl canvas")).toHaveCount(0);
  await expect.poll(() => audioStates(page)).toEqual(["running"]);
  const fallbackUpdates = await numberAttribute(ambience, "data-audio-updates");
  await expect
    .poll(() => numberAttribute(ambience, "data-audio-updates"))
    .toBeGreaterThan(fallbackUpdates + 2);
  await ambience
    .getByRole("button", { name: "Mute ambience", exact: true })
    .click();
  await expect.poll(() => audioStates(page)).toEqual(["suspended"]);
});

test("ambience controls remain accessible and in bounds on narrow mobile screens", async ({
  page,
}) => {
  await observeAudio(page);
  await page.setViewportSize({ width: 320, height: 568 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#map");
  await ready(page);
  const ambience = page.getByRole("group", {
    name: "Garden ambience",
    exact: true,
  });
  await expect(ambience).toBeVisible();
  expect(await audioStates(page)).toEqual([]);
  await ambience
    .getByRole("button", { name: "Enable Ambience", exact: true })
    .click();
  await expect.poll(() => audioStates(page)).toEqual(["running"]);
  await expect(
    ambience.getByRole("button", { name: "Mute ambience", exact: true }),
  ).toBeVisible();
  for (const element of await ambience.locator("button, input").all()) {
    const box = await element.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(320);
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  const results = await new AxeBuilder({ page })
    .include(".campus-environment-bar")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(results.violations).toEqual([]);
  await ambience
    .getByRole("button", { name: "Mute ambience", exact: true })
    .click();
  await expect.poll(() => audioStates(page)).toEqual(["suspended"]);
});
