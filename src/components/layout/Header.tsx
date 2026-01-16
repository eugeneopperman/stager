"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Search, Menu, Building2, ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ROOM_TYPES, FURNITURE_STYLES } from "@/lib/constants";

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

interface HeaderProps {
  user?: {
    email?: string;
    full_name?: string;
  };
  onMenuClick?: () => void;
}

function getRoomLabel(roomType: string): string {
  const room = ROOM_TYPES.find((r) => r.id === roomType);
  return room?.label || roomType;
}

function getStyleLabel(style: string): string {
  const styleObj = FURNITURE_STYLES.find((s) => s.id === style);
  return styleObj?.label || style;
}

export function Header({ user, onMenuClick }: HeaderProps) {
  const router = useRouter();
  const supabase = createClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
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

    // Debounce search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);
  };

  const handleResultClick = (url: string) => {
    setShowResults(false);
    setSearchQuery("");
    setSearchResults(null);
    router.push(url);
  };

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : user?.email?.[0]?.toUpperCase() || "U";

  const hasResults = searchResults &&
    (searchResults.properties.length > 0 || searchResults.stagingJobs.length > 0);

  return (
    <header className={cn(
      "sticky top-0 z-40 h-16 px-6",
      // Glass effect
      "bg-background/70 backdrop-blur-xl",
      "dark:bg-background/60",
      // Border
      "border-b border-border/50 dark:border-white/[0.08]"
    )}>
      <div className="max-w-7xl mx-auto w-full h-full flex items-center gap-4">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Search */}
        <div className="flex-1 max-w-md" ref={searchRef}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search properties, staging jobs..."
            className="pl-11 rounded-full bg-secondary/50 border-border/30 hover:border-border/50 focus:border-primary/50"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground animate-spin" />
          )}

          {/* Search Results Dropdown */}
          {showResults && searchQuery.length >= 2 && (
            <div className={cn(
              "absolute top-full left-0 right-0 mt-3 overflow-hidden z-50",
              // Glass effect
              "bg-popover/95 backdrop-blur-xl",
              "dark:bg-popover/90",
              // Border and shadow - rounder
              "border border-border/40 dark:border-white/8",
              "rounded-2xl shadow-xl dark:shadow-black/40",
              // Animation
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
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className={cn(
            "absolute top-1.5 right-1.5 h-2 w-2 rounded-full",
            "bg-primary",
            "ring-2 ring-background",
            "animate-pulse"
          )} />
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "relative h-10 w-10 rounded-full p-0",
                "ring-2 ring-transparent",
                "hover:ring-primary/20 transition-all duration-200"
              )}
            >
              <Avatar className="h-10 w-10">
                <AvatarFallback className={cn(
                  "bg-gradient-to-br from-primary to-violet-600",
                  "text-white font-medium"
                )}>
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.full_name || "User"}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/billing">Billing</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} variant="destructive">
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      </div>
    </header>
  );
}
