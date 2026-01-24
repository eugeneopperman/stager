import { NextResponse } from "next/server";
import { z, ZodError, type ZodSchema } from "zod";

/**
 * Validation result type
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; response: NextResponse };

/**
 * Validate request body against a Zod schema
 *
 * @param schema - Zod schema to validate against
 * @param data - Request data to validate
 * @returns Validation result with parsed data or error response
 *
 * @example
 * ```ts
 * const result = validateRequest(stagingRequestSchema, body);
 * if (!result.success) {
 *   return result.response;
 * }
 * const { image, mimeType, roomType, style } = result.data;
 * ```
 */
export function validateRequest<T>(
  schema: ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  try {
    const parsed = schema.parse(data);
    return { success: true, data: parsed };
  } catch (error) {
    if (error instanceof ZodError) {
      const fields = error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      return {
        success: false,
        response: NextResponse.json(
          {
            error: "Validation failed",
            fields,
          },
          { status: 400 }
        ),
      };
    }

    return {
      success: false,
      response: NextResponse.json(
        { error: "Invalid request" },
        { status: 400 }
      ),
    };
  }
}

/**
 * Async version of validateRequest for use with request.json()
 *
 * @example
 * ```ts
 * const result = await validateRequestAsync(stagingRequestSchema, request);
 * if (!result.success) {
 *   return result.response;
 * }
 * ```
 */
export async function validateRequestAsync<T>(
  schema: ZodSchema<T>,
  request: Request
): Promise<ValidationResult<T>> {
  try {
    const body = await request.json();
    return validateRequest(schema, body);
  } catch {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      ),
    };
  }
}

// Re-export all schemas
export * from "./staging";
export * from "./billing";
export * from "./team";
export * from "./preprocessing";
export * from "./responses";
export * from "./contract-validation";

// Re-export zod for convenience
export { z };
