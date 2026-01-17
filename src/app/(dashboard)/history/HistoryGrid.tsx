"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HistoryJobCard } from "./HistoryJobCard";
import { HistoryListItem } from "./HistoryListItem";
import type { StagingJob } from "@/lib/database.types";
import {
  Star,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  Sparkles,
  LayoutGrid,
  List,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PropertyOption {
  id: string;
  address: string;
}

interface HistoryGridProps {
  jobs: StagingJob[];
  properties: PropertyOption[];
}

type StatusFilter = "all" | "completed" | "processing" | "failed";
type SortOrder = "newest" | "oldest";
type ViewMode = "grid" | "list";

export function HistoryGrid({ jobs, properties }: HistoryGridProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const filteredJobs = useMemo(() => {
    let result = [...jobs];

    // Filter by status
    if (statusFilter !== "all") {
      result = result.filter((job) => job.status === statusFilter);
    }

    // Filter by favorites
    if (showFavoritesOnly) {
      result = result.filter((job) => job.is_favorite);
    }

    // Sort by date
    result.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [jobs, statusFilter, showFavoritesOnly, sortOrder]);

  const getStatusIcon = (status: StatusFilter) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "processing":
        return <Clock className="h-4 w-4 text-amber-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Status Filter */}
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as StatusFilter)}
        >
          <SelectTrigger className="w-[160px] bg-card/60 backdrop-blur-sm">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                All Status
              </div>
            </SelectItem>
            <SelectItem value="completed">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Completed
              </div>
            </SelectItem>
            <SelectItem value="processing">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                Processing
              </div>
            </SelectItem>
            <SelectItem value="failed">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                Failed
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

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

        {/* Spacer */}
        <div className="flex-1" />

        {/* Sort */}
        <Select
          value={sortOrder}
          onValueChange={(value) => setSortOrder(value as SortOrder)}
        >
          <SelectTrigger className="w-[165px] bg-card/60 backdrop-blur-sm">
            <ArrowUpDown className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
          </SelectContent>
        </Select>

        {/* View Mode Toggle */}
        <div className="flex items-center rounded-lg border bg-card/60 backdrop-blur-sm p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("grid")}
            className={cn(
              "h-8 w-8 p-0",
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
              "h-8 w-8 p-0",
              viewMode === "list" && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
            )}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredJobs.length} of {jobs.length} staging jobs
        {showFavoritesOnly && " (favorites)"}
        {statusFilter !== "all" && ` (${statusFilter})`}
      </p>

      {/* Grid or List */}
      {filteredJobs.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredJobs.map((job) => (
              <HistoryJobCard key={job.id} job={job} properties={properties} />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredJobs.map((job) => (
              <HistoryListItem key={job.id} job={job} properties={properties} />
            ))}
          </div>
        )
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No jobs match your filters.{" "}
            <button
              onClick={() => {
                setStatusFilter("all");
                setShowFavoritesOnly(false);
              }}
              className="text-primary hover:underline"
            >
              Clear filters
            </button>
          </p>
        </div>
      )}
    </div>
  );
}
