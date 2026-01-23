import { type FurnitureStyle } from "@/lib/constants";

export interface StagedVariation {
  style: FurnitureStyle;
  imageUrl: string | null;
  status: "pending" | "queued" | "preprocessing" | "processing" | "completed" | "failed";
  error?: string;
  jobId?: string;
  provider?: string;
  progressMessage?: string;
}
