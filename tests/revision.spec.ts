import { expect, test } from "@playwright/test";
import {
  expectedFestivals,
  sectionSlugs,
  sectionTitles,
} from "./exhibition-fixtures";

test("the native festival chooser selects all fourteen distinct stages and correct official sources", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#section-hindu-festivals/story-1");
  const world = page.getByRole("region", {
    name: "Hindu Festivals immersive experience",
    exact: true,
  });
  await expect(world).toHaveAttribute("data-arrived", "true");
  const chooser = world.getByRole("combobox", {
    name: "Choose a festival",
    exact: true,
  });
  await expect(chooser.locator("option")).toHaveText(
    expectedFestivals.map((festival) => festival.name),
  );
  const canvas = world.locator(".world-webgl canvas");
  const originalCanvas = await canvas.elementHandle();
  for (let index = 0; index < expectedFestivals.length; index++) {
    const festival = expectedFestivals[index];
    await chooser.selectOption(String(index));
    await expect(chooser).toHaveValue(String(index));
    await expect(page).toHaveURL(
      new RegExp(`#section-hindu-festivals/story-${index + 1}$`),
    );
    await expect(world).toHaveAttribute("data-story", festival.id);
    await expect(world.locator(".world-copy h2")).toHaveText(festival.name);
    await expect(canvas).toHaveAttribute("data-story-index", String(index));
    await expect(canvas).toHaveAttribute(
      "data-stage-weights",
      expectedFestivals
        .map((_, i) => (i === index ? "1.00" : "0.00"))
        .join(","),
    );
    expect(
      await canvas.evaluate(
        (element, original) => element === original,
        originalCanvas,
      ),
    ).toBe(true);
    await world
      .getByRole("button", { name: "Read summary", exact: true })
      .click();
    const dialog = page.getByRole("dialog", {
      name: festival.name,
      exact: true,
    });
    await expect(dialog.locator(".world-source-link")).toHaveAttribute(
      "href",
      festival.sourceUrl,
    );
    await expect(
      dialog.getByRole("link", {
        name: "Official BAPS festival guide ↗",
        exact: true,
      }),
    ).toHaveAttribute("href", festival.sourceUrl);
    await expect(
      dialog.getByRole("link", {
        name: "Original exhibition theme · PDF page 1 ↗",
        exact: true,
      }),
    ).toHaveAttribute("href", "/exhibition-source.pdf#page=1");
    await expect(
      dialog.getByText("Additional festival research", { exact: true }),
    ).toBeVisible();
    await dialog
      .getByRole("button", { name: "Close summary", exact: true })
      .click();
  }
  await expect(
    world.getByRole("link", { name: "Next section", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("rapid festival selection, keyboard selection and history work beyond the former three-story limit", async ({
  page,
}) => {
  await page.goto("/#section-hindu-festivals/story-1");
  const world = page.getByRole("region", {
    name: "Hindu Festivals immersive experience",
    exact: true,
  });
  await expect(world).toHaveAttribute("data-arrived", "true");
  const chooser = world.getByRole("combobox", {
    name: "Choose a festival",
    exact: true,
  });
  for (const index of [13, 4, 11, 6]) {
    await chooser.selectOption(String(index));
    await page.waitForTimeout(50);
  }
  await expect(world).toHaveAttribute("data-story", "swaminarayan-jayanti");
  await expect(world.locator("canvas")).toHaveAttribute(
    "data-stage-weights",
    expectedFestivals.map((_, i) => (i === 6 ? "1.00" : "0.00")).join(","),
  );
  await expect(page).toHaveURL(/story-7$/);
  await page.goBack();
  await expect(world).toHaveAttribute("data-story", "rath-yatra");
  await page.goForward();
  await expect(world).toHaveAttribute("data-story", "swaminarayan-jayanti");
  await page.reload();
  await expect(world).toHaveAttribute("data-arrived", "true");
  await expect(chooser).toHaveValue("6");
  await chooser.focus();
  // One native type-ahead search avoids concatenating letters in the browser's
  // timed search buffer; Home/End navigation differs by platform.
  await chooser.press("n");
  await expect(world).toHaveAttribute("data-story", "navratri");
  await world.locator(".world-back").click();
  await expect(page).toHaveURL(/#map$/);
  // Re-enter without an explicit story so stored progress, rather than the hash,
  // must preserve an index beyond the original three-moment collection.
  await page.locator("#destination-4").click();
  await expect(world).toHaveAttribute("data-arrived", "true");
  await expect(world).toHaveAttribute("data-story", "navratri");
  await expect(page).toHaveURL(/story-14$/);
});

test("the reading route retains six original messages while labeling named festivals as additional research", async ({
  page,
}) => {
  const messages = [
    "The way we live can itself be a form of worship.",
    "Rituals remind us of our duties, our relationships, and a connection to something greater.",
    "The exhibition introduces Hindu belief through the journey of the atma, or soul.",
    "Festivals express victories of light over darkness, truth over ego, and love over separation.",
    "Values rooted in Hindu tradition come alive in everyday acts of kindness.",
    "The exhibition brings together Shastra, Mandir, and Sant — Guru as three sustaining pillars.",
  ];
  await page.goto("/read");
  const articles = page.getByRole("article");
  await expect(articles).toHaveCount(6);
  for (let index = 0; index < sectionTitles.length; index++) {
    await expect(
      articles.nth(index).getByRole("heading", { level: 2 }),
    ).toHaveText(sectionTitles[index]);
    await expect(
      articles.nth(index).getByText(messages[index], { exact: true }),
    ).toBeVisible();
    await expect(articles.nth(index)).toHaveAttribute(
      "id",
      sectionSlugs[index],
    );
  }
  const festivals = articles.nth(3);
  await expect(
    festivals.getByRole("heading", {
      name: "Explore fourteen festivals",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    festivals.getByText(
      /These named celebrations extend the original exhibition brief/,
    ),
  ).toBeVisible();
  await expect(
    festivals.getByText(/not a complete Hindu festival calendar/),
  ).toBeVisible();
  await festivals
    .getByText("Words from the exhibition", { exact: true })
    .click();
  await expect(festivals.getByRole("blockquote")).toHaveText(
    "“Every Hindu festival is a celebration of a cosmic victory — light over darkness, truth over ego, love over separation.”",
  );
  for (const festival of expectedFestivals) {
    const story = festivals.locator(`#story-${festival.id}`);
    await story.locator("summary").click();
    await expect(story.getByRole("link", { name: /^Source:/ })).toHaveAttribute(
      "href",
      festival.sourceUrl,
    );
  }
  await expect(
    page.getByRole("link", { name: "Sources & visual credits ↗", exact: true }),
  ).toHaveAttribute("href", "/references");
});

test("sources and credits work without JavaScript and separate original artwork from research photographs", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 320, height: 568 },
  });
  const page = await context.newPage();
  await page.goto(`${baseURL}/references`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Sources & visual credits",
  );
  await expect(
    page.getByText(/Named festival research was added separately/),
  ).toBeVisible();
  await expect(
    page.getByText(/none are redistributed as website assets/),
  ).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(6);
  await expect(
    page.getByRole("heading", {
      name: "Six related domed exhibition pavilions",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText(/The Delhi reference photographs show smaller roof pavilions/),
  ).toBeVisible();
  await expect(page.locator("#robbinsville")).toContainText("Photo-based reconstruction");
  await expect(page.locator("#robbinsville")).toContainText("remain approximations");
  await expect(
    page.getByRole("link", { name: /BAPS · Exhibition Hall 1, New Delhi/ }),
  ).toHaveAttribute(
    "href",
    "https://www.baps.org/photos/2003/23--24-November-2003-2982.aspx?mid=4800",
  );
  await expect(
    page.getByRole("article").getByRole("heading", { level: 4 }),
  ).toHaveText([
    "The everyday offering",
    "Threads of relationship",
    "A path toward understanding",
    "Light that brings us together",
    "Care held in human hands",
    "Three sustaining pillars",
  ]);
  const festivalRows = page.locator(".reference-festivals li");
  await expect(festivalRows).toHaveCount(14);
  for (let index = 0; index < expectedFestivals.length; index++) {
    await expect(festivalRows.nth(index).locator("strong")).toHaveText(
      expectedFestivals[index].name,
    );
    await expect(festivalRows.nth(index).getByRole("link")).toHaveAttribute(
      "href",
      expectedFestivals[index].sourceUrl,
    );
  }
  await expect(
    page.getByRole("link", {
      name: "Read the supplied exhibition brief ↗",
      exact: true,
    }),
  ).toHaveAttribute("href", "/exhibition-source.pdf#page=1");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  await context.close();
});
