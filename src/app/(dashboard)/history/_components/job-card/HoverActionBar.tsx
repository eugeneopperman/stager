"use client";

import { memo } from "react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { HoverActionButton } from "@/components/ui/action-button";
import {
  Download,
  ArrowLeftRight,
  Building2,
  Plus,
  Check,
  Trash2,
  Star,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PropertyOption {
  id: string;
  address: string;
}

interface HoverActionBarProps {
  isCompleted: boolean;
  hasOriginalImage: boolean;
  hasStagedImage: boolean;
  isFavorite: boolean;
  showOriginal: boolean;
  currentPropertyId: string | null;
  properties: PropertyOption[];
  isTogglingFavorite: boolean;
  isAssigning: boolean;
  isDeleting: boolean;
  onToggleFavorite: (e: React.MouseEvent) => void;
  onToggleCompare: (e: React.MouseEvent) => void;
  onRemix: (e: React.MouseEvent) => void;
  onDownload: (e: React.MouseEvent) => void;
  onAssignToProperty: (propertyId: string | null) => void;
  onDelete: (e: React.MouseEvent) => void;
}

export const HoverActionBar = memo(function HoverActionBar({
  isCompleted,
  hasOriginalImage,
  hasStagedImage,
  isFavorite,
  showOriginal,
  currentPropertyId,
  properties,
  isTogglingFavorite,
  isAssigning,
  isDeleting,
  onToggleFavorite,
  onToggleCompare,
  onRemix,
  onDownload,
  onAssignToProperty,
  onDelete,
}: HoverActionBarProps) {
  return (
    <div
      className={cn(
        "absolute top-3 right-3 z-20",
        "opacity-0 group-hover:opacity-100",
        "translate-y-1 group-hover:translate-y-0",
        "transition-all duration-200",
        "flex items-center gap-1 px-2 py-1.5 rounded-full",
        "bg-black/60 backdrop-blur-xl"
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Favorite */}
      {isCompleted && (
        <HoverActionButton
          icon={Star}
          tooltip={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
          onClick={onToggleFavorite}
          disabled={isTogglingFavorite}
          loading={isTogglingFavorite}
          iconClassName={cn(isFavorite && "text-yellow-400 fill-current")}
        />
      )}

      {/* Compare (only if original exists) */}
      {isCompleted && hasOriginalImage && (
        <HoverActionButton
          icon={ArrowLeftRight}
          tooltip="Compare Before/After"
          onClick={onToggleCompare}
          active={showOriginal}
        />
      )}

      {/* Remix */}
      {isCompleted && hasOriginalImage && (
        <HoverActionButton
          icon={RefreshCw}
          tooltip="Remix with Different Style"
          onClick={onRemix}
        />
      )}

      {/* Download */}
      {isCompleted && hasStagedImage && (
        <HoverActionButton
          icon={Download}
          tooltip="Download"
          onClick={onDownload}
        />
      )}

      {/* Property Dropdown */}
      {isCompleted && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              disabled={isAssigning}
              className={cn(
                "p-1.5 rounded-full transition-colors",
                "hover:bg-white/20 text-white",
                currentPropertyId && "text-blue-400"
              )}
            >
              {isAssigning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Building2 className="h-4 w-4" />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Add to Property</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {properties.length > 0 ? (
              <>
                {properties.map((property) => (
                  <DropdownMenuItem
                    key={property.id}
                    onClick={() => onAssignToProperty(property.id)}
                    className="flex items-center justify-between"
                  >
                    <span className="truncate">{property.address}</span>
                    {currentPropertyId === property.id && (
                      <Check className="h-4 w-4 text-green-600 shrink-0 ml-2" />
                    )}
                  </DropdownMenuItem>
                ))}
                {currentPropertyId && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onAssignToProperty(null)}
                      className="text-muted-foreground"
                    >
                      Remove from property
                    </DropdownMenuItem>
                  </>
                )}
              </>
            ) : (
              <DropdownMenuItem asChild>
                <Link href="/properties" className="flex items-center">
                  <Plus className="h-4 w-4 mr-2" />
                  Create a property first
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Delete */}
      <HoverActionButton
        icon={Trash2}
        tooltip="Delete"
        onClick={onDelete}
        disabled={isDeleting}
        loading={isDeleting}
        destructive
      />
    </div>
  );
});
