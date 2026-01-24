/**
 * Performance Benchmarks
 *
 * Measures critical operations to track performance over time.
 * Run with: npm run bench
 */

import { describe, bench } from "vitest";
import { z } from "zod";
import {
  stagingRequestSchema,
  checkoutRequestSchema,
  teamInviteRequestSchema,
} from "@/lib/schemas";

// Benchmark data
const validStagingRequest = {
  image: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  mimeType: "image/png",
  roomType: "living-room",
  style: "modern",
};

const validCheckoutRequest = {
  planSlug: "professional",
};

const validTeamInviteRequest = {
  email: "test@example.com",
  initialCredits: 10,
};

describe("Schema Validation Performance", () => {
  bench("staging request validation", () => {
    stagingRequestSchema.safeParse(validStagingRequest);
  });

  bench("checkout request validation", () => {
    checkoutRequestSchema.safeParse(validCheckoutRequest);
  });

  bench("team invite request validation", () => {
    teamInviteRequestSchema.safeParse(validTeamInviteRequest);
  });

  bench("staging request - invalid data", () => {
    stagingRequestSchema.safeParse({
      image: "",
      mimeType: "invalid",
      roomType: "invalid",
      style: "invalid",
    });
  });
});

describe("Response Schema Performance", () => {
  const complexResponseSchema = z.object({
    id: z.string().uuid(),
    status: z.enum(["pending", "processing", "completed", "failed"]),
    stagedImageUrl: z.string().url().nullable(),
    thumbnailUrl: z.string().url().nullable().optional(),
    roomType: z.string(),
    style: z.string(),
    propertyId: z.string().uuid().nullable(),
    creditsUsed: z.number(),
    provider: z.string().optional(),
    processingTime: z.number().optional(),
  });

  const complexResponse = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    status: "completed",
    stagedImageUrl: "https://example.com/staged.jpg",
    thumbnailUrl: "https://example.com/thumb.jpg",
    roomType: "living_room",
    style: "modern",
    propertyId: "550e8400-e29b-41d4-a716-446655440001",
    creditsUsed: 1,
    provider: "gemini",
    processingTime: 5432,
  };

  bench("complex response validation", () => {
    complexResponseSchema.safeParse(complexResponse);
  });
});

describe("Utility Performance", () => {
  bench("UUID generation (crypto)", () => {
    crypto.randomUUID();
  });

  bench("Date ISO string", () => {
    new Date().toISOString();
  });

  bench("JSON stringify - small object", () => {
    JSON.stringify({ id: "test", value: 123 });
  });

  bench("JSON stringify - medium object", () => {
    JSON.stringify({
      id: "550e8400-e29b-41d4-a716-446655440000",
      user: {
        id: "user-123",
        email: "test@example.com",
        profile: {
          name: "Test User",
          credits: 50,
        },
      },
      items: Array.from({ length: 10 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        value: Math.random(),
      })),
    });
  });

  bench("JSON parse - small object", () => {
    JSON.parse('{"id":"test","value":123}');
  });
});

describe("Array Operations", () => {
  const largeArray = Array.from({ length: 1000 }, (_, i) => ({
    id: i,
    name: `Item ${i}`,
    active: i % 2 === 0,
  }));

  bench("filter 1000 items", () => {
    largeArray.filter((item) => item.active);
  });

  bench("map 1000 items", () => {
    largeArray.map((item) => ({ ...item, processed: true }));
  });

  bench("reduce 1000 items", () => {
    largeArray.reduce((acc, item) => acc + item.id, 0);
  });

  bench("find in 1000 items", () => {
    largeArray.find((item) => item.id === 500);
  });
});
