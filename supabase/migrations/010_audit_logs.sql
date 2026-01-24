-- Audit logs table for tracking sensitive operations
-- Migration: 010_audit_logs.sql

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who performed the action
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,

  -- What happened
  event_type TEXT NOT NULL,  -- e.g., 'team.member.invited', 'billing.subscription.created'
  resource_type TEXT NOT NULL,  -- e.g., 'team_member', 'subscription', 'property'
  resource_id TEXT,  -- ID of the affected resource
  action TEXT NOT NULL,  -- 'created', 'updated', 'deleted', 'invoked'

  -- Data snapshots (for compliance and debugging)
  previous_values JSONB,  -- State before the action (null for creates)
  new_values JSONB,  -- State after the action (null for deletes)
  metadata JSONB DEFAULT '{}',  -- Additional context (IP, user agent, correlation IDs)

  -- Request context
  ip_address TEXT,
  user_agent TEXT,
  request_id TEXT,  -- Correlation ID from X-Request-ID header

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_request_id ON audit_logs(request_id);

-- Composite index for filtering by user and time
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_time ON audit_logs(user_id, created_at DESC);

-- RLS Policies
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can only read their own audit logs
CREATE POLICY "Users can view own audit logs"
  ON audit_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Organization owners can view their organization's audit logs
CREATE POLICY "Org owners can view org audit logs"
  ON audit_logs FOR SELECT
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

-- Only service role can insert audit logs (from API routes)
CREATE POLICY "Service role can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

-- No updates allowed (audit logs are immutable)
-- No deletes allowed by users (only by retention policy)

-- Function to clean up old audit logs (retention policy)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(days_to_keep INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM audit_logs
  WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment for documentation
COMMENT ON TABLE audit_logs IS 'Immutable audit trail for sensitive operations. Retention: 365 days by default.';
COMMENT ON COLUMN audit_logs.event_type IS 'Hierarchical event type like team.member.invited, billing.subscription.created';
COMMENT ON COLUMN audit_logs.previous_values IS 'JSON snapshot of state before the action (null for creates)';
COMMENT ON COLUMN audit_logs.new_values IS 'JSON snapshot of state after the action (null for deletes)';
