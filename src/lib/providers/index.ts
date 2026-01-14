import { GeminiProvider } from "./gemini-provider";
import { ReplicateProvider } from "./replicate-provider";
import { Decor8Provider } from "./decor8-provider";
import { BaseStagingProvider } from "./base-provider";
import type { StagingProvider, ProviderHealth, ProviderConfig } from "./types";

// Re-export types and base class
export * from "./types";
export { BaseStagingProvider } from "./base-provider";
export { GeminiProvider } from "./gemini-provider";
export { ReplicateProvider } from "./replicate-provider";
export { Decor8Provider } from "./decor8-provider";

// Singleton instances
let geminiProvider: GeminiProvider | null = null;
let replicateProvider: ReplicateProvider | null = null;
let decor8Provider: Decor8Provider | null = null;

/**
 * Get the Gemini provider instance (singleton)
 */
export function getGeminiProvider(): GeminiProvider {
  if (!geminiProvider) {
    geminiProvider = new GeminiProvider();
  }
  return geminiProvider;
}

/**
 * Get the Replicate/SD provider instance (singleton)
 */
export function getReplicateProvider(): ReplicateProvider {
  if (!replicateProvider) {
    replicateProvider = new ReplicateProvider();
  }
  return replicateProvider;
}

/**
 * Get the Decor8 AI provider instance (singleton)
 */
export function getDecor8Provider(): Decor8Provider {
  if (!decor8Provider) {
    decor8Provider = new Decor8Provider();
  }
  return decor8Provider;
}

/**
 * Get a provider by ID
 */
export function getProvider(providerId: StagingProvider): BaseStagingProvider {
  switch (providerId) {
    case "gemini":
      return getGeminiProvider();
    case "stable-diffusion":
      return getReplicateProvider();
    case "decor8":
      return getDecor8Provider();
    default:
      throw new Error(`Unknown provider: ${providerId}`);
  }
}

/**
 * Default provider configuration
 */
export function getDefaultConfig(): ProviderConfig {
  // Use AI_DEFAULT_PROVIDER env var to select provider
  // Default to Decor8 AI for best quality virtual staging
  const defaultProvider = (process.env.AI_DEFAULT_PROVIDER as StagingProvider) || "decor8";
  return {
    defaultProvider,
    enableFallback: true,
    fallbackProvider: "gemini", // Gemini as fallback
  };
}

/**
 * Provider Router - selects the best provider based on availability and preferences
 */
export class ProviderRouter {
  private config: ProviderConfig;
  private healthCache: Map<StagingProvider, { health: ProviderHealth; cachedAt: number }> =
    new Map();
  private healthCacheTtlMs = 60000; // 1 minute cache

  constructor(config?: Partial<ProviderConfig>) {
    this.config = { ...getDefaultConfig(), ...config };
  }

  /**
   * Select the best available provider
   */
  async selectProvider(
    preferredProvider?: StagingProvider
  ): Promise<{ provider: BaseStagingProvider; fallbackUsed: boolean }> {
    const targetProvider = preferredProvider || this.config.defaultProvider;
    console.log("[ProviderRouter] Selecting provider, preferred:", preferredProvider, "default:", this.config.defaultProvider, "target:", targetProvider);

    // Check primary provider health
    const primaryHealth = await this.getHealthCached(targetProvider);
    console.log("[ProviderRouter] Primary health check:", targetProvider, primaryHealth);

    if (primaryHealth.available && !primaryHealth.rateLimited) {
      console.log("[ProviderRouter] Using primary provider:", targetProvider);
      return {
        provider: getProvider(targetProvider),
        fallbackUsed: false,
      };
    }

    // Try fallback if enabled
    if (this.config.enableFallback) {
      const fallbackHealth = await this.getHealthCached(this.config.fallbackProvider);
      console.log("[ProviderRouter] Fallback health check:", this.config.fallbackProvider, fallbackHealth);

      if (fallbackHealth.available && !fallbackHealth.rateLimited) {
        console.log("[ProviderRouter] Using fallback provider:", this.config.fallbackProvider);
        return {
          provider: getProvider(this.config.fallbackProvider),
          fallbackUsed: true,
        };
      }
    }

    // No provider available
    console.error("[ProviderRouter] No provider available!");
    throw new Error(
      `No staging provider available. Primary: ${primaryHealth.errorMessage || "unavailable"}, ` +
        `Fallback: ${this.config.enableFallback ? "also unavailable" : "disabled"}`
    );
  }

  /**
   * Get health status for all providers
   */
  async getAllProvidersHealth(): Promise<ProviderHealth[]> {
    const providers: StagingProvider[] = ["decor8", "gemini", "stable-diffusion"];
    return Promise.all(providers.map((p) => this.getHealthCached(p)));
  }

  /**
   * Get cached health status or fetch fresh
   */
  private async getHealthCached(providerId: StagingProvider): Promise<ProviderHealth> {
    const cached = this.healthCache.get(providerId);
    const now = Date.now();

    if (cached && now - cached.cachedAt < this.healthCacheTtlMs) {
      return cached.health;
    }

    const provider = getProvider(providerId);
    const health = await provider.checkHealth();

    this.healthCache.set(providerId, { health, cachedAt: now });
    return health;
  }

  /**
   * Clear health cache (useful after rate limit resets)
   */
  clearHealthCache(): void {
    this.healthCache.clear();
  }
}

// Default router instance
let defaultRouter: ProviderRouter | null = null;

/**
 * Get the default provider router (singleton)
 */
export function getProviderRouter(): ProviderRouter {
  if (!defaultRouter) {
    defaultRouter = new ProviderRouter();
  }
  return defaultRouter;
}
