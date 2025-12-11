import { createAdminClient, corsHeaders } from '../_shared/supabase-client.ts';
import { deleteRoomCompletely } from '../_shared/game-state-db.ts';

interface SyncPlayersRequest {
  roomId: string;
  players: Array<{
    playerId: string;
    playerName: string;
  }>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { roomId, players } = await req.json() as SyncPlayersRequest;

    console.log('[sync-players] Request for room:', roomId, 'players:', players?.length ?? 0);

    if (!roomId) {
      return new Response(
        JSON.stringify({ error: 'roomId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate players array exists
    if (!players) {
      console.log('[sync-players] Skipping - players array is undefined');
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: 'no players array' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createAdminClient();

    // Check if room exists and get current phase
    const { data: gameState, error: fetchError } = await supabase
      .from('game_states')
      .select('phase')
      .eq('room_id', roomId)
      .single();

    if (fetchError) {
      console.log('[sync-players] Room not found:', roomId, fetchError.message);
      return new Response(
        JSON.stringify({ success: false, error: 'Room not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const phase = gameState.phase;

    // If players array is empty, handle room cleanup based on phase
    if (players.length === 0) {
      console.log('[sync-players] Empty players array, phase:', phase);

      // First, clear players array so room disappears from public list
      await supabase
        .from('game_states')
        .update({ players: [] })
        .eq('room_id', roomId);

      if (phase === 'ended') {
        // Game finished - delete immediately
        console.log('[sync-players] Game ended, deleting room immediately:', roomId);
        await deleteRoomCompletely(roomId);
        return new Response(
          JSON.stringify({ success: true, deleted: true, reason: 'game ended' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      else if (phase === 'waiting') {
        // Game not started - room will be cleaned up by cron job after 5 minutes
        // For now, just clear the players array (already done above)
        console.log('[sync-players] Room in waiting phase, cleared players. Will be deleted by cron if still empty.');
        return new Response(
          JSON.stringify({ success: true, playerCount: 0, pendingCleanup: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      else {
        // Game in progress (role_reveal, discussion, voting) - delete immediately
        // (shouldn't happen normally, but handle edge case)
        console.log('[sync-players] Game in progress but empty, deleting room:', roomId);
        await deleteRoomCompletely(roomId);
        return new Response(
          JSON.stringify({ success: true, deleted: true, reason: 'game abandoned' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Only sync players during waiting phase (for non-empty arrays)
    if (phase !== 'waiting') {
      console.log('[sync-players] Skipping sync - game phase is:', phase);
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: 'not in waiting phase' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update players array in game_states
    const playerIds = players.map(p => p.playerId);
    const { error: updateError } = await supabase
      .from('game_states')
      .update({ players: playerIds })
      .eq('room_id', roomId);

    if (updateError) {
      console.error('[sync-players] Update failed:', updateError.message);
      throw updateError;
    }

    console.log('[sync-players] Successfully synced', players.length, 'players for room:', roomId);

    return new Response(
      JSON.stringify({ success: true, playerCount: players.length }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  catch (error) {
    console.error('[sync-players] Error:', (error as Error).message);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
