"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { UserPlus, Loader2, AlertCircle } from "lucide-react";

interface InviteMemberDialogProps {
  maxCredits: number;
  onSuccess: () => void;
}

export function InviteMemberDialog({ maxCredits, onSuccess }: InviteMemberDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [initialCredits, setInitialCredits] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInvite = async () => {
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, initialCredits }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to invite member");
        return;
      }

      setOpen(false);
      setEmail("");
      setInitialCredits(0);
      onSuccess();
      router.refresh();
    } catch (err) {
      setError("Failed to invite member. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setEmail("");
      setInitialCredits(0);
      setError(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Invite a new member to your team. They must have an existing Stager account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="teammate@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Initial Credit Allocation</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[initialCredits]}
                onValueChange={(v) => setInitialCredits(v[0])}
                min={0}
                max={maxCredits}
                step={1}
                className="flex-1"
              />
              <Input
                type="number"
                value={initialCredits}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val)) {
                    setInitialCredits(Math.max(0, Math.min(maxCredits, val)));
                  }
                }}
                min={0}
                max={maxCredits}
                className="w-20"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {maxCredits} credits available to allocate
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg text-red-600 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleInvite} disabled={isLoading || !email}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Inviting...
              </>
            ) : (
              "Send Invitation"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
