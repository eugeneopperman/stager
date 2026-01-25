# Email Automation System Setup

This document describes how to set up and configure the email automation system.

## 1. Database Migration

Run the migration in your Supabase dashboard or via CLI:

```bash
# If using Supabase CLI
supabase db push

# Or run the SQL directly in the Supabase SQL Editor:
# Copy contents of supabase/migrations/012_email_automation.sql
```

The migration creates:
- `email_preferences` - User email preference settings
- `email_campaigns` - Campaign definitions
- `campaign_enrollments` - User enrollments in campaigns
- `email_sends` - Individual email send records with tracking

It also:
- Creates triggers to auto-create email preferences for new users
- Seeds default campaign definitions
- Sets up RLS policies for security

## 2. Environment Variables

Add the following to your `.env.local`:

```env
# Resend Email (required)
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=Stager <noreply@yourdomain.com>
RESEND_REPLY_TO=support@yourdomain.com

# Resend Webhook Secret (optional but recommended for tracking)
RESEND_WEBHOOK_SECRET=whsec_xxxxx

# QStash for background jobs (optional but recommended)
QSTASH_TOKEN=your-qstash-token
QSTASH_CURRENT_SIGNING_KEY=sig_xxxxx
QSTASH_NEXT_SIGNING_KEY=sig_xxxxx
```

## 3. Configure Resend Webhooks

In the [Resend Dashboard](https://resend.com/webhooks):

1. Click "Add Webhook"
2. Set the endpoint URL: `https://yourdomain.com/api/email/webhooks/resend`
3. Select events to track:
   - `email.sent`
   - `email.delivered`
   - `email.opened`
   - `email.clicked`
   - `email.bounced`
   - `email.complained`
4. Copy the signing secret to `RESEND_WEBHOOK_SECRET`

## 4. Initialize Scheduled Jobs

If using QStash, initialize the scheduled jobs by calling:

```typescript
import { initializeScheduledJobs } from "@/lib/jobs/queue";

// Call this once during deployment or app startup
await initializeScheduledJobs();
```

This sets up:
- Campaign email processing (hourly)
- Weekly digest (Mondays at 9 AM UTC)
- Re-engagement checks (daily at 10 AM UTC)

## Features

### Onboarding Campaign
New users are automatically enrolled in a 4-step onboarding drip:
1. **Day 0**: Welcome email
2. **Day 1**: First staging guide
3. **Day 3**: Pro tips
4. **Day 7**: Check-in

Users exit early if they complete their first staging.

### Transactional Emails
The system supports sending:
- Staging complete/failed notifications
- Credit low warnings
- Payment success/failed
- Team invitations
- Subscription cancellation

### Weekly Digest
Users with `weekly_digest` enabled receive a summary including:
- Stagings completed this week vs last week
- Credits remaining
- Recent staging thumbnails
- New features

### Re-engagement Campaigns
Inactive users automatically receive:
- 7 days inactive: "We miss you" email
- 14 days inactive: "New features" email
- 30 days inactive: "Special offer" email

### Email Preferences
Users can manage their preferences at `/settings?tab=notifications`:
- Marketing emails
- Product updates
- Weekly digest
- Staging notifications
- Team notifications

### One-Click Unsubscribe
All emails include unsubscribe links that:
- Use signed tokens for security
- Support category-specific unsubscribe
- Show confirmation page

## Development

### Preview Templates
Start the email preview server:

```bash
npm run email:dev
```

This opens a browser at `http://localhost:3001` where you can preview all templates.

### Testing Emails
Send a test email via the API (admin only):

```bash
curl -X POST http://localhost:3000/api/email/send \
  -H "Content-Type: application/json" \
  -d '{"template": "welcome", "to": "test@example.com"}'
```

## File Structure

```
src/lib/email/
├── client.ts              # Resend client configuration
├── sender.ts              # Email sending with tracking
├── transactional.ts       # Helper functions for transactional emails
├── index.ts               # Main exports
├── preferences/
│   └── index.ts           # Preference management
├── campaigns/
│   ├── index.ts           # Campaign registry & enrollment
│   ├── onboarding.ts      # Onboarding drip definition
│   ├── reengagement.ts    # Re-engagement campaigns
│   └── digest.ts          # Weekly digest logic
└── templates/
    ├── components/        # Reusable email components
    ├── onboarding/        # Onboarding templates (4)
    ├── transactional/     # Transactional templates (8)
    ├── reengagement/      # Re-engagement templates (3)
    └── digest/            # Weekly digest template

src/app/api/email/
├── preferences/route.ts   # GET/PATCH user preferences
├── unsubscribe/route.ts   # One-click unsubscribe
└── webhooks/resend/route.ts # Delivery tracking
```

## Troubleshooting

### Emails not sending
1. Check `RESEND_API_KEY` is set
2. Verify the from email domain is verified in Resend
3. Check the email_sends table for errors

### Campaign emails not processing
1. Verify QStash is configured
2. Check campaign_enrollments table for active enrollments
3. Run manual processing: `await processCampaignStep(supabase, enrollmentId)`

### Webhooks not working
1. Verify webhook URL is publicly accessible
2. Check RESEND_WEBHOOK_SECRET matches Resend dashboard
3. Look for errors in server logs
