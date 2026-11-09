import { expect, type Page } from "@playwright/test";
import { sectionTitles } from "./exhibition-fixtures";

type SectionMenuLabel = "Choose an exhibition section" | "Open a section directly";

export async function chooseSection(
  page: Page,
  id: number | string,
  label: SectionMenuLabel = "Choose an exhibition section",
) {
  await page.getByRole("combobox", { name: label, exact: true }).click();
  const menu = page.getByRole("listbox", { name: label, exact: true });
  await menu.locator(`[role="option"][data-section-id="${id}"]`).click();
}

export async function expectSectionChoices(
  page: Page,
  label: SectionMenuLabel = "Choose an exhibition section",
) {
  await page.getByRole("combobox", { name: label, exact: true }).click();
  const menu = page.getByRole("listbox", { name: label, exact: true });
  const options = menu.getByRole("option");
  await expect(options).toHaveCount(6);
  for (const title of sectionTitles) {
    await expect(options.filter({ hasText: title })).toHaveCount(1);
  }
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
}
