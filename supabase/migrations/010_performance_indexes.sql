-- Performance indexes for common query patterns
-- Run this migration in Supabase SQL editor or via CLI

-- Optimize property staging lookups (used in properties page)
CREATE INDEX IF NOT EXISTS idx_staging_jobs_property_status
  ON staging_jobs(property_id, status);

-- Optimize user history queries (used in history page, billing page)
CREATE INDEX IF NOT EXISTS idx_staging_jobs_user_status_created
  ON staging_jobs(user_id, status, created_at DESC);

-- Optimize organization member lookups (used in team features)
CREATE INDEX IF NOT EXISTS idx_org_members_user
  ON organization_members(user_id);

-- Optimize invitation queries (used in team invitations)
CREATE INDEX IF NOT EXISTS idx_team_invitations_org_status
  ON team_invitations(organization_id, status);

-- Add comment explaining the indexes
COMMENT ON INDEX idx_staging_jobs_property_status IS 'Optimizes property detail pages - fetching staging jobs by property and status';
COMMENT ON INDEX idx_staging_jobs_user_status_created IS 'Optimizes history/billing pages - fetching user jobs by status ordered by date';
COMMENT ON INDEX idx_org_members_user IS 'Optimizes team lookups - finding organizations a user belongs to';
COMMENT ON INDEX idx_team_invitations_org_status IS 'Optimizes invitation management - listing pending invitations by organization';
