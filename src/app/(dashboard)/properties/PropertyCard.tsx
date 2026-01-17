"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  ImageIcon,
  Pencil,
  Trash2,
  Camera,
  Star,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { EditPropertyDialog } from "./EditPropertyDialog";
import type { Property } from "@/lib/database.types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PropertyCardProps {
  property: Property & { stagingCount: number; previewImageUrl?: string | null };
}

export function PropertyCard({ property }: PropertyCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isFavorite, setIsFavorite] = useState(property.is_favorite || false);

  const hasPreviewImage = !!property.previewImageUrl;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!confirm("Are you sure you want to delete this property? This will not delete associated staging jobs.")) {
      return;
    }

    setIsDeleting(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("properties")
      .delete()
      .eq("id", property.id);

    if (error) {
      console.error("Failed to delete property:", error);
      toast.error("Failed to delete property. Please try again.");
      setIsDeleting(false);
    } else {
      toast.success("Property deleted");
      router.refresh();
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    setIsTogglingFavorite(true);
    const supabase = createClient();

    const newValue = !isFavorite;
    const { error } = await supabase
      .from("properties")
      .update({ is_favorite: newValue })
      .eq("id", property.id);

    if (error) {
      console.error("Failed to toggle favorite:", error);
      toast.error("Failed to update favorite");
    } else {
      setIsFavorite(newValue);
      toast.success(newValue ? "Added to favorites" : "Removed from favorites");
    }

    setIsTogglingFavorite(false);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setShowEditDialog(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <>
      <Link href={`/properties/${property.id}`}>
        <div
          className={cn(
            "group relative aspect-[4/3] rounded-2xl overflow-hidden",
            "transition-all duration-300 ease-out",
            "hover:scale-[1.02] hover:shadow-xl cursor-pointer"
          )}
        >
          {/* Background Image or Gradient Placeholder */}
          {hasPreviewImage ? (
            <img
              src={property.previewImageUrl!}
              alt={property.address}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700">
              <div className="absolute inset-0 flex items-center justify-center">
                <MapPin className="h-16 w-16 text-white/20" />
              </div>
            </div>
          )}

          {/* Staging Count Badge (top-left) */}
          <div className="absolute top-3 left-3 z-10">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-black/60 backdrop-blur-sm rounded-full text-white text-xs font-medium">
              <ImageIcon className="h-3.5 w-3.5" />
              <span>{property.stagingCount} photo{property.stagingCount !== 1 ? "s" : ""}</span>
            </div>
          </div>

          {/* Hover Action Bar - visible on mobile, hover on desktop */}
          <div
            className={cn(
              "absolute top-3 right-3 z-20",
              "opacity-100 lg:opacity-0 lg:group-hover:opacity-100",
              "translate-y-0 lg:translate-y-1 lg:group-hover:translate-y-0",
              "transition-all duration-200",
              "flex items-center gap-1 px-2 py-1.5 rounded-full",
              "bg-black/60 backdrop-blur-xl"
            )}
            onClick={(e) => e.preventDefault()}
          >
            {/* Favorite - larger touch target on mobile */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleToggleFavorite}
                  disabled={isTogglingFavorite}
                  className={cn(
                    "p-2.5 sm:p-1.5 rounded-full transition-colors",
                    "hover:bg-white/20",
                    isFavorite ? "text-yellow-400" : "text-white"
                  )}
                >
                  {isTogglingFavorite ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Star className={cn("h-4 w-4", isFavorite && "fill-current")} />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {isFavorite ? "Remove from Favorites" : "Add to Favorites"}
              </TooltipContent>
            </Tooltip>

            {/* Edit - larger touch target on mobile */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleEdit}
                  className="p-2.5 sm:p-1.5 rounded-full transition-colors hover:bg-white/20 text-white"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Edit</TooltipContent>
            </Tooltip>

            {/* Stage Photo - larger touch target on mobile */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={`/stage?property=${property.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="p-2.5 sm:p-1.5 rounded-full transition-colors hover:bg-white/20 text-white"
                >
                  <Camera className="h-4 w-4" />
                </Link>
              </TooltipTrigger>
              <TooltipContent>Stage Photo</TooltipContent>
            </Tooltip>

            {/* Delete - larger touch target on mobile */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="p-2.5 sm:p-1.5 rounded-full transition-colors hover:bg-red-500/50 text-white"
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>Delete</TooltipContent>
            </Tooltip>
          </div>

          {/* Bottom Gradient + Info */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-12">
            <h3 className="text-white font-semibold text-sm line-clamp-1">
              {property.address}
            </h3>
            <p className="text-white/70 text-xs mt-0.5 line-clamp-1">
              {property.description || `Added ${formatDate(property.created_at)}`}
            </p>
          </div>

          {/* Favorite indicator (always visible when favorited - hidden on mobile since action bar is visible) */}
          {isFavorite && (
            <div className="absolute top-3 right-3 z-10 hidden lg:block lg:group-hover:opacity-0 transition-opacity duration-200">
              <Star className="h-5 w-5 text-yellow-400 fill-yellow-400 drop-shadow-md" />
            </div>
          )}
        </div>
      </Link>

      <EditPropertyDialog
        property={property}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />
    </>
  );
}
