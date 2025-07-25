# App Settings & Theme System

This document explains how to use the comprehensive App Settings and Theme System that applies appearance and feature settings globally across all pages.

## Overview

The theme system consists of several components that work together to provide:
- **Global appearance settings** (logo, colors, branding)
- **Feature toggles** that can enable/disable functionality
- **Maintenance mode** support
- **Responsive design** with theme-aware components
- **Accessibility** features

## Core Components

### 1. AppSettingsProvider (`src/contexts/AppSettingsContext.jsx`)

The main context provider that manages app settings globally.

```jsx
import { useAppSettings } from '@/contexts/AppSettingsContext';

function MyComponent() {
  const { settings, updateSettings, isFeatureEnabled } = useAppSettings();
  
  return (
    <div>
      <h1>{settings.appName}</h1>
      {isFeatureEnabled('enableAnalytics') && <AnalyticsComponent />}
    </div>
  );
}
```

### 2. ThemeWrapper (`src/components/common/ThemeWrapper.jsx`)

Wraps page content with theme-aware styling and maintenance mode support.

```jsx
import ThemeWrapper from '@/components/common/ThemeWrapper';

function MyPage() {
  return (
    <ThemeWrapper>
      <div className="container mx-auto">
        {/* Your page content */}
      </div>
    </ThemeWrapper>
  );
}
```

### 3. FeatureGate (`src/components/common/FeatureGate.jsx`)

Conditionally renders content based on feature flags.

```jsx
import FeatureGate, { useFeature } from '@/components/common/FeatureGate';

// Component usage
<FeatureGate 
  feature="enableAnalytics"
  fallback={<div>Analytics disabled</div>}
>
  <AnalyticsComponent />
</FeatureGate>

// Hook usage
function MyComponent() {
  const analyticsEnabled = useFeature('enableAnalytics');
  
  return (
    <div>
      {analyticsEnabled ? <AnalyticsComponent /> : <div>Analytics disabled</div>}
    </div>
  );
}
```

### 4. AppLogo (`src/components/common/AppLogo.jsx`)

Theme-aware logo component that automatically updates when settings change.

```jsx
import AppLogo from '@/components/common/AppLogo';

<AppLogo className="h-8 w-auto" />
```

## Available Settings

### Branding & Appearance
- `appName` - Application name (updates document title)
- `logoUrl` - Logo image URL
- `primaryColor` - Primary theme color (hex)
- `secondaryColor` - Secondary theme color (hex)
- `companyName` - Company name
- `companyDescription` - Company description

### Contact Information
- `contactEmail` - Contact email address
- `contactPhone` - Contact phone number
- `address` - Company address
- `website` - Company website URL

### Feature Flags
- `enableRegistration` - Allow new user registration
- `enableGuestMode` - Allow guest browsing
- `enableAudioRecording` - Enable audio recording features
- `enableLiveTracking` - Enable real-time location tracking
- `enableNotifications` - Enable push notifications
- `enableAnalytics` - Enable analytics collection
- `enableMultiLanguage` - Enable multi-language support
- `enableTourRating` - Allow tour ratings
- `enableTourComments` - Allow tour comments
- `enableDriverTracking` - Enable driver location tracking
- `enableDriverChat` - Enable driver communication

### System Settings
- `maxToursPerUser` - Maximum tours per user
- `maxStopsPerTour` - Maximum stops per tour
- `sessionTimeout` - Session timeout in minutes
- `enableMaintenance` - Enable maintenance mode
- `maintenanceMessage` - Maintenance mode message

## Usage Examples

### 1. Updating Page with Theme Support

```jsx
// Before
function MyPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <h1>My Page</h1>
      <AnalyticsComponent />
    </div>
  );
}

// After
import ThemeWrapper from '@/components/common/ThemeWrapper';
import FeatureGate from '@/components/common/FeatureGate';

function MyPage() {
  return (
    <ThemeWrapper>
      <div className="container mx-auto px-4 py-6">
        <h1>My Page</h1>
        <FeatureGate 
          feature="enableAnalytics"
          fallback={<div>Analytics disabled in settings</div>}
        >
          <AnalyticsComponent />
        </FeatureGate>
      </div>
    </ThemeWrapper>
  );
}
```

### 2. Using Theme Colors in Components

```jsx
import { useAppSettings } from '@/contexts/AppSettingsContext';

function MyComponent() {
  const { getThemeColors } = useAppSettings();
  const colors = getThemeColors();
  
  return (
    <div style={{ backgroundColor: colors.primary }}>
      Themed content
    </div>
  );
}
```

### 3. Conditional Feature Rendering

```jsx
import { useFeature } from '@/components/common/FeatureGate';

function NavigationMenu() {
  const analyticsEnabled = useFeature('enableAnalytics');
  const trackingEnabled = useFeature('enableLiveTracking');
  
  return (
    <nav>
      <a href="/home">Home</a>
      <a href="/tours">Tours</a>
      {analyticsEnabled && <a href="/analytics">Analytics</a>}
      {trackingEnabled && <a href="/tracking">Live Tracking</a>}
    </nav>
  );
}
```

### 4. Higher-Order Component with Feature Gate

```jsx
import { withFeatureGate } from '@/components/common/FeatureGate';

const AnalyticsPage = () => <div>Analytics content</div>;

// Wrap component with feature gate
export default withFeatureGate('enableAnalytics', <div>Analytics disabled</div>)(AnalyticsPage);
```

## CSS Custom Properties

The theme system automatically updates CSS custom properties that can be used in your styles:

```css
.my-component {
  background-color: rgb(var(--primary));
  color: rgb(var(--primary-foreground));
  border-color: rgb(var(--secondary));
}
```

Available CSS variables:
- `--primary` - Primary color (RGB values)
- `--primary-foreground` - Primary foreground color
- `--secondary` - Secondary color (RGB values)
- `--secondary-foreground` - Secondary foreground color
- `--accent` - Accent color (same as primary)
- `--muted` - Muted color (same as secondary)

## Maintenance Mode

When `enableMaintenance` is true, the ThemeWrapper automatically shows a maintenance page:

```jsx
// Settings
{
  enableMaintenance: true,
  maintenanceMessage: "We're updating our system. Please check back soon!"
}

// Result: All pages wrapped with ThemeWrapper will show maintenance screen
```

## Accessibility Features

The theme system includes built-in accessibility support:
- High contrast mode detection
- Reduced motion support
- Focus management
- Screen reader compatibility

## Best Practices

### 1. Always Wrap Pages with ThemeWrapper
```jsx
// Good
function MyPage() {
  return (
    <ThemeWrapper>
      {/* page content */}
    </ThemeWrapper>
  );
}
```

### 2. Use Feature Gates for Optional Features
```jsx
// Good - Feature can be disabled
<FeatureGate feature="enableAnalytics">
  <AnalyticsComponent />
</FeatureGate>

// Bad - Always shows regardless of settings
<AnalyticsComponent />
```

### 3. Provide Meaningful Fallbacks
```jsx
// Good - Clear message when disabled
<FeatureGate 
  feature="enableAnalytics"
  fallback={
    <div className="text-center py-8">
      <p>Analytics feature is disabled in settings</p>
    </div>
  }
>
  <AnalyticsComponent />
</FeatureGate>
```

### 4. Use Theme-Aware Components
```jsx
// Good - Uses theme colors
<Button className="bg-primary text-primary-foreground">
  Themed Button
</Button>

// Avoid - Hard-coded colors
<Button className="bg-blue-500 text-white">
  Hard-coded Button
</Button>
```

## Testing

To test the theme system:

1. **Go to Admin Dashboard → App Settings**
2. **Change colors, logo, and feature flags**
3. **Navigate to different pages** to see changes applied
4. **Enable maintenance mode** to test maintenance screen
5. **Disable features** to see feature gates in action

## Migration Guide

To migrate existing pages to use the theme system:

1. **Import required components**:
   ```jsx
   import ThemeWrapper from '@/components/common/ThemeWrapper';
   import FeatureGate from '@/components/common/FeatureGate';
   ```

2. **Wrap page content**:
   ```jsx
   return (
     <ThemeWrapper>
       {/* existing content */}
     </ThemeWrapper>
   );
   ```

3. **Add feature gates** around optional features:
   ```jsx
   <FeatureGate feature="enableAnalytics">
     <AnalyticsComponent />
   </FeatureGate>
   ```

4. **Replace hard-coded branding** with AppLogo component:
   ```jsx
   // Before
   <h1>TurbaTours</h1>
   
   // After
   <AppLogo />
   ```

This system ensures consistent theming and feature management across your entire application!