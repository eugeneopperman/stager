"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Users, Lock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PropertySharingToggleProps {
  propertyId: string;
  currentVisibility: "private" | "team";
  hasTeam: boolean;
}

export function PropertySharingToggle({
  propertyId,
  currentVisibility,
  hasTeam,
}: PropertySharingToggleProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [visibility, setVisibility] = useState(currentVisibility);

  const handleToggle = async () => {
    if (!hasTeam) return;

    const newVisibility = visibility === "private" ? "team" : "private";
    setIsLoading(true);

    try {
      const response = await fetch(`/api/team/properties/${propertyId}/visibility`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility: newVisibility }),
      });

      if (response.ok) {
        setVisibility(newVisibility);
        router.refresh();
      } else {
        const data = await response.json();
        console.error("Error updating visibility:", data.error);
      }
    } catch (error) {
      console.error("Error updating visibility:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasTeam) {
    return (
      <Button variant="ghost" size="sm" disabled className="text-muted-foreground">
        <Lock className="h-4 w-4 mr-1" />
        Private
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      disabled={isLoading}
      className={cn(
        visibility === "team" && "text-blue-600 hover:text-blue-700"
      )}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : visibility === "team" ? (
        <>
          <Users className="h-4 w-4 mr-1" />
          Shared
        </>
      ) : (
        <>
          <Lock className="h-4 w-4 mr-1" />
          Private
        </>
      )}
    </Button>
  );
}
