-- Schema per Relazioni & Benessere
-- Esegui questo SQL nel SQL Editor di Supabase

-- Tabella profili utente
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabella log umore
CREATE TABLE IF NOT EXISTS public.mood_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mood TEXT NOT NULL CHECK (mood IN ('sereno', 'ansioso', 'triste', 'arrabbiato', 'confuso')),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabella conversazioni
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT DEFAULT 'Nuova conversazione',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabella messaggi
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policy profiles
CREATE POLICY "Gli utenti vedono solo il proprio profilo"
  ON public.profiles FOR ALL
  USING (auth.uid() = id);

-- Policy mood_logs
CREATE POLICY "Gli utenti vedono solo i propri umore"
  ON public.mood_logs FOR ALL
  USING (auth.uid() = user_id);

-- Policy conversations
CREATE POLICY "Gli utenti vedono solo le proprie conversazioni"
  ON public.conversations FOR ALL
  USING (auth.uid() = user_id);

-- Policy messages (tramite conversazione)
CREATE POLICY "Gli utenti vedono i messaggi delle proprie conversazioni"
  ON public.messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = messages.conversation_id
        AND user_id = auth.uid()
    )
  );

-- Trigger per creare profilo automaticamente al signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, SPLIT_PART(NEW.email, '@', 1));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_mood_logs_user_id ON public.mood_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id, created_at ASC);
