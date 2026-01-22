-- Migration: Subscription Plans & Team Management
-- Description: Adds plans, subscriptions, organizations, team members, and credit tracking

-- ==========================================
-- 1. SUBSCRIPTION STATUS ENUM
-- ==========================================
CREATE TYPE subscription_status AS ENUM (
  'active',
  'canceled',
  'past_due',
  'trialing',
  'paused'
);

-- ==========================================
-- 2. PLANS TABLE
-- ==========================================
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_product_id TEXT UNIQUE,
  stripe_price_id TEXT UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0,
  credits_per_month INTEGER NOT NULL,
  max_team_members INTEGER NOT NULL DEFAULT 1,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default plans
INSERT INTO plans (slug, name, description, price_cents, credits_per_month, max_team_members, features, sort_order) VALUES
  ('free', 'Free', 'Perfect for trying out virtual staging', 0, 5, 1,
   '["5 credits per month", "Basic room types", "Standard quality"]'::jsonb, 0),
  ('standard', 'Standard', 'Great for individual agents', 2500, 60, 1,
   '["60 credits per month", "All room types", "High quality", "Email support"]'::jsonb, 1),
  ('professional', 'Professional', 'For busy real estate professionals', 5000, 150, 1,
   '["150 credits per month", "All room types", "Premium quality", "Priority support"]'::jsonb, 2),
  ('enterprise', 'Enterprise', 'For teams and brokerages', 15000, 500, 10,
   '["500 credits per month", "Up to 10 team members", "Credit allocation", "Shared properties", "Dedicated support"]'::jsonb, 3);

-- ==========================================
-- 3. SUBSCRIPTIONS TABLE
-- ==========================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id),
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  status subscription_status NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- ==========================================
-- 4. ORGANIZATIONS TABLE (Enterprise teams)
-- ==========================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  total_credits INTEGER NOT NULL DEFAULT 0,
  unallocated_credits INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(owner_id)
);

-- ==========================================
-- 5. ORGANIZATION MEMBERS TABLE
-- ==========================================
CREATE TYPE organization_role AS ENUM ('owner', 'member');

CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role organization_role NOT NULL DEFAULT 'member',
  allocated_credits INTEGER NOT NULL DEFAULT 0,
  credits_used_this_period INTEGER NOT NULL DEFAULT 0,
  invited_at TIMESTAMPTZ DEFAULT now(),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- ==========================================
-- 6. CREDIT TOPUPS TABLE
-- ==========================================
CREATE TYPE topup_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

CREATE TABLE credit_topups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_checkout_session_id TEXT,
  credits_purchased INTEGER NOT NULL,
  amount_cents INTEGER NOT NULL,
  status topup_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- ==========================================
-- 7. CREDIT TRANSACTIONS TABLE (Audit log)
-- ==========================================
CREATE TYPE credit_transaction_type AS ENUM (
  'subscription_renewal',
  'topup_purchase',
  'staging_deduction',
  'allocation_to_member',
  'allocation_from_owner',
  'refund',
  'adjustment'
);

CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  transaction_type credit_transaction_type NOT NULL,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  reference_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast transaction lookups
CREATE INDEX idx_credit_transactions_user ON credit_transactions(user_id, created_at DESC);
CREATE INDEX idx_credit_transactions_org ON credit_transactions(organization_id, created_at DESC);

-- ==========================================
-- 8. MODIFY PROFILES TABLE
-- ==========================================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES plans(id),
  ADD COLUMN IF NOT EXISTS credits_reset_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Set default plan for existing users to free
UPDATE profiles
SET plan_id = (SELECT id FROM plans WHERE slug = 'free')
WHERE plan_id IS NULL;

-- ==========================================
-- 9. MODIFY PROPERTIES TABLE
-- ==========================================
CREATE TYPE property_visibility AS ENUM ('private', 'team');

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS visibility property_visibility DEFAULT 'private';

-- ==========================================
-- 10. MODIFY STAGING_JOBS TABLE
-- ==========================================
ALTER TABLE staging_jobs
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- ==========================================
-- 11. ROW LEVEL SECURITY POLICIES
-- ==========================================

-- Enable RLS on new tables
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_topups ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Plans: Everyone can read active plans
CREATE POLICY "Anyone can view active plans"
  ON plans FOR SELECT
  USING (is_active = true);

-- Subscriptions: Users can only see their own
CREATE POLICY "Users can view their own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions"
  ON subscriptions FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Organizations: Owner and members can view
CREATE POLICY "Organization members can view their organization"
  ON organizations FOR SELECT
  USING (
    owner_id = auth.uid() OR
    id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Owners can update their organization"
  ON organizations FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Service role can manage organizations"
  ON organizations FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Organization Members: Owner can manage, members can view
CREATE POLICY "Members can view their organization memberships"
  ON organization_members FOR SELECT
  USING (
    user_id = auth.uid() OR
    organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
  );

CREATE POLICY "Owners can manage organization members"
  ON organization_members FOR ALL
  USING (
    organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
  );

CREATE POLICY "Service role can manage organization members"
  ON organization_members FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Credit Topups: Users can view their own
CREATE POLICY "Users can view their own topups"
  ON credit_topups FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage topups"
  ON credit_topups FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Credit Transactions: Users can view their own
CREATE POLICY "Users can view their own transactions"
  ON credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Org members can view org transactions"
  ON credit_transactions FOR SELECT
  USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Service role can manage transactions"
  ON credit_transactions FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Update properties policy to include team access
CREATE POLICY "Team members can view team properties"
  ON properties FOR SELECT
  USING (
    user_id = auth.uid() OR
    (
      visibility = 'team' AND
      organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    )
  );

-- Update staging_jobs policy to include team access
CREATE POLICY "Team members can view team staging jobs"
  ON staging_jobs FOR SELECT
  USING (
    user_id = auth.uid() OR
    (
      organization_id IS NOT NULL AND
      organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    )
  );

-- ==========================================
-- 12. HELPER FUNCTIONS
-- ==========================================

-- Function to get user's effective credits (personal or allocated from org)
CREATE OR REPLACE FUNCTION get_user_credits(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_org_member organization_members%ROWTYPE;
  v_profile profiles%ROWTYPE;
BEGIN
  -- Check if user is part of an organization
  SELECT * INTO v_org_member
  FROM organization_members
  WHERE user_id = p_user_id
  LIMIT 1;

  IF FOUND THEN
    -- Return allocated credits minus used
    RETURN GREATEST(0, v_org_member.allocated_credits - v_org_member.credits_used_this_period);
  ELSE
    -- Return personal credits
    SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;
    RETURN COALESCE(v_profile.credits_remaining, 0);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to deduct credits (handles both personal and org)
CREATE OR REPLACE FUNCTION deduct_user_credits(p_user_id UUID, p_amount INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  v_org_member organization_members%ROWTYPE;
  v_current_credits INTEGER;
BEGIN
  -- Check if user is part of an organization
  SELECT * INTO v_org_member
  FROM organization_members
  WHERE user_id = p_user_id
  LIMIT 1;

  IF FOUND THEN
    -- Check if enough credits
    v_current_credits := v_org_member.allocated_credits - v_org_member.credits_used_this_period;
    IF v_current_credits < p_amount THEN
      RETURN FALSE;
    END IF;

    -- Deduct from organization member
    UPDATE organization_members
    SET credits_used_this_period = credits_used_this_period + p_amount,
        updated_at = now()
    WHERE id = v_org_member.id;
  ELSE
    -- Check personal credits
    SELECT credits_remaining INTO v_current_credits
    FROM profiles
    WHERE id = p_user_id;

    IF v_current_credits < p_amount THEN
      RETURN FALSE;
    END IF;

    -- Deduct from personal profile
    UPDATE profiles
    SET credits_remaining = credits_remaining - p_amount,
        updated_at = now()
    WHERE id = p_user_id;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_members_updated_at
  BEFORE UPDATE ON organization_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 13. INDEXES FOR PERFORMANCE
-- ==========================================
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_stripe_subscription ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_organizations_owner ON organizations(owner_id);
CREATE INDEX idx_organization_members_user ON organization_members(user_id);
CREATE INDEX idx_organization_members_org ON organization_members(organization_id);
CREATE INDEX idx_profiles_organization ON profiles(organization_id);
CREATE INDEX idx_properties_organization ON properties(organization_id);
CREATE INDEX idx_staging_jobs_organization ON staging_jobs(organization_id);
CREATE INDEX idx_credit_topups_user ON credit_topups(user_id);
