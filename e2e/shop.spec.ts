import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test.beforeEach(async ({ page }) => login(page));

test("add an item with validation", async ({ page }) => {
  await page.goto("/inventory");
  await page.getByRole("button", { name: "Add Item" }).click();
  await page.getByRole("button", { name: "Save Item" }).click();
  await expect(page.getByText("Item name is required.")).toBeVisible();

  await page.locator("#name").fill("E2E Phone Case");
  await page.locator("#costPrice").fill("200");
  await page.locator("#sellPrice").fill("100");
  await page.getByRole("button", { name: "Save Item" }).click();
  await expect(page.getByText("Selling price is lower than the cost price.")).toBeVisible();

  await page.locator("#sellPrice").fill("350");
  await page.locator("#stock").fill("5");
  await page.getByRole("button", { name: "Save Item" }).click();
  await expect(page.getByText("Item added.")).toBeVisible();
  await expect(page.getByRole("button", { name: /E2E Phone Case/ })).toBeVisible();
});

test("cash sale prints a bill and lowers stock", async ({ page }) => {
  await page.goto("/billing");
  await page.getByRole("button", { name: /Blue Pen/ }).click();
  await page.getByRole("button", { name: /Blue Pen/ }).click();
  await page.getByRole("button", { name: "Pay Rs. 50.00" }).click();
  await page.getByRole("button", { name: "Exact" }).click();
  await page.getByRole("button", { name: "Complete Bill" }).click();
  await expect(page).toHaveURL(/receipt/);
  await expect(page.getByText("Blue Pen")).toBeVisible();

  // The bill prints on 80 mm paper, centred, not on a full page.
  await expect.poll(() => page.evaluate(() => document.getElementById("receipt-page")?.textContent)).toMatch(/size: 80mm \d+mm/);
  const pdf = (await page.pdf({ preferCSSPageSize: true })).toString("latin1");
  expect(pdf).toMatch(/MediaBox \[0 0 22[67]\.\d*/); // 80 mm in points
  await page.emulateMedia({ media: "print" });
  await page.setViewportSize({ width: 302, height: 600 });
  const box = (await page.locator("#receipt").boundingBox())!;
  expect(Math.abs(box.x - (302 - box.x - box.width))).toBeLessThanOrEqual(2);
  await page.emulateMedia({ media: "screen" });

  await page.goto("/inventory");
  await expect(page.getByRole("row", { name: /Blue Pen/ })).toContainText("98 in stock");
});

test("credit sale goes to Nayapotha and takes a payment", async ({ page }) => {
  await page.goto("/billing");
  await page.getByRole("button", { name: /Fast Charger/ }).click();
  await page.getByRole("button", { name: /^Pay/ }).click();
  await page.getByRole("button", { name: "Nayapotha" }).last().click();
  await page.getByRole("button", { name: "Complete Bill" }).click();
  await expect(page.getByText("Customer is required.")).toBeVisible();

  await page.locator("#customerId").selectOption({ label: "Sample Customer (0770000000)" });
  await page.getByRole("button", { name: "Complete Bill" }).click();
  await expect(page).toHaveURL(/receipt/);

  await page.goto("/nayapotha");
  await page.getByRole("row", { name: /Sample Customer/ }).getByRole("link", { name: "Open" }).click();
  await expect(page.getByText("Rs. 1,500.00").first()).toBeVisible();
  await page.getByRole("button", { name: "Receive Payment" }).click();
  await page.locator("#amount").fill("2000");
  await page.getByRole("button", { name: "Save Payment" }).click();
  await expect(page.getByText(/only owes/)).toBeVisible();
  await page.locator("#amount").fill("500");
  await page.getByRole("button", { name: "Save Payment" }).click();
  await expect(page.getByText("Payment recorded.")).toBeVisible();
});

test("gas refill swaps full for empty", async ({ page }) => {
  await page.goto("/gas-water");
  await page.getByRole("button", { name: /^Refill/ }).first().click();
  await page.getByRole("button", { name: "Exact" }).click();
  await page.getByRole("button", { name: "Complete Bill" }).click();
  await expect(page).toHaveURL(/receipt/);
  await page.goto("/gas-water");
  await expect(page.getByText("9", { exact: true }).first()).toBeVisible();
});

test("monthly report shows the graph", async ({ page }) => {
  await page.goto("/reports");
  await expect(page.getByRole("tab", { name: "Monthly report" })).toBeVisible();
  await expect(page.locator(".recharts-bar-rectangle").first()).toBeVisible();
});

test("language switches to Sinhala and back", async ({ page }) => {
  await page.goto("/settings");
  await page.getByRole("button", { name: "සිංහල" }).first().click();
  await expect(page.getByRole("heading", { name: "සැකසුම්" })).toBeVisible();
  await page.getByRole("button", { name: "English" }).first().click();
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
});
