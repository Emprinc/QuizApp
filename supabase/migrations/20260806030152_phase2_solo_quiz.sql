/*
# Phase 2 — Solo Quiz Runtime

IMPORTANT: This migration assumes Phase 0 has completed successfully.
Required Phase 0 tables: profiles, topics, user_skill_levels

Note: If Phase 0 has not run, foreign key creation will fail naturally.
This file is idempotent and can be re-run safely.
*/

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE RESTRICT,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  score INTEGER DEFAULT 0,
  questions_answered INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  coins_earned INTEGER DEFAULT 0,
  mode TEXT DEFAULT 'solo',
  state JSONB,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

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

CREATE TABLE IF NOT EXISTS public.user_skill_levels (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  skill_score INTEGER DEFAULT 50 CHECK (skill_score BETWEEN 0 AND 100),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, topic_id)
);

CREATE TABLE IF NOT EXISTS public.seen_questions (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_hash TEXT NOT NULL,
  topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, question_hash)
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON public.quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_topic ON public.quiz_attempts(topic_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_attempt ON public.quiz_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_user ON public.quiz_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_seen_questions_user ON public.seen_questions(user_id);

GRANT SELECT ON public.quiz_attempts TO authenticated;
GRANT INSERT ON public.quiz_attempts TO authenticated;
GRANT SELECT ON public.quiz_answers TO authenticated;
GRANT INSERT ON public.quiz_answers TO authenticated;
GRANT SELECT ON public.user_skill_levels TO authenticated;
GRANT SELECT, INSERT ON public.seen_questions TO authenticated;

ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skill_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seen_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own attempts" ON public.quiz_attempts;
CREATE POLICY "Users can view own attempts"
  ON public.quiz_attempts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own attempts" ON public.quiz_attempts;
CREATE POLICY "Users can create own attempts"
  ON public.quiz_attempts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own answers" ON public.quiz_answers;
CREATE POLICY "Users can view own answers"
  ON public.quiz_answers FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own answers" ON public.quiz_answers;
CREATE POLICY "Users can insert own answers"
  ON public.quiz_answers FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own skill levels" ON public.user_skill_levels;
CREATE POLICY "Users can view own skill levels"
  ON public.user_skill_levels FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own seen questions" ON public.seen_questions;
CREATE POLICY "Users can view own seen questions"
  ON public.seen_questions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own seen questions" ON public.seen_questions;
CREATE POLICY "Users can insert own seen questions"
  ON public.seen_questions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.submit_quiz_attempt(
  p_user_id UUID,
  p_topic_id UUID,
  p_difficulty TEXT,
  p_score INTEGER,
  p_questions_answered INTEGER,
  p_questions_correct INTEGER,
  p_coins_earned INTEGER DEFAULT 0
) RETURNS UUID AS $$
DECLARE
  attempt_id UUID;
  new_skill_score INTEGER;
  current_skill INTEGER;
BEGIN
  INSERT INTO public.quiz_attempts (
    user_id, topic_id, difficulty, score,
    questions_answered, questions_correct, coins_earned,
    mode, finished_at
  ) VALUES (
    p_user_id, p_topic_id, p_difficulty, p_score,
    p_questions_answered, p_questions_correct, p_coins_earned,
    'solo', NOW()
  ) RETURNING id INTO attempt_id;

  SELECT skill_score INTO current_skill FROM public.user_skill_levels
    WHERE user_id = p_user_id AND topic_id = p_topic_id;

  IF current_skill IS NULL THEN
    current_skill := 50;
  END IF;

  new_skill_score := GREATEST(1, LEAST(100, ROUND(current_skill * 0.75 + (CASE WHEN p_questions_answered > 0 THEN (p_questions_correct::FLOAT / p_questions_answered) * 100 ELSE 0 END) * 0.25)));

  INSERT INTO public.user_skill_levels (user_id, topic_id, skill_score, updated_at)
    VALUES (p_user_id, p_topic_id, new_skill_score, NOW())
    ON CONFLICT (user_id, topic_id)
    DO UPDATE SET skill_score = EXCLUDED.skill_score, updated_at = NOW();

  PERFORM public.update_player_stats(p_user_id, 1, 0, p_score);

  IF p_coins_earned > 0 THEN
    UPDATE public.profiles SET coins = coins + p_coins_earned WHERE id = p_user_id;
  END IF;

  RETURN attempt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_skill_score(
  p_user_id UUID,
  p_topic_id UUID
) RETURNS INTEGER AS $$
DECLARE
  score INTEGER;
BEGIN
  SELECT skill_score INTO score FROM public.user_skill_levels
    WHERE user_id = p_user_id AND topic_id = p_topic_id;
  RETURN COALESCE(score, 50);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.prune_seen_questions(
  p_user_id UUID,
  p_max_rows INTEGER DEFAULT 500
) RETURNS void AS $$
BEGIN
  DELETE FROM public.seen_questions
    WHERE user_id = p_user_id
    AND question_hash NOT IN (
      SELECT question_hash FROM public.seen_questions
        WHERE user_id = p_user_id
        ORDER BY created_at DESC
        LIMIT p_max_rows
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
