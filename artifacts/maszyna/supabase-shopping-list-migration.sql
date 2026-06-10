-- Run this in your Supabase dashboard → SQL Editor
-- Creates the shared shopping list table for Maszyna

CREATE TABLE IF NOT EXISTS shopping_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'inne',
  checked BOOLEAN NOT NULL DEFAULT false,
  quantity TEXT NOT NULL DEFAULT '',
  imported_from JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE shopping_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own shopping list"
  ON shopping_list FOR ALL
  USING (auth.uid() = user_id);

-- Index for fast per-user queries
CREATE INDEX IF NOT EXISTS shopping_list_user_id_idx ON shopping_list(user_id);
