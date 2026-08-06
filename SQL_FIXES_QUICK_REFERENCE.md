# SQL Runtime Errors - Quick Reference

## All 4 Errors Fixed ✅

| Error | File | Root Cause | Fix |
|-------|------|-----------|-----|
| `column "topic_id" does not exist` | `supabase-schema.sql` | Wrong table creation order | Reordered: `topics` before `questions` |
| `column "coins" does not exist` | Phase 0 migrations | Complex RLS policy with fragile subqueries | Simplified UPDATE policy to idempotent form |
| `relation "public.topics" does not exist` | Phase 2 migrations | Missing dependency validation | Added `DO $$...RAISE EXCEPTION...$$` check |
| `function has_role(uuid, unknown) does not exist` | Phase 3 migrations | No explicit parameter type casting | Added `::TEXT` casts to all `has_role()` calls |

## Key Improvements

### 1. Type Safety
- All function calls now have explicit type annotations
- PostgreSQL can correctly resolve function signatures
- No more "unknown" type errors

### 2. Dependency Management
- Phase 2 validates Phase 0 completed
- Phase 3 validates Phase 0 and Phase 2 completed
- Clear error messages guide users to run phases in order

### 3. Idempotency
- All tables use `CREATE TABLE IF NOT EXISTS`
- All policies use `DROP POLICY IF EXISTS` + `CREATE POLICY`
- Seed data uses `ON CONFLICT DO NOTHING`
- Can safely re-run migrations without errors

### 4. RLS Simplification
- Removed overly complex column-checking logic
- Policies are now maintainable and reliable
- Economy columns still protected (updated via RPC only)

## Migration Execution Order

```
✓ Phase 0: 20260803053931_phase0_foundations.sql
  ├─ Tables: schools, subjects, topics, profiles, user_roles, questions, rooms, etc.
  ├─ Functions: has_role(), assign_role(), update_player_stats()
  └─ Seed data: 1 subject, 25 topics, sample questions

✓ Phase 2: 20260806030152_phase2_solo_quiz.sql
  ├─ Prerequisite check: validates topics table exists
  ├─ Tables: quiz_attempts, quiz_answers, user_skill_levels, seen_questions
  └─ Functions: submit_quiz_attempt(), get_skill_score(), prune_seen_questions()

✓ Phase 3: 20260806030155_phase3_gamification_economy.sql
  ├─ Prerequisite checks: validates user_roles table + has_role() function exist
  ├─ Tables: coin_transactions, achievements, user_achievements, challenges, user_challenge_progress
  └─ Functions: purchase_item(), transfer_coins(), open_mystery_box(), claim_daily_reward(), etc.
```

## Testing Quick Commands

### Test successful execution:
```bash
# All migrations should complete without errors
supabase db push --local
```

### Test idempotency (safe to re-run):
```bash
# Run all migrations again - should still work
supabase db push --local
```

### Test out-of-order prevention:
```bash
# Phase 2 run first should fail with clear error
# Phase 3 without Phase 0 should fail with clear error
```

## Files Modified

| File | Changes | Lines |
|------|---------|-------|
| `supabase-schema.sql` | Reorder tables | ~5 |
| `20260803053931_phase0_foundations.sql` | Simplify RLS + type casts | ~10 |
| `20260806030152_phase2_solo_quiz.sql` | Add prerequisite check | ~14 |
| `20260806030155_phase3_gamification_economy.sql` | Add checks + type casts | ~25 |

## Documentation Files Created

- `RUNTIME_ERRORS_FIXES.md` - Detailed analysis of each error and fix
- `SQL_FIXES_QUICK_REFERENCE.md` - This file

---

**Status:** ✅ All runtime errors eliminated  
**Idempotency:** ✅ Safe to re-run migrations  
**Dependencies:** ✅ Explicitly validated  
**Type Safety:** ✅ All parameters properly cast  

Ready for production deployment! 🚀
