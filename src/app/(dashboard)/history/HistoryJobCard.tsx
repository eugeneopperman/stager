"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Download,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowLeftRight,
  Building2,
  Plus,
  Check,
  MapPin,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { StagingJob } from "@/lib/database.types";
import Link from "next/link";

interface PropertyOption {
  id: string;
  address: string;
}

interface HistoryJobCardProps {
  job: StagingJob;
  properties: PropertyOption[];
}

export function HistoryJobCard({ job, properties }: HistoryJobCardProps) {
  const router = useRouter();
  const [showDetail, setShowDetail] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isAssigning, setIsAssigning] = useState(false);
  const [currentPropertyId, setCurrentPropertyId] = useState<string | null>(job.property_id);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "processing":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Processing
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const handleDownload = () => {
    if (job.staged_image_url) {
      const link = document.createElement("a");
      link.href = job.staged_image_url;
      link.download = `staged-${job.room_type}-${job.style}-${job.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleSliderMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  };

  const handleAssignToProperty = async (propertyId: string | null) => {
    setIsAssigning(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("staging_jobs")
      .update({ property_id: propertyId })
      .eq("id", job.id);

    if (error) {
      console.error("Failed to assign property:", error);
    } else {
      setCurrentPropertyId(propertyId);
      router.refresh();
    }

    setIsAssigning(false);
  };

  const currentProperty = properties.find((p) => p.id === currentPropertyId);

  const roomTypeLabel = job.room_type
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const styleLabel = job.style
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        {/* Image Preview - Clickable */}
        <div
          className={`relative aspect-video bg-slate-100 dark:bg-slate-900 ${
            job.staged_image_url ? "cursor-pointer" : ""
          }`}
          onClick={() => job.staged_image_url && setShowDetail(true)}
        >
          {job.staged_image_url ? (
            <img
              src={job.staged_image_url}
              alt="Staged room"
              className="w-full h-full object-cover hover:opacity-90 transition-opacity"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              {job.status === "processing" ? (
                <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
              ) : (
                <XCircle className="h-8 w-8 text-slate-300" />
              )}
            </div>
          )}
          {/* Status Badge Overlay */}
          <div className="absolute top-2 right-2">
            {getStatusBadge(job.status)}
          </div>
          {/* Click to view hint */}
          {job.staged_image_url && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 transition-colors">
              <div className="opacity-0 hover:opacity-100 transition-opacity">
                <div className="bg-white/90 dark:bg-slate-800/90 rounded-full p-2">
                  <Eye className="h-5 w-5 text-slate-700 dark:text-slate-200" />
                </div>
              </div>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          {/* Room Type & Style */}
          <div className="mb-2">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              {roomTypeLabel}
            </h3>
            <p className="text-sm text-slate-500">{styleLabel} style</p>
          </div>

          {/* Property Badge */}
          {currentProperty && (
            <Link
              href={`/properties/${currentProperty.id}`}
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mb-2"
            >
              <MapPin className="h-3 w-3" />
              {currentProperty.address.length > 30
                ? currentProperty.address.substring(0, 30) + "..."
                : currentProperty.address}
            </Link>
          )}

          {/* Date */}
          <p className="text-xs text-slate-400 mb-4">
            {formatDate(job.created_at)}
          </p>

          {/* Actions */}
          {job.status === "completed" && job.staged_image_url && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
              {/* Add to Property Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isAssigning}
                  >
                    {isAssigning ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Building2 className="h-4 w-4 mr-1" />
                        Property
                      </>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Add to Property</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {properties.length > 0 ? (
                    <>
                      {properties.map((property) => (
                        <DropdownMenuItem
                          key={property.id}
                          onClick={() => handleAssignToProperty(property.id)}
                          className="flex items-center justify-between"
                        >
                          <span className="truncate">{property.address}</span>
                          {currentPropertyId === property.id && (
                            <Check className="h-4 w-4 text-green-600 shrink-0 ml-2" />
                          )}
                        </DropdownMenuItem>
                      ))}
                      {currentPropertyId && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleAssignToProperty(null)}
                            className="text-slate-500"
                          >
                            Remove from property
                          </DropdownMenuItem>
                        </>
                      )}
                    </>
                  ) : (
                    <DropdownMenuItem asChild>
                      <Link href="/properties" className="flex items-center">
                        <Plus className="h-4 w-4 mr-2" />
                        Create a property first
                      </Link>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {job.status === "failed" && job.error_message && (
            <p className="text-xs text-red-500 truncate" title={job.error_message}>
              {job.error_message}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {roomTypeLabel} - {styleLabel}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Toggle */}
            <div className="flex justify-center">
              <Button
                variant={showComparison ? "default" : "outline"}
                size="sm"
                onClick={() => setShowComparison(!showComparison)}
              >
                <ArrowLeftRight className="h-4 w-4 mr-2" />
                {showComparison ? "Hide Comparison" : "Compare Before/After"}
              </Button>
            </div>

            {/* Image Display */}
            {showComparison && job.original_image_url && !job.original_image_url.includes("...") ? (
              <div
                className="relative aspect-video cursor-col-resize select-none rounded-lg overflow-hidden"
                onMouseMove={handleSliderMove}
              >
                <img
                  src={job.original_image_url}
                  alt="Original"
                  className="absolute inset-0 w-full h-full object-contain bg-slate-100 dark:bg-slate-900"
                />
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${sliderPosition}%` }}
                >
                  <img
                    src={job.staged_image_url || ""}
                    alt="Staged"
                    className="absolute inset-0 w-full h-full object-contain bg-slate-100 dark:bg-slate-900"
                    style={{ width: `${100 / (sliderPosition / 100)}%`, maxWidth: "none" }}
                  />
                </div>
                <div
                  className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
                  style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                    <ArrowLeftRight className="h-4 w-4 text-slate-600" />
                  </div>
                </div>
                <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                  Staged
                </div>
                <div className="absolute top-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                  Original
                </div>
              </div>
            ) : (
              <div className="rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900">
                <img
                  src={job.staged_image_url || ""}
                  alt="Staged room"
                  className="w-full h-auto max-h-[70vh] object-contain"
                />
              </div>
            )}

            {/* Info & Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-slate-500">
                Created {formatDate(job.created_at)}
              </div>
              <Button onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
