import { createAdminClient, corsHeaders } from '../_shared/supabase-client.ts';
import { deleteRoomCompletely } from '../_shared/game-state-db.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const { roomId } = await req.json();

    if (!roomId) {
      return new Response(JSON.stringify({ error: 'Room ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createAdminClient();

    // Check if room exists and get phase
    const { data: gameState, error: gameStateError } = await supabase
      .from('game_states')
      .select('phase')
      .eq('room_id', roomId)
      .single();

    if (gameStateError || !gameState) {
      return new Response(JSON.stringify({ error: 'Room not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // First, clear the players array so the room disappears from public list immediately
    await supabase
      .from('game_states')
      .update({ players: [] })
      .eq('room_id', roomId);

    // Delete room and all associated data
    await deleteRoomCompletely(roomId);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Room and all associated data deleted successfully'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
  catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Failed to cleanup room',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
