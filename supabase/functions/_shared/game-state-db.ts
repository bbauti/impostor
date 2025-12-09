import { createAdminClient } from './supabase-client.ts';
import type { RoomState } from './game-logic.ts';

interface GameStateRow {
  room_id: string;
  secret_word: string | null;
  impostor_ids: string[];
  phase: string;
  votes: Record<string, string>;
  vote_round: number;
  time_started: number | null;
  players: string[];
  settings: Record<string, unknown>;
}

export async function getGameState(roomId: string): Promise<RoomState | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('game_states')
    .select('*')
    .eq('room_id', roomId)
    .single();

  if (error || !data) {
    return null;
  }

  const row = data as GameStateRow;
  return {
    secretWord: row.secret_word,
    impostorIds: row.impostor_ids,
    phase: row.phase as RoomState['phase'],
    votes: row.votes,
    voteRound: row.vote_round,
    timeStarted: row.time_started,
    players: row.players,
    settings: row.settings as RoomState['settings']
  };
}

export async function setGameState(roomId: string, state: RoomState): Promise<void> {
  const supabase = createAdminClient();

  console.log('setGameState')

  const { error } = await supabase
    .from('game_states')
    .upsert({
      room_id: roomId,
      secret_word: state.secretWord,
      impostor_ids: state.impostorIds,
      phase: state.phase,
      votes: state.votes,
      vote_round: state.voteRound,
      time_started: state.timeStarted,
      players: state.players,
      settings: state.settings
    }, {
      onConflict: 'room_id'
    });

  if (error) {
    throw new Error(`Failed to save game state: ${error.message}`);
  }
}

export async function deleteGameState(roomId: string): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('game_states')
    .delete()
    .eq('room_id', roomId);

  if (error) {
    throw new Error(`Failed to delete game state: ${error.message}`);
  }
}

export async function deleteRoom(roomId: string): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('rooms')
    .delete()
    .eq('room_id', roomId);

  if (error) {
    throw new Error(`Failed to delete room: ${error.message}`);
  }
}

export async function deleteChatMessages(roomId: string): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('chat_messages')
    .delete()
    .eq('room_id', roomId);

  if (error) {
    throw new Error(`Failed to delete chat messages: ${error.message}`);
  }
}

export async function deleteRoomCompletely(roomId: string): Promise<void> {
  // Delete in order: chat messages, game state, then room
  await deleteChatMessages(roomId);
  await deleteGameState(roomId);
  await deleteRoom(roomId);
}
