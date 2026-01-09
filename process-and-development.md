# Stager - Development Process & Roadmap

## Development Phases

### Phase 1: Foundation (Current)
Core infrastructure and basic functionality.

#### Milestones
- [x] Initialize Next.js project with TypeScript
- [x] Configure Tailwind CSS v4
- [x] Install and configure shadcn/ui components
- [x] Create project documentation (claude.md, process-and-development.md)
- [ ] Set up Supabase client configuration
- [ ] Create database schema
- [ ] Implement authentication flow (signup/login/logout)
- [ ] Build basic dashboard layout
- [ ] Create landing page

#### Deliverables
- Working authentication system
- Protected dashboard routes
- Basic navigation structure
- Clean, responsive UI foundation

---

### Phase 2: Core Staging Feature
The main AI-powered staging functionality.

#### Milestones
- [ ] Implement image upload to Supabase Storage
- [ ] Create Gemini API integration service
- [ ] Build staging interface
  - [ ] Image uploader component (drag & drop)
  - [ ] Room type selector
  - [ ] Furniture style picker
  - [ ] Processing status indicator
- [ ] Implement before/after comparison slider
- [ ] Create staging job management
- [ ] Add staging history view

#### Deliverables
- Fully functional virtual staging
- Intuitive staging workflow
- Image comparison tool
- Job history and status tracking

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
- [ ] Implement credit balance system
- [ ] Add credit deduction on staging
- [ ] Create usage history view
- [ ] Build credit balance UI components
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

## Feature Roadmap

### MVP Features (Phases 1-2)
| Feature | Priority | Status |
|---------|----------|--------|
| User authentication | High | Pending |
| Dashboard layout | High | Pending |
| Image upload | High | Pending |
| AI staging | High | Pending |
| Before/after comparison | High | Pending |
| Staging history | Medium | Pending |

### Post-MVP Features (Phases 3-5)
| Feature | Priority | Status |
|---------|----------|--------|
| Property management | Medium | Planned |
| Batch processing | Medium | Planned |
| Credits system | Medium | Planned |
| Analytics dashboard | Low | Planned |
| Payment integration | Low | Planned |
| Team accounts | Low | Future |

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
- [ ] Signup flow works correctly
- [ ] Login/logout functions properly
- [ ] Protected routes redirect unauthenticated users
- [ ] Image upload accepts valid formats
- [ ] Image upload rejects invalid formats
- [ ] Staging process completes successfully
- [ ] Staged images display correctly
- [ ] History view shows all past jobs
- [ ] UI is responsive on all screen sizes

---

## Deployment Workflow

### Development Environment
```bash
npm run dev
# Runs on http://localhost:3000
```

### Staging Environment (Vercel Preview)
- Every PR gets a preview deployment
- Test new features before merging
- Share preview links for review

### Production Environment
- Main branch auto-deploys to production
- Environment variables configured in Vercel
- Supabase connected to production project

### Environment Setup

#### Local Development
1. Clone repository
2. Copy `.env.example` to `.env.local`
3. Fill in environment variables
4. Run `npm install`
5. Run `npm run dev`

#### Vercel Deployment
1. Connect GitHub repository
2. Configure environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GOOGLE_GEMINI_API_KEY`
   - `NEXT_PUBLIC_APP_URL`
3. Deploy

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
| `/api/staging/[id]` | GET | Get staging job status |
| `/api/staging/[id]` | DELETE | Cancel staging job |

### Properties
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/properties` | GET | List user's properties |
| `/api/properties` | POST | Create new property |
| `/api/properties/[id]` | GET | Get property details |
| `/api/properties/[id]` | PUT | Update property |
| `/api/properties/[id]` | DELETE | Delete property |

### Upload
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/upload` | POST | Upload image to storage |

---

## Database Migrations

### Initial Schema
```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  company_name text,
  credits_remaining integer default 10,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Properties table
create table properties (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles on delete cascade not null,
  address text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Staging jobs table
create table staging_jobs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles on delete cascade not null,
  property_id uuid references properties on delete set null,
  original_image_url text not null,
  staged_image_url text,
  room_type text not null,
  style text not null,
  status text default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  error_message text,
  credits_used integer default 1,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone
);

-- Row Level Security (RLS)
alter table profiles enable row level security;
alter table properties enable row level security;
alter table staging_jobs enable row level security;

-- Policies
create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can view own properties"
  on properties for select using (auth.uid() = user_id);

create policy "Users can insert own properties"
  on properties for insert with check (auth.uid() = user_id);

create policy "Users can update own properties"
  on properties for update using (auth.uid() = user_id);

create policy "Users can delete own properties"
  on properties for delete using (auth.uid() = user_id);

create policy "Users can view own staging jobs"
  on staging_jobs for select using (auth.uid() = user_id);

create policy "Users can insert own staging jobs"
  on staging_jobs for insert with check (auth.uid() = user_id);

-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
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
| 0.1.0 | TBD | Initial project setup |
| 0.2.0 | TBD | Authentication complete |
| 0.3.0 | TBD | Staging feature complete |
| 1.0.0 | TBD | MVP release |
