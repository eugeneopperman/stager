"use client";

import { memo } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImagePlus, ArrowRight } from "lucide-react";
import { RecentStagingCard } from "./RecentStagingCard";

interface StagingJob {
  id: string;
  room_type: string;
  style: string;
  status: string;
  staged_image_url: string | null;
  created_at: string;
}

interface RecentStagingsProps {
  jobs: StagingJob[] | null;
}

export const RecentStagings = memo(function RecentStagings({
  jobs,
}: RecentStagingsProps) {
  return (
    <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300" data-tour="dashboard-recent">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Stagings</CardTitle>
          <CardDescription>Your latest virtual staging jobs</CardDescription>
        </div>
        <Button variant="ghost" asChild>
          <Link href="/history">
            View all
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {jobs && jobs.length > 0 ? (
          <div className="space-y-3">
            {jobs.map((job) => (
              <RecentStagingCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <ImagePlus className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No staging jobs yet
            </h3>
            <p className="text-muted-foreground mb-4">
              Stage your first photo to see it here
            </p>
            <Button asChild>
              <Link href="/stage">
                <ImagePlus className="mr-2 h-4 w-4" />
                Stage Your First Photo
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
