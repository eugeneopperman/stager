import { test as base, Page, BrowserContext } from "@playwright/test";
import path from "path";

// Storage state file for authenticated sessions
const AUTH_FILE = path.join(__dirname, "../.auth/user.json");

/**
 * Test credentials from environment variables
 */
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || "test@example.com",
  password: process.env.TEST_USER_PASSWORD || "testpassword123",
};

/**
 * Login helper function
 */
export async function login(page: Page, email?: string, password?: string) {
  await page.goto("/login");
  await page.getByRole("textbox", { name: /email/i }).fill(email || TEST_USER.email);
  await page.locator('input[type="password"]').fill(password || TEST_USER.password);
  await page.getByRole("button", { name: /log in|sign in/i }).click();

  // Wait for redirect to dashboard
  await page.waitForURL(/\/(dashboard|stage|properties)/, { timeout: 10000 });
}

/**
 * Test fixture that provides authentication helpers
 */
export const test = base.extend<{
  authenticatedPage: Page;
  authenticatedContext: BrowserContext;
}>({
  // Authenticated page fixture - logs in before each test
  authenticatedPage: async ({ page, context }, use) => {
    // Check if we have stored auth state
    try {
      await context.storageState({ path: AUTH_FILE });
    } catch {
      // No stored state, need to log in
    }

    // Try to go to dashboard directly first
    await page.goto("/dashboard");

    // If redirected to login, authenticate
    if (page.url().includes("/login")) {
      await login(page);
    }

    await use(page);
  },

  // Authenticated context - for tests that need fresh context
  authenticatedContext: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await login(page);

    await use(context);
    await context.close();
  },
});

export { expect } from "@playwright/test";

/**
 * Helper to wait for page to be fully loaded
 */
export async function waitForPageLoad(page: Page) {
  await page.waitForLoadState("networkidle");
}

/**
 * Helper to check if element has specific attribute
 */
export async function hasAttribute(
  page: Page,
  selector: string,
  attribute: string,
  value: string
) {
  const element = page.locator(selector);
  const attrValue = await element.getAttribute(attribute);
  return attrValue === value;
}

/**
 * Helper to wait for toast/notification
 */
export async function waitForToast(page: Page, text?: string) {
  const toast = page.locator('[role="status"], [class*="toast"], [class*="Toast"]');
  await toast.waitFor({ state: "visible", timeout: 5000 });
  if (text) {
    await expect(toast).toContainText(text);
  }
  return toast;
}

/**
 * Helper to dismiss any open dialogs/modals
 */
export async function dismissDialog(page: Page) {
  const closeButton = page.locator('[aria-label="Close"], [class*="close"]').first();
  if (await closeButton.isVisible()) {
    await closeButton.click();
  }
}

/**
 * Helper to navigate via sidebar
 */
export async function navigateViaSidebar(page: Page, linkText: string) {
  // Click on sidebar link
  const link = page.getByRole("link", { name: new RegExp(linkText, "i") });
  await link.click();
  await page.waitForLoadState("networkidle");
}

// Re-export expect for convenience
import { expect } from "@playwright/test";
