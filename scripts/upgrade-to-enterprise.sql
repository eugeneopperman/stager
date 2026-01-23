-- Upgrade user to Enterprise plan
-- Run this in Supabase SQL Editor

-- Step 1: Get user ID and plan ID
DO $$
DECLARE
  v_user_id UUID;
  v_enterprise_plan_id UUID;
  v_subscription_id UUID;
  v_org_id UUID;
BEGIN
  -- Get user ID from auth.users by email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'eugeneopperman11@gmail.com';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found with email eugeneopperman11@gmail.com';
  END IF;

  RAISE NOTICE 'Found user: %', v_user_id;

  -- Get Enterprise plan ID
  SELECT id INTO v_enterprise_plan_id
  FROM plans
  WHERE slug = 'enterprise';

  IF v_enterprise_plan_id IS NULL THEN
    RAISE EXCEPTION 'Enterprise plan not found';
  END IF;

  RAISE NOTICE 'Found enterprise plan: %', v_enterprise_plan_id;

  -- Create or update subscription (without Stripe - manual override)
  INSERT INTO subscriptions (
    user_id,
    plan_id,
    status,
    current_period_start,
    current_period_end,
    cancel_at_period_end
  ) VALUES (
    v_user_id,
    v_enterprise_plan_id,
    'active',
    NOW(),
    NOW() + INTERVAL '1 year', -- Give a year for testing
    false
  )
  ON CONFLICT (user_id) DO UPDATE SET
    plan_id = v_enterprise_plan_id,
    status = 'active',
    current_period_start = NOW(),
    current_period_end = NOW() + INTERVAL '1 year',
    cancel_at_period_end = false
  RETURNING id INTO v_subscription_id;

  RAISE NOTICE 'Subscription created/updated: %', v_subscription_id;

  -- Update profile with plan and credits
  UPDATE profiles
  SET
    plan_id = v_enterprise_plan_id,
    credits_remaining = 500, -- Enterprise credits
    credits_reset_at = NOW()
  WHERE id = v_user_id;

  RAISE NOTICE 'Profile updated with Enterprise plan and 500 credits';

  -- Create organization if not exists
  INSERT INTO organizations (
    name,
    owner_id,
    subscription_id,
    total_credits,
    unallocated_credits
  ) VALUES (
    'Eugene''s Team',
    v_user_id,
    v_subscription_id,
    500,
    500
  )
  ON CONFLICT (owner_id) DO UPDATE SET
    subscription_id = v_subscription_id,
    total_credits = 500,
    unallocated_credits = 500
  RETURNING id INTO v_org_id;

  RAISE NOTICE 'Organization created/updated: %', v_org_id;

  -- Add user as owner member
  INSERT INTO organization_members (
    organization_id,
    user_id,
    role,
    allocated_credits,
    credits_used_this_period,
    joined_at
  ) VALUES (
    v_org_id,
    v_user_id,
    'owner',
    500,
    0,
    NOW()
  )
  ON CONFLICT (organization_id, user_id) DO UPDATE SET
    role = 'owner',
    allocated_credits = 500,
    credits_used_this_period = 0;

  RAISE NOTICE 'User added as organization owner';

  -- Update profile with organization
  UPDATE profiles
  SET organization_id = v_org_id
  WHERE id = v_user_id;

  RAISE NOTICE 'Profile linked to organization';

  -- Log the transaction
  INSERT INTO credit_transactions (
    user_id,
    organization_id,
    transaction_type,
    amount,
    balance_after,
    description
  ) VALUES (
    v_user_id,
    v_org_id,
    'subscription_renewal',
    500,
    500,
    'Manual upgrade to Enterprise plan for testing'
  );

  RAISE NOTICE 'SUCCESS: User upgraded to Enterprise with 500 credits!';
END $$;

-- Verify the upgrade
SELECT
  p.id,
  p.full_name,
  p.credits_remaining,
  pl.name as plan_name,
  pl.slug as plan_slug,
  o.name as org_name,
  s.status as subscription_status
FROM profiles p
LEFT JOIN plans pl ON p.plan_id = pl.id
LEFT JOIN organizations o ON p.organization_id = o.id
LEFT JOIN subscriptions s ON s.user_id = p.id
WHERE p.id = (SELECT id FROM auth.users WHERE email = 'eugeneopperman11@gmail.com');
