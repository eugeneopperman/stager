"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Property } from "@/lib/database.types";

interface UseCreatePropertyOptions {
  onSuccess?: (property: Property) => void;
}

interface CreatePropertyResult {
  createProperty: (address: string, description?: string) => Promise<Property | null>;
  isCreating: boolean;
  error: string | null;
  clearError: () => void;
}

export function useCreateProperty(options?: UseCreatePropertyOptions): CreatePropertyResult {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const createProperty = async (address: string, description?: string): Promise<Property | null> => {
    setError(null);

    if (!address.trim()) {
      setError("Address is required");
      return null;
    }

    setIsCreating(true);
    const supabase = createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      setError(`Authentication error: ${authError.message}`);
      setIsCreating(false);
      return null;
    }

    if (!user) {
      setError("You must be logged in");
      setIsCreating(false);
      return null;
    }

    const { data: newProperty, error: insertError } = await supabase
      .from("properties")
      .insert({
        user_id: user.id,
        address: address.trim(),
        description: description?.trim() || null,
      })
      .select()
      .single();

    if (insertError) {
      setError(`Failed to create property: ${insertError.message}`);
      setIsCreating(false);
      return null;
    }

    if (!newProperty) {
      setError("Property may have been created. Please refresh.");
      setIsCreating(false);
      return null;
    }

    setIsCreating(false);
    options?.onSuccess?.(newProperty);
    return newProperty;
  };

  return { createProperty, isCreating, error, clearError };
}
