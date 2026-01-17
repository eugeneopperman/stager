"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Building2, ImageIcon, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { ROOM_TYPES, FURNITURE_STYLES } from "@/lib/constants";
import { NotificationDropdown } from "./NotificationDropdown";

interface SearchResult {
  properties: Array<{
    id: string;
    address: string;
    description: string | null;
  }>;
  stagingJobs: Array<{
    id: string;
    room_type: string;
    style: string;
    staged_image_url: string | null;
    status: string;
    created_at: string;
    property: { id: string; address: string } | null;
  }>;
}

function getRoomLabel(roomType: string): string {
  const room = ROOM_TYPES.find((r) => r.id === roomType);
  return room?.label || roomType;
}

function getStyleLabel(style: string): string {
  const styleObj = FURNITURE_STYLES.find((s) => s.id === style);
  return styleObj?.label || style;
}

export function FloatingControls() {
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const performSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults(null);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setShowResults(true);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);
  };

  const handleResultClick = (url: string) => {
    closeSearch();
    router.push(url);
  };

  const openSearch = () => {
    setIsSearchOpen(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const closeSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery("");
    setSearchResults(null);
    setShowResults(false);
  };

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        if (searchQuery === "") {
          closeSearch();
        } else {
          setShowResults(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchQuery]);

  // Close search on ESC key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isSearchOpen) {
        closeSearch();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen]);

  const hasResults = searchResults &&
    (searchResults.properties.length > 0 || searchResults.stagingJobs.length > 0);

  return (
    <div className="fixed top-4 right-6 z-50 flex items-center gap-2">
      {/* Search */}
      <div ref={searchRef} className="relative">
        <div
          className={cn(
            "flex items-center gap-2 overflow-hidden",
            "bg-card/80 backdrop-blur-xl",
            "border border-black/[0.08] dark:border-white/[0.12]",
            "shadow-lg rounded-full",
            "transition-all duration-300 ease-out",
            isSearchOpen ? "w-80 pl-4 pr-2" : "w-10"
          )}
        >
          {isSearchOpen ? (
            <>
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                ref={inputRef}
                placeholder="Search properties, staging jobs..."
                className="border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 h-10"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
              />
              {isSearching ? (
                <Loader2 className="h-4 w-4 text-muted-foreground animate-spin shrink-0" />
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={closeSearch}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={openSearch}
            >
              <Search className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {isSearchOpen && showResults && searchQuery.length >= 2 && (
          <div className={cn(
            "absolute top-full right-0 w-80 mt-2 overflow-hidden z-50",
            "bg-popover/95 backdrop-blur-xl",
            "dark:bg-popover/90",
            "border border-border/40 dark:border-white/8",
            "rounded-2xl shadow-xl dark:shadow-black/40",
            "animate-in fade-in-0 slide-in-from-top-2 duration-200"
          )}>
            {isSearching ? (
              <div className="p-4 text-center text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                Searching...
              </div>
            ) : hasResults ? (
              <div className="max-h-80 overflow-y-auto">
                {/* Properties */}
                {searchResults.properties.length > 0 && (
                  <div>
                    <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50">
                      Properties
                    </div>
                    {searchResults.properties.map((property) => (
                      <button
                        key={property.id}
                        onClick={() => handleResultClick(`/properties/${property.id}`)}
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
                {searchResults.stagingJobs.length > 0 && (
                  <div>
                    <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50">
                      Staging Jobs
                    </div>
                    {searchResults.stagingJobs.map((job) => (
                      <button
                        key={job.id}
                        onClick={() => handleResultClick(`/history`)}
                        className={cn(
                          "w-full px-3 py-2.5 flex items-center gap-3 text-left",
                          "transition-colors duration-150",
                          "hover:bg-accent/50 dark:hover:bg-white/5"
                        )}
                      >
                        {job.staged_image_url ? (
                          <img
                            src={job.staged_image_url}
                            alt=""
                            className="h-8 w-8 rounded-xl object-cover shrink-0 ring-1 ring-border/40"
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
        )}
      </div>

      {/* Notifications */}
      <NotificationDropdown />
    </div>
  );
}
