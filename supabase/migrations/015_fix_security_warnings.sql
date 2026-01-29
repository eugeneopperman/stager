-- Migration: Fix Supabase Security Linter Warnings
-- Description: Sets search_path on all functions and fixes overly permissive RLS policy

-- ==========================================
-- 1. FIX FUNCTION SEARCH PATHS
-- ==========================================
-- Adding SET search_path = '' prevents search path injection attacks
-- by forcing fully qualified table names within functions

-- Fix handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_free_plan_id UUID;
BEGIN
  -- Get the free plan ID (may not exist if plans table not set up)
  SELECT id INTO v_free_plan_id FROM public.plans WHERE slug = 'free' LIMIT 1;

  -- Insert the profile with default values
  INSERT INTO public.profiles (id, full_name, plan_id, credits_remaining)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    v_free_plan_id,
    10
  );

  RETURN new;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    BEGIN
      INSERT INTO public.profiles (id, full_name)
      VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', ''));
    EXCEPTION
      WHEN others THEN
        RAISE WARNING 'Fallback insert also failed: %', SQLERRM;
        RAISE;
    END;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Fix create_email_preferences_for_new_user
CREATE OR REPLACE FUNCTION public.create_email_preferences_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'email_preferences') THEN
    INSERT INTO public.email_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Error creating email preferences: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Fix get_user_credits
CREATE OR REPLACE FUNCTION public.get_user_credits(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_org_member public.organization_members%ROWTYPE;
  v_profile public.profiles%ROWTYPE;
BEGIN
  SELECT * INTO v_org_member
  FROM public.organization_members
  WHERE user_id = p_user_id
  LIMIT 1;

  IF FOUND THEN
    RETURN GREATEST(0, v_org_member.allocated_credits - v_org_member.credits_used_this_period);
  ELSE
    SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;
    RETURN COALESCE(v_profile.credits_remaining, 0);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Fix deduct_user_credits
CREATE OR REPLACE FUNCTION public.deduct_user_credits(p_user_id UUID, p_amount INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  v_org_member public.organization_members%ROWTYPE;
  v_current_credits INTEGER;
BEGIN
  SELECT * INTO v_org_member
  FROM public.organization_members
  WHERE user_id = p_user_id
  LIMIT 1;

  IF FOUND THEN
    v_current_credits := v_org_member.allocated_credits - v_org_member.credits_used_this_period;
    IF v_current_credits < p_amount THEN
      RETURN FALSE;
    END IF;

    UPDATE public.organization_members
    SET credits_used_this_period = credits_used_this_period + p_amount,
        updated_at = now()
    WHERE id = v_org_member.id;
  ELSE
    SELECT credits_remaining INTO v_current_credits
    FROM public.profiles
    WHERE id = p_user_id;

    IF v_current_credits < p_amount THEN
      RETURN FALSE;
    END IF;

    UPDATE public.profiles
    SET credits_remaining = credits_remaining - p_amount,
        updated_at = now()
    WHERE id = p_user_id;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Fix update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- Fix mark_expired_invitations
CREATE OR REPLACE FUNCTION public.mark_expired_invitations()
RETURNS void AS $$
BEGIN
  UPDATE public.team_invitations
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Fix update_email_preferences_updated_at
CREATE OR REPLACE FUNCTION public.update_email_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- ==========================================
-- 2. FIX OVERLY PERMISSIVE RLS POLICY
-- ==========================================
-- The "Service role can insert profiles" policy has WITH CHECK (true)
-- which allows anyone to insert. The trigger handles profile creation
-- with SECURITY DEFINER, so we can make this policy more restrictive.
-- Users should only be able to insert a profile for themselves.

DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;

-- Allow users to insert only their own profile (as a fallback)
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
