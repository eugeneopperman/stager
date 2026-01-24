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
const mockEmailRateLimiter = vi.fn();
vi.mock("@/lib/rate-limit", () => ({
  rateLimiters: {
    email: (id: string) => mockEmailRateLimiter(id),
  },
  getRateLimitHeaders: vi.fn(() => ({})),
  getClientIdentifier: vi.fn(() => "user:test-user-id"),
}));

// Mock email functions
const mockSendTeamInvitationEmail = vi.fn();
const mockGenerateInvitationToken = vi.fn(() => "test-token-123");
const mockGetInvitationExpiryDate = vi.fn(() => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

vi.mock("@/lib/notifications/email", () => ({
  sendTeamInvitationEmail: () => mockSendTeamInvitationEmail(),
  generateInvitationToken: () => mockGenerateInvitationToken(),
  getInvitationExpiryDate: () => mockGetInvitationExpiryDate(),
}));

// Helper to create a mock request
function createMockRequest(body: object): NextRequest {
  return new NextRequest("http://localhost:3000/api/team/invite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validRequestBody = {
  email: "newmember@example.com",
  initialCredits: 5,
};

describe("POST /api/team/invite", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default authenticated user
    mockGetUser.mockResolvedValue({
      data: { user: { id: "test-user-id" } },
    });

    // Default rate limit - allow requests
    mockEmailRateLimiter.mockReturnValue({
      allowed: true,
      remaining: 2,
      resetTime: Date.now() + 300000,
      limit: 3,
    });

    // Default successful email send
    mockSendTeamInvitationEmail.mockResolvedValue(undefined);
  });

  describe("Authentication", () => {
    it("returns 401 when not authenticated", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      const request = createMockRequest(validRequestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.code).toBe("UNAUTHORIZED");
    });
  });

  describe("Rate Limiting", () => {
    it("returns 429 when email rate limited", async () => {
      mockEmailRateLimiter.mockReturnValue({
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 300000,
        limit: 3,
      });

      const request = createMockRequest(validRequestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.code).toBe("RATE_LIMITED");
    });
  });

  describe("Request Validation", () => {
    it("returns 400 for invalid email format", async () => {
      const request = createMockRequest({
        email: "invalid-email",
        initialCredits: 5,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.fields).toContainEqual(
        expect.objectContaining({ field: "email" })
      );
    });

    it("returns 400 for negative credits", async () => {
      const request = createMockRequest({
        email: "test@example.com",
        initialCredits: -5,
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.fields).toContainEqual(
        expect.objectContaining({ field: "initialCredits" })
      );
    });
  });

  describe("Organization Validation", () => {
    it("returns 403 when not organization owner", async () => {
      mockFrom.mockImplementation((table) => {
        if (table === "organizations") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: { message: "Not found" } }),
          };
        }
        return {};
      });

      const request = createMockRequest(validRequestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.code).toBe("INSUFFICIENT_PERMISSIONS");
    });
  });

  describe("Team Capacity", () => {
    it("returns 409 when team at capacity", async () => {
      mockFrom.mockImplementation((table) => {
        if (table === "organizations") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: "org-123",
                owner_id: "test-user-id",
                name: "Test Org",
                unallocated_credits: 100,
                members: [{ count: 10 }],
              },
              error: null,
            }),
          };
        }
        if (table === "subscriptions") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                plan: { max_team_members: 10 },
              },
              error: null,
            }),
          };
        }
        if (table === "team_invitations") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return {};
      });

      const request = createMockRequest(validRequestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.code).toBe("CONFLICT");
    });
  });

  describe("Credit Validation", () => {
    it("returns 400 for insufficient credits to allocate", async () => {
      mockFrom.mockImplementation((table) => {
        if (table === "organizations") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: "org-123",
                owner_id: "test-user-id",
                name: "Test Org",
                unallocated_credits: 2, // Only 2 credits available
                members: [{ count: 1 }],
              },
              error: null,
            }),
          };
        }
        if (table === "subscriptions") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                plan: { max_team_members: 10 },
              },
              error: null,
            }),
          };
        }
        if (table === "team_invitations") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return {};
      });

      const request = createMockRequest({
        email: "test@example.com",
        initialCredits: 5, // Requesting 5 but only 2 available
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Not enough unallocated credits");
    });
  });

  describe("Duplicate Checks", () => {
    it("returns 409 for duplicate pending invitation", async () => {
      mockFrom.mockImplementation((table) => {
        if (table === "organizations") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: "org-123",
                owner_id: "test-user-id",
                name: "Test Org",
                unallocated_credits: 100,
                members: [{ count: 1 }],
              },
              error: null,
            }),
          };
        }
        if (table === "subscriptions") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { plan: { max_team_members: 10 } },
              error: null,
            }),
          };
        }
        if (table === "team_invitations") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: "existing-inv", status: "pending" },
              error: null,
            }),
          };
        }
        return {};
      });

      const request = createMockRequest(validRequestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.code).toBe("ALREADY_EXISTS");
    });
  });

  describe("Invitation Creation", () => {
    const setupSuccessfulMocks = () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "new-invitation-id",
            email: "newmember@example.com",
            initial_credits: 5,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
          error: null,
        }),
      });

      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      mockFrom.mockImplementation((table) => {
        if (table === "organizations") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: "org-123",
                owner_id: "test-user-id",
                name: "Test Org",
                unallocated_credits: 100,
                members: [{ count: 1 }],
              },
              error: null,
            }),
          };
        }
        if (table === "subscriptions") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { plan: { max_team_members: 10 } },
              error: null,
            }),
          };
        }
        if (table === "team_invitations") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
            insert: mockInsert,
            delete: mockDelete,
          };
        }
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: "test-user-id", full_name: "Test Owner" },
              error: null,
            }),
          };
        }
        if (table === "organization_members") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        return {};
      });

      return { mockInsert, mockDelete };
    };

    it("creates invitation in database", async () => {
      const { mockInsert } = setupSuccessfulMocks();

      const request = createMockRequest(validRequestBody);
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockFrom).toHaveBeenCalledWith("team_invitations");
    });

    it("sends invitation email", async () => {
      setupSuccessfulMocks();

      const request = createMockRequest(validRequestBody);
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockSendTeamInvitationEmail).toHaveBeenCalled();
    });

    it("returns invitation details on success", async () => {
      setupSuccessfulMocks();

      const request = createMockRequest(validRequestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("Invitation sent successfully");
      expect(data.invitation).toBeDefined();
      expect(data.invitation.id).toBe("new-invitation-id");
      expect(data.invitation.email).toBe("newmember@example.com");
    });

    it("cleans up invitation on email failure", async () => {
      const { mockDelete } = setupSuccessfulMocks();
      mockSendTeamInvitationEmail.mockRejectedValue(new Error("Email failed"));

      const request = createMockRequest(validRequestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.code).toBe("EMAIL_ERROR");
      // Delete should be called to clean up the invitation
      expect(mockFrom).toHaveBeenCalledWith("team_invitations");
    });
  });

  describe("Database Errors", () => {
    it("handles unique constraint violation", async () => {
      mockFrom.mockImplementation((table) => {
        if (table === "organizations") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: "org-123",
                owner_id: "test-user-id",
                name: "Test Org",
                unallocated_credits: 100,
                members: [{ count: 1 }],
              },
              error: null,
            }),
          };
        }
        if (table === "subscriptions") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { plan: { max_team_members: 10 } },
              error: null,
            }),
          };
        }
        if (table === "team_invitations") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: "23505", message: "Duplicate key violation" },
              }),
            }),
          };
        }
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { full_name: "Test Owner" },
              error: null,
            }),
          };
        }
        if (table === "organization_members") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        return {};
      });

      const request = createMockRequest(validRequestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("already been invited");
    });
  });
});
