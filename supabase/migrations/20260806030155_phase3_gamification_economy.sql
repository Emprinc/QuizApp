/*
# Phase 3 — Gamification & Economy

IMPORTANT: This migration assumes Phase 0 and Phase 2 have completed successfully.
Required Phase 0 tables: profiles, user_roles, user_skill_levels
Required Phase 0 functions: has_role, update_player_stats, assign_role

Note: If Phase 0 has not run, table creation will fail naturally with clear FK errors.
This file is idempotent and can be re-run safely.
*/

CREATE TABLE IF NOT EXISTS public.coin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  badge_icon TEXT,
  coin_reward INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_achievements (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);

CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  target_count INTEGER DEFAULT 10,
  coin_reward INTEGER DEFAULT 50,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_challenge_progress (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, challenge_id, date)
);

CREATE INDEX IF NOT EXISTS idx_coin_transactions_user ON public.coin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_progress_user ON public.user_challenge_progress(user_id);

GRANT SELECT ON public.coin_transactions TO authenticated;
GRANT SELECT ON public.achievements TO authenticated;
GRANT SELECT ON public.user_achievements TO authenticated;
GRANT SELECT ON public.challenges TO authenticated;
GRANT SELECT ON public.user_challenge_progress TO authenticated;
-- Challenges INSERT/UPDATE/DELETE via RPC only for admins/teachers (no direct table grant)

ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenge_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own transactions" ON public.coin_transactions;
CREATE POLICY "Users can view own transactions"
  ON public.coin_transactions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Achievements are publicly readable" ON public.achievements;
CREATE POLICY "Achievements are publicly readable"
  ON public.achievements FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Users can view own achievements" ON public.user_achievements;
CREATE POLICY "Users can view own achievements"
  ON public.user_achievements FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Challenges are publicly readable" ON public.challenges;
CREATE POLICY "Challenges are publicly readable"
  ON public.challenges FOR SELECT TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage challenges" ON public.challenges;
CREATE POLICY "Admins can manage challenges"
  ON public.challenges FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::TEXT) OR public.has_role(auth.uid(), 'teacher'::TEXT))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::TEXT) OR public.has_role(auth.uid(), 'teacher'::TEXT));

DROP POLICY IF EXISTS "Users can view own progress" ON public.user_challenge_progress;
CREATE POLICY "Users can view own progress"
  ON public.user_challenge_progress FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.purchase_item(
  p_user_id UUID,
  p_item_key TEXT,
  p_cost INTEGER,
  p_quantity INTEGER DEFAULT 1
) RETURNS BOOLEAN AS $$
DECLARE
  current_balance INTEGER;
  total_cost INTEGER;
BEGIN
  total_cost := p_cost * p_quantity;

  SELECT coins INTO current_balance FROM public.profiles WHERE id = p_user_id FOR UPDATE;

  IF current_balance IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF current_balance < total_cost THEN
    RAISE EXCEPTION 'Insufficient coins';
  END IF;

  UPDATE public.profiles SET coins = coins - total_cost WHERE id = p_user_id;

  INSERT INTO public.coin_transactions (user_id, amount, description)
    VALUES (p_user_id, -total_cost, 'Purchased: ' || p_item_key || ' x' || p_quantity);

  IF p_item_key = 'hint' THEN
    UPDATE public.profiles SET hint_tokens = hint_tokens + p_quantity WHERE id = p_user_id;
  ELSIF p_item_key = 'fifty_fifty' THEN
    UPDATE public.profiles SET fifty_fifty_tokens = fifty_fifty_tokens + p_quantity WHERE id = p_user_id;
  ELSIF p_item_key = 'skip' THEN
    UPDATE public.profiles SET skip_question_tokens = skip_question_tokens + p_quantity WHERE id = p_user_id;
  ELSIF p_item_key = 'mystery_box' THEN
    UPDATE public.profiles SET mystery_boxes = mystery_boxes + p_quantity WHERE id = p_user_id;
  ELSIF p_item_key = 'double_coins' THEN
    UPDATE public.profiles SET double_coins_expires_at = NOW() + INTERVAL '24 hours' WHERE id = p_user_id;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.transfer_coins(
  p_sender_id UUID,
  p_receiver_id UUID,
  p_amount INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  sender_balance INTEGER;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid amount';
  END IF;

  IF p_sender_id = p_receiver_id THEN
    RAISE EXCEPTION 'Cannot transfer to yourself';
  END IF;

  SELECT coins INTO sender_balance FROM public.profiles WHERE id = p_sender_id FOR UPDATE;

  IF sender_balance IS NULL OR sender_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient coins';
  END IF;

  UPDATE public.profiles SET coins = coins - p_amount WHERE id = p_sender_id;
  UPDATE public.profiles SET coins = coins + p_amount WHERE id = p_receiver_id;

  INSERT INTO public.coin_transactions (user_id, amount, description)
    VALUES (p_sender_id, -p_amount, 'Transfer to another user');
  INSERT INTO public.coin_transactions (user_id, amount, description)
    VALUES (p_receiver_id, p_amount, 'Received transfer from another user');

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.open_mystery_box(
  p_user_id UUID
) RETURNS INTEGER AS $$
DECLARE
  reward INTEGER;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id AND mystery_boxes > 0) THEN
    RAISE EXCEPTION 'No mystery boxes available';
  END IF;

  UPDATE public.profiles SET mystery_boxes = mystery_boxes - 1 WHERE id = p_user_id;

  reward := 50 + FLOOR(RANDOM() * 451);

  UPDATE public.profiles SET coins = coins + reward WHERE id = p_user_id;

  INSERT INTO public.coin_transactions (user_id, amount, description)
    VALUES (p_user_id, reward, 'Mystery box reward');

  RETURN reward;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.claim_daily_reward(
  p_user_id UUID
) RETURNS INTEGER AS $$
DECLARE
  last_reward DATE;
  new_streak INTEGER;
  reward INTEGER;
BEGIN
  SELECT last_reward_date INTO last_reward FROM public.profiles WHERE id = p_user_id;

  IF last_reward = CURRENT_DATE THEN
    RAISE EXCEPTION 'Already claimed today';
  END IF;

  IF last_reward = CURRENT_DATE - 1 THEN
    SELECT streak_days INTO new_streak FROM public.profiles WHERE id = p_user_id;
    new_streak := COALESCE(new_streak, 0) + 1;
  ELSE
    new_streak := 1;
  END IF;

  reward := LEAST(20 + new_streak * 5, 100);

  UPDATE public.profiles
    SET last_reward_date = CURRENT_DATE, streak_days = new_streak, coins = coins + reward
    WHERE id = p_user_id;

  INSERT INTO public.coin_transactions (user_id, amount, description)
    VALUES (p_user_id, reward, 'Daily reward (streak: ' || new_streak || ')');

  RETURN reward;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.grant_achievement(
  p_user_id UUID,
  p_achievement_name TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  ach_id UUID;
  coin_reward INTEGER;
BEGIN
  SELECT id, coin_reward INTO ach_id, coin_reward FROM public.achievements WHERE name = p_achievement_name;

  IF ach_id IS NULL THEN
    INSERT INTO public.achievements (name, badge_icon, coin_reward)
      VALUES (p_achievement_name, '🏆', 100)
      ON CONFLICT (name) DO NOTHING
      RETURNING id, coin_reward INTO ach_id, coin_reward;
  END IF;

  INSERT INTO public.user_achievements (user_id, achievement_id)
    VALUES (p_user_id, ach_id)
    ON CONFLICT DO NOTHING;

  IF coin_reward IS NULL THEN coin_reward := 100; END IF;
  UPDATE public.profiles SET coins = coins + coin_reward WHERE id = p_user_id;

  INSERT INTO public.coin_transactions (user_id, amount, description)
    VALUES (p_user_id, coin_reward, 'Achievement: ' || p_achievement_name);

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.consume_token(
  p_user_id UUID,
  p_token_type TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  IF p_token_type = 'hint' THEN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id AND hint_tokens > 0) THEN
      RAISE EXCEPTION 'No hint tokens available';
    END IF;
    UPDATE public.profiles SET hint_tokens = hint_tokens - 1 WHERE id = p_user_id;
  ELSIF p_token_type = 'fifty_fifty' THEN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id AND fifty_fifty_tokens > 0) THEN
      RAISE EXCEPTION 'No 50/50 tokens available';
    END IF;
    UPDATE public.profiles SET fifty_fifty_tokens = fifty_fifty_tokens - 1 WHERE id = p_user_id;
  ELSIF p_token_type = 'skip' THEN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id AND skip_question_tokens > 0) THEN
      RAISE EXCEPTION 'No skip tokens available';
    END IF;
    UPDATE public.profiles SET skip_question_tokens = skip_question_tokens - 1 WHERE id = p_user_id;
  ELSE
    RAISE EXCEPTION 'Unknown token type';
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.update_challenge_progress(
  p_user_id UUID,
  p_challenge_id UUID,
  p_progress INTEGER
) RETURNS void AS $$
DECLARE
  target_count INTEGER;
  new_progress INTEGER;
  should_complete BOOLEAN;
BEGIN
  -- Get challenge target count
  SELECT challenges.target_count INTO target_count FROM public.challenges WHERE id = p_challenge_id;
  
  IF target_count IS NULL THEN
    RAISE EXCEPTION 'Challenge not found';
  END IF;

  -- Calculate new progress and completion status
  new_progress := p_progress;
  should_complete := new_progress >= target_count;

  -- Upsert challenge progress
  INSERT INTO public.user_challenge_progress (user_id, challenge_id, date, progress, completed, completed_at)
    VALUES (p_user_id, p_challenge_id, CURRENT_DATE, new_progress, should_complete, CASE WHEN should_complete THEN NOW() ELSE NULL END)
    ON CONFLICT (user_id, challenge_id, date)
    DO UPDATE SET 
      progress = GREATEST(user_challenge_progress.progress, new_progress),
      completed = CASE WHEN EXCLUDED.completed OR (EXCLUDED.progress >= target_count) THEN TRUE ELSE user_challenge_progress.completed END,
      completed_at = CASE WHEN user_challenge_progress.completed IS FALSE AND (EXCLUDED.progress >= target_count) THEN NOW() ELSE user_challenge_progress.completed_at END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

INSERT INTO public.achievements (name, description, badge_icon, coin_reward) VALUES
('First Step', 'Complete your first quiz', '👟', 100),
('Century Scorer', 'Score 100 total correct answers', '💯', 100),
('Topic Master', 'Get 25 correct answers in a specific topic', '🎓', 100),
('Perfect Score', 'Get all questions correct in a quiz', '🎯', 200),
('Duel Champion', 'Win 10 duels', '⚔️', 200),
('Coin Collector', 'Accumulate 1000 coins', '💰', 150),
('Streak Master', 'Maintain a 7-day login streak', '🔥', 150),
('Speed Demon', 'Answer a question in under 2 seconds', '⚡', 100)
ON CONFLICT (name) DO NOTHING;
