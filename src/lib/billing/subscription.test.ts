import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getUserSubscription,
  getUserPlan,
  getPlans,
  getUserCredits,
  deductCredits,
  addCredits,
  resetCreditsForRenewal,
  logCreditTransaction,
  upsertSubscription,
  getPlanBySlug,
  isEnterprisePlan,
  getUserOrganization,
} from "./subscription";

// Mock Supabase client
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockUpsert = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockOrder = vi.fn();

const createMockChain = () => ({
  select: mockSelect.mockReturnThis(),
  insert: mockInsert.mockReturnThis(),
  update: mockUpdate.mockReturnThis(),
  upsert: mockUpsert.mockReturnThis(),
  delete: mockDelete.mockReturnThis(),
  eq: mockEq.mockReturnThis(),
  single: mockSingle,
  order: mockOrder.mockReturnThis(),
});

const mockFrom = vi.fn();
const mockSupabase = {
  from: mockFrom,
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

describe("subscription utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue(createMockChain());
  });

  describe("getUserSubscription", () => {
    it("should return null when no subscription exists", async () => {
      mockSingle.mockResolvedValue({ data: null, error: { code: "PGRST116" } });

      const result = await getUserSubscription("user-123");
      expect(result).toBeNull();
      expect(mockFrom).toHaveBeenCalledWith("subscriptions");
    });

    it("should return subscription with plan when it exists", async () => {
      const mockSubscription = {
        id: "sub-123",
        user_id: "user-123",
        status: "active",
        plan: { id: "plan-123", slug: "professional", credits_per_month: 150 },
      };
      mockSingle.mockResolvedValue({ data: mockSubscription, error: null });

      const result = await getUserSubscription("user-123");
      expect(result).toEqual(mockSubscription);
    });
  });

  describe("getUserPlan", () => {
    it("should return free plan when no active subscription", async () => {
      const freePlan = { id: "free-plan", slug: "free", credits_per_month: 5 };

      // First call for subscription returns null
      mockSingle
        .mockResolvedValueOnce({ data: null, error: { code: "PGRST116" } })
        // Second call for free plan
        .mockResolvedValueOnce({ data: freePlan, error: null });

      const result = await getUserPlan("user-123");
      expect(result).toEqual(freePlan);
    });

    it("should return subscription plan when active subscription exists", async () => {
      const plan = { id: "plan-123", slug: "professional", credits_per_month: 150 };
      const mockSubscription = {
        id: "sub-123",
        user_id: "user-123",
        status: "active",
        plan,
      };
      mockSingle.mockResolvedValue({ data: mockSubscription, error: null });

      const result = await getUserPlan("user-123");
      expect(result).toEqual(plan);
    });

    it("should return free plan when subscription is not active", async () => {
      const freePlan = { id: "free-plan", slug: "free", credits_per_month: 5 };
      const mockSubscription = {
        id: "sub-123",
        user_id: "user-123",
        status: "canceled",
        plan: { id: "plan-123", slug: "professional" },
      };

      mockSingle
        .mockResolvedValueOnce({ data: mockSubscription, error: null })
        .mockResolvedValueOnce({ data: freePlan, error: null });

      const result = await getUserPlan("user-123");
      expect(result).toEqual(freePlan);
    });
  });

  describe("getPlans", () => {
    it("should return empty array on error", async () => {
      mockOrder.mockReturnValue({
        then: (cb: (value: { data: null; error: Error }) => void) =>
          cb({ data: null, error: new Error("DB error") }),
      });
      mockFrom.mockReturnValue({
        select: mockSelect.mockReturnValue({
          eq: mockEq.mockReturnValue({
            order: mockOrder,
          }),
        }),
      });

      // Simulate promise resolution
      mockOrder.mockResolvedValue({ data: null, error: new Error("DB error") });

      const result = await getPlans();
      expect(result).toEqual([]);
    });

    it("should return sorted active plans", async () => {
      const plans = [
        { id: "1", slug: "free", sort_order: 0 },
        { id: "2", slug: "standard", sort_order: 1 },
        { id: "3", slug: "professional", sort_order: 2 },
      ];

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: plans, error: null }),
          }),
        }),
      });

      const result = await getPlans();
      expect(result).toEqual(plans);
    });
  });

  describe("getUserCredits", () => {
    it("should return team member credits when user is part of organization", async () => {
      const membership = {
        id: "member-123",
        allocated_credits: 50,
        credits_used_this_period: 20,
      };

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: membership, error: null }),
          }),
        }),
      });

      const result = await getUserCredits("user-123");
      expect(result).toEqual({
        available: 30, // 50 - 20
        allocated: 50,
        used: 20,
        isTeamMember: true,
      });
    });

    it("should return personal credits when user is not in organization", async () => {
      const profile = { credits_remaining: 100 };

      mockFrom
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: profile, error: null }),
            }),
          }),
        });

      const result = await getUserCredits("user-123");
      expect(result).toEqual({
        available: 100,
        allocated: 0,
        used: 0,
        isTeamMember: false,
      });
    });

    it("should return 0 available when team member credits are exhausted", async () => {
      const membership = {
        id: "member-123",
        allocated_credits: 50,
        credits_used_this_period: 60, // Used more than allocated
      };

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: membership, error: null }),
          }),
        }),
      });

      const result = await getUserCredits("user-123");
      expect(result.available).toBe(0); // Math.max(0, -10) = 0
    });

    it("should return 0 available when no profile exists", async () => {
      mockFrom
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
            }),
          }),
        });

      const result = await getUserCredits("user-123");
      expect(result.available).toBe(0);
    });
  });

  describe("deductCredits", () => {
    it("should deduct from team member credits when in organization", async () => {
      const membership = {
        id: "member-123",
        allocated_credits: 50,
        credits_used_this_period: 20,
      };

      mockFrom
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: membership, error: null }),
            }),
          }),
        })
        .mockReturnValueOnce({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        });

      const result = await deductCredits("user-123", 10);
      expect(result).toBe(true);
    });

    it("should return false when team member has insufficient credits", async () => {
      const membership = {
        id: "member-123",
        allocated_credits: 50,
        credits_used_this_period: 45,
      };

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: membership, error: null }),
          }),
        }),
      });

      const result = await deductCredits("user-123", 10); // Only 5 available
      expect(result).toBe(false);
    });

    it("should deduct from personal credits when not in organization", async () => {
      const profile = { credits_remaining: 100 };

      mockFrom
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: profile, error: null }),
            }),
          }),
        })
        .mockReturnValueOnce({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        });

      const result = await deductCredits("user-123", 25);
      expect(result).toBe(true);
    });

    it("should return false when personal credits insufficient", async () => {
      const profile = { credits_remaining: 10 };

      mockFrom
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: profile, error: null }),
            }),
          }),
        });

      const result = await deductCredits("user-123", 25);
      expect(result).toBe(false);
    });

    it("should return false when no profile exists", async () => {
      mockFrom
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
            }),
          }),
        });

      const result = await deductCredits("user-123", 10);
      expect(result).toBe(false);
    });
  });

  describe("addCredits", () => {
    it("should add credits to user profile", async () => {
      const profile = { credits_remaining: 50 };

      mockFrom
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: profile, error: null }),
            }),
          }),
        })
        .mockReturnValueOnce({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        });

      const result = await addCredits("user-123", 25);
      expect(result).toBe(true);
    });

    it("should return false when profile does not exist", async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
          }),
        }),
      });

      const result = await addCredits("user-123", 25);
      expect(result).toBe(false);
    });

    it("should return false on update error", async () => {
      const profile = { credits_remaining: 50 };

      mockFrom
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: profile, error: null }),
            }),
          }),
        })
        .mockReturnValueOnce({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: new Error("Update failed") }),
          }),
        });

      const result = await addCredits("user-123", 25);
      expect(result).toBe(false);
    });
  });

  describe("resetCreditsForRenewal", () => {
    it("should reset organization credits when user is org owner", async () => {
      const org = { id: "org-123" };

      mockFrom
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: org, error: null }),
            }),
          }),
        })
        .mockReturnValueOnce({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        })
        .mockReturnValueOnce({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        });

      const result = await resetCreditsForRenewal("user-123", 150);
      expect(result).toBe(true);
    });

    it("should reset personal credits when not org owner", async () => {
      mockFrom
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
            }),
          }),
        })
        .mockReturnValueOnce({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        });

      const result = await resetCreditsForRenewal("user-123", 60);
      expect(result).toBe(true);
    });
  });

  describe("logCreditTransaction", () => {
    it("should insert credit transaction", async () => {
      mockFrom.mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: null }),
      });

      await logCreditTransaction({
        userId: "user-123",
        type: "topup_purchase",
        amount: 25,
        balanceAfter: 75,
        description: "Purchased 25 credits",
      });

      expect(mockFrom).toHaveBeenCalledWith("credit_transactions");
    });

    it("should support organization transactions", async () => {
      mockFrom.mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: null }),
      });

      await logCreditTransaction({
        organizationId: "org-123",
        type: "subscription_renewal",
        amount: 150,
        balanceAfter: 150,
      });

      expect(mockFrom).toHaveBeenCalledWith("credit_transactions");
    });
  });

  describe("upsertSubscription", () => {
    it("should create new subscription", async () => {
      const newSub = {
        id: "sub-123",
        user_id: "user-123",
        plan_id: "plan-456",
        status: "active",
      };

      mockFrom.mockReturnValue({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: newSub, error: null }),
          }),
        }),
      });

      const result = await upsertSubscription({
        userId: "user-123",
        planId: "plan-456",
        stripeSubscriptionId: "sub_stripe_123",
        stripeCustomerId: "cus_stripe_123",
        status: "active",
      });

      expect(result).toEqual(newSub);
    });

    it("should return null on error", async () => {
      mockFrom.mockReturnValue({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: new Error("Upsert failed") }),
          }),
        }),
      });

      const result = await upsertSubscription({
        userId: "user-123",
        planId: "plan-456",
        stripeSubscriptionId: "sub_stripe_123",
        stripeCustomerId: "cus_stripe_123",
        status: "active",
      });

      expect(result).toBeNull();
    });
  });

  describe("getPlanBySlug", () => {
    it("should return plan when found", async () => {
      const plan = { id: "plan-123", slug: "professional", credits_per_month: 150 };

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: plan, error: null }),
          }),
        }),
      });

      const result = await getPlanBySlug("professional");
      expect(result).toEqual(plan);
    });

    it("should return null when plan not found", async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
          }),
        }),
      });

      const result = await getPlanBySlug("nonexistent");
      expect(result).toBeNull();
    });
  });

  describe("isEnterprisePlan", () => {
    it("should return true for enterprise plan", async () => {
      const plan = { id: "plan-123", slug: "enterprise", credits_per_month: 500 };

      // Mock getUserSubscription -> null (no subscription)
      mockFrom
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
            }),
          }),
        })
        // Mock getUserPlan -> free plan lookup returns enterprise (simulating active sub)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: plan, error: null }),
            }),
          }),
        });

      const result = await isEnterprisePlan("user-123");
      expect(result).toBe(true);
    });

    it("should return false for non-enterprise plan", async () => {
      const plan = { id: "plan-123", slug: "standard", credits_per_month: 60 };

      mockFrom
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: plan, error: null }),
            }),
          }),
        });

      const result = await isEnterprisePlan("user-123");
      expect(result).toBe(false);
    });
  });

  describe("getUserOrganization", () => {
    it("should return owned organization with members", async () => {
      const org = { id: "org-123", name: "Test Org", owner_id: "user-123" };
      const members = [
        { id: "member-1", user_id: "user-456", profile: { id: "user-456", full_name: "John Doe" } },
      ];

      mockFrom
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: org, error: null }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: members, error: null }),
          }),
        });

      const result = await getUserOrganization("user-123");
      expect(result?.role).toBe("owner");
      expect(result?.organization.id).toBe("org-123");
      expect(result?.organization.members).toEqual(members);
    });

    it("should return organization membership when user is member", async () => {
      const membership = { id: "member-1", user_id: "user-123", organization_id: "org-456", role: "member" };
      const org = { id: "org-456", name: "Other Org" };
      const members = [membership];

      mockFrom
        // First: check if owner (returns null)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
            }),
          }),
        })
        // Second: check if member
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: membership, error: null }),
            }),
          }),
        })
        // Third: fetch organization
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: org, error: null }),
            }),
          }),
        })
        // Fourth: fetch all members
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: members, error: null }),
          }),
        });

      const result = await getUserOrganization("user-123");
      expect(result?.role).toBe("member");
      expect(result?.organization.id).toBe("org-456");
    });

    it("should return null when user has no organization", async () => {
      mockFrom
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
            }),
          }),
        });

      const result = await getUserOrganization("user-123");
      expect(result).toBeNull();
    });
  });
});
