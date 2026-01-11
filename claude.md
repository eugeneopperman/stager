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
- **Google Gemini Flash 2.5** - Image generation and editing
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
│   │   ├── layout/            # Header (with search), Sidebar
│   │   ├── staging/           # Staging components (uploaders, selectors)
│   │   ├── properties/        # Property management components
│   │   └── dashboard/         # Dashboard widgets
│   │
│   ├── contexts/
│   │   └── DashboardContext.tsx  # Credits & user state
│   │
│   └── lib/
│       ├── supabase/          # Supabase client configuration
│       ├── gemini.ts          # Gemini API service with staging prompt
│       ├── database.types.ts  # TypeScript types for Supabase
│       ├── utils.ts           # Utility functions
│       └── constants.ts       # Room types, styles, credit thresholds
│
├── public/                    # Static assets
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

### Key Relationships
- `profiles.id` → `auth.users.id` (1:1)
- `properties.user_id` → `profiles.id` (many:1)
- `staging_jobs.property_id` → `properties.id` (many:1)

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
| `src/lib/constants.ts` | Room types, styles, credit thresholds |
| `src/lib/database.types.ts` | TypeScript types for Supabase tables |
| `src/middleware.ts` | Auth protection middleware |
| `src/components/layout/Header.tsx` | Header with global search functionality |
| `src/components/layout/Sidebar.tsx` | Navigation sidebar with credits display |
| `src/components/staging/BatchImageUploader.tsx` | Multi-image upload component |
| `src/components/staging/PropertySelector.tsx` | Property selection with inline create |
| `src/app/(dashboard)/stage/batch/page.tsx` | Batch staging workflow |
| `src/app/(dashboard)/history/HistoryJobCard.tsx` | History card with delete & comparison |
| `src/app/(dashboard)/properties/[id]/StagedImageCard.tsx` | Property image with comparison slider |
| `src/app/(dashboard)/properties/[id]/PropertyActions.tsx` | Property edit/delete actions |
| `prompt-structure.txt` | Reference AI staging prompt |
| `AGENT.md` | Agent notes and lessons learned |

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
