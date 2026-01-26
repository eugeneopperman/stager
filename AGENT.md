# Agent Notes - Stager Development

This document contains lessons learned and helpful context for AI agents working on this project.

## Deployment Notes

### Vercel Auto-Deploy Issues
When pushing to GitHub, Vercel auto-deploy sometimes doesn't reflect changes immediately. If the user reports changes aren't showing:

1. **First try**: Ask user to hard refresh (Cmd+Shift+R or Ctrl+Shift+R)
2. **If still not working**: Force a production deploy:
   ```bash
   npx vercel --prod --yes
   ```
3. This bypasses the auto-deploy queue and ensures immediate deployment

### Production URL
- **Live site**: https://stager-tau.vercel.app
- **GitHub**: https://github.com/eugeneopperman/stager.git

---

## AI Staging (Multi-Provider Architecture)

### Provider System
The app uses a multi-provider architecture with automatic failover:

| Provider | Role | Cost | Mode |
|----------|------|------|------|
| **Decor8 AI** | Default | ~$0.20/image | Sync |
| **Gemini** | Fallback | API-based | Sync |
| **Replicate** | Async option | Variable | Async |

**Key files:**
- `/src/lib/providers/index.ts` - Provider router and selection logic
- `/src/lib/providers/decor8-provider.ts` - Decor8 AI integration
- `/src/lib/providers/gemini-provider.ts` - Gemini fallback
- `/src/lib/providers/replicate-provider.ts` - Async processing

### Provider Selection
```typescript
// Default provider from env var, falls back to Decor8
const defaultProvider = process.env.AI_DEFAULT_PROVIDER || "decor8";
```

The `ProviderRouter` class handles:
- Health checks with 1-minute cache
- Automatic fallback when primary is unavailable/rate-limited
- Provider selection based on availability

### Decor8 AI Features
- **Virtual staging**: `generate_designs_for_room` endpoint
- **Declutter**: `remove_objects_from_room` endpoint (removes furniture first)
- **Declutter + Stage pipeline**: For already-furnished rooms
- Room type and design style mapping to Decor8's API values
- Custom prompts with negative prompts to preserve windows/structure

### Gemini (Fallback)
- Model: `gemini-2.0-flash-exp` with `responseModalities: ["image", "text"]`
- Inpainting-focused prompt emphasizing structure preservation
- Reference prompt in `/prompt-structure.txt`

### Rate Limits
- Sequential processing for batch staging to avoid rate limits
- Error handling includes specific messaging for 429 errors
- Health cache prevents excessive API calls during outages

### Original Image Storage
- Original images are uploaded to Supabase Storage alongside staged images
- File naming: `{user_id}/{job_id}-original.{ext}` and `{user_id}/{job_id}-staged.{ext}`
- This enables the before/after comparison slider feature
- **Note**: Old staging jobs (before v0.9.5) have truncated original URLs and won't support comparison

---

## Key Architecture Patterns

### State Machine for Multi-Step Workflows
Batch staging uses a state machine pattern:
```typescript
type BatchState = "upload" | "configure" | "processing" | "complete";
```
This pattern works well for complex workflows with distinct phases.

### Debounced Search
Global search uses a 300ms debounce to reduce API calls:
```typescript
debounceRef.current = setTimeout(() => {
  performSearch(query);
}, 300);
```

### Click Outside to Close
For dropdowns/modals, use this pattern:
```typescript
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (ref.current && !ref.current.contains(event.target as Node)) {
      setOpen(false);
    }
  };
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);
```

---

## Component Locations

### Staging Components (`/src/components/staging/`)
| Component | Purpose |
|-----------|---------|
| `ImageUploader.tsx` | Single image upload with drag-drop |
| `BatchImageUploader.tsx` | Multi-image upload (up to 10) |
| `BatchImageCard.tsx` | Per-image config card with room type dropdown |
| `StyleSelector.tsx` | Single style selection |
| `StyleGallery.tsx` | Visual style grid with thumbnail images |
| `PropertySelector.tsx` | Property dropdown with inline create |
| `RoomTypeDropdown.tsx` | Compact room type dropdown with icons |
| `CreditDisplay.tsx` | Inline credit usage progress bar |
| `QuickStageLayout.tsx` | Original two-panel layout for Quick mode |

### Wizard Components (`/src/components/staging/wizard/`)
| Component | Purpose |
|-----------|---------|
| `StagingWizard.tsx` | Main wizard container with state management |
| `WizardStepIndicator.tsx` | Visual 4-step progress bar with icons |
| `WizardNavigation.tsx` | Reusable Back/Next/Skip navigation buttons |
| `UploadStep.tsx` | Step 1: Full-width upload with speed messaging |
| `PrepareStep.tsx` | Step 2: Preprocessing tools with skip option |
| `StyleStep.tsx` | Step 3: Room type and style selection |
| `GenerateStep.tsx` | Step 4: Summary and generate button |

### Remix & Version Components (`/src/components/staging/`)
| Component | Purpose |
|-----------|---------|
| `RemixDialog.tsx` | Modal for configuring remix options (room type, style) |
| `RemixButton.tsx` | Reusable remix action with icon/button/menuItem variants |
| `VersionThumbnailStrip.tsx` | Horizontal scrollable strip of version thumbnails |
| `VersionBadge.tsx` | Compact badge showing version count (Layers icon + number) |

### Property Detail Components (`/src/app/(dashboard)/properties/[id]/`)
| Component | Purpose |
|-----------|---------|
| `StagedImageCard.tsx` | Staged image with before/after comparison slider |
| `PropertyActions.tsx` | Edit/delete dropdown for property |

### History Components (`/src/app/(dashboard)/history/`)
| Component | Purpose |
|-----------|---------|
| `HistoryPageClient.tsx` | Client wrapper with clickable stats cards and grid/list view |
| `HistoryJobCard.tsx` | Staging job card with delete, comparison, property assignment |
| `HistoryListItem.tsx` | List view row for staging jobs |

### Layout Components (`/src/components/layout/`)
| Component | Purpose |
|-----------|---------|
| `FloatingControls.tsx` | Floating search icon + notification dropdown, expandable animated search bar |
| `NotificationDropdown.tsx` | Bell icon with unread badge, popover dropdown for notifications |
| `Sidebar.tsx` | Collapsible navigation sidebar with tooltips, credit display, user avatar dropdown |

### Settings Components (`/src/app/(dashboard)/settings/`)
| Component | Purpose |
|-----------|---------|
| `ThemeSelector.tsx` | Light/dark/system theme picker |
| `SidebarSettings.tsx` | Sidebar mode: always visible vs auto-hide |
| `ProfileForm.tsx` | User name and company form |
| `PasswordSection.tsx` | Password change section |
| `DangerZone.tsx` | Account deletion |

### Provider Components (`/src/components/providers/`)
| Component | Purpose |
|-----------|---------|
| `ThemeProvider.tsx` | next-themes wrapper for app-wide theme support |

---

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/staging` | POST | Process single staging job |
| `/api/staging/[jobId]/remix` | POST | Create a remix of existing job |
| `/api/staging/[jobId]/primary` | PUT | Set a version as primary |
| `/api/staging/versions` | GET | Fetch all versions for a job |
| `/api/search` | GET | Global search (properties + staging jobs) |
| `/api/properties/[id]/download` | GET | Download all property images as ZIP |
| `/api/account/delete` | DELETE | Delete user account |
| `/api/auth/callback` | GET | Supabase auth callback |

---

## Database Relationships

```
profiles (1) ←→ (many) properties
profiles (1) ←→ (many) staging_jobs
properties (1) ←→ (many) staging_jobs
```

### Key Queries
- Get properties with staging counts: Join `properties` with `staging_jobs` count
- Search uses `ilike` for case-insensitive partial matching

---

## User Preferences Learned

1. **No payments yet** - User wants to defer Stripe integration
2. **Batch staging** - Per-image room types, single style for all
3. **Property organization** - Important for real estate workflow
4. **MLS-ready output** - Staging should look professional and market-friendly

---

## Common Tasks

### Adding a New Page
1. Create file in `/src/app/(dashboard)/your-page/page.tsx`
2. Add navigation link in `/src/components/layout/Sidebar.tsx`
3. Page automatically inherits auth protection from layout

### Adding a New API Endpoint
1. Create `/src/app/api/your-endpoint/route.ts`
2. Always check auth: `const { data: { user } } = await supabase.auth.getUser()`
3. Return `NextResponse.json()` for responses

### Adding a New Component
1. Create in appropriate folder under `/src/components/`
2. Use `"use client"` directive if needs interactivity
3. Follow existing patterns for props interfaces

---

## Testing Workflow

After making changes:
1. Run `npm run build` to verify no TypeScript/build errors
2. Test locally with `npm run dev` if needed
3. Commit and push to GitHub
4. If changes don't appear on production, run `npx vercel --prod --yes`

---

## UI & Theme Patterns

### Theme Toggle (next-themes)
The app uses `next-themes` for dark/light/system theme support:
- **ThemeProvider**: Wraps the app in `/src/app/layout.tsx`
- **ThemeSelector**: UI component in settings with light/dark/system options
- Pattern: Use `useTheme()` hook, check `mounted` state before rendering to prevent hydration mismatch

```tsx
const { theme, setTheme } = useTheme();
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

if (!mounted) return <Skeleton />; // Prevent hydration mismatch
```

### Collapsible Sidebar (SidebarContext)
The sidebar has two modes controlled by `SidebarContext`:
- **Normal mode**: Sidebar always visible, can toggle between expanded (256px) and collapsed (64px)
- **Auto-hide mode**: Sidebar slides off-canvas, appears on left-edge hover

**Key implementation details:**
1. **State management**: `/src/contexts/SidebarContext.tsx` with localStorage persistence
2. **Hover detection**: Invisible 16px trigger zone at left edge when auto-hide enabled
3. **Delayed hide**: 300ms delay before hiding to prevent flicker
4. **Keyboard shortcut**: `[` key toggles collapsed state (excludes inputs/textareas)

**localStorage keys:**
- `stager-sidebar-collapsed`: boolean
- `stager-sidebar-autohide`: boolean

### Sidebar User Avatar
The sidebar footer contains a user avatar with dropdown menu (replaces old sign out button):

**Expanded state:**
```tsx
<DropdownMenu>
  <DropdownMenuTrigger>
    <div className="flex items-center gap-3">
      <Avatar />
      <div className="flex flex-col">
        <span>{name}</span>
        <span className="text-xs">{email}</span>
      </div>
    </div>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Settings</DropdownMenuItem>
    <DropdownMenuItem>Billing</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem>Sign out</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

**Collapsed state:** Avatar only with tooltip, same dropdown menu

### Tooltip Pattern for Collapsed UI
When UI elements collapse to icons, use tooltips:
```tsx
{isCollapsed ? (
  <Tooltip>
    <TooltipTrigger asChild>{navLink}</TooltipTrigger>
    <TooltipContent side="right">{item.name}</TooltipContent>
  </Tooltip>
) : (
  navLink
)}
```

---

## Glassmorphism UI Pattern

The app uses a premium glassmorphic design with:
- **Glass cards**: `bg-card/40 backdrop-blur-xl border-black/[0.08]` (light) / `border-white/[0.12]` (dark)
- **Subtle shadows**: `shadow-xl shadow-black/5`
- **Gradient overlays**: `bg-gradient-to-br from-white/5 via-transparent to-black/5`
- **Hover states**: `hover:scale-[1.02]` with smooth transitions
- **Mesh gradient background**: More prominent gradient for visual depth

CSS variables are defined in `/src/app/globals.css` using OKLch color space for better color interpolation.

### Typography
- **Headings**: Outfit font (Google Fonts) - bold, impactful
- **Body**: Lato font (Google Fonts) - clean, readable
- Font variables defined in `layout.tsx`, applied via CSS custom properties in `globals.css`

---

## Floating Controls Pattern

The app uses floating controls instead of a traditional header bar:

**Location:** `/src/components/layout/FloatingControls.tsx`

**Features:**
- Fixed position top-right corner (`fixed top-4 right-6 z-50`)
- Search icon expands to full search bar on click (300ms animation)
- Notification bell with indicator dot
- Click outside or ESC key collapses search

**Animation pattern:**
```tsx
<div className={cn(
  "transition-all duration-300 ease-out",
  isSearchOpen ? "w-80 pl-4 pr-2" : "w-10"
)}>
  {/* Search content */}
</div>
```

**Key behaviors:**
- Search input auto-focuses on expand
- Debounced search API calls (300ms)
- Results dropdown appears below expanded search bar
- Collapse on click outside, ESC key, or result selection

---

## Stage Page Wizard Flow

The Stage Photo page (`/stage`) has two modes: **Guided** (wizard) and **Quick** (two-panel).

### Mode Toggle Pattern
Users can switch between modes via a toggle in the page header. The preference is stored in localStorage:

```typescript
const STORAGE_KEY = "stager-staging-mode";

// Load on mount
useEffect(() => {
  const stored = localStorage.getItem(STORAGE_KEY) as "guided" | "quick" | null;
  if (stored) setMode(stored);
}, []);

// Save on change
const handleModeChange = (newMode: "guided" | "quick") => {
  setMode(newMode);
  localStorage.setItem(STORAGE_KEY, newMode);
};
```

### Wizard State Machine
The guided mode uses a state machine pattern for the 4-step flow:

```typescript
type WizardStep = "upload" | "prepare" | "style" | "generate" | "processing" | "complete";
```

**Step transitions:**
- Upload → Prepare (auto-advance on image select)
- Prepare → Style (Continue or Skip button)
- Style → Generate (Continue button, requires room type + style)
- Generate → Processing (Generate button click)
- Processing → Complete (all variations done)

### Wizard Components Architecture
- `StagingWizard.tsx` - Main container with all state and processing logic
- Step components receive props and callbacks, no internal state for wizard flow
- `WizardStepIndicator` is purely presentational, receives current step
- `WizardNavigation` is reusable across steps with configurable buttons

---

## Stage Page Two-Panel Layout (Quick Mode)

The Quick mode uses a two-panel layout for power users:

**Layout Structure:**
```
┌─────────────────────────────────────────────────────────────┐
│  Header: "Stage a Photo"                    [Batch Mode]    │
├────────────────────────────┬────────────────────────────────┤
│                            │  Room Type Dropdown            │
│   IMAGE PREVIEW            │  Style Gallery (3x3 grid)      │
│   (drag & drop)            │  Property Selector (optional)  │
│                            │  Credit Display                │
│                            │  [Generate Button]             │
└────────────────────────────┴────────────────────────────────┘
```

**Key Components:**
- `RoomTypeDropdown`: Compact select with room icons
- `StyleGallery`: 3-column image grid with visual thumbnails
- `CreditDisplay`: Progress bar showing credit usage
- `PropertySelector`: Optional property assignment with inline create

**Style Images:**
- Located in `/public/styles/` as SVG placeholders
- Can be replaced with real photography/AI-generated images
- Referenced in `FURNITURE_STYLES` constant via `image` property

---

## Dashboard Layout & Container Patterns

### Centralized Container Width (max-w-7xl)

All dashboard pages use a centralized container in `DashboardShell.tsx`:

```tsx
<main className="flex-1 overflow-y-auto px-6 pt-24 pb-6 scroll-smooth">
  <div className="max-w-7xl mx-auto w-full">
    {children}
  </div>
</main>
```

**Key points:**
- All pages inherit `max-w-7xl` (1280px) centered layout
- Pages with narrower content (Settings: `max-w-3xl`, Billing: `max-w-4xl`) add their own constraint with `mx-auto`
- Top padding `pt-24` (~100px) provides space for floating controls
- No header bar - floating controls overlay content area

### Sidebar Spacing (Important Bug Fix)

**Problem encountered:** Double sidebar offset caused by both the sidebar container AND a spacer div taking up width.

**Solution:** The sidebar container (`w-64` or `w-16`) already reserves space in the flex layout. Do NOT add a separate spacer div - this causes double the intended offset.

```tsx
// CORRECT - Sidebar container handles spacing
<div className={cn("hidden lg:block shrink-0", sidebarWidth)}>
  <Sidebar />
</div>

// WRONG - Don't add extra spacer
{/* <div className={sidebarWidth} /> */}
```

---

## PRD Workflow

When planning major feature changes:
1. Create PRD document in `/docs/PRD-[Feature-Name].md`
2. Include current state analysis, proposed solutions with options
3. Ask user to select preferred options
4. Update PRD with "SELECTED" markers on chosen options
5. Implement based on approved plan

Example: `docs/PRD-Stage-Photo-Redesign.md`

---

## Notification System

### Architecture
The app has a persistent notification system stored in the database:

**Database Table:** `notifications`
- `id`, `user_id`, `type`, `title`, `message`, `link`, `is_read`, `created_at`
- Types: `staging_complete`, `staging_failed`, `low_credits`
- RLS policies: users can only see/update/delete their own notifications

**Helper Functions:** `/src/lib/notifications.ts`
- `createNotification()` - Create a new notification
- `getNotifications()` - Fetch user's notifications (most recent first)
- `getUnreadCount()` - Count of unread notifications
- `markAsRead()` - Mark single notification as read
- `markAllAsRead()` - Mark all as read
- `formatRelativeTime()` - "2 minutes ago" formatting

**Triggers:**
1. **Staging Complete** - Created in `/api/staging/route.ts` (sync) and `/api/webhooks/replicate/route.ts` (async)
2. **Staging Failed** - Same locations as above
3. **Low Credits** - When credits drop to 3 or below after staging

**UI Component:** `NotificationDropdown.tsx`
- Polls for unread count every 30 seconds
- Fetches full notification list when dropdown opens
- Click notification → marks as read + navigates to link
- Glass effect styling consistent with app design

---

## Debugging Tips

### DropdownMenuLabel Uppercase Issue
The shadcn/ui `DropdownMenuLabel` component has `uppercase` in its default className. To display text in normal case, add `className="normal-case"`:

```tsx
<DropdownMenuLabel className="normal-case">
  <p>{userName}</p>
</DropdownMenuLabel>
```

### Clickable Stats Cards as Filters
Pattern for making stats cards act as toggle filters (used on History page):

```tsx
const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "processing">("all");

const handleCardClick = (filter: string) => {
  // Toggle off if already selected
  setStatusFilter(statusFilter === filter ? "all" : filter);
};

<Card
  onClick={() => handleCardClick("completed")}
  className={cn(
    "cursor-pointer",
    statusFilter === "completed" && "ring-2 ring-emerald-500 ring-offset-2"
  )}
>
```

---

## Version Management

The app version is displayed in the UI and stored in `/src/lib/version.ts`:

```typescript
export const APP_VERSION = "1.096";
```

**Important:** When deploying new features, remember to update this version number. It's easy to forget since it's a separate file from the main changes.

---

## Step Indicator Centering Pattern

When building step indicators with connector lines, avoid `flex-1` on the last step to prevent extra space:

```tsx
// BAD - creates empty space after last step
<div className="flex items-center flex-1">
  {/* step content */}
  {!isLastStep && <div className="flex-1">{/* connector */}</div>}
</div>

// GOOD - last step doesn't expand
<div className={cn("flex items-center", !isLastStep && "flex-1")}>
  {/* step content */}
  {!isLastStep && <div className="flex-1">{/* connector */}</div>}
</div>
```

---

## Image Remix & Version Control System

### Overview
The app supports "remixing" staged photos - regenerating with different settings while tracking all versions linked to the same original image.

### Database Schema
**New table: `version_groups`**
- Tracks unique original images by hash
- Stores `free_remixes_used` (2 free per image, then 1 credit each)
- User-scoped with RLS policies

**New columns on `staging_jobs`:**
- `version_group_id` - Links to version_groups table
- `is_primary_version` - Boolean, used for display/downloads
- `parent_job_id` - References the job that was remixed

### API Endpoints
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/staging/[jobId]/remix` | POST | Create a remix of existing job |
| `/api/staging/versions` | GET | Fetch all versions for a job |
| `/api/staging/[jobId]/primary` | PUT | Set a version as primary |

### Version Display Pattern
Uses **progressive disclosure**:
1. **Grid view**: Stacked card effect + compact VersionBadge (count indicator)
2. **Dialog view**: Full VersionThumbnailStrip for navigation

**Stacked card CSS pattern** (pseudo-elements):
```tsx
<div className={cn(
  "relative",
  hasVersions && [
    "before:absolute before:inset-0 before:translate-x-1 before:translate-y-1",
    "before:rounded-2xl before:bg-card before:border before:border-border/50",
    "before:-z-10 before:opacity-60",
  ],
  hasVersions && versions.length > 2 && [
    "after:absolute after:inset-0 after:translate-x-2 after:translate-y-2",
    "after:rounded-2xl after:bg-card after:border after:border-border/30",
    "after:-z-20 after:opacity-30",
  ]
)}>
```

### Server-side Version Grouping
On property detail pages, filter to show only one job per version group:
```typescript
// Group by version_group_id
const groupedByVersion = new Map<string, typeof completedJobs>();
for (const job of completedJobs) {
  if (job.version_group_id) {
    const existing = groupedByVersion.get(job.version_group_id) || [];
    existing.push(job);
    groupedByVersion.set(job.version_group_id, existing);
  }
}
// Select primary (or first) from each group
```

---

## Team Invitations System

### Architecture
Email-based team invitations using Resend for Enterprise organizations.

**Database Table:** `team_invitations`
- `id`, `organization_id`, `email`, `invitation_token`, `initial_credits`, `invited_by`, `status`, `expires_at`, `accepted_at`
- Status values: `pending`, `accepted`, `expired`, `revoked`
- 7-day expiration by default

**Email Service:** Resend
- Requires `RESEND_API_KEY` environment variable
- Requires `RESEND_FROM_EMAIL` with verified domain for production
- Test mode only allows sending to account owner's email

**API Endpoints:**
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/team/invite` | POST | Create invitation & send email |
| `/api/team/invitations` | GET | List pending invitations |
| `/api/team/invitations/[id]` | DELETE | Revoke invitation |
| `/api/team/invitations/[id]/resend` | POST | Resend with new token/expiry |
| `/api/team/invite/accept` | GET/POST | Validate/accept invitation |

**Components:**
- `InviteMemberDialog.tsx` - Updated for email-based invitations with success state
- `PendingInvitationsList.tsx` - Shows pending invitations with resend/revoke actions

### Resend Domain Verification
For production email sending:
1. Go to https://resend.com/domains
2. Add your domain
3. Add DNS records (MX, TXT, CNAME)
4. Update `RESEND_FROM_EMAIL` to use verified domain

---

## Debugging Tips

### Lazy Initialization for External APIs
When using external APIs (like Resend), lazy-initialize clients to avoid build-time errors:

```typescript
// BAD - fails at build time if env var not set
const resend = new Resend(process.env.RESEND_API_KEY);

// GOOD - only initializes when called
let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY not set");
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}
```

### Suspense Boundary for useSearchParams
Next.js requires Suspense boundaries when using `useSearchParams()` in pages that can be statically rendered:

```tsx
function PageContent() {
  const searchParams = useSearchParams();
  // ... component logic
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <PageContent />
    </Suspense>
  );
}
```

### Supabase Join Results as Arrays
When using Supabase joins, the related data may come as an array instead of a single object:

```typescript
// Handle both cases
const orgData = invitation.organization;
const org = Array.isArray(orgData) ? orgData[0] : orgData;
```

---

## Service Architecture

### Staging Services (`/src/lib/staging/`)
Modular services for staging operations, extracted for testability:

| Service | Purpose |
|---------|---------|
| `job.service.ts` | Job CRUD (createStagingJob, getStagingJob, updateJobStatus, etc.) |
| `storage.service.ts` | Image upload/download (uploadOriginalImage, uploadStagedImage, downloadAndUploadImage) |
| `processor.service.ts` | Provider orchestration (selectProvider, processSyncStaging, processAsyncStaging) |
| `notifications.service.ts` | Staging notifications (notifyStagingComplete, notifyStagingFailed, notifyLowCredits) |

### Team Services (`/src/lib/team/`)
Modular services for team management:

| Service | Purpose |
|---------|---------|
| `organization.service.ts` | Org queries (getOwnedOrganization, getUserPlanLimits, getPendingInvitationsCount) |
| `validation.service.ts` | Capacity/credit checks (validateTeamCapacity, validateCreditAllocation) |
| `invitation.service.ts` | Invitation CRUD (createInvitation, sendInvitationEmail, deleteInvitation) |

---

## API Testing Patterns

### Mock Setup Pattern
For API route tests, use this Supabase mock pattern:

```typescript
const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockStorage = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      from: mockFrom,
      storage: { from: mockStorage },
    })
  ),
}));
```

### Rate Limiter Mock Pattern
Reset rate limiter mocks in beforeEach to prevent state leakage:

```typescript
const mockStagingRateLimiter = vi.fn();
vi.mock("@/lib/rate-limit", () => ({
  rateLimiters: {
    staging: (id: string) => mockStagingRateLimiter(id),
  },
}));

beforeEach(() => {
  mockStagingRateLimiter.mockReturnValue({
    allowed: true,
    remaining: 19,
    resetTime: Date.now() + 60000,
    limit: 20,
  });
});
```

### Chained Mock Pattern
For Supabase queries with multiple `.eq()` calls:

```typescript
// For .update().eq().eq() chains
const mockSecondEq = vi.fn().mockResolvedValue({ error: null });
const mockFirstEq = vi.fn(() => ({ eq: mockSecondEq }));
const mockUpdate = vi.fn(() => ({ eq: mockFirstEq }));
```

---

## Infrastructure Services

### Audit Logging (`/src/lib/audit/`)
Comprehensive audit trail for security-sensitive operations:

| File | Purpose |
|------|---------|
| `audit-log.service.ts` | Event types, createAuditLog, logTeamEvent, logBillingEvent, logAccountEvent |

**Database:** `supabase/migrations/010_audit_logs.sql`
- Immutable log entries with RLS policies
- 365-day default retention
- Indexed for user, org, event_type, request_id queries

**Logged Events:**
- Team: invitation created/accepted/revoked/resent, member removed, credits allocated
- Billing: checkout created, subscription events
- Account: deleted, password changed, profile updated
- Staging: job created, credits deducted

### Webhook Validation (`/src/lib/webhooks/`)
| File | Purpose |
|------|---------|
| `validation.ts` | validateReplicateWebhook (HMAC-SHA256), validateStripeWebhook |

**Pattern:** Timestamp + signature validation to prevent replay attacks.

### Request Tracing (`/src/lib/api/`)
| File | Purpose |
|------|---------|
| `request-id.ts` | getRequestId, withRequestId - X-Request-ID header utilities |

### Billing Services (`/src/lib/billing/`)
| File | Purpose |
|------|---------|
| `credits.service.ts` | Centralized deductCredits with pre-check and atomic updates |
| `stripe.ts` | Stripe client, checkout session creation |
| `subscription.ts` | Subscription CRUD operations |

---

## Query Optimization Patterns

### Join Queries
Instead of multiple sequential queries, use Supabase joins:

```typescript
// BAD - 2 queries
const { data: property } = await supabase.from("properties").select("*").eq("id", id);
const { data: jobs } = await supabase.from("staging_jobs").select("*").eq("property_id", id);

// GOOD - 1 query with join
const { data: property } = await supabase
  .from("properties")
  .select("*, staging_jobs(*)")
  .eq("id", id)
  .single();
```

### Consolidated Updates
Batch multiple updates to the same table:

```typescript
// BAD - 3 queries
await supabase.from("profiles").update({ plan_id }).eq("id", userId);
await supabase.from("profiles").update({ credits_remaining }).eq("id", userId);
await supabase.from("profiles").update({ credits_reset_at }).eq("id", userId);

// GOOD - 1 query
await supabase.from("profiles").update({
  plan_id,
  credits_remaining,
  credits_reset_at: new Date().toISOString(),
}).eq("id", userId);
```

### Parallel Independent Operations
Use Promise.all for independent writes:

```typescript
await Promise.all([
  supabase.from("organization_members").insert({ ... }),
  supabase.from("subscriptions").update({ ... }).eq("user_id", userId),
  supabase.from("profiles").update({ ... }).eq("id", userId),
]);
```

---

## Email Automation System

### Architecture
Email automation uses React Email for template rendering and Resend for delivery.

**Key Files:**
- `/src/lib/email/client.ts` - Resend client, EMAIL_CONFIG constants
- `/src/lib/email/sender.ts` - Email sending with tracking
- `/src/lib/email/preferences/` - User email preferences
- `/src/lib/email/campaigns/` - Drip campaigns, digest logic
- `/src/lib/email/templates/` - React Email components

### Design System (`/src/lib/email/templates/components/`)
| File | Purpose |
|------|---------|
| `styles.ts` | Color palette, typography, spacing, shadows |
| `Layout.tsx` | Base email layout with soft blue-gray background |
| `Header.tsx` | White card with centered logo |
| `Footer.tsx` | Social icons, unsubscribe links |
| `Button.tsx` | Blue accent with arrow icons |
| `Card.tsx` | White cards with shadows, variants (success, warning, feature) |
| `GradientAccent.tsx` | Pink-to-blue gradient accent bar |
| `ThumbnailGrid.tsx` | Image grid for staged photos |

### Color Palette
- **Background**: `#f0f4f8` (soft blue-gray)
- **Primary**: `#2563eb` (bright blue)
- **Text**: `#1e293b` (primary), `#64748b` (secondary), `#94a3b8` (muted)
- **Accent**: `#fce7f3` (soft pink), `#dbeafe` (soft blue)

### Preview Server
```bash
npm run email:dev  # Opens on localhost:3001 (or next available port)
```

### Test Endpoint
```bash
# Send test email
curl -X POST http://localhost:3000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"template": "welcome", "to": "your@email.com"}'
```

---

## Hydration Timing Pattern

When using `useSearchParams()` in Next.js App Router, the params may not be available during SSR/static generation. Use a mounted state to wait for client-side hydration:

```typescript
const [isMounted, setIsMounted] = useState(false);

useEffect(() => {
  setIsMounted(true);
}, []);

useEffect(() => {
  if (!isMounted) return;
  // Now safe to check searchParams
  const token = searchParams.get("token");
  // ...
}, [isMounted, searchParams]);
```

This prevents false negatives when checking for query parameters on initial render.

---

## Database Trigger Robustness

When creating database triggers that run on user signup (e.g., `handle_new_user`), make them robust with exception handling:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN new;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    -- Fallback logic or re-raise
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

This prevents signup failures from cryptic "Database error saving new user" messages.

---

## Interactive Product Tour (Driver.js)

### Architecture
The app uses Driver.js for an interactive onboarding tour that highlights UI elements:

**Key Files:**
- `/src/components/onboarding/ProductTour.tsx` - Main tour component + `startTour()` helper
- `/src/components/onboarding/tour-config.ts` - Step definitions and Driver.js config
- `/src/components/onboarding/tour-styles.css` - Glassmorphic styling for popovers

### data-tour Attributes Pattern
Elements highlighted in the tour use `data-tour` attributes for targeting:

```tsx
// Add to any element you want to highlight
<Button data-tour="notifications" ... />
<Link data-tour="stage-photo" ... />
```

**Current tour targets:**
- `stage-photo` - Stage Photo nav item
- `batch-stage` - Batch Stage nav item
- `properties` - Properties nav item
- `history` - History nav item
- `credits` - Credits display in sidebar
- `search` - Search bar
- `notifications` - Notification bell

### Mobile Handling
The tour detects screen width and filters steps on mobile (< 1024px) to only show search and notifications (since sidebar is hidden).

### Dynamic Content
The credits step uses a placeholder `{credits}` that gets replaced with the actual value:
```typescript
description: step.popover?.description?.replace("{credits}", String(credits))
```

### Starting the Tour
- **Auto-start**: Set `autoStart={true}` on `<ProductTour />` (used for new users)
- **Manual start**: Call `startTour(credits)` from anywhere (used in Settings)

### Database Persistence
Tour completion is stored in `profiles.onboarding_completed_at`. The tour only auto-starts when this field is NULL.

---

## Session Continuity Tips

1. Read `CLAUDE.md` for project overview and conventions
2. Read `process-and-development.md` for feature status
3. Read this file (`AGENT.md`) for implementation tips
4. Check git log for recent changes: `git log --oneline -10`
5. The `/prompt-structure.txt` file contains the reference AI prompt
