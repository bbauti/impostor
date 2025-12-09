-- Enable Realtime replication for rooms table
-- This allows clients to subscribe to changes in the rooms table
alter publication supabase_realtime add table rooms;

-- Enable Realtime replication for game_states table
-- This allows clients to subscribe to changes in game states (phase changes, etc.)
alter publication supabase_realtime add table game_states;
