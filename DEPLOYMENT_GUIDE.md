# QuizBattle Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Variables Setup

#### Local Development
1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Fill in your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

#### Production Deployment (Vercel)
1. Go to Vercel Project Settings → Environment Variables
2. Add the same variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### 2. Supabase Production Verification

#### Check Row-Level Security (RLS)
```sql
-- Verify RLS is enabled on all tables
SELECT tablename FROM pg_tables WHERE schemaname='public';
```

All tables should have RLS enabled for production:
- `profiles` - Users can only read/write their own profile
- `rooms` - Room participants can read room data
- `room_players` - Participants can read their game data
- `friendships` - Only sender/receiver can manage
- `questions` - Read-only for authenticated users

#### Verify RLS Policies
Example policy for profiles table:
```sql
CREATE POLICY "Users can read their own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);
```

### 3. Database Migrations

Ensure your production Supabase database has the schema from `supabase-schema.sql`:

1. Go to Supabase Dashboard → SQL Editor
2. Create a new query
3. Copy contents of `supabase-schema.sql`
4. Execute (if tables don't exist)

### 4. Local Testing

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run production build
npm run build

# Preview production build
npm run preview
```

### 5. Test Flows

#### Authentication Flow
- [ ] Sign up with new email/password
- [ ] Login with existing credentials
- [ ] Auto-logout on token expiration
- [ ] Protected routes redirect to login

#### Game Flow
- [ ] Create a room
- [ ] Copy invite link
- [ ] Join room with code
- [ ] Start game (host)
- [ ] Answer questions
- [ ] See final results
- [ ] Return to lobby

#### Real-Time Features
- [ ] Open room in multiple browsers
- [ ] Verify players appear in real-time
- [ ] Verify scores update live
- [ ] Verify correct answer reveal

#### Leaderboard
- [ ] See global rankings
- [ ] Check pagination works
- [ ] Verify period filters
- [ ] See own ranking highlighted

#### Friends
- [ ] Add friend by email
- [ ] Accept/reject requests
- [ ] Remove friends
- [ ] Challenge friends

---

## Vercel Deployment

### Step 1: Connect GitHub Repository
1. Go to vercel.com
2. Click "New Project"
3. Connect your GitHub repository
4. Select the QuizBattle repo

### Step 2: Configure Build Settings
```
Framework: Vite
Build Command: npm run build
Output Directory: dist
```

### Step 3: Add Environment Variables
In Vercel Project Settings:
1. Go to "Environment Variables"
2. Add:
   ```
   VITE_SUPABASE_URL = [your-supabase-url]
   VITE_SUPABASE_ANON_KEY = [your-anon-key]
   ```
3. Select "Production" environment
4. Click "Save"

### Step 4: Deploy
1. Click "Deploy"
2. Wait for build to complete
3. Verify no build errors
4. Test production URL

---

## Post-Deployment Checks

### 1. Functionality Testing
- [ ] Authentication works
- [ ] Database queries work
- [ ] Real-time updates work
- [ ] All pages load correctly
- [ ] Navigation works

### 2. Performance
- [ ] Page load time < 3s
- [ ] First Contentful Paint < 2s
- [ ] Largest Contentful Paint < 3s
- [ ] Run Lighthouse audit

### 3. Security
- [ ] HTTPS enabled
- [ ] No console errors
- [ ] No sensitive data in console
- [ ] RLS policies enforced
- [ ] Auth tokens not exposed

### 4. Browser Compatibility
- [ ] Test on Chrome
- [ ] Test on Firefox
- [ ] Test on Safari
- [ ] Test on mobile Safari

### 5. Mobile Testing
- [ ] Bottom nav works
- [ ] Touch interactions work
- [ ] Responsive layout correct
- [ ] Game playable on mobile

---

## Monitoring & Analytics

### Error Tracking (Optional - Sentry)
```javascript
// Install Sentry
npm install @sentry/react @sentry/tracing

// Initialize in main.jsx
import * as Sentry from "@sentry/react";
Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production"
});
```

### Analytics (Optional - PostHog)
```javascript
// Install PostHog
npm install posthog-js

// Initialize in main.jsx
import { PostHogProvider } from 'posthog-js/react'
// Wrap your app with PostHogProvider
```

---

## Database Scaling

### Growth Stages

**Phase 1: 0-1,000 users**
- Current setup sufficient
- Supabase free tier or Pro tier

**Phase 2: 1,000-10,000 users**
- Monitor database performance
- Enable query logs
- Optimize slow queries
- Consider read replicas

**Phase 3: 10,000+ users**
- Database optimization critical
- Consider dedicated Supabase instance
- Implement caching layer (Redis)
- Set up CDN for static assets

### Query Optimization Tips
1. Always select specific columns, not `*`
2. Add indexes on frequently filtered columns
3. Use `limit` to prevent large result sets
4. Batch operations when possible
5. Cache query results when applicable

---

## Backup & Recovery

### Supabase Backups
Supabase automatically backs up all data daily.

To restore:
1. Go to Supabase Dashboard
2. Settings → Backups
3. Choose restore point
4. Confirm restoration

### Manual Backup
```bash
# Export database dump
pg_dump postgresql://user:password@host/db > backup.sql

# Restore from dump
psql postgresql://user:password@host/db < backup.sql
```

---

## Rollback Procedure

If deployment causes issues:

1. Go to Vercel Dashboard
2. Select QuizBattle project
3. Go to "Deployments"
4. Find previous stable deployment
5. Click "..." menu
6. Select "Rollback to this Deployment"

---

## Troubleshooting

### Build Fails
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for errors
npm run build
```

### Authentication Errors
- Verify Supabase credentials in Vercel
- Check CORS settings in Supabase
- Verify auth enabled in Supabase
- Check RLS policies

### Real-Time Not Working
- Verify Realtime enabled in Supabase
- Check network tab for failed connections
- Verify room subscriptions in GameContext
- Check browser console for errors

### Database Connection Issues
- Verify network connectivity
- Check Supabase status page
- Verify credentials are correct
- Check RLS policies allow access
- Review database logs

---

## Performance Optimization

### Frontend Optimization
1. Enable code splitting (React lazy)
2. Optimize images
3. Minify CSS/JS
4. Gzip compression
5. Remove unused dependencies

### Database Optimization
1. Add indexes on foreign keys
2. Use prepared statements
3. Limit result sets
4. Cache frequently accessed data
5. Archive old game data

### Real-Time Optimization
1. Limit events per second (currently 10)
2. Batch state updates
3. Unsubscribe from unused channels
4. Use efficient payload structures

---

## Security Hardening Checklist

- [ ] Move credentials to environment variables
- [ ] Enable HTTPS everywhere
- [ ] Set security headers
- [ ] Enable CORS restrictions
- [ ] Rate limit API calls
- [ ] Validate all user inputs
- [ ] Sanitize database inputs
- [ ] Regular security audits
- [ ] Update dependencies regularly
- [ ] Monitor for vulnerabilities

---

## Support & Maintenance

### Regular Tasks
- Weekly: Monitor error logs
- Monthly: Check performance metrics
- Monthly: Review Supabase usage
- Quarterly: Update dependencies
- Quarterly: Security audit

### Emergency Contacts
- Vercel Support: vercel.com/help
- Supabase Support: supabase.com/support
- GitHub Issues: For bug reports

---

## Success Metrics

Track these metrics post-deployment:

1. **User Engagement**
   - Daily active users (DAU)
   - Monthly active users (MAU)
   - Average session duration

2. **Performance**
   - Page load time
   - API response time
   - Database query time

3. **Reliability**
   - Uptime percentage
   - Error rate
   - Failed requests

4. **Growth**
   - New user signups
   - Games completed
   - Friend connections

---

**Deployment Checklist Complete!** ✅

Your QuizBattle application is ready for production. For any issues or questions, refer to the Supabase and Vercel documentation.
