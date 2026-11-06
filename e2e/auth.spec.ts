import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("pages need a login", async ({ page }) => {
  await page.goto("/billing");
  await expect(page).toHaveURL(/login/);
});

test("login shows field errors and wrong password message", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Hi, welcome to Viraj Communication POS system" })).toBeVisible();
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByText("Username is required.")).toBeVisible();

  await page.locator("#username").fill("admin");
  await page.locator("#password").fill("wrong");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByText("Wrong username or password.")).toBeVisible();
});

test("admin lands on the welcome page", async ({ page }) => {
  await login(page);
  await expect(page.getByText("welcome to Viraj Communication POS system")).toBeVisible();
});
