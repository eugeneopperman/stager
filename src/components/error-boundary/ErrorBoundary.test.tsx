import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorBoundary } from "./ErrorBoundary";

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <div>Child content</div>;
};

describe("ErrorBoundary", () => {
  beforeEach(() => {
    // Suppress console.error for cleaner test output
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  describe("when no error occurs", () => {
    it("should render children normally", () => {
      render(
        <ErrorBoundary>
          <div>Test content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText("Test content")).toBeInTheDocument();
    });

    it("should not render error UI", () => {
      render(
        <ErrorBoundary>
          <div>Test content</div>
        </ErrorBoundary>
      );

      expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
    });
  });

  describe("when an error occurs", () => {
    it("should render default error UI", () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });

    it("should render custom title when provided", () => {
      render(
        <ErrorBoundary title="Custom Error Title">
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      expect(screen.getByText("Custom Error Title")).toBeInTheDocument();
    });

    it("should render custom description when provided", () => {
      render(
        <ErrorBoundary description="Custom error description">
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      expect(screen.getByText("Custom error description")).toBeInTheDocument();
    });

    it("should render custom fallback when provided", () => {
      render(
        <ErrorBoundary fallback={<div>Custom fallback</div>}>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      expect(screen.getByText("Custom fallback")).toBeInTheDocument();
      expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
    });

    it("should call onError callback with error info", () => {
      const onError = vi.fn();

      render(
        <ErrorBoundary onError={onError}>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );
    });

    it("should render Try Again and Go to Dashboard buttons", () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /go to dashboard/i })).toBeInTheDocument();
    });

    it("should reset error state when Try Again is clicked", () => {
      // Use a stateful wrapper to control the error state
      let throwError = true;

      const ConditionalThrow = () => {
        if (throwError) {
          throw new Error("Test error");
        }
        return <div>Child content</div>;
      };

      render(
        <ErrorBoundary>
          <ConditionalThrow />
        </ErrorBoundary>
      );

      expect(screen.getByText("Something went wrong")).toBeInTheDocument();

      // Change the condition before clicking retry
      throwError = false;

      // Click Try Again
      fireEvent.click(screen.getByRole("button", { name: /try again/i }));

      // Now the component should render without error
      expect(screen.getByText("Child content")).toBeInTheDocument();
      expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
    });
  });

  describe("technical details", () => {
    it("should not show technical details by default", () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      expect(screen.queryByText("Technical Details")).not.toBeInTheDocument();
    });

    it("should show technical details when showDetails is true", () => {
      render(
        <ErrorBoundary showDetails>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      expect(screen.getByText("Technical Details")).toBeInTheDocument();
    });

    it("should display error message in technical details", () => {
      render(
        <ErrorBoundary showDetails>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      // Expand the details
      fireEvent.click(screen.getByText("Technical Details"));

      expect(screen.getByText(/Test error/)).toBeInTheDocument();
    });
  });

  describe("Go to Dashboard link", () => {
    it("should have correct href", () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow />
        </ErrorBoundary>
      );

      const link = screen.getByRole("link", { name: /go to dashboard/i });
      expect(link).toHaveAttribute("href", "/dashboard");
    });
  });
});
