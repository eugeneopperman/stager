"use client";

import { useEffect, useRef, useCallback } from "react";
import { driver, type Driver } from "driver.js";
import "driver.js/dist/driver.css";
import "./tour-styles.css";
import { TOUR_STEPS, MOBILE_TOUR_STEPS, DRIVER_CONFIG } from "./tour-config";
import { createClient } from "@/lib/supabase/client";

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
    // Detect mobile (sidebar not visible on < lg)
    const isMobile = window.innerWidth < 1024;
    const baseSteps = isMobile ? MOBILE_TOUR_STEPS : TOUR_STEPS;

    // Inject credits into the credits step
    const steps = baseSteps.map((step) => {
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

    driverRef.current = driver({
      ...DRIVER_CONFIG,
      steps,
      onDestroyStarted: async () => {
        await markOnboardingComplete();
        onComplete?.();
        driverRef.current?.destroy();
      },
    });

    if (autoStart) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => driverRef.current?.drive(), 150);
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
  // Detect mobile
  const isMobile = window.innerWidth < 1024;
  const baseSteps = isMobile ? MOBILE_TOUR_STEPS : TOUR_STEPS;

  // Inject credits into the credits step
  const steps = baseSteps.map((step) => {
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

  const tourDriver = driver({
    ...DRIVER_CONFIG,
    steps,
  });

  tourDriver.drive();
}
