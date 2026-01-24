import { test as base, Page } from "@playwright/test";

/**
 * Test fixture that provides authentication helpers
 */
export const test = base.extend<{
  authenticatedPage: Page;
}>({
  // This fixture would be used with actual test credentials
  // For now, it's a placeholder for future authenticated tests
  authenticatedPage: async ({ page }, use) => {
    // In a real scenario, you would:
    // 1. Set up test credentials in environment variables
    // 2. Log in programmatically
    // 3. Store session/cookies
    //
    // Example implementation:
    // await page.goto('/login');
    // await page.getByRole('textbox', { name: /email/i }).fill(process.env.TEST_USER_EMAIL!);
    // await page.locator('input[type="password"]').fill(process.env.TEST_USER_PASSWORD!);
    // await page.getByRole('button', { name: /log in/i }).click();
    // await page.waitForURL('/dashboard');

    await use(page);
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
