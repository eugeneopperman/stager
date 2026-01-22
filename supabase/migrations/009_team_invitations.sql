-- Migration: Team Invitations
-- Description: Adds email-based team invitation system for Enterprise organizations

-- ==========================================
-- 1. TEAM INVITATIONS TABLE
-- ==========================================
CREATE TABLE team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invitation_token TEXT NOT NULL UNIQUE,
  initial_credits INTEGER NOT NULL DEFAULT 0,
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  UNIQUE(organization_id, email)
);

-- ==========================================
-- 2. INDEXES
-- ==========================================
-- Index for token lookups (accept flow)
CREATE INDEX idx_team_invitations_token ON team_invitations(invitation_token);
-- Index for email lookups during signup
CREATE INDEX idx_team_invitations_email ON team_invitations(email, status);
-- Index for organization lookups
CREATE INDEX idx_team_invitations_org ON team_invitations(organization_id, status);

-- ==========================================
-- 3. ROW LEVEL SECURITY
-- ==========================================
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- Owners can view their org's invitations
CREATE POLICY "Owners can view org invitations"
  ON team_invitations FOR SELECT
  USING (organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()));

-- Owners can insert invitations for their org
CREATE POLICY "Owners can create org invitations"
  ON team_invitations FOR INSERT
  WITH CHECK (organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()));

-- Owners can update/delete invitations for their org
CREATE POLICY "Owners can manage org invitations"
  ON team_invitations FOR UPDATE
  USING (organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()));

CREATE POLICY "Owners can delete org invitations"
  ON team_invitations FOR DELETE
  USING (organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid()));

-- Service role can manage all invitations (for signup flow)
CREATE POLICY "Service role can manage invitations"
  ON team_invitations FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Anyone can read their own invitation by token (for accept flow)
CREATE POLICY "Anyone can view invitation by email"
  ON team_invitations FOR SELECT
  USING (lower(email) = lower(auth.jwt() ->> 'email'));

-- ==========================================
-- 4. TRIGGER FOR UPDATED_AT
-- ==========================================
CREATE TRIGGER update_team_invitations_updated_at
  BEFORE UPDATE ON team_invitations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 5. HELPER FUNCTION TO CHECK EXPIRED INVITATIONS
-- ==========================================
CREATE OR REPLACE FUNCTION mark_expired_invitations()
RETURNS void AS $$
BEGIN
  UPDATE team_invitations
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
