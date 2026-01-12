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

### Property Detail Components (`/src/app/(dashboard)/properties/[id]/`)
| Component | Purpose |
|-----------|---------|
| `StagedImageCard.tsx` | Staged image with before/after comparison slider |
| `PropertyActions.tsx` | Edit/delete dropdown for property |

### History Components (`/src/app/(dashboard)/history/`)
| Component | Purpose |
|-----------|---------|
| `HistoryJobCard.tsx` | Staging job card with delete, comparison, property assignment |

### Layout Components (`/src/components/layout/`)
| Component | Purpose |
|-----------|---------|
| `Header.tsx` | Top bar with global search, notifications, user menu |
| `Sidebar.tsx` | Collapsible navigation sidebar with tooltips, credit display |

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
- **Glass cards**: `bg-card/80 backdrop-blur-xl border-white/[0.08]`
- **Subtle shadows**: `shadow-xl shadow-black/5`
- **Gradient overlays**: `bg-gradient-to-br from-white/5 via-transparent to-black/5`
- **Hover states**: `hover:scale-[1.02]` with smooth transitions

CSS variables are defined in `/src/app/globals.css` using OKLch color space for better color interpolation.

---

## Stage Page Two-Panel Layout

The Stage Photo page (`/stage`) uses a two-panel layout for better UX:

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
<main className="flex-1 overflow-y-auto p-6 scroll-smooth">
  <div className="max-w-7xl mx-auto w-full">
    {children}
  </div>
</main>
```

**Key points:**
- All pages inherit `max-w-7xl` (1280px) centered layout
- Pages with narrower content (Settings: `max-w-3xl`, Billing: `max-w-4xl`) add their own constraint with `mx-auto`
- Header content also uses `max-w-7xl mx-auto` to align with page content

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

### Header Alignment Pattern

To align header content with main page content:

```tsx
<header className="sticky top-0 z-40 h-16 px-6 ...">
  <div className="max-w-7xl mx-auto w-full h-full flex items-center gap-4">
    {/* Left: Search */}
    <div className="flex-1 max-w-md">...</div>

    {/* Right: Actions - use ml-auto to push to far right */}
    <div className="flex items-center gap-3 ml-auto">...</div>
  </div>
</header>
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

## Session Continuity Tips

1. Read `CLAUDE.md` for project overview and conventions
2. Read `process-and-development.md` for feature status
3. Read this file (`AGENT.md`) for implementation tips
4. Check git log for recent changes: `git log --oneline -10`
5. The `/prompt-structure.txt` file contains the reference AI prompt
