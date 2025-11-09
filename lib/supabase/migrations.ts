// Create the user_preferences table structure
export const USER_PREFERENCES_SCHEMA = `
  CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    exam_board VARCHAR(50) NOT NULL DEFAULT 'edexcel_a',
    topic VARCHAR(100) NOT NULL,
    question_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );

  ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "user_preferences_select_own" ON public.user_preferences
    FOR SELECT USING (auth.uid() = id);

  CREATE POLICY "user_preferences_insert_own" ON public.user_preferences
    FOR INSERT WITH CHECK (auth.uid() = id);

  CREATE POLICY "user_preferences_update_own" ON public.user_preferences
    FOR UPDATE USING (auth.uid() = id);
`
