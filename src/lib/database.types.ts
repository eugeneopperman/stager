export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

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
        };
        Insert: {
          id?: string;
          user_id: string;
          address: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          address?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
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
          status: "pending" | "processing" | "completed" | "failed";
          error_message: string | null;
          credits_used: number;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          property_id?: string | null;
          original_image_url: string;
          staged_image_url?: string | null;
          room_type: string;
          style: string;
          status?: "pending" | "processing" | "completed" | "failed";
          error_message?: string | null;
          credits_used?: number;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          property_id?: string | null;
          original_image_url?: string;
          staged_image_url?: string | null;
          room_type?: string;
          style?: string;
          status?: "pending" | "processing" | "completed" | "failed";
          error_message?: string | null;
          credits_used?: number;
          created_at?: string;
          completed_at?: string | null;
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
