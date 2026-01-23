"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface PropertyOption {
  id: string;
  address: string;
}

interface UseStagingJobMutationsOptions {
  jobId: string;
  initialPropertyId: string | null;
  initialIsFavorite: boolean;
  properties?: PropertyOption[];
}

export function useStagingJobMutations(options: UseStagingJobMutationsOptions) {
  const { jobId, initialPropertyId, initialIsFavorite, properties = [] } = options;
  const router = useRouter();

  const [currentPropertyId, setCurrentPropertyId] = useState<string | null>(initialPropertyId);
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const currentProperty = properties.find((p) => p.id === currentPropertyId);

  const assignToProperty = useCallback(
    async (propertyId: string | null) => {
      setIsAssigning(true);
      const supabase = createClient();

      const { error } = await supabase
        .from("staging_jobs")
        .update({ property_id: propertyId })
        .eq("id", jobId);

      if (error) {
        console.error("Failed to assign property:", error);
        toast.error("Failed to update property");
      } else {
        setCurrentPropertyId(propertyId);
        const property = properties.find((p) => p.id === propertyId);
        if (propertyId && property) {
          toast.success(`Added to ${property.address}`);
        } else {
          toast.success("Removed from property");
        }
        router.refresh();
      }

      setIsAssigning(false);
    },
    [jobId, properties, router]
  );

  const toggleFavorite = useCallback(async () => {
    setIsTogglingFavorite(true);
    const supabase = createClient();

    const newValue = !isFavorite;
    const { error } = await supabase
      .from("staging_jobs")
      .update({ is_favorite: newValue })
      .eq("id", jobId);

    if (error) {
      console.error("Failed to toggle favorite:", error);
      toast.error("Failed to update favorite");
    } else {
      setIsFavorite(newValue);
      toast.success(newValue ? "Added to favorites" : "Removed from favorites");
    }

    setIsTogglingFavorite(false);
  }, [jobId, isFavorite]);

  const deleteJob = useCallback(async () => {
    if (!confirm("Are you sure you want to delete this staging job? This action cannot be undone.")) {
      return false;
    }

    setIsDeleting(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("staging_jobs")
      .delete()
      .eq("id", jobId);

    if (error) {
      console.error("Failed to delete staging job:", error);
      toast.error("Failed to delete staging job. Please try again.");
      setIsDeleting(false);
      return false;
    } else {
      toast.success("Staging job deleted");
      router.refresh();
      return true;
    }
  }, [jobId, router]);

  return {
    currentPropertyId,
    currentProperty,
    isFavorite,
    isAssigning,
    isTogglingFavorite,
    isDeleting,
    assignToProperty,
    toggleFavorite,
    deleteJob,
  };
}
