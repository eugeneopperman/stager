"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mail, Coins, Clock, RefreshCw, X, Loader2, MailCheck, CheckCircle2, XCircle } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { useTeamInvitationsSWR } from "@/hooks/useTeamInvitationsSWR";
import { toast } from "sonner";

type FilterStatus = "all" | "pending" | "accepted" | "expired" | "revoked";

interface InvitationsListProps {
  onUpdate?: () => void;
}

export function PendingInvitationsList({ onUpdate }: InvitationsListProps) {
  const [filter, setFilter] = useState<FilterStatus>("all");
  const {
    invitations,
    isLoading,
    resend,
    revoke,
  } = useTeamInvitationsSWR();

  // Determine effective status (pending invitations can expire)
  const getEffectiveStatus = (invitation: { status: string; expires_at: string }): FilterStatus => {
    if (invitation.status === "accepted") return "accepted";
    if (invitation.status === "revoked") return "revoked";
    if (invitation.status === "expired" || new Date(invitation.expires_at) < new Date()) {
      return "expired";
    }
    return "pending";
  };

  // Filter invitations based on selected filter
  const filteredInvitations = invitations.filter((inv) => {
    if (filter === "all") return true;
    return getEffectiveStatus(inv) === filter;
  });

  // Count by status for filter badges
  const statusCounts = {
    all: invitations.length,
    pending: invitations.filter((inv) => getEffectiveStatus(inv) === "pending").length,
    accepted: invitations.filter((inv) => getEffectiveStatus(inv) === "accepted").length,
    expired: invitations.filter((inv) => getEffectiveStatus(inv) === "expired").length,
    revoked: invitations.filter((inv) => getEffectiveStatus(inv) === "revoked").length,
  };

  const getStatusBadge = (invitation: { status: string; expires_at: string }) => {
    const effectiveStatus = getEffectiveStatus(invitation);

    switch (effectiveStatus) {
      case "accepted":
        return (
          <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 dark:bg-green-950/30">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Accepted
          </Badge>
        );
      case "revoked":
        return (
          <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 dark:bg-red-950/30">
            <XCircle className="h-3 w-3 mr-1" />
            Revoked
          </Badge>
        );
      case "expired":
        return (
          <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-950/30">
            <Clock className="h-3 w-3 mr-1" />
            Expired
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-950/30">
            <Mail className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const getExpiryText = (invitation: { status: string; expires_at: string }) => {
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);

    if (invitation.status !== "pending" || expiresAt < now) {
      return null;
    }

    return `Expires ${formatDistanceToNow(expiresAt, { addSuffix: true })}`;
  };

  const handleResend = async (invitationId: string, email: string) => {
    const result = await resend(invitationId);
    if (result.success) {
      toast.success("Invitation resent", {
        description: `A new invitation email has been sent to ${email}`,
      });
      onUpdate?.();
    } else {
      toast.error("Failed to resend", {
        description: result.error || "Please try again",
      });
    }
  };

  const handleRevoke = async (invitationId: string, email: string) => {
    const result = await revoke(invitationId);
    if (result.success) {
      toast.success("Invitation revoked", {
        description: `The invitation to ${email} has been withdrawn`,
      });
      onUpdate?.();
    } else {
      toast.error("Failed to revoke", {
        description: result.error || "Please try again",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Invitations
              {invitations.length > 0 && (
                <Badge variant="secondary">{invitations.length}</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Manage team invitations and see history
            </CardDescription>
          </div>
          {invitations.length > 0 && (
            <Select value={filter} onValueChange={(value) => setFilter(value as FilterStatus)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  All ({statusCounts.all})
                </SelectItem>
                <SelectItem value="pending">
                  Pending ({statusCounts.pending})
                </SelectItem>
                <SelectItem value="accepted">
                  Accepted ({statusCounts.accepted})
                </SelectItem>
                <SelectItem value="expired">
                  Expired ({statusCounts.expired})
                </SelectItem>
                <SelectItem value="revoked">
                  Revoked ({statusCounts.revoked})
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {invitations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No invitations sent yet</p>
            <p className="text-sm">Use the &quot;Invite Member&quot; button above to invite team members</p>
          </div>
        ) : filteredInvitations.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p>No {filter} invitations</p>
          </div>
        ) : (
          filteredInvitations.map((invitation) => {
            const effectiveStatus = getEffectiveStatus(invitation);
            const canResend = effectiveStatus === "pending" || effectiveStatus === "expired";
            const canRevoke = effectiveStatus === "pending";

            return (
              <div
                key={invitation.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-slate-50 dark:bg-slate-900"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    effectiveStatus === "accepted"
                      ? "bg-green-100 dark:bg-green-950"
                      : effectiveStatus === "revoked"
                      ? "bg-red-100 dark:bg-red-950"
                      : effectiveStatus === "expired"
                      ? "bg-amber-100 dark:bg-amber-950"
                      : "bg-blue-100 dark:bg-blue-950"
                  }`}>
                    <MailCheck className={`h-5 w-5 ${
                      effectiveStatus === "accepted"
                        ? "text-green-600"
                        : effectiveStatus === "revoked"
                        ? "text-red-600"
                        : effectiveStatus === "expired"
                        ? "text-amber-600"
                        : "text-blue-600"
                    }`} />
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
                      {effectiveStatus === "pending" && getExpiryText(invitation) && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {getExpiryText(invitation)}
                        </span>
                      )}
                      {effectiveStatus === "accepted" && invitation.accepted_at && (
                        <span>
                          Joined {format(new Date(invitation.accepted_at), "MMM d, yyyy")}
                        </span>
                      )}
                      {effectiveStatus !== "accepted" && (
                        <span>
                          Sent {formatDistanceToNow(new Date(invitation.created_at), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {canResend && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResend(invitation.id, invitation.email)}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Resend
                    </Button>
                  )}
                  {canRevoke && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRevoke(invitation.id, invitation.email)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
