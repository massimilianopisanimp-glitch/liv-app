-- Liv v2 — Schema Supabase
-- Esegui questo file nel SQL Editor di Supabase (https://app.supabase.com → SQL Editor)

-- ─── TABELLE ───────────────────────────────────────────────────────────────

-- Check-in umore
CREATE TABLE IF NOT EXISTS public.liv_checkins (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data       JSONB NOT NULL,          -- { mood, primary_emotion, intensity, secondary_emotion, area, ts }
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Conversazioni chat
CREATE TABLE IF NOT EXISTS public.liv_chats (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data       JSONB NOT NULL,          -- { id, title, messages:[{role,content}], insight, ts }
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Report mensili (Assessment)
CREATE TABLE IF NOT EXISTS public.liv_reports (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data       JSONB NOT NULL,          -- { scores:[…], areas:[…], aiText, ts }
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── INDICI ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS liv_checkins_user_id_idx  ON public.liv_checkins(user_id);
CREATE INDEX IF NOT EXISTS liv_chats_user_id_idx     ON public.liv_chats(user_id);
CREATE INDEX IF NOT EXISTS liv_reports_user_id_idx   ON public.liv_reports(user_id);

-- ─── ROW LEVEL SECURITY ────────────────────────────────────────────────────

ALTER TABLE public.liv_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liv_chats    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liv_reports  ENABLE ROW LEVEL SECURITY;

-- Check-ins: solo il proprietario può leggere/scrivere
CREATE POLICY "checkins_owner" ON public.liv_checkins
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Chats: solo il proprietario può leggere/scrivere
CREATE POLICY "chats_owner" ON public.liv_chats
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Reports: solo il proprietario può leggere/scrivere
CREATE POLICY "reports_owner" ON public.liv_reports
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
