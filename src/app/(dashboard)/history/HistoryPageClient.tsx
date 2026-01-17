"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PropertyOption {
  id: string;
  address: string;
}

interface HistoryPageClientProps {
  jobs: StagingJob[];
  properties: PropertyOption[];
}

type StatusFilter = "all" | "completed" | "processing" | "failed";
type SortOrder = "newest" | "oldest";
type ViewMode = "grid" | "list";

export function HistoryPageClient({ jobs, properties }: HistoryPageClientProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Calculate stats
  const completedCount = jobs.filter((job) => job.status === "completed").length;
  const processingCount = jobs.filter(
    (job) => job.status === "processing" || job.status === "pending"
  ).length;
  const totalCount = jobs.length;

  const filteredJobs = useMemo(() => {
    let result = [...jobs];

    // Filter by status
    if (statusFilter === "completed") {
      result = result.filter((job) => job.status === "completed");
    } else if (statusFilter === "processing") {
      result = result.filter(
        (job) => job.status === "processing" || job.status === "pending"
      );
    } else if (statusFilter === "failed") {
      result = result.filter((job) => job.status === "failed");
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

  const handleCardClick = (filter: StatusFilter) => {
    // Toggle off if already selected, otherwise set the filter
    if (statusFilter === filter) {
      setStatusFilter("all");
    } else {
      setStatusFilter(filter);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        {/* Completed */}
        <Card
          onClick={() => handleCardClick("completed")}
          className={cn(
            "cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg",
            "animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100",
            statusFilter === "completed" &&
              "ring-2 ring-emerald-500 ring-offset-2 ring-offset-background"
          )}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15">
              <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{completedCount}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>

        {/* Processing */}
        <Card
          onClick={() => handleCardClick("processing")}
          className={cn(
            "cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg",
            "animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150",
            statusFilter === "processing" &&
              "ring-2 ring-amber-500 ring-offset-2 ring-offset-background"
          )}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/15">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{processingCount}</p>
              <p className="text-sm text-muted-foreground">Processing</p>
            </div>
          </CardContent>
        </Card>

        {/* Total */}
        <Card
          onClick={() => handleCardClick("all")}
          className={cn(
            "cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg",
            "animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200",
            statusFilter === "all" &&
              "ring-2 ring-primary ring-offset-2 ring-offset-background"
          )}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-muted/80 dark:bg-white/10">
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalCount}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Jobs List */}
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-250">
        <h2 className="text-lg font-semibold text-foreground">All Staging Jobs</h2>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as StatusFilter)}
          >
            <SelectTrigger className="w-[180px] bg-card/60 backdrop-blur-sm">
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
                viewMode === "grid" &&
                  "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
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
                viewMode === "list" &&
                  "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
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
    </div>
  );
}
