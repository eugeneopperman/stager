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
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Plus, Check, Trash2, Loader2 } from "lucide-react";

interface PropertyOption {
  id: string;
  address: string;
}

interface HistoryItemMenuProps {
  isCompleted: boolean;
  properties: PropertyOption[];
  currentPropertyId: string | null;
  isDeleting: boolean;
  onAssignProperty: (propertyId: string | null) => void;
  onDelete: () => void;
}

export const HistoryItemMenu = memo(function HistoryItemMenu({
  isCompleted,
  properties,
  currentPropertyId,
  isDeleting,
  onAssignProperty,
  onDelete,
}: HistoryItemMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {isCompleted && (
          <>
            <DropdownMenuLabel>Add to Property</DropdownMenuLabel>
            {properties.length > 0 ? (
              <>
                {properties.map((property) => (
                  <DropdownMenuItem
                    key={property.id}
                    onClick={() => onAssignProperty(property.id)}
                    className="flex items-center justify-between"
                  >
                    <span className="truncate">{property.address}</span>
                    {currentPropertyId === property.id && (
                      <Check className="h-4 w-4 text-green-600 shrink-0 ml-2" />
                    )}
                  </DropdownMenuItem>
                ))}
                {currentPropertyId && (
                  <DropdownMenuItem
                    onClick={() => onAssignProperty(null)}
                    className="text-muted-foreground"
                  >
                    Remove from property
                  </DropdownMenuItem>
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
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem
          onClick={onDelete}
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
  );
});
