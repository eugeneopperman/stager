"use client";

import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface StagingErrorBoundaryProps {
  children: ReactNode;
  onReset?: () => void;
}

interface StagingErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class StagingErrorBoundary extends Component<
  StagingErrorBoundaryProps,
  StagingErrorBoundaryState
> {
  constructor(props: StagingErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): Partial<StagingErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("StagingErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 space-y-4">
          <div className="p-4 rounded-full bg-destructive/10">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>

          <Alert variant="destructive" className="max-w-md">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Staging Error</AlertTitle>
            <AlertDescription>
              An error occurred during the staging process. This could be due to an
              unsupported image format, network issues, or a temporary service problem.
            </AlertDescription>
          </Alert>

          <div className="flex gap-3 mt-4">
            <Button onClick={this.handleReset} variant="default">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                this.handleReset();
                window.location.reload();
              }}
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Start Fresh
            </Button>
          </div>

          {process.env.NODE_ENV === "development" && this.state.error && (
            <details className="w-full max-w-md text-sm mt-4">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                Debug Info
              </summary>
              <pre className="mt-2 p-3 rounded-lg bg-muted font-mono text-xs overflow-auto">
                {this.state.error.message}
                {"\n\n"}
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
