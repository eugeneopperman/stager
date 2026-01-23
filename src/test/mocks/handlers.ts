import { http, HttpResponse } from "msw";

// Default mock responses
const mockStagingResponse = {
  jobId: "test-job-id",
  stagedImageUrl: "https://example.com/staged-image.png",
  provider: "gemini",
  async: false,
};

const mockAsyncStagingResponse = {
  jobId: "test-async-job-id",
  provider: "replicate",
  async: true,
};

const mockJobStatusResponse = {
  status: "completed",
  stagedImageUrl: "https://example.com/staged-image.png",
  progress: { message: "Complete" },
};

const mockVersionsResponse = {
  versions: [
    {
      id: "version-1",
      room_type: "living-room",
      style: "modern",
      staged_image_url: "https://example.com/v1.png",
      is_primary_version: true,
      created_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "version-2",
      room_type: "living-room",
      style: "scandinavian",
      staged_image_url: "https://example.com/v2.png",
      is_primary_version: false,
      created_at: "2024-01-02T00:00:00Z",
    },
  ],
  totalVersions: 2,
};

export const handlers = [
  // Staging API
  http.post("/api/staging", async () => {
    return HttpResponse.json(mockStagingResponse);
  }),

  // Job API - GET for status, PATCH for updates
  http.get("/api/staging/:jobId", () => {
    return HttpResponse.json(mockJobStatusResponse);
  }),

  http.patch("/api/staging/:jobId", async ({ request }) => {
    const body = await request.json() as { action?: string };
    if (body.action === "set-primary") {
      return HttpResponse.json({ success: true });
    }
    return HttpResponse.json({ error: "Invalid action" }, { status: 400 });
  }),

  // Versions API
  http.get("/api/staging/versions", () => {
    return HttpResponse.json(mockVersionsResponse);
  }),

  // Remix API
  http.post("/api/staging/:jobId/remix", () => {
    return HttpResponse.json({
      jobId: "remix-job-id",
      stagedImageUrl: "https://example.com/remixed.png",
    });
  }),
];

// Export mock data for use in tests
export const mocks = {
  staging: mockStagingResponse,
  asyncStaging: mockAsyncStagingResponse,
  jobStatus: mockJobStatusResponse,
  versions: mockVersionsResponse,
};
