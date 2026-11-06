import { Page } from "@playwright/test";

export async function login(page: Page) {
  // A real print window would block the test.
  await page.addInitScript(() => { window.print = () => {}; });
  await page.goto("/login");
  await page.locator("#username").fill("admin");
  await page.locator("#password").fill("admin123");
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL("/");
}
