"use client";

import { memo } from "react";
import Image from "next/image";
import { Building2, ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROOM_TYPES, FURNITURE_STYLES } from "@/lib/constants";
import type { SearchResult } from "./useGlobalSearch";

interface SearchResultsProps {
  isSearching: boolean;
  searchQuery: string;
  results: SearchResult | null;
  hasResults: boolean;
  onResultClick: (url: string) => void;
}

function getRoomLabel(roomType: string): string {
  const room = ROOM_TYPES.find((r) => r.id === roomType);
  return room?.label || roomType;
}

function getStyleLabel(style: string): string {
  const styleObj = FURNITURE_STYLES.find((s) => s.id === style);
  return styleObj?.label || style;
}

export const SearchResults = memo(function SearchResults({
  isSearching,
  searchQuery,
  results,
  hasResults,
  onResultClick,
}: SearchResultsProps) {
  return (
    <div
      className={cn(
        "absolute top-full right-0 w-[calc(100vw-6rem)] sm:w-80 mt-2 overflow-hidden z-50",
        "bg-popover/95 backdrop-blur-xl",
        "dark:bg-popover/90",
        "border border-border/40 dark:border-white/8",
        "rounded-2xl shadow-xl dark:shadow-black/40",
        "animate-in fade-in-0 slide-in-from-top-2 duration-200"
      )}
    >
      {isSearching ? (
        <div className="p-4 text-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
          Searching...
        </div>
      ) : hasResults && results ? (
        <div className="max-h-80 overflow-y-auto">
          {/* Properties */}
          {results.properties.length > 0 && (
            <div>
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50">
                Properties
              </div>
              {results.properties.map((property) => (
                <button
                  key={property.id}
                  onClick={() => onResultClick(`/properties/${property.id}`)}
                  className={cn(
                    "w-full px-3 py-2.5 flex items-center gap-3 text-left",
                    "transition-colors duration-150",
                    "hover:bg-accent/50 dark:hover:bg-white/5"
                  )}
                >
                  <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {property.address}
                    </p>
                    {property.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {property.description}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Staging Jobs */}
          {results.stagingJobs.length > 0 && (
            <div>
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50">
                Staging Jobs
              </div>
              {results.stagingJobs.map((job) => (
                <button
                  key={job.id}
                  onClick={() => onResultClick(`/history`)}
                  className={cn(
                    "w-full px-3 py-2.5 flex items-center gap-3 text-left",
                    "transition-colors duration-150",
                    "hover:bg-accent/50 dark:hover:bg-white/5"
                  )}
                >
                  {job.staged_image_url ? (
                    <Image
                      src={job.staged_image_url}
                      alt=""
                      width={32}
                      height={32}
                      className="rounded-xl object-cover shrink-0 ring-1 ring-border/40"
                      unoptimized
                    />
                  ) : (
                    <ImageIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {getRoomLabel(job.room_type)} - {getStyleLabel(job.style)}
                    </p>
                    {job.property && (
                      <p className="text-xs text-muted-foreground truncate">
                        {job.property.address}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 text-center text-muted-foreground text-sm">
          No results found for &quot;{searchQuery}&quot;
        </div>
      )}
    </div>
  );
});
