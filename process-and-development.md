# Stager - Development Process & Roadmap

## Development Phases

### Phase 1: Foundation ✅ COMPLETE
Core infrastructure and basic functionality.

#### Milestones
- [x] Initialize Next.js project with TypeScript
- [x] Configure Tailwind CSS v4
- [x] Install and configure shadcn/ui components
- [x] Create project documentation (claude.md, process-and-development.md)
- [x] Set up Supabase client configuration
- [x] Create database schema
- [x] Implement authentication flow (signup/login/logout)
- [x] Build basic dashboard layout
- [x] Create landing page
- [x] Deploy to Vercel

#### Deliverables
- ✅ Working authentication system
- ✅ Protected dashboard routes
- ✅ Basic navigation structure
- ✅ Clean, responsive UI foundation
- ✅ Production deployment on Vercel

---

### Phase 2: Core Staging Feature ✅ COMPLETE
The main AI-powered staging functionality.

#### Milestones
- [x] Implement image upload to Supabase Storage
- [x] Create Gemini API integration service (using Gemini 2.5 Flash)
- [x] Build staging interface
  - [x] Image uploader component (drag & drop)
  - [x] Room type selector (9 room types)
  - [x] Furniture style picker (9 styles)
  - [x] Processing status indicator
- [x] Implement before/after comparison slider
- [x] Create staging job management
- [x] Credit deduction on successful staging
- [x] Add staging history view

#### Deliverables
- ✅ Fully functional virtual staging with AI
- ✅ Intuitive staging workflow
- ✅ Image comparison tool
- ✅ Job history and status tracking

---

### Phase 3: Property Management ✅ COMPLETE
Property organization and batch processing.

#### Milestones
- [x] Create property CRUD operations
- [x] Build property listing page
- [x] Implement property detail view with image gallery
- [x] Link staging jobs to properties
- [x] Create batch staging capability (up to 10 images)
- [x] Implement property search and filtering
- [x] Download all property images as ZIP

#### Deliverables
- ✅ Complete property management system
- ✅ Organized image galleries per property
- ✅ Direct staging from property pages
- ✅ Batch processing with per-image room types
- ✅ Property search by address/description
- ✅ Sort by date, name, staging count
- ✅ ZIP download for entire property

---

### Phase 4: Credits & Usage Tracking ✅ COMPLETE
Prepare for monetization with usage tracking.

#### Milestones
- [x] Implement credit balance system (basic)
- [x] Add credit deduction on staging
- [x] Create usage history view
- [x] Build credit balance UI components
- [x] Add low-credit warnings
- [x] Implement usage analytics dashboard

#### Deliverables
- ✅ Credit tracking system
- ✅ Usage analytics on billing page
- ✅ Low credit warnings (sidebar + dashboard + staging page)
- ✅ Foundation for billing integration

---

### Phase 5: Payment Integration (Future)
Full monetization with Stripe.

#### Milestones
- [ ] Integrate Stripe for payments
- [ ] Create subscription plans
- [ ] Implement plan management
- [ ] Add invoice history
- [ ] Build upgrade/downgrade flow

#### Deliverables
- Complete payment system
- Subscription management
- Self-service billing portal

---

## Current Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 16 (App Router) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Backend | Next.js API Routes |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| AI Model | Decor8 AI (default), Gemini (fallback), Replicate (async) |
| Deployment | Vercel |
| Repository | GitHub |

---

## Feature Roadmap

### MVP Features (Phases 1-2)
| Feature | Priority | Status |
|---------|----------|--------|
| User authentication | High | ✅ Complete |
| Dashboard layout | High | ✅ Complete |
| Image upload | High | ✅ Complete |
| AI staging | High | ✅ Complete |
| Before/after comparison | High | ✅ Complete |
| Staging history | Medium | ✅ Complete |

### Post-MVP Features (Phases 3-5)
| Feature | Priority | Status |
|---------|----------|--------|
| Property management | Medium | ✅ Complete |
| Batch processing | Medium | ✅ Complete |
| Property search & filter | Medium | ✅ Complete |
| Multiple style variations | Medium | ✅ Complete |
| Global search bar | Medium | ✅ Complete |
| ZIP download | Low | ✅ Complete |
| Credits system | Medium | ✅ Complete |
| Analytics dashboard | Low | ✅ Complete |
| Dark/Light theme toggle | Medium | ✅ Complete |
| Collapsible sidebar | Medium | ✅ Complete |
| Auto-hide sidebar | Low | ✅ Complete |
| Glassmorphism UI redesign | Medium | ✅ Complete |
| Custom typography (Outfit/Lato) | Low | ✅ Complete |
| Floating search & notifications | Medium | ✅ Complete |
| Persistent notification system | Medium | ✅ Complete |
| Personalized dashboard greeting | Low | ✅ Complete |
| Stage page 4-step wizard | Medium | ✅ Complete |
| Guided/Quick mode toggle | Low | ✅ Complete |
| Image remix & version control | Medium | ✅ Complete |
| Payment integration | Low | Planned |
| Team accounts | Medium | ✅ Complete |
| Email-based team invitations | Medium | ✅ Complete |
| Email automation (drip campaigns, digests) | Medium | ✅ Complete |
| Email design system (React Email) | Low | ✅ Complete |
| Landing page redesign (glassmorphism, animations) | Medium | ✅ Complete |

---

## AI Staging Configuration

### Provider Architecture
- **Decor8 AI** (default) - Professional virtual staging API, ~$0.20/image
- **Gemini** (fallback) - `gemini-2.0-flash-exp` with image generation
- **Replicate** (async) - Background processing with webhooks
- Automatic failover via `ProviderRouter` class
- Environment variable: `AI_DEFAULT_PROVIDER` (defaults to "decor8")

### Room Types
- Living Room
- Master Bedroom
- Guest Bedroom
- Kids Bedroom
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

### Prompt Engineering
The staging prompt is designed to:
- Preserve original room architecture (walls, floors, ceiling)
- Maintain camera angle and perspective
- Only add furniture and decor
- Generate photorealistic results

---

## Testing Strategy

### Manual Testing
- Test all user flows on desktop and mobile
- Verify authentication edge cases
- Test image upload with various formats/sizes
- Validate AI staging quality

### Automated Testing
- Unit tests for utility functions and hooks
- API route tests with Vitest + MSW mocking
- Component tests for CreditDisplay, RoomTypeDropdown, PlanCard, WizardStepIndicator
- 277 passing tests covering hooks, components, and API routes
- E2E tests with Playwright (11 test files, 103 tests)

### Test Checklist
- [x] Signup flow works correctly
- [x] Login/logout functions properly
- [x] Protected routes redirect unauthenticated users
- [x] Image upload accepts valid formats
- [x] Image upload rejects invalid formats
- [x] Staging process completes successfully
- [x] Staged images display correctly
- [x] History view shows all past jobs
- [x] UI is responsive on all screen sizes

---

## Deployment Workflow

### Development Environment
```bash
npm run dev
# Runs on http://localhost:3000
```

### Production Environment
- **URL**: https://stager-tau.vercel.app
- Main branch auto-deploys to production
- Environment variables configured in Vercel
- Supabase connected to production project

### Environment Variables
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (for server-side operations) |
| `DECOR8_API_KEY` | Decor8 AI API key (default provider) |
| `GOOGLE_GEMINI_API_KEY` | Google AI API key (fallback provider) |
| `AI_DEFAULT_PROVIDER` | Provider selection: decor8, gemini, or stable-diffusion |
| `NEXT_PUBLIC_APP_URL` | Application URL |
| `RESEND_API_KEY` | Resend email service API key |
| `RESEND_FROM_EMAIL` | Email sender address (requires verified domain for production) |

### Deployment Commands
```bash
# Deploy to production
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs
```

---

## API Endpoints Reference

### Authentication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/callback` | GET | Supabase auth callback |

### Staging
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/staging` | POST | Create new staging job |

### Search
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/search` | GET | Global search (properties + staging jobs) |

### Properties
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/properties/[id]/download` | GET | Download all property images as ZIP |

### Account
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/account/delete` | DELETE | Delete user account and data |

---

## Database Schema

### Tables
- **profiles** - User profiles with credits
- **properties** - Real estate properties
- **staging_jobs** - Staging job records
- **notifications** - Persistent user notifications
- **version_groups** - Groups versions of remixed images

### Key Fields
```
profiles:
  - id (uuid, references auth.users)
  - full_name (text)
  - credits_remaining (integer, default: 10)

staging_jobs:
  - id (uuid)
  - user_id (uuid)
  - original_image_url (text)
  - staged_image_url (text)
  - room_type (text)
  - style (text)
  - status (pending/processing/completed/failed)
  - credits_used (integer)
  - version_group_id (uuid, references version_groups)
  - is_primary_version (boolean)
  - parent_job_id (uuid, references staging_jobs)

version_groups:
  - id (uuid)
  - user_id (uuid, references profiles)
  - original_image_hash (text)
  - original_image_url (text)
  - free_remixes_used (integer, default: 0)
```

---

## Future Considerations

### Scalability
- Consider edge caching for static assets
- Implement image optimization pipeline
- Add queue system for staging jobs

### Features to Explore
- Multiple staging variations per image
- AI-suggested furniture placement
- Custom furniture item selection
- 3D visualization
- Team collaboration features
- White-label options

### Technical Improvements
- ✅ Comprehensive error tracking (Sentry - client, server, edge)
- ✅ Audit logging for security/compliance
- ✅ Webhook signature validation (Replicate, Stripe)
- ✅ Request tracing with X-Request-ID headers
- ✅ OpenAPI 3.0 documentation
- Implement analytics (PostHog, Mixpanel)
- Consider CDN for image delivery
- Add database transactions for multi-table writes

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1.0 | 2025-01-09 | Initial project setup, Next.js + Tailwind + shadcn/ui |
| 0.2.0 | 2025-01-09 | Authentication complete, dashboard layout |
| 0.3.0 | 2025-01-09 | Staging feature complete with Gemini 2.5 Flash |
| 0.3.1 | 2025-01-09 | Improved staging prompt for better room preservation |
| 0.4.0 | 2025-01-09 | Staging history page complete |
| 0.5.0 | 2025-01-09 | Credits system complete: low credit warnings, billing page with usage analytics |
| 0.6.0 | 2025-01-09 | Property management: CRUD, listing, detail pages, linked staging |
| 0.7.0 | 2025-01-10 | ZIP download for property images |
| 0.8.0 | 2025-01-10 | Batch staging: up to 10 images, per-image room types, single style |
| 0.8.1 | 2025-01-10 | Dashboard thumbnails clickable, show actual staged images |
| 0.9.0 | 2025-01-10 | Property search & filtering, sort options |
| 0.9.1 | 2025-01-10 | Multi-style variations: select up to 3 styles per staging |
| 0.9.2 | 2025-01-10 | Property assignment in batch staging |
| 0.9.3 | 2025-01-10 | Updated AI prompt to inpainting-focused structure |
| 0.9.4 | 2025-01-10 | Global search bar: search properties and staging jobs |
| 0.9.5 | 2025-01-11 | History delete, property edit/delete, before/after slider on property images |
| 0.9.6 | 2025-01-11 | Store original images in Supabase Storage for comparison slider |
| 0.9.7 | 2025-01-11 | UI modernization: glassmorphism design, micro-animations, OKLch colors |
| 0.9.8 | 2025-01-11 | Theme toggle: light/dark/system modes with next-themes |
| 0.9.9 | 2025-01-11 | Collapsible sidebar: collapse to icons, auto-hide mode, tooltips, keyboard shortcut |
| 0.9.10 | 2025-01-12 | Stage page redesign: two-panel layout, room type dropdown, style image gallery |
| 0.9.11 | 2025-01-12 | Container width standardization: max-w-7xl centered layout across all pages |
| 0.9.12 | 2025-01-12 | Header alignment: constrained to match content width, fixed sidebar double-spacing bug |
| 1.067 | 2025-01-16 | Enhanced glassmorphism: 65%/50% card opacity, stronger mesh gradient |
| 1.068 | 2025-01-16 | Increased card transparency to 50% |
| 1.069 | 2025-01-16 | Dark mode contrast: darker background, lighter cards |
| 1.070 | 2025-01-16 | Light mode card border fix (black/8 instead of white/30) |
| 1.071 | 2025-01-16 | Header transparency 30%, added Outfit/Lato Google Fonts |
| 1.072 | 2025-01-16 | Stronger glassmorphism (40% cards), personalized dashboard greeting |
| 1.073 | 2025-01-16 | Layout restructure: removed header, floating controls, sidebar user avatar |
| 1.074 | 2025-01-16 | 100px top padding, standardized heading sizes across all pages |
| 1.085 | 2025-01-16 | Persistent notification system: database, dropdown UI, staging/credits triggers |
| 1.086 | 2025-01-16 | Fixed search bar input overlay styling |
| 1.087 | 2025-01-16 | History page stats cards clickable as filters with visual indicator |
| 1.088 | 2025-01-16 | User avatar dropdown: Title Case name, lowercase email, wider popup |
| 1.089 | 2025-01-16 | Fixed dropdown label CSS uppercase override |
| 1.090 | 2025-01-16 | Mobile sidebar auto-close on navigation |
| 1.091 | 2025-01-16 | Auto-close mobile sidebar on navigation |
| 1.092 | 2025-01-16 | Add delete functionality to notifications panel |
| 1.093 | 2025-01-19 | 4-step wizard flow for Stage Photo page with Guided/Quick mode toggle |
| 1.094 | 2025-01-19 | Wizard step indicator centering adjustments |
| 1.095 | 2025-01-19 | Align step indicator width with upload card |
| 1.096 | 2025-01-19 | Fix step indicator centering - remove flex-1 from last step |
| 1.104 | 2025-01-21 | Image Remix & Version Control: remix API, version groups, primary version selection |
| 1.105 | 2025-01-21 | Version display improvements: stacked card effect, VersionBadge, server-side grouping |
| 1.106 | 2025-01-21 | Billing page: add thumbnails to Usage History entries |
| 1.108 | 2025-01-21 | Subscription Plans & Team Management: plans table, organizations, credit allocation |
| 1.109 | 2025-01-23 | Email-Based Team Invitations: Resend integration, invitation tokens, accept flow |
| 1.136 | 2025-01-23 | API tests, dead code removal, service extraction: 46 new tests, modular staging/team services |
| 1.137 | 2025-01-24 | Codebase improvements: OpenAPI docs, E2E tests, Sentry, audit logging, query optimization, component tests (277 total tests) |
| 1.142 | 2025-01-24 | Database indexes, background job queue (QStash), observability, caching, feature flags |
| 1.143 | 2025-01-24 | Email automation system: React Email templates, Resend integration, drip campaigns |
| 1.144 | 2025-01-24 | Email design refresh: modern card-based aesthetic, design system, gradient accents |
| 1.145 | 2025-01-24 | Team invitations enhancements: full history, status filters, toast notifications, signup trigger fix |
| 1.146 | 2025-01-24 | User onboarding welcome modal |
| 1.147 | 2025-01-25 | Interactive product tour: Driver.js integration, 7-step guided tour, glassmorphic styling |
| 1.148 | 2025-01-27 | Landing page redesign: Framer Motion animations, glassmorphism, comparison slider, 9 sections |
| 1.0.0 | TBD | MVP release |

---

## Next Steps (Suggested)

### High Priority
- [x] History management (delete staging jobs)
- [x] Property edit/delete functionality
- [x] Before/after slider on individual staged images
- [x] Dark/light theme toggle
- [x] Collapsible/auto-hide sidebar
- [x] Stage page UX redesign (two-panel layout, visual style gallery)
- [x] Consistent container width across all pages (max-w-7xl centered)
- [x] Glassmorphism UI with enhanced transparency
- [x] Custom typography (Outfit headings, Lato body)
- [x] Layout restructure (floating controls, sidebar user avatar)
- [x] Personalized dashboard greeting

### Medium Priority
- [ ] Shareable links for properties/stagings
- [ ] Email notifications for batch completion
- [x] User onboarding/tutorial (interactive product tour with Driver.js)
- [ ] Image quality options (resolution selection)

### Low Priority
- [ ] Payment integration (Stripe)
- [ ] Team accounts
- [ ] Usage analytics over time
- [ ] Mobile app (React Native)
