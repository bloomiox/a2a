# Supabase Email Configuration Guide

## Issue
Supabase sends email confirmation links with `localhost:3000` instead of the production URL `app.bloom-travel.com`.

## Solution

### 1. Code Changes (Already Applied)

#### Updated `src/api/supabaseClient.js`
- Added automatic site URL detection based on environment
- Set `redirectTo` option in Supabase client configuration
- Added support for `VITE_SITE_URL` environment variable

#### Updated `src/pages/Register.jsx`
- Added `emailRedirectTo` option in signup process
- Automatically uses production URL in production environment
- Added support for `VITE_SITE_URL` environment variable

#### Created `src/pages/AuthCallback.jsx`
- New component to handle email confirmation callbacks
- Processes Supabase auth tokens and redirects appropriately
- Provides user feedback during the verification process

#### Updated routing in `src/pages/index.jsx`
- Added `/auth/callback` route to handle email confirmations

### 2. Supabase Dashboard Configuration (Required)

You need to update the Supabase project settings in the dashboard:

#### Step 1: Access Supabase Dashboard
1. Go to [supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your project

#### Step 2: Update Site URL
1. Navigate to **Settings** → **General**
2. Find the **Site URL** field
3. Change from `http://localhost:3000` to `https://app.bloom-travel.com`
4. Click **Save**

#### Step 3: Update Redirect URLs
1. Navigate to **Authentication** → **URL Configuration**
2. In **Site URL**, ensure it's set to `https://app.bloom-travel.com`
3. In **Redirect URLs**, add:
   - `https://app.bloom-travel.com`
   - `https://app.bloom-travel.com/**` (for any sub-paths)
   - Keep `http://localhost:5173` for development
4. Click **Save**

#### Step 4: Update Email Templates (Optional)
1. Navigate to **Authentication** → **Email Templates**
2. For each template (Confirm signup, Magic Link, etc.):
   - Click **Edit**
   - Ensure the confirmation URL uses `{{ .SiteURL }}` variable
   - The default template should be: `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email`
3. Save each template

### 3. Environment Variables

Ensure your production environment has the correct variables:

```bash
# Production .env
VITE_SUPABASE_URL=https://ynreicljcvcpzckhojtx.supabase.co
VITE_SUPABASE_ANON_KEY=your_actual_anon_key
VITE_SITE_URL=https://app.bloom-travel.com
```

The `VITE_SITE_URL` variable allows you to override the default URL detection.

### 4. Verification

After making these changes:

1. **Test in Development**: Registration should still work with localhost URLs
2. **Test in Production**: 
   - Register a new user
   - Check the confirmation email
   - Verify the link points to `https://app.bloom-travel.com`
   - Click the link to ensure it works

### 5. Troubleshooting

#### If emails still show localhost:
1. Double-check the Site URL in Supabase dashboard
2. Ensure you saved the changes
3. Try clearing browser cache
4. Wait a few minutes for changes to propagate

#### If confirmation links don't work:
1. Verify the redirect URLs include your domain
2. Check that your app handles the `/auth/callback` route
3. Ensure HTTPS is properly configured on your domain

### 6. Additional Security

Consider adding these redirect URLs for better security:
- `https://app.bloom-travel.com/auth/callback`
- `https://app.bloom-travel.com/login`
- `https://app.bloom-travel.com/register`

## Notes

- The code changes ensure the correct URL is used based on the environment
- Supabase dashboard settings are the primary source of truth for email URLs
- Both development and production URLs can coexist in the redirect URLs list
- Changes may take a few minutes to take effect