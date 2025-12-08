import { createAdminClient, corsHeaders } from '../_shared/supabase-client.ts';
import { getGameState, setGameState } from '../_shared/game-state-db.ts';

type GamePhase = 'waiting' | 'role_reveal' | 'discussion' | 'voting' | 'ended';

interface TransitionPhaseRequest {
  roomId: string;
  playerId: string;
  newPhase: GamePhase;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { roomId, playerId, newPhase } = await req.json() as TransitionPhaseRequest;

    const room = await getGameState(roomId);

    if (!room) {
      return new Response(
        JSON.stringify({ error: 'Room not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate player is in room
    if (!room.players.includes(playerId)) {
      return new Response(
        JSON.stringify({ error: 'No estás en esta sala' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate phase transition
    const validTransitions: Record<string, string[]> = {
      role_reveal: ['discussion'],
      discussion: ['voting'],
      voting: ['discussion', 'ended']
    };

    const allowed = validTransitions[room.phase];
    if (!allowed || !allowed.includes(newPhase)) {
      return new Response(
        JSON.stringify({ error: `Invalid phase transition from ${room.phase} to ${newPhase}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update room state
    room.phase = newPhase;

    // Clear votes if transitioning to discussion
    if (newPhase === 'discussion') {
      room.votes = {};
    }

    await setGameState(roomId, room);

    // Broadcast phase change
    const supabase = createAdminClient();
    await supabase.channel(`room:${roomId}`).send({
      type: 'broadcast',
      event: 'game_event',
      payload: {
        type: 'PHASE_CHANGE',
        payload: { phase: newPhase }
      }
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
