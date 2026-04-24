# Environment Variables Setup Guide

## Overview

QuizBattle requires Supabase credentials to function. You have two options:

1. **Development (Easy)**: Use fallback credentials embedded in code
2. **Production (Secure)**: Use environment variables

## Option 1: Development with Fallback Credentials (Current)

The app currently has valid Supabase credentials as fallbacks in `src/lib/supabase.js`. This works out of the box for development but **exposes credentials in version control**.

**Files involved:**
- `src/lib/supabase.js` - Contains hardcoded credentials

**Status:** Working ✓

## Option 2: Production with Environment Variables (Recommended)

### Step 1: Get Your Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings → API**
4. Copy:
   - Project URL (e.g., `https://your-project.supabase.co`)
   - Anon public key (under "Project API keys")

### Step 2: Create .env.local file

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 3: Restart Development Server

```bash
npm run dev
```

Vite will automatically load the `.env.local` file.

## Step 3 (Production): Deploy with Vercel

When deploying to Vercel:

1. Go to your Vercel project settings
2. Navigate to **Settings → Environment Variables**
3. Add two variables:
   - `VITE_SUPABASE_URL` = your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = your anon key
4. Redeploy

## Important: Credential Rotation

If credentials were exposed in git history:

1. Go to Supabase Dashboard
2. Navigate to **Settings → API**
3. Click the three dots next to "anon public" key
4. Select **Rotate**
5. Update your environment variables with the new key

## Verification

To verify credentials are loaded correctly:

1. Open browser DevTools (F12)
2. Go to Network tab
3. Look for requests to `https://oyfegptwvajizixcyadi.supabase.co/rest/v1/`
4. Check if they have an `Authorization: Bearer ...` header

## Troubleshooting

### Error: "No API key found in request"

**Cause:** Environment variables not loaded

**Solution:**
- Verify `.env.local` exists in project root
- Check file format (VITE_ prefix required for Vite)
- Restart dev server after creating/editing `.env.local`
- Check that variable names match exactly

### Error: "Unauthorized" (401)

**Cause:** API key is invalid or expired

**Solution:**
- Verify the key matches your Supabase project
- Check if the key was rotated (old key won't work)
- Regenerate the key in Supabase dashboard

### Requests work without env variables

**Why:** Fallback credentials in `supabase.js` are being used

**Note:** This is convenient for development but NOT recommended for production

## Security Best Practices

1. **Never commit `.env.local`** - Add to `.gitignore` (already done)
2. **Rotate keys regularly** - Do this in Supabase settings
3. **Use different keys per environment** - Dev, staging, production
4. **Monitor API usage** - Check Supabase dashboard for suspicious activity
5. **Limit key permissions** - Use RLS policies on Supabase tables

## Environment Variable Priority

Variables are loaded in this order (highest to lowest priority):

1. `.env.local` (development only, never committed)
2. Fallback values in code (`src/lib/supabase.js`)
3. System environment variables (on servers)

## File Structure

```
.gitignore (already ignores .env.local)
.env.local.example ← Copy this, rename to .env.local
src/lib/supabase.js ← Contains fallback credentials
```

## Next Steps

- For **local development**: Create `.env.local` with your credentials (or skip and use fallbacks)
- For **production/Vercel**: Add environment variables in Vercel dashboard
- For **security**: Consider rotating exposed credentials if this repo is public
