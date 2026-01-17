"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  Building2,
  Search,
  Star,
  ArrowUpDown,
  LayoutGrid,
  List,
} from "lucide-react";
import { PropertyCard } from "./PropertyCard";
import { PropertyListItem } from "./PropertyListItem";
import { CreatePropertyButton } from "./CreatePropertyButton";
import type { Property } from "@/lib/database.types";
import { cn } from "@/lib/utils";

type SortOption = "newest" | "oldest" | "name-asc" | "name-desc" | "stagings";
type ViewMode = "grid" | "list";

interface PropertyWithCount extends Property {
  stagingCount: number;
  previewImageUrl?: string | null;
}

interface PropertiesListClientProps {
  properties: PropertyWithCount[];
}

export function PropertiesListClient({ properties }: PropertiesListClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const filteredAndSortedProperties = useMemo(() => {
    let result = [...properties];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (property) =>
          property.address.toLowerCase().includes(query) ||
          property.description?.toLowerCase().includes(query)
      );
    }

    // Filter by favorites
    if (showFavoritesOnly) {
      result = result.filter((property) => property.is_favorite);
    }

    // Sort
    switch (sortBy) {
      case "newest":
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "oldest":
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case "name-asc":
        result.sort((a, b) => a.address.localeCompare(b.address));
        break;
      case "name-desc":
        result.sort((a, b) => b.address.localeCompare(a.address));
        break;
      case "stagings":
        result.sort((a, b) => b.stagingCount - a.stagingCount);
        break;
    }

    return result;
  }, [properties, searchQuery, sortBy, showFavoritesOnly]);

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      {properties.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-0 sm:min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search properties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-card/60 backdrop-blur-sm"
            />
          </div>

          {/* Favorites Toggle */}
          <Button
            variant={showFavoritesOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={cn(
              "gap-2",
              showFavoritesOnly && "bg-yellow-500/90 hover:bg-yellow-500 text-white"
            )}
          >
            <Star className={cn("h-4 w-4", showFavoritesOnly && "fill-current")} />
            Favorites
          </Button>

          {/* Spacer - hidden on mobile */}
          <div className="hidden sm:block sm:flex-1 min-w-0" />

          {/* Sort and View Mode row on mobile */}
          <div className="flex items-center gap-3 w-full sm:w-auto">

          {/* Sort */}
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-full sm:w-[165px] bg-card/60 backdrop-blur-sm">
              <ArrowUpDown className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              <SelectItem value="stagings">Most Stagings</SelectItem>
            </SelectContent>
          </Select>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border bg-card/60 backdrop-blur-sm p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("grid")}
              className={cn(
                "h-9 w-9 sm:h-8 sm:w-8 p-0",
                viewMode === "grid" && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("list")}
              className={cn(
                "h-9 w-9 sm:h-8 sm:w-8 p-0",
                viewMode === "list" && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
              )}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          </div>
        </div>
      )}

      {/* Results count */}
      {properties.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Showing {filteredAndSortedProperties.length} of {properties.length} properties
          {showFavoritesOnly && " (favorites)"}
        </p>
      )}

      {/* Properties Grid or List */}
      {filteredAndSortedProperties.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredAndSortedProperties.map((property) => (
              <PropertyListItem key={property.id} property={property} />
            ))}
          </div>
        )
      ) : properties.length > 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No properties match your filters.{" "}
            <button
              onClick={() => {
                setSearchQuery("");
                setShowFavoritesOnly(false);
              }}
              className="text-primary hover:underline"
            >
              Clear filters
            </button>
          </p>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No properties yet
            </h3>
            <p className="text-muted-foreground text-center mb-6 max-w-sm">
              Add your first property to organize your staging projects
            </p>
            <CreatePropertyButton />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
