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
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          company_name: string | null;
          credits_remaining: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          company_name?: string | null;
          credits_remaining?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          company_name?: string | null;
          credits_remaining?: number;
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
          created_at: string;
          updated_at: string;
          is_favorite: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          address: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
          is_favorite?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          address?: string;
          description?: string | null;
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
