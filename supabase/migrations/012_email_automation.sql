-- Email Automation System
-- Migration: 012_email_automation.sql
-- Purpose: Support for email campaigns, preferences, and tracking

-- Email preference management
CREATE TABLE IF NOT EXISTS email_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  marketing_emails BOOLEAN DEFAULT true,
  product_updates BOOLEAN DEFAULT true,
  weekly_digest BOOLEAN DEFAULT true,
  staging_notifications BOOLEAN DEFAULT true,
  team_notifications BOOLEAN DEFAULT true,
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Campaign definitions
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  campaign_type TEXT NOT NULL CHECK (campaign_type IN ('drip', 'one-time', 'recurring')),
  trigger_event TEXT, -- 'user.created', 'staging.first', etc.
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User enrollment in campaigns
CREATE TABLE IF NOT EXISTS campaign_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'paused')),
  current_step INTEGER DEFAULT 0,
  next_send_at TIMESTAMPTZ,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  UNIQUE(user_id, campaign_id)
);

-- Individual email send records
CREATE TABLE IF NOT EXISTS email_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES campaign_enrollments(id) ON DELETE SET NULL,
  email_type TEXT NOT NULL, -- 'transactional', 'campaign', 'digest'
  template_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  to_email TEXT NOT NULL,
  resend_id TEXT, -- Resend message ID
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'failed')),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_preferences_user_id ON email_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_enrollments_user_id ON campaign_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_enrollments_campaign_id ON campaign_enrollments(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_enrollments_status ON campaign_enrollments(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_campaign_enrollments_next_send ON campaign_enrollments(next_send_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_email_sends_user_id ON email_sends(user_id);
CREATE INDEX IF NOT EXISTS idx_email_sends_resend_id ON email_sends(resend_id);
CREATE INDEX IF NOT EXISTS idx_email_sends_status ON email_sends(status);
CREATE INDEX IF NOT EXISTS idx_email_sends_created_at ON email_sends(created_at DESC);

-- RLS Policies
ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sends ENABLE ROW LEVEL SECURITY;

-- Email preferences: users can view and update their own
CREATE POLICY "Users can view own preferences"
  ON email_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON email_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON email_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Email campaigns: public read for active campaigns
CREATE POLICY "Anyone can view active campaigns"
  ON email_campaigns FOR SELECT
  USING (is_active = true);

-- Campaign enrollments: users can view their own
CREATE POLICY "Users can view own enrollments"
  ON campaign_enrollments FOR SELECT
  USING (auth.uid() = user_id);

-- Email sends: users can view their own
CREATE POLICY "Users can view own email sends"
  ON email_sends FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can manage all email tables (for background jobs)
-- This is handled automatically by service_role in Supabase

-- Insert default campaigns
INSERT INTO email_campaigns (slug, name, description, campaign_type, trigger_event, is_active)
VALUES
  ('onboarding', 'Onboarding Drip', 'Welcome sequence for new users', 'drip', 'user.created', true),
  ('reengagement-7d', 'Re-engagement 7 Days', 'Bring back users inactive for 7 days', 'one-time', 'user.inactive.7d', true),
  ('reengagement-14d', 'Re-engagement 14 Days', 'Bring back users inactive for 14 days', 'one-time', 'user.inactive.14d', true),
  ('reengagement-30d', 'Re-engagement 30 Days', 'Bring back users inactive for 30 days', 'one-time', 'user.inactive.30d', true),
  ('weekly-digest', 'Weekly Digest', 'Weekly activity summary', 'recurring', 'schedule.weekly', true)
ON CONFLICT (slug) DO NOTHING;

-- Function to create email preferences for new users
CREATE OR REPLACE FUNCTION create_email_preferences_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO email_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create email preferences when a profile is created
DROP TRIGGER IF EXISTS create_email_preferences_trigger ON profiles;
CREATE TRIGGER create_email_preferences_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_email_preferences_for_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_email_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at on email_preferences
DROP TRIGGER IF EXISTS email_preferences_updated_at ON email_preferences;
CREATE TRIGGER email_preferences_updated_at
  BEFORE UPDATE ON email_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_email_preferences_updated_at();

-- Trigger for updated_at on email_campaigns
DROP TRIGGER IF EXISTS email_campaigns_updated_at ON email_campaigns;
CREATE TRIGGER email_campaigns_updated_at
  BEFORE UPDATE ON email_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_email_preferences_updated_at();
