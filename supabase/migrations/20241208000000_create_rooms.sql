-- Rooms table to store room metadata and settings
-- This ensures the room creator is always the host and settings are shared

CREATE TABLE IF NOT EXISTS rooms (
  room_id TEXT PRIMARY KEY,
  creator_id TEXT NOT NULL,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_rooms_creator_id ON rooms(creator_id);

-- Auto-delete old rooms (cleanup after 24 hours)
CREATE INDEX IF NOT EXISTS idx_rooms_created_at ON rooms(created_at);

-- Enable RLS but allow service role full access
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Policy for service role (edge functions use service role)
CREATE POLICY "Service role has full access to rooms" ON rooms
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Allow anonymous reads for room settings
CREATE POLICY "Anyone can read rooms" ON rooms
  FOR SELECT
  USING (true);

-- Allow anonymous inserts (room creation)
CREATE POLICY "Anyone can create rooms" ON rooms
  FOR INSERT
  WITH CHECK (true);
