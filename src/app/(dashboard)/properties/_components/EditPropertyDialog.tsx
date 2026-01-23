"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Property } from "@/lib/database.types";

interface EditPropertyDialogProps {
  property: Property;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditPropertyDialog({ property, open, onOpenChange }: EditPropertyDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [address, setAddress] = useState(property.address);
  const [description, setDescription] = useState(property.description || "");
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens or property changes
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Syncing form state with props is valid
      setAddress(property.address);
      setDescription(property.description || "");
    }
  }, [open, property]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!address.trim()) {
      setError("Address is required");
      return;
    }

    setIsLoading(true);
    const supabase = createClient();

    const { error: updateError } = await supabase
      .from("properties")
      .update({
        address: address.trim(),
        description: description.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", property.id);

    if (updateError) {
      console.error("Failed to update property:", updateError);
      setError("Failed to update property. Please try again.");
    } else {
      onOpenChange(false);
      router.refresh();
    }

    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Property</DialogTitle>
            <DialogDescription>
              Update property details
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-address">Address *</Label>
              <Input
                id="edit-address"
                placeholder="123 Main St, City, State 12345"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                placeholder="Optional notes about this property..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
                rows={3}
              />
            </div>
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
