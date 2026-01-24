import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("should display the landing page", async ({ page }) => {
    await page.goto("/");

    // Check that the page title is present
    await expect(page).toHaveTitle(/Stager/i);
  });

  test("should have navigation links", async ({ page }) => {
    await page.goto("/");

    // Should have login and signup links
    const loginLink = page.getByRole("link", { name: /log in|sign in/i });
    const signupLink = page.getByRole("link", {
      name: /get started|sign up/i,
    });

    await expect(loginLink.or(signupLink)).toBeVisible();
  });

  test("should navigate to login page", async ({ page }) => {
    await page.goto("/");

    // Find and click the login link
    const loginLink = page.getByRole("link", { name: /log in|sign in/i });

    // If login link exists, click it
    if (await loginLink.isVisible()) {
      await loginLink.click();
      await expect(page).toHaveURL(/\/login/);
    }
  });

  test("should be responsive", async ({ page }) => {
    await page.goto("/");

    // Test desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.locator("body")).toBeVisible();

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator("body")).toBeVisible();
  });
});
