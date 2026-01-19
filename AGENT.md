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

## AI Staging (Gemini Integration)

### Model Configuration
- **Model**: `gemini-2.0-flash-exp` (not 2.5 - the experimental model supports image generation)
- **Key setting**: `responseModalities: ["image", "text"]` enables image output
- Located in `/src/lib/gemini.ts`

### Prompt Engineering
The staging prompt was refined to be **inpainting-focused**:
- Emphasizes "LOCAL IMAGE EDIT using INPAINTING ONLY"
- Explicitly states what CANNOT change (camera, walls, floors, etc.)
- Includes room-specific furniture lists via `getRoomSpecificItems()`
- Has explicit failure conditions to guide the model
- Reference prompt stored in `/prompt-structure.txt`

### Rate Limits
- Sequential processing is used for batch staging to avoid Gemini rate limits
- Error handling includes specific messaging for 429 errors

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
| `StyleSelector.tsx` | Single style selection (legacy) |
| `MultiStyleSelector.tsx` | Multi-style selection (up to 3) |
| `StyleGallery.tsx` | Visual style grid with thumbnail images |
| `PropertySelector.tsx` | Property dropdown with inline create |
| `RoomTypeSelector.tsx` | Room type button grid (legacy) |
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

## Session Continuity Tips

1. Read `CLAUDE.md` for project overview and conventions
2. Read `process-and-development.md` for feature status
3. Read this file (`AGENT.md`) for implementation tips
4. Check git log for recent changes: `git log --oneline -10`
5. The `/prompt-structure.txt` file contains the reference AI prompt
