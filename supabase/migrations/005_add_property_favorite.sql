-- Add is_favorite column to properties table
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS is_favorite boolean DEFAULT false;

-- Create index for faster favorite queries
CREATE INDEX IF NOT EXISTS idx_properties_is_favorite
ON public.properties(is_favorite) WHERE is_favorite = true;
