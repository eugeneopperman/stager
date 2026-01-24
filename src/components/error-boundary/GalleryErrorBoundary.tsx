"use client";

import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GalleryErrorBoundaryProps {
  children: ReactNode;
  onRetry?: () => void;
}

interface GalleryErrorBoundaryState {
  hasError: boolean;
}

export class GalleryErrorBoundary extends Component<
  GalleryErrorBoundaryProps,
  GalleryErrorBoundaryState
> {
  constructor(props: GalleryErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): Partial<GalleryErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("GalleryErrorBoundary caught an error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="p-3 rounded-full bg-amber-500/10 mb-4">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
          </div>
          <h3 className="text-lg font-medium mb-2">Unable to load gallery</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            There was a problem loading the images. Please try refreshing the page.
          </p>
          <Button onClick={this.handleRetry} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
