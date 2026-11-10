import { type Page } from "@playwright/test";

export async function chooseRegion(page: Page, name: string) {
  await page.getByRole("combobox", { name: "Select a state or union territory", exact: true }).click();
  await page.getByRole("listbox", { name: "Select a state or union territory", exact: true }).getByRole("option", { name, exact: true }).click();
}
