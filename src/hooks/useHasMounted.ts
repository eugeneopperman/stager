"use client";

import { useSyncExternalStore } from "react";

/**
 * A hook that returns true after the component has mounted.
 * Uses useSyncExternalStore to avoid the setState-in-effect lint warning.
 * This is useful for avoiding hydration mismatches with client-only values.
 */
export function useHasMounted(): boolean {
  return useSyncExternalStore(
    // Subscribe function (no-op for mounted state)
    () => () => {},
    // Client snapshot
    () => true,
    // Server snapshot
    () => false
  );
}
