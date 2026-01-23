"use client";

import { useState, useCallback, memo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
  MoreHorizontal,
  Eye,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { EditPropertyDialog } from "./EditPropertyDialog";
import type { Property } from "@/lib/database.types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PropertyListItemProps {
  property: Property & { stagingCount: number; previewImageUrl?: string | null };
}

export const PropertyListItem = memo(function PropertyListItem({ property }: PropertyListItemProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isFavorite, setIsFavorite] = useState(property.is_favorite || false);

  const hasPreviewImage = !!property.previewImageUrl;

  const handleDelete = useCallback(async () => {
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
  }, [property.id, router]);

  const handleToggleFavorite = useCallback(async (e?: React.MouseEvent) => {
    e?.stopPropagation();

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
  }, [isFavorite, property.id]);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, []);

  return (
    <>
      <Link href={`/properties/${property.id}`}>
        <div
          className={cn(
            "flex items-center gap-4 p-3 rounded-xl border bg-card/60 backdrop-blur-sm",
            "transition-all duration-200 hover:bg-card hover:shadow-md cursor-pointer"
          )}
        >
          {/* Thumbnail */}
          <div className="relative h-16 w-24 rounded-lg overflow-hidden flex-shrink-0">
            {hasPreviewImage ? (
              <Image
                src={property.previewImageUrl!}
                alt={property.address}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 flex items-center justify-center">
                <MapPin className="h-6 w-6 text-white/40" />
              </div>
            )}
            {/* Favorite indicator */}
            {isFavorite && (
              <div className="absolute top-1 right-1">
                <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-foreground truncate">
                {property.address}
              </h3>
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <ImageIcon className="h-3.5 w-3.5" />
                <span>{property.stagingCount} photo{property.stagingCount !== 1 ? "s" : ""}</span>
              </div>
              <span>•</span>
              <span>{formatDate(property.created_at)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.preventDefault()}>
            {/* Favorite */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleFavorite}
                  disabled={isTogglingFavorite}
                  className={cn(
                    "h-8 w-8 p-0",
                    isFavorite && "text-yellow-500"
                  )}
                >
                  {isTogglingFavorite ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Star className={cn("h-4 w-4", isFavorite && "fill-current")} />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isFavorite ? "Remove from Favorites" : "Add to Favorites"}
              </TooltipContent>
            </Tooltip>

            {/* Stage Photo */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="h-8 w-8 p-0"
                >
                  <Link href={`/stage?property=${property.id}`}>
                    <Camera className="h-4 w-4" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Stage Photo</TooltipContent>
            </Tooltip>

            {/* More Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href={`/properties/${property.id}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-red-600 focus:text-red-600"
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Link>

      <EditPropertyDialog
        property={property}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />
    </>
  );
});
