"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Coins, Clock, RefreshCw, X, Loader2, MailCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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

interface PendingInvitationsListProps {
  onUpdate?: () => void;
}

export function PendingInvitationsList({ onUpdate }: PendingInvitationsListProps) {
  const router = useRouter();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchInvitations = useCallback(async () => {
    try {
      const response = await fetch("/api/team/invitations");
      const data = await response.json();
      if (response.ok) {
        setInvitations(data.invitations || []);
      }
    } catch (err) {
      console.error("Error fetching invitations:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Fetching data on mount is valid
    void fetchInvitations();
  }, [fetchInvitations]);

  const handleResend = async (invitationId: string) => {
    setActionLoading(invitationId);
    try {
      const response = await fetch(`/api/team/invitations/${invitationId}`, {
        method: "POST",
      });

      if (response.ok) {
        fetchInvitations();
        onUpdate?.();
        router.refresh();
      }
    } catch (err) {
      console.error("Error resending invitation:", err);
    }
    setActionLoading(null);
  };

  const handleRevoke = async (invitationId: string) => {
    setActionLoading(invitationId);
    try {
      const response = await fetch(`/api/team/invitations/${invitationId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchInvitations();
        onUpdate?.();
        router.refresh();
      }
    } catch (err) {
      console.error("Error revoking invitation:", err);
    }
    setActionLoading(null);
  };

  const getStatusBadge = (invitation: Invitation) => {
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);

    if (invitation.status === "accepted") {
      return (
        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 dark:bg-green-950/30">
          Accepted
        </Badge>
      );
    }

    if (invitation.status === "revoked") {
      return (
        <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 dark:bg-red-950/30">
          Revoked
        </Badge>
      );
    }

    if (invitation.status === "expired" || expiresAt < now) {
      return (
        <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-950/30">
          Expired
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-950/30">
        Pending
      </Badge>
    );
  };

  const getExpiryText = (invitation: Invitation) => {
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);

    if (invitation.status !== "pending" || expiresAt < now) {
      return null;
    }

    return `Expires ${formatDistanceToNow(expiresAt, { addSuffix: true })}`;
  };

  const pendingInvitations = invitations.filter(
    (inv) => inv.status === "pending" || inv.status === "expired"
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (pendingInvitations.length === 0) {
    return null; // Don't show the card if there are no pending invitations
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Pending Invitations
              {pendingInvitations.length > 0 && (
                <Badge variant="secondary">{pendingInvitations.length}</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Invitations waiting to be accepted
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {pendingInvitations.map((invitation) => {
          const isExpired =
            invitation.status === "expired" ||
            new Date(invitation.expires_at) < new Date();
          const isPending = invitation.status === "pending" && !isExpired;

          return (
            <div
              key={invitation.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-slate-50 dark:bg-slate-900"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950">
                  <MailCheck className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{invitation.email}</p>
                    {getStatusBadge(invitation)}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    {invitation.initial_credits > 0 && (
                      <span className="flex items-center gap-1">
                        <Coins className="h-3 w-3" />
                        {invitation.initial_credits} credits
                      </span>
                    )}
                    {getExpiryText(invitation) && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {getExpiryText(invitation)}
                      </span>
                    )}
                    {!getExpiryText(invitation) && (
                      <span>
                        Sent {formatDistanceToNow(new Date(invitation.created_at), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {(isPending || isExpired) && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResend(invitation.id)}
                      disabled={actionLoading === invitation.id}
                    >
                      {actionLoading === invitation.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Resend
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRevoke(invitation.id)}
                      disabled={actionLoading === invitation.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
