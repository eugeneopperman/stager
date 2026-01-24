-- =====================================================
-- Recommended Database Indexes for Stager
-- =====================================================
-- Run these in the Supabase SQL Editor to improve query performance.
-- These indexes are based on common query patterns in the application.

-- =====================================================
-- STAGING_JOBS TABLE
-- =====================================================

-- Index for fetching user's staging jobs (dashboard, history)
-- Used in: /history, /dashboard, job lookups
CREATE INDEX IF NOT EXISTS idx_staging_jobs_user_id
ON staging_jobs(user_id);

-- Index for filtering by status (processing jobs, completed jobs)
-- Used in: polling, history filters
CREATE INDEX IF NOT EXISTS idx_staging_jobs_status
ON staging_jobs(status);

-- Composite index for user + status queries (most common pattern)
-- Used in: "Show my completed stagings", dashboard stats
CREATE INDEX IF NOT EXISTS idx_staging_jobs_user_status
ON staging_jobs(user_id, status);

-- Index for property-based lookups
-- Used in: property detail page, filtering by property
CREATE INDEX IF NOT EXISTS idx_staging_jobs_property_id
ON staging_jobs(property_id)
WHERE property_id IS NOT NULL;

-- Index for version group lookups (remix feature)
-- Used in: version management, remix functionality
CREATE INDEX IF NOT EXISTS idx_staging_jobs_version_group
ON staging_jobs(version_group_id)
WHERE version_group_id IS NOT NULL;

-- Index for chronological ordering (recent jobs first)
-- Used in: history page, dashboard recent activity
CREATE INDEX IF NOT EXISTS idx_staging_jobs_created_at
ON staging_jobs(created_at DESC);

-- Composite for user's recent jobs (very common query)
CREATE INDEX IF NOT EXISTS idx_staging_jobs_user_created
ON staging_jobs(user_id, created_at DESC);

-- =====================================================
-- PROPERTIES TABLE
-- =====================================================

-- Index for user's properties
-- Used in: /properties, property selector
CREATE INDEX IF NOT EXISTS idx_properties_user_id
ON properties(user_id);

-- Index for searching properties by name
-- Used in: global search, property selector autocomplete
CREATE INDEX IF NOT EXISTS idx_properties_name_search
ON properties USING gin(name gin_trgm_ops);

-- Note: Requires pg_trgm extension. Enable with:
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================

-- Index for user's notifications
-- Used in: notification dropdown, polling
CREATE INDEX IF NOT EXISTS idx_notifications_user_id
ON notifications(user_id);

-- Index for unread notifications count
-- Used in: notification badge count
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
ON notifications(user_id, is_read)
WHERE is_read = false;

-- Index for chronological order
-- Used in: notification list sorting
CREATE INDEX IF NOT EXISTS idx_notifications_created_at
ON notifications(created_at DESC);

-- =====================================================
-- TEAM/ORGANIZATION TABLES
-- =====================================================

-- Index for organization members lookup
-- Used in: team page, permission checks
CREATE INDEX IF NOT EXISTS idx_org_members_org_id
ON organization_members(organization_id);

-- Index for user's organization membership
-- Used in: checking if user belongs to org
CREATE INDEX IF NOT EXISTS idx_org_members_user_id
ON organization_members(user_id);

-- Index for team invitations by organization
-- Used in: pending invitations list
CREATE INDEX IF NOT EXISTS idx_team_invitations_org_id
ON team_invitations(organization_id);

-- Index for pending invitations
-- Used in: invitation management
CREATE INDEX IF NOT EXISTS idx_team_invitations_status
ON team_invitations(status)
WHERE status = 'pending';

-- Index for invitation token lookup (accept flow)
-- Used in: /invite/accept page
CREATE INDEX IF NOT EXISTS idx_team_invitations_token
ON team_invitations(invitation_token);

-- =====================================================
-- SUBSCRIPTIONS & BILLING
-- =====================================================

-- Index for user's subscription lookup
-- Used in: credit checks, plan validation
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id
ON subscriptions(user_id);

-- Index for active subscriptions
-- Used in: billing checks
CREATE INDEX IF NOT EXISTS idx_subscriptions_active
ON subscriptions(user_id, status)
WHERE status = 'active';

-- Index for Stripe customer lookup
-- Used in: webhook processing
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer
ON profiles(stripe_customer_id)
WHERE stripe_customer_id IS NOT NULL;

-- =====================================================
-- CREDIT TRANSACTIONS (if table exists)
-- =====================================================

-- Index for user's credit history
-- Used in: billing history
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id
ON credit_transactions(user_id);

-- Index for chronological transaction history
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created
ON credit_transactions(user_id, created_at DESC);

-- =====================================================
-- FULL-TEXT SEARCH INDEXES (optional, for advanced search)
-- =====================================================

-- Full-text search on property names and addresses
-- CREATE INDEX IF NOT EXISTS idx_properties_fts
-- ON properties USING gin(
--   to_tsvector('english', coalesce(name, '') || ' ' || coalesce(address, ''))
-- );

-- =====================================================
-- ANALYZE TABLES
-- =====================================================
-- Run ANALYZE after creating indexes to update statistics

ANALYZE staging_jobs;
ANALYZE properties;
ANALYZE notifications;
ANALYZE organization_members;
ANALYZE team_invitations;
ANALYZE subscriptions;
ANALYZE profiles;

-- =====================================================
-- NOTES
-- =====================================================
--
-- 1. These indexes are recommendations based on query patterns.
--    Monitor slow queries and adjust as needed.
--
-- 2. Indexes have storage and write overhead. Only create
--    indexes that will be frequently used.
--
-- 3. For text search (pg_trgm), ensure the extension is enabled:
--    CREATE EXTENSION IF NOT EXISTS pg_trgm;
--
-- 4. Use EXPLAIN ANALYZE to verify indexes are being used:
--    EXPLAIN ANALYZE SELECT * FROM staging_jobs WHERE user_id = 'xxx';
--
-- 5. Periodically run ANALYZE to keep statistics up to date.
