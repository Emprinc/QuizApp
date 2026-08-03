/*
# Phase 0 — Foundations & Hardening

## Summary
Applies the full base schema (profiles, questions, rooms, room_players, game_sessions,
player_answers, friendships) plus Phase 0 hardening additions:
- user_roles table + has_role() SECURITY DEFINER function (replaces is_admin)
- subjects, topics, schools tables (data-driven taxonomy)
- profiles extended with economy/gamification columns
- questions extended with topic_id, pool_name, source, unhide_at, graph_data
- rooms extended with mode, max_players, topic_id
- game_sessions extended with generated_question JSONB
- Tightened RLS: score/coin columns not client-writable
- Seed data: 1 subject (Mathematics), 25 topics, existing STEM questions

## New Tables
- user_roles(user_id, role): role assignments (student/teacher/admin)
- subjects(id, slug, name, description): top-level subject taxonomy
- topics(id, subject_id, slug, name, description): per-subject topics
- schools(id, name, code): multi-school tenancy foundation

## Modified Tables
- profiles: +full_name, school_id, age, bio, coins, hint_tokens,
  fifty_fifty_tokens, skip_question_tokens, mystery_boxes,
  double_coins_expires_at, active_border, active_name_effect, flair,
  streak_days, last_reward_date
- questions: +topic_id, pool_name, is_active, unhide_at, uploads_enabled,
  graph_data, source
- rooms: +mode, max_players, topic_id
- game_sessions: +generated_question

## Security
- RLS enabled on all new tables
- user_roles: users can read own roles; admin-only writes via RPC
- subjects/topics/schools: public read, admin-only write
- profiles UPDATE policy tightened: users can only update non-privileged columns
  (coins, total_score, total_wins, total_games, weekly_score, monthly_score
  are NOT client-writable)
- is_admin column retained (NOT dropped) until Phase 7 for backward compat
*/

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Schools (multi-tenancy foundation)
CREATE TABLE IF NOT EXISTS public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subjects (data-driven taxonomy — replaces hardcoded CATEGORIES)
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Topics (per-subject — replaces hardcoded topic strings)
CREATE TABLE IF NOT EXISTS public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles (extends auth.users — extended with economy/gamification columns)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  avatar_url TEXT,
  full_name TEXT,
  school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  age INTEGER,
  bio TEXT,
  is_admin BOOLEAN DEFAULT FALSE, -- retained until Phase 7
  is_banned BOOLEAN DEFAULT FALSE,
  -- Stats (NOT client-writable — updated via RPC only)
  total_games INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  weekly_score INTEGER DEFAULT 0,
  monthly_score INTEGER DEFAULT 0,
  -- Economy (NOT client-writable — updated via RPC only)
  coins INTEGER DEFAULT 100,
  hint_tokens INTEGER DEFAULT 0,
  fifty_fifty_tokens INTEGER DEFAULT 0,
  skip_question_tokens INTEGER DEFAULT 0,
  mystery_boxes INTEGER DEFAULT 0,
  double_coins_expires_at TIMESTAMPTZ,
  -- Cosmetics (client-writable — display preferences)
  active_border TEXT,
  active_name_effect TEXT,
  flair TEXT,
  -- Gamification (NOT client-writable)
  streak_days INTEGER DEFAULT 0,
  last_reward_date DATE,
  -- Presence
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Roles (replaces is_admin — privilege assignments)
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, role)
);

-- Question Bank (extended with topic_id, pool, source, reveal, graph_data)
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL, -- retained for backward compat; new code uses topic_id
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.questions(id),
  generated_question JSONB, -- for non-banked generated questions
  round_number INTEGER NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- Player Answers
CREATE TABLE IF NOT EXISTS public.player_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sender_id, receiver_id)
);

-- ============================================
-- FUNCTIONS
-- ============================================

-- has_role(): SECURITY DEFINER role check (replaces is_admin column reads)
CREATE OR REPLACE FUNCTION public.has_role(p_user_id UUID, p_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id AND role = p_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- update_player_stats (existing, retained)
CREATE OR REPLACE FUNCTION public.update_player_stats(
  p_user_id UUID,
  p_games INTEGER DEFAULT 0,
  p_wins INTEGER DEFAULT 0,
  p_score INTEGER DEFAULT 0
) RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET
    total_games = total_games + COALESCE(p_games, 0),
    total_wins = total_wins + COALESCE(p_wins, 0),
    total_score = total_score + COALESCE(p_score, 0),
    weekly_score = weekly_score + COALESCE(p_score, 0),
    monthly_score = monthly_score + COALESCE(p_score, 0),
    updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- reset weekly/monthly scores (existing, retained)
CREATE OR REPLACE FUNCTION public.reset_weekly_scores()
RETURNS void AS $$
BEGIN
  UPDATE public.profiles SET weekly_score = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.reset_monthly_scores()
RETURNS void AS $$
BEGIN
  UPDATE public.profiles SET monthly_score = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- get_user_rank (existing, retained)
CREATE OR REPLACE FUNCTION public.get_user_rank(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    user_rank INTEGER;
BEGIN
    SELECT rank INTO user_rank
    FROM (
        SELECT id, RANK() OVER (ORDER BY total_score DESC) as rank
        FROM public.profiles
    ) sub
    WHERE id = p_user_id;
    RETURN user_rank;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- handle_new_user trigger (existing, retained — creates profile on signup)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- GRANTS
-- ============================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Public read tables
GRANT SELECT ON public.subjects TO anon, authenticated;
GRANT SELECT ON public.topics TO anon, authenticated;
GRANT SELECT ON public.schools TO anon, authenticated;
GRANT SELECT ON public.questions TO anon, authenticated;
GRANT SELECT ON public.rooms TO anon, authenticated;
GRANT SELECT ON public.room_players TO anon, authenticated;
GRANT SELECT ON public.profiles TO anon, authenticated;

-- Authenticated write tables
GRANT INSERT, UPDATE, DELETE ON public.rooms TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.room_players TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.player_answers TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.friendships TO authenticated;
GRANT UPDATE ON public.profiles TO authenticated;

-- user_roles: read own only (writes via RPC)
GRANT SELECT ON public.user_roles TO authenticated;

-- Sequences
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================
-- RLS
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- Profiles: public read, restricted update (no score/coin columns)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- Prevent client-side writes to privileged columns
    AND NOT (
      total_games IS DISTINCT FROM (SELECT total_games FROM public.profiles WHERE id = auth.uid())
      OR total_wins IS DISTINCT FROM (SELECT total_wins FROM public.profiles WHERE id = auth.uid())
      OR total_score IS DISTINCT FROM (SELECT total_score FROM public.profiles WHERE id = auth.uid())
      OR weekly_score IS DISTINCT FROM (SELECT weekly_score FROM public.profiles WHERE id = auth.uid())
      OR monthly_score IS DISTINCT FROM (SELECT monthly_score FROM public.profiles WHERE id = auth.uid())
      OR coins IS DISTINCT FROM (SELECT coins FROM public.profiles WHERE id = auth.uid())
      OR hint_tokens IS DISTINCT FROM (SELECT hint_tokens FROM public.profiles WHERE id = auth.uid())
      OR fifty_fifty_tokens IS DISTINCT FROM (SELECT fifty_fifty_tokens FROM public.profiles WHERE id = auth.uid())
      OR skip_question_tokens IS DISTINCT FROM (SELECT skip_question_tokens FROM public.profiles WHERE id = auth.uid())
      OR mystery_boxes IS DISTINCT FROM (SELECT mystery_boxes FROM public.profiles WHERE id = auth.uid())
      OR streak_days IS DISTINCT FROM (SELECT streak_days FROM public.profiles WHERE id = auth.uid())
      OR last_reward_date IS DISTINCT FROM (SELECT last_reward_date FROM public.profiles WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id AND is_admin = false);

-- user_roles: users read own roles
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
CREATE POLICY "Users can read own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- subjects: public read
DROP POLICY IF EXISTS "Subjects are publicly readable" ON public.subjects;
CREATE POLICY "Subjects are publicly readable"
  ON public.subjects FOR SELECT TO anon, authenticated USING (true);

-- topics: public read
DROP POLICY IF EXISTS "Topics are publicly readable" ON public.topics;
CREATE POLICY "Topics are publicly readable"
  ON public.topics FOR SELECT TO anon, authenticated USING (true);

-- schools: public read
DROP POLICY IF EXISTS "Schools are publicly readable" ON public.schools;
CREATE POLICY "Schools are publicly readable"
  ON public.schools FOR SELECT TO anon, authenticated USING (true);

-- Questions: public read (only active or revealed)
DROP POLICY IF EXISTS "Questions are viewable by everyone" ON public.questions;
CREATE POLICY "Questions are viewable by everyone"
  ON public.questions FOR SELECT TO anon, authenticated
  USING (is_active = true AND (unhide_at IS NULL OR unhide_at <= NOW()));

-- Questions: admin/teacher insert
DROP POLICY IF EXISTS "Admins can create questions" ON public.questions;
CREATE POLICY "Admins can create questions"
  ON public.questions FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'));

-- Questions: admin/teacher update
DROP POLICY IF EXISTS "Admins can update questions" ON public.questions;
CREATE POLICY "Admins can update questions"
  ON public.questions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'));

-- Questions: admin delete
DROP POLICY IF EXISTS "Admins can delete questions" ON public.questions;
CREATE POLICY "Admins can delete questions"
  ON public.questions FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Rooms: public read, authenticated create, host update/delete
DROP POLICY IF EXISTS "Rooms are viewable by everyone" ON public.rooms;
CREATE POLICY "Rooms are viewable by everyone"
  ON public.rooms FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can create rooms" ON public.rooms;
CREATE POLICY "Authenticated users can create rooms"
  ON public.rooms FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Hosts can update room status" ON public.rooms;
CREATE POLICY "Hosts can update room status"
  ON public.rooms FOR UPDATE TO authenticated
  USING (auth.uid() = host_id);

DROP POLICY IF EXISTS "Hosts can delete rooms" ON public.rooms;
CREATE POLICY "Hosts can delete rooms"
  ON public.rooms FOR DELETE TO authenticated
  USING (auth.uid() = host_id);

-- Room players
DROP POLICY IF EXISTS "Room players are viewable by everyone" ON public.room_players;
CREATE POLICY "Room players are viewable by everyone"
  ON public.room_players FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can join rooms" ON public.room_players;
CREATE POLICY "Authenticated users can join rooms"
  ON public.room_players FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = player_id);

DROP POLICY IF EXISTS "Players can update own score" ON public.room_players;
CREATE POLICY "Players can update own score"
  ON public.room_players FOR UPDATE TO authenticated
  USING (auth.uid() = player_id);

DROP POLICY IF EXISTS "Players can leave rooms" ON public.room_players;
CREATE POLICY "Players can leave rooms"
  ON public.room_players FOR DELETE TO authenticated
  USING (auth.uid() = player_id);

-- Player answers
DROP POLICY IF EXISTS "Users can view own answers" ON public.player_answers;
CREATE POLICY "Users can view own answers"
  ON public.player_answers FOR SELECT TO authenticated
  USING (auth.uid() = player_id);

DROP POLICY IF EXISTS "Users can insert own answers" ON public.player_answers;
CREATE POLICY "Users can insert own answers"
  ON public.player_answers FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = player_id);

-- Friendships
DROP POLICY IF EXISTS "Friendships are viewable by participants" ON public.friendships;
CREATE POLICY "Friendships are viewable by participants"
  ON public.friendships FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can send friend requests" ON public.friendships;
CREATE POLICY "Users can send friend requests"
  ON public.friendships FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can update own friendships" ON public.friendships;
CREATE POLICY "Users can update own friendships"
  ON public.friendships FOR UPDATE TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can delete own friendships" ON public.friendships;
CREATE POLICY "Users can delete own friendships"
  ON public.friendships FOR DELETE TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_questions_category ON public.questions(category);
CREATE INDEX IF NOT EXISTS idx_questions_topic ON public.questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_questions_pool ON public.questions(pool_name, is_active);
CREATE INDEX IF NOT EXISTS idx_rooms_code ON public.rooms(code);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON public.rooms(status);
CREATE INDEX IF NOT EXISTS idx_room_players_room ON public.room_players(room_id);
CREATE INDEX IF NOT EXISTS idx_profiles_score ON public.profiles(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_topics_subject ON public.topics(subject_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);

-- ============================================
-- SEED: Subjects & Topics
-- ============================================

INSERT INTO public.subjects (slug, name, description, icon, color)
VALUES ('mathematics', 'Mathematics', 'WASSCE-oriented mathematics', 'PlusSquare', '#6366F1')
ON CONFLICT (slug) DO NOTHING;

-- Seed 25 math topics
INSERT INTO public.topics (subject_id, slug, name, display_order) VALUES
((SELECT id FROM public.subjects WHERE slug = 'mathematics'), 'sets', 'Sets', 1),
((SELECT id FROM public.subjects WHERE slug = 'mathematics'), 'percentages', 'Percentages', 2),
((SELECT id FROM public.subjects WHERE slug = 'mathematics'), 'fractions', 'Fractions', 3),
((SELECT id FROM public.subjects WHERE slug = 'mathematics'), 'indices', 'Indices', 4),
((SELECT id FROM public.subjects WHERE slug = 'mathematics'), 'surds', 'Surds', 5),
((SELECT id FROM public.subjects WHERE slug = 'mathematics'), 'binary_operations', 'Binary Operations', 6),
((SELECT id FROM public.subjects WHERE slug = 'mathematics'), 'relations_and_functions', 'Relations & Functions', 7),
((SELECT id FROM public.subjects WHERE slug = 'mathematics'), 'sequence_and_series', 'Sequence & Series', 8),
((SELECT id FROM public.subjects WHERE slug = 'mathematics'), 'word_problems', 'Word Problems', 9),
((SELECT id FROM public.subjects WHERE slug = 'mathematics'), 'shapes', 'Shapes (Geometry)', 10),
((SELECT id FROM public.subjects WHERE slug = 'mathematics'), 'algebra_basics', 'Algebra Basics', 11),
((SELECT id FROM public.subjects WHERE slug = 'mathematics'), 'linear_algebra', 'Linear Algebra', 12),
((SELECT id FROM public.subjects WHERE slug = 'mathematics'), 'logarithms', 'Logarithms', 13),
((SELECT id FROM public.subjects WHERE slug = 'mathematics'), 'probability', 'Probability', 14),
((SELECT id FROM public.subjects WHERE slug = 'mathematics'), 'binomial_theorem', 'Binomial Theorem', 15),
((SELECT id FROM public.subjects WHERE slug = 'mathematics'), 'polynomial_functions', 'Polynomial Functions', 16),
((SELECT id FROM public.subjects WHERE slug = 'mathematics'), 'rational_functions', 'Rational Functions', 17),
((SELECT id FROM public.subjects WHERE slug = 'mathematics'), 'trigonometry', 'Trigonometry', 18),
((SELECT id FROM public.subjects WHERE slug = 'mathematics'), 'vectors', 'Vectors', 19),
((SELECT id FROM public.subjects WHERE slug = 'mathematics'), 'statistics', 'Statistics', 20),
((SELECT id FROM public.subjects WHERE slug = 'mathematics'), 'coordinate_geometry', 'Coordinate Geometry', 21),
((SELECT id FROM public.subjects WHERE slug = 'mathematics'), 'intro_to_calculus', 'Introduction to Calculus', 22),
((SELECT id FROM public.subjects WHERE slug = 'mathematics'), 'number_bases', 'Number Bases', 23),
((SELECT id FROM public.subjects WHERE slug = 'mathematics'), 'modulo_arithmetic', 'Modulo Arithmetic', 24),
((SELECT id FROM public.subjects WHERE slug = 'mathematics'), 'advanced_combo', 'Advanced Combo', 25)
ON CONFLICT (slug) DO NOTHING;

-- Also seed the original 4 QuizApp categories as subjects for backward compat
INSERT INTO public.subjects (slug, name, description, icon, color) VALUES
('science', 'Science', 'General science questions', 'Beaker', '#10B981'),
('tech', 'Technology', 'Technology questions', 'Cpu', '#06B6D4'),
('engineering', 'Engineering', 'Engineering questions', 'Wrench', '#F59E0B')
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- SEED: Questions (from original schema)
-- ============================================

INSERT INTO public.questions (category, difficulty, question_text, options, correct_answer, explanation) VALUES
('science', 'easy', 'What is the closest star to Earth?', '["Alpha Centauri", "Sirius", "The Sun", "Proxima Centauri"]', 2, 'The Sun is the closest star to Earth, at an average distance of 93 million miles.'),
('science', 'medium', 'Which planet has the most moons?', '["Mars", "Jupiter", "Saturn", "Neptune"]', 2, 'As of 2023, Saturn has 146 confirmed moons, surpassing Jupiter.'),
('science', 'hard', 'What is the rarest natural element on Earth?', '["Astatine", "Francium", "Oganesson", "Radium"]', 0, 'Astatine is the rarest naturally occurring element in the Earth''s crust.'),
('science', 'medium', 'What is the powerhouse of the cell?', '["Nucleus", "Ribosome", "Mitochondria", "Endoplasmic Reticulum"]', 2, 'Mitochondria are often called the powerhouse of the cell because they generate ATP.'),
('science', 'easy', 'What is the chemical symbol for water?', '["CO2", "H2O", "NaCl", "O2"]', 1, 'H2O represents two hydrogen atoms and one oxygen atom.'),
('science', 'medium', 'How many elements are in the periodic table?', '["108", "112", "118", "124"]', 2, 'There are 118 confirmed elements in the periodic table.'),
('science', 'hard', 'What is the most abundant gas in Earth''s atmosphere?', '["Oxygen", "Carbon Dioxide", "Nitrogen", "Argon"]', 2, 'Nitrogen makes up about 78% of Earth''s atmosphere.'),
('science', 'easy', 'Which organ is responsible for pumping blood?', '["Lungs", "Brain", "Heart", "Liver"]', 2, 'The heart pumps blood throughout the body.'),
('science', 'medium', 'What is the study of plants called?', '["Botany", "Zoology", "Geology", "Astronomy"]', 0, 'Botany is the branch of biology that deals with plants.'),
('science', 'hard', 'Who proposed the theory of general relativity?', '["Isaac Newton", "Albert Einstein", "Nikola Tesla", "Stephen Hawking"]', 1, 'Albert Einstein published the theory of general relativity in 1915.'),
('science', 'easy', 'What do bees collect and use to make honey?', '["Pollen", "Nectar", "Sap", "Water"]', 1, 'Bees collect nectar from flowers to make honey.'),
('science', 'medium', 'What is the boiling point of water in Celsius?', '["90°C", "100°C", "110°C", "120°C"]', 1, 'Water boils at 100°C at standard atmospheric pressure.'),
('science', 'hard', 'What is the name of the largest bone in the human body?', '["Tibia", "Fibula", "Femur", "Humerus"]', 2, 'The femur, or thigh bone, is the largest and strongest bone in the human body.'),
('science', 'easy', 'Which gas do plants absorb from the atmosphere?', '["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"]', 2, 'Plants absorb carbon dioxide for photosynthesis.'),
('science', 'medium', 'What is the hardest natural substance on Earth?', '["Gold", "Iron", "Diamond", "Platinum"]', 2, 'Diamond is the hardest known natural substance.'),
('science', 'hard', 'What is the speed of sound in air?', '["343 m/s", "300,000 km/s", "1,000 m/s", "500 km/h"]', 0, 'The speed of sound in dry air at 20°C is approximately 343 meters per second.'),
('science', 'easy', 'Which planet is known as the Blue Planet?', '["Mars", "Earth", "Neptune", "Uranus"]', 1, 'Earth is called the Blue Planet because of its vast oceans.'),
('science', 'medium', 'What is the primary source of energy for Earth?', '["The Moon", "The Sun", "Geothermal Heat", "Wind"]', 1, 'The Sun provides the energy that sustains life on Earth.'),
('science', 'hard', 'What is the process by which liquid water turns into vapor?', '["Condensation", "Sublimation", "Evaporation", "Freezing"]', 2, 'Evaporation is the process of a liquid turning into a gas.'),
('science', 'easy', 'How many legs does a spider have?', '["6", "8", "10", "12"]', 1, 'Spiders are arachnids and have eight legs.'),
('science', 'medium', 'What is the main component of natural gas?', '["Ethane", "Propane", "Methane", "Butane"]', 2, 'Methane is the primary component of natural gas.'),
('science', 'hard', 'What is the pH level of pure water?', '["5", "6", "7", "8"]', 2, 'Pure water has a neutral pH of 7.'),
('science', 'easy', 'What is the name of the galaxy we live in?', '["Andromeda", "Milky Way", "Sombrero", "Whirlpool"]', 1, 'Our solar system is located in the Milky Way galaxy.'),
('science', 'medium', 'What is the study of the Earth''s structure called?', '["Geography", "Geology", "Meteorology", "Oceanography"]', 1, 'Geology is the study of the solid Earth and the processes by which it changes.'),
('science', 'hard', 'What are the three states of matter?', '["Solid, Liquid, Gas", "Fire, Water, Earth", "Atom, Molecule, Compound", "Hot, Cold, Warm"]', 0, 'The traditional three states of matter are solid, liquid, and gas.'),
('tech', 'easy', 'Who is the co-founder of Microsoft?', '["Steve Jobs", "Bill Gates", "Mark Zuckerberg", "Elon Musk"]', 1, 'Bill Gates co-founded Microsoft with Paul Allen.'),
('tech', 'medium', 'What does HTTP stand for?', '["HyperText Transfer Protocol", "HyperText Type Process", "High Transfer Text Protocol", "Hyperlink Text Transfer Process"]', 0, 'HTTP is the foundation of data communication for the World Wide Web.'),
('tech', 'hard', 'In what year was the first commercial microprocessor, the Intel 4004, released?', '["1969", "1971", "1975", "1980"]', 1, 'The Intel 4004 was released in 1971.'),
('tech', 'medium', 'What does RAM stand for?', '["Read Access Memory", "Random Access Memory", "Run Access Memory", "Remote Access Memory"]', 1, 'RAM is a form of computer data storage that stores data and machine code currently being used.'),
('tech', 'easy', 'Which company developed the Android operating system?', '["Apple", "Microsoft", "Google", "IBM"]', 2, 'Google leads the development of the Android OS.'),
('tech', 'medium', 'What is the main language used for styling web pages?', '["HTML", "CSS", "JavaScript", "Python"]', 1, 'CSS (Cascading Style Sheets) is used for styling the visual presentation of web pages.'),
('tech', 'hard', 'Who is considered the first computer programmer?', '["Alan Turing", "Charles Babbage", "Ada Lovelace", "Grace Hopper"]', 2, 'Ada Lovelace is often considered the first computer programmer for her work on Babbage''s Analytical Engine.'),
('tech', 'easy', 'What is the most popular search engine?', '["Bing", "Yahoo", "Google", "DuckDuckGo"]', 2, 'Google is the most widely used search engine in the world.'),
('tech', 'medium', 'What does URL stand for?', '["Universal Resource Locator", "Uniform Resource Locator", "United Resource Link", "Uniform Resource Link"]', 1, 'URL is the address of a resource on the internet.'),
('tech', 'hard', 'What was the first computer mouse made of?', '["Plastic", "Metal", "Wood", "Glass"]', 2, 'The first computer mouse, invented by Douglas Engelbart, was made of wood.'),
('tech', 'easy', 'What does USB stand for?', '["Universal System Bus", "Universal Serial Bus", "United Serial Bus", "Unique Serial Bus"]', 1, 'USB is a common interface for connecting devices to computers.'),
('tech', 'medium', 'Which programming language is known as the "language of the web"?', '["Java", "C++", "JavaScript", "Ruby"]', 2, 'JavaScript is essential for web development alongside HTML and CSS.'),
('tech', 'hard', 'What does "GUI" stand for?', '["Graphical User Interface", "Global User Interface", "General User Interface", "Graphical User Index"]', 0, 'GUI allows users to interact with electronic devices through graphical icons.'),
('tech', 'easy', 'What is the "brain" of the computer?', '["Hard Drive", "RAM", "CPU", "Motherboard"]', 2, 'The CPU (Central Processing Unit) performs most of the processing inside a computer.'),
('tech', 'medium', 'What is Linux?', '["A programming language", "An operating system kernel", "A hardware manufacturer", "A web browser"]', 1, 'Linux is a family of open-source Unix-like operating systems based on the Linux kernel.'),
('tech', 'hard', 'What does "BIOS" stand for?', '["Basic Input Output System", "Binary Input Output System", "Basic Internal Output System", "Binary Internal Output System"]', 0, 'BIOS is firmware used to perform hardware initialization during the booting process.'),
('tech', 'easy', 'What is the domain name of the most popular social media for professionals?', '["facebook.com", "twitter.com", "linkedin.com", "instagram.com"]', 2, 'LinkedIn is the largest professional social network.'),
('tech', 'medium', 'What is "Cloud Computing"?', '["Computing using only local servers", "On-demand delivery of IT resources via the internet", "Computing that happens in the atmosphere", "A type of weather forecasting"]', 1, 'Cloud computing provides access to servers, storage, and databases over the internet.'),
('tech', 'hard', 'What is "Phishing"?', '["A type of recreational fishing", "A fraudulent attempt to obtain sensitive information", "A method of computer cooling", "A type of network cabling"]', 1, 'Phishing is a cybercrime where targets are contacted by email, telephone or text message by someone posing as a legitimate institution.'),
('tech', 'easy', 'What is a "Bug" in computer software?', '["An actual insect inside the computer", "An error, flaw or fault in a computer program", "A type of hardware upgrade", "A software feature"]', 1, 'A software bug causes a program to produce an incorrect or unexpected result.'),
('tech', 'medium', 'What does "VPN" stand for?', '["Virtual Private Network", "Virtual Public Network", "Variable Private Network", "Visual Private Network"]', 0, 'A VPN extends a private network across a public network.'),
('tech', 'hard', 'Who developed the C programming language?', '["Bjarne Stroustrup", "Dennis Ritchie", "James Gosling", "Guido van Rossum"]', 1, 'Dennis Ritchie developed C between 1972 and 1973 at Bell Labs.'),
('tech', 'easy', 'What is the "Enter" key on a keyboard used for?', '["To delete text", "To start a new line or confirm a command", "To escape from a program", "To open the start menu"]', 1, 'The Enter key is primarily used to signal the end of an entry and start a new one.'),
('tech', 'medium', 'What is "Open Source" software?', '["Software that is free to buy", "Software with source code that anyone can inspect, modify, and enhance", "Software that can only be used outdoors", "Software developed by a single person"]', 1, 'Open-source software promotes collaboration and transparency.'),
('tech', 'hard', 'What does "IoT" stand for?', '["Internet of Things", "Input Output Technology", "Internal of Tools", "Internet of Tools"]', 0, 'IoT refers to the network of physical objects embedded with sensors and software.'),
('engineering', 'easy', 'What is the primary function of a bridge?', '["To look good", "To provide a path over an obstacle", "To slow down traffic", "To house people"]', 1, 'Bridges are built to span physical obstacles without closing the way underneath.'),
('engineering', 'medium', 'What does "CAD" stand for?', '["Computer-Aided Design", "Computer-Added Design", "Computer-Analysis Design", "Computer-Applied Design"]', 0, 'CAD is the use of computers to aid in the creation, modification, analysis, or optimization of a design.'),
('engineering', 'hard', 'What is the "Young''s modulus" a measure of?', '["Density", "Stiffness of a solid material", "Thermal conductivity", "Electrical resistance"]', 1, 'Young''s modulus defines the relationship between stress and strain in a material.'),
('engineering', 'medium', 'Which branch of engineering deals with the design and construction of aircraft?', '["Civil Engineering", "Mechanical Engineering", "Aerospace Engineering", "Chemical Engineering"]', 2, 'Aerospace engineering is the primary field concerned with the development of aircraft and spacecraft.'),
('engineering', 'easy', 'What is a "Levee" used for?', '["To generate electricity", "To prevent the overflow of a river", "To support a roof", "To measure wind speed"]', 1, 'A levee is an elongated naturally occurring ridge or artificially constructed fill or wall that regulates water levels.'),
('engineering', 'medium', 'What is "Thermodynamics" the study of?', '["Living organisms", "Rocks and minerals", "Heat, work, and energy", "Sound waves"]', 2, 'Thermodynamics deals with the relations between heat and other forms of energy.'),
('engineering', 'hard', 'What is the purpose of a "Flywheel"?', '["To catch flies", "To store rotational energy", "To cool the engine", "To steer the vehicle"]', 1, 'A flywheel is a mechanical device specifically designed to efficiently store rotational energy.'),
('engineering', 'easy', 'Which metal is most commonly used in electrical wiring?', '["Silver", "Copper", "Aluminum", "Gold"]', 1, 'Copper is used because of its excellent electrical conductivity.'),
('engineering', 'medium', 'What is a "Truss" in structural engineering?', '["A type of foundation", "A framework of connected elements forming triangular units", "A decorative element", "A type of concrete"]', 1, 'Trusses are used in bridges, roofs, and other structures for their strength and efficiency.'),
('engineering', 'hard', 'What is the "Bernoulli''s principle" related to?', '["Electricity", "Fluid dynamics", "Magnetism", "Nuclear physics"]', 1, 'Bernoulli''s principle states that an increase in the speed of a fluid occurs simultaneously with a decrease in static pressure.'),
('engineering', 'easy', 'What do Civil Engineers primarily design?', '["Electronic circuits", "Infrastructure like roads and buildings", "Chemical processes", "Computer software"]', 1, 'Civil engineering deals with the design, construction, and maintenance of the physical and naturally built environment.'),
('engineering', 'medium', 'What is the main purpose of a "Gear"?', '["To change the direction of motion", "To transmit torque and motion", "To stop a machine", "To generate heat"]', 1, 'Gears are used to transmit power and motion between rotating shafts.'),
('engineering', 'hard', 'What is "Pascal''s Law" used in?', '["Aerodynamics", "Hydraulic systems", "Electronics", "Optical systems"]', 1, 'Pascal''s Law states that pressure exerted anywhere in a confined incompressible fluid is transmitted equally in all directions.'),
('engineering', 'easy', 'What is a "Solar Panel" used for?', '["To reflect sunlight", "To convert sunlight into electricity", "To heat a swimming pool", "To provide shade"]', 1, 'Solar panels use the photovoltaic effect to generate electricity from sunlight.'),
('engineering', 'medium', 'What is "Reinforced Concrete"?', '["Concrete with extra sand", "Concrete in which steel bars are embedded to increase its strength", "Concrete that is very old", "Concrete mixed with paint"]', 1, 'Reinforcement increases the tensile strength of concrete.'),
('engineering', 'hard', 'What is the "Mach number" a ratio of?', '["Mass to volume", "Speed of an object to the speed of sound", "Force to area", "Voltage to current"]', 1, 'Mach number represents the speed of an object relative to the speed of sound in the surrounding medium.'),
('engineering', 'easy', 'What does a "Voltmeter" measure?', '["Current", "Voltage", "Resistance", "Power"]', 1, 'A voltmeter is an instrument used for measuring electrical potential difference between two points.'),
('engineering', 'medium', 'What is "Lean Manufacturing"?', '["Manufacturing thin products", "A systematic method for waste minimization", "Manufacturing with very few people", "Manufacturing without using machines"]', 1, 'Lean manufacturing aims to improve efficiency by eliminating non-value-adding activities.'),
('engineering', 'hard', 'What is the "Turing Test" intended to measure?', '["A computer''s processing speed", "A machine''s ability to exhibit intelligent behavior equivalent to a human", "A network''s security", "A software''s reliability"]', 1, 'Proposed by Alan Turing, the test assesses machine intelligence.'),
('engineering', 'easy', 'What is a "Blueprint"?', '["A drawing that is blue", "A technical drawing or design plan", "A type of artist''s sketch", "A map of the ocean"]', 1, 'Blueprints are used to convey complex architectural or engineering designs.'),
('engineering', 'medium', 'What is "Kinematics"?', '["The study of forces", "The study of motion without considering its causes", "The study of energy", "The study of fluids"]', 1, 'Kinematics is a branch of classical mechanics that describes the motion of points, bodies, and systems of bodies.'),
('engineering', 'hard', 'What is the "Fatigue" of a material?', '["The material is tired", "The weakening of a material caused by cyclic loading", "The material is too old", "The material is melting"]', 1, 'Material fatigue can lead to structural failure even if the maximum stress is below the yield strength.'),
('engineering', 'easy', 'What is a "Turbine" used for?', '["To slow down wind", "To convert the energy of a moving fluid into rotational energy", "To pump water", "To store electricity"]', 1, 'Turbines are used in power plants to generate electricity.'),
('engineering', 'medium', 'What is "Bioengineering"?', '["Engineering using only natural materials", "The application of engineering principles to biology and medicine", "Engineering that is environmentally friendly", "The study of ancient tools"]', 1, 'Bioengineering aims to improve healthcare and understand biological systems.'),
('engineering', 'hard', 'What is a "Governor" in mechanical engineering?', '["A person who leads a state", "A device used to measure or regulate the speed of a machine", "A type of large gear", "A safety valve"]', 1, 'Centrifugal governors were famously used by James Watt to regulate steam engines.'),
('math', 'easy', 'What is the value of Pi (to two decimal places)?', '["3.12", "3.14", "3.16", "3.18"]', 1, 'Pi (π) is approximately 3.14159...'),
('math', 'medium', 'What is the square root of 144?', '["10", "12", "14", "16"]', 1, '12 multiplied by 12 equals 144.'),
('math', 'hard', 'What is the derivative of sin(x)?', '["-sin(x)", "cos(x)", "-cos(x)", "tan(x)"]', 1, 'In calculus, the derivative of the sine function is the cosine function.'),
('math', 'medium', 'How many sides does a heptagon have?', '["5", "6", "7", "8"]', 2, 'A heptagon is a polygon with seven sides.'),
('math', 'easy', 'What is 7 multiplied by 8?', '["48", "54", "56", "62"]', 2, '7 x 8 = 56.'),
('math', 'medium', 'What is the sum of the interior angles of a triangle?', '["90°", "180°", "270°", "360°"]', 1, 'The sum of the angles in any triangle is always 180 degrees.'),
('math', 'hard', 'What is the "Fibonacci sequence" based on?', '["Prime numbers", "Adding the two preceding numbers", "Multiplying by 2", "Subtracting 1"]', 1, 'Each number in the sequence is the sum of the two preceding ones (0, 1, 1, 2, 3, 5, 8, 13...).'),
('math', 'easy', 'What is the name of an angle greater than 90 degrees but less than 180 degrees?', '["Acute", "Right", "Obtuse", "Straight"]', 2, 'Obtuse angles are wider than right angles but smaller than straight angles.'),
('math', 'medium', 'What is the formula for the area of a circle?', '["2πr", "πr²", "πd", "bh/2"]', 1, 'Area = π * radius squared.'),
('math', 'hard', 'Who is known as the "Prince of Mathematicians"?', '["Isaac Newton", "Leonhard Euler", "Carl Friedrich Gauss", "Pythagoras"]', 2, 'Gauss made significant contributions to many fields in mathematics and science.'),
('math', 'easy', 'How many degrees are in a right angle?', '["45°", "90°", "180°", "360°"]', 1, 'A right angle is exactly 90 degrees.'),
('math', 'medium', 'What is the value of 5!', '["25", "60", "120", "500"]', 2, '5! (5 factorial) = 5 x 4 x 3 x 2 x 1 = 120.'),
('math', 'hard', 'What is the base of natural logarithms?', '["10", "2", "e", "pi"]', 2, 'The constant e (approximately 2.718) is the base of natural logarithms.'),
('math', 'easy', 'What is a "Prime Number"?', '["A number divisible by only 1 and itself", "An even number", "A number ending in 5", "A negative number"]', 0, 'Prime numbers have exactly two distinct positive divisors: 1 and themselves.'),
('math', 'medium', 'What is the Pythagorean theorem?', '["a + b = c", "a² + b² = c²", "ab = c", "a² - b² = c²"]', 1, 'It relates the sides of a right-angled triangle.'),
('math', 'hard', 'What is the "Golden Ratio" approximately equal to?', '["1.414", "1.618", "2.718", "3.141"]', 1, 'The golden ratio (phi) is an irrational number approximately equal to 1.618.'),
('math', 'easy', 'What is the result of 100 divided by 4?', '["20", "25", "30", "40"]', 1, '100 / 4 = 25.'),
('math', 'medium', 'What is an "Integer"?', '["A fraction", "A whole number (positive, negative, or zero)", "A decimal", "An imaginary number"]', 1, 'Integers are numbers that can be written without a fractional component.'),
('math', 'hard', 'What is the "Law of Sines" used for?', '["Finding sides and angles of any triangle", "Finding the area of a circle", "Calculating compound interest", "Solving quadratic equations"]', 0, 'It relates the lengths of the sides of any triangle to the sines of its angles.'),
('math', 'easy', 'How many centimeters are in a meter?', '["10", "100", "1000", "10000"]', 1, 'There are 100 centimeters in 1 meter.'),
('math', 'medium', 'What is the "Median" of a set of numbers?', '["The average", "The most frequent value", "The middle value when the numbers are sorted", "The difference between highest and lowest"]', 2, 'The median is the value separating the higher half from the lower half of a data sample.'),
('math', 'hard', 'What is the "Fundamental Theorem of Calculus" about?', '["Relating differentiation and integration", "Solving for x", "Calculating probabilities", "The properties of prime numbers"]', 0, 'It links the concept of differentiating a function with the concept of integrating a function.'),
('math', 'easy', 'What is the perimeter of a square with side length 5?', '["10", "20", "25", "50"]', 1, 'Perimeter = 4 * side length = 4 * 5 = 20.'),
('math', 'medium', 'What is "Probability"?', '["The study of numbers", "The likelihood of an event occurring", "A type of geometric shape", "An algebraic expression"]', 1, 'Probability is a measure of the chance that an event will happen.'),
('math', 'hard', 'What is a "Matrix" in mathematics?', '["A type of computer screen", "A rectangular array of numbers arranged in rows and columns", "A mathematical constant", "A type of equation"]', 1, 'Matrices are used to represent linear transformations and solve systems of linear equations.')
ON CONFLICT (question_text) DO NOTHING;

-- ============================================
-- REALTIME
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'rooms') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'room_players') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.room_players;
    END IF;
END $$;
