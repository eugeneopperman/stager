"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Building2, Plus, Loader2, X } from "lucide-react";
import { useCreateProperty } from "@/hooks/useCreateProperty";
import type { Property } from "@/lib/database.types";

interface PropertySelectorProps {
  value: string | null;
  onChange: (propertyId: string | null, property?: Property) => void;
  disabled?: boolean;
}

export function PropertySelector({
  value,
  onChange,
  disabled = false,
}: PropertySelectorProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newAddress, setNewAddress] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const { createProperty, isCreating, error: createError, clearError } = useCreateProperty({
    onSuccess: (newProperty) => {
      setProperties((prev) => [newProperty, ...prev]);
      onChange(newProperty.id, newProperty);
      setNewAddress("");
      setNewDescription("");
      setShowCreateDialog(false);
    },
  });

  // Fetch properties on mount
  useEffect(() => {
    async function fetchProperties() {
      const supabase = createClient();
      const { data } = await supabase
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false });

      setProperties(data || []);
      setIsLoading(false);
    }

    fetchProperties();
  }, []);

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    await createProperty(newAddress, newDescription);
  };

  const selectedProperty = properties.find((p) => p.id === value);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading properties...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Select
            value={value || "none"}
            onValueChange={(val) => {
              if (val === "none") {
                onChange(null);
              } else if (val === "create") {
                setShowCreateDialog(true);
              } else {
                const property = properties.find((p) => p.id === val);
                onChange(val, property);
              }
            }}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a property (optional)">
                {value && selectedProperty ? (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    <span className="truncate">{selectedProperty.address}</span>
                  </div>
                ) : (
                  <span className="text-slate-500">No property selected</span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                <span className="text-slate-500">No property (standalone staging)</span>
              </SelectItem>
              <SelectItem value="create">
                <div className="flex items-center gap-2 text-blue-600">
                  <Plus className="h-4 w-4" />
                  <span>Create new property</span>
                </div>
              </SelectItem>
              {properties.length > 0 && (
                <div className="border-t my-1" />
              )}
              {properties.map((property) => (
                <SelectItem key={property.id} value={property.id}>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    <span className="truncate">{property.address}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {value && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onChange(null)}
            disabled={disabled}
            className="shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Create Property Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => {
        setShowCreateDialog(open);
        if (!open) clearError();
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleCreateProperty}>
            <DialogHeader>
              <DialogTitle>Create New Property</DialogTitle>
              <DialogDescription>
                Add a property to organize your staging projects
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="new-address">Address *</Label>
                <Input
                  id="new-address"
                  placeholder="123 Main St, City, State 12345"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  disabled={isCreating}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-description">Description</Label>
                <Textarea
                  id="new-description"
                  placeholder="Optional notes about this property..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  disabled={isCreating}
                  rows={3}
                />
              </div>
              {createError && (
                <p className="text-sm text-red-600">{createError}</p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create & Select"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
