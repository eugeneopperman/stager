"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-destructive/10">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-xl">Something went wrong</CardTitle>
          <CardDescription>
            We encountered an unexpected error while loading this page. Please
            try again or return to the dashboard.
          </CardDescription>
        </CardHeader>

        {error.digest && (
          <CardContent>
            <p className="text-xs text-center text-muted-foreground font-mono">
              Error ID: {error.digest}
            </p>
          </CardContent>
        )}

        {process.env.NODE_ENV === "development" && (
          <CardContent>
            <details className="text-sm">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                Technical Details
              </summary>
              <div className="mt-2 p-3 rounded-lg bg-muted font-mono text-xs overflow-auto max-h-48">
                <p className="text-destructive font-semibold mb-2">
                  {error.name}: {error.message}
                </p>
                {error.stack && (
                  <pre className="whitespace-pre-wrap text-muted-foreground">
                    {error.stack}
                  </pre>
                )}
              </div>
            </details>
          </CardContent>
        )}

        <CardFooter className="flex justify-center gap-3">
          <Button onClick={reset} variant="default">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              <Home className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
