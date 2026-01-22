"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Coins, Trash2, Loader2, Crown } from "lucide-react";
import { CreditAllocationSlider } from "./CreditAllocationSlider";
import type { OrganizationMember, Profile } from "@/lib/database.types";

interface TeamMemberCardProps {
  member: OrganizationMember & { profile?: Pick<Profile, "id" | "full_name" | "company_name"> };
  isOwner: boolean;
  canManage: boolean;
  maxCredits: number;
  onUpdate: () => void;
}

export function TeamMemberCard({ member, isOwner, canManage, maxCredits, onUpdate }: TeamMemberCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showAllocation, setShowAllocation] = useState(false);

  const availableCredits = member.allocated_credits - member.credits_used_this_period;
  const displayName = member.profile?.full_name || member.profile?.company_name || "Team Member";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleRemoveMember = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/team/members/${member.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onUpdate();
        router.refresh();
      } else {
        const data = await response.json();
        console.error("Error removing member:", data.error);
      }
    } catch (error) {
      console.error("Error removing member:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateCredits = async (newCredits: number) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/team/members/${member.id}/credits`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credits: newCredits }),
      });

      if (response.ok) {
        onUpdate();
        router.refresh();
        setShowAllocation(false);
      } else {
        const data = await response.json();
        console.error("Error updating credits:", data.error);
      }
    } catch (error) {
      console.error("Error updating credits:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className={isOwner ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">{displayName}</p>
                {member.role === "owner" && (
                  <Badge variant="outline" className="text-purple-600 border-purple-200">
                    <Crown className="h-3 w-3 mr-1" />
                    Owner
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Coins className="h-3 w-3" />
                <span>
                  {availableCredits} of {member.allocated_credits} credits available
                </span>
                {member.credits_used_this_period > 0 && (
                  <span className="text-xs">
                    ({member.credits_used_this_period} used this period)
                  </span>
                )}
              </div>
            </div>
          </div>

          {canManage && member.role !== "owner" && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAllocation(!showAllocation)}
              >
                <Coins className="h-4 w-4 mr-1" />
                Allocate
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove Team Member?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove {displayName} from your team. Their unused credits ({availableCredits}) will be returned to your unallocated pool.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleRemoveMember}
                      className="bg-red-600 hover:bg-red-700"
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Remove"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>

        {showAllocation && (
          <div className="mt-4 pt-4 border-t">
            <CreditAllocationSlider
              currentAllocation={member.allocated_credits}
              usedCredits={member.credits_used_this_period}
              maxCredits={maxCredits + member.allocated_credits - member.credits_used_this_period}
              isLoading={isUpdating}
              onSave={handleUpdateCredits}
              onCancel={() => setShowAllocation(false)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
