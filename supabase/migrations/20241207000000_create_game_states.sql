-- Game states table to store active game state
-- Replaces Deno KV which is not available in Supabase Edge Functions

CREATE TABLE IF NOT EXISTS game_states (
  room_id TEXT PRIMARY KEY,
  secret_word TEXT,
  impostor_ids TEXT[] NOT NULL DEFAULT '{}',
  phase TEXT NOT NULL DEFAULT 'waiting',
  votes JSONB NOT NULL DEFAULT '{}',
  vote_round INTEGER NOT NULL DEFAULT 0,
  time_started BIGINT,
  players TEXT[] NOT NULL DEFAULT '{}',
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_game_states_phase ON game_states(phase);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_game_states_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS game_states_updated_at ON game_states;
CREATE TRIGGER game_states_updated_at
  BEFORE UPDATE ON game_states
  FOR EACH ROW
  EXECUTE FUNCTION update_game_states_updated_at();

-- Enable RLS but allow service role full access
ALTER TABLE game_states ENABLE ROW LEVEL SECURITY;

-- Policy for service role (edge functions use service role)
CREATE POLICY "Service role has full access" ON game_states
  FOR ALL
  USING (true)
  WITH CHECK (true);
