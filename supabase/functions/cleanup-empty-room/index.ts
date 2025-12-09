import { createAdminClient } from '../_shared/supabase-client.ts';
import { deleteRoomCompletely } from '../_shared/game-state-db.ts';

Deno.serve(async (req) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { roomId } = await req.json();

    if (!roomId) {
      return new Response(JSON.stringify({ error: 'Room ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const supabase = createAdminClient();

    // Check if room exists
    const { data: roomData, error: roomError } = await supabase
      .from('rooms')
      .select('room_id')
      .eq('room_id', roomId)
      .single();

    if (roomError || !roomData) {
      return new Response(JSON.stringify({ error: 'Room not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete room and all associated data
    // Note: We rely on the caller to ensure the room is empty
    // as we can't directly check presence from edge functions
    await deleteRoomCompletely(roomId);

    console.log(`Successfully cleaned up empty room: ${roomId}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Room and all associated data deleted successfully'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error cleaning up room:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to cleanup room',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});
