"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Search } from "lucide-react";
import { PropertyCard } from "./PropertyCard";
import { CreatePropertyButton } from "./CreatePropertyButton";
import type { Property } from "@/lib/database.types";

type SortOption = "newest" | "oldest" | "name-asc" | "name-desc" | "stagings";

interface PropertyWithCount extends Property {
  stagingCount: number;
}

interface PropertiesListClientProps {
  properties: PropertyWithCount[];
}

export function PropertiesListClient({ properties }: PropertiesListClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

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
  }, [properties, searchQuery, sortBy]);

  return (
    <div className="space-y-4">
      {/* Search and Sort Controls */}
      {properties.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search properties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-full sm:w-48">
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
        </div>
      )}

      {/* Results count when searching */}
      {searchQuery && (
        <p className="text-sm text-slate-500">
          {filteredAndSortedProperties.length} of {properties.length} properties
        </p>
      )}

      {/* Properties Grid */}
      {filteredAndSortedProperties.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedProperties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      ) : properties.length > 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              No properties found
            </h3>
            <p className="text-slate-500 text-center">
              Try a different search term
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              No properties yet
            </h3>
            <p className="text-slate-500 text-center mb-6 max-w-sm">
              Add your first property to organize your staging projects
            </p>
            <CreatePropertyButton />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
