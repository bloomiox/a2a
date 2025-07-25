# Color Reset Guide

## Issue: App Showing Yellow Colors

If your deployed app is showing yellow/orange colors instead of the neutral theme, this is likely due to cached settings in localStorage from previous versions.

## Quick Fix

### Option 1: Use the Reset Colors Button
1. Go to **Admin Dashboard** → **App Settings**
2. Scroll to the bottom of the page
3. Click the **"Reset Colors"** button
4. Confirm the reset
5. The app will immediately switch to neutral slate colors

### Option 2: Clear Browser Storage (Manual)
1. Open browser Developer Tools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Find **Local Storage** → your domain
4. Delete the `appSettings` key
5. Refresh the page

### Option 3: Console Command (Quick)
1. Open browser Developer Tools (F12)
2. Go to **Console** tab
3. Run: `localStorage.removeItem('appSettings'); location.reload();`

## New Color Scheme

After reset, your app will use:

### Light Theme:
- **Background**: White (`#ffffff`)
- **Text**: Dark slate (`#0f172a`)
- **Cards**: White with light borders
- **Primary**: Neutral slate (`#64748b`)
- **Secondary**: Light slate (`#94a3b8`)

### Dark Theme:
- **Background**: Dark slate (`#020617`)
- **Text**: Light slate (`#f8fafc`)
- **Cards**: Dark slate (`#0f172a`)
- **Primary**: Neutral slate (auto-contrast)
- **Secondary**: Light slate (auto-contrast)

## Customizing Colors

You can still customize colors in **Admin Dashboard** → **App Settings**:
1. Choose your preferred **Primary Color** (for buttons, links, accents)
2. Choose your preferred **Secondary Color** (for muted elements)
3. The system automatically calculates proper contrast for text
4. Click **"Save Settings"** to apply

## Theme Switching

The app supports three theme modes:
- **Light**: Always light theme
- **Dark**: Always dark theme  
- **Auto**: Follows your system preference

Change this in **App Settings** → **Theme Mode** or use the theme switcher in the top navigation.