# PRD: Large Component Decomposition

## Overview

This document outlines a plan to decompose large components (300+ lines) into smaller, more maintainable pieces following React best practices: single responsibility, composition over complexity, and improved testability.

---

## Target Components

| Component | Lines | Priority | Complexity |
|-----------|-------|----------|------------|
| `BillingPage` | 369 | High | Medium |
| `MaskingTool` | 360 | Medium | High |
| `HistoryListItem` | 354 | High | Medium |
| `Sidebar` | 346 | Medium | Low |
| `DashboardPage` | 345 | Medium | Medium |
| `CropRotateTool` | 322 | Low | High |
| `QuickStageLayout` | 293 | Medium | Medium |
| `FloatingControls` | 289 | Low | Low |

---

## Phase 1: BillingPage Decomposition

**File:** `src/app/(dashboard)/billing/page.tsx` (369 lines)

### Current Structure
- Success/Cancel message alerts
- Credit balance card with conditional styling
- Usage stats grid (3 cards)
- Credit top-up section
- Subscription plans section
- Usage history list

### Proposed Components

```
src/app/(dashboard)/billing/
├── page.tsx                          # ~50 lines - Data fetching + layout
├── _components/
│   ├── BillingAlerts.tsx             # ~50 lines - Success/cancel messages
│   ├── CreditBalanceCard.tsx         # ~70 lines - Credit display with status
│   ├── UsageStatsGrid.tsx            # ~50 lines - Three stat cards
│   ├── UsageHistoryList.tsx          # ~80 lines - Recent usage table
│   └── UsageHistoryItem.tsx          # ~40 lines - Single usage row
```

### Benefits
- Server component stays thin (data fetching only)
- Each section is independently testable
- Easier to modify individual billing features
- Reusable `CreditBalanceCard` for other pages

---

## Phase 2: HistoryListItem Decomposition

**File:** `src/app/(dashboard)/history/_components/HistoryListItem.tsx` (354 lines)

### Current Structure
- List item display with thumbnail, info, status
- Action buttons (favorite, download, more menu)
- Property assignment dropdown
- Full-screen detail dialog with comparison slider

### Proposed Components

```
src/app/(dashboard)/history/_components/
├── HistoryListItem.tsx               # ~80 lines - Container with state
├── HistoryItemThumbnail.tsx          # ~40 lines - Image with favorite indicator
├── HistoryItemInfo.tsx               # ~30 lines - Room type, style, date
├── HistoryItemActions.tsx            # ~60 lines - Action buttons row
├── HistoryItemMenu.tsx               # ~70 lines - Dropdown with property assign
├── HistoryDetailDialog.tsx           # ~80 lines - Full dialog component
└── StatusBadge.tsx                   # ~40 lines - Reusable status badge
```

### Benefits
- Dialog logic separated from list item
- `StatusBadge` reusable across app
- Action buttons testable in isolation
- Cleaner props flow

---

## Phase 3: Sidebar Decomposition

**File:** `src/components/layout/Sidebar.tsx` (346 lines)

### Current Structure
- Logo section
- Main navigation links
- Credits badge (collapsed/expanded variants)
- Collapse toggle button
- User avatar with dropdown menu

### Proposed Components

```
src/components/layout/sidebar/
├── Sidebar.tsx                       # ~60 lines - Container with layout
├── SidebarLogo.tsx                   # ~25 lines - Logo with branding
├── SidebarNavigation.tsx             # ~50 lines - Navigation links
├── SidebarNavItem.tsx                # ~40 lines - Single nav item with tooltip
├── SidebarCredits.tsx                # ~60 lines - Credits display
├── SidebarCollapseButton.tsx         # ~30 lines - Toggle button
├── SidebarUserMenu.tsx               # ~70 lines - Avatar + dropdown
└── index.ts                          # Re-export Sidebar
```

### Benefits
- Each section follows single responsibility
- Collapsed/expanded logic encapsulated
- User menu reusable if needed elsewhere
- Easier to add new nav sections

---

## Phase 4: MaskingTool Decomposition

**File:** `src/components/staging/preprocessing/tools/MaskingTool.tsx` (360 lines)

### Current Structure (Already Partially Decomposed)
- Container size tracking
- Image dimension calculations
- AI segmentation logic
- Brush drawing logic
- Mouse/touch event handlers
- Tool mode switching

### Proposed Refactoring

```
src/components/staging/preprocessing/tools/masking/
├── MaskingTool.tsx                   # ~100 lines - Main container
├── hooks/
│   ├── useContainerSize.ts           # ~30 lines - Resize observer
│   ├── useImageDimensions.ts         # ~40 lines - Image loading + sizing
│   └── useSegmentation.ts            # ~60 lines - AI segmentation logic
├── MaskingToolActions.tsx            # ~40 lines - Clear/Cancel/Apply buttons
└── (existing components already extracted)
```

### Key Changes
- Extract container/image sizing into custom hooks
- Move segmentation API call into `useSegmentation` hook
- Keep existing `MaskCanvas`, `AIDetectionControls`, `BrushControls`

### Benefits
- Hooks are reusable for other canvas tools
- Segmentation logic testable independently
- Main component focuses on orchestration

---

## Phase 5: DashboardPage Decomposition

**File:** `src/app/(dashboard)/dashboard/page.tsx` (345 lines)

### Proposed Components

```
src/app/(dashboard)/dashboard/
├── page.tsx                          # ~40 lines - Data fetching
├── _components/
│   ├── WelcomeHeader.tsx             # ~30 lines - Greeting + quick actions
│   ├── StatsOverview.tsx             # ~60 lines - Key metrics cards
│   ├── RecentStagings.tsx            # ~80 lines - Recent work grid
│   ├── RecentStagingCard.tsx         # ~50 lines - Single staging preview
│   ├── QuickActions.tsx              # ~40 lines - Action buttons
│   └── CreditUsageChart.tsx          # ~50 lines - Usage visualization
```

---

## Phase 6: CropRotateTool Decomposition

**File:** `src/components/staging/preprocessing/tools/CropRotateTool.tsx` (322 lines)

### Proposed Refactoring

```
src/components/staging/preprocessing/tools/crop-rotate/
├── CropRotateTool.tsx                # ~80 lines - Main container
├── hooks/
│   ├── useCropState.ts               # ~50 lines - Crop rectangle logic
│   ├── useRotation.ts                # ~40 lines - Rotation state
│   └── useImageTransform.ts          # ~60 lines - Canvas transform logic
├── CropCanvas.tsx                    # ~50 lines - Canvas rendering
├── CropControls.tsx                  # ~40 lines - Rotation/reset buttons
└── CropHandles.tsx                   # ~40 lines - Resize handles
```

---

## Implementation Strategy

### Priority Order
1. **BillingPage** - High impact, straightforward extraction
2. **HistoryListItem** - High usage, clear separation points
3. **Sidebar** - Moderate complexity, reusable pieces
4. **MaskingTool** - Complex but well-structured
5. **DashboardPage** - Standard widget extraction
6. **CropRotateTool** - Complex canvas logic

### Guidelines

1. **Extract from bottom-up**: Start with leaf components (no children), work up
2. **Props over context**: Prefer explicit props unless state is truly global
3. **Co-locate related files**: Keep `_components/` folders next to pages
4. **Barrel exports**: Use `index.ts` for cleaner imports
5. **Preserve memoization**: Keep `memo()` on extracted components where beneficial

### Testing Strategy

For each extracted component:
- Unit test pure rendering logic
- Integration test with parent component
- Snapshot test for UI stability

---

## Success Metrics

| Metric | Before | Target |
|--------|--------|--------|
| Largest component | 369 lines | <150 lines |
| Components >200 lines | 15+ | <5 |
| Average component size | ~150 lines | ~80 lines |
| Test coverage | - | +20% on refactored components |

---

## Timeline

| Phase | Components | Effort |
|-------|------------|--------|
| 1 | BillingPage | 1-2 hours |
| 2 | HistoryListItem | 1-2 hours |
| 3 | Sidebar | 1-2 hours |
| 4 | MaskingTool | 2-3 hours |
| 5 | DashboardPage | 1-2 hours |
| 6 | CropRotateTool | 2-3 hours |

**Total Estimated Effort:** 8-14 hours

---

## Notes

- Do not break existing functionality; each phase should be a complete refactor
- Run full test suite after each phase
- Update imports across codebase after moving files
- Consider adding Storybook stories for new UI components
