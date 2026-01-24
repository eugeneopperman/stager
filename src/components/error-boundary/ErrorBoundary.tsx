"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Custom fallback component. If not provided, uses default error UI */
  fallback?: ReactNode;
  /** Error handler for logging */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Show technical details (stack trace) - useful for development */
  showDetails?: boolean;
  /** Custom title for the error */
  title?: string;
  /** Custom description for the error */
  description?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Return custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { showDetails, title, description } = this.props;
      const { error, errorInfo } = this.state;

      return (
        <div className="flex items-center justify-center min-h-[400px] p-4">
          <Card className="max-w-lg w-full">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-destructive/10">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
              </div>
              <CardTitle className="text-xl">
                {title || "Something went wrong"}
              </CardTitle>
              <CardDescription>
                {description || "We encountered an unexpected error. Please try again or contact support if the problem persists."}
              </CardDescription>
            </CardHeader>

            {showDetails && error && (
              <CardContent>
                <details className="text-sm">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                    Technical Details
                  </summary>
                  <div className="mt-2 p-3 rounded-lg bg-muted font-mono text-xs overflow-auto max-h-48">
                    <p className="text-destructive font-semibold mb-2">
                      {error.name}: {error.message}
                    </p>
                    {errorInfo?.componentStack && (
                      <pre className="whitespace-pre-wrap text-muted-foreground">
                        {errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                </details>
              </CardContent>
            )}

            <CardFooter className="flex justify-center gap-3">
              <Button onClick={this.handleRetry} variant="default">
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

    return this.props.children;
  }
}
