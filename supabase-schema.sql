-- QuizBattle Database Schema
-- Comprehensive schema consolidating all migrations (Phase 0, 2, 3)
-- IMPORTANT: Use migrations in supabase/migrations/ for actual deployments
-- This file is for reference and local development only

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PHASE 0 TABLES
-- ============================================

-- Subjects (data-driven taxonomy)
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Topics (per-subject taxonomy) — MUST be created before questions for FK constraint
CREATE TABLE IF NOT EXISTS public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schools (for profiles FK)
CREATE TABLE IF NOT EXISTS public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  avatar_url TEXT,
  full_name TEXT,
  school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  age INTEGER,
  bio TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  is_banned BOOLEAN DEFAULT FALSE,
  -- Stats
  total_games INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  weekly_score INTEGER DEFAULT 0,
  monthly_score INTEGER DEFAULT 0,
  -- Economy
  coins INTEGER DEFAULT 100,
  hint_tokens INTEGER DEFAULT 0,
  fifty_fifty_tokens INTEGER DEFAULT 0,
  skip_question_tokens INTEGER DEFAULT 0,
  mystery_boxes INTEGER DEFAULT 0,
  double_coins_expires_at TIMESTAMPTZ,
  -- Cosmetics
  active_border TEXT,
  active_name_effect TEXT,
  flair TEXT,
  -- Gamification
  streak_days INTEGER DEFAULT 0,
  last_reward_date DATE,
  -- Presence
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Roles (privilege assignments)
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, role)
);

-- Questions (extended with topic_id, pool, source)
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
  question_text TEXT UNIQUE NOT NULL,
  options JSONB NOT NULL,
  correct_answer INTEGER NOT NULL CHECK (correct_answer BETWEEN 0 AND 3),
  explanation TEXT,
  pool_name TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  unhide_at TIMESTAMPTZ,
  uploads_enabled BOOLEAN DEFAULT FALSE,
  graph_data JSONB,
  source TEXT CHECK (source IN ('bank', 'generated', 'teacher')) DEFAULT 'bank',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Game Rooms (extended with mode, max_players, topic_id)
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(6) UNIQUE NOT NULL,
  host_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  mode TEXT CHECK (mode IN ('room', 'duel')) DEFAULT 'room',
  max_players INTEGER DEFAULT 8 CHECK (max_players BETWEEN 2 AND 8),
  question_count INTEGER DEFAULT 10 CHECK (question_count BETWEEN 5 AND 30),
  time_per_question INTEGER DEFAULT 15 CHECK (time_per_question BETWEEN 5 AND 60),
  status TEXT CHECK (status IN ('waiting', 'playing', 'finished')) DEFAULT 'waiting',
  current_round INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Room Players
CREATE TABLE IF NOT EXISTS public.room_players (
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
  player_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0,
  answers_correct INTEGER DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (room_id, player_id)
);

-- Game Sessions (extended with generated_question JSONB)
CREATE TABLE IF NOT EXISTS public.game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.questions(id),
  generated_question JSONB,
  round_number INTEGER NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- Player Answers
CREATE TABLE IF NOT EXISTS public.player_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.questions(id) ON DELETE SET NULL,
  answer INTEGER NOT NULL CHECK (answer BETWEEN 0 AND 3),
  is_correct BOOLEAN,
  time_taken_ms INTEGER,
  score_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Friendships
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sender_id, receiver_id)
);

-- ============================================
-- PHASE 2 TABLES
-- ============================================

-- Quiz Attempts (solo quiz runtime)
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  topic_slug TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  score INTEGER DEFAULT 0,
  questions_answered INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  coins_earned INTEGER DEFAULT 0,
  mode TEXT DEFAULT 'solo',
  state JSONB,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

-- Quiz Answers
CREATE TABLE IF NOT EXISTS public.quiz_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_data JSONB NOT NULL,
  selected_answer INTEGER,
  correct_answer INTEGER,
  is_correct BOOLEAN,
  time_taken_ms INTEGER,
  score_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Skill Levels
CREATE TABLE IF NOT EXISTS public.user_skill_levels (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic_slug TEXT NOT NULL,
  skill_score INTEGER DEFAULT 50,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, topic_slug)
);

-- Seen Questions (tracking for question pool)
CREATE TABLE IF NOT EXISTS public.seen_questions (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_hash TEXT NOT NULL,
  topic_slug TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, question_hash)
);

-- ============================================
-- PHASE 3 TABLES
-- ============================================

-- Coin Transactions
CREATE TABLE IF NOT EXISTS public.coin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Achievements
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  badge_icon TEXT,
  coin_reward INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Achievements
CREATE TABLE IF NOT EXISTS public.user_achievements (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);

-- Challenges
CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  topic_slug TEXT,
  target_count INTEGER DEFAULT 10,
  coin_reward INTEGER DEFAULT 50,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Challenge Progress
CREATE TABLE IF NOT EXISTS public.user_challenge_progress (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, challenge_id, date)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_questions_category ON public.questions(category);
CREATE INDEX IF NOT EXISTS idx_questions_topic ON public.questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_questions_is_active ON public.questions(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_school ON public.profiles(school_id);
CREATE INDEX IF NOT EXISTS idx_rooms_host ON public.rooms(host_id);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON public.rooms(status);
CREATE INDEX IF NOT EXISTS idx_room_players_room ON public.room_players(room_id);
CREATE INDEX IF NOT EXISTS idx_room_players_player ON public.room_players(player_id);
CREATE INDEX IF NOT EXISTS idx_player_answers_player ON public.player_answers(player_id);
CREATE INDEX IF NOT EXISTS idx_player_answers_room ON public.player_answers(room_id);
CREATE INDEX IF NOT EXISTS idx_friendships_sender ON public.friendships(sender_id);
CREATE INDEX IF NOT EXISTS idx_friendships_receiver ON public.friendships(receiver_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON public.quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_topic ON public.quiz_attempts(topic_slug);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_attempt ON public.quiz_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_user ON public.quiz_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_seen_questions_user ON public.seen_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user ON public.coin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_progress_user ON public.user_challenge_progress(user_id);

-- ============================================
-- NOTE
-- ============================================

-- This schema file is a consolidated reference combining Phase 0, 2, and 3.
-- For actual Supabase deployments, run the migrations in order:
--   1. 20260803053931_phase0_foundations.sql
--   2. 20260806030152_phase2_solo_quiz.sql
--   3. 20260806030155_phase3_gamification_economy.sql
