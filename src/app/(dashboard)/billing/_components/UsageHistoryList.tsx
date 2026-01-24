import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { UsageHistoryItem } from "./UsageHistoryItem";

interface Job {
  id: string;
  created_at: string;
  credits_used: number | null;
  room_type: string;
  style: string;
  staged_image_url: string | null;
}

interface UsageHistoryListProps {
  jobs: Job[];
}

export function UsageHistoryList({ jobs }: UsageHistoryListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage History</CardTitle>
        <CardDescription>
          Your recent credit usage from staging jobs
        </CardDescription>
      </CardHeader>
      <CardContent>
        {jobs.length > 0 ? (
          <div className="space-y-3">
            {jobs.map((job) => (
              <UsageHistoryItem key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Sparkles className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              No usage history yet
            </h3>
            <p className="text-slate-500">
              Your credit usage will appear here when you start staging photos
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
