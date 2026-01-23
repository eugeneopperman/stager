import { ReactElement, ReactNode } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { TooltipProvider } from "@/components/ui/tooltip";

// Mock DashboardContext
const MockDashboardProvider = ({ children }: { children: ReactNode }) => {
  return <>{children}</>;
};

// All providers wrapper
function AllProviders({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      <MockDashboardProvider>{children}</MockDashboardProvider>
    </TooltipProvider>
  );
}

// Custom render with providers
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Re-export everything
export * from "@testing-library/react";
export { customRender as render };

// Helper to create a mock file
export function createMockFile(
  name = "test.jpg",
  type = "image/jpeg",
  size = 1024
): File {
  const blob = new Blob(["x".repeat(size)], { type });
  return new File([blob], name, { type });
}

// Helper to create a mock data URL
export function createMockDataUrl(): string {
  return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
}

// Helper to wait for async operations
export function waitForAsync(ms = 0): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
