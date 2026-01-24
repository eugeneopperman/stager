import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useTeamInvitationsSWR } from "./useTeamInvitationsSWR";
import { createTestWrapper } from "@/test/utils";
import { server } from "@/test/mocks/server";
import { http, HttpResponse } from "msw";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
    push: vi.fn(),
  }),
}));

describe("useTeamInvitationsSWR", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches and returns invitations", async () => {
    const { result } = renderHook(() => useTeamInvitationsSWR(), {
      wrapper: createTestWrapper(),
    });

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.invitations).toHaveLength(1);
    expect(result.current.invitations[0].email).toBe("newuser@example.com");
  });

  it("filters pending invitations", async () => {
    const { result } = renderHook(() => useTeamInvitationsSWR(), {
      wrapper: createTestWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.pendingInvitations).toHaveLength(1);
    expect(result.current.pendingInvitations[0].status).toBe("pending");
  });

  it("handles resend invitation successfully", async () => {
    server.use(
      http.post("/api/team/invitations/:id", () => {
        return HttpResponse.json({ success: true });
      })
    );

    const { result } = renderHook(() => useTeamInvitationsSWR(), {
      wrapper: createTestWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let resendResult: { success: boolean; error?: string };
    await act(async () => {
      resendResult = await result.current.resend("inv-1");
    });

    expect(resendResult!.success).toBe(true);
  });

  it("handles resend invitation failure", async () => {
    server.use(
      http.post("/api/team/invitations/:id", () => {
        return HttpResponse.json(
          { error: "Already sent recently" },
          { status: 429 }
        );
      })
    );

    const { result } = renderHook(() => useTeamInvitationsSWR(), {
      wrapper: createTestWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let resendResult: { success: boolean; error?: string };
    await act(async () => {
      resendResult = await result.current.resend("inv-1");
    });

    expect(resendResult!.success).toBe(false);
    expect(resendResult!.error).toBe("Already sent recently");
  });

  it("handles revoke invitation with optimistic update", async () => {
    const { result } = renderHook(() => useTeamInvitationsSWR(), {
      wrapper: createTestWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let revokeResult: { success: boolean; error?: string };
    await act(async () => {
      revokeResult = await result.current.revoke("inv-1");
    });

    expect(revokeResult!.success).toBe(true);
  });

  it("handles revoke invitation failure with rollback", async () => {
    server.use(
      http.delete("/api/team/invitations/:id", () => {
        return HttpResponse.json(
          { error: "Cannot revoke accepted invitation" },
          { status: 400 }
        );
      })
    );

    const { result } = renderHook(() => useTeamInvitationsSWR(), {
      wrapper: createTestWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let revokeResult: { success: boolean; error?: string };
    await act(async () => {
      revokeResult = await result.current.revoke("inv-1");
    });

    expect(revokeResult!.success).toBe(false);
    expect(revokeResult!.error).toBe("Cannot revoke accepted invitation");
  });

  it("handles API error gracefully", async () => {
    server.use(
      http.get("/api/team/invitations", () => {
        return HttpResponse.json(
          { error: "Internal server error" },
          { status: 500 }
        );
      })
    );

    const { result } = renderHook(() => useTeamInvitationsSWR(), {
      wrapper: createTestWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
  });

  it("refetch triggers data reload", async () => {
    const { result } = renderHook(() => useTeamInvitationsSWR(), {
      wrapper: createTestWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.refetch();
    });

    // Should still have data after refetch
    expect(result.current.invitations).toHaveLength(1);
  });
});
