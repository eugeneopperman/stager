"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Search, Menu, Building2, ImageIcon, Loader2 } from "lucide-react";
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
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-white dark:bg-slate-950 px-6">
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
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search properties, staging jobs..."
            className="pl-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 animate-spin" />
          )}

          {/* Search Results Dropdown */}
          {showResults && searchQuery.length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden z-50">
              {isSearching ? (
                <div className="p-4 text-center text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                  Searching...
                </div>
              ) : hasResults ? (
                <div className="max-h-80 overflow-y-auto">
                  {/* Properties */}
                  {searchResults.properties.length > 0 && (
                    <div>
                      <div className="px-3 py-2 text-xs font-semibold text-slate-500 bg-slate-50 dark:bg-slate-800">
                        Properties
                      </div>
                      {searchResults.properties.map((property) => (
                        <button
                          key={property.id}
                          onClick={() => handleResultClick(`/properties/${property.id}`)}
                          className="w-full px-3 py-2 flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-800 text-left"
                        >
                          <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                              {property.address}
                            </p>
                            {property.description && (
                              <p className="text-xs text-slate-500 truncate">
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
                      <div className="px-3 py-2 text-xs font-semibold text-slate-500 bg-slate-50 dark:bg-slate-800">
                        Staging Jobs
                      </div>
                      {searchResults.stagingJobs.map((job) => (
                        <button
                          key={job.id}
                          onClick={() => handleResultClick(`/history`)}
                          className="w-full px-3 py-2 flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-800 text-left"
                        >
                          {job.staged_image_url ? (
                            <img
                              src={job.staged_image_url}
                              alt=""
                              className="h-8 w-8 rounded object-cover shrink-0"
                            />
                          ) : (
                            <ImageIcon className="h-4 w-4 text-slate-400 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                              {getRoomLabel(job.room_type)} - {getStyleLabel(job.style)}
                            </p>
                            {job.property && (
                              <p className="text-xs text-slate-500 truncate">
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
                <div className="p-4 text-center text-slate-500 text-sm">
                  No results found for &quot;{searchQuery}&quot;
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-600" />
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-blue-600 text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.full_name || "User"}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
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
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
