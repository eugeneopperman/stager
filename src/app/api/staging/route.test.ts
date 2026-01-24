import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

// Mock dependencies
const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockStorage = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      from: mockFrom,
      storage: { from: mockStorage },
    })
  ),
}));

// Mock rate limiting
const mockStagingRateLimiter = vi.fn();
vi.mock("@/lib/rate-limit", () => ({
  rateLimiters: {
    staging: (id: string) => mockStagingRateLimiter(id),
  },
  getRateLimitHeaders: vi.fn(() => ({})),
  getClientIdentifier: vi.fn(() => "user:test-user-id"),
}));

// Mock billing functions
const mockGetUserCredits = vi.fn();
const mockDeductCredits = vi.fn();
const mockLogCreditTransaction = vi.fn();

vi.mock("@/lib/billing/subscription", () => ({
  getUserCredits: () => mockGetUserCredits(),
  deductCredits: () => mockDeductCredits(),
  logCreditTransaction: () => mockLogCreditTransaction(),
}));

// Mock providers
const mockSyncProvider = {
  providerId: "gemini",
  supportsSync: true,
  stageImageSync: vi.fn(),
};

const mockAsyncProvider = {
  providerId: "stable-diffusion",
  supportsSync: false,
};

const mockReplicateProvider = {
  stageImageAsync: vi.fn(),
  getEstimatedProcessingTime: vi.fn(() => 30),
};

vi.mock("@/lib/providers", () => ({
  getProviderRouter: vi.fn(() => ({
    selectProvider: vi.fn(() => Promise.resolve({ provider: mockSyncProvider })),
  })),
  getReplicateProvider: vi.fn(() => mockReplicateProvider),
  Decor8Provider: class {},
}));

// Mock notifications
vi.mock("@/lib/notifications", () => ({
  createNotification: vi.fn(),
}));

// Helper to create a mock request
function createMockRequest(body: object): NextRequest {
  return new NextRequest("http://localhost:3000/api/staging", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// Valid base64 image (tiny valid PNG)
const validBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const validRequestBody = {
  image: validBase64,
  mimeType: "image/png",
  roomType: "living-room",
  style: "modern",
};

describe("POST /api/staging", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default authenticated user
    mockGetUser.mockResolvedValue({
      data: { user: { id: "test-user-id" } },
    });

    // Default rate limit - allow requests
    mockStagingRateLimiter.mockReturnValue({
      allowed: true,
      remaining: 19,
      resetTime: Date.now() + 60000,
      limit: 20,
    });

    // Default credits available
    mockGetUserCredits.mockResolvedValue({
      available: 10,
      allocated: 10,
      used: 0,
    });

    // Default successful database operations
    const mockSelect = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({
      data: { id: "test-job-id", user_id: "test-user-id" },
      error: null,
    });
    const mockInsert = vi.fn(() => ({ select: mockSelect }));
    const mockUpdate = vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) }));
    mockSelect.mockReturnValue({ single: mockSingle });

    mockFrom.mockReturnValue({
      insert: mockInsert,
      update: mockUpdate,
      select: mockSelect,
    });

    // Default storage mock
    const mockUpload = vi.fn().mockResolvedValue({ error: null });
    const mockCreateSignedUrl = vi.fn().mockResolvedValue({ data: { signedUrl: "https://example.com/signed-url" } });
    const mockGetPublicUrl = vi.fn().mockReturnValue({ data: { publicUrl: "https://example.com/public-url" } });

    mockStorage.mockReturnValue({
      upload: mockUpload,
      createSignedUrl: mockCreateSignedUrl,
      getPublicUrl: mockGetPublicUrl,
    });

    // Default successful staging
    mockSyncProvider.stageImageSync.mockResolvedValue({
      success: true,
      imageData: validBase64,
      mimeType: "image/png",
    });

    // Default successful credit deduction
    mockDeductCredits.mockResolvedValue(true);
    mockLogCreditTransaction.mockResolvedValue(undefined);
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
    it("returns 429 when rate limited", async () => {
      mockStagingRateLimiter.mockReturnValue({
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 60000,
        limit: 20,
      });

      const request = createMockRequest(validRequestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.code).toBe("RATE_LIMITED");
    });
  });

  describe("Credit Validation", () => {
    it("returns 402 when insufficient credits", async () => {
      mockGetUserCredits.mockResolvedValue({
        available: 0,
        allocated: 10,
        used: 10,
      });

      const request = createMockRequest(validRequestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(402);
      expect(data.code).toBe("INSUFFICIENT_CREDITS");
    });
  });

  describe("Request Validation", () => {
    it("returns 400 for invalid request body", async () => {
      const request = createMockRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Validation failed");
    });

    it("returns 400 for invalid mimeType", async () => {
      const request = createMockRequest({
        ...validRequestBody,
        mimeType: "image/gif",
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.fields).toContainEqual(
        expect.objectContaining({ field: "mimeType" })
      );
    });

    it("returns 400 for invalid roomType", async () => {
      const request = createMockRequest({
        ...validRequestBody,
        roomType: "invalid-room",
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.fields).toContainEqual(
        expect.objectContaining({ field: "roomType" })
      );
    });

    it("returns 400 for invalid style", async () => {
      const request = createMockRequest({
        ...validRequestBody,
        style: "invalid-style",
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.fields).toContainEqual(
        expect.objectContaining({ field: "style" })
      );
    });
  });

  describe("Job Creation", () => {
    it("creates job record in database", async () => {
      const request = createMockRequest(validRequestBody);
      await POST(request);

      expect(mockFrom).toHaveBeenCalledWith("staging_jobs");
    });

    it("uploads original image to storage", async () => {
      const request = createMockRequest(validRequestBody);
      await POST(request);

      expect(mockStorage).toHaveBeenCalledWith("staging-images");
    });
  });

  describe("Sync Provider (Gemini/Decor8)", () => {
    it("returns sync response for Gemini provider", async () => {
      const request = createMockRequest(validRequestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.async).toBe(false);
      expect(data.provider).toBe("gemini");
      expect(data.stagedImageUrl).toBeDefined();
    });

    it("deducts credits on successful staging", async () => {
      const request = createMockRequest(validRequestBody);
      await POST(request);

      expect(mockDeductCredits).toHaveBeenCalled();
      expect(mockLogCreditTransaction).toHaveBeenCalled();
    });

    it("creates completion notification", async () => {
      const { createNotification } = await import("@/lib/notifications");

      const request = createMockRequest(validRequestBody);
      await POST(request);

      expect(createNotification).toHaveBeenCalledWith(
        expect.anything(),
        "test-user-id",
        "staging_complete",
        expect.any(String),
        expect.any(String),
        expect.any(String)
      );
    });

    it("creates low-credit notification when credits <= 3", async () => {
      mockGetUserCredits.mockResolvedValue({
        available: 2,
        allocated: 10,
        used: 8,
      });

      const { createNotification } = await import("@/lib/notifications");

      const request = createMockRequest(validRequestBody);
      await POST(request);

      expect(createNotification).toHaveBeenCalledWith(
        expect.anything(),
        "test-user-id",
        "low_credits",
        expect.any(String),
        expect.any(String),
        expect.any(String)
      );
    });
  });

  describe("Provider Failure", () => {
    it("handles provider failure gracefully", async () => {
      mockSyncProvider.stageImageSync.mockResolvedValue({
        success: false,
        error: "Provider error",
      });

      const request = createMockRequest(validRequestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.code).toBe("PROVIDER_ERROR");
    });

    it("creates failure notification on error", async () => {
      mockSyncProvider.stageImageSync.mockResolvedValue({
        success: false,
        error: "Provider error",
      });

      const { createNotification } = await import("@/lib/notifications");

      const request = createMockRequest(validRequestBody);
      await POST(request);

      expect(createNotification).toHaveBeenCalledWith(
        expect.anything(),
        "test-user-id",
        "staging_failed",
        expect.any(String),
        expect.any(String),
        expect.any(String)
      );
    });
  });

  describe("Async Provider (Replicate)", () => {
    beforeEach(async () => {
      const providers = await import("@/lib/providers");
      vi.mocked(providers.getProviderRouter).mockReturnValue({
        selectProvider: vi.fn(() => Promise.resolve({ provider: mockAsyncProvider })),
      } as ReturnType<typeof providers.getProviderRouter>);

      mockReplicateProvider.stageImageAsync.mockResolvedValue({
        predictionId: "test-prediction-id",
      });
    });

    it("returns async response for Replicate provider", async () => {
      const request = createMockRequest(validRequestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.async).toBe(true);
      expect(data.provider).toBe("stable-diffusion");
      expect(data.predictionId).toBe("test-prediction-id");
      expect(data.pollUrl).toContain("/api/staging/");
    });

    it("does not deduct credits immediately for async", async () => {
      const request = createMockRequest(validRequestBody);
      await POST(request);

      expect(mockDeductCredits).not.toHaveBeenCalled();
    });
  });

  describe("Database Errors", () => {
    it("returns 500 when job creation fails", async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });
      const mockInsert = vi.fn(() => ({ select: mockSelect }));
      mockSelect.mockReturnValue({ single: mockSingle });
      mockFrom.mockReturnValue({ insert: mockInsert });

      const request = createMockRequest(validRequestBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to create staging job");
    });
  });
});
