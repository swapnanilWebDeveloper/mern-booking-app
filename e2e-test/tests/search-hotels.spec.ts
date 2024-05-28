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
