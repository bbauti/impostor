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
    const supabase = createAdminClient();

    // Get the cutoff time (24 hours ago by default)
    const { hoursOld = 24 } = await req.json().catch(() => ({}));
    const cutoffTime = new Date(Date.now() - hoursOld * 60 * 60 * 1000).toISOString();

    console.log(`Cleaning up rooms older than ${hoursOld} hours (before ${cutoffTime})`);

    // Find rooms older than the cutoff time
    const { data: oldRooms, error: queryError } = await supabase
      .from('rooms')
      .select('room_id, created_at')
      .lt('created_at', cutoffTime);

    if (queryError) {
      throw new Error(`Failed to query old rooms: ${queryError.message}`);
    }

    if (!oldRooms || oldRooms.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No old rooms to cleanup',
          roomsDeleted: 0
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Delete each old room
    const deletedRooms: string[] = [];
    const failedRooms: { roomId: string; error: string }[] = [];

    for (const room of oldRooms) {
      try {
        await deleteRoomCompletely(room.room_id);
        deletedRooms.push(room.room_id);
        console.log(`Deleted old room: ${room.room_id}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        failedRooms.push({ roomId: room.room_id, error: errorMessage });
        console.error(`Failed to delete room ${room.room_id}:`, errorMessage);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Cleanup completed. Deleted ${deletedRooms.length} rooms.`,
        roomsDeleted: deletedRooms.length,
        deletedRoomIds: deletedRooms,
        failedRooms: failedRooms.length > 0 ? failedRooms : undefined
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error cleaning up old rooms:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to cleanup old rooms',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});
