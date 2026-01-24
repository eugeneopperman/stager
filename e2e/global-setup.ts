import { chromium, FullConfig } from "@playwright/test";
import path from "path";

const AUTH_FILE = path.join(__dirname, ".auth/user.json");

/**
 * Global setup for Playwright E2E tests
 *
 * This runs once before all tests and handles authentication.
 * The auth state is saved and reused across all authenticated tests.
 */
async function globalSetup(config: FullConfig) {
  // Skip auth setup if no test credentials
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    console.log("⚠️  TEST_USER_EMAIL and TEST_USER_PASSWORD not set");
    console.log("   Authenticated tests will be skipped");
    console.log("   Set these in .env.local or environment to run full test suite");
    return;
  }

  const baseURL = config.projects[0]?.use?.baseURL || "http://localhost:3000";

  console.log("🔐 Setting up authentication...");

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to login
    await page.goto(`${baseURL}/login`);

    // Fill login form
    await page.getByRole("textbox", { name: /email/i }).fill(email);
    await page.locator('input[type="password"]').fill(password);

    // Submit
    await page.getByRole("button", { name: /log in|sign in/i }).click();

    // Wait for successful redirect
    await page.waitForURL(/\/(dashboard|stage|properties|history)/, {
      timeout: 15000
    });

    // Save auth state
    await context.storageState({ path: AUTH_FILE });
    console.log("✅ Authentication state saved");

  } catch (error) {
    console.error("❌ Authentication setup failed:", error);
    console.log("   Authenticated tests may fail or be skipped");
  } finally {
    await browser.close();
  }
}

export default globalSetup;
