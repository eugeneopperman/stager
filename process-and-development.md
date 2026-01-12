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
| AI Model | Google Gemini 2.5 Flash |
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
| Payment integration | Low | Planned |
| Team accounts | Low | Future |

---

## AI Staging Configuration

### Model
- **Gemini 2.5 Flash** (`gemini-2.5-flash`)
- Image generation enabled via `responseModalities: ["image", "text"]`
- Requires Google Cloud billing enabled

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

### Automated Testing (Future)
- Unit tests for utility functions
- Integration tests for API routes
- E2E tests for critical user flows

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
| `GOOGLE_GEMINI_API_KEY` | Google AI API key |
| `NEXT_PUBLIC_APP_URL` | Application URL |

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
- Add comprehensive error tracking (Sentry)
- Implement analytics (PostHog, Mixpanel)
- Add performance monitoring
- Consider CDN for image delivery

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

### Medium Priority
- [ ] Shareable links for properties/stagings
- [ ] Email notifications for batch completion
- [ ] User onboarding/tutorial
- [ ] Image quality options (resolution selection)

### Low Priority
- [ ] Payment integration (Stripe)
- [ ] Team accounts
- [ ] Usage analytics over time
- [ ] Mobile app (React Native)
