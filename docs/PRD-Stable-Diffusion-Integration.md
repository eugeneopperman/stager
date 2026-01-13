# PRD: Stable Diffusion Integration

## Overview

**Document Status:** Active
**Last Updated:** 2026-01-13
**Version:** 1.008 (current working: Gemini only)

## Current State

### What's Working
- Gemini staging via `stageImage()` in `src/lib/gemini.ts`
- Original staging route using Gemini directly
- Room type and furniture style selection
- Image upload and storage
- Job tracking in database

### What's Broken
- Provider abstraction layer (`src/lib/providers/`)
- Stable Diffusion integration via Replicate
- Async job processing with webhooks/polling

### Known Issues Encountered

| Issue | Status | Notes |
|-------|--------|-------|
| Replicate rate limiting | Identified | Free tier: 6 req/min, burst of 1 |
| Webhook URL validation | Fixed | Was sending `http://localhost` |
| Model version format | Fixed | Was sending `model:version` instead of just `version` |
| Provider column in DB | Unknown | Migration may not have been applied |
| Provider health check | Unknown | May be failing and causing issues |

---

## Problem Statement

We need a robust Stable Diffusion integration that:
1. Works alongside Gemini as an alternative provider
2. Preserves room structure (walls, floors, ceilings) while adding furniture
3. Handles async processing with proper job status tracking
4. Falls back gracefully when SD is unavailable

---

## Objectives

### Phase 1: Debug Provider System
1. Identify why provider abstraction fails when Gemini class is used
2. Fix provider health checks
3. Ensure database schema supports provider tracking
4. Get GeminiProvider class working identically to direct `stageImage()` call

### Phase 2: Fix Replicate Integration
5. Verify Replicate API token is configured on Vercel
6. Fix model selection and parameters for SDXL
7. Handle rate limiting gracefully (queue, retry, or fallback)
8. Test with valid HTTPS webhook URL

### Phase 3: Async Job Processing
9. Implement proper job status polling
10. Handle webhook callbacks from Replicate
11. Update job status in database correctly
12. Show progress to user in UI

### Phase 4: Structural Preservation
13. Test SDXL img2img with various prompt_strength values
14. Evaluate inpainting model with auto-generated masks
15. Fine-tune prompts for structure preservation
16. Compare results with Gemini output

---

## Technical Details

### Provider Architecture

```
src/lib/providers/
├── types.ts           # Provider interfaces
├── base-provider.ts   # Abstract base class
├── gemini-provider.ts # Gemini implementation
├── replicate-provider.ts # SD implementation
└── index.ts           # Factory and router
```

### Database Schema (Migration Required)

```sql
-- New columns for staging_jobs table
ALTER TABLE staging_jobs ADD COLUMN IF NOT EXISTS provider text;
ALTER TABLE staging_jobs ADD COLUMN IF NOT EXISTS replicate_prediction_id text;
ALTER TABLE staging_jobs ADD COLUMN IF NOT EXISTS preprocessing_completed_at timestamptz;
ALTER TABLE staging_jobs ADD COLUMN IF NOT EXISTS controlnet_inputs jsonb;
ALTER TABLE staging_jobs ADD COLUMN IF NOT EXISTS generation_params jsonb;
ALTER TABLE staging_jobs ADD COLUMN IF NOT EXISTS processing_time_ms integer;
```

### Replicate Model Options

| Model | Type | Mask Required | Notes |
|-------|------|---------------|-------|
| `stability-ai/sdxl` | img2img | No | Use `prompt_strength` 0.6-0.8 |
| `lucataco/sdxl-inpainting` | Inpainting | Yes | Better structure preservation |
| `stability-ai/stable-diffusion` | img2img | No | SD 1.5, faster but lower quality |

### Environment Variables Required

```env
REPLICATE_API_TOKEN=r8_xxxxx
NEXT_PUBLIC_APP_URL=https://stager-tau.vercel.app
```

---

## Implementation Plan

### Step 1: Verify Database Migration
- [ ] Check if `provider` column exists in `staging_jobs`
- [ ] Run migration if needed via Supabase dashboard
- [ ] Verify all new columns are present

### Step 2: Debug GeminiProvider Class
- [ ] Add logging to GeminiProvider
- [ ] Compare behavior with direct `stageImage()` call
- [ ] Identify where it diverges

### Step 3: Test Provider Router
- [ ] Add logging to health checks
- [ ] Verify Gemini is selected when available
- [ ] Test fallback behavior

### Step 4: Fix ReplicateProvider
- [ ] Verify API token on Vercel
- [ ] Test API call with minimal parameters
- [ ] Add better error handling and logging

### Step 5: Implement Proper Async Flow
- [ ] Test webhook with HTTPS URL
- [ ] Implement polling as fallback
- [ ] Update UI to show progress

### Step 6: Test and Iterate
- [ ] Test with real images
- [ ] Compare Gemini vs SD output
- [ ] Tune parameters for best results

---

## Success Criteria

1. **Provider Selection**: System correctly selects Gemini or SD based on availability
2. **SD Staging**: Can successfully stage an image using Stable Diffusion
3. **Structure Preservation**: SD output preserves room architecture
4. **Async Handling**: Jobs complete and update correctly
5. **Fallback**: System falls back to Gemini if SD fails

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Replicate rate limits | Add payment method or implement queuing |
| SD alters room structure | Use inpainting model with masks |
| Webhook failures | Polling as fallback |
| Long processing times | Show progress indicator to user |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/providers/gemini-provider.ts` | Add logging, debug |
| `src/lib/providers/replicate-provider.ts` | Fix model params |
| `src/lib/providers/index.ts` | Add logging to router |
| `src/app/api/staging/route.ts` | Re-enable provider system |
| `src/app/api/staging/[jobId]/status/route.ts` | Verify polling works |

---

## Next Actions

1. Check Supabase for database schema
2. Add logging to provider system
3. Create test route to isolate provider issues
4. Verify Replicate API token on Vercel
