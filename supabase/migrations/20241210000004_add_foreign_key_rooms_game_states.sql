-- Add foreign key relationship between game_states and rooms
-- This enables Supabase PostgREST to do efficient JOINs

-- First, clean up any orphaned game_states (game states without corresponding rooms)
DELETE FROM game_states
WHERE room_id NOT IN (SELECT room_id FROM rooms);

-- Add foreign key constraint
ALTER TABLE game_states
ADD CONSTRAINT fk_game_states_room_id
FOREIGN KEY (room_id) REFERENCES rooms(room_id) ON DELETE CASCADE;

-- Add index on rooms.room_id for faster joins (already primary key, but explicit for clarity)
-- The primary key already creates an index, so this is just documentation
COMMENT ON CONSTRAINT fk_game_states_room_id ON game_states IS 'Links game state to its room, cascade deletes when room is deleted';
