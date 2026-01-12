# PRD: Stage Photo Page Redesign

## Overview

**Document Status:** Approved
**Last Updated:** 2026-01-12
**Author:** Product Team

## Decisions Made

| Decision | Selected Option |
|----------|-----------------|
| Layout | **Two-Panel** - Image left, controls right |
| Style Display | **Image Grid** - 3-4 column thumbnails with selection |
| Batch Mode | **Keep Separate** - Single page stays focused |

---

## Problem Statement

The current Stage Photo page (`/stage`) has a bulky, vertically-stacked UX that requires excessive scrolling and feels disconnected. Key issues:

| Issue | Current State | Impact |
|-------|---------------|--------|
| **Vertical sprawl** | 4 separate cards stacked vertically | Users must scroll to see all options |
| **Room Type selector** | Grid of 9 buttons (takes ~120px height) | Consumes space, no search/filter |
| **Style selector** | 9 text-only cards in a grid | No visual representation of styles |
| **No style imagery** | Text descriptions only | Users can't visualize outcomes |
| **Disconnected workflow** | Each step is an isolated card | Doesn't feel like a cohesive flow |
| **Large upload area** | 320px tall drag zone | Pushes options below the fold |

---

## Goals

1. **Condense the layout** - Minimize scrolling, show all options on one screen
2. **Add visual style previews** - Show furniture style imagery to help users choose
3. **Streamline room selection** - Compact dropdown with icons
4. **Enhance functionality** - Add features that improve the staging workflow
5. **Maintain mobile responsiveness** - Works well on all screen sizes

---

## Proposed Solutions

### Layout Options

#### Option A: Two-Panel Layout (SELECTED)

```
┌─────────────────────────────────────────────────────────────┐
│  Stage a Photo                                    [Credits] │
├──────────────────────────────┬──────────────────────────────┤
│                              │  Room Type: [▼ Living Room]  │
│                              │                              │
│      IMAGE PREVIEW           │  Furniture Style             │
│      (drag & drop)           │  ┌─────┐ ┌─────┐ ┌─────┐    │
│                              │  │ IMG │ │ IMG │ │ IMG │    │
│                              │  │Mod. │ │Trad.│ │Mini.│    │
│   [Upload] or drag here      │  └─────┘ └─────┘ └─────┘    │
│                              │  ┌─────┐ ┌─────┐ ┌─────┐    │
│                              │  │ IMG │ │ IMG │ │ IMG │    │
│                              │  └─────┘ └─────┘ └─────┘    │
│                              │                              │
│                              │  Property: [▼ Optional]      │
│                              │                              │
│                              │  [✨ Generate Staging]       │
├──────────────────────────────┴──────────────────────────────┤
│  💡 Tip: Select up to 3 styles for variations              │
└─────────────────────────────────────────────────────────────┘
```

**Pros:**
- Image and controls visible simultaneously
- No scrolling required on desktop
- Natural left-to-right workflow
- Room for style imagery

**Cons:**
- More complex responsive handling
- Mobile falls back to stacked view

---

#### Option B: Compact Single-Column

```
┌─────────────────────────────────────────────────────────────┐
│  Stage a Photo                                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │         IMAGE PREVIEW (compact, 200px)              │   │
│  │              [Click to upload]                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [▼ Living Room]  [▼ Modern (2 more)]  [▼ 123 Main St]     │
│                                                             │
│  Style Gallery (horizontal scroll)                          │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ →                 │
│  │ ✓  │ │     │ │     │ │     │ │     │                    │
│  │Mod. │ │Trad.│ │Mini.│ │ MCM │ │Scan.│                    │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                    │
│                                                             │
│  [✨ Generate 2 Variations - 2 credits]                     │
└─────────────────────────────────────────────────────────────┘
```

**Pros:**
- Simpler responsive design
- Horizontal style scroll is mobile-friendly
- Inline dropdowns save vertical space

**Cons:**
- Still some scrolling on smaller screens
- Less room for style detail

---

#### Option C: Side Drawer / Overlay

```
┌─────────────────────────────────────────────────────────────┐
│                    FULL IMAGE PREVIEW                       │
│                                                             │
│                    (fills viewport)                         │
│                                                             │
│                                                             │
│   ┌──────────────────────────────────────────────────┐     │
│   │ [≡ Staging Options]                              │     │
│   │                                                  │     │  ← Slides up
│   │ Room: Living Room ▼     Style: Modern (2) ▼     │     │    from bottom
│   │                                                  │     │
│   │ [✨ Generate]                          [⚙️]      │     │
│   └──────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

**Pros:**
- Maximum image visibility
- Clean, modern feel
- Touch-friendly bottom sheet

**Cons:**
- Hides options by default
- More complex implementation

---

### Component Redesigns

#### 1. Room Type Dropdown (All Options)

Replace the 9-button grid with a compact dropdown featuring icons.

```tsx
// Proposed component: RoomTypeDropdown
┌─────────────────────────────────┐
│ 🛋️ Living Room              ▼ │
└─────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────┐
│ 🛋️ Living Room            ✓   │
│ 🛏️ Master Bedroom              │
│ 🛏️ Guest Bedroom               │
│ 👶 Kids Bedroom                 │
│ 🍽️ Dining Room                 │
│ 🍳 Kitchen                      │
│ 💼 Home Office                  │
│ 🛁 Bathroom                     │
│ 🌳 Outdoor/Patio                │
└─────────────────────────────────┘
```

**Implementation:**
- Use shadcn/ui `<Select>` component
- Custom option renderer with icon + label
- Keyboard navigation support
- Search/filter for quick access (optional)

---

#### 2. Furniture Style Gallery (All Options)

Replace text-only cards with visual style previews.

**Option 2A: Image Grid with Thumbnails (SELECTED)**

```
┌──────────────────────────────────────────────────────────┐
│  Select Styles (up to 3)                    2 selected   │
├──────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐     │
│  │ [IMAGE] │  │ [IMAGE] │  │ [IMAGE] │  │ [IMAGE] │     │
│  │   ✓     │  │         │  │   ✓     │  │         │     │
│  │ Modern  │  │ Classic │  │ Minimal │  │Mid-Cent.│     │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘     │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐     │
│  │ [IMAGE] │  │ [IMAGE] │  │ [IMAGE] │  │ [IMAGE] │     │
│  │Scandi.  │  │Industri.│  │ Coastal │  │Farmhouse│     │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘     │
│              ┌─────────┐                                 │
│              │ [IMAGE] │                                 │
│              │ Luxury  │                                 │
│              └─────────┘                                 │
└──────────────────────────────────────────────────────────┘
```

**Option 2B: Horizontal Carousel**

```
┌──────────────────────────────────────────────────────────┐
│  ← Modern    Traditional    Minimalist    Mid-Century →  │
│                                                          │
│           ┌─────────────────────────────┐               │
│           │                             │               │
│           │      STYLE PREVIEW          │               │
│           │         IMAGE               │               │
│           │                             │               │
│           │       "Modern"              │               │
│           │   Clean lines, neutral...   │               │
│           └─────────────────────────────┘               │
│                                                          │
│              [Add to Selection ✓]                        │
│                                                          │
│  Selected: Modern, Scandinavian                          │
└──────────────────────────────────────────────────────────┘
```

**Option 2C: Modal Gallery with Large Previews**

```
┌─ Style Gallery ─────────────────────────────────────────┐
│                                                    [✕]  │
├─────────────────────────────────────────────────────────┤
│  ┌───────────────────────┐  ┌────────────────────────┐  │
│  │                       │  │ Modern/Contemporary    │  │
│  │   LARGE PREVIEW       │  │                        │  │
│  │      IMAGE            │  │ Clean lines, neutral   │  │
│  │                       │  │ colors, sleek furniture│  │
│  │                       │  │ with minimalist appeal │  │
│  │                       │  │                        │  │
│  │                       │  │ Best for: Open layouts │  │
│  │                       │  │ urban lofts, new builds│  │
│  └───────────────────────┘  │                        │  │
│                             │ [✓ Selected]           │  │
│  ┌────┐┌────┐┌────┐┌────┐   └────────────────────────┘  │
│  │thumb│thumb│thumb│thumb│                              │
│  └────┘└────┘└────┘└────┘                              │
└─────────────────────────────────────────────────────────┘
```

**Image Sourcing:**
- Stock photos of staged rooms in each style
- Could use AI-generated example images
- Stored in `/public/styles/` or Supabase Storage

---

#### 3. Enhanced Property Selector

Move property selection into the main flow instead of URL-only.

```
┌─────────────────────────────────────────┐
│ Property (Optional)                  ▼  │
├─────────────────────────────────────────┤
│ 🔍 Search properties...                 │
├─────────────────────────────────────────┤
│ 📍 123 Main Street, Austin TX       ✓   │
│ 📍 456 Oak Avenue, Austin TX            │
│ 📍 789 Pine Road, Dallas TX             │
├─────────────────────────────────────────┤
│ + Create New Property                   │
└─────────────────────────────────────────┘
```

---

### Additional Functionality

#### 4. Quick Actions Bar

```
┌─────────────────────────────────────────────────────────┐
│  [📁 Batch Mode]  [⭐ Favorites]  [🕐 Recent]  [?]      │
└─────────────────────────────────────────────────────────┘
```

- **Batch Mode** - Switch to multi-image staging
- **Favorites** - Quick-select saved style combinations
- **Recent** - Repeat last staging settings
- **Help** - Tips and best practices

---

#### 5. Inline Credit Display

```
┌───────────────────────────────────────────────┐
│ Credits: 8 remaining                          │
│ This staging: 2 credits (2 styles selected)   │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━░░░░░          │
└───────────────────────────────────────────────┘
```

---

#### 6. Style Preview Overlay (Advanced)

Show a low-fidelity preview of the selected style overlaid on the uploaded image before processing.

```
┌─────────────────────────────────────────────────┐
│            UPLOADED IMAGE                       │
│                                                 │
│       + ghosted furniture overlay               │
│         showing approximate placement           │
│                                                 │
│   "Preview: Modern style"     [See Full Size]   │
└─────────────────────────────────────────────────┘
```

*Note: This is an advanced feature - could be Phase 2*

---

## Final Implementation Plan

### Phase 1: Core Redesign (Selected)

| Component | Change | Priority |
|-----------|--------|----------|
| **Layout** | Two-panel: image left, controls right (stacked on mobile) | High |
| **Room Type** | Dropdown with icons (replaces grid) | High |
| **Style Selector** | Image grid with thumbnails (3-4 columns) | High |
| **Property Selector** | Integrated dropdown with search | Medium |
| **Credit Display** | Inline bar showing usage | Medium |

### Phase 2: Future Enhancements

| Feature | Description | Priority |
|---------|-------------|----------|
| Favorites | Save preferred style combinations | Low |
| Recent settings | One-click repeat of last staging | Low |
| Style preview overlay | Ghost preview on uploaded image | Low |

**Note:** Batch mode remains separate at `/stage/batch` per product decision.

---

## Technical Considerations

### New Assets Required

1. **Style preview images** (9 images, one per style)
   - Recommended: 400x300px thumbnails
   - Larger versions for modal: 800x600px
   - Format: WebP with JPEG fallback
   - Location: `/public/styles/` or Supabase Storage

2. **Room type icons**
   - Already using Lucide icons - just need to map to dropdown

### Component Changes

| File | Changes |
|------|---------|
| `src/app/(dashboard)/stage/page.tsx` | Restructure layout, integrate new components |
| `src/components/staging/RoomTypeSelector.tsx` | Convert to dropdown OR create new `RoomTypeDropdown.tsx` |
| `src/components/staging/MultiStyleSelector.tsx` | Add image support OR create new `StyleGallery.tsx` |
| `src/components/staging/PropertySelector.tsx` | Already exists - integrate into main flow |
| `src/lib/constants.ts` | Add image paths to `FURNITURE_STYLES` |

### State Management

Current state machine works well:
```typescript
type StagingState = "upload" | "processing" | "complete" | "error"
```

No changes needed to core state logic.

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Page scroll required | 2-3 scrolls | 0-1 scroll |
| Time to configure staging | ~30s | ~15s |
| Style selection confidence | Low (no visuals) | High (with images) |
| Mobile usability | Acceptable | Good |

---

## Open Questions

1. **Style images**: Should we use stock photos, AI-generated examples, or actual staged outputs from the platform?
   - *Recommendation: Use high-quality stock photos or AI-generated room examples*

2. ~~**Carousel vs Grid**: For styles, is horizontal scrolling (carousel) preferred over a static grid?~~
   - *Resolved: Image Grid selected*

3. **Property selector**: Should it be required or stay optional? Should it appear before or after style selection?
   - *Current: Optional, appears after style selection*

4. ~~**Batch mode**: Should single and batch staging be unified into one interface with a toggle?~~
   - *Resolved: Keep separate pages*

5. **Advanced features**: Is the style preview overlay (ghosted furniture) worth the complexity?
   - *Deferred to Phase 2*

---

## Appendix

### Current Component Structure

```
src/
├── app/(dashboard)/stage/
│   └── page.tsx              # Main staging page (609 lines)
├── components/staging/
│   ├── ImageUploader.tsx     # Drag-drop upload
│   ├── RoomTypeSelector.tsx  # Grid of room type buttons
│   ├── StyleSelector.tsx     # Single style selector
│   └── MultiStyleSelector.tsx # Multi-select styles (up to 3)
└── lib/
    └── constants.ts          # ROOM_TYPES, FURNITURE_STYLES
```

### Proposed Component Structure

```
src/
├── app/(dashboard)/stage/
│   └── page.tsx              # Restructured two-panel layout
├── components/staging/
│   ├── ImageUploader.tsx     # Keep (maybe compact variant)
│   ├── RoomTypeDropdown.tsx  # NEW: Dropdown with icons
│   ├── StyleGallery.tsx      # NEW: Visual style selector
│   ├── StyleCard.tsx         # NEW: Individual style with image
│   ├── PropertySelector.tsx  # Keep (integrate into flow)
│   └── StagingPanel.tsx      # NEW: Right-side control panel
└── lib/
    └── constants.ts          # Add image paths to styles
```

---

## Next Steps

1. [ ] Review PRD and select preferred options
2. [ ] Source/create style preview images
3. [ ] Design mockups in Figma (optional)
4. [ ] Implement Phase 1 components
5. [ ] Test and iterate
6. [ ] Deploy and measure metrics
