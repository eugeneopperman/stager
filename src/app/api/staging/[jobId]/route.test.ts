import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, PATCH } from "./route";

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

// Mock Replicate provider
const mockReplicateProvider = {
  getPredictionStatus: vi.fn(),
};

vi.mock("@/lib/providers", () => ({
  getReplicateProvider: vi.fn(() => mockReplicateProvider),
}));

// Helper to create a mock GET request
function createMockGetRequest(jobId: string): NextRequest {
  return new NextRequest(`http://localhost:3000/api/staging/${jobId}`, {
    method: "GET",
  });
}

// Helper to create a mock PATCH request
function createMockPatchRequest(jobId: string, body: object): NextRequest {
  return new NextRequest(`http://localhost:3000/api/staging/${jobId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// Mock params helper
const createParams = (jobId: string) => Promise.resolve({ jobId });

describe("GET /api/staging/[jobId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default authenticated user
    mockGetUser.mockResolvedValue({
      data: { user: { id: "test-user-id" } },
    });
  });

  describe("Authentication", () => {
    it("returns 401 when not authenticated", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      const request = createMockGetRequest("test-job-id");
      const response = await GET(request, { params: createParams("test-job-id") });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });

  describe("Job Retrieval", () => {
    it("returns 404 when job not found", async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: "Not found" } }),
      });

      const request = createMockGetRequest("non-existent-job");
      const response = await GET(request, { params: createParams("non-existent-job") });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Job not found");
    });

    it("returns 404 when job belongs to different user", async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      const request = createMockGetRequest("other-user-job");
      const response = await GET(request, { params: createParams("other-user-job") });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Job not found");
    });

    it("returns job status with progress info", async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "test-job-id",
            user_id: "test-user-id",
            status: "processing",
            provider: "gemini",
            room_type: "living-room",
            style: "modern",
            original_image_url: "https://example.com/original.png",
            staged_image_url: null,
            error_message: null,
            created_at: new Date().toISOString(),
            completed_at: null,
            processing_time_ms: null,
            version_group_id: null,
            is_primary_version: true,
            parent_job_id: null,
          },
          error: null,
        }),
      });

      const request = createMockGetRequest("test-job-id");
      const response = await GET(request, { params: createParams("test-job-id") });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.jobId).toBe("test-job-id");
      expect(data.status).toBe("processing");
      expect(data.progress).toBeDefined();
      expect(data.progress.step).toBe("generating");
      expect(data.progress.stepNumber).toBe(3);
    });

    it("returns estimated time remaining for processing job", async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "test-job-id",
            user_id: "test-user-id",
            status: "processing",
            provider: "stable-diffusion",
            room_type: "living-room",
            style: "modern",
            created_at: new Date().toISOString(),
          },
          error: null,
        }),
      });

      const request = createMockGetRequest("test-job-id");
      const response = await GET(request, { params: createParams("test-job-id") });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.estimatedTimeRemaining).toBeDefined();
      expect(typeof data.estimatedTimeRemaining).toBe("number");
    });
  });

  describe("Replicate Polling", () => {
    it("polls Replicate when status is processing", async () => {
      const mockEqChain = vi.fn().mockReturnThis();
      const mockUpdate = vi.fn(() => ({ eq: mockEqChain }));
      const mockSelectChain = vi.fn().mockReturnThis();

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "test-job-id",
            user_id: "test-user-id",
            status: "processing",
            provider: "stable-diffusion",
            replicate_prediction_id: "pred-123",
            room_type: "living-room",
            style: "modern",
            created_at: new Date().toISOString(),
          },
          error: null,
        }),
        update: mockUpdate,
      });

      mockReplicateProvider.getPredictionStatus.mockResolvedValue({
        status: "processing",
        output: null,
      });

      const request = createMockGetRequest("test-job-id");
      const response = await GET(request, { params: createParams("test-job-id") });

      expect(mockReplicateProvider.getPredictionStatus).toHaveBeenCalledWith("pred-123");
      expect(response.status).toBe(200);
    });

    it("updates job on Replicate success", async () => {
      const mockUpdateEq = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn(() => ({ eq: mockUpdateEq }));

      mockFrom.mockImplementation((table) => {
        if (table === "staging_jobs") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: "test-job-id",
                user_id: "test-user-id",
                status: "processing",
                provider: "stable-diffusion",
                replicate_prediction_id: "pred-123",
                room_type: "living-room",
                style: "modern",
                created_at: new Date().toISOString(),
              },
              error: null,
            }),
            update: mockUpdate,
          };
        }
        if (table === "profiles") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { credits_remaining: 10 },
              error: null,
            }),
            update: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
          };
        }
        return {};
      });

      mockStorage.mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "https://example.com/staged.png" } }),
      });

      mockReplicateProvider.getPredictionStatus.mockResolvedValue({
        status: "succeeded",
        output: ["https://replicate.delivery/output.png"],
      });

      // Mock fetch for downloading image
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(100)),
        headers: new Headers({ "content-type": "image/png" }),
      }) as unknown as typeof fetch;

      const request = createMockGetRequest("test-job-id");
      const response = await GET(request, { params: createParams("test-job-id") });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe("completed");
      expect(data.stagedImageUrl).toBeDefined();
    });

    it("handles Replicate failure", async () => {
      const mockUpdateEq = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn(() => ({ eq: mockUpdateEq }));

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "test-job-id",
            user_id: "test-user-id",
            status: "processing",
            provider: "stable-diffusion",
            replicate_prediction_id: "pred-123",
            room_type: "living-room",
            style: "modern",
            created_at: new Date().toISOString(),
          },
          error: null,
        }),
        update: mockUpdate,
      });

      mockReplicateProvider.getPredictionStatus.mockResolvedValue({
        status: "failed",
        error: "Model error",
      });

      const request = createMockGetRequest("test-job-id");
      const response = await GET(request, { params: createParams("test-job-id") });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe("failed");
      expect(data.error).toBe("Model error");
    });
  });

  describe("Progress Calculation", () => {
    it("returns correct progress for queued status", async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "test-job-id",
            user_id: "test-user-id",
            status: "queued",
            provider: "gemini",
            room_type: "living-room",
            style: "modern",
            created_at: new Date().toISOString(),
          },
          error: null,
        }),
      });

      const request = createMockGetRequest("test-job-id");
      const response = await GET(request, { params: createParams("test-job-id") });
      const data = await response.json();

      expect(data.progress.step).toBe("queued");
      expect(data.progress.stepNumber).toBe(1);
      expect(data.progress.totalSteps).toBe(4);
    });

    it("returns correct progress for completed status", async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "test-job-id",
            user_id: "test-user-id",
            status: "completed",
            provider: "gemini",
            room_type: "living-room",
            style: "modern",
            staged_image_url: "https://example.com/staged.png",
            created_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
          },
          error: null,
        }),
      });

      const request = createMockGetRequest("test-job-id");
      const response = await GET(request, { params: createParams("test-job-id") });
      const data = await response.json();

      expect(data.progress.step).toBe("completed");
      expect(data.progress.stepNumber).toBe(4);
      expect(data.estimatedTimeRemaining).toBeNull();
    });
  });
});

describe("PATCH /api/staging/[jobId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default authenticated user
    mockGetUser.mockResolvedValue({
      data: { user: { id: "test-user-id" } },
    });
  });

  describe("Authentication", () => {
    it("returns 401 when not authenticated", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });

      const request = createMockPatchRequest("test-job-id", { action: "set-primary" });
      const response = await PATCH(request, { params: createParams("test-job-id") });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });

  describe("Action Validation", () => {
    it("returns 400 for invalid action", async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: "test-job-id", user_id: "test-user-id" },
          error: null,
        }),
      });

      const request = createMockPatchRequest("test-job-id", { action: "invalid-action" });
      const response = await PATCH(request, { params: createParams("test-job-id") });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid action");
    });
  });

  describe("Set Primary Version", () => {
    it("returns 404 for non-existent job", async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: "Not found" } }),
      });

      const request = createMockPatchRequest("non-existent-job", { action: "set-primary" });
      const response = await PATCH(request, { params: createParams("non-existent-job") });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Job not found");
    });

    it("sets primary version successfully without version group", async () => {
      const mockUpdateEq = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn(() => ({ eq: mockUpdateEq }));

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "test-job-id",
            user_id: "test-user-id",
            version_group_id: null,
          },
          error: null,
        }),
        update: mockUpdate,
      });

      const request = createMockPatchRequest("test-job-id", { action: "set-primary" });
      const response = await PATCH(request, { params: createParams("test-job-id") });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe("Set as primary version");
    });

    it("updates version_group correctly when setting primary", async () => {
      // Create chainable eq mock that supports .eq().eq()
      const mockSecondEq = vi.fn().mockResolvedValue({ error: null });
      const mockFirstEq = vi.fn(() => ({ eq: mockSecondEq }));
      const mockUpdate = vi.fn(() => ({ eq: mockFirstEq }));

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "test-job-id",
            user_id: "test-user-id",
            version_group_id: "version-group-123",
          },
          error: null,
        }),
        update: mockUpdate,
      });

      const request = createMockPatchRequest("test-job-id", { action: "set-primary" });
      const response = await PATCH(request, { params: createParams("test-job-id") });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.versionGroupId).toBe("version-group-123");
    });
  });
});
