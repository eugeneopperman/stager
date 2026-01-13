-- Migration: Add Stable Diffusion + ControlNet support
-- This migration adds columns to support multiple AI providers and async processing

-- Add new columns to staging_jobs for provider tracking and async processing
ALTER TABLE public.staging_jobs
ADD COLUMN IF NOT EXISTS provider text DEFAULT 'gemini',
ADD COLUMN IF NOT EXISTS replicate_prediction_id text,
ADD COLUMN IF NOT EXISTS preprocessing_completed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS controlnet_inputs jsonb,
ADD COLUMN IF NOT EXISTS generation_params jsonb,
ADD COLUMN IF NOT EXISTS processing_time_ms integer;

-- Add index for webhook lookups by prediction ID
CREATE INDEX IF NOT EXISTS idx_staging_jobs_prediction_id
ON public.staging_jobs(replicate_prediction_id)
WHERE replicate_prediction_id IS NOT NULL;

-- Update status check constraint to include new statuses for async flow
-- First drop the existing constraint if it exists
DO $$
BEGIN
  ALTER TABLE public.staging_jobs
  DROP CONSTRAINT IF EXISTS staging_jobs_status_check;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Add updated constraint with new statuses
ALTER TABLE public.staging_jobs
ADD CONSTRAINT staging_jobs_status_check
CHECK (status IN ('pending', 'queued', 'preprocessing', 'processing', 'uploading', 'completed', 'failed'));

-- Create controlnet-inputs storage bucket for preprocessing outputs
INSERT INTO storage.buckets (id, name, public)
VALUES ('controlnet-inputs', 'controlnet-inputs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policy for controlnet inputs (service role only)
DO $$
BEGIN
  DROP POLICY IF EXISTS "Service role can manage controlnet inputs" ON storage.objects;
  CREATE POLICY "Service role can manage controlnet inputs"
  ON storage.objects FOR ALL
  TO service_role
  USING (bucket_id = 'controlnet-inputs')
  WITH CHECK (bucket_id = 'controlnet-inputs');
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN public.staging_jobs.provider IS 'AI provider used: gemini or stable-diffusion';
COMMENT ON COLUMN public.staging_jobs.replicate_prediction_id IS 'Replicate API prediction ID for async tracking';
COMMENT ON COLUMN public.staging_jobs.controlnet_inputs IS 'URLs to ControlNet conditioning images (depth, canny, segmentation)';
COMMENT ON COLUMN public.staging_jobs.generation_params IS 'AI generation parameters used (prompt, weights, seed, etc.)';
COMMENT ON COLUMN public.staging_jobs.processing_time_ms IS 'Total processing time in milliseconds';
