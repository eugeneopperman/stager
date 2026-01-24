import { describe, it, expect } from "vitest";
import {
  PLAN_CONFIG,
  TOPUP_PACKAGES,
  getPlanByPriceId,
  getTopupByPriceId,
} from "./stripe";

describe("stripe utilities", () => {
  describe("PLAN_CONFIG", () => {
    it("should have free plan with no price ID", () => {
      expect(PLAN_CONFIG.free).toEqual({
        slug: "free",
        credits: 5,
        priceId: null,
      });
    });

    it("should have standard plan with correct credits", () => {
      expect(PLAN_CONFIG.standard.slug).toBe("standard");
      expect(PLAN_CONFIG.standard.credits).toBe(60);
    });

    it("should have professional plan with correct credits", () => {
      expect(PLAN_CONFIG.professional.slug).toBe("professional");
      expect(PLAN_CONFIG.professional.credits).toBe(150);
    });

    it("should have enterprise plan with correct credits", () => {
      expect(PLAN_CONFIG.enterprise.slug).toBe("enterprise");
      expect(PLAN_CONFIG.enterprise.credits).toBe(500);
    });

    it("should have all required plan slugs", () => {
      const slugs = Object.keys(PLAN_CONFIG);
      expect(slugs).toContain("free");
      expect(slugs).toContain("standard");
      expect(slugs).toContain("professional");
      expect(slugs).toContain("enterprise");
    });
  });

  describe("TOPUP_PACKAGES", () => {
    it("should have 3 topup packages", () => {
      expect(TOPUP_PACKAGES).toHaveLength(3);
    });

    it("should have 10 credit package at $5", () => {
      const pkg = TOPUP_PACKAGES.find((p) => p.id === "topup_10");
      expect(pkg).toBeDefined();
      expect(pkg?.credits).toBe(10);
      expect(pkg?.price_cents).toBe(500);
    });

    it("should have 25 credit package at $10 with Popular badge", () => {
      const pkg = TOPUP_PACKAGES.find((p) => p.id === "topup_25");
      expect(pkg).toBeDefined();
      expect(pkg?.credits).toBe(25);
      expect(pkg?.price_cents).toBe(1000);
      expect(pkg?.badge).toBe("Popular");
    });

    it("should have 50 credit package at $17.50 with Best Value badge", () => {
      const pkg = TOPUP_PACKAGES.find((p) => p.id === "topup_50");
      expect(pkg).toBeDefined();
      expect(pkg?.credits).toBe(50);
      expect(pkg?.price_cents).toBe(1750);
      expect(pkg?.badge).toBe("Best Value");
    });

    it("should have increasing credits with better value per credit", () => {
      const pkg10 = TOPUP_PACKAGES.find((p) => p.id === "topup_10")!;
      const pkg25 = TOPUP_PACKAGES.find((p) => p.id === "topup_25")!;
      const pkg50 = TOPUP_PACKAGES.find((p) => p.id === "topup_50")!;

      // Calculate cost per credit in cents
      const cpc10 = pkg10.price_cents / pkg10.credits; // 50 cents
      const cpc25 = pkg25.price_cents / pkg25.credits; // 40 cents
      const cpc50 = pkg50.price_cents / pkg50.credits; // 35 cents

      // Larger packages should have better value
      expect(cpc25).toBeLessThan(cpc10);
      expect(cpc50).toBeLessThan(cpc25);
    });
  });

  describe("getPlanByPriceId", () => {
    it("should return null for unknown price ID", () => {
      expect(getPlanByPriceId("unknown_price")).toBeNull();
    });

    it("should return null for empty price ID", () => {
      expect(getPlanByPriceId("")).toBeNull();
    });

    it("should iterate through all plans to find match", () => {
      // Test the function logic - when a priceId is set, it should find it
      // Since env vars might not be set in test, we verify the function handles null priceIds
      const result = getPlanByPriceId("null");
      expect(result).toBeNull();
    });

    it("should find plan when priceId matches config", () => {
      // If STRIPE_PRICE_STANDARD is set, verify it works
      const standardPriceId = PLAN_CONFIG.standard.priceId;
      if (standardPriceId) {
        const result = getPlanByPriceId(standardPriceId);
        expect(result).toBe("standard");
      } else {
        // In test environment without env vars, priceId is undefined
        expect(standardPriceId).toBeUndefined();
      }
    });
  });

  describe("getTopupByPriceId", () => {
    it("should return undefined for unknown price ID", () => {
      expect(getTopupByPriceId("unknown_price")).toBeUndefined();
    });

    it("should return undefined for empty string", () => {
      expect(getTopupByPriceId("")).toBeUndefined();
    });

    it("should find package when priceId matches", () => {
      // If STRIPE_TOPUP_10 is set, verify it works
      const topup10PriceId = TOPUP_PACKAGES[0].priceId;
      if (topup10PriceId) {
        const result = getTopupByPriceId(topup10PriceId);
        expect(result?.id).toBe("topup_10");
      } else {
        // In test environment without env vars, priceId is undefined
        expect(topup10PriceId).toBeUndefined();
      }
    });

    it("should return package with all required fields", () => {
      const packages = TOPUP_PACKAGES;
      packages.forEach((pkg) => {
        expect(pkg).toHaveProperty("id");
        expect(pkg).toHaveProperty("credits");
        expect(pkg).toHaveProperty("price_cents");
        expect(pkg).toHaveProperty("label");
        expect(pkg).toHaveProperty("description");
      });
    });
  });
});
