import { test, expect } from "@playwright/test";

const UI_URL = "http://localhost:5173/";

test.beforeEach(async ({ page }) => {
  await page.goto(UI_URL);

  // get the sign in button
  await page.getByRole("link", { name: "Sign In" }).click();

  await expect(
    page.getByRole("heading", {
      name: "Sign In",
    })
  ).toBeVisible();

  await page.locator("[name=email]").fill("Salman@gmail.com");
  await page.locator("[name=password]").fill("Salman1234");

  await page.getByRole("button", { name: "Login" }).click();

  await expect(page.getByText("SignIn successfull")).toBeVisible();
  await expect(page.getByRole("link", { name: "My Bookings" })).toBeVisible();
  await expect(page.getByRole("link", { name: "My Hotels" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign Out" })).toBeVisible();
});

test("Should Show hotel Search results", async ({ page }) => {
  await page.goto(UI_URL);

  await page.getByPlaceholder("where are you going ?").fill("Canada");
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page.getByText("Hotels Found in Canada")).toBeVisible();
  await expect(page.getByText("Dublin Gateways")).toBeVisible();
});

test("should show hotel detail", async ({ page }) => {
  await page.goto(UI_URL);

  await page.getByPlaceholder("where are you going ?").fill("Canada");
  await page.getByRole("button", { name: "Search" }).click();

  await page.getByText("Dublin Gateways").click();
  await expect(page).toHaveURL(/detail/);
  await expect(page.getByRole("button", { name: "Book Now" })).toBeVisible();
});

test("should book hotel", async ({ page }) => {
  await page.goto(UI_URL);

  await page.getByPlaceholder("where are you going ?").fill("Canada");

  const date = new Date();
  date.setDate(date.getDate() + 7);
  const formattedDate = date.toISOString().split("T")[0];
  await page.getByPlaceholder("Check-out Date").fill(formattedDate);

  await page.getByRole("button", { name: "Search" }).click();

  await page.getByText("Dublin Gateways").click();
  await page.getByRole("button", { name: "Book Now" }).click();

  await expect(page.getByText("Total Cost : $108.00")).toBeVisible();

  const stripeFrame = page.frameLocator("iframe").first();
  await stripeFrame
    .locator('[placeholder="Card number"]')
    .fill("4242424242424242");
  await stripeFrame.locator('[placeholder="MM / YY"]').fill("05/30");
  await stripeFrame.locator('[placeholder="CVC"]').fill("242");
  await stripeFrame.locator('[placeholder="ZIP"]').fill("56789");

  await page.getByRole("button", { name: "Confirm Booking" }).click();
  await expect(page.getByText("Booking Saved!")).toBeVisible();

  await page.getByRole("link", { name: "My Bookings" }).click();
  await expect(page.getByText("Dublin Gateways")).toBeVisible();
});
