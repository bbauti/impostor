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
    const supabase = createAdminClient();

    // Get the cutoff time (1 hours ago by default for old rooms)
    const { hoursOld = 1 } = await req.json().catch(() => ({}));
    const oldRoomsCutoff = new Date(Date.now() - hoursOld * 60 * 60 * 1000).toISOString();

    // 5 minutes ago for empty waiting rooms
    const emptyRoomsCutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    console.log(`[cleanup-old-rooms] Cleaning up rooms older than ${hoursOld} hours`);
    console.log(`[cleanup-old-rooms] Also cleaning empty waiting rooms older than 5 minutes`);

    const deletedRooms: string[] = [];
    const failedRooms: { roomId: string; error: string }[] = [];

    // 1. Find and delete rooms older than 1 hours (regardless of state)
    const { data: oldRooms, error: oldRoomsError } = await supabase
      .from('rooms')
      .select('room_id, created_at')
      .lt('created_at', oldRoomsCutoff);

    if (oldRoomsError) {
      console.error('[cleanup-old-rooms] Failed to query old rooms:', oldRoomsError.message);
    } else if (oldRooms && oldRooms.length > 0) {
      console.log(`[cleanup-old-rooms] Found ${oldRooms.length} rooms older than ${hoursOld} hours`);
      for (const room of oldRooms) {
        try {
          await deleteRoomCompletely(room.room_id);
          deletedRooms.push(room.room_id);
          console.log(`[cleanup-old-rooms] Deleted old room: ${room.room_id}`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          failedRooms.push({ roomId: room.room_id, error: errorMessage });
        }
      }
    }

    // 2. Find and delete empty waiting rooms older than 5 minutes
    // These are rooms where players array is empty and phase is 'waiting'
    // Using raw filter for empty array check
    const { data: emptyWaitingRooms, error: emptyRoomsError } = await supabase
      .from('game_states')
      .select('room_id')
      .eq('phase', 'waiting')
      .filter('players', 'eq', '{}')
      .lt('updated_at', emptyRoomsCutoff);

    if (emptyRoomsError) {
      console.error('[cleanup-old-rooms] Failed to query empty rooms:', emptyRoomsError.message);
    } else if (emptyWaitingRooms && emptyWaitingRooms.length > 0) {
      console.log(`[cleanup-old-rooms] Found ${emptyWaitingRooms.length} empty waiting rooms older than 5 minutes`);
      for (const room of emptyWaitingRooms) {
        // Skip if already deleted in the previous step
        if (deletedRooms.includes(room.room_id)) continue;

        try {
          await deleteRoomCompletely(room.room_id);
          deletedRooms.push(room.room_id);
          console.log(`[cleanup-old-rooms] Deleted empty waiting room: ${room.room_id}`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          failedRooms.push({ roomId: room.room_id, error: errorMessage });
        }
      }
    }

    // 3. Also clean up any rooms with 0 players that are not in waiting phase
    // (edge case: game was abandoned mid-game)
    const { data: abandonedRooms, error: abandonedError } = await supabase
      .from('game_states')
      .select('room_id, phase')
      .filter('players', 'eq', '{}')
      .neq('phase', 'waiting');

    if (abandonedError) {
      console.error('[cleanup-old-rooms] Failed to query abandoned rooms:', abandonedError.message);
    } else if (abandonedRooms && abandonedRooms.length > 0) {
      console.log(`[cleanup-old-rooms] Found ${abandonedRooms.length} abandoned rooms (empty, not waiting)`);
      for (const room of abandonedRooms) {
        if (deletedRooms.includes(room.room_id)) continue;

        try {
          await deleteRoomCompletely(room.room_id);
          deletedRooms.push(room.room_id);
          console.log(`[cleanup-old-rooms] Deleted abandoned room: ${room.room_id} (was in ${room.phase} phase)`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          failedRooms.push({ roomId: room.room_id, error: errorMessage });
        }
      }
    }

    const message = deletedRooms.length > 0
      ? `Cleanup completed. Deleted ${deletedRooms.length} rooms.`
      : 'No rooms to cleanup.';

    console.log(`[cleanup-old-rooms] ${message}`);

    return new Response(
      JSON.stringify({
        success: true,
        message,
        roomsDeleted: deletedRooms.length,
        deletedRoomIds: deletedRooms,
        failedRooms: failedRooms.length > 0 ? failedRooms : undefined
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('[cleanup-old-rooms] Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to cleanup old rooms',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
