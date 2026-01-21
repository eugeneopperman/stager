import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  ImagePlus,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { PropertyActions } from "./PropertyActions";
import { StagedImageCard } from "./StagedImageCard";
import { BatchDownloadButton } from "@/components/download/BatchDownloadButton";

interface PropertyDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PropertyDetailPage({ params }: PropertyDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch property
  const { data: property, error } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .eq("user_id", user?.id)
    .single();

  if (error || !property) {
    notFound();
  }

  // Fetch staging jobs for this property
  const { data: stagingJobs } = await supabase
    .from("staging_jobs")
    .select("*")
    .eq("property_id", id)
    .order("created_at", { ascending: false });

  const completedJobs = stagingJobs?.filter((job) => job.status === "completed") || [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

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
            <Clock className="h-3 w-3 mr-1" />
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

  const formatRoomType = (roomType: string) => {
    return roomType
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" asChild className="mb-2">
        <Link href="/properties">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Properties
        </Link>
      </Button>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-950">
              <MapPin className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-foreground">
                {property.address}
              </h1>
              {property.description && (
                <p className="text-muted-foreground mt-2">
                  {property.description}
                </p>
              )}
              <p className="text-sm text-slate-500 mt-2 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Added {formatDate(property.created_at)}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <PropertyActions property={property} />
          {completedJobs.length > 0 && (
            <BatchDownloadButton
              propertyId={property.id}
              propertyAddress={property.address}
              imageCount={completedJobs.length}
            />
          )}
          <Button asChild>
            <Link href={`/stage?property=${property.id}`}>
              <ImagePlus className="mr-2 h-4 w-4" />
              Stage Photo
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              {stagingJobs?.length || 0}
            </p>
            <p className="text-sm text-slate-500">Total Stagings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-600">
              {completedJobs.length}
            </p>
            <p className="text-sm text-slate-500">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              {stagingJobs?.filter((j) => j.status === "processing").length || 0}
            </p>
            <p className="text-sm text-slate-500">In Progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Staged Images Gallery */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Staged Photos</CardTitle>
            <CardDescription>
              All virtual staging jobs for this property
            </CardDescription>
          </div>
          {completedJobs.length > 0 && (
            <BatchDownloadButton
              propertyId={property.id}
              propertyAddress={property.address}
              imageCount={completedJobs.length}
              size="sm"
              showCount
            />
          )}
        </CardHeader>
        <CardContent>
          {completedJobs.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {completedJobs.map((job) => (
                <StagedImageCard
                  key={job.id}
                  job={job}
                  propertyAddress={property.address}
                />
              ))}
            </div>
          ) : stagingJobs && stagingJobs.length > 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                Staging in progress
              </h3>
              <p className="text-slate-500">
                Your staged photos will appear here once completed
              </p>
            </div>
          ) : (
            <div className="text-center py-12">
              <ImagePlus className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                No staged photos yet
              </h3>
              <p className="text-slate-500 mb-4">
                Stage your first photo for this property
              </p>
              <Button asChild>
                <Link href={`/stage?property=${property.id}`}>
                  <ImagePlus className="mr-2 h-4 w-4" />
                  Stage Photo
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Jobs Table */}
      {stagingJobs && stagingJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Staging History</CardTitle>
            <CardDescription>
              All staging jobs for this property
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stagingJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      {job.staged_image_url ? (
                        <img
                          src={job.staged_image_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImagePlus className="h-4 w-4 text-slate-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {formatRoomType(job.room_type)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {job.style} style • {formatShortDate(job.created_at)}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(job.status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
