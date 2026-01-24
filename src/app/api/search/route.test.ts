import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

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

function createRequest(query?: string): NextRequest {
  const url = query
    ? `http://localhost:3000/api/search?q=${encodeURIComponent(query)}`
    : "http://localhost:3000/api/search";
  return new NextRequest(url);
}

describe("GET /api/search", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default authenticated user
    mockGetUser.mockResolvedValue({
      data: { user: { id: "test-user-id" } },
    });
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = createRequest("test");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns empty results for missing query", async () => {
    const request = createRequest();
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.properties).toEqual([]);
    expect(data.stagingJobs).toEqual([]);
  });

  it("returns empty results for query shorter than 2 characters", async () => {
    const request = createRequest("a");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.properties).toEqual([]);
    expect(data.stagingJobs).toEqual([]);
  });

  it("searches properties and staging jobs", async () => {
    const mockProperties = [
      { id: "prop-1", address: "123 Main St", description: "Nice house" },
      { id: "prop-2", address: "456 Oak Ave", description: null },
    ];

    const mockStagingJobs = [
      {
        id: "job-1",
        room_type: "living-room",
        style: "modern",
        staged_image_url: "https://example.com/staged.jpg",
        status: "completed",
        created_at: "2024-01-15T10:00:00Z",
        property: { id: "prop-1", address: "123 Main St" },
      },
    ];

    // Mock chained queries for properties
    const mockPropertiesChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: mockProperties, error: null }),
    };

    // Mock chained queries for staging jobs
    const mockStagingChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: mockStagingJobs, error: null }),
    };

    mockFrom.mockImplementation((table: string) => {
      if (table === "properties") return mockPropertiesChain;
      if (table === "staging_jobs") return mockStagingChain;
      return mockPropertiesChain;
    });

    const request = createRequest("main");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.properties).toHaveLength(2);
    expect(data.stagingJobs).toHaveLength(1);
    expect(data.properties[0].address).toBe("123 Main St");
    expect(data.stagingJobs[0].room_type).toBe("living-room");
  });

  it("filters by user_id", async () => {
    const mockPropertiesChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    };

    const mockStagingChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    };

    mockFrom.mockImplementation((table: string) => {
      if (table === "properties") return mockPropertiesChain;
      if (table === "staging_jobs") return mockStagingChain;
      return mockPropertiesChain;
    });

    const request = createRequest("test");
    await GET(request);

    // Verify user_id filter is applied to properties
    expect(mockPropertiesChain.eq).toHaveBeenCalledWith("user_id", "test-user-id");

    // Verify user_id filter is applied to staging_jobs
    expect(mockStagingChain.eq).toHaveBeenCalledWith("user_id", "test-user-id");
  });

  it("only returns completed staging jobs", async () => {
    const mockPropertiesChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    };

    const mockStagingChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    };

    mockFrom.mockImplementation((table: string) => {
      if (table === "properties") return mockPropertiesChain;
      if (table === "staging_jobs") return mockStagingChain;
      return mockPropertiesChain;
    });

    const request = createRequest("modern");
    await GET(request);

    // Verify status filter for completed jobs
    expect(mockStagingChain.eq).toHaveBeenCalledWith("status", "completed");
  });

  it("handles database errors gracefully", async () => {
    const mockPropertiesChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: null, error: { message: "DB error" } }),
    };

    const mockStagingChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: null, error: { message: "DB error" } }),
    };

    mockFrom.mockImplementation((table: string) => {
      if (table === "properties") return mockPropertiesChain;
      if (table === "staging_jobs") return mockStagingChain;
      return mockPropertiesChain;
    });

    const request = createRequest("test");
    const response = await GET(request);
    const data = await response.json();

    // Should return empty arrays on error (graceful degradation)
    expect(response.status).toBe(200);
    expect(data.properties).toEqual([]);
    expect(data.stagingJobs).toEqual([]);
  });

  it("trims and lowercases query", async () => {
    const mockPropertiesChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    };

    const mockStagingChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    };

    mockFrom.mockImplementation((table: string) => {
      if (table === "properties") return mockPropertiesChain;
      if (table === "staging_jobs") return mockStagingChain;
      return mockPropertiesChain;
    });

    const request = createRequest("  MAIN  ");
    const response = await GET(request);

    expect(response.status).toBe(200);
    // The query should be processed (trimmed and lowercased)
    expect(mockPropertiesChain.or).toHaveBeenCalledWith(
      expect.stringContaining("main")
    );
  });

  it("limits results to 5 items each", async () => {
    const mockPropertiesChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    };

    const mockStagingChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    };

    mockFrom.mockImplementation((table: string) => {
      if (table === "properties") return mockPropertiesChain;
      if (table === "staging_jobs") return mockStagingChain;
      return mockPropertiesChain;
    });

    const request = createRequest("test");
    await GET(request);

    expect(mockPropertiesChain.limit).toHaveBeenCalledWith(5);
    expect(mockStagingChain.limit).toHaveBeenCalledWith(5);
  });
});
