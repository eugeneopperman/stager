# PRD: Team Management Enhancements

## Overview

This PRD outlines improvements to the Team Management page to provide better visibility and control over team members and invitations.

## Current State

The Team page (`/team`) already has:
- ✅ Organization overview (name, member count, credits)
- ✅ Team member list with credit allocation
- ✅ Remove team member functionality
- ✅ Invite member dialog (email + initial credits)
- ✅ Pending invitations list (pending/expired only)
- ✅ Resend invitation button
- ✅ Revoke invitation button

### Current Limitations
1. **Invitations list only shows pending/expired** - Accepted invitations disappear
2. **No invitation history** - Can't see who was invited and when they joined
3. **Limited feedback** - No success/error toasts for actions
4. **No bulk actions** - Can only manage one invitation at a time

---

## Proposed Enhancements

### Option A: Enhanced Invitations Section (Recommended)

Replace the current "Pending Invitations" section with a comprehensive "Invitations" section:

**Features:**
1. **Tabbed interface** with "Pending" | "All History" tabs
2. **Status badges** for: Pending, Accepted, Expired, Revoked
3. **Action buttons per status:**
   - Pending: Resend, Revoke
   - Expired: Resend, Delete
   - Accepted: View member profile
   - Revoked: Delete from history
4. **Invitation details:** Email, credits allocated, invited date, expiry/accepted date
5. **Empty state** when no invitations exist

**UI Mockup:**
```
┌─────────────────────────────────────────────────────────────────┐
│  Invitations                                          [Pending ▼]│
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 📧 john@example.com           [Pending]     [Resend] [Revoke]││
│  │    💰 20 credits • Expires in 5 days                        ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 📧 jane@example.com           [Expired]     [Resend] [Delete]││
│  │    💰 15 credits • Expired 2 days ago                       ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 📧 bob@example.com            [Accepted]       [View Member]││
│  │    💰 25 credits • Joined Jan 20, 2025                      ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

### Option B: Minimal Enhancement

Keep the current structure but:
1. Add toast notifications for resend/revoke actions
2. Show invitation count badge on section header
3. Add confirmation dialog before revoking

---

### Option C: Full Activity Log

Add a separate "Activity" tab showing all team-related events:
- Member joined
- Member removed
- Credits allocated
- Invitation sent/accepted/revoked
- Property shared with team

This provides audit trail visibility without cluttering the main UI.

---

## Team Member Enhancements

### Current Member Card Features
- Avatar + name
- Role badge (Owner/Member)
- Credits: Available / Allocated
- Credit allocation slider (owner only)
- Remove button with confirmation (owner only)

### Proposed Additions

**Option 1: Enhanced Member Card**
- Last active date
- Total stagings this period
- Quick credit adjustment (+10/-10 buttons)

**Option 2: Member Detail Modal**
- Click member to see full details
- Credit usage history
- Properties they've staged
- Leave team button (for members viewing themselves)

---

## API Changes Required

### For Option A (Enhanced Invitations):

**Existing endpoints (no changes needed):**
- `GET /api/team/invitations` - Already returns all statuses
- `POST /api/team/invitations/[id]` - Resend
- `DELETE /api/team/invitations/[id]` - Revoke

**New endpoint needed:**
- `DELETE /api/team/invitations/[id]/permanent` - Hard delete from history

### For Activity Log (Option C):

**New endpoint:**
- `GET /api/team/activity` - Returns audit log entries for the organization

---

## Recommended Implementation

**Phase 1: Quick Wins**
1. Add toast notifications for all actions (resend, revoke, remove member)
2. Add confirmation dialogs for destructive actions
3. Show all invitation statuses (not just pending/expired)

**Phase 2: Enhanced Invitations**
1. Add filter dropdown (All / Pending / Accepted / Revoked)
2. Add delete from history for revoked/expired
3. Improve empty states

**Phase 3: Activity Log (Future)**
1. Add Activity tab
2. Show team-wide audit trail
3. Export activity report

---

## Questions for Review

1. **Invitation history retention:** How long should we keep revoked/expired invitations?
   - [ ] 30 days
   - [ ] 90 days
   - [ ] Forever

2. **Member self-removal:** Should members be able to leave the team themselves?
   - [ ] Yes, with confirmation
   - [ ] No, owner must remove

3. **Activity log priority:** Is the activity log needed now or future?
   - [ ] Include in Phase 1
   - [ ] Defer to Phase 3

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/team/PendingInvitationsList.tsx` | Add filter, show all statuses |
| `src/hooks/useTeamInvitationsSWR.ts` | Remove pending-only filter |
| `src/app/(dashboard)/team/_components/TeamPageClient.tsx` | Add toasts, update section title |
| `src/app/api/team/invitations/[id]/route.ts` | Add permanent delete option |

---

## Success Metrics

- Team owners can see full invitation history
- Clear feedback on all actions (toasts)
- Reduced support requests about invitation status
