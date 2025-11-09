-- Initialize database schema for EconAI

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create essays table
CREATE TABLE IF NOT EXISTS public.essays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  topic VARCHAR(50) NOT NULL,
  question_type VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE public.essays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "essays_select_own" ON public.essays
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "essays_insert_own" ON public.essays
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "essays_update_own" ON public.essays
  FOR UPDATE USING (auth.uid() = user_id);

-- Create essay_feedback table
CREATE TABLE IF NOT EXISTS public.essay_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  essay_id UUID NOT NULL REFERENCES public.essays(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ao1_score INT DEFAULT 0,
  ao2_score INT DEFAULT 0,
  ao3_score INT DEFAULT 0,
  ao4_score INT DEFAULT 0,
  total_score INT DEFAULT 0,
  grade_prediction VARCHAR(2),
  overall_feedback TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE public.essay_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feedback_select_own" ON public.essay_feedback
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "feedback_insert_own" ON public.essay_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);
