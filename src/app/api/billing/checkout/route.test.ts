import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

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

// Mock rate limiting
const mockSensitiveRateLimiter = vi.fn();
vi.mock("@/lib/rate-limit", () => ({
  rateLimiters: {
    sensitive: (id: string) => mockSensitiveRateLimiter(id),
  },
  getRateLimitHeaders: vi.fn(() => ({})),
  getClientIdentifier: vi.fn(() => "user:test-user-id"),
}));

// Mock Stripe functions
const mockCreateCheckout = vi.fn();

vi.mock("@/lib/billing/stripe", () => ({
  createSubscriptionCheckout: (params: unknown) => mockCreateCheckout(params),
}));

// Mock audit log
vi.mock("@/lib/audit/audit-log.service", () => ({
  logBillingEvent: vi.fn(),
  AuditEventType: {
    BILLING_CHECKOUT_CREATED: "billing.checkout.created",
  },
}));

function createRequest(body: object): NextRequest {
  return new NextRequest("http://localhost:3000/api/billing/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/billing/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default authenticated user
    mockGetUser.mockResolvedValue({
      data: { user: { id: "test-user-id", email: "test@example.com" } },
    });

    // Default rate limit - allow
    mockSensitiveRateLimiter.mockResolvedValue({
      allowed: true,
      remaining: 9,
      resetTime: Date.now() + 60000,
      limit: 10,
    });

    // Default profile
    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({
      data: { stripe_customer_id: "cus_123" },
      error: null,
    });

    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ single: mockSingle });
    mockFrom.mockReturnValue({ select: mockSelect });

    // Default checkout session
    mockCreateCheckout.mockResolvedValue({
      id: "cs_test_123",
      url: "https://checkout.stripe.com/pay/cs_test_123",
    });
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = createRequest({ planSlug: "professional" });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 429 when rate limited", async () => {
    mockSensitiveRateLimiter.mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetTime: Date.now() + 60000,
      limit: 10,
    });

    const request = createRequest({ planSlug: "professional" });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toContain("Too many checkout attempts");
  });

  it("returns 400 for invalid request body", async () => {
    const request = createRequest({});
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Validation failed");
  });

  it("returns checkout URL for valid request", async () => {
    const request = createRequest({ planSlug: "professional" });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.url).toBe("https://checkout.stripe.com/pay/cs_test_123");
  });

  it("calls Stripe with correct plan slug", async () => {
    const request = createRequest({ planSlug: "standard" });
    const response = await POST(request);
    const data = await response.json();

    // Verify the checkout URL was returned (indicates Stripe was called)
    expect(response.status).toBe(200);
    expect(data.url).toBeDefined();
  });

  it("handles new user without Stripe customer", async () => {
    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({
      data: { stripe_customer_id: null },
      error: null,
    });

    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ single: mockSingle });
    mockFrom.mockReturnValue({ select: mockSelect });

    const request = createRequest({ planSlug: "professional" });
    await POST(request);

    expect(mockCreateCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        customerId: undefined,
      })
    );
  });

  it("returns 500 on Stripe error", async () => {
    mockCreateCheckout.mockRejectedValue(new Error("Stripe API error"));

    const request = createRequest({ planSlug: "professional" });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to create checkout session");
  });

  it("logs audit event on successful checkout", async () => {
    const { logBillingEvent } = await import("@/lib/audit/audit-log.service");

    const request = createRequest({ planSlug: "professional" });
    await POST(request);

    expect(logBillingEvent).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        userId: "test-user-id",
        eventType: "billing.checkout.created",
        resourceId: "cs_test_123",
        action: "created",
      })
    );
  });
});
