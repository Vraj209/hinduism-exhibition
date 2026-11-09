import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {
  sectionTitles as titles,
  sectionSlugs as slugs,
  expectedMomentTitles as momentTitles,
  expectedStorySource,
  sectionQuotations,
} from "./exhibition-fixtures";

async function ready(page: Page) {
  await expect(
    page.getByRole("button", { name: "Campus Map", exact: true }),
  ).toBeEnabled();
  await expect(page.locator(".campus-webgl canvas")).toHaveAttribute(
    "data-camera-phase",
    "overview",
  );
}

async function arrived(page: Page, section: number) {
  const gallery = page.getByRole("region", { name: `${titles[section]} exhibition gallery`, exact: true });
  await expect(gallery).toHaveAttribute("data-arrived", "true");
  await expect(gallery.locator(".gallery-opening h1")).toHaveText(titles[section]);
  return gallery;
}

async function summary(page: Page) {
  await page.locator(".gallery-scroll").evaluate((element) => element.scrollTo({ top: element.scrollHeight, behavior: "instant" }));
  await expect(page.locator(".gallery-closing")).toHaveAttribute("data-active", "true");
  await page.getByRole("button", { name: "Read Full Summary", exact: true }).click();
  const dialog = page.locator(".gallery-summary");
  await expect(dialog).toBeVisible();
  return dialog;
}

test("six accessible destinations support keyboard entrance through the selected doorway", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await ready(page);
  const destinations = page.locator(".map-labels").getByRole("link");
  await expect(destinations).toHaveCount(6);
  for (let i = 0; i < titles.length; i++) {
    await expect(destinations.nth(i)).toHaveAccessibleName(
      new RegExp(`(?:Section )?0?${i + 1}:? ${titles[i]}`),
    );
  }
  await page.locator("#destination-1").focus();
  const started = Date.now();
  await page.keyboard.press("Enter");
  await expect(page.locator(".campus-webgl canvas")).toHaveAttribute(
    "data-camera-type",
    "perspective",
  );
  await arrived(page, 0);
  expect(Date.now() - started).toBeGreaterThan(900);
  expect(Date.now() - started).toBeLessThan(8000);
  await expect(page.locator(".gallery-opening h1")).toBeFocused();
  await expect(page.locator(".campus-webgl canvas")).toHaveAttribute(
    "data-camera-position",
    "-17.000,2.300,18.000",
  );
  await summary(page);
  await expect(
    page.getByText("Daily life and worship are presented as connected.", {
      exact: true,
    }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("the closing action follows all six sections in source order and returns to the campus", async ({ page }) => {
  test.setTimeout(60_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`/#section-${slugs[0]}`);
  for (let i = 0; i < titles.length; i++) {
    const gallery = await arrived(page, i);
    await page.locator(".gallery-scroll").evaluate((element) => element.scrollTo({ top: element.scrollHeight, behavior: "instant" }));
    await expect(gallery.locator(".gallery-closing")).toHaveAttribute("data-active", "true");
    const next = gallery.getByRole("link", { name: "Next Exhibition", exact: true });
    await expect(next).toHaveAttribute("href", `#section-${slugs[(i + 1) % 6]}`);
    if (i < 5) await next.click();
    else await gallery.getByRole("link", { name: "Return to Campus", exact: true }).click();
  }
  await expect(page.getByRole("heading", { name: "Hinduism", exact: true })).toBeVisible();
  await expect(page.locator(".map-labels").getByRole("link")).toHaveCount(6);
});

test("map return restores the exact overview pose, zoom, and selected label focus", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#map");
  await ready(page);
  const canvas = page.locator(".campus-webgl canvas");
  await page.getByRole("button", { name: "Campus Map", exact: true }).click();
  await expect(canvas).toHaveAttribute("data-camera-type", "orthographic");
  const zoomIn = page.getByRole("button", { name: "Zoom in", exact: true });
  for (let i = 0; i < 3; i++) await zoomIn.click();
  await expect(canvas).toHaveAttribute("data-camera-zoom", "1.300");
  const position = await canvas.getAttribute("data-camera-position");
  const target = await canvas.getAttribute("data-camera-target");
  await page.locator("#destination-4").click();
  const world = await arrived(page, 3);
  await world.locator(".gallery-back").click();
  await expect(canvas).toHaveAttribute("data-camera-phase", "overview");
  await expect(canvas).toHaveAttribute("data-camera-type", "orthographic");
  await expect(canvas).toHaveAttribute("data-camera-position", position!);
  await expect(canvas).toHaveAttribute("data-camera-target", target!);
  await expect(canvas).toHaveAttribute("data-camera-zoom", "1.300");
  await expect(page.locator("#destination-4")).toBeFocused();
  await expect(zoomIn).toBeDisabled();
  await page
    .getByRole("button", { name: "Reset View", exact: true })
    .click();
  await expect(canvas).toHaveAttribute("data-camera-zoom", "1.000");
});

test("the complete reading route exposes all twenty-nine story summaries without JavaScript", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto(`${baseURL}/read`);
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to the sections", exact: true }),
  ).toBeFocused();
  const articles = page.getByRole("article");
  await expect(articles).toHaveCount(6);
  await expect(page.locator("details[id^='story-']")).toHaveCount(29);
  for (let i = 0; i < titles.length; i++) {
    const article = articles.nth(i);
    await expect(article.getByRole("heading", { level: 2 })).toHaveText(
      titles[i],
    );
    await expect(article.getByRole("listitem")).toHaveCount(i === 5 ? 4 : 3);
    await article
      .getByText("Words from the exhibition", { exact: true })
      .click();
    await expect(article.getByRole("blockquote")).toBeVisible();
    await expect(article.getByRole("blockquote")).toHaveText(
      `“${sectionQuotations[i]}”`,
    );
    const stories = article.locator("details[id^='story-']");
    await expect(stories).toHaveCount(momentTitles[i].length);
    for (let j = 0; j < momentTitles[i].length; j++) {
      const story = stories.nth(j);
      await expect(story.locator("summary")).toContainText(momentTitles[i][j]);
      await story.locator("summary").click();
      await expect(story).toHaveAttribute("open", "");
      const summaryBody = story.locator("p").first();
      await expect(summaryBody).toBeVisible();
      expect(
        (await summaryBody.innerText()).trim().split(/\s+/).length,
        `${momentTitles[i][j]} must expose its explanatory summary without JavaScript`,
      ).toBeGreaterThanOrEqual(20);
      await expect(
        story.getByText("Carry this with you", { exact: true }),
      ).toBeVisible();
      await expect(
        story.getByRole("link", { name: /^Source:/ }),
      ).toHaveAttribute("href", expectedStorySource(i, j));
    }
    await expect(
      article.getByRole("link", { name: "Explore this pavilion", exact: true }),
    ).toHaveAttribute("href", `/#section-${slugs[i]}`);
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  await context.close();
});

for (const viewport of [
  { width: 390, height: 844 },
  { width: 834, height: 1194 },
]) {
  test(`map and reading layout remain usable at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await ready(page);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    if (viewport.width === 390) {
      await expect(page.getByRole("combobox", { name: "Choose an exhibition section", exact: true })).toBeInViewport({ ratio: 1 });
      await expect(page.getByRole("button", { name: "Reset View", exact: true })).toBeInViewport({ ratio: 1 });
      await expect(page.getByRole("button", { name: "Campus Map", exact: true })).toBeInViewport({ ratio: 1 });
    }
    await page
      .getByRole("combobox", { name: "Choose an exhibition section", exact: true })
      .selectOption("1");
    const world = await arrived(page, 0);
    await world.locator(".gallery-back").click();
    await expect(
      page.getByRole("heading", { name: "Hinduism" }),
    ).toBeInViewport();
    await page.goto("/read");
    await expect(page.getByRole("article")).toHaveCount(6);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
  });
}

for (const route of ["/", "/#map", "/read", "/references"]) {
  test(`accessibility: ${route} has no automatically detectable WCAG A/AA violations`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(route);
    if (route === "/read")
      await expect(page.getByRole("article")).toHaveCount(6);
    else if (route === "/references")
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        "Sources & visual credits",
      );
    else await ready(page);
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
