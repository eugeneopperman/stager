"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, Coins, Building2, Loader2, Edit2, Check, X, AlertCircle } from "lucide-react";
import { TeamMemberCard } from "@/components/team/TeamMemberCard";
import { InviteMemberDialog } from "@/components/team/InviteMemberDialog";
import { PendingInvitationsList } from "@/components/team/PendingInvitationsList";
import type { Organization, OrganizationMember, Profile } from "@/lib/database.types";

type OrganizationWithMembers = Organization & {
  members?: (OrganizationMember & { profile?: Pick<Profile, "id" | "full_name" | "company_name"> })[];
};

interface TeamPageClientProps {
  userId: string;
  initialOrganization: OrganizationWithMembers | null;
  initialRole: "owner" | "member" | null;
}

export function TeamPageClient({ userId: _userId, initialOrganization, initialRole }: TeamPageClientProps) {
  const router = useRouter();
  const [organization, setOrganization] = useState<OrganizationWithMembers | null>(initialOrganization);
  const [role, setRole] = useState(initialRole);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [editName, setEditName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isOwner = role === "owner";
  const members = organization?.members || [];
  const ownerMember = members.find((m) => m.role === "owner");
  const regularMembers = members.filter((m) => m.role === "member");

  const fetchOrganization = async () => {
    try {
      const response = await fetch("/api/team");
      const data = await response.json();
      setOrganization(data.organization);
      setRole(data.role);
    } catch {
      // Error fetching organization
    }
  };

  const handleCreateOrganization = async () => {
    if (!newOrgName.trim()) return;

    setIsCreating(true);
    setError(null);
    try {
      const response = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newOrgName.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        await fetchOrganization();
        router.refresh();
      } else {
        setError(data.error || "Failed to create organization");
        // If org already exists, try to fetch it
        if (data.error === "Organization already exists") {
          await fetchOrganization();
          router.refresh();
        }
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateName = async () => {
    if (!editName.trim() || !organization) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });

      if (response.ok) {
        setOrganization({ ...organization, name: editName.trim() });
        setIsEditingName(false);
        router.refresh();
      }
    } catch {
      // Error updating organization name
    } finally {
      setIsLoading(false);
    }
  };

  if (!organization) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Create Your Team
          </CardTitle>
          <CardDescription>
            Set up your organization to start inviting team members
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="orgName">Organization Name</Label>
            <Input
              id="orgName"
              placeholder="Acme Real Estate"
              value={newOrgName}
              onChange={(e) => setNewOrgName(e.target.value)}
            />
          </div>
          <Button onClick={handleCreateOrganization} disabled={isCreating || !newOrgName.trim()}>
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Building2 className="h-4 w-4 mr-2" />
                Create Organization
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Organization Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-64"
                    autoFocus
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleUpdateName}
                    disabled={isLoading}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setIsEditingName(false);
                      setEditName(organization.name);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {organization.name}
                  </CardTitle>
                  {isOwner && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => {
                        setEditName(organization.name);
                        setIsEditingName(true);
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}
                </>
              )}
            </div>
            <Badge variant="outline" className="text-purple-600 border-purple-200">
              Enterprise
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{members.length}</p>
                <p className="text-sm text-muted-foreground">Team Members</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-950">
                <Coins className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{organization.total_credits}</p>
                <p className="text-sm text-muted-foreground">Total Credits</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950">
                <Coins className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{organization.unallocated_credits}</p>
                <p className="text-sm text-muted-foreground">Unallocated</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Members
              </CardTitle>
              <CardDescription>
                {isOwner
                  ? "Manage your team and allocate credits"
                  : "View your team members"}
              </CardDescription>
            </div>
            {isOwner && (
              <InviteMemberDialog
                maxCredits={organization.unallocated_credits}
                onSuccess={fetchOrganization}
              />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Owner first */}
          {ownerMember && (
            <TeamMemberCard
              member={ownerMember}
              isOwner={true}
              canManage={false}
              maxCredits={0}
              onUpdate={fetchOrganization}
            />
          )}

          {/* Other members */}
          {regularMembers.map((member) => (
            <TeamMemberCard
              key={member.id}
              member={member}
              isOwner={false}
              canManage={isOwner}
              maxCredits={organization.unallocated_credits}
              onUpdate={fetchOrganization}
            />
          ))}

          {members.length === 1 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No team members yet</p>
              {isOwner && (
                <p className="text-sm">Click &quot;Invite Member&quot; to add your first teammate</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations (owners only) */}
      {isOwner && (
        <PendingInvitationsList onUpdate={fetchOrganization} />
      )}
    </div>
  );
}
