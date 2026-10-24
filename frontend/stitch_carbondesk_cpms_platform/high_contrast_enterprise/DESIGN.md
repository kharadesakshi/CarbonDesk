---
name: High-Contrast Enterprise
colors:
  surface: '#fbf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fbf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae8e7'
  surface-container-highest: '#e4e2e1'
  on-surface: '#1b1c1c'
  on-surface-variant: '#414844'
  inverse-surface: '#303030'
  inverse-on-surface: '#f3f0f0'
  outline: '#717973'
  outline-variant: '#c1c8c2'
  surface-tint: '#3f6653'
  primary: '#012d1d'
  on-primary: '#ffffff'
  primary-container: '#1b4332'
  on-primary-container: '#86af99'
  inverse-primary: '#a5d0b9'
  secondary: '#2c694e'
  on-secondary: '#ffffff'
  secondary-container: '#aeeecb'
  on-secondary-container: '#316e52'
  tertiary: '#3e1e00'
  on-tertiary: '#ffffff'
  tertiary-container: '#5e3000'
  on-tertiary-container: '#f48c24'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c1ecd4'
  primary-fixed-dim: '#a5d0b9'
  on-primary-fixed: '#002114'
  on-primary-fixed-variant: '#274e3d'
  secondary-fixed: '#b1f0ce'
  secondary-fixed-dim: '#95d4b3'
  on-secondary-fixed: '#002114'
  on-secondary-fixed-variant: '#0e5138'
  tertiary-fixed: '#ffdcc3'
  tertiary-fixed-dim: '#ffb77d'
  on-tertiary-fixed: '#2f1500'
  on-tertiary-fixed-variant: '#6e3900'
  background: '#fbf9f8'
  on-background: '#1b1c1c'
  surface-variant: '#e4e2e1'
  sidebar-bg: '#1B4332'
  sidebar-text: '#FFFFFF'
  content-bg: '#FFFFFF'
  surface-neutral: '#F8F9FA'
  success-vibrant: '#2D6A4F'
  warning-amber: '#B45309'
  error-red: '#DC2626'
  border-subtle: '#E5E7EB'
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
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
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
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
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
  gutter-md: 16px
  margin-lg: 24px
  sidebar-width: 260px
  max-width: 1440px
---

## Brand & Style

The design system is a refinement of a professional B2B platform, shifting toward **Corporate Modernism** with an uncompromising focus on accessibility and legibility. It is designed for high-stakes enterprise environments where data clarity and institutional trust are paramount.

The aesthetic follows a **Minimalist** approach with high-contrast accents. It prioritizes the "information first" philosophy, utilizing a stark white canvas for the primary workspace to reduce cognitive load, while using a deep, authoritative forest green for structural elements. The visual language is disciplined, stripping away unnecessary shadows and gradients in favor of crisp borders and clear hierarchy. The emotional response is one of precision, environmental stewardship, and professional reliability.

## Colors

The color palette is architected for WCAG AA compliance and clear semantic signaling. 

- **Primary & Navigation:** The Sidebar utilizes a deep green (#1B4332) to provide a strong structural anchor. All text and icons within the sidebar are pure white to ensure a contrast ratio exceeding 7:1.
- **Surface Strategy:** The content background is pure white (#FFFFFF), providing the highest possible contrast for primary text (#333333). A very light neutral (#F8F9FA) is used for secondary containers and background grouping.
- **Action & Status:** Success states and primary actions use a vibrant green, strictly maintained for accessibility. Warning and Error states utilize Amber and Red with sufficient darkness to remain legible against white backgrounds.
- **Contrast Indicators:** Active navigation states and focus rings use high-contrast variants of the primary green or secondary accents to ensure visibility for all users.

## Typography

The design system utilizes **Inter** exclusively. Its neutral, systematic aesthetic and high x-height make it the ideal choice for a data-dense SaaS environment.

Typography is optimized for readability over density where possible. All labels and overlines utilize increased font weights (600+) to maintain visual hierarchy on the white background. For tabular data and complex dashboards, `body-md` and `body-sm` are the primary workhorses. 

On mobile devices, large headlines scale down to prevent excessive wrapping, ensuring the interface remains functional on smaller viewports without sacrificing the bold, authoritative feel of the headlines.

## Layout & Spacing

This design system uses a **Fixed-Fluid Hybrid** model. A global sidebar is fixed to the left at 260px, while the main content area expands to fill the remaining width up to a 1440px cap to protect line lengths and readability.

The layout is governed by an 8px rhythmic grid. 
- **Desktop:** 24px margins for the main workspace, with 16px gutters between internal components (cards, widgets).
- **Tablet:** At 768px - 1024px, the sidebar collapses to an icon-only rail to maximize workspace.
- **Mobile:** Below 768px, the sidebar transitions to a hidden drawer (hamburger menu) and page margins reduce to 16px.

All layouts should follow a 12-column structure for dashboard widgets, ensuring alignment across diverse data visualizations.

## Elevation & Depth

To maintain high contrast and a clean, "flat professional" aesthetic, depth is primarily conveyed through **Tonal Layers** and **Low-contrast outlines** rather than shadows.

- **Level 0 (Canvas):** The base background is pure white (#FFFFFF).
- **Level 1 (Cards/Containers):** Elements are distinguished by a subtle #F8F9FA fill or a 1px solid border (#E5E7EB).
- **Active States:** Focused or active elements use a 2px border in the primary green to ensure accessibility through shape/weight change, not just color.
- **Overlays:** Only dropdowns and modals use shadows. These shadows are "Ambient" and highly diffused (10-12% opacity) to prevent a "muddy" appearance on the crisp white canvas.

## Shapes

The shape language is **Soft** and precise. A 4px (0.25rem) radius is the standard for most interactive components, striking a balance between modern friendliness and industrial precision.

- **Buttons & Inputs:** 4px radius.
- **Cards & Sections:** 8px (0.5rem) radius.
- **Status Badges:** 999px (Pill-shaped) to distinguish them from buttons and inputs at a glance.
- **Selection Indicators:** Sharp vertical bars (4px width) are used on the left side of active navigation items to provide a high-contrast state indicator.

## Components

- **Sidebar:** Dark Green (#1B4332). Active links must feature a pure white icon/text and a 4px vibrant green left-border indicator. Hover states use a subtle white-transparency (10%) background.
- **Buttons:** 
  - *Primary:* Solid #1B4332 with white text. 
  - *Success/Action:* Solid #2D6A4F with white text.
  - *Outline:* 1px border #1B4332, #1B4332 text, no background.
- **Input Fields:** 1px border (#333333 for high contrast). Focus state uses a 2px solid primary green border. Error states must include both a red border and an error icon to satisfy WCAG accessibility requirements.
- **Badges:** Use high-contrast text on a light tinted background (e.g., Dark Red text on light pink background). Text must meet a 4.5:1 contrast ratio against its specific badge background.
- **Tabs:** Underline style. The active tab uses a 2px primary green bottom border and Bold (700) weight text.
- **Data Tables:** High-contrast headers with a light gray background (#F8F9FA). Use 1px #E5E7EB bottom borders for rows. Zebra striping is avoided to maintain cleanliness.