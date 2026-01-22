export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Staging job status including async flow states
export type StagingJobStatus =
  | "pending"
  | "queued"
  | "preprocessing"
  | "processing"
  | "uploading"
  | "completed"
  | "failed";

// AI provider types
export type StagingProvider = "gemini" | "stable-diffusion";

// Notification types
export type NotificationType = "staging_complete" | "staging_failed" | "low_credits";

// Subscription status types
export type SubscriptionStatus = "active" | "canceled" | "past_due" | "trialing" | "paused";

// Organization role types
export type OrganizationRole = "owner" | "member";

// Credit top-up status
export type TopupStatus = "pending" | "completed" | "failed" | "refunded";

// Credit transaction types
export type CreditTransactionType =
  | "subscription_renewal"
  | "topup_purchase"
  | "staging_deduction"
  | "allocation_to_member"
  | "allocation_from_owner"
  | "refund"
  | "adjustment";

// Team invitation status types
export type TeamInvitationStatus = "pending" | "accepted" | "expired" | "revoked";

// Property visibility
export type PropertyVisibility = "private" | "team";

// Plan features stored as JSON
export type PlanFeatures = string[];

// ControlNet inputs stored as JSON
export interface ControlNetInputsJson {
  depth_map_url?: string;
  canny_edge_url?: string;
  segmentation_url?: string;
}

// Generation parameters stored as JSON
export interface GenerationParamsJson {
  prompt?: string;
  negative_prompt?: string;
  controlnet_weights?: {
    depth?: number;
    canny?: number;
    segmentation?: number;
  };
  seed?: number;
  steps?: number;
  guidance_scale?: number;
}

export interface Database {
  public: {
    Tables: {
      plans: {
        Row: {
          id: string;
          stripe_product_id: string | null;
          stripe_price_id: string | null;
          slug: string;
          name: string;
          description: string | null;
          price_cents: number;
          credits_per_month: number;
          max_team_members: number;
          features: PlanFeatures;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          stripe_product_id?: string | null;
          stripe_price_id?: string | null;
          slug: string;
          name: string;
          description?: string | null;
          price_cents?: number;
          credits_per_month: number;
          max_team_members?: number;
          features?: PlanFeatures;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          stripe_product_id?: string | null;
          stripe_price_id?: string | null;
          slug?: string;
          name?: string;
          description?: string | null;
          price_cents?: number;
          credits_per_month?: number;
          max_team_members?: number;
          features?: PlanFeatures;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string;
          stripe_subscription_id: string | null;
          stripe_customer_id: string | null;
          status: SubscriptionStatus;
          current_period_start: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          canceled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_id: string;
          stripe_subscription_id?: string | null;
          stripe_customer_id?: string | null;
          status?: SubscriptionStatus;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          canceled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan_id?: string;
          stripe_subscription_id?: string | null;
          stripe_customer_id?: string | null;
          status?: SubscriptionStatus;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          canceled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          owner_id: string;
          subscription_id: string | null;
          total_credits: number;
          unallocated_credits: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          owner_id: string;
          subscription_id?: string | null;
          total_credits?: number;
          unallocated_credits?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          owner_id?: string;
          subscription_id?: string | null;
          total_credits?: number;
          unallocated_credits?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: OrganizationRole;
          allocated_credits: number;
          credits_used_this_period: number;
          invited_at: string;
          joined_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role?: OrganizationRole;
          allocated_credits?: number;
          credits_used_this_period?: number;
          invited_at?: string;
          joined_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          role?: OrganizationRole;
          allocated_credits?: number;
          credits_used_this_period?: number;
          invited_at?: string;
          joined_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      credit_topups: {
        Row: {
          id: string;
          user_id: string;
          organization_id: string | null;
          stripe_payment_intent_id: string | null;
          stripe_checkout_session_id: string | null;
          credits_purchased: number;
          amount_cents: number;
          status: TopupStatus;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          organization_id?: string | null;
          stripe_payment_intent_id?: string | null;
          stripe_checkout_session_id?: string | null;
          credits_purchased: number;
          amount_cents: number;
          status?: TopupStatus;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          organization_id?: string | null;
          stripe_payment_intent_id?: string | null;
          stripe_checkout_session_id?: string | null;
          credits_purchased?: number;
          amount_cents?: number;
          status?: TopupStatus;
          created_at?: string;
          completed_at?: string | null;
        };
      };
      credit_transactions: {
        Row: {
          id: string;
          user_id: string | null;
          organization_id: string | null;
          transaction_type: CreditTransactionType;
          amount: number;
          balance_after: number;
          reference_id: string | null;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          organization_id?: string | null;
          transaction_type: CreditTransactionType;
          amount: number;
          balance_after: number;
          reference_id?: string | null;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          organization_id?: string | null;
          transaction_type?: CreditTransactionType;
          amount?: number;
          balance_after?: number;
          reference_id?: string | null;
          description?: string | null;
          created_at?: string;
        };
      };
      team_invitations: {
        Row: {
          id: string;
          organization_id: string;
          email: string;
          invitation_token: string;
          initial_credits: number;
          invited_by: string;
          status: TeamInvitationStatus;
          created_at: string;
          updated_at: string;
          expires_at: string;
          accepted_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          email: string;
          invitation_token: string;
          initial_credits?: number;
          invited_by: string;
          status?: TeamInvitationStatus;
          created_at?: string;
          updated_at?: string;
          expires_at: string;
          accepted_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          email?: string;
          invitation_token?: string;
          initial_credits?: number;
          invited_by?: string;
          status?: TeamInvitationStatus;
          created_at?: string;
          updated_at?: string;
          expires_at?: string;
          accepted_at?: string | null;
        };
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          company_name: string | null;
          credits_remaining: number;
          stripe_customer_id: string | null;
          plan_id: string | null;
          credits_reset_at: string | null;
          organization_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          company_name?: string | null;
          credits_remaining?: number;
          stripe_customer_id?: string | null;
          plan_id?: string | null;
          credits_reset_at?: string | null;
          organization_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          company_name?: string | null;
          credits_remaining?: number;
          stripe_customer_id?: string | null;
          plan_id?: string | null;
          credits_reset_at?: string | null;
          organization_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      properties: {
        Row: {
          id: string;
          user_id: string;
          address: string;
          description: string | null;
          organization_id: string | null;
          visibility: PropertyVisibility;
          created_at: string;
          updated_at: string;
          is_favorite: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          address: string;
          description?: string | null;
          organization_id?: string | null;
          visibility?: PropertyVisibility;
          created_at?: string;
          updated_at?: string;
          is_favorite?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          address?: string;
          description?: string | null;
          organization_id?: string | null;
          visibility?: PropertyVisibility;
          created_at?: string;
          updated_at?: string;
          is_favorite?: boolean;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: NotificationType;
          title: string;
          message: string;
          link: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: NotificationType;
          title: string;
          message: string;
          link?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: NotificationType;
          title?: string;
          message?: string;
          link?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
      };
      version_groups: {
        Row: {
          id: string;
          user_id: string;
          original_image_hash: string;
          original_image_url: string;
          free_remixes_used: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          original_image_hash: string;
          original_image_url: string;
          free_remixes_used?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          original_image_hash?: string;
          original_image_url?: string;
          free_remixes_used?: number;
          created_at?: string;
        };
      };
      staging_jobs: {
        Row: {
          id: string;
          user_id: string;
          property_id: string | null;
          organization_id: string | null;
          original_image_url: string;
          staged_image_url: string | null;
          room_type: string;
          style: string;
          status: StagingJobStatus;
          error_message: string | null;
          credits_used: number;
          created_at: string;
          completed_at: string | null;
          // New columns for SD + ControlNet support
          provider: StagingProvider;
          replicate_prediction_id: string | null;
          preprocessing_completed_at: string | null;
          controlnet_inputs: ControlNetInputsJson | null;
          generation_params: GenerationParamsJson | null;
          processing_time_ms: number | null;
          // Favorite feature
          is_favorite: boolean;
          // Version/remix tracking
          version_group_id: string | null;
          is_primary_version: boolean;
          parent_job_id: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          property_id?: string | null;
          organization_id?: string | null;
          original_image_url: string;
          staged_image_url?: string | null;
          room_type: string;
          style: string;
          status?: StagingJobStatus;
          error_message?: string | null;
          credits_used?: number;
          created_at?: string;
          completed_at?: string | null;
          provider?: StagingProvider;
          replicate_prediction_id?: string | null;
          preprocessing_completed_at?: string | null;
          controlnet_inputs?: ControlNetInputsJson | null;
          generation_params?: GenerationParamsJson | null;
          processing_time_ms?: number | null;
          is_favorite?: boolean;
          // Version/remix tracking
          version_group_id?: string | null;
          is_primary_version?: boolean;
          parent_job_id?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          property_id?: string | null;
          organization_id?: string | null;
          original_image_url?: string;
          staged_image_url?: string | null;
          room_type?: string;
          style?: string;
          status?: StagingJobStatus;
          error_message?: string | null;
          credits_used?: number;
          created_at?: string;
          completed_at?: string | null;
          provider?: StagingProvider;
          replicate_prediction_id?: string | null;
          preprocessing_completed_at?: string | null;
          controlnet_inputs?: ControlNetInputsJson | null;
          generation_params?: GenerationParamsJson | null;
          processing_time_ms?: number | null;
          is_favorite?: boolean;
          // Version/remix tracking
          version_group_id?: string | null;
          is_primary_version?: boolean;
          parent_job_id?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Property = Database["public"]["Tables"]["properties"]["Row"];
export type StagingJob = Database["public"]["Tables"]["staging_jobs"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type VersionGroup = Database["public"]["Tables"]["version_groups"]["Row"];

// New subscription-related types
export type Plan = Database["public"]["Tables"]["plans"]["Row"];
export type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];
export type Organization = Database["public"]["Tables"]["organizations"]["Row"];
export type OrganizationMember = Database["public"]["Tables"]["organization_members"]["Row"];
export type CreditTopup = Database["public"]["Tables"]["credit_topups"]["Row"];
export type CreditTransaction = Database["public"]["Tables"]["credit_transactions"]["Row"];
export type TeamInvitation = Database["public"]["Tables"]["team_invitations"]["Row"];

// Extended types with relations
export interface PlanWithDetails extends Plan {
  features: string[];
}

export interface SubscriptionWithPlan extends Subscription {
  plan: Plan;
}

export interface OrganizationWithMembers extends Organization {
  members: OrganizationMember[];
}

export interface OrganizationMemberWithProfile extends OrganizationMember {
  profile: Profile;
}
