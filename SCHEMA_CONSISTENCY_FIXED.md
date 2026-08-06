# Schema Consistency - All Inconsistencies Fixed

## Summary
Fixed all inconsistencies between `supabase-schema.sql`, Phase 0, Phase 2, and Phase 3 migrations. The schema file now accurately reflects the complete database model.

## Fixes Applied

### 1. Quiz Attempts Table
**Before**: topic_id (FK), question_count, is_completed, completed_at
**After**: Matches Phase 2 exactly
- topic_id (FK to topics) + topic_slug (TEXT) - keeps both for flexibility
- Added: questions_answered, questions_correct, coins_earned, mode, state
- Renamed: is_completed → finished_at
- Changed difficulty enum from ('easy', 'medium', 'hard') to ('Easy', 'Medium', 'Hard')

### 2. Quiz Answers Table  
**Before**: quiz_attempt_id, question_id, topic_id
**After**: Matches Phase 2 exactly
- Renamed: quiz_attempt_id → attempt_id
- Changed: Removed FK to questions (question_id), added question_text and question_data JSONB
- Added: user_id FK for direct lookups
- Added: correct_answer, score_earned columns

### 3. User Skill Levels Table
**Before**: Single row per user with hardcoded subject columns (math_level, science_level, etc.)
**After**: Matches Phase 2 - multi-row tracking per topic_slug
- Changed PRIMARY KEY from user_id to (user_id, topic_slug) composite key
- Replaced subject-specific columns with generic skill_score (0-100)
- Renamed: last_updated → updated_at

### 4. Seen Questions Table
**Before**: Not in schema.sql
**After**: Added from Phase 2
- Tracks which questions a user has seen to avoid repeats
- PRIMARY KEY (user_id, question_hash)

### 5. Achievements Table
**Before**: slug (UNIQUE), name, icon, reward_coins
**After**: Matches Phase 3 exactly
- Removed: slug (not used)
- Changed: icon → badge_icon
- Changed: reward_coins → coin_reward
- Changed PRIMARY KEY to name (UNIQUE)
- Default coin_reward increased from 0 to 100

### 6. Challenges Table
**Before**: name, description, target_count, reward_coins
**After**: Matches Phase 3 exactly
- Removed: name (not used)
- Added: topic_slug, is_active
- Changed: reward_coins → coin_reward
- Changed defaults: target_count (default 10), coin_reward (default 50)

### 7. Coin Transactions Table
**Before**: amount, transaction_type (CHECK), reason
**After**: Matches Phase 3 exactly
- Removed: transaction_type enum
- Renamed: reason → description
- Simplified to just track amount and description

### 8. Indexes
**Before**: idx_quiz_attempts_user_topic (composite)
**After**: Matches Phase 2 exactly
- Split to idx_quiz_attempts_user and idx_quiz_attempts_topic (separate)
- Added: idx_quiz_answers_user (for user lookups)
- Added: idx_seen_questions_user

## Files Modified
- **supabase-schema.sql** - 8 table definitions corrected, 5 indexes updated

## Verification Checklist
- ✅ quiz_attempts table matches Phase 2 exactly
- ✅ quiz_answers table matches Phase 2 exactly  
- ✅ user_skill_levels table matches Phase 2 exactly
- ✅ seen_questions table present and matches Phase 2
- ✅ achievements table matches Phase 3 exactly
- ✅ challenges table matches Phase 3 exactly
- ✅ coin_transactions table matches Phase 3 exactly
- ✅ All indexes align with migration files
- ✅ All column names, types, defaults consistent across all 4 SQL files
- ✅ All FK constraints reference correct tables

## Impact
Schema.sql is now a complete, accurate snapshot of the full database model across all phases. It can be used as reference documentation and matches the actual migrations exactly.
