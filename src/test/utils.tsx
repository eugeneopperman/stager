import { ReactNode } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { SWRConfig } from "swr";

// Re-export everything from testing-library
export * from "@testing-library/react";

interface TestWrapperProps {
  children: ReactNode;
}

/**
 * Test wrapper that provides SWR configuration for testing
 * Disables caching and deduplication for predictable test behavior
 */
export function TestWrapper({ children }: TestWrapperProps) {
  return (
    <SWRConfig
      value={{
        provider: () => new Map(),
        dedupingInterval: 0,
        errorRetryCount: 0,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      }}
    >
      {children}
    </SWRConfig>
  );
}

/**
 * Creates a wrapper component for renderHook
 */
export function createTestWrapper() {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <TestWrapper>{children}</TestWrapper>;
  };
}

/**
 * Custom render function that wraps components with common providers
 */
function customRender(ui: React.ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  return render(ui, { wrapper: TestWrapper, ...options });
}

// Override the default render with our custom one
export { customRender as render };
