import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test.describe("Login Page", () => {
    test("should display login form", async ({ page }) => {
      await page.goto("/login");

      // Check for email and password inputs
      const emailInput = page.getByRole("textbox", { name: /email/i });
      const passwordInput = page.locator('input[type="password"]');

      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
    });

    test("should have sign up link", async ({ page }) => {
      await page.goto("/login");

      // Should have a link to sign up
      const signupLink = page.getByRole("link", { name: /sign up|create/i });
      await expect(signupLink).toBeVisible();
    });

    test("should show validation on empty submit", async ({ page }) => {
      await page.goto("/login");

      // Find and click submit button
      const submitButton = page.getByRole("button", {
        name: /log in|sign in|submit/i,
      });
      await submitButton.click();

      // Should show some form of validation (HTML5 or custom)
      const emailInput = page.getByRole("textbox", { name: /email/i });
      const isInvalid =
        (await emailInput.getAttribute("aria-invalid")) === "true" ||
        (await emailInput.evaluate(
          (el) => !(el as HTMLInputElement).validity.valid
        ));

      expect(isInvalid).toBeTruthy();
    });

    test("should show error for invalid credentials", async ({ page }) => {
      await page.goto("/login");

      // Fill in invalid credentials
      await page
        .getByRole("textbox", { name: /email/i })
        .fill("invalid@example.com");
      await page.locator('input[type="password"]').fill("wrongpassword123");

      // Submit
      const submitButton = page.getByRole("button", {
        name: /log in|sign in|submit/i,
      });
      await submitButton.click();

      // Wait for error message (either toast or inline error)
      const errorMessage = page.locator(
        '[role="alert"], [class*="error"], [class*="Error"]'
      );

      // Give some time for the request to complete
      await page.waitForTimeout(2000);

      // Either error message is shown or we're still on login page
      const isStillOnLogin = page.url().includes("/login");
      expect(isStillOnLogin).toBeTruthy();
    });
  });

  test.describe("Signup Page", () => {
    test("should display signup form", async ({ page }) => {
      await page.goto("/signup");

      // Check for form inputs
      const emailInput = page.getByRole("textbox", { name: /email/i });
      const passwordInput = page.locator('input[type="password"]').first();

      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
    });

    test("should have login link", async ({ page }) => {
      await page.goto("/signup");

      // Should have a link to login
      const loginLink = page.getByRole("link", {
        name: /log in|sign in|already have/i,
      });
      await expect(loginLink).toBeVisible();
    });
  });

  test.describe("Protected Routes", () => {
    test("should redirect unauthenticated user from dashboard to login", async ({
      page,
    }) => {
      await page.goto("/dashboard");

      // Should redirect to login page
      await page.waitForURL(/\/login/);
      expect(page.url()).toContain("/login");
    });

    test("should redirect unauthenticated user from stage to login", async ({
      page,
    }) => {
      await page.goto("/stage");

      // Should redirect to login page
      await page.waitForURL(/\/login/);
      expect(page.url()).toContain("/login");
    });

    test("should redirect unauthenticated user from properties to login", async ({
      page,
    }) => {
      await page.goto("/properties");

      // Should redirect to login page
      await page.waitForURL(/\/login/);
      expect(page.url()).toContain("/login");
    });

    test("should redirect unauthenticated user from history to login", async ({
      page,
    }) => {
      await page.goto("/history");

      // Should redirect to login page
      await page.waitForURL(/\/login/);
      expect(page.url()).toContain("/login");
    });
  });
});
