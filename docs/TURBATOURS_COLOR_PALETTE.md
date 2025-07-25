# TurbaTours Color Palette

## Brand Colors

### Primary Color (TurbaTours Blue)
**Purpose**: Core brand identity, primary interactive elements (buttons, links, active states), main highlights.

- **Base**: `hsl(198 100% 47%)` → `#0095ef` → `rgb(0, 149, 239)`
- **Foreground**: `hsl(0 0% 100%)` → `#ffffff` → `rgb(255, 255, 255)`
- **Hover**: `hsl(198 100% 40%)` → `#007fcc` → `rgb(0, 127, 204)`
- **Subtle**: `hsl(198 100% 95%)` → `#f2fbff` → `rgb(242, 251, 255)`

### Accent Color (Action Red/Orange)
**Purpose**: Call-to-action buttons, important alerts, progress indicators, elements needing strong emphasis.

- **Base**: `hsl(358 86% 52%)` → `#dc267f` → `rgb(220, 38, 127)`
- **Foreground**: `hsl(0 0% 100%)` → `#ffffff` → `rgb(255, 255, 255)`
- **Hover**: `hsl(358 86% 45%)` → `#bd216d` → `rgb(189, 33, 109)`

## Light Theme Colors

### Backgrounds & Surfaces
- **Background**: `hsl(240 10% 98%)` → `#f9fafb` → `rgb(249, 250, 251)`
- **Card**: `hsl(0 0% 100%)` → `#ffffff` → `rgb(255, 255, 255)`
- **Card Foreground**: `hsl(240 10% 3.9%)` → `#0a0a0a` → `rgb(10, 10, 10)`

### Typography
- **Foreground**: `hsl(240 10% 3.9%)` → `#0a0a0a` → `rgb(10, 10, 10)`
- **Muted**: `hsl(240 4.8% 95.9%)` → `#f4f4f5` → `rgb(244, 244, 245)`
- **Muted Foreground**: `hsl(240 3.8% 46.1%)` → `#737373` → `rgb(115, 115, 115)`
- **Subtle Foreground**: `hsl(240 5% 65%)` → `#a3a3a3` → `rgb(163, 163, 163)`

### Borders & Inputs
- **Border**: `hsl(240 5.9% 90%)` → `#e5e5e5` → `rgb(229, 229, 229)`
- **Input**: `hsl(240 5.9% 90%)` → `#e5e5e5` → `rgb(229, 229, 229)`
- **Ring**: Same as Primary → `#0095ef` → `rgb(0, 149, 239)`

## Dark Theme Colors

### Backgrounds & Surfaces
- **Background**: `#08080c` → `rgb(8, 8, 12)`
- **Card**: `#141417` → `rgb(20, 20, 23)`
- **Card Foreground**: `#fafafa` → `rgb(250, 250, 250)`

### Typography
- **Foreground**: `#fafafa` → `rgb(250, 250, 250)`
- **Muted**: `#27272a` → `rgb(39, 39, 42)`
- **Muted Foreground**: `#a1a1aa` → `rgb(161, 161, 170)`
- **Subtle Foreground**: `#737373` → `rgb(115, 115, 115)`

### Brand Colors (Dark Adjusted)
- **Primary**: `#33abff` → `rgb(51, 171, 255)` (Brighter for dark backgrounds)
- **Accent**: `#ff4da6` → `rgb(255, 77, 166)` (Brighter for dark backgrounds)

## Semantic Colors

### Success
- **Light**: `hsl(142.1 76.2% 36.3%)` → `#228b22` → `rgb(34, 139, 34)`
- **Dark**: `#4ade80` → `rgb(74, 222, 128)`
- **Foreground**: White on light, Black on dark

### Warning
- **Light**: `hsl(48 96% 40%)` → `#cc9900` → `rgb(204, 153, 0)`
- **Dark**: `#fbbf24` → `rgb(251, 191, 36)`
- **Foreground**: Black text on both

### Destructive/Error
- **Light**: `hsl(0 84.2% 60.2%)` → `#dc3545` → `rgb(220, 53, 69)`
- **Dark**: `#f87171` → `rgb(248, 113, 113)`
- **Foreground**: White on light, White on dark

## Usage Guidelines

### Accessibility
- All color combinations meet WCAG 2.1 AA contrast requirements
- Primary and accent colors have sufficient contrast against both light and dark backgrounds
- Text colors are automatically calculated for optimal readability

### Brand Consistency
- Primary blue should be used for main navigation, primary buttons, and brand elements
- Accent red/orange should be reserved for important CTAs and alerts
- Neutral grays provide clean, professional backgrounds and secondary elements

### Implementation
Colors are defined as CSS custom properties in `src/styles/theme.css` and can be overridden through the AppSettings system for customization while maintaining the core brand identity.

## CSS Variables Reference

```css
/* Primary Brand Colors */
--primary: 0 149 239;
--primary-foreground: 255 255 255;
--primary-hover: 0 127 204;
--primary-subtle: 242 251 255;

/* Accent Colors */
--accent: 220 38 127;
--accent-foreground: 255 255 255;
--accent-hover: 189 33 109;

/* Semantic Colors */
--success: 34 139 34;
--warning: 204 153 0;
--destructive: 220 53 69;
```

All values are in RGB format for compatibility with Tailwind CSS and modern CSS features.