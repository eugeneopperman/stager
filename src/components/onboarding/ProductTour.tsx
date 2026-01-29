"use client";

import { useEffect, useRef, useCallback } from "react";
import { driver, type Driver } from "driver.js";
import "driver.js/dist/driver.css";
import "./tour-styles.css";
import { TOUR_STEPS, DRIVER_CONFIG, MOBILE_DRIVER_CONFIG, getPageTourSteps } from "./tour-config";
import { createClient } from "@/lib/supabase/client";
import type { DriveStep } from "driver.js";

/**
 * Check if we're on a mobile viewport (sidebar hidden at < lg = 1024px)
 */
function isMobileViewport(): boolean {
  return typeof window !== "undefined" && window.innerWidth < 1024;
}

/**
 * Get the appropriate Driver.js config based on viewport size
 */
function getDriverConfig() {
  return isMobileViewport() ? MOBILE_DRIVER_CONFIG : DRIVER_CONFIG;
}

/**
 * Custom event to request opening the mobile sidebar
 */
export const OPEN_MOBILE_SIDEBAR_EVENT = "stager:open-mobile-sidebar";

/**
 * Dispatch event to open mobile sidebar
 */
function requestOpenMobileSidebar(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(OPEN_MOBILE_SIDEBAR_EVENT));
  }
}

/**
 * Adjust step positioning for mobile - prefer top/bottom over left/right
 * to prevent popover from going off-screen horizontally
 */
function adjustStepsForMobile(steps: DriveStep[]): DriveStep[] {
  if (!isMobileViewport()) return steps;

  return steps.map((step) => {
    if (!step.popover) return step;

    const side = step.popover.side;
    // On mobile, convert left/right positioning to top/bottom
    // to ensure popover stays within viewport
    if (side === "left" || side === "right") {
      return {
        ...step,
        popover: {
          ...step.popover,
          side: "bottom" as const,
          align: "center" as const,
        },
      };
    }
    return step;
  });
}

interface ProductTourProps {
  autoStart?: boolean;
  onComplete?: () => void;
  credits?: number;
  skipDbUpdate?: boolean;
}

export function ProductTour({
  autoStart = true,
  onComplete,
  credits = 0,
  skipDbUpdate = false,
}: ProductTourProps) {
  const driverRef = useRef<Driver | null>(null);

  const markOnboardingComplete = useCallback(async () => {
    if (skipDbUpdate) return;

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("profiles")
          .update({ onboarding_completed_at: new Date().toISOString() })
          .eq("id", user.id);
      }
    } catch (error) {
      console.error("Failed to mark onboarding complete:", error);
    }
  }, [skipDbUpdate]);

  useEffect(() => {
    const isMobile = isMobileViewport();

    // On mobile, open sidebar first so all tour elements are visible
    if (isMobile && autoStart) {
      requestOpenMobileSidebar();
    }

    // Use full tour steps - on mobile, sidebar will be opened
    const baseSteps = TOUR_STEPS;

    // Inject credits into the credits step
    let steps = baseSteps.map((step) => {
      if (step.element === '[data-tour="credits"]') {
        return {
          ...step,
          popover: {
            ...step.popover,
            description: step.popover?.description?.replace(
              "{credits}",
              String(credits)
            ),
          },
        };
      }
      return step;
    });

    // Adjust positioning for mobile viewports
    steps = adjustStepsForMobile(steps);

    driverRef.current = driver({
      ...getDriverConfig(),
      steps,
      onPopoverRender: (popover) => {
        // Add tooltip to close button
        const closeBtn = popover.wrapper.querySelector('.driver-popover-close-btn');
        if (closeBtn) {
          closeBtn.setAttribute('title', 'End Tour');
          closeBtn.setAttribute('aria-label', 'End Tour');
        }
      },
      onDestroyStarted: async () => {
        await markOnboardingComplete();
        onComplete?.();
        driverRef.current?.destroy();
      },
    });

    if (autoStart) {
      // Longer delay on mobile to wait for sidebar animation
      const delay = isMobile ? 400 : 150;
      const timer = setTimeout(() => driverRef.current?.drive(), delay);
      return () => {
        clearTimeout(timer);
        driverRef.current?.destroy();
      };
    }

    return () => {
      driverRef.current?.destroy();
    };
  }, [autoStart, credits, onComplete, markOnboardingComplete]);

  return null; // Driver.js creates its own overlay
}

/**
 * Start the product tour manually (e.g., from Settings)
 * @param credits - Number of credits to display in the tour
 */
export function startTour(credits: number = 0) {
  const isMobile = isMobileViewport();

  // On mobile, open sidebar first so all tour elements are visible
  if (isMobile) {
    requestOpenMobileSidebar();
  }

  // Use full tour steps - on mobile, sidebar will be opened
  const baseSteps = TOUR_STEPS;

  // Inject credits into the credits step
  let steps = baseSteps.map((step) => {
    if (step.element === '[data-tour="credits"]') {
      return {
        ...step,
        popover: {
          ...step.popover,
          description: step.popover?.description?.replace(
            "{credits}",
            String(credits)
          ),
        },
      };
    }
    return step;
  });

  // Adjust positioning for mobile viewports
  steps = adjustStepsForMobile(steps);

  const tourDriver = driver({
    ...getDriverConfig(),
    steps,
    onPopoverRender: (popover) => {
      // Add tooltip to close button
      const closeBtn = popover.wrapper.querySelector('.driver-popover-close-btn');
      if (closeBtn) {
        closeBtn.setAttribute('title', 'End Tour');
        closeBtn.setAttribute('aria-label', 'End Tour');
      }
    },
  });

  // Longer delay on mobile to wait for sidebar animation
  const delay = isMobile ? 400 : 0;
  setTimeout(() => tourDriver.drive(), delay);
}

/**
 * Start a page-specific contextual help tour
 * @param pathname - The current page pathname (e.g., "/dashboard", "/stage")
 * @returns boolean indicating if the tour was started
 */
export function startPageTour(pathname: string): boolean {
  const steps = getPageTourSteps(pathname);

  if (!steps || steps.length === 0) {
    return false;
  }

  // Filter out steps for elements that don't exist on the page
  let availableSteps = steps.filter((step) => {
    if (!step.element) return true; // Keep steps without elements (intro steps)
    const element = document.querySelector(step.element as string);
    return element !== null;
  });

  if (availableSteps.length === 0) {
    return false;
  }

  // Adjust positioning for mobile viewports
  availableSteps = adjustStepsForMobile(availableSteps);

  const tourDriver = driver({
    ...getDriverConfig(),
    doneBtnText: "Got it!",
    steps: availableSteps,
    onPopoverRender: (popover) => {
      // Add tooltip to close button
      const closeBtn = popover.wrapper.querySelector('.driver-popover-close-btn');
      if (closeBtn) {
        closeBtn.setAttribute('title', 'End Tour');
        closeBtn.setAttribute('aria-label', 'End Tour');
      }
    },
  });

  tourDriver.drive();
  return true;
}
