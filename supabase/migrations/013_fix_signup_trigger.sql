-- Migration: Fix Signup Trigger
-- Description: Fixes profile creation trigger and adds missing INSERT policy

-- ==========================================
-- 1. ADD INSERT POLICY FOR PROFILES
-- ==========================================
-- The trigger uses SECURITY DEFINER but adding this policy ensures
-- the service role can also insert profiles if needed

DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;
CREATE POLICY "Service role can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- ==========================================
-- 2. UPDATE HANDLE_NEW_USER FUNCTION
-- ==========================================
-- Make the function more robust and set default plan

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
    v_free_plan_id,  -- Will be NULL if plans table doesn't exist
    10  -- Default credits
  );

  RETURN new;
EXCEPTION
  WHEN others THEN
    -- Log the error but don't fail the signup
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    -- Try a minimal insert
    BEGIN
      INSERT INTO public.profiles (id, full_name)
      VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', ''));
    EXCEPTION
      WHEN others THEN
        RAISE WARNING 'Fallback insert also failed: %', SQLERRM;
        -- Re-raise to fail the signup if we can't create a profile at all
        RAISE;
    END;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 3. FIX EMAIL PREFERENCES TRIGGER
-- ==========================================
-- Make it more robust - don't fail if email_preferences doesn't exist

CREATE OR REPLACE FUNCTION create_email_preferences_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only try to insert if the table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_preferences') THEN
    INSERT INTO email_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Don't fail profile creation if email preferences fails
    RAISE WARNING 'Error creating email preferences: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 4. ENSURE TRIGGERS ARE SET UP CORRECTLY
-- ==========================================

-- Recreate the auth trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Recreate the email preferences trigger (if profiles table exists)
DROP TRIGGER IF EXISTS create_email_preferences_trigger ON profiles;
CREATE TRIGGER create_email_preferences_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_email_preferences_for_new_user();
