-- QuizBattle Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  is_banned BOOLEAN DEFAULT FALSE,
  total_games INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Question Bank
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer INTEGER NOT NULL CHECK (correct_answer BETWEEN 0 AND 3),
  explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Game Rooms
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(6) UNIQUE NOT NULL,
  host_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  question_count INTEGER DEFAULT 10 CHECK (question_count BETWEEN 5 AND 30),
  time_per_question INTEGER DEFAULT 15 CHECK (time_per_question BETWEEN 5 AND 60),
  status TEXT CHECK (status IN ('waiting', 'playing', 'finished')) DEFAULT 'waiting',
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

-- Game Sessions (for tracking individual rounds)
CREATE TABLE IF NOT EXISTS public.game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.questions(id),
  round_number INTEGER NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- Player Answers (for history/replays)
CREATE TABLE IF NOT EXISTS public.player_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
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

-- Function to update player stats
CREATE OR REPLACE FUNCTION public.update_player_stats(
  p_user_id UUID,
  p_games INTEGER DEFAULT 0,
  p_wins INTEGER DEFAULT 0,
  p_score INTEGER DEFAULT 0
) RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET
    total_games = total_games + p_games,
    total_wins = total_wins + p_wins,
    total_score = total_score + p_score,
    updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get or create profile on signup
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

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Questions policies (read-only for everyone)
CREATE POLICY "Questions are viewable by everyone"
  ON public.questions FOR SELECT
  USING (true);

-- Rooms policies
CREATE POLICY "Rooms are viewable by everyone"
  ON public.rooms FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create rooms"
  ON public.rooms FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Hosts can update room status"
  ON public.rooms FOR UPDATE
  USING (auth.uid() = host_id);

-- Room players policies
CREATE POLICY "Room players are viewable by everyone"
  ON public.room_players FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can join rooms"
  ON public.room_players FOR INSERT
  WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Players can update own score"
  ON public.room_players FOR UPDATE
  USING (auth.uid() = player_id);

-- Player answers policies
CREATE POLICY "Users can view own answers"
  ON public.player_answers FOR SELECT
  USING (auth.uid() = player_id);

CREATE POLICY "Users can insert own answers"
  ON public.player_answers FOR INSERT
  WITH CHECK (auth.uid() = player_id);

-- Friendships policies
CREATE POLICY "Friendships are viewable by participants"
  ON public.friendships FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send friend requests"
  ON public.friendships FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update own friendships"
  ON public.friendships FOR UPDATE
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can delete own friendships"
  ON public.friendships FOR DELETE
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_questions_category ON public.questions(category);
CREATE INDEX IF NOT EXISTS idx_rooms_code ON public.rooms(code);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON public.rooms(status);
CREATE INDEX IF NOT EXISTS idx_room_players_room ON public.room_players(room_id);
CREATE INDEX IF NOT EXISTS idx_profiles_score ON public.profiles(total_score DESC);

-- ============================================
-- SEED DATA (Sample Questions)
-- ============================================

INSERT INTO public.questions (category, difficulty, question_text, options, correct_answer, explanation) VALUES
-- General Knowledge
('general', 'medium', 'What is the largest planet in our solar system?', '["Mercury", "Venus", "Jupiter", "Saturn"]', 2, 'Jupiter is the largest planet with a diameter of about 139,820 km.'),
('general', 'easy', 'What is the capital of France?', '["London", "Berlin", "Paris", "Madrid"]', 2, 'Paris is the capital and largest city of France.'),
('general', 'hard', 'What year was the first iPhone released?', '["2005", "2006", "2007", "2008"]', 2, 'The first iPhone was released by Apple in June 2007.'),

-- Science
('science', 'medium', 'What is the chemical symbol for gold?', '["Go", "Gd", "Au", "Ag"]', 2, 'Au comes from the Latin word "aurum".'),
('science', 'easy', 'What planet is known as the Red Planet?', '["Venus", "Mars", "Jupiter", "Saturn"]', 1, 'Mars appears red due to iron oxide on its surface.'),
('science', 'hard', 'What is the speed of light in km/s?', '["299,792", "199,792", "399,792", "199,000"]', 0, 'Light travels at approximately 299,792 km per second.'),

-- History
('history', 'medium', 'In what year did World War II end?', '["1943", "1944", "1945", "1946"]', 2, 'World War II ended on September 2, 1945.'),
('history', 'easy', 'Who was the first President of the United States?', '["Thomas Jefferson", "George Washington", "John Adams", "Benjamin Franklin"]', 1, 'George Washington served from 1789 to 1797.'),
('history', 'hard', 'What year was the Berlin Wall torn down?', '["1987", "1988", "1989", "1990"]', 2, 'The Berlin Wall fell on November 9, 1989.'),

-- Sports
('sports', 'medium', 'How many players are on a basketball team on the court?', '["4", "5", "6", "7"]', 1, 'A basketball team has 5 players on the court at a time.'),
('sports', 'easy', 'Which country won the 2022 FIFA World Cup?', '["France", "Brazil", "Argentina", "Germany"]', 2, 'Argentina won the 2022 World Cup in Qatar.'),
('sports', 'hard', 'How many Grand Slam titles has Serena Williams won?', '["20", "23", "24", "25"]', 2, 'Serena Williams has won 23 Grand Slam singles titles.'),

-- Entertainment
('entertainment', 'medium', 'What is the highest-grossing film of all time?', '["Titanic", "Avengers: Endgame", "Avatar", "Star Wars"]', 2, 'Avatar (2009) is the highest-grossing film.'),
('entertainment', 'easy', 'Who played Iron Man in the Marvel Cinematic Universe?', '["Chris Evans", "Chris Hemsworth", "Robert Downey Jr.", "Mark Ruffalo"]', 2, 'Robert Downey Jr. played Tony Stark/Iron Man.'),
('entertainment', 'hard', 'In what year was the first Harry Potter book published?', '["1995", "1996", "1997", "1998"]', 2, 'Harry Potter and the Philosopher''s Stone was published in 1997.'),

-- Technology
('tech', 'medium', 'What does CPU stand for?', '["Central Processing Unit", "Computer Personal Unit", "Central Program Unit", "Core Processing Unit"]', 0, 'CPU stands for Central Processing Unit.'),
('tech', 'easy', 'Who founded Microsoft?', '["Steve Jobs", "Bill Gates", "Mark Zuckerberg", "Elon Musk"]', 1, 'Bill Gates co-founded Microsoft in 1975.'),
('tech', 'hard', 'What year was YouTube founded?', '["2003", "2004", "2005", "2006"]', 2, 'YouTube was founded in February 2005.');

-- ============================================
-- REALTIME CONFIGURATION
-- ============================================

-- Enable realtime for rooms table
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_players;