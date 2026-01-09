"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MapPin, ImageIcon, MoreVertical, Eye, Pencil, Trash2, ImagePlus } from "lucide-react";
import Link from "next/link";
import type { Property } from "@/lib/database.types";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { EditPropertyDialog } from "./EditPropertyDialog";

interface PropertyCardProps {
  property: Property & { stagingCount: number };
}

export function PropertyCard({ property }: PropertyCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const handleDelete = async () => {
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
      alert("Failed to delete property. Please try again.");
    } else {
      router.refresh();
    }

    setIsDeleting(false);
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
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        {/* Header with gradient */}
        <div className="h-24 bg-gradient-to-br from-blue-500 to-blue-600 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <MapPin className="h-10 w-10 text-white/30" />
          </div>
          {/* Actions dropdown */}
          <div className="absolute top-2 right-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/20 hover:bg-white/30 text-white">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
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
                <DropdownMenuItem asChild>
                  <Link href={`/stage?property=${property.id}`}>
                    <ImagePlus className="h-4 w-4 mr-2" />
                    Stage Photo
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isDeleting ? "Deleting..." : "Delete"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <CardContent className="p-4">
          {/* Address */}
          <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-2 mb-1">
            {property.address}
          </h3>

          {/* Description */}
          {property.description && (
            <p className="text-sm text-slate-500 line-clamp-2 mb-3">
              {property.description}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center gap-1 text-sm text-slate-500">
              <ImageIcon className="h-4 w-4" />
              <span>{property.stagingCount} staging{property.stagingCount !== 1 ? "s" : ""}</span>
            </div>
            <span className="text-xs text-slate-400">
              Added {formatDate(property.created_at)}
            </span>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link href={`/properties/${property.id}`}>
                <Eye className="h-4 w-4 mr-1" />
                View
              </Link>
            </Button>
            <Button size="sm" className="flex-1" asChild>
              <Link href={`/stage?property=${property.id}`}>
                <ImagePlus className="h-4 w-4 mr-1" />
                Stage
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <EditPropertyDialog
        property={property}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />
    </>
  );
}
