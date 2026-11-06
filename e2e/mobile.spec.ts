import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("phone uses bottom tabs and the bill bar", async ({ page }) => {
  await login(page);
  const tabs = page.getByRole("navigation", { name: "Main" });
  await tabs.getByRole("link", { name: "Billing" }).click();
  await page.getByRole("button", { name: /Biscuit Pack/ }).click();
  await page.getByRole("button", { name: /View Bill/ }).click();
  await expect(page.getByRole("heading", { name: "Short Bill" })).toBeVisible();

  const width = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(width).toBeLessThanOrEqual(0);

  await page.getByRole("button", { name: "Add more" }).click();
  await tabs.getByRole("button", { name: "More" }).click();
  await expect(page.getByRole("link", { name: "Reports" })).toBeVisible();
});
