/**
 * Observability React Hooks
 *
 * Client-side hooks for user identification and tracking.
 */

"use client";

import { useEffect } from "react";
import { identifyUser, clearUser, trackNavigation, trackUserAction } from "./index";
import { usePathname } from "next/navigation";

/**
 * Hook to identify the current user in Sentry
 * Use this in your auth provider or layout
 */
export function useIdentifyUser(user: {
  id: string;
  email?: string;
  plan?: string;
  organizationId?: string;
} | null) {
  useEffect(() => {
    if (user) {
      identifyUser(user);
    } else {
      clearUser();
    }
  }, [user?.id, user?.email, user?.plan, user?.organizationId]);
}

/**
 * Hook to track page navigation
 */
export function useTrackNavigation() {
  const pathname = usePathname();

  useEffect(() => {
    // Store previous path in session storage for tracking
    const previousPath = sessionStorage.getItem("previousPath") || "/";

    if (previousPath !== pathname) {
      trackNavigation(previousPath, pathname);
      sessionStorage.setItem("previousPath", pathname);
    }
  }, [pathname]);
}

/**
 * Hook to create a tracked action handler
 */
export function useTrackedAction(actionName: string) {
  return (data?: Record<string, unknown>) => {
    trackUserAction(actionName, data);
  };
}

/**
 * Combined hook for full observability setup
 */
export function useObservability(user: {
  id: string;
  email?: string;
  plan?: string;
  organizationId?: string;
} | null) {
  useIdentifyUser(user);
  useTrackNavigation();
}
