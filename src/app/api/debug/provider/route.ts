import { NextResponse } from "next/server";
import { getProviderRouter, getGeminiProvider, getReplicateProvider } from "@/lib/providers";

/**
 * GET /api/debug/provider
 *
 * Debug endpoint to test provider system
 */
export async function GET() {
  const results: Record<string, unknown> = {};

  try {
    // Test 1: Get provider router
    results.step1_router = "Getting router...";
    const router = getProviderRouter();
    results.step1_router = "Router OK";

    // Test 2: Select provider
    results.step2_select = "Selecting provider...";
    const { provider, fallbackUsed } = await router.selectProvider();
    results.step2_select = {
      providerId: provider.providerId,
      fallbackUsed,
      supportsSync: provider.supportsSync,
    };

    // Test 3: Health check
    results.step3_health = "Checking health...";
    const allHealth = await router.getAllProvidersHealth();
    results.step3_health = allHealth;

    // Test 4: Direct Gemini provider
    results.step4_gemini = "Getting Gemini provider...";
    const gemini = getGeminiProvider();
    results.step4_gemini = {
      providerId: gemini.providerId,
      supportsSync: gemini.supportsSync,
    };

    // Test 5: Replicate provider and API token
    results.step5_replicate = "Checking Replicate...";
    const replicate = getReplicateProvider();
    const replicateHealth = await replicate.checkHealth();
    results.step5_replicate = {
      providerId: replicate.providerId,
      supportsAsync: replicate.supportsAsync,
      health: replicateHealth,
      hasToken: !!process.env.REPLICATE_API_TOKEN,
      tokenPrefix: process.env.REPLICATE_API_TOKEN?.substring(0, 5) || "none",
    };

    // Test 6: Storage bucket accessibility
    results.step6_storage = "Checking storage...";
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const testStorageUrl = `${supabaseUrl}/storage/v1/object/public/staging-images/test`;
    try {
      const storageResponse = await fetch(testStorageUrl, { method: "HEAD" });
      results.step6_storage = {
        testUrl: testStorageUrl.substring(0, 80) + "...",
        status: storageResponse.status,
        accessible: storageResponse.status !== 403,
        note: storageResponse.status === 404 ? "404 is OK - bucket is public, file just doesn't exist" : undefined,
      };
    } catch (storageError) {
      results.step6_storage = {
        error: storageError instanceof Error ? storageError.message : "Unknown error",
      };
    }

    // Test 7: Create a test prediction to see exact error
    results.step7_testPrediction = "Skipped - use ?test=true to run";

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      results,
    });
  }
}
