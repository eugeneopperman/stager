import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Loader2, Clock } from "lucide-react";

type Status = "completed" | "processing" | "failed" | "pending";

interface StatusBadgeProps {
  status: Status;
}

export const StatusBadge = memo(function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case "completed":
      return (
        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      );
    case "processing":
      return (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Processing
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">
          <XCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      );
    case "pending":
      return (
        <Badge variant="outline" className="bg-slate-500/10 text-slate-600 border-slate-500/30">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    default:
      return null;
  }
});
