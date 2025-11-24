-- scripts/002_feedback_and_device_tracking.sql

-- Create feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  essay_id UUID REFERENCES public.essays(id) ON DELETE SET NULL,
  feedback_type VARCHAR(20) NOT NULL CHECK (feedback_type IN ('bug', 'feature', 'general')),
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_feedback_user ON public.feedback(user_id);
CREATE INDEX idx_feedback_type ON public.feedback(feedback_type);
CREATE INDEX idx_feedback_created ON public.feedback(created_at DESC);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feedback_insert_own" ON public.feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "feedback_select_own" ON public.feedback
  FOR SELECT USING (auth.uid() = user_id);

-- Create device_registrations table
CREATE TABLE IF NOT EXISTS public.device_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id VARCHAR(64) NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_device_id ON public.device_registrations(device_id);
CREATE INDEX idx_device_user_id ON public.device_registrations(user_id);

ALTER TABLE public.device_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "device_insert_own" ON public.device_registrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "device_select_own" ON public.device_registrations
  FOR SELECT USING (auth.uid() = user_id);