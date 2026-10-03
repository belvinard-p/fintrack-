import { test, expect } from "@playwright/test";

test.describe("Login page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("renders the login form with email, password and submit button", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /log in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /log in/i })).toBeVisible();
  });

  test("shows an error message on invalid credentials", async ({ page }) => {
    await page.getByLabel(/email/i).fill("wrong@example.com");
    await page.getByLabel(/password/i).fill("wrongpassword");
    await page.getByRole("button", { name: /log in/i }).click();

    // The API returns an error — the form should display it
    await expect(page.getByText(/login failed|incorrect|invalid/i)).toBeVisible({ timeout: 5000 });
  });

  test("redirects to /dashboard after successful login", async ({ page }) => {
    // Use credentials from your test environment (.env.test or a seeded user)
    await page.getByLabel(/email/i).fill(process.env.TEST_USER_EMAIL ?? "test@example.com");
    await page.getByLabel(/password/i).fill(process.env.TEST_USER_PASSWORD ?? "testpassword");
    await page.getByRole("button", { name: /log in/i }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 8000 });
  });

  test("back to home link navigates to /", async ({ page }) => {
    await page.getByRole("link", { name: /back to home/i }).click();
    await expect(page).toHaveURL("/");
  });
});
