-- Additional Performance Indexes
-- Migration: 011_additional_indexes.sql
-- These indexes optimize common query patterns identified from codebase analysis

-- ============================================
-- Notifications Table
-- ============================================

-- Optimize unread notification count and list
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications(user_id, is_read)
  WHERE is_read = false;

-- Optimize notification history with ordering
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON notifications(user_id, created_at DESC);

COMMENT ON INDEX idx_notifications_user_unread IS 'Optimizes unread notification queries - filters by user and read status';
COMMENT ON INDEX idx_notifications_user_created IS 'Optimizes notification list - orders by creation date';

-- ============================================
-- Subscriptions Table
-- ============================================

-- Optimize subscription lookup by user
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id
  ON subscriptions(user_id);

-- Optimize webhook lookups by Stripe subscription ID
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id
  ON subscriptions(stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

-- Optimize finding active subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_status
  ON subscriptions(status)
  WHERE status = 'active';

COMMENT ON INDEX idx_subscriptions_user_id IS 'Optimizes subscription lookups by user';
COMMENT ON INDEX idx_subscriptions_stripe_id IS 'Optimizes Stripe webhook processing';
COMMENT ON INDEX idx_subscriptions_status IS 'Optimizes finding active subscriptions';

-- ============================================
-- Properties Table
-- ============================================

-- Optimize property list with ordering
CREATE INDEX IF NOT EXISTS idx_properties_user_created
  ON properties(user_id, created_at DESC);

-- Optimize property search by address (partial text match)
CREATE INDEX IF NOT EXISTS idx_properties_address_trgm
  ON properties USING gin(address gin_trgm_ops);

COMMENT ON INDEX idx_properties_user_created IS 'Optimizes property list - orders by creation date';
COMMENT ON INDEX idx_properties_address_trgm IS 'Optimizes property search by address (requires pg_trgm extension)';

-- ============================================
-- Profiles Table
-- ============================================

-- Optimize Stripe customer lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer
  ON profiles(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

-- Optimize email lookups (for team invitations)
CREATE INDEX IF NOT EXISTS idx_profiles_email
  ON profiles(email)
  WHERE email IS NOT NULL;

COMMENT ON INDEX idx_profiles_stripe_customer IS 'Optimizes Stripe customer ID lookups for billing';
COMMENT ON INDEX idx_profiles_email IS 'Optimizes user lookups by email';

-- ============================================
-- Credit Transactions Table (if exists)
-- ============================================

-- Optimize transaction history by user
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_created
  ON credit_transactions(user_id, created_at DESC);

COMMENT ON INDEX idx_credit_transactions_user_created IS 'Optimizes credit transaction history';

-- ============================================
-- Staging Jobs - Additional Indexes
-- ============================================

-- Optimize version group lookups
CREATE INDEX IF NOT EXISTS idx_staging_jobs_version_group
  ON staging_jobs(version_group_id)
  WHERE version_group_id IS NOT NULL;

-- Optimize finding primary versions
CREATE INDEX IF NOT EXISTS idx_staging_jobs_primary
  ON staging_jobs(version_group_id, is_primary)
  WHERE is_primary = true;

-- Optimize recent jobs lookup (dashboard)
CREATE INDEX IF NOT EXISTS idx_staging_jobs_user_created
  ON staging_jobs(user_id, created_at DESC);

-- Optimize room type and style filtering
CREATE INDEX IF NOT EXISTS idx_staging_jobs_room_style
  ON staging_jobs(room_type, style);

COMMENT ON INDEX idx_staging_jobs_version_group IS 'Optimizes version group queries for remix feature';
COMMENT ON INDEX idx_staging_jobs_primary IS 'Optimizes finding primary version in a group';
COMMENT ON INDEX idx_staging_jobs_user_created IS 'Optimizes recent jobs on dashboard';
COMMENT ON INDEX idx_staging_jobs_room_style IS 'Optimizes filtering by room type and style';

-- ============================================
-- Organizations Table
-- ============================================

-- Optimize organization lookup by owner
CREATE INDEX IF NOT EXISTS idx_organizations_owner
  ON organizations(owner_id);

COMMENT ON INDEX idx_organizations_owner IS 'Optimizes organization lookup by owner';

-- ============================================
-- Team Invitations - Additional Index
-- ============================================

-- Optimize invitation token lookup (for accept flow)
CREATE INDEX IF NOT EXISTS idx_team_invitations_token
  ON team_invitations(invitation_token)
  WHERE status = 'pending';

-- Optimize finding invitations by email
CREATE INDEX IF NOT EXISTS idx_team_invitations_email
  ON team_invitations(email, status);

COMMENT ON INDEX idx_team_invitations_token IS 'Optimizes invitation acceptance flow';
COMMENT ON INDEX idx_team_invitations_email IS 'Optimizes checking existing invitations by email';

-- ============================================
-- Enable pg_trgm extension for text search
-- (Run this first if not already enabled)
-- ============================================
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
