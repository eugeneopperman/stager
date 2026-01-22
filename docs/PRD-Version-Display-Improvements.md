# PRD: Version Display Improvements

## Problem Statement

The current implementation of the version thumbnail strip disrupts the grid layout on Properties and History pages. When an image has remixed versions, the thumbnail strip appears below the card and takes up a separate grid slot, creating visual inconsistency and wasted space.

**Current Issues:**
1. Version thumbnail strip breaks grid alignment
2. Unclear relationship between primary and remix versions
3. Too much visual noise when multiple images have versions
4. Version strip makes sense in detail view but not in grid view

---

## Proposed Solution

### Design Principles
1. **Grid integrity** - Version indicators should not break the grid layout
2. **Progressive disclosure** - Show version count at a glance, details on interaction
3. **Clear hierarchy** - Primary version is prominent, remixes are secondary
4. **Minimal footprint** - Don't clutter the UI with version thumbnails in grid view

---

## UI Changes

### 1. Properties Page - Stacked Card Indicator

**Replace:** Thumbnail strip below card
**With:** Visual "stacked cards" effect + version badge

```
┌─────────────────────────┐
│  [Image]           [2]  │  ← Small badge showing version count
│                    ┌──┐ │
│                    │  │ │  ← Subtle stacked card shadow effect
│                 ┌──┘  │ │     (offset shadow behind card)
│              ┌──┘     │ │
│  Room Type   └────────┘ │
│  Style • Date   ★Primary│
└─────────────────────────┘
```

**Behavior:**
- Primary version displays as the main card
- Subtle offset shadow/border effect hints at multiple versions (like stacked photos)
- Small circular badge in top-right shows version count (e.g., "2", "3")
- Clicking badge OR card opens detail dialog with full version navigation
- Version thumbnail strip appears ONLY in the detail dialog

### 2. History Page - Grouped Version Display

**Option A: Collapsed Group (Recommended)**

Show only the primary/latest version in the grid with a version indicator:

```
┌─────────────────────────┐
│  [Primary Image]   [●2] │  ← Version count badge
│                         │
│  Room Type              │
│  Style • Date     ★ 🔗  │  ← Star = primary, chain = has versions
└─────────────────────────┘
```

**Option B: Mini Thumbnails Overlay**

Small version thumbnails overlaid on the bottom-right corner of the card:

```
┌─────────────────────────┐
│  [Primary Image]        │
│                         │
│                  ┌─┬─┐  │
│  Room Type       │●│○│  │  ← Mini circular thumbnails (max 3)
│  Style • Date    └─┴─┘  │     ● = current, ○ = other versions
└─────────────────────────┘
```

### 3. Detail Dialog - Full Version Navigation

When opening a card with versions, show the full version strip:

```
┌────────────────────────────────────────────┐
│  Room Type - Style                      X  │
├────────────────────────────────────────────┤
│                                            │
│  ┌──┐ ┌──┐ ┌──┐                           │  ← Version thumbnails
│  │★●│ │○ │ │○ │   "3 versions"            │     (only in dialog)
│  └──┘ └──┘ └──┘                           │
│                                            │
│  ┌────────────────────────────────────┐   │
│  │                                    │   │
│  │         [Selected Version]         │   │
│  │                                    │   │
│  └────────────────────────────────────┘   │
│                                            │
│  [Compare] [Remix] [Set Primary] [Download]│
└────────────────────────────────────────────┘
```

---

## Implementation Details

### New Component: `VersionBadge.tsx`

Small badge component showing version count:

```tsx
interface VersionBadgeProps {
  count: number;
  isPrimary?: boolean;
  onClick?: () => void;
}
```

- Circular badge, 20-24px diameter
- Shows number (2, 3, 4+)
- Appears in top-right corner of card
- Optional click handler to open versions

### New Component: `StackedCardEffect.tsx`

CSS-only visual effect for cards with versions:

```tsx
interface StackedCardEffectProps {
  hasVersions: boolean;
  versionCount: number;
  children: React.ReactNode;
}
```

- Adds pseudo-elements for stacked shadow effect
- 2-3px offset shadows behind card
- Subtle rotation on hover to "fan out" effect

### Modified: `StagedImageCard.tsx`

Changes:
1. Remove `VersionThumbnailStrip` from card body
2. Add `VersionBadge` to top-right corner
3. Wrap card in `StackedCardEffect` when versions > 1
4. Keep `VersionThumbnailStrip` only in detail dialog
5. Filter grid to show only primary versions (or first if no primary)

### Modified: `HistoryJobCard.tsx`

Changes:
1. Remove inline version strip
2. Add `VersionBadge` component
3. Add subtle "has versions" indicator icon
4. Keep version navigation in detail dialog only

### Data Fetching Changes

**Properties Page:**
- Fetch all jobs, group by `version_group_id`
- Display only primary version per group in grid
- Pass full version list to detail dialog

**History Page:**
- Option 1: Show all versions (current behavior with better badge)
- Option 2: Group by version and show only primary (cleaner)
- Recommend Option 2 with toggle to "Show all versions"

---

## Visual Specifications

### Version Badge
- Size: 20px diameter
- Background: `bg-black/60 backdrop-blur-sm`
- Text: `text-white text-[10px] font-medium`
- Position: `absolute top-2 right-2` (inside action bar area)

### Stacked Card Effect
```css
.stacked-card {
  position: relative;
}
.stacked-card::before {
  content: '';
  position: absolute;
  inset: 4px -4px -4px 4px;
  background: var(--card);
  border-radius: inherit;
  z-index: -1;
  opacity: 0.6;
  border: 1px solid var(--border);
}
.stacked-card.has-3-plus::after {
  content: '';
  position: absolute;
  inset: 8px -8px -8px 8px;
  background: var(--card);
  border-radius: inherit;
  z-index: -2;
  opacity: 0.3;
  border: 1px solid var(--border);
}
```

### Primary Badge (existing)
- Keep `★ Primary` badge in bottom-right
- Yellow/gold color: `bg-yellow-500`

---

## User Flows

### Flow 1: View versions on Properties page
1. User sees property with staged photos
2. Card with versions shows stacked effect + badge "2"
3. User clicks card → Detail dialog opens
4. Version thumbnails shown at top of dialog
5. User can click thumbnails to switch, set primary, remix

### Flow 2: View versions on History page
1. User sees history grid
2. Cards with versions show badge indicator
3. User clicks → Detail dialog with version navigation
4. User can switch between versions, set primary

### Flow 3: Quick identify primary
1. All cards show `★ Primary` badge if they are the primary version
2. Non-primary versions in a group are hidden from grid (or shown with indicator)

---

## Migration from Current Implementation

### Files to Modify

| File | Changes |
|------|---------|
| `StagedImageCard.tsx` | Remove inline strip, add badge, add stacked effect |
| `HistoryJobCard.tsx` | Remove inline strip, add badge |
| `VersionThumbnailStrip.tsx` | Keep as-is, only used in dialogs |
| `properties/[id]/page.tsx` | Group versions, show only primary in grid |

### New Files

| File | Purpose |
|------|---------|
| `VersionBadge.tsx` | Small count badge component |
| `StackedCardEffect.tsx` | CSS wrapper for stacked visual |

---

## Phases

### Phase 1: Remove Grid Disruption
1. Remove `VersionThumbnailStrip` from card body in both components
2. Move strip to detail dialog only
3. Add simple text badge showing version count

### Phase 2: Visual Polish
1. Create `VersionBadge` component
2. Create `StackedCardEffect` wrapper
3. Apply to both Properties and History pages

### Phase 3: Smart Grouping
1. Properties page: Show only primary per version group
2. History page: Add toggle "Group versions" / "Show all"
3. Ensure version count is accurate

---

## Success Criteria

1. Grid layout is never broken by version UI
2. Users can tell at a glance which cards have versions
3. Version navigation is still easily accessible (in dialog)
4. Primary version is clearly distinguished
5. Clean, professional appearance maintained
