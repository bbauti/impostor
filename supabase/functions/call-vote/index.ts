import { createAdminClient, corsHeaders } from '../_shared/supabase-client.ts';
import { getGameState, setGameState } from '../_shared/game-state-db.ts';

interface CallVoteRequest {
  roomId: string;
  playerId: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { roomId, playerId } = await req.json() as CallVoteRequest;

    const room = await getGameState(roomId);

    if (!room) {
      return new Response(
        JSON.stringify({ error: 'Room not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate phase
    if (room.phase !== 'discussion') {
      return new Response(
        JSON.stringify({ error: 'Solo se puede votar en la fase de discusión' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate player is in room
    if (!room.players.includes(playerId)) {
      return new Response(
        JSON.stringify({ error: 'No estás en esta sala' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update room state
    room.phase = 'voting';
    room.votes = {};
    room.voteRound = (room.voteRound || 0) + 1;

    await setGameState(roomId, room);

    // Broadcast phase change (fire-and-forget)
    const supabase = createAdminClient();
    supabase.channel(`room:${roomId}`).send({
      type: 'broadcast',
      event: 'game_event',
      payload: {
        type: 'PHASE_CHANGE',
        payload: { phase: 'voting', voteRound: room.voteRound }
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
