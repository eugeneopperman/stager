import { defineConfig, devices } from "@playwright/test";
import path from "path";

const AUTH_FILE = path.join(__dirname, "e2e/.auth/user.json");

/**
 * Playwright configuration for E2E tests
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./e2e",
  // Run tests in files in parallel
  fullyParallel: true,
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  // Reporter to use
  reporter: [["html", { open: "never" }], ["list"]],

  // Global setup - runs once before all tests for authentication
  globalSetup: "./e2e/global-setup.ts",

  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    // Collect trace when retrying the failed test
    trace: "on-first-retry",
    // Screenshot on failure
    screenshot: "only-on-failure",
    // Viewport
    viewport: { width: 1280, height: 720 },
  },

  // Configure projects for different scenarios
  projects: [
    // Unauthenticated tests (landing, auth pages)
    {
      name: "unauthenticated",
      testMatch: /\/(auth|landing)\.spec\.ts$/,
      use: { ...devices["Desktop Chrome"] },
    },

    // Authenticated tests (dashboard, staging, properties, etc.)
    {
      name: "authenticated",
      testIgnore: /\/(auth|landing)\.spec\.ts$/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: AUTH_FILE,
      },
    },

    // Mobile tests
    {
      name: "mobile",
      testMatch: /\.mobile\.spec\.ts$/,
      use: {
        ...devices["iPhone 13"],
        storageState: AUTH_FILE,
      },
    },
  ],

  // Run local dev server before starting the tests
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
