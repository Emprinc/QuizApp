# Migration Deployment Guide

## Quick Summary

All SQL runtime errors have been fixed. The database migrations are production-ready with full idempotency.

## File Status

| File | Status | Idempotent | Notes |
|------|--------|-----------|-------|
| `supabase/migrations/20260803053931_phase0_foundations.sql` | ✅ Fixed | Yes | Base schema, 11 tables |
| `supabase/migrations/20260806030152_phase2_solo_quiz.sql` | ✅ Fixed | Yes | Quiz runtime, 4 tables |
| `supabase/migrations/20260806030155_phase3_gamification_economy.sql` | ✅ Fixed | Yes | Gamification, 5 tables |
| `supabase-schema.sql` | ✅ Fixed | Yes | Reference schema, 20 tables |

## Deployment Steps

### Option A: Fresh Database Setup (Recommended)

```bash
cd supabase
psql $DATABASE_URL < migrations/20260803053931_phase0_foundations.sql
psql $DATABASE_URL < migrations/20260806030152_phase2_solo_quiz.sql
psql $DATABASE_URL < migrations/20260806030155_phase3_gamification_economy.sql
```

Expected output: All migrations complete successfully with no errors.

### Option B: Vercel Supabase UI

1. Go to [Vercel Supabase Console](https://vercel.com) → Project Settings → Supabase
2. Click "SQL Editor"
3. Copy/paste each migration file in order
4. Click "Run"

### Option C: Supabase CLI

```bash
supabase migration up
```

(Automatically executes all pending migrations in order)

## Common Issues & Fixes

### Issue: "Table X does not exist" on FK constraint
**Cause**: Migrations run out of order
**Fix**: Ensure Phase 0 completes BEFORE Phase 2 and Phase 3
**Prevention**: Always run in order: Phase 0 → Phase 2 → Phase 3

### Issue: "Column X does not exist" during RLS policy creation
**Cause**: Outdated code trying to access non-existent columns
**Fix**: This has been fixed in all migrations. If you see this error, ensure you're using the latest version.

### Issue: "Function X already exists" warnings
**Cause**: Idempotent `CREATE OR REPLACE` statements
**Fix**: This is expected and harmless. The function is simply being updated.

### Issue: Re-running Phase 2 or Phase 3 fails
**Cause**: Defensive DO blocks (removed in latest version)
**Fix**: Update your migration files to the latest versions - all defensive checks have been removed for true idempotency

## Verification Steps

### 1. Check Table Creation
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Expected: 20 tables total (Phase 0: 11, Phase 2: 4, Phase 3: 5)

### 2. Check Function Creation
```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
ORDER BY routine_name;
```

Expected: 13 functions including `has_role`, `update_player_stats`, `submit_quiz_attempt`, etc.

### 3. Check RLS Policies
```sql
SELECT tablename, policyname FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
```

Expected: ~40 RLS policies across all tables

### 4. Test Idempotency
Re-run Phase 0:
```bash
psql $DATABASE_URL < migrations/20260803053931_phase0_foundations.sql
```

Expected: Completes successfully with `CREATE TABLE IF NOT EXISTS` messages

## Data Migration

### If Migrating from Old Schema

1. Export existing data:
```bash
pg_dump -d $OLD_DATABASE --table=profiles --data-only > profiles_data.sql
pg_dump -d $OLD_DATABASE --table=questions --data-only > questions_data.sql
```

2. Run new migrations (clears old schema)
3. Import data (if compatible):
```bash
psql $NEW_DATABASE < profiles_data.sql
```

## Troubleshooting

### Full Reset (Development Only)

```bash
# WARNING: This deletes all data!
psql $DATABASE_URL << 'EOF'
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
EOF

# Then re-run migrations
psql $DATABASE_URL < migrations/20260803053931_phase0_foundations.sql
psql $DATABASE_URL < migrations/20260806030152_phase2_solo_quiz.sql
psql $DATABASE_URL < migrations/20260806030155_phase3_gamification_economy.sql
```

### Check Migration Logs

```bash
SELECT * FROM supabase.migrations;
```

## Key Fixes in This Release

1. **Fixed table creation order** - Topics before Questions
2. **Removed invalid RLS policy** - Profiles INSERT no longer checks non-existent columns
3. **Removed aggressive defensive checks** - All migrations now support true idempotency
4. **Verified FK constraints** - All foreign key relationships validated
5. **Simplified RLS policies** - Easier to maintain and debug

## Testing the Deploy

```bash
# After migrations complete, test core functionality
psql $DATABASE_URL << 'EOF'

-- Test 1: Insert a school
INSERT INTO public.schools (name, code) VALUES ('Test School', 'TS001');

-- Test 2: Insert a subject
INSERT INTO public.subjects (slug, name) VALUES ('math', 'Mathematics');

-- Test 3: Insert a topic
INSERT INTO public.topics (subject_id, slug, name) 
  SELECT id, 'algebra', 'Algebra' FROM public.subjects WHERE slug = 'math';

-- Test 4: Insert a question
INSERT INTO public.questions (category, topic_id, question_text, options, correct_answer)
  SELECT 'math', id, 'What is 2+2?', '["3","4","5","6"]', 1 
  FROM public.topics WHERE slug = 'algebra' LIMIT 1;

-- Test 5: Verify data
SELECT COUNT(*) as schools FROM public.schools;
SELECT COUNT(*) as subjects FROM public.subjects;
SELECT COUNT(*) as topics FROM public.topics;
SELECT COUNT(*) as questions FROM public.questions;

EOF
```

Expected output:
```
schools  | 1
subjects | 1
topics   | 1
questions| 1
```

## Support

For questions or issues:
1. Check `SQL_RUNTIME_ERRORS_FINAL_FIX.md` for detailed analysis
2. Review migration comments in each file
3. Check PostgreSQL error messages for specifics
4. Contact the database team with full error logs

---

**Status**: ✅ All runtime errors fixed - Ready for production deployment
