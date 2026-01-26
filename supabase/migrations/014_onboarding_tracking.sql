-- Add onboarding tracking to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamp with time zone DEFAULT NULL;

-- Index for users with incomplete onboarding (for dashboard query optimization)
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_incomplete
ON public.profiles (id)
WHERE onboarding_completed_at IS NULL;

-- Comment for documentation
COMMENT ON COLUMN public.profiles.onboarding_completed_at IS 'Timestamp when user completed the welcome onboarding flow. NULL means onboarding not yet completed.';
