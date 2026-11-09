import { expect, test } from "@playwright/test";
import {
  expectedFestivals,
  sectionSlugs,
  sectionTitles,
  expectedMomentTitles,
} from "./exhibition-fixtures";

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

test("sources and credits work without JavaScript and distinguish original artwork from BAPS gallery photographs", async ({
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
    page.getByText(/All twenty-nine story photographs across the six dark galleries come from official BAPS sources/),
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
  const festivalRows = page.locator(".reference-festivals").filter({ has: page.getByRole("heading", { name: "Festival research", exact: true }) }).locator("li");
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
  const photoCredits = page.locator('section[aria-labelledby="gallery-photo-credits"] li');
  await expect(photoCredits).toHaveCount(29);
  const storyTitles = expectedMomentTitles.flat();
  for (let index = 0; index < storyTitles.length; index++) {
    await expect(photoCredits.nth(index).locator("strong")).toHaveText(storyTitles[index]);
    await expect(photoCredits.nth(index).getByRole("link")).toHaveAttribute("href", /^https:\/\/([a-z]+\.)?baps\.org\//);
    await expect(photoCredits.nth(index)).toContainText("BAPS Swaminarayan Sanstha");
  }
  await context.close();
});
