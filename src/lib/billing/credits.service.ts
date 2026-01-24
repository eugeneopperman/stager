/**
 * Credit management service
 * Centralizes credit deduction logic to avoid duplication
 */

import { SupabaseClient } from "@supabase/supabase-js";

export interface DeductCreditsResult {
  success: boolean;
  previousBalance: number;
  newBalance: number;
  deducted: number;
  error?: string;
}

/**
 * Deduct credits from a user's balance
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID to deduct credits from
 * @param amount - Number of credits to deduct
 * @param options - Optional configuration
 * @returns Result object with success status and balances
 */
export async function deductCredits(
  supabase: SupabaseClient,
  userId: string,
  amount: number,
  options?: {
    /** If true, allows balance to go to 0 but not negative */
    allowZero?: boolean;
    /** If true, skips the pre-check and just attempts deduction */
    skipPreCheck?: boolean;
  }
): Promise<DeductCreditsResult> {
  const { allowZero = true, skipPreCheck = false } = options || {};

  try {
    // Fetch current balance
    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("credits_remaining")
      .eq("id", userId)
      .single();

    if (fetchError || !profile) {
      return {
        success: false,
        previousBalance: 0,
        newBalance: 0,
        deducted: 0,
        error: "Failed to fetch user profile",
      };
    }

    const previousBalance = profile.credits_remaining;

    // Check if user has enough credits
    if (!skipPreCheck && previousBalance < amount) {
      return {
        success: false,
        previousBalance,
        newBalance: previousBalance,
        deducted: 0,
        error: `Insufficient credits: need ${amount}, have ${previousBalance}`,
      };
    }

    // Calculate new balance (never go below 0)
    const newBalance = allowZero
      ? Math.max(0, previousBalance - amount)
      : previousBalance - amount;

    // Update the balance
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ credits_remaining: newBalance })
      .eq("id", userId);

    if (updateError) {
      return {
        success: false,
        previousBalance,
        newBalance: previousBalance,
        deducted: 0,
        error: "Failed to update credit balance",
      };
    }

    return {
      success: true,
      previousBalance,
      newBalance,
      deducted: previousBalance - newBalance,
    };
  } catch (error) {
    return {
      success: false,
      previousBalance: 0,
      newBalance: 0,
      deducted: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check if user has sufficient credits without deducting
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID to check
 * @param required - Credits required
 * @returns Object with available credits and sufficiency flag
 */
export async function checkCredits(
  supabase: SupabaseClient,
  userId: string,
  required: number
): Promise<{ available: number; sufficient: boolean; error?: string }> {
  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("credits_remaining")
      .eq("id", userId)
      .single();

    if (error || !profile) {
      return {
        available: 0,
        sufficient: false,
        error: "Failed to fetch user profile",
      };
    }

    return {
      available: profile.credits_remaining,
      sufficient: profile.credits_remaining >= required,
    };
  } catch (error) {
    return {
      available: 0,
      sufficient: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
