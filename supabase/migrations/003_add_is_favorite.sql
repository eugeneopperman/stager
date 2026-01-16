-- Add is_favorite column to staging_jobs table
-- Run this in Supabase SQL Editor

ALTER TABLE public.staging_jobs
ADD COLUMN IF NOT EXISTS is_favorite boolean DEFAULT false;

-- Add index for faster filtering of favorites
CREATE INDEX IF NOT EXISTS idx_staging_jobs_is_favorite ON public.staging_jobs(is_favorite) WHERE is_favorite = true;
