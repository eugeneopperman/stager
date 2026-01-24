import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, PATCH } from "./route";

// Mock dependencies
const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      from: mockFrom,
    })
  ),
}));

// Mock billing functions
const mockGetUserSubscription = vi.fn();
const mockGetUserPlan = vi.fn();
const mockGetUserCredits = vi.fn();

vi.mock("@/lib/billing/subscription", () => ({
  getUserSubscription: () => mockGetUserSubscription(),
  getUserPlan: () => mockGetUserPlan(),
  getUserCredits: () => mockGetUserCredits(),
}));

// Mock Stripe functions
const mockCancelSubscription = vi.fn();
const mockResumeSubscription = vi.fn();

vi.mock("@/lib/billing/stripe", () => ({
  cancelSubscriptionAtPeriodEnd: () => mockCancelSubscription(),
  resumeSubscription: () => mockResumeSubscription(),
}));

describe("GET /api/billing/subscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default authenticated user
    mockGetUser.mockResolvedValue({
      data: { user: { id: "test-user-id" } },
    });

    // Default subscription data
    mockGetUserSubscription.mockResolvedValue({
      id: "sub_123",
      status: "active",
      currentPeriodEnd: "2024-02-15T00:00:00Z",
      cancelAtPeriodEnd: false,
    });

    mockGetUserPlan.mockResolvedValue({
      name: "Professional",
      slug: "professional",
      monthlyCredits: 50,
      maxTeamMembers: 5,
    });

    mockGetUserCredits.mockResolvedValue({
      available: 45,
      allocated: 50,
      used: 5,
    });
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = new NextRequest("http://localhost:3000/api/billing/subscription");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns subscription, plan, and credits for authenticated user", async () => {
    const request = new NextRequest("http://localhost:3000/api/billing/subscription");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.subscription).toBeDefined();
    expect(data.plan).toBeDefined();
    expect(data.credits).toBeDefined();
    expect(data.subscription.status).toBe("active");
    expect(data.plan.slug).toBe("professional");
    expect(data.credits.available).toBe(45);
  });

  it("handles user with no subscription", async () => {
    mockGetUserSubscription.mockResolvedValue(null);
    mockGetUserPlan.mockResolvedValue(null);
    mockGetUserCredits.mockResolvedValue({
      available: 5,
      allocated: 5,
      used: 0,
    });

    const request = new NextRequest("http://localhost:3000/api/billing/subscription");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.subscription).toBeNull();
    expect(data.plan).toBeNull();
    expect(data.credits.available).toBe(5);
  });

  it("returns 500 on internal error", async () => {
    mockGetUserSubscription.mockRejectedValue(new Error("Database error"));

    const request = new NextRequest("http://localhost:3000/api/billing/subscription");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to fetch subscription");
  });
});

describe("PATCH /api/billing/subscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default authenticated user
    mockGetUser.mockResolvedValue({
      data: { user: { id: "test-user-id" } },
    });

    // Default subscription exists
    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({
      data: {
        stripe_subscription_id: "sub_123",
        cancel_at_period_end: false,
      },
      error: null,
    });
    const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });

    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ single: mockSingle });

    mockFrom.mockReturnValue({
      select: mockSelect,
      update: mockUpdate,
    });

    mockCancelSubscription.mockResolvedValue(undefined);
    mockResumeSubscription.mockResolvedValue(undefined);
  });

  function createRequest(body: object): NextRequest {
    return new NextRequest("http://localhost:3000/api/billing/subscription", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = createRequest({ action: "cancel" });
    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 400 for invalid action", async () => {
    const request = createRequest({ action: "invalid" });
    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Validation failed");
  });

  it("cancels subscription successfully", async () => {
    const request = createRequest({ action: "cancel" });
    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain("cancel");
    expect(mockCancelSubscription).toHaveBeenCalled();
  });

  it("resumes subscription successfully", async () => {
    const request = createRequest({ action: "resume" });
    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain("resumed");
    expect(mockResumeSubscription).toHaveBeenCalled();
  });

  it("returns 400 when no subscription exists", async () => {
    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "Not found" },
    });

    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ single: mockSingle });
    mockFrom.mockReturnValue({ select: mockSelect });

    const request = createRequest({ action: "cancel" });
    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("No active subscription found");
  });

  it("returns 500 on Stripe error", async () => {
    mockCancelSubscription.mockRejectedValue(new Error("Stripe error"));

    const request = createRequest({ action: "cancel" });
    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to update subscription");
  });
});
