---
name: CarbonDesk Unified System
colors:
  surface: '#f9f9ff'
  surface-dim: '#cfdaf2'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dee8ff'
  surface-container-highest: '#d8e3fb'
  on-surface: '#111c2d'
  on-surface-variant: '#414844'
  inverse-surface: '#263143'
  inverse-on-surface: '#ecf1ff'
  outline: '#717973'
  outline-variant: '#c1c8c2'
  surface-tint: '#3f6653'
  primary: '#012d1d'
  on-primary: '#ffffff'
  primary-container: '#1b4332'
  on-primary-container: '#86af99'
  inverse-primary: '#a5d0b9'
  secondary: '#006c48'
  on-secondary: '#ffffff'
  secondary-container: '#92f7c3'
  on-secondary-container: '#00734d'
  tertiary: '#002a36'
  on-tertiary: '#ffffff'
  tertiary-container: '#004253'
  on-tertiary-container: '#46b3d5'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c1ecd4'
  primary-fixed-dim: '#a5d0b9'
  on-primary-fixed: '#002114'
  on-primary-fixed-variant: '#274e3d'
  secondary-fixed: '#92f7c3'
  secondary-fixed-dim: '#75daa8'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005235'
  tertiary-fixed: '#b7eaff'
  tertiary-fixed-dim: '#6cd3f7'
  on-tertiary-fixed: '#001f28'
  on-tertiary-fixed-variant: '#004e61'
  background: '#f9f9ff'
  on-background: '#111c2d'
  surface-variant: '#d8e3fb'
typography:
  display:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  sidebar-width: 260px
  container-max: 1440px
---

## Brand & Style
The design system is rooted in **Corporate Modernism** with a focus on environmental stewardship and industrial reliability. It serves an enterprise B2B audience that demands precision, data integrity, and professional authority.

The aesthetic prioritizes clarity over decoration. It utilizes a structured, systematic approach to information density, ensuring that complex carbon credit workflows feel manageable. The UI relies on high-quality typography, ample whitespace in document views, and a disciplined use of color to signify status and progress. The emotional goal is to evoke a sense of calm control within a high-stakes, data-driven environment.

## Colors
The palette is dominated by "Deep Forest Green" to anchor the platform in the environmental sector while maintaining the gravity of a financial tool. 

- **Primary (#1B4332):** Reserved for high-level navigation, primary actions, and brand touchpoints.
- **Secondary (#52B788):** Used for growth indicators, positive action buttons, and active selection states.
- **Neutrals:** A range of Slate Grays provides the scaffolding. #F1F5F9 is used for backgrounds to reduce eye strain compared to pure white, while #1E293B ensures high-contrast text readability.
- **Status Colors:** Applied strictly to data badges and validation states. Do not use these for decorative purposes to maintain their semantic meaning.

## Typography
This design system utilizes **Inter** for its exceptional legibility in data-heavy SaaS interfaces. 

- **Scale:** The hierarchy is tight. For enterprise dashboards, `body-md` (14px) is the standard for most content to allow for higher information density.
- **Data Tables:** Use `body-sm` for tabular data to maximize visible rows.
- **Labels:** Use `label-md` for section headers in sidebars and overline text to create clear visual separation without adding bulk.
- **Mobile:** Scale `display` down to 30px and `headline-lg` to 24px for handset devices to prevent excessive wrapping.

## Layout & Spacing
The layout follows a **Fixed-Fluid Hybrid** model. The sidebar remains fixed at 260px, while the main content area is fluid with a maximum container width of 1440px to ensure line lengths remain readable on ultrawide monitors.

- **Grid:** Use a 12-column grid for dashboard layouts.
- **Rhythm:** An 8px base unit (4px for micro-adjustments) governs all margins and padding. 
- **Margins:** Use 24px (lg) margins for main page padding and 16px (md) for internal card padding.
- **Breakpoints:**
  - Mobile: < 768px (Sidebar collapses to a hamburger menu).
  - Tablet: 768px - 1024px (Sidebar collapses to icons).
  - Desktop: > 1024px (Full expanded sidebar).

## Elevation & Depth
Depth is communicated through **Tonal Layers** and subtle "low-contrast outlines" rather than heavy shadows.

- **Level 0 (Canvas):** #F8FAFC. The lowest layer.
- **Level 1 (Cards/Surface):** #FFFFFF with a 1px border of #E2E8F0. No shadow. Used for the primary content blocks.
- **Level 2 (Overlays/Dropdowns):** #FFFFFF with a soft ambient shadow (0px 4px 12px rgba(30, 41, 59, 0.08)) and a 1px border.
- **Level 3 (Modals):** #FFFFFF with a deeper shadow (0px 12px 24px rgba(30, 41, 59, 0.12)).

Avoid using shadows on buttons or static cards; use borders to maintain a "flat professional" look.

## Shapes
The shape language is **Soft** and systematic. 

- **Components (Buttons, Inputs):** 0.25rem (4px) radius. This provides a modern feel without appearing too "consumer-grade" or playful.
- **Containers (Cards, Modals):** 0.5rem (8px) radius.
- **Status Badges:** 1rem (Pill-shaped) to clearly distinguish them from clickable buttons.
- **GIS Controls:** Square corners or minimal 2px rounding to reflect the precision of mapping tools.

## Components
- **Sidebar:** Dark theme (#1B4332). Nav items use a ghost hover state. Active state indicated by a 4px left-border in Secondary Green.
- **Data Tables:** Zebra striping is discouraged. Use subtle 1px bottom borders (#F1F5F9). Headers should be `label-md` with a light gray background.
- **Buttons:** 
  - *Primary:* Solid #1B4332, white text.
  - *Secondary:* Outline #1B4332, transparent background.
  - *Success:* Solid #52B788, white text (used for "Commit" or "Approve").
- **Input Fields:** 1px border (#CBD5E1). On focus, border changes to #52B788 with a 2px soft outer glow.
- **Status Badges:** Use a light background (10% opacity of the status color) with high-contrast text for accessibility.
- **GIS/Map Controls:** Floating white panels with 1px borders, positioned in the top-right or bottom-right of the map view.
- **Tabs:** Underline style for the project workspace. The active tab uses a 2px #52B788 bottom border and bold text.
- **File Upload:** A dashed #CBD5E1 border with a #F8FAFC background. Use a "Cloud Upload" icon in the center.