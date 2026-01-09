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
- [ ] Add staging history view

#### Deliverables
- ✅ Fully functional virtual staging with AI
- ✅ Intuitive staging workflow
- ✅ Image comparison tool
- ⏳ Job history and status tracking (pending)

---

### Phase 3: Property Management
Property organization and batch processing.

#### Milestones
- [ ] Create property CRUD operations
- [ ] Build property listing page
- [ ] Implement property detail view
- [ ] Add multiple image support per property
- [ ] Create batch staging capability
- [ ] Implement property search and filtering

#### Deliverables
- Complete property management system
- Organized image galleries per property
- Batch processing for efficiency

---

### Phase 4: Credits & Usage Tracking
Prepare for monetization with usage tracking.

#### Milestones
- [x] Implement credit balance system (basic)
- [x] Add credit deduction on staging
- [ ] Create usage history view
- [x] Build credit balance UI components
- [ ] Add low-credit warnings
- [ ] Implement usage analytics dashboard

#### Deliverables
- Credit tracking system
- Usage analytics
- Foundation for billing integration

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
| Staging history | Medium | ⏳ In Progress |

### Post-MVP Features (Phases 3-5)
| Feature | Priority | Status |
|---------|----------|--------|
| Property management | Medium | Planned |
| Batch processing | Medium | Planned |
| Credits system | Medium | Partial |
| Analytics dashboard | Low | Planned |
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
- [ ] History view shows all past jobs
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

### Properties (Planned)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/properties` | GET | List user's properties |
| `/api/properties` | POST | Create new property |
| `/api/properties/[id]` | GET | Get property details |
| `/api/properties/[id]` | PUT | Update property |
| `/api/properties/[id]` | DELETE | Delete property |

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
| 1.0.0 | TBD | MVP release |
