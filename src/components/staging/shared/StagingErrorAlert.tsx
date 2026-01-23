"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface StagingErrorAlertProps {
  error: string | null;
  onDismiss?: () => void;
  onRetry?: () => void;
  className?: string;
}

/**
 * StagingErrorAlert - A consistent error alert for staging operations
 */
export function StagingErrorAlert({
  error,
  onDismiss,
  onRetry,
  className,
}: StagingErrorAlertProps) {
  if (!error) return null;

  return (
    <Card className={`border-destructive bg-destructive/10 ${className || ""}`}>
      <CardContent className="flex items-center gap-3 p-4">
        <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
        <div className="flex-1">
          <p className="font-medium text-destructive">{error}</p>
        </div>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Try Again
          </Button>
        )}
        {onDismiss && !onRetry && (
          <Button variant="outline" size="sm" onClick={onDismiss}>
            Dismiss
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
