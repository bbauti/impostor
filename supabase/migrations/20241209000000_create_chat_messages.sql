-- Create chat_messages table for room chat
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient room queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);

-- Index for rate limiting queries (player's last message)
CREATE INDEX IF NOT EXISTS idx_chat_messages_player_created ON chat_messages(room_id, player_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read access (players can see chat)
CREATE POLICY "Allow read for all" ON chat_messages
  FOR SELECT USING (true);

-- Service role has full access (for edge functions)
CREATE POLICY "Service role full access" ON chat_messages
  FOR ALL USING (auth.role() = 'service_role');
