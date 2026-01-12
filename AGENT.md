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
| `StyleSelector.tsx` | Single style selection |
| `MultiStyleSelector.tsx` | Multi-style selection (up to 3) |
| `PropertySelector.tsx` | Property dropdown with inline create |
| `RoomTypeSelector.tsx` | Room type selection |

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

## Session Continuity Tips

1. Read `CLAUDE.md` for project overview and conventions
2. Read `process-and-development.md` for feature status
3. Read this file (`AGENT.md`) for implementation tips
4. Check git log for recent changes: `git log --oneline -10`
5. The `/prompt-structure.txt` file contains the reference AI prompt
