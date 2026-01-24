import { http, HttpResponse } from "msw";

// Notifications mock data
const mockNotifications = [
  {
    id: "notif-1",
    user_id: "user-1",
    type: "staging_complete",
    title: "Staging Complete",
    message: "Your living room staging is ready",
    read: false,
    created_at: "2024-01-15T10:00:00Z",
  },
  {
    id: "notif-2",
    user_id: "user-1",
    type: "credits_low",
    title: "Low Credits",
    message: "You have 5 credits remaining",
    read: true,
    created_at: "2024-01-14T10:00:00Z",
  },
];

// Team invitations mock data
const mockInvitations = [
  {
    id: "inv-1",
    email: "newuser@example.com",
    role: "member",
    credits_allocated: 10,
    status: "pending",
    expires_at: "2024-02-15T10:00:00Z",
    created_at: "2024-01-15T10:00:00Z",
  },
];

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

  // Versions API - matches /api/staging/versions?jobId=xxx
  http.get("/api/staging/versions", ({ request }) => {
    const url = new URL(request.url);
    const jobId = url.searchParams.get("jobId");
    // Return versions if jobId is provided
    if (jobId) {
      return HttpResponse.json(mockVersionsResponse);
    }
    return HttpResponse.json({ versions: [], totalVersions: 0 });
  }),

  // Remix API
  http.post("/api/staging/:jobId/remix", () => {
    return HttpResponse.json({
      jobId: "remix-job-id",
      stagedImageUrl: "https://example.com/remixed.png",
    });
  }),

  // Notifications API
  http.get("/api/notifications", () => {
    return HttpResponse.json({
      notifications: mockNotifications,
      unreadCount: mockNotifications.filter((n) => !n.read).length,
    });
  }),

  http.patch("/api/notifications/:id/read", ({ params }) => {
    return HttpResponse.json({ success: true, id: params.id });
  }),

  http.post("/api/notifications/mark-all-read", () => {
    return HttpResponse.json({ success: true, count: 1 });
  }),

  // Team Invitations API
  http.get("/api/team/invitations", () => {
    return HttpResponse.json({ invitations: mockInvitations });
  }),

  http.post("/api/team/invitations/:id/resend", ({ params }) => {
    return HttpResponse.json({ success: true, id: params.id });
  }),

  http.delete("/api/team/invitations/:id", ({ params }) => {
    return HttpResponse.json({ success: true, id: params.id });
  }),
];

// Export mock data for use in tests
export const mocks = {
  staging: mockStagingResponse,
  asyncStaging: mockAsyncStagingResponse,
  jobStatus: mockJobStatusResponse,
  versions: mockVersionsResponse,
  notifications: mockNotifications,
  invitations: mockInvitations,
};
