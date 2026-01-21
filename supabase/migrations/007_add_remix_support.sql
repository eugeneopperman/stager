-- Migration: 007_add_remix_support.sql
-- Add support for image remix and version control

-- Create version_groups table to track all versions of an original image
CREATE TABLE IF NOT EXISTS public.version_groups (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  original_image_hash text NOT NULL,
  original_image_url text NOT NULL,
  free_remixes_used integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Unique index to prevent duplicate version groups for same original image
CREATE UNIQUE INDEX IF NOT EXISTS idx_version_groups_user_hash
ON public.version_groups(user_id, original_image_hash);

-- Add version tracking columns to staging_jobs
ALTER TABLE public.staging_jobs
ADD COLUMN IF NOT EXISTS version_group_id uuid REFERENCES public.version_groups(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_primary_version boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS parent_job_id uuid REFERENCES public.staging_jobs(id) ON DELETE SET NULL;

-- Index for efficient version group queries
CREATE INDEX IF NOT EXISTS idx_staging_jobs_version_group
ON public.staging_jobs(version_group_id) WHERE version_group_id IS NOT NULL;

-- RLS policies for version_groups
ALTER TABLE public.version_groups ENABLE ROW LEVEL SECURITY;

-- Users can view their own version groups
CREATE POLICY "Users can view own version groups"
ON public.version_groups
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own version groups
CREATE POLICY "Users can insert own version groups"
ON public.version_groups
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own version groups
CREATE POLICY "Users can update own version groups"
ON public.version_groups
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own version groups
CREATE POLICY "Users can delete own version groups"
ON public.version_groups
FOR DELETE
USING (auth.uid() = user_id);

-- Create function to compute simple hash from image URL for grouping
-- This uses a substring of the URL path for identifying the original image
CREATE OR REPLACE FUNCTION public.compute_image_hash(image_url text)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  -- Extract the path part between user_id and -original or -staged suffix
  -- Format: user_id/job_id-original.png or user_id/job_id-staged.png
  -- We want to group by the original image, so we extract the base path
  RETURN md5(image_url);
END;
$$;
