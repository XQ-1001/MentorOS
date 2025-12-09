# Favicon Deployment Guide

## Current Setup

The application uses Next.js App Router's file-based icon configuration:

- `app/icon.svg` - Main favicon (32x32) with concentric circles logo (#B45309)
- `app/apple-icon.svg` - Apple touch icon (180x180) with dark background (#FCD34D on black)
- `app/favicon.ico` - Legacy ICO fallback

## Deployment Issue

If the favicon doesn't update on the deployed site (https://www.resonancelab.ai) after deployment:

### Possible Causes

1. **Browser Cache**: Browsers aggressively cache favicons
2. **CDN Cache**: Vercel's CDN caches static assets including favicons
3. **Build Cache**: Vercel might be using cached build artifacts

### Solutions

#### 1. Clear Browser Cache (User-side)

- Hard refresh: `Ctrl + Shift + R` (Windows/Linux) or `Cmd + Shift + R` (Mac)
- Clear browser cache and reload
- Use incognito/private window to test

#### 2. Clear Vercel Deployment Cache (Developer)

In Vercel Dashboard:
- Go to your project settings
- Navigate to "General" > "Build & Development Settings"
- Clear deployment cache
- Trigger a new deployment

Or via CLI:
```bash
vercel --force
```

#### 3. Force Cache Invalidation

Add a cache-busting query parameter (already handled by Next.js automatically via content hashing)

#### 4. Verify Deployment

Check if the new icon is actually deployed:
```bash
curl -I https://www.resonancelab.ai/icon.svg
```

The icon should be accessible at:
- https://www.resonancelab.ai/icon.svg
- https://www.resonancelab.ai/apple-icon.svg

## Verification Steps

1. Check that icon files are committed:
   ```bash
   git ls-files app/*.svg app/favicon.ico
   ```

2. Verify commit is pushed:
   ```bash
   git log origin/main --oneline -1
   ```

3. Check Vercel deployment logs to ensure build succeeded

4. Test in multiple browsers:
   - Chrome (incognito)
   - Firefox (private window)
   - Safari (private browsing)

## Expected Behavior

- **Local (localhost:3000)**: Should show new icon immediately after restart
- **Production (resonancelab.ai)**: May take 5-10 minutes due to CDN propagation

## Technical Details

Next.js App Router automatically:
- Detects `icon.svg` and `apple-icon.svg` in the `app/` directory
- Generates proper `<link>` tags in the HTML `<head>`
- Applies content hashing for cache busting
- Serves icons at `/icon.svg` and `/apple-icon.svg`

The `metadataBase` in `app/layout.tsx` ensures absolute URLs are generated correctly for production.
