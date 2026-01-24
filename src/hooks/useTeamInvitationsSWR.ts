"use client";

import useSWR, { mutate } from "swr";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { fetcher, swrKeys } from "@/lib/swr";

interface Invitation {
  id: string;
  email: string;
  initial_credits: number;
  status: string;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
  inviter?: { full_name: string | null };
}

interface InvitationsResponse {
  invitations: Invitation[];
}

interface UseTeamInvitationsSWRReturn {
  invitations: Invitation[];
  pendingInvitations: Invitation[];
  isLoading: boolean;
  error: Error | undefined;
  resend: (invitationId: string) => Promise<{ success: boolean; error?: string }>;
  revoke: (invitationId: string) => Promise<{ success: boolean; error?: string }>;
  refetch: () => Promise<void>;
}

export function useTeamInvitationsSWR(): UseTeamInvitationsSWRReturn {
  const router = useRouter();
  const cacheKey = swrKeys.teamInvitations();

  const { data, isLoading, error } = useSWR<InvitationsResponse>(
    cacheKey,
    fetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    }
  );

  const invitations = data?.invitations ?? [];

  // Filter to pending and expired invitations
  const pendingInvitations = invitations.filter(
    (inv) => inv.status === "pending" || inv.status === "expired"
  );

  const resend = useCallback(
    async (invitationId: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const response = await fetch(`/api/team/invitations/${invitationId}`, {
          method: "POST",
        });

        if (response.ok) {
          // Revalidate cache
          await mutate(cacheKey);
          router.refresh();
          return { success: true };
        }

        const errorData = await response.json().catch(() => ({}));
        return { success: false, error: errorData.error || "Failed to resend invitation" };
      } catch (err) {
        console.error("Error resending invitation:", err);
        return { success: false, error: "Failed to resend invitation" };
      }
    },
    [cacheKey, router]
  );

  const revoke = useCallback(
    async (invitationId: string): Promise<{ success: boolean; error?: string }> => {
      // Optimistic update - mark as revoked
      await mutate(
        cacheKey,
        (current: InvitationsResponse | undefined) => ({
          invitations:
            current?.invitations.map((inv) =>
              inv.id === invitationId ? { ...inv, status: "revoked" } : inv
            ) ?? [],
        }),
        false
      );

      try {
        const response = await fetch(`/api/team/invitations/${invitationId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          // Revalidate to get real data
          await mutate(cacheKey);
          router.refresh();
          return { success: true };
        }

        // Rollback on error
        await mutate(cacheKey);
        const errorData = await response.json().catch(() => ({}));
        return { success: false, error: errorData.error || "Failed to revoke invitation" };
      } catch (err) {
        console.error("Error revoking invitation:", err);
        // Rollback
        await mutate(cacheKey);
        return { success: false, error: "Failed to revoke invitation" };
      }
    },
    [cacheKey, router]
  );

  const refetch = useCallback(async () => {
    await mutate(cacheKey);
  }, [cacheKey]);

  return {
    invitations,
    pendingInvitations,
    isLoading,
    error,
    resend,
    revoke,
    refetch,
  };
}
