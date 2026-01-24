/**
 * Contract Validation Utilities
 *
 * Used in tests to verify API responses match their contracts.
 */

import { ZodSchema, ZodError } from "zod";
import {
  errorResponseSchema,
  stagingResponseSchema,
  stagingJobResponseSchema,
  subscriptionResponseSchema,
  checkoutResponseSchema,
  teamResponseSchema,
  inviteResponseSchema,
  propertiesListResponseSchema,
  searchResponseSchema,
  userProfileSchema,
} from "./responses";

/**
 * Contract validation result
 */
export type ContractValidationResult<T> =
  | { valid: true; data: T }
  | { valid: false; errors: string[] };

/**
 * Validate data against a schema
 */
export function validateContract<T>(
  schema: ZodSchema<T>,
  data: unknown
): ContractValidationResult<T> {
  try {
    const parsed = schema.parse(data);
    return { valid: true, data: parsed };
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = error.issues.map(
        (issue) => `${issue.path.join(".")}: ${issue.message}`
      );
      return { valid: false, errors };
    }
    return { valid: false, errors: ["Unknown validation error"] };
  }
}

/**
 * API endpoint to schema mapping for automated validation
 */
export const endpointSchemas = {
  // Staging
  "POST /api/staging": stagingResponseSchema,
  "GET /api/staging/:id": stagingJobResponseSchema,
  "PATCH /api/staging/:id": stagingJobResponseSchema,

  // Billing
  "GET /api/billing/subscription": subscriptionResponseSchema,
  "POST /api/billing/checkout": checkoutResponseSchema,

  // Team
  "GET /api/team": teamResponseSchema,
  "POST /api/team/invite": inviteResponseSchema,

  // Properties
  "GET /api/properties": propertiesListResponseSchema,

  // Search
  "GET /api/search": searchResponseSchema,

  // User
  "GET /api/user/profile": userProfileSchema,
} as const;

/**
 * Validate an API response against its contract
 * Throws if validation fails (for use in tests)
 */
export function assertContract<T>(
  schema: ZodSchema<T>,
  data: unknown,
  context?: string
): T {
  const result = validateContract(schema, data);
  if (!result.valid) {
    const prefix = context ? `[${context}] ` : "";
    throw new Error(
      `${prefix}Contract validation failed:\n${result.errors.join("\n")}`
    );
  }
  return result.data;
}

/**
 * Validate an error response
 */
export function assertErrorContract(data: unknown, context?: string) {
  return assertContract(errorResponseSchema, data, context);
}

/**
 * Test helper: expect response to match contract
 */
export function expectContract<T>(
  schema: ZodSchema<T>,
  response: { status: number; json: () => Promise<unknown> },
  expectedStatus: number = 200
) {
  return async () => {
    if (response.status !== expectedStatus) {
      throw new Error(
        `Expected status ${expectedStatus}, got ${response.status}`
      );
    }
    const data = await response.json();
    return assertContract(schema, data);
  };
}

// Re-export schemas for convenience
export {
  errorResponseSchema,
  stagingResponseSchema,
  stagingJobResponseSchema,
  subscriptionResponseSchema,
  checkoutResponseSchema,
  teamResponseSchema,
  inviteResponseSchema,
  propertiesListResponseSchema,
  searchResponseSchema,
  userProfileSchema,
};
