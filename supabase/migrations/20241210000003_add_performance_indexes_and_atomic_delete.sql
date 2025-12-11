-- Performance Optimization: Add indexes for common query patterns

-- Index for room_id in game_states (used in JOIN queries)
-- Note: room_id is already PRIMARY KEY, but this index helps with foreign key lookups
CREATE INDEX IF NOT EXISTS idx_game_states_room_id ON game_states(room_id);

-- Partial index for waiting rooms with players (used in public rooms query)
-- This index only includes rows where phase='waiting', reducing index size
CREATE INDEX IF NOT EXISTS idx_game_states_waiting_rooms ON game_states(phase, room_id)
  WHERE phase = 'waiting';

-- Composite index for public rooms query ordering
CREATE INDEX IF NOT EXISTS idx_rooms_public_created_desc ON rooms(is_public, created_at DESC)
  WHERE is_public = true;

-- Atomic room deletion function to prevent partial deletes
-- This replaces the 3 separate delete operations with a single transaction
CREATE OR REPLACE FUNCTION delete_room_completely(p_room_id TEXT)
RETURNS void AS $$
BEGIN
  -- Delete in correct order to respect any foreign key constraints
  DELETE FROM chat_messages WHERE room_id = p_room_id;
  DELETE FROM game_states WHERE room_id = p_room_id;
  DELETE FROM rooms WHERE room_id = p_room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service role (used by edge functions)
GRANT EXECUTE ON FUNCTION delete_room_completely(TEXT) TO service_role;
