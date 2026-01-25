# Email Design Refresh PRD

## Overview

Redesign Stager's email templates to follow a modern, clean aesthetic inspired by the reference design. The new design emphasizes white space, soft colors, card-based layouts, and a polished, professional feel.

## Design Analysis (Reference)

### Key Visual Elements

1. **Background**: Soft blue-gray (`#f0f4f8`) instead of pure white
2. **Cards**: White cards with subtle shadows and rounded corners (12-16px radius)
3. **Accent Color**: Bright blue (`#2563eb`) for CTAs and highlights
4. **Secondary Accent**: Soft pink/peach gradient for decorative elements
5. **Typography**: Clean sans-serif, strong hierarchy, dark gray text
6. **Buttons**: Rounded with arrow icons, blue fill or outlined
7. **Images**: Rounded corners, organized in grids/thumbnails
8. **Spacing**: Generous padding (24-32px), breathable layouts

### Design Principles

- **Minimalist**: Remove visual clutter, focus on content
- **Soft**: No harsh contrasts, gentle color transitions
- **Modern**: Rounded corners, subtle shadows, clean lines
- **Professional**: Polished but approachable

---

## Color Palette

### Primary Colors
| Name | Hex | Usage |
|------|-----|-------|
| Background | `#f0f4f8` | Email body background |
| Card White | `#ffffff` | Content cards |
| Text Primary | `#1e293b` | Headings, important text |
| Text Secondary | `#64748b` | Body text, descriptions |
| Text Muted | `#94a3b8` | Captions, timestamps |

### Accent Colors
| Name | Hex | Usage |
|------|-----|-------|
| Primary Blue | `#2563eb` | Primary buttons, links |
| Primary Hover | `#1d4ed8` | Button hover state |
| Soft Pink | `#fce7f3` | Decorative gradients |
| Soft Blue | `#dbeafe` | Decorative gradients, highlights |
| Success Green | `#10b981` | Success states |
| Warning Amber | `#f59e0b` | Warnings |
| Error Red | `#ef4444` | Errors |

### Gradients
```css
/* Decorative accent gradient */
background: linear-gradient(135deg, #fce7f3 0%, #dbeafe 100%);

/* Subtle card hover */
background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
```

---

## Typography

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```

### Type Scale
| Element | Size | Weight | Color | Line Height |
|---------|------|--------|-------|-------------|
| Hero Heading | 28px | 700 | `#1e293b` | 1.2 |
| Section Heading | 22px | 600 | `#1e293b` | 1.3 |
| Card Title | 18px | 600 | `#1e293b` | 1.4 |
| Body Text | 16px | 400 | `#64748b` | 1.6 |
| Small Text | 14px | 400 | `#94a3b8` | 1.5 |
| Button Text | 14px | 600 | varies | 1 |

---

## Component Specifications

### 1. Email Container

```
┌─────────────────────────────────────────┐
│         Background: #f0f4f8             │
│  ┌───────────────────────────────────┐  │
│  │      Max-width: 600px             │  │
│  │      Centered                     │  │
│  │      No border-radius (email)     │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### 2. Header Component

```
┌─────────────────────────────────────────┐
│  ┌─────────────────────────────────┐    │
│  │                                 │    │
│  │     [Logo]  Stager              │    │
│  │     Centered, 32px height       │    │
│  │     Padding: 32px 24px          │    │
│  │                                 │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

- Logo centered
- Background: white or transparent
- Bottom border: none (clean look)

### 3. Content Card

```
┌─────────────────────────────────────────┐
│  ┌─────────────────────────────────┐    │
│  │  Background: #ffffff            │    │
│  │  Border-radius: 16px            │    │
│  │  Shadow: 0 1px 3px rgba(0,0,0,  │    │
│  │          0.05)                  │    │
│  │  Padding: 32px                  │    │
│  │  Margin: 0 16px 16px            │    │
│  │                                 │    │
│  │  [Content here]                 │    │
│  │                                 │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

### 4. Hero Section (with gradient accent)

```
┌─────────────────────────────────────────┐
│  ┌─────────────────────────────────┐    │
│  │  ┌───────────────────────────┐  │    │
│  │  │ Gradient accent bar       │  │    │
│  │  │ Height: 4px               │  │    │
│  │  │ Border-radius: 2px        │  │    │
│  │  └───────────────────────────┘  │    │
│  │                                 │    │
│  │  Hero Heading                   │    │
│  │  28px, bold, #1e293b           │    │
│  │                                 │    │
│  │  Subtext paragraph              │    │
│  │  16px, #64748b                  │    │
│  │                                 │    │
│  │  [Primary Button →]             │    │
│  │                                 │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

### 5. Primary Button

```css
{
  background-color: #2563eb;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  padding: 12px 24px;
  border-radius: 8px;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

/* Arrow icon after text */
→ (or SVG arrow)
```

### 6. Secondary Button (Outlined)

```css
{
  background-color: transparent;
  color: #2563eb;
  font-size: 14px;
  font-weight: 600;
  padding: 12px 24px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  text-decoration: none;
}
```

### 7. Image Card / Thumbnail Grid

For showcasing staged images or feature highlights:

```
┌─────────────────────────────────────────┐
│  ┌──────────┐  ┌──────────┐             │
│  │          │  │          │             │
│  │  Image   │  │  Image   │  Title      │
│  │  80x80   │  │  80x80   │  Desc...    │
│  │  r: 12px │  │  r: 12px │             │
│  └──────────┘  └──────────┘             │
└─────────────────────────────────────────┘
```

- Image dimensions: 80x80px or 120x120px
- Border-radius: 12px
- Object-fit: cover

### 8. Feature List Item

```
┌─────────────────────────────────────────┐
│  ┌────┐                                 │
│  │ ✓  │  Feature title                  │
│  │    │  Description text in gray       │
│  └────┘                                 │
└─────────────────────────────────────────┘
```

- Checkmark in blue circle or simple icon
- Clear visual hierarchy

### 9. Stats/Metrics Display

```
┌─────────────────────────────────────────┐
│  ┌───────────┐  ┌───────────┐           │
│  │    12     │  │    5      │           │
│  │  Stagings │  │  Credits  │           │
│  │  ↑ 20%    │  │  left     │           │
│  └───────────┘  └───────────┘           │
└─────────────────────────────────────────┘
```

- Large number (24-28px, bold)
- Label below (14px, muted)
- Optional trend indicator

### 10. Footer

```
┌─────────────────────────────────────────┐
│                                         │
│     [f] [t] [in]   (social icons)       │
│                                         │
│     © 2025 Stager                       │
│     123 Main St, City, State            │
│                                         │
│     Unsubscribe | Preferences           │
│                                         │
│     (all text: 12px, #94a3b8)           │
│                                         │
└─────────────────────────────────────────┘
```

- Social icons: 24x24, subtle gray, with hover
- Text: 12-14px, muted color
- Links: Blue, no underline until hover
- Background: matches body or slightly darker

---

## Template-Specific Designs

### Welcome Email

```
┌─────────────────────────────────────────┐
│           [Stager Logo]                 │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐    │
│  │  ══════ (gradient accent)       │    │
│  │                                 │    │
│  │  Welcome to Stager, {name}!     │    │
│  │                                 │    │
│  │  You're ready to transform      │    │
│  │  empty rooms into beautifully   │    │
│  │  staged spaces...               │    │
│  │                                 │    │
│  │  [Stage Your First Photo →]     │    │
│  │                                 │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  What you can do:               │    │
│  │                                 │    │
│  │  🏠 Upload any property photo   │    │
│  │  🎨 Choose from 9 styles        │    │
│  │  ⚡ Get results in seconds      │    │
│  │                                 │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  Your Credits: 10               │    │
│  │  ▓▓▓▓▓▓▓▓▓▓░░░░░ 10 remaining   │    │
│  └─────────────────────────────────┘    │
│                                         │
│           [Footer]                      │
└─────────────────────────────────────────┘
```

### Staging Complete Email

```
┌─────────────────────────────────────────┐
│           [Stager Logo]                 │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐    │
│  │                                 │    │
│  │  ✓ Your staging is ready!       │    │
│  │                                 │    │
│  │  ┌─────────────────────────┐    │    │
│  │  │                         │    │    │
│  │  │    [Staged Image]       │    │    │
│  │  │    Rounded corners      │    │    │
│  │  │    Shadow               │    │    │
│  │  │                         │    │    │
│  │  └─────────────────────────┘    │    │
│  │                                 │    │
│  │  Living Room • Modern Style     │    │
│  │                                 │    │
│  │  [View Full Image →]            │    │
│  │  [Stage Another Photo]          │    │
│  │                                 │    │
│  └─────────────────────────────────┘    │
│                                         │
│           [Footer]                      │
└─────────────────────────────────────────┘
```

### Weekly Digest Email

```
┌─────────────────────────────────────────┐
│           [Stager Logo]                 │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐    │
│  │  Your week in review            │    │
│  │  Jan 15 - Jan 22, 2025          │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌──────────┐  ┌──────────┐             │
│  │    8     │  │   15     │             │
│  │ Stagings │  │ Credits  │             │
│  │  ↑ 60%   │  │   left   │             │
│  └──────────┘  └──────────┘             │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  Your staged photos             │    │
│  │                                 │    │
│  │  [img] [img] [img] [img]        │    │
│  │  (thumbnail grid)               │    │
│  │                                 │    │
│  │  [View All in History →]        │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  💡 New Feature                 │    │
│  │                                 │    │
│  │  Batch Staging is here!         │    │
│  │  Stage up to 10 photos at once. │    │
│  │                                 │    │
│  │  [Try It Now →]                 │    │
│  └─────────────────────────────────┘    │
│                                         │
│           [Footer]                      │
└─────────────────────────────────────────┘
```

---

## Implementation Checklist

### Phase 1: Update Base Components
- [ ] Update `styles.ts` with new color palette
- [ ] Redesign `Layout.tsx` with soft background
- [ ] Redesign `Header.tsx` - cleaner, centered logo
- [ ] Redesign `Footer.tsx` - social icons, cleaner layout
- [ ] Redesign `Button.tsx` - new styles with arrow option
- [ ] Redesign `Card.tsx` - rounded corners, subtle shadow
- [ ] Add new `GradientAccent.tsx` component
- [ ] Add new `StatCard.tsx` component
- [ ] Add new `ThumbnailGrid.tsx` component

### Phase 2: Update Email Templates
- [ ] Update all 4 onboarding emails
- [ ] Update all 8 transactional emails
- [ ] Update all 3 re-engagement emails
- [ ] Update weekly digest email

### Phase 3: Testing & Polish
- [ ] Test all templates in preview server
- [ ] Test in Gmail, Outlook, Apple Mail
- [ ] Test dark mode rendering
- [ ] Send test emails to verify rendering

---

## Email Client Compatibility Notes

1. **Rounded corners**: Use `border-radius` - works in most clients
2. **Shadows**: Use `box-shadow` - degrades gracefully
3. **Gradients**: Use `background` with fallback color
4. **SVG icons**: Inline SVG or image fallback
5. **Flexbox**: Avoid - use tables for layout
6. **Web fonts**: Avoid - stick to system fonts

---

## Assets Needed

1. **Stager Logo** - SVG or PNG, transparent background
2. **Social Icons** - Facebook, Twitter, LinkedIn, Instagram (24x24)
3. **Arrow Icon** - For buttons (→ or SVG)
4. **Checkmark Icon** - For feature lists
5. **Placeholder Images** - For preview/testing

---

## Success Criteria

- [ ] All emails render correctly in top 5 email clients
- [ ] Design matches reference aesthetic (approved by stakeholder)
- [ ] Consistent branding across all 17 templates
- [ ] Accessible color contrast (WCAG AA)
- [ ] Mobile responsive (320px - 600px)
