/**
 * Contract Tests
 *
 * These tests validate that API responses conform to their defined schemas.
 * Run with: npm test -- src/lib/schemas/contract.test.ts
 */

import { describe, it, expect } from "vitest";
import {
  errorResponseSchema,
  stagingResponseSchema,
  stagingJobResponseSchema,
  subscriptionResponseSchema,
  checkoutResponseSchema,
  teamResponseSchema,
  inviteResponseSchema,
  propertySchema,
  propertiesListResponseSchema,
  searchResponseSchema,
  userProfileSchema,
} from "./responses";

describe("API Response Contracts", () => {
  describe("Error Response Schema", () => {
    it("validates minimal error response", () => {
      const response = { error: "Something went wrong" };
      const result = errorResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it("validates error response with code", () => {
      const response = {
        error: "Validation failed",
        code: "VALIDATION_ERROR",
      };
      const result = errorResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it("validates error response with fields", () => {
      const response = {
        error: "Validation failed",
        fields: [
          { field: "email", message: "Invalid email format" },
          { field: "password", message: "Password too short" },
        ],
      };
      const result = errorResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it("validates error response with action", () => {
      const response = {
        error: "Subscription required",
        code: "SUBSCRIPTION_REQUIRED",
        action: {
          label: "Upgrade Now",
          href: "/billing",
        },
      };
      const result = errorResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it("rejects response without error field", () => {
      const response = { message: "Something went wrong" };
      const result = errorResponseSchema.safeParse(response);
      expect(result.success).toBe(false);
    });
  });

  describe("Staging Response Schema", () => {
    it("validates successful staging response", () => {
      const response = {
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
      const result = stagingResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it("validates pending staging response", () => {
      const response = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        status: "pending",
        stagedImageUrl: null,
        roomType: "bedroom",
        style: "scandinavian",
        propertyId: null,
        creditsUsed: 0,
      };
      const result = stagingResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it("rejects invalid status", () => {
      const response = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        status: "invalid_status",
        stagedImageUrl: null,
        roomType: "bedroom",
        style: "modern",
        propertyId: null,
        creditsUsed: 0,
      };
      const result = stagingResponseSchema.safeParse(response);
      expect(result.success).toBe(false);
    });

    it("rejects non-UUID id", () => {
      const response = {
        id: "not-a-uuid",
        status: "completed",
        stagedImageUrl: null,
        roomType: "bedroom",
        style: "modern",
        propertyId: null,
        creditsUsed: 0,
      };
      const result = stagingResponseSchema.safeParse(response);
      expect(result.success).toBe(false);
    });
  });

  describe("Staging Job Response Schema", () => {
    it("validates complete job response", () => {
      const response = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        status: "completed",
        roomType: "living_room",
        style: "modern",
        originalImageUrl: "https://example.com/original.jpg",
        stagedImageUrl: "https://example.com/staged.jpg",
        thumbnailUrl: "https://example.com/thumb.jpg",
        propertyId: "550e8400-e29b-41d4-a716-446655440001",
        createdAt: "2024-01-15T10:30:00Z",
        completedAt: "2024-01-15T10:31:00Z",
        isPrimary: true,
        versionGroupId: "550e8400-e29b-41d4-a716-446655440002",
      };
      const result = stagingJobResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it("validates failed job response", () => {
      const response = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        status: "failed",
        roomType: "kitchen",
        style: "industrial",
        originalImageUrl: "https://example.com/original.jpg",
        stagedImageUrl: null,
        propertyId: null,
        createdAt: "2024-01-15T10:30:00Z",
        completedAt: null,
        errorMessage: "Image processing failed",
      };
      const result = stagingJobResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });
  });

  describe("Subscription Response Schema", () => {
    it("validates active subscription", () => {
      const response = {
        plan: "professional",
        status: "active",
        currentPeriodEnd: "2024-02-15T00:00:00Z",
        cancelAtPeriodEnd: false,
        credits: 45,
        monthlyCredits: 50,
      };
      const result = subscriptionResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it("validates no subscription", () => {
      const response = {
        plan: null,
        status: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        credits: 5,
        monthlyCredits: 0,
      };
      const result = subscriptionResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it("validates canceled subscription", () => {
      const response = {
        plan: "starter",
        status: "canceled",
        currentPeriodEnd: "2024-01-31T00:00:00Z",
        cancelAtPeriodEnd: true,
        credits: 10,
        monthlyCredits: 20,
      };
      const result = subscriptionResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });
  });

  describe("Checkout Response Schema", () => {
    it("validates checkout URL response", () => {
      const response = {
        url: "https://checkout.stripe.com/pay/cs_test_abc123",
        sessionId: "cs_test_abc123",
      };
      const result = checkoutResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it("validates minimal checkout response", () => {
      const response = {
        url: "https://checkout.stripe.com/pay/cs_test_abc123",
      };
      const result = checkoutResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it("rejects invalid URL", () => {
      const response = {
        url: "not-a-url",
      };
      const result = checkoutResponseSchema.safeParse(response);
      expect(result.success).toBe(false);
    });
  });

  describe("Team Response Schema", () => {
    it("validates team with organization", () => {
      const response = {
        organization: {
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "Acme Real Estate",
          credits: 100,
          ownerId: "550e8400-e29b-41d4-a716-446655440001",
        },
        members: [
          {
            id: "550e8400-e29b-41d4-a716-446655440002",
            userId: "550e8400-e29b-41d4-a716-446655440001",
            email: "owner@acme.com",
            fullName: "John Owner",
            role: "owner",
            credits: 50,
            joinedAt: "2024-01-01T00:00:00Z",
          },
          {
            id: "550e8400-e29b-41d4-a716-446655440003",
            userId: "550e8400-e29b-41d4-a716-446655440004",
            email: "member@acme.com",
            fullName: null,
            role: "member",
            credits: 25,
            joinedAt: "2024-01-15T00:00:00Z",
          },
        ],
        isOwner: true,
      };
      const result = teamResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it("validates response without organization", () => {
      const response = {
        organization: null,
        members: [],
        isOwner: false,
      };
      const result = teamResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });
  });

  describe("Invite Response Schema", () => {
    it("validates successful invite", () => {
      const response = {
        success: true,
        invitationId: "550e8400-e29b-41d4-a716-446655440000",
        email: "newmember@example.com",
        expiresAt: "2024-01-22T00:00:00Z",
      };
      const result = inviteResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it("rejects invalid email", () => {
      const response = {
        success: true,
        invitationId: "550e8400-e29b-41d4-a716-446655440000",
        email: "not-an-email",
        expiresAt: "2024-01-22T00:00:00Z",
      };
      const result = inviteResponseSchema.safeParse(response);
      expect(result.success).toBe(false);
    });
  });

  describe("Property Schema", () => {
    it("validates property object", () => {
      const property = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        address: "123 Main Street, New York, NY 10001",
        description: "Beautiful 3BR apartment",
        createdAt: "2024-01-15T10:30:00Z",
        updatedAt: "2024-01-15T10:30:00Z",
        stagingCount: 5,
      };
      const result = propertySchema.safeParse(property);
      expect(result.success).toBe(true);
    });

    it("validates property without description", () => {
      const property = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        address: "123 Main Street",
        description: null,
        createdAt: "2024-01-15T10:30:00Z",
        updatedAt: "2024-01-15T10:30:00Z",
      };
      const result = propertySchema.safeParse(property);
      expect(result.success).toBe(true);
    });
  });

  describe("Properties List Response Schema", () => {
    it("validates properties list", () => {
      const response = {
        properties: [
          {
            id: "550e8400-e29b-41d4-a716-446655440000",
            address: "123 Main St",
            description: null,
            createdAt: "2024-01-15T10:30:00Z",
            updatedAt: "2024-01-15T10:30:00Z",
          },
        ],
        total: 1,
      };
      const result = propertiesListResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it("validates empty properties list", () => {
      const response = {
        properties: [],
        total: 0,
      };
      const result = propertiesListResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });
  });

  describe("Search Response Schema", () => {
    it("validates search results", () => {
      const response = {
        properties: [
          {
            id: "550e8400-e29b-41d4-a716-446655440000",
            address: "123 Main St",
            description: "A nice property",
          },
        ],
        stagingJobs: [
          {
            id: "550e8400-e29b-41d4-a716-446655440001",
            roomType: "living_room",
            style: "modern",
            stagedImageUrl: "https://example.com/staged.jpg",
            property: {
              id: "550e8400-e29b-41d4-a716-446655440000",
              address: "123 Main St",
            },
          },
        ],
      };
      const result = searchResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it("validates empty search results", () => {
      const response = {
        properties: [],
        stagingJobs: [],
      };
      const result = searchResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });
  });

  describe("User Profile Schema", () => {
    it("validates user profile", () => {
      const profile = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        email: "user@example.com",
        fullName: "John Doe",
        credits: 25,
        createdAt: "2024-01-01T00:00:00Z",
      };
      const result = userProfileSchema.safeParse(profile);
      expect(result.success).toBe(true);
    });

    it("validates profile without name", () => {
      const profile = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        email: "user@example.com",
        fullName: null,
        credits: 0,
        createdAt: "2024-01-01T00:00:00Z",
      };
      const result = userProfileSchema.safeParse(profile);
      expect(result.success).toBe(true);
    });

    it("rejects invalid email", () => {
      const profile = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        email: "not-an-email",
        fullName: "John Doe",
        credits: 25,
        createdAt: "2024-01-01T00:00:00Z",
      };
      const result = userProfileSchema.safeParse(profile);
      expect(result.success).toBe(false);
    });
  });
});
