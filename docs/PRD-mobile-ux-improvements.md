# Product Requirements Document: Mobile UX Improvements

**Product:** Stager AI - Virtual Staging Platform
**Version:** 1.0
**Date:** January 17, 2026
**Author:** Engineering Team
**Status:** Draft

---

## Executive Summary

This PRD outlines the mobile user experience improvements required for the Stager AI platform. The current application has a solid foundation for responsive design but requires targeted improvements to deliver a first-class mobile experience for real estate professionals who frequently work in the field.

### Goals

1. Achieve full mobile usability across all core features
2. Optimize touch interactions and navigation patterns
3. Ensure accessibility compliance for mobile users
4. Improve performance on mobile networks and devices

---

## Current State Analysis

### Technology Stack

- **Framework:** Next.js 16.1.1 with React 19.2.3 (App Router)
- **Styling:** Tailwind CSS v4 with shadcn/ui components
- **Platform:** Progressive Web Application (Vercel deployment)

### Existing Mobile Support

| Component | Status | Notes |
|-----------|--------|-------|
| Sidebar Navigation | Good | Collapses to slide-in sheet on mobile |
| Grid Layouts | Good | Uses responsive breakpoints (sm/md/lg) |
| Typography | Good | Responsive font sizes implemented |
| Forms & Dialogs | Fair | Some fixed widths need adjustment |

### Critical Issues Identified

| Issue | Severity | Affected Pages |
|-------|----------|----------------|
| Stats cards not responsive | High | History, Properties |
| Hover-only actions inaccessible | High | Property cards |
| Fixed-width dropdowns overflow | Medium | History, Properties filters |
| Floating search overflow | Medium | All dashboard pages |
| Touch targets too small | Medium | Various buttons and controls |
| No safe area support | Low | All pages (notched devices) |

---

## Requirements

### 1. Responsive Stats Cards

**Priority:** P0 - Critical
**Affected Files:**
- `src/app/(dashboard)/history/HistoryPageClient.tsx`
- `src/app/(dashboard)/properties/PropertiesListClient.tsx`

**Current State:**
```tsx
// History page - always 3 columns
<div className="grid grid-cols-3 gap-4">

// Properties page - always 2 columns
<div className="grid grid-cols-2 gap-4">
```

**Required Changes:**
```tsx
// History page - responsive grid
<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">

// Properties page - responsive grid
<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
```

**Acceptance Criteria:**
- [ ] Stats cards stack vertically on screens < 640px
- [ ] Gap reduces to 12px on mobile for tighter spacing
- [ ] Cards maintain readability at all breakpoints
- [ ] Touch targets on clickable stats meet 44x44px minimum

---

### 2. Touch-Accessible Property Card Actions

**Priority:** P0 - Critical
**Affected Files:**
- `src/components/properties/PropertyCard.tsx`

**Current State:**
Action buttons use `opacity-0 group-hover:opacity-100` which makes them invisible and inaccessible on touch devices.

**Required Changes:**
Implement a dual interaction pattern:
- **Desktop:** Keep hover reveal behavior
- **Mobile:** Always show action buttons in a compact bar

**Implementation Approach:**
```tsx
// Action buttons container
<div className="
  flex gap-2
  opacity-100 lg:opacity-0
  lg:group-hover:opacity-100
  transition-opacity
">
```

**Acceptance Criteria:**
- [ ] Action buttons visible by default on mobile/tablet (< 1024px)
- [ ] Hover behavior preserved on desktop (>= 1024px)
- [ ] Action buttons have minimum 44x44px touch targets
- [ ] Visual hierarchy maintained (primary vs secondary actions)

---

### 3. Responsive Filter Controls

**Priority:** P1 - High
**Affected Files:**
- `src/app/(dashboard)/history/HistoryPageClient.tsx`
- `src/app/(dashboard)/properties/PropertiesListClient.tsx`

**Current State:**
```tsx
// Fixed widths that overflow on mobile
<Select className="w-[180px]">
<Select className="w-[165px]">
<Input className="min-w-[200px]">
```

**Required Changes:**
```tsx
// Responsive widths
<Select className="w-full sm:w-[180px]">
<Select className="w-full sm:w-[165px]">
<Input className="w-full sm:min-w-[200px]">
```

**Additional Mobile Optimizations:**
- Stack filter controls vertically on mobile
- Add horizontal scroll for filter pills if needed
- Implement collapsible filter panel for mobile

**Acceptance Criteria:**
- [ ] Filter controls don't overflow viewport on any screen size
- [ ] Full-width inputs on mobile (< 640px)
- [ ] Controls remain usable and accessible
- [ ] Filter state preserved during responsive transitions

---

### 4. Floating Search Responsiveness

**Priority:** P1 - High
**Affected Files:**
- `src/components/layout/FloatingControls.tsx`

**Current State:**
```tsx
// Fixed width that may overflow
<div className="w-10 group-focus-within:w-80">
```

**Required Changes:**
```tsx
// Responsive width with mobile considerations
<div className="
  w-10
  group-focus-within:w-[calc(100vw-3rem)]
  sm:group-focus-within:w-80
">
```

**Mobile-Specific Behavior:**
- Search expands to nearly full width on mobile
- Results dropdown respects viewport boundaries
- Consider bottom-sheet pattern for mobile search results

**Acceptance Criteria:**
- [ ] Search bar doesn't overflow viewport
- [ ] Search results contained within screen bounds
- [ ] Keyboard doesn't obscure search results on mobile
- [ ] Clear/close button easily accessible

---

### 5. Touch Target Optimization

**Priority:** P1 - High
**Affected Files:**
- Various component files throughout the application

**WCAG 2.2 Requirements:**
- Minimum touch target size: 44x44px (Level AA)
- Recommended touch target size: 48x48px (Level AAA)

**Components Requiring Adjustment:**

| Component | Current Size | Required Size |
|-----------|--------------|---------------|
| Comparison slider handle | 32x32px (w-8 h-8) | 44x44px (w-11 h-11) |
| Icon buttons | 36x36px | 44x44px minimum |
| Dropdown triggers | Variable | 44px minimum height |
| Mobile menu button | 40x40px | 44x44px |

**Implementation:**
```tsx
// Before
<button className="w-8 h-8">

// After - with touch target expansion
<button className="w-8 h-8 min-w-[44px] min-h-[44px]">
// Or use padding to expand touch area
<button className="w-8 h-8 p-2 -m-2">
```

**Acceptance Criteria:**
- [ ] All interactive elements have 44x44px minimum touch target
- [ ] Visual size can remain smaller while touch area is larger
- [ ] Touch targets don't overlap or cause mis-taps
- [ ] Spacing between targets is at least 8px

---

### 6. Safe Area Support

**Priority:** P2 - Medium
**Affected Files:**
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/(dashboard)/DashboardShell.tsx`

**Current State:**
No explicit safe area handling for devices with notches, home indicators, or rounded corners.

**Required Changes:**

**Viewport Meta (layout.tsx):**
```tsx
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}
```

**CSS Variables (globals.css):**
```css
:root {
  --safe-area-inset-top: env(safe-area-inset-top, 0px);
  --safe-area-inset-right: env(safe-area-inset-right, 0px);
  --safe-area-inset-bottom: env(safe-area-inset-bottom, 0px);
  --safe-area-inset-left: env(safe-area-inset-left, 0px);
}
```

**Fixed Position Elements:**
```tsx
// Mobile menu button
<button className="fixed top-4 left-4
  top-[calc(var(--safe-area-inset-top)+1rem)]
  left-[calc(var(--safe-area-inset-left)+1rem)]">

// Floating controls
<div className="fixed top-4 right-6
  top-[calc(var(--safe-area-inset-top)+1rem)]
  right-[calc(var(--safe-area-inset-right)+1.5rem)]">
```

**Acceptance Criteria:**
- [ ] Content doesn't clip behind notches or home indicators
- [ ] Fixed elements positioned correctly on all devices
- [ ] Bottom navigation/controls avoid home indicator area
- [ ] Works on iOS Safari, Chrome, and PWA mode

---

### 7. Mobile Content Spacing

**Priority:** P2 - Medium
**Affected Files:**
- `src/app/(dashboard)/DashboardShell.tsx`
- Various page components

**Current State:**
```tsx
<main className="px-6 pt-24 pb-6">
```

**Issues:**
- `pt-24` (96px) takes significant mobile screen real estate
- Fixed padding doesn't adapt to mobile needs

**Required Changes:**
```tsx
<main className="px-4 sm:px-6 pt-16 sm:pt-24 pb-4 sm:pb-6">
```

**Acceptance Criteria:**
- [ ] Reduced horizontal padding on mobile (16px vs 24px)
- [ ] Reduced top padding on mobile (64px vs 96px)
- [ ] Content remains readable and properly spaced
- [ ] No content cutoff or overlap with fixed elements

---

### 8. Mobile Navigation Enhancements

**Priority:** P2 - Medium
**Affected Files:**
- `src/app/(dashboard)/DashboardShell.tsx`
- `src/components/layout/Sidebar.tsx`

**Improvements:**
1. **Swipe Gestures:** Implement swipe-right to open sidebar
2. **Close on Navigation:** Auto-close sidebar after selecting menu item
3. **Backdrop Click:** Close sidebar when tapping backdrop
4. **Focus Trap:** Trap focus within open mobile sidebar

**Implementation Notes:**
```tsx
// Swipe detection (using touch events or library like @use-gesture)
const bind = useDrag(({ movement: [mx], last }) => {
  if (last && mx > 50) setMobileOpen(true)
})

// Auto-close on navigation
const handleNavClick = () => {
  setMobileOpen(false)
}
```

**Acceptance Criteria:**
- [ ] Swipe gesture opens sidebar from left edge
- [ ] Sidebar closes on menu item selection
- [ ] Backdrop click/tap closes sidebar
- [ ] Escape key closes sidebar
- [ ] Focus returns to trigger element on close

---

### 9. Image Handling Optimization

**Priority:** P2 - Medium
**Affected Files:**
- `src/components/staging/ImageUploader.tsx`
- `src/components/staging/ComparisonSlider.tsx`
- `src/components/properties/PropertyCard.tsx`

**Improvements:**

**Responsive Image Sizing:**
```tsx
// ImageUploader - adapt height for mobile
<div className="h-64 sm:h-80">

// Use Next.js Image with responsive sizes
<Image
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
/>
```

**Comparison Slider Touch Improvements:**
```tsx
// Larger touch zone for slider handle
<div className="
  w-11 h-11 sm:w-8 sm:h-8
  touch-none
  cursor-ew-resize
">
```

**Acceptance Criteria:**
- [ ] Images load appropriate size for viewport
- [ ] Comparison slider handle easily draggable on touch
- [ ] Image upload area sized appropriately for mobile
- [ ] Pinch-to-zoom works on image previews

---

### 10. Mobile Performance Optimizations

**Priority:** P3 - Low
**Affected Files:**
- Various component files
- `next.config.ts`

**Improvements:**

1. **Lazy Loading:**
   - Implement `loading="lazy"` for below-fold images
   - Use `React.lazy()` for heavy components
   - Defer non-critical JavaScript

2. **Reduced Motion:**
   ```css
   @media (prefers-reduced-motion: reduce) {
     * {
       animation-duration: 0.01ms !important;
       transition-duration: 0.01ms !important;
     }
   }
   ```

3. **Network-Aware Loading:**
   ```tsx
   // Detect slow connections
   const connection = navigator.connection
   if (connection?.effectiveType === '2g') {
     // Load lower quality images
   }
   ```

**Acceptance Criteria:**
- [ ] First Contentful Paint < 2.5s on 4G
- [ ] Time to Interactive < 5s on 4G
- [ ] Reduced animations for users who prefer reduced motion
- [ ] Graceful degradation on slow connections

---

## Implementation Priority Matrix

| Priority | Requirements | Estimated Effort |
|----------|-------------|------------------|
| P0 | 1, 2 | Small (2-4 hours) |
| P1 | 3, 4, 5 | Medium (1-2 days) |
| P2 | 6, 7, 8, 9 | Medium (2-3 days) |
| P3 | 10 | Large (ongoing) |

---

## Testing Requirements

### Device Testing Matrix

| Device Category | Specific Devices | Priority |
|-----------------|------------------|----------|
| iOS Phones | iPhone 14/15 Pro, iPhone SE | High |
| Android Phones | Pixel 7/8, Samsung Galaxy S23 | High |
| iOS Tablets | iPad Pro, iPad Air | Medium |
| Android Tablets | Samsung Galaxy Tab | Low |

### Browser Testing

| Browser | Platform | Priority |
|---------|----------|----------|
| Safari | iOS | High |
| Chrome | Android | High |
| Safari | macOS | Medium |
| Chrome | Desktop | Medium |
| PWA Mode | iOS/Android | High |

### Automated Testing

```typescript
// Example viewport tests with Playwright
const viewports = [
  { name: 'mobile-portrait', width: 375, height: 667 },
  { name: 'mobile-landscape', width: 667, height: 375 },
  { name: 'tablet-portrait', width: 768, height: 1024 },
  { name: 'tablet-landscape', width: 1024, height: 768 },
]

for (const viewport of viewports) {
  test(`renders correctly on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto('/dashboard')
    await expect(page.locator('[data-testid="sidebar"]')).not.toBeVisible()
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()
  })
}
```

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Mobile Usability Score (Lighthouse) | TBD | > 90 |
| Mobile Bounce Rate | TBD | < 40% |
| Mobile Session Duration | TBD | > 3 min |
| Touch Target Compliance | ~60% | 100% |
| Mobile Conversion Rate | TBD | Within 20% of desktop |

---

## Rollout Plan

### Phase 1: Critical Fixes
- Responsive stats cards
- Touch-accessible property actions
- Filter control overflow fixes

### Phase 2: Enhanced Mobile UX
- Floating search improvements
- Touch target optimization
- Safe area support

### Phase 3: Polish & Performance
- Navigation gestures
- Image optimizations
- Performance improvements

---

## Appendix A: Tailwind Breakpoint Reference

| Breakpoint | Minimum Width | CSS |
|------------|---------------|-----|
| `sm` | 640px | `@media (min-width: 640px)` |
| `md` | 768px | `@media (min-width: 768px)` |
| `lg` | 1024px | `@media (min-width: 1024px)` |
| `xl` | 1280px | `@media (min-width: 1280px)` |
| `2xl` | 1536px | `@media (min-width: 1536px)` |

---

## Appendix B: Color Contrast Requirements

Ensure all text meets WCAG AA standards:
- Normal text: 4.5:1 contrast ratio
- Large text (18px+ or 14px+ bold): 3:1 contrast ratio
- UI components: 3:1 contrast ratio

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-17 | Engineering | Initial draft |
