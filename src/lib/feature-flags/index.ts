/**
 * Feature Flags System
 *
 * A simple, extensible feature flag system that supports:
 * - Environment variable-based flags (default)
 * - User/plan-based targeting
 * - Percentage rollouts
 * - A/B testing
 *
 * Can be extended to integrate with LaunchDarkly, PostHog, etc.
 */

import { trackFeatureFlag } from "@/lib/observability";

// ============================================
// Feature Flag Definitions
// ============================================

/**
 * All feature flags defined in the application.
 * Add new flags here with their default values.
 */
export const FEATURE_FLAGS = {
  // Staging features
  NEW_STAGING_UI: {
    key: "new_staging_ui",
    defaultValue: false,
    description: "Enable the new staging wizard UI",
  },
  BATCH_STAGING: {
    key: "batch_staging",
    defaultValue: true,
    description: "Enable batch staging (multiple images)",
  },
  AI_STYLE_SUGGESTIONS: {
    key: "ai_style_suggestions",
    defaultValue: false,
    description: "Show AI-powered style suggestions",
  },

  // Billing features
  STRIPE_CHECKOUT_V2: {
    key: "stripe_checkout_v2",
    defaultValue: false,
    description: "Use new Stripe checkout flow",
  },
  CREDIT_TOPUPS: {
    key: "credit_topups",
    defaultValue: true,
    description: "Allow credit top-up purchases",
  },

  // Team features
  TEAM_ANALYTICS: {
    key: "team_analytics",
    defaultValue: false,
    description: "Show team usage analytics",
  },
  TEAM_PERMISSIONS: {
    key: "team_permissions",
    defaultValue: false,
    description: "Advanced team permission controls",
  },

  // Performance features
  REDIS_CACHING: {
    key: "redis_caching",
    defaultValue: true,
    description: "Use Redis caching for queries",
  },
  IMAGE_OPTIMIZATION: {
    key: "image_optimization",
    defaultValue: true,
    description: "Enable server-side image optimization",
  },

  // Experimental
  BETA_FEATURES: {
    key: "beta_features",
    defaultValue: false,
    description: "Enable all beta features",
  },
} as const;

export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;

// ============================================
// Context for Flag Evaluation
// ============================================

export interface FeatureFlagContext {
  userId?: string;
  email?: string;
  plan?: string;
  organizationId?: string;
  isEnterprise?: boolean;
  percentile?: number; // 0-100, for gradual rollouts
}

// ============================================
// Flag Configuration
// ============================================

interface FlagOverride {
  enabled: boolean;
  // Targeting rules
  plans?: string[];
  userIds?: string[];
  emails?: string[];
  percentage?: number; // 0-100 for gradual rollout
}

/**
 * Flag overrides from environment or configuration.
 * Format: FEATURE_FLAG_<KEY>=true|false|<json_config>
 */
function getFlagOverrides(): Record<string, FlagOverride | boolean> {
  const overrides: Record<string, FlagOverride | boolean> = {};

  // Parse environment variables
  for (const [key, flag] of Object.entries(FEATURE_FLAGS)) {
    const envKey = `FEATURE_FLAG_${key}`;
    const envValue = process.env[envKey];

    if (envValue !== undefined) {
      // Try to parse as JSON (for complex configs)
      try {
        overrides[flag.key] = JSON.parse(envValue);
      } catch {
        // Simple boolean
        overrides[flag.key] = envValue === "true";
      }
    }
  }

  return overrides;
}

// Cache overrides
let cachedOverrides: Record<string, FlagOverride | boolean> | null = null;

function getOverrides(): Record<string, FlagOverride | boolean> {
  if (!cachedOverrides) {
    cachedOverrides = getFlagOverrides();
  }
  return cachedOverrides;
}

// ============================================
// Flag Evaluation
// ============================================

/**
 * Check if a feature flag is enabled
 */
export function isFeatureEnabled(
  flag: FeatureFlagKey,
  context?: FeatureFlagContext
): boolean {
  const flagDef = FEATURE_FLAGS[flag];
  const overrides = getOverrides();
  const override = overrides[flagDef.key];

  let isEnabled = flagDef.defaultValue;

  if (override !== undefined) {
    if (typeof override === "boolean") {
      isEnabled = override;
    } else {
      // Complex override with targeting
      isEnabled = evaluateTargetedFlag(override, context);
    }
  }

  // Track for analytics
  if (context?.userId) {
    trackFeatureFlag(flagDef.key, isEnabled, context.userId);
  }

  return isEnabled;
}

/**
 * Evaluate a flag with targeting rules
 */
function evaluateTargetedFlag(
  override: FlagOverride,
  context?: FeatureFlagContext
): boolean {
  // Check if explicitly disabled
  if (!override.enabled) {
    return false;
  }

  // Check user targeting
  if (override.userIds && context?.userId) {
    if (override.userIds.includes(context.userId)) {
      return true;
    }
  }

  // Check email targeting
  if (override.emails && context?.email) {
    if (override.emails.includes(context.email)) {
      return true;
    }
  }

  // Check plan targeting
  if (override.plans && context?.plan) {
    if (override.plans.includes(context.plan)) {
      return true;
    }
  }

  // Check percentage rollout
  if (override.percentage !== undefined && context?.percentile !== undefined) {
    if (context.percentile < override.percentage) {
      return true;
    }
  }

  // If targeting rules exist but none matched, return false
  if (override.userIds || override.emails || override.plans || override.percentage !== undefined) {
    return false;
  }

  // No targeting rules, use enabled value
  return override.enabled;
}

/**
 * Get a stable percentile for a user (for consistent rollouts)
 */
export function getUserPercentile(userId: string): number {
  // Simple hash-based percentile
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash % 100);
}

// ============================================
// React Hook
// ============================================

/**
 * Hook for checking feature flags in React components
 * Note: This is a sync check - use in client components
 */
export function useFeatureFlag(
  flag: FeatureFlagKey,
  context?: FeatureFlagContext
): boolean {
  return isFeatureEnabled(flag, context);
}

/**
 * Hook for multiple feature flags
 */
export function useFeatureFlags(
  flags: FeatureFlagKey[],
  context?: FeatureFlagContext
): Record<FeatureFlagKey, boolean> {
  const result = {} as Record<FeatureFlagKey, boolean>;
  for (const flag of flags) {
    result[flag] = isFeatureEnabled(flag, context);
  }
  return result;
}

// ============================================
// Server-side Helpers
// ============================================

/**
 * Get all flag values for a context (useful for SSR)
 */
export function getAllFlags(
  context?: FeatureFlagContext
): Record<string, boolean> {
  const flags: Record<string, boolean> = {};

  for (const [key] of Object.entries(FEATURE_FLAGS)) {
    flags[key] = isFeatureEnabled(key as FeatureFlagKey, context);
  }

  return flags;
}

/**
 * Create context from user data
 */
export function createFlagContext(user?: {
  id?: string;
  email?: string;
  plan?: string;
  organizationId?: string;
}): FeatureFlagContext | undefined {
  if (!user?.id) return undefined;

  return {
    userId: user.id,
    email: user.email,
    plan: user.plan,
    organizationId: user.organizationId,
    percentile: getUserPercentile(user.id),
    isEnterprise: user.plan === "enterprise",
  };
}

// ============================================
// Admin/Debug Utilities
// ============================================

/**
 * Get all feature flag definitions (for admin UI)
 */
export function getFeatureFlagDefinitions() {
  return Object.entries(FEATURE_FLAGS).map(([flagKey, value]) => ({
    ...value,
    key: flagKey,
    currentValue: isFeatureEnabled(flagKey as FeatureFlagKey),
  }));
}

/**
 * Reset cached overrides (for testing)
 */
export function resetFlagCache(): void {
  cachedOverrides = null;
}
