import { createHash } from "node:crypto";
import { expect, test, type Page, type Locator } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {
  sectionTitles as titles,
  sectionSlugs as slugs,
  expectedFestivals,
  expectedMomentTitles,
  expectedStorySource,
} from "./exhibition-fixtures";
const festivalStories = expectedFestivals.map((festival) => festival.name);
const festivalIds = expectedFestivals.map((festival) => festival.id);

type AudioWindow = Window & { __testAudioContexts: AudioContext[] };

async function worldReady(page: Page, section = 3, story = 0) {
  const world = page.getByRole("region", {
    name: `${titles[section]} immersive experience`,
    exact: true,
  });
  await expect(world).toHaveAttribute("data-arrived", "true");
  if (section === 3) {
    await expect(world).toHaveAttribute("data-story", festivalIds[story]);
    await expect(world.locator(".world-copy h2")).toHaveText(
      festivalStories[story],
    );
  }
  return world;
}
async function frameCount(canvas: Locator) {
  return Number(await canvas.getAttribute("data-render-count"));
}
async function assertStopped(canvas: Locator) {
  await expect(canvas).toHaveAttribute("data-motion", "still");
  // Let a pending resize frame finish before checking that the ambient loop is idle.
  await canvas.page().waitForTimeout(180);
  const count = await frameCount(canvas);
  await canvas.page().waitForTimeout(300);
  expect(await frameCount(canvas)).toBe(count);
}
async function installAudioObserver(page: Page) {
  await page.addInitScript(() => {
    const NativeAudioContext = window.AudioContext;
    const contexts: AudioContext[] = [];
    (window as unknown as AudioWindow).__testAudioContexts = contexts;
    class ObservedAudioContext extends NativeAudioContext {
      constructor(options?: AudioContextOptions) {
        super(options);
        contexts.push(this);
      }
    }
    Object.defineProperty(window, "AudioContext", {
      configurable: true,
      value: ObservedAudioContext,
    });
  });
}
async function audioStates(page: Page) {
  return page.evaluate(() =>
    (window as unknown as AudioWindow).__testAudioContexts.map(
      (context) => context.state,
    ),
  );
}

async function setHidden(page: Page, hidden: boolean) {
  // Deterministic lifecycle input: this tests the visibility handler, not OS tab scheduling.
  await page.evaluate((value) => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => value,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  }, hidden);
}

test("Festival enters once, keeps Diwali, Annakut and Holi in one stable world, and exposes a sourced summary", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/#map");
  await expect(page.locator(".campus-webgl canvas")).toHaveAttribute(
    "data-camera-phase",
    "overview",
  );
  await page.locator("#destination-4").click();
  const world = await worldReady(page);
  const canvas = world.locator("canvas");
  const handle = await canvas.elementHandle();
  const firstPosition = await page
    .locator(".campus-webgl canvas")
    .getAttribute("data-camera-position");
  await expect(
    world.getByRole("button", { name: "Previous story", exact: true }),
  ).toBeDisabled();
  for (let story = 1; story < 3; story++) {
    await world
      .getByRole("button", { name: "Next story", exact: true })
      .click();
    await worldReady(page, 3, story);
    expect(
      await canvas.evaluate(
        (element, original) => element === original,
        handle,
      ),
    ).toBe(true);
    await expect(canvas).toHaveAttribute("data-story-index", String(story));
    await expect(page.locator(".campus-webgl canvas")).toHaveAttribute(
      "data-camera-position",
      firstPosition!,
    );
  }
  await expect(
    world.getByRole("button", { name: "Next story", exact: true }),
  ).toBeVisible();
  await world
    .getByRole("button", { name: "Read summary", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Holi", exact: true });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByText(
      "Holi welcomes spring with colour and celebrates the victory of good over evil.",
      { exact: false },
    ),
  ).toBeVisible();
  await expect(
    dialog.getByRole("heading", { name: "Hindu Festivals", exact: true }),
  ).toBeVisible();
  await expect(dialog.locator(".world-source-link")).toHaveAttribute(
    "href",
    expectedStorySource(3, 2),
  );
  await expect(
    dialog.getByRole("link", { name: /Original exhibition theme/ }),
  ).toHaveAttribute("href", "/exhibition-source.pdf#page=1");
  await dialog.getByText("About this scene", { exact: true }).click();
  await expect(
    dialog.getByText(
      /These named celebrations extend the original exhibition brief/,
    ),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(
    world.getByRole("button", { name: "Read summary", exact: true }),
  ).toBeFocused();
  expect(errors).toEqual([]);
});

test("story hashes, Back/Forward, refresh, and saved progress preserve the intended moment", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#section-hindu-festivals");
  const world = await worldReady(page);
  await expect(page).toHaveURL(/#section-hindu-festivals\/story-1$/);
  await world.getByRole("button", { name: "Next story", exact: true }).click();
  await worldReady(page, 3, 1);
  await world
    .getByRole("button", { name: "All six sections", exact: true })
    .click();
  await page
    .getByRole("navigation", { name: "Choose a section", exact: true })
    .getByRole("link")
    .nth(3)
    .click();
  await worldReady(page, 3, 1);
  await expect(page).toHaveURL(/#section-hindu-festivals\/story-2$/);
  await page.goBack();
  await worldReady(page, 3, 0);
  await page.goForward();
  await worldReady(page, 3, 1);
  await page.reload();
  await worldReady(page, 3, 1);
  await page.locator(".world-back").click();
  await expect(page).toHaveURL(/#map$/);
  await page.locator("#destination-4").click();
  await worldReady(page, 3, 1);
  await expect(page).toHaveURL(/#section-hindu-festivals\/story-2$/);
  await page.goto("/#section-hindu-festivals/story-1");
  await worldReady(page, 3, 0);
});

test("rapid pavilion selections cancel stale arrivals and leave only the final world interactive", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/#map");
  await expect(page.locator(".campus-webgl canvas")).toHaveAttribute(
    "data-camera-phase",
    "overview",
  );
  for (const section of [0, 3, 1, 5]) {
    await page.evaluate((slug) => {
      window.location.hash = `section-${slug}`;
    }, slugs[section]);
    await page.waitForTimeout(90);
  }
  const final = await worldReady(page, 5);
  await expect(page).toHaveURL(
    /#section-hindu-sanskruti-adhar-stambh\/story-1$/,
  );
  await expect(
    page.locator(".world-shell:not([aria-hidden='true'])"),
  ).toHaveCount(1);
  await expect(final.locator(".world-copy h2")).toBeFocused();
  await expect(final.locator(".world-arriving")).toHaveCount(0);
  await expect(page.locator(".campus-webgl canvas")).toHaveAttribute(
    "data-camera-position",
    "17.000,2.300,18.000",
  );
  expect(errors).toEqual([]);
});

test("pause stops render frames, resume restarts them, and summary reading pauses automatically", async ({
  page,
}) => {
  await page.goto("/#section-hindu-festivals/story-1");
  const world = await worldReady(page);
  const canvas = world.locator("canvas");
  const initial = await frameCount(canvas);
  await expect.poll(() => frameCount(canvas)).toBeGreaterThan(initial + 2);
  await world.getByRole("button", { name: "Pause scene", exact: true }).click();
  await assertStopped(canvas);
  await world
    .getByRole("button", { name: "Resume scene", exact: true })
    .click();
  const resumed = await frameCount(canvas);
  await expect.poll(() => frameCount(canvas)).toBeGreaterThan(resumed + 2);
  await world
    .getByRole("button", { name: "Read summary", exact: true })
    .click();
  await expect(page.locator(".world-summary")).toBeVisible();
  await assertStopped(canvas);
  await page
    .getByRole("button", { name: "Close summary", exact: true })
    .click();
  const closed = await frameCount(canvas);
  await expect.poll(() => frameCount(canvas)).toBeGreaterThan(closed + 2);
  await setHidden(page, true);
  await page.waitForTimeout(120);
  const hidden = await frameCount(canvas);
  await page.waitForTimeout(300);
  expect(await frameCount(canvas)).toBe(hidden);
  await setHidden(page, false);
});

test("sound creates no AudioContext before a gesture and stops on summary, hidden state, and map return", async ({
  page,
}) => {
  await installAudioObserver(page);
  await page.goto("/#section-hindu-festivals/story-1");
  const world = await worldReady(page);
  await expect(
    world.getByRole("button", { name: "Sound off", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  expect(await audioStates(page)).toEqual([]);
  await world.getByRole("button", { name: "Next story", exact: true }).click();
  await worldReady(page, 3, 1);
  expect(await audioStates(page)).toEqual([]);
  await world.getByRole("button", { name: "Sound off", exact: true }).click();
  await expect.poll(() => audioStates(page)).toEqual(["running"]);
  await world
    .getByRole("button", { name: "Read summary", exact: true })
    .click();
  await expect.poll(() => audioStates(page)).toEqual(["suspended"]);
  await page
    .getByRole("button", { name: "Close summary", exact: true })
    .click();
  await expect.poll(() => audioStates(page)).toEqual(["running"]);
  await setHidden(page, true);
  await expect.poll(() => audioStates(page)).toEqual(["suspended"]);
  await expect(
    world.getByRole("button", { name: "Sound off", exact: true }),
  ).toBeVisible();
  await setHidden(page, false);
  await page.waitForTimeout(200);
  expect(await audioStates(page)).toEqual(["suspended"]);
  await world.getByRole("button", { name: "Sound off", exact: true }).click();
  await expect.poll(() => audioStates(page)).toEqual(["running"]);
  await world.locator(".world-back").click();
  await expect.poll(() => audioStates(page)).toEqual(["closed"]);
});

test("reduced motion, manual static mode, and matching Festival posters keep every story readable", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#section-hindu-festivals/story-1");
  const world = await worldReady(page);
  await expect(
    world.getByRole("button", { name: "Motion off", exact: true }),
  ).toBeDisabled();
  await assertStopped(world.locator("canvas"));
  await world
    .getByRole("button", { name: "Static scene", exact: true })
    .click();
  await expect(world).toHaveAttribute("data-static", "true");
  await expect(world.locator("canvas")).toHaveCount(0);
  for (let i = 0; i < 3; i++) {
    if (i)
      await world
        .getByRole("button", { name: "Next story", exact: true })
        .click();
    await worldReady(page, 3, i);
    const image = world.locator(".poster-visible img");
    await expect(image).toHaveAttribute("src", `/worlds/4-${i + 1}.webp`);
    await expect
      .poll(() =>
        image.evaluate((img) => (img as HTMLImageElement).naturalWidth),
      )
      .toBeGreaterThan(0);
  }
  await world.getByRole("button", { name: "3D scene", exact: true }).click();
  await expect(world).toHaveAttribute("data-static", "false");
  await worldReady(page, 3, 2);
});

test("WebGL failure retains map destinations, Festival stories, and the reading route", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (
        type === "webgl" ||
        type === "webgl2" ||
        type === "experimental-webgl"
      )
        return null;
      return Reflect.apply(original, this, [type, ...args]);
    } as typeof original;
  });
  await page.goto("/#map");
  await expect(
    page.getByRole("button", { name: "Enable 3D map", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".map-labels").getByRole("link")).toHaveCount(6);
  await page.locator("#destination-4").click();
  const world = await worldReady(page);
  await expect(world).toHaveAttribute("data-static", "true");
  await world.getByRole("button", { name: "Next story", exact: true }).click();
  await worldReady(page, 3, 1);
  await expect(world.locator(".poster-visible img")).toHaveAttribute(
    "src",
    "/worlds/4-2.webp",
  );
  await world
    .getByRole("button", { name: "Read summary", exact: true })
    .click();
  await page
    .getByRole("link", { name: "Read all sections and stories", exact: true })
    .click();
  await expect(page.getByRole("article")).toHaveCount(6);
  await expect(page.locator("details[id^='story-']")).toHaveCount(29);
});

test("denied storage does not block stories, history, or summary access", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("Storage denied", "SecurityError");
      },
    });
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#section-hindu-festivals");
  const world = await worldReady(page);
  await world.getByRole("button", { name: "Next story", exact: true }).click();
  await worldReady(page, 3, 1);
  await page.goBack();
  await worldReady(page);
  await world
    .getByRole("button", { name: "Read summary", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Diwali", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

for (const viewport of [
  { width: 390, height: 844 },
  { width: 320, height: 568 },
  { width: 844, height: 390 },
  { width: 640, height: 360 },
]) {
  test(`long section and story titles remain reachable at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/#section-hindu-sanskruti-adhar-stambh/story-3");
    const world = await worldReady(page, 5, 2);
    await expect(world.locator(".world-heading h1")).toHaveText(titles[5]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    const header = await world.locator(".world-header").boundingBox();
    const copy = await world.locator(".world-copy").boundingBox();
    const controls = await world.locator(".world-controls").boundingBox();
    expect(copy!.y).toBeGreaterThanOrEqual(header!.y + header!.height - 1);
    expect(copy!.y + copy!.height).toBeLessThanOrEqual(controls!.y + 1);
    await expect(world.locator(".world-back")).toBeInViewport({ ratio: 1 });
    await expect(
      world.getByRole("button", { name: "All six sections", exact: true }),
    ).toBeInViewport({ ratio: 1 });
    await expect(
      world.getByRole("button", { name: "Sound off", exact: true }),
    ).toBeInViewport({ ratio: 1 });
    await world
      .getByRole("button", { name: "Read summary", exact: true })
      .click();
    const dialog = page.getByRole("dialog", {
      name: "Sant — Guru",
      exact: true,
    });
    await expect(dialog).toBeInViewport();
    await expect(
      dialog.getByRole("button", { name: "Close summary", exact: true }),
    ).toBeInViewport({ ratio: 1 });
    await dialog.locator(".world-source-link").scrollIntoViewIfNeeded();
    await expect(dialog.locator(".world-source-link")).toBeInViewport();
    await page.keyboard.press("Escape");
    await world.locator(".world-back").click();
    await expect(
      page.getByRole("heading", {
        name: "Hinduism",
        exact: true,
      }),
    ).toBeInViewport({ ratio: 1 });
    // The longest moment title must also fit the reading region or scroll within it.
    await page.goto("/#section-hindu-riti-parampara/story-3");
    const longStory = await worldReady(page, 1, 2);
    await expect(longStory.locator(".world-copy h2")).toHaveText(
      "A connection to something greater",
    );
    const longHeader = await longStory.locator(".world-header").boundingBox();
    const longCopy = await longStory.locator(".world-copy").boundingBox();
    const longControls = await longStory
      .locator(".world-controls")
      .boundingBox();
    expect(longCopy!.y).toBeGreaterThanOrEqual(
      longHeader!.y + longHeader!.height - 1,
    );
    expect(longCopy!.y + longCopy!.height).toBeLessThanOrEqual(
      longControls!.y + 1,
    );
    await longStory
      .getByRole("button", { name: "Read summary", exact: true })
      .click();
    await expect(
      page.getByRole("dialog", {
        name: "A connection to something greater",
        exact: true,
      }),
    ).toBeVisible();
    // The new longest festival name must fit with its native selector at the same viewport.
    await page.goto("/#section-hindu-festivals/story-7");
    const longFestival = await worldReady(page, 3, 6);
    await expect(
      longFestival.getByRole("combobox", {
        name: "Choose a festival",
        exact: true,
      }),
    ).toBeInViewport({ ratio: 1 });
    await expect(
      longFestival.getByRole("button", { name: "Read summary", exact: true }),
    ).toBeInViewport({ ratio: 1 });
    const festivalCopy = await longFestival
      .locator(".world-copy")
      .boundingBox();
    const festivalPicker = await longFestival
      .locator(".world-festival-picker")
      .boundingBox();
    const festivalHeader = await longFestival
      .locator(".world-header")
      .boundingBox();
    const festivalControls = await longFestival
      .locator(".world-controls")
      .boundingBox();
    expect(festivalPicker!.y).toBeGreaterThanOrEqual(
      festivalHeader!.y + festivalHeader!.height - 1,
    );
    expect(festivalPicker!.y + festivalPicker!.height).toBeLessThanOrEqual(
      festivalControls!.y + 1,
    );
    const overlapWidth =
      Math.min(
        festivalCopy!.x + festivalCopy!.width,
        festivalPicker!.x + festivalPicker!.width,
      ) - Math.max(festivalCopy!.x, festivalPicker!.x);
    const overlapHeight =
      Math.min(
        festivalCopy!.y + festivalCopy!.height,
        festivalPicker!.y + festivalPicker!.height,
      ) - Math.max(festivalCopy!.y, festivalPicker!.y);
    expect(
      overlapWidth <= 1 || overlapHeight <= 1,
      "The festival selector must not cover the readable title and caption region",
    ).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    await longFestival
      .getByRole("button", { name: "Read summary", exact: true })
      .click();
    const festivalDialog = page.getByRole("dialog", {
      name: festivalStories[6],
      exact: true,
    });
    await expect(festivalDialog).toBeInViewport();
    await festivalDialog.locator(".world-source-link").scrollIntoViewIfNeeded();
    await expect(festivalDialog.locator(".world-source-link")).toBeInViewport();
  });
}

test("all fifty-eight desktop and mobile story posters are distinct within their world and load successfully", async ({
  request,
}) => {
  for (let section = 1; section <= 6; section++) {
    const storyCount = expectedMomentTitles[section - 1].length;
    const desktopHashes = new Map<number, string>();
    for (const suffix of ["", "-mobile"]) {
      const hashes = new Set<string>();
      for (let story = 1; story <= storyCount; story++) {
        const response = await request.get(
          `/worlds/${section}-${story}${suffix}.webp`,
        );
        expect(
          response.status(),
          `world ${section}, story ${story}${suffix} poster status`,
        ).toBe(200);
        expect(response.headers()["content-type"]).toContain("image/webp");
        const hash = createHash("sha256")
          .update(await response.body())
          .digest("hex");
        hashes.add(hash);
        if (suffix === "") desktopHashes.set(story, hash);
        else
          expect(
            hash,
            `world ${section}, story ${story} mobile framing`,
          ).not.toBe(desktopHashes.get(story));
      }
      expect(
        hashes.size,
        `world ${section} ${suffix || "desktop"} should not repeat one poster across its ${storyCount} moments`,
      ).toBe(storyCount);
    }
  }
});

for (let section = 0; section < titles.length; section++) {
  for (const state of ["world", "summary"] as const) {
    test(`accessibility: section ${section + 1} mobile ${state} has no automatically detectable WCAG A/AA violations`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(`/#section-${slugs[section]}/story-2`);
      const world = await worldReady(page, section, 1);
      if (state === "summary")
        await world
          .getByRole("button", { name: "Read summary", exact: true })
          .click();
      const results = await new AxeBuilder({ page })
        .exclude("nextjs-portal")
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      await testInfo.attach("accessibility-results", {
        body: JSON.stringify(results.violations, null, 2),
        contentType: "application/json",
      });
      expect(
        results.violations.map((v) => ({
          rule: v.id,
          nodes: v.nodes.map((n) => ({
            target: n.target,
            issue: n.failureSummary,
          })),
        })),
      ).toEqual([]);
    });
  }
}

for (const viewport of [
  { width: 1440, height: 1000 },
  { width: 390, height: 844 },
]) {
  test(`all twenty-nine static views match their section, selected story, and actual source at ${viewport.width}px`, async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (let section = 0; section < 6; section++) {
      await page.goto(`/#section-${slugs[section]}/story-1`);
      const world = await worldReady(page, section, 0);
      await world
        .getByRole("button", { name: "Static scene", exact: true })
        .click();
      await expect(world).toHaveAttribute("data-static", "true");
      for (
        let story = 0;
        story < expectedMomentTitles[section].length;
        story++
      ) {
        if (story)
          await world
            .getByRole("button", { name: "Next story", exact: true })
            .click();
        await expect(world.locator(".world-copy h2")).toHaveText(
          expectedMomentTitles[section][story],
        );
        const image = world.locator(".poster-visible img");
        await expect(image).toHaveAttribute(
          "src",
          `/worlds/${section + 1}-${story + 1}.webp`,
        );
        await expect
          .poll(() =>
            image.evaluate((img) => (img as HTMLImageElement).naturalWidth),
          )
          .toBeGreaterThan(0);
        await expect
          .poll(() =>
            image.evaluate(
              (img) => new URL((img as HTMLImageElement).currentSrc).pathname,
            ),
          )
          .toBe(
            `/worlds/${section + 1}-${story + 1}${viewport.width < 761 ? "-mobile" : ""}.webp`,
          );
        await world
          .getByRole("button", { name: "Read summary", exact: true })
          .click();
        const dialog = page.getByRole("dialog", {
          name: expectedMomentTitles[section][story],
          exact: true,
        });
        await expect(dialog.locator(".world-source-link")).toHaveAttribute(
          "href",
          expectedStorySource(section, story),
        );
        await dialog
          .getByRole("button", { name: "Close summary", exact: true })
          .click();
      }
    }
  });
}
