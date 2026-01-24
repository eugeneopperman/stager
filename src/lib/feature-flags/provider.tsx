"use client";

/**
 * Feature Flags React Provider
 *
 * Provides feature flag context to React components.
 */

import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  isFeatureEnabled,
  createFlagContext,
  type FeatureFlagKey,
  type FeatureFlagContext,
} from "./index";

// ============================================
// Context
// ============================================

interface FeatureFlagsContextValue {
  context: FeatureFlagContext | undefined;
  isEnabled: (flag: FeatureFlagKey) => boolean;
  flags: Record<FeatureFlagKey, boolean>;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextValue>({
  context: undefined,
  isEnabled: () => false,
  flags: {} as Record<FeatureFlagKey, boolean>,
});

// ============================================
// Provider
// ============================================

interface FeatureFlagsProviderProps {
  children: ReactNode;
  user?: {
    id?: string;
    email?: string;
    plan?: string;
    organizationId?: string;
  };
}

export function FeatureFlagsProvider({ children, user }: FeatureFlagsProviderProps) {
  const context = useMemo(() => createFlagContext(user), [user]);

  const value = useMemo<FeatureFlagsContextValue>(() => {
    const isEnabled = (flag: FeatureFlagKey) => isFeatureEnabled(flag, context);

    // Pre-compute all flags for quick access
    const flags = {
      NEW_STAGING_UI: isEnabled("NEW_STAGING_UI"),
      BATCH_STAGING: isEnabled("BATCH_STAGING"),
      AI_STYLE_SUGGESTIONS: isEnabled("AI_STYLE_SUGGESTIONS"),
      STRIPE_CHECKOUT_V2: isEnabled("STRIPE_CHECKOUT_V2"),
      CREDIT_TOPUPS: isEnabled("CREDIT_TOPUPS"),
      TEAM_ANALYTICS: isEnabled("TEAM_ANALYTICS"),
      TEAM_PERMISSIONS: isEnabled("TEAM_PERMISSIONS"),
      REDIS_CACHING: isEnabled("REDIS_CACHING"),
      IMAGE_OPTIMIZATION: isEnabled("IMAGE_OPTIMIZATION"),
      BETA_FEATURES: isEnabled("BETA_FEATURES"),
    } as Record<FeatureFlagKey, boolean>;

    return { context, isEnabled, flags };
  }, [context]);

  return (
    <FeatureFlagsContext.Provider value={value}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

// ============================================
// Hooks
// ============================================

/**
 * Get the full feature flags context
 */
export function useFeatureFlagsContext() {
  return useContext(FeatureFlagsContext);
}

/**
 * Check if a specific feature flag is enabled
 */
export function useFeatureFlag(flag: FeatureFlagKey): boolean {
  const { flags } = useContext(FeatureFlagsContext);
  return flags[flag] ?? false;
}

/**
 * Get multiple feature flags at once
 */
export function useFeatureFlags<K extends FeatureFlagKey>(
  flagKeys: K[]
): Record<K, boolean> {
  const { flags } = useContext(FeatureFlagsContext);
  const result = {} as Record<K, boolean>;
  for (const key of flagKeys) {
    result[key] = flags[key] ?? false;
  }
  return result;
}

// ============================================
// Components
// ============================================

interface FeatureProps {
  flag: FeatureFlagKey;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Conditionally render children based on feature flag
 */
export function Feature({ flag, children, fallback = null }: FeatureProps) {
  const isEnabled = useFeatureFlag(flag);
  return <>{isEnabled ? children : fallback}</>;
}

/**
 * Render children only if flag is disabled
 */
export function FeatureOff({ flag, children }: Omit<FeatureProps, "fallback">) {
  const isEnabled = useFeatureFlag(flag);
  return <>{!isEnabled ? children : null}</>;
}
