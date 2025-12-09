import { serverSupabaseClient } from '#supabase/server';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const page = parseInt(query.page as string) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;

  // Validate page number
  if (page < 1 || page > 1000) {
    throw createError({
      statusCode: 400,
      message: 'Invalid page number'
    });
  }

  const supabase = await serverSupabaseClient(event);

  // First, get all public rooms
  const { data: rooms, error: roomsError, count } = await supabase
    .from('rooms')
    .select('room_id, settings, created_at', { count: 'exact' })
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  if (roomsError) {
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch public rooms',
      cause: roomsError
    });
  }

  if (!rooms || rooms.length === 0) {
    return {
      success: true,
      rooms: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0
      }
    };
  }

  // Get game states for all rooms to filter by phase
  const roomIds = rooms.map(r => r.room_id);
  const { data: gameStates, error: gameStatesError } = await supabase
    .from('game_states')
    .select('room_id, phase, players')
    .in('room_id', roomIds)
    .eq('phase', 'waiting');

  if (gameStatesError) {
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch game states',
      cause: gameStatesError
    });
  }

  // Create a map of room_id to game state
  const gameStateMap = new Map(
    (gameStates || []).map(gs => [gs.room_id, gs])
  );

  // Filter rooms to only include those with waiting game states AND players
  const waitingRooms = rooms
    .filter(room => {
      const gameState = gameStateMap.get(room.room_id);
      // Solo incluir salas que tienen game state Y tienen jugadores activos
      return gameState && (gameState.players || []).length > 0;
    })
    .map((room) => {
      const settings = room.settings as any;
      const gameState = gameStateMap.get(room.room_id);

      return {
        roomId: room.room_id,
        playerCount: (gameState?.players || []).length,
        maxPlayers: settings.maxPlayers,
        impostorCount: settings.impostorCount,
        categories: settings.categories,
        timeLimit: settings.timeLimit,
        createdAt: room.created_at
      };
    });

  // Apply pagination to the filtered results
  const totalWaitingRooms = waitingRooms.length;
  const paginatedRooms = waitingRooms.slice(offset, offset + limit);

  return {
    success: true,
    rooms: paginatedRooms,
    pagination: {
      page,
      limit,
      total: totalWaitingRooms,
      totalPages: Math.ceil(totalWaitingRooms / limit)
    }
  };
});
