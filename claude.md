# Stager - AI-Powered Virtual Staging Platform

## Project Overview
Stager is a web application designed for real estate agents to virtually stage property photos with furniture and decor using AI. The application uses Google Gemini Flash 2.5 (Nano Banana) for intelligent image processing and staging.

## Tech Stack

### Frontend
- **Next.js 14+** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS v4** - Utility-first CSS framework
- **shadcn/ui** - Modern React component library
- **Lucide React** - Icon library

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication (email/password)
  - Storage (image uploads)

### AI Integration
- **Google Gemini 3 Pro Image** (Nano Banana Pro) - Image generation and editing
- SDK: `@google/generative-ai`

### Deployment
- **Vercel** - Hosting and CI/CD
- **GitHub** - Version control

## Directory Structure

```
/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth routes (login, signup)
│   │   ├── (dashboard)/       # Protected dashboard routes
│   │   │   ├── dashboard/     # Main dashboard
│   │   │   ├── stage/         # Single photo staging
│   │   │   ├── stage/batch/   # Batch staging (up to 10)
│   │   │   ├── history/       # Staging history
│   │   │   ├── properties/    # Property management
│   │   │   ├── billing/       # Billing & usage
│   │   │   └── settings/      # User settings
│   │   ├── api/               # API routes
│   │   │   ├── staging/       # Staging API
│   │   │   ├── search/        # Global search API
│   │   │   ├── properties/    # Property APIs (incl. ZIP download)
│   │   │   └── account/       # Account management
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Landing page
│   │   └── globals.css        # Global styles
│   │
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── layout/            # FloatingControls, Sidebar (with user avatar)
│   │   ├── staging/           # Staging components (uploaders, selectors)
│   │   │   └── wizard/        # 4-step wizard components
│   │   ├── properties/        # Property management components
│   │   └── dashboard/         # Dashboard widgets
│   │
│   ├── contexts/
│   │   ├── DashboardContext.tsx  # Credits & user state
│   │   └── SidebarContext.tsx    # Sidebar collapse/auto-hide state
│   │
│   └── lib/
│       ├── supabase/          # Supabase client configuration
│       ├── gemini.ts          # Gemini API service with staging prompt
│       ├── database.types.ts  # TypeScript types for Supabase
│       ├── utils.ts           # Utility functions
│       └── constants.ts       # Room types, styles, credit thresholds
│
├── public/
│   └── styles/               # Furniture style preview images (SVG)
├── docs/
│   └── PRD-*.md              # Product requirement documents
├── prompt-structure.txt       # Reference AI staging prompt
├── CLAUDE.md                  # This file
├── AGENT.md                   # Agent notes and lessons learned
├── process-and-development.md # Development roadmap
└── package.json
```

## Key Patterns & Conventions

### File Naming
- Components: PascalCase (e.g., `ImageUploader.tsx`)
- Utilities/hooks: camelCase (e.g., `useAuth.ts`)
- API routes: kebab-case folders with `route.ts`

### Component Structure
```tsx
// Standard component template
"use client"; // Only if client-side interactivity needed

import { ComponentProps } from "react";
import { cn } from "@/lib/utils";

interface MyComponentProps {
  // Props interface
}

export function MyComponent({ ...props }: MyComponentProps) {
  return (
    // JSX
  );
}
```

### API Route Structure
```typescript
// src/app/api/example/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  // Handle request
  return NextResponse.json({ data });
}
```

### Supabase Client Usage
- Server Components: Use `createClient()` from `@/lib/supabase/server`
- Client Components: Use `createClient()` from `@/lib/supabase/client`
- Middleware: Use `createServerClient` from `@supabase/ssr`

### Styling Conventions
- Use Tailwind CSS utility classes
- Use `cn()` helper for conditional classes
- Follow shadcn/ui patterns for component variants
- Dark mode: Use CSS variables defined in globals.css

## Database Schema

### Tables
- **profiles** - User profiles (extends auth.users)
- **properties** - Real estate properties
- **staging_jobs** - Staging processing jobs
- **notifications** - Persistent user notifications
- **version_groups** - Groups remixed versions of same original image

### Key Relationships
- `profiles.id` → `auth.users.id` (1:1)
- `properties.user_id` → `profiles.id` (many:1)
- `staging_jobs.property_id` → `properties.id` (many:1)
- `staging_jobs.version_group_id` → `version_groups.id` (many:1)
- `staging_jobs.parent_job_id` → `staging_jobs.id` (self-reference for remixes)

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Gemini AI
GOOGLE_GEMINI_API_KEY=your_gemini_api_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Staging Feature Configuration

### Room Types
- Living Room
- Bedroom (Master, Guest, Kids)
- Dining Room
- Kitchen
- Home Office
- Bathroom
- Outdoor/Patio

### Furniture Styles
- Modern/Contemporary
- Traditional/Classic
- Minimalist
- Mid-Century Modern
- Scandinavian
- Industrial
- Coastal/Beach
- Farmhouse/Rustic
- Luxury/Glam

## Important Files Reference

| File | Purpose |
|------|---------|
| `src/lib/supabase/client.ts` | Browser Supabase client |
| `src/lib/supabase/server.ts` | Server Supabase client |
| `src/lib/supabase/middleware.ts` | Middleware Supabase client |
| `src/lib/gemini.ts` | Gemini API integration with inpainting-focused prompt |
| `src/lib/constants.ts` | Room types, styles (with image paths), credit thresholds |
| `src/lib/version.ts` | App version number displayed in UI |
| `src/lib/database.types.ts` | TypeScript types for Supabase tables |
| `src/lib/notifications.ts` | Notification helper functions (create, fetch, mark read) |
| `src/middleware.ts` | Auth protection middleware |
| `src/contexts/SidebarContext.tsx` | Sidebar collapse/auto-hide state management |
| `src/components/providers/ThemeProvider.tsx` | next-themes wrapper for dark/light mode |
| `src/components/layout/FloatingControls.tsx` | Floating search icon + notification dropdown with expandable search |
| `src/components/layout/NotificationDropdown.tsx` | Bell icon with unread badge, notification popover dropdown |
| `src/components/layout/Sidebar.tsx` | Collapsible navigation sidebar with tooltips and user avatar dropdown |
| `src/components/ui/popover.tsx` | Radix UI popover component for dropdowns |
| `src/components/ui/tooltip.tsx` | Tooltip component for collapsed UI elements |
| `src/components/staging/ImageUploader.tsx` | Single image drag-drop upload |
| `src/components/staging/BatchImageUploader.tsx` | Multi-image upload component |
| `src/components/staging/RoomTypeDropdown.tsx` | Compact room type dropdown with icons |
| `src/components/staging/StyleGallery.tsx` | Visual style grid with thumbnail images |
| `src/components/staging/CreditDisplay.tsx` | Inline credit usage progress bar |
| `src/components/staging/PropertySelector.tsx` | Property selection with inline create |
| `src/components/staging/QuickStageLayout.tsx` | Original two-panel layout for Quick mode |
| `src/components/staging/RemixDialog.tsx` | Modal for configuring remix options |
| `src/components/staging/RemixButton.tsx` | Reusable remix action with variants |
| `src/components/staging/VersionThumbnailStrip.tsx` | Horizontal version thumbnail navigation |
| `src/components/staging/VersionBadge.tsx` | Compact version count badge |
| `src/components/staging/wizard/StagingWizard.tsx` | Main wizard container with step routing |
| `src/components/staging/wizard/WizardStepIndicator.tsx` | 4-step visual progress bar |
| `src/components/staging/wizard/WizardNavigation.tsx` | Reusable Back/Next/Skip buttons |
| `src/components/staging/wizard/UploadStep.tsx` | Step 1: Upload with speed messaging |
| `src/components/staging/wizard/PrepareStep.tsx` | Step 2: Preprocessing with skip option |
| `src/components/staging/wizard/StyleStep.tsx` | Step 3: Room type and style selection |
| `src/components/staging/wizard/GenerateStep.tsx` | Step 4: Summary and generate |
| `src/app/(dashboard)/DashboardShell.tsx` | Dashboard layout with max-w-7xl container |
| `src/app/(dashboard)/stage/page.tsx` | Stage page with Guided/Quick mode toggle |
| `src/app/(dashboard)/stage/batch/page.tsx` | Batch staging workflow |
| `src/app/(dashboard)/settings/ThemeSelector.tsx` | Light/dark/system theme picker |
| `src/app/(dashboard)/settings/SidebarSettings.tsx` | Sidebar behavior settings |
| `src/app/(dashboard)/history/HistoryPageClient.tsx` | Client wrapper with clickable stats cards as filters |
| `src/app/(dashboard)/history/HistoryJobCard.tsx` | History card with delete & comparison |
| `src/app/(dashboard)/properties/[id]/StagedImageCard.tsx` | Property image with comparison slider |
| `src/app/(dashboard)/properties/[id]/PropertyActions.tsx` | Property edit/delete actions |
| `public/styles/*.svg` | Furniture style preview images (9 styles) |
| `docs/PRD-Stage-Photo-Redesign.md` | Stage page redesign PRD |
| `prompt-structure.txt` | Reference AI staging prompt |
| `AGENT.md` | Agent notes and lessons learned |
| `supabase/migrations/006_create_notifications.sql` | Notifications table with RLS policies |
| `supabase/migrations/007_add_remix_support.sql` | Version groups table and remix fields |
| `src/app/api/staging/[jobId]/remix/route.ts` | Create remix of existing staging job |
| `src/app/api/staging/[jobId]/primary/route.ts` | Set version as primary |
| `src/app/api/staging/versions/route.ts` | Fetch all versions for a job |
| `docs/PRD-Version-Display-Improvements.md` | Version display improvements PRD |

## Commands

```bash
# Development
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
# Use Supabase dashboard or CLI for migrations
```

## Notes for Development
- Always check user authentication before database operations
- Use server actions or API routes for mutations, not direct client calls
- Images should be uploaded to Supabase Storage, not stored as base64
- Gemini API calls should happen server-side only (protect API key)
- Use optimistic updates for better UX where appropriate

## Custom Commands

### "wrap up this session"
When the user prompts "wrap up this session", update the following documentation files with progress and learnings from the current session:

1. **AGENT.md** - Add any new:
   - Component locations and their purposes
   - Architecture patterns discovered or implemented
   - Debugging tips or gotchas encountered
   - UI/UX patterns used

2. **process-and-development.md** - Update:
   - Version history with new version entry
   - Feature status (mark completed items)
   - Add any new roadmap items discussed

3. **CLAUDE.md** - Update:
   - Important Files Reference table with new files
   - Directory structure if new folders were added
   - Any new patterns or conventions established

After updating, commit the documentation changes with message: "Update documentation for session [date]"

### "let's get ready to code"
When the user prompts "let's get ready to code", review and familiarize yourself with the codebase by reading:

1. **CLAUDE.md** - Project overview, tech stack, directory structure, patterns, and conventions
2. **AGENT.md** - Agent notes, lessons learned, and debugging tips from previous sessions
3. **process-and-development.md** - Development roadmap, version history, and feature status

After reviewing, provide a brief summary of:
- Current project state and recent changes
- Any pending tasks or known issues
- Ready to receive instructions for the session
