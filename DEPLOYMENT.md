# Cloudflare Pages Deployment Guide

## Prerequisites
- Cloudflare account
- GitHub repository with your code
- Supabase project

## Deployment Steps

### 1. Connect Repository
1. Go to [Cloudflare Pages](https://pages.cloudflare.com/)
2. Click "Create a project"
3. Connect your GitHub account
4. Select your repository

### 2. Build Configuration
Use these settings in Cloudflare Pages:

- **Framework preset**: `None` (or `Vite` if available)
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: `/` (leave empty)
- **Node.js version**: `18` or `20`

### 3. Environment Variables
In Cloudflare Pages dashboard, go to Settings > Environment Variables and add:

**Production Environment:**
```
VITE_SUPABASE_URL=https://ynreicljcvcpzckhojtx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlucmVpY2xqY3ZjcHpja2hvanR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNzAyMjEsImV4cCI6MjA2ODk0NjIyMX0.BBXCgYSOxVpaHuQoBTSRpp9YBlLEqlmoXd4hDPNFwpc
```

**Preview Environment (optional):**
Same values as production, or use a separate Supabase project for staging.

### 4. Custom Domain (Optional)
1. Go to Custom domains in your Pages project
2. Add your domain
3. Update DNS records as instructed

### 5. Build Optimization

#### Add to vite.config.js for better production builds:
```javascript
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          supabase: ['@supabase/supabase-js']
        }
      }
    }
  },
  // ... rest of your config
})
```

## Deployment Features

### Automatic Deployments
- Every push to main branch triggers a new deployment
- Pull requests get preview deployments
- Rollback to previous versions easily

### Performance
- Global CDN distribution
- Automatic HTTPS
- HTTP/2 and HTTP/3 support
- Brotli compression

### Analytics
- Built-in Web Analytics
- Core Web Vitals monitoring
- Real User Monitoring (RUM)

## Troubleshooting

### Build Fails
1. Check Node.js version (use 18 or 20)
2. Verify all dependencies are in package.json
3. Check build logs for specific errors

### App Doesn't Load
1. Verify environment variables are set correctly
2. Check browser console for errors
3. Ensure Supabase URL and key are correct

### Routing Issues (404 on refresh)
Add `_redirects` file to public folder:
```
/*    /index.html   200
```

## Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **Supabase RLS**: Ensure Row Level Security is enabled
3. **CORS**: Configure Supabase CORS settings for your domain
4. **CSP**: Consider adding Content Security Policy headers

## Monitoring

1. **Cloudflare Analytics**: Monitor traffic and performance
2. **Supabase Dashboard**: Monitor database usage
3. **Error Tracking**: Consider adding Sentry or similar

## Cost Estimation

**Cloudflare Pages:**
- Free tier: 500 builds/month, unlimited requests
- Pro: $20/month for additional features

**Supabase:**
- Free tier: 500MB database, 2GB bandwidth
- Pro: $25/month for production features

Total estimated cost: $0-45/month depending on usage.