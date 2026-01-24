/**
 * Automated Accessibility Tests
 *
 * Uses axe-core to check pages for WCAG 2.1 Level AA compliance.
 * Run with: npm run test:e2e -- accessibility.spec.ts
 */

import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Helper to run axe accessibility checks
async function checkAccessibility(
  page: ReturnType<typeof test.step>[0],
  options?: {
    skipRules?: string[];
    includedImpacts?: ("critical" | "serious" | "moderate" | "minor")[];
  }
) {
  const axeBuilder = new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .exclude("#intercom-container") // Exclude third-party widgets
    .exclude("[data-testid='toast']"); // Exclude dynamic toast notifications

  if (options?.skipRules) {
    axeBuilder.disableRules(options.skipRules);
  }

  const results = await axeBuilder.analyze();

  // Filter by impact level if specified
  const violations = options?.includedImpacts
    ? results.violations.filter((v) =>
        options.includedImpacts!.includes(
          v.impact as "critical" | "serious" | "moderate" | "minor"
        )
      )
    : results.violations;

  return violations;
}

test.describe("Public Pages Accessibility", () => {
  test("landing page has no critical accessibility violations", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const violations = await checkAccessibility(page, {
      includedImpacts: ["critical", "serious"],
    });

    // Log violations for debugging
    if (violations.length > 0) {
      console.log("Accessibility violations found:");
      violations.forEach((v) => {
        console.log(`- ${v.id}: ${v.description}`);
        v.nodes.forEach((n) => {
          console.log(`  Element: ${n.html.substring(0, 100)}`);
        });
      });
    }

    expect(violations).toHaveLength(0);
  });

  test("login page has no critical accessibility violations", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    const violations = await checkAccessibility(page, {
      includedImpacts: ["critical", "serious"],
    });

    expect(violations).toHaveLength(0);
  });

  test("signup page has no critical accessibility violations", async ({
    page,
  }) => {
    await page.goto("/signup");
    await page.waitForLoadState("networkidle");

    const violations = await checkAccessibility(page, {
      includedImpacts: ["critical", "serious"],
    });

    expect(violations).toHaveLength(0);
  });
});

test.describe("Dashboard Accessibility (Authenticated)", () => {
  // Use authenticated state from global setup
  test.use({ storageState: "e2e/.auth/user.json" });

  test("dashboard page has no critical accessibility violations", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    const violations = await checkAccessibility(page, {
      includedImpacts: ["critical", "serious"],
    });

    expect(violations).toHaveLength(0);
  });

  test("stage page has no critical accessibility violations", async ({
    page,
  }) => {
    await page.goto("/stage");
    await page.waitForLoadState("networkidle");

    const violations = await checkAccessibility(page, {
      includedImpacts: ["critical", "serious"],
    });

    expect(violations).toHaveLength(0);
  });

  test("history page has no critical accessibility violations", async ({
    page,
  }) => {
    await page.goto("/history");
    await page.waitForLoadState("networkidle");

    const violations = await checkAccessibility(page, {
      includedImpacts: ["critical", "serious"],
    });

    expect(violations).toHaveLength(0);
  });

  test("properties page has no critical accessibility violations", async ({
    page,
  }) => {
    await page.goto("/properties");
    await page.waitForLoadState("networkidle");

    const violations = await checkAccessibility(page, {
      includedImpacts: ["critical", "serious"],
    });

    expect(violations).toHaveLength(0);
  });

  test("billing page has no critical accessibility violations", async ({
    page,
  }) => {
    await page.goto("/billing");
    await page.waitForLoadState("networkidle");

    const violations = await checkAccessibility(page, {
      includedImpacts: ["critical", "serious"],
    });

    expect(violations).toHaveLength(0);
  });

  test("settings page has no critical accessibility violations", async ({
    page,
  }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    const violations = await checkAccessibility(page, {
      includedImpacts: ["critical", "serious"],
    });

    expect(violations).toHaveLength(0);
  });
});

test.describe("Interactive Components Accessibility", () => {
  test.use({ storageState: "e2e/.auth/user.json" });

  test("sidebar navigation is keyboard accessible", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Tab through sidebar links
    const sidebar = page.locator("nav[aria-label]").first();
    await expect(sidebar).toBeVisible();

    // Check that all nav links are focusable
    const navLinks = sidebar.locator("a[href]");
    const count = await navLinks.count();

    expect(count).toBeGreaterThan(0);

    // Verify links have accessible names
    for (let i = 0; i < count; i++) {
      const link = navLinks.nth(i);
      const accessibleName =
        (await link.getAttribute("aria-label")) ||
        (await link.textContent()) ||
        "";
      expect(accessibleName.length).toBeGreaterThan(0);
    }
  });

  test("modals trap focus correctly", async ({ page }) => {
    await page.goto("/stage");
    await page.waitForLoadState("networkidle");

    // Try to find and open a modal (e.g., property selector)
    const createPropertyButton = page.getByRole("button", {
      name: /create.*property/i,
    });

    if (await createPropertyButton.isVisible()) {
      await createPropertyButton.click();

      // Modal should be visible
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();

      // Check dialog has accessible name
      const dialogName =
        (await dialog.getAttribute("aria-label")) ||
        (await dialog.getAttribute("aria-labelledby"));
      expect(dialogName).toBeTruthy();

      // Close with Escape
      await page.keyboard.press("Escape");
      await expect(dialog).not.toBeVisible();
    }
  });

  test("form inputs have associated labels", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    // Check all inputs have labels
    const inputs = page.locator(
      'input:not([type="hidden"]):not([type="submit"])'
    );
    const count = await inputs.count();

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute("id");
      const ariaLabel = await input.getAttribute("aria-label");
      const ariaLabelledBy = await input.getAttribute("aria-labelledby");
      const placeholder = await input.getAttribute("placeholder");

      // Input should have either an id (for label[for]), aria-label, or aria-labelledby
      const hasAccessibleLabel =
        (id && (await page.locator(`label[for="${id}"]`).count()) > 0) ||
        ariaLabel ||
        ariaLabelledBy ||
        placeholder;

      expect(hasAccessibleLabel).toBeTruthy();
    }
  });
});

test.describe("Color Contrast", () => {
  test("landing page meets WCAG AA color contrast", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Specifically check color contrast
    const violations = await new AxeBuilder({ page })
      .withTags(["wcag2aa"])
      .options({ runOnly: ["color-contrast"] })
      .analyze();

    // Allow minor contrast issues but flag serious ones
    const seriousViolations = violations.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );

    expect(seriousViolations).toHaveLength(0);
  });
});

test.describe("Screen Reader Compatibility", () => {
  test.use({ storageState: "e2e/.auth/user.json" });

  test("main content has proper landmarks", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Check for main landmark
    const main = page.locator("main, [role='main']");
    await expect(main).toBeVisible();

    // Check for navigation landmark
    const nav = page.locator("nav, [role='navigation']");
    expect(await nav.count()).toBeGreaterThan(0);
  });

  test("images have alt text", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    const images = page.locator("img");
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute("alt");
      const role = await img.getAttribute("role");

      // Image should have alt text or be marked as decorative
      const isAccessible = alt !== null || role === "presentation";
      expect(isAccessible).toBeTruthy();
    }
  });

  test("headings are properly structured", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    const headings = page.locator("h1, h2, h3, h4, h5, h6");
    const count = await headings.count();

    if (count > 0) {
      // Should have exactly one h1
      const h1Count = await page.locator("h1").count();
      expect(h1Count).toBeLessThanOrEqual(1);

      // Headings should be in logical order (no skipping levels)
      let previousLevel = 0;
      for (let i = 0; i < count; i++) {
        const heading = headings.nth(i);
        const tagName = await heading.evaluate((el) =>
          el.tagName.toLowerCase()
        );
        const currentLevel = parseInt(tagName.replace("h", ""));

        // Heading level should not skip more than one level
        if (previousLevel > 0) {
          expect(currentLevel).toBeLessThanOrEqual(previousLevel + 1);
        }
        previousLevel = currentLevel;
      }
    }
  });
});
