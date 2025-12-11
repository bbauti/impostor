import { serverSupabaseClient } from '#supabase/server';

interface RoomSettings {
  maxPlayers: number;
  impostorCount: number;
  categories: string[];
  timeLimit: number;
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const page = parseInt(query.page as string) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;

  if (page < 1 || page > 1000) {
    throw createError({
      statusCode: 400,
      message: 'Invalid page number'
    });
  }

  const supabase = await serverSupabaseClient(event);

  // Step 1: Get waiting game states with players (most selective filter first)
  const { data: waitingGames, error: gamesError } = await supabase
    .from('game_states')
    .select('room_id, players')
    .eq('phase', 'waiting');

  if (gamesError) {
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch game states',
      cause: gamesError
    });
  }

  // Filter to only games with players
  const gamesWithPlayers = (waitingGames || []).filter(
    g => Array.isArray(g.players) && g.players.length > 0
  );

  if (gamesWithPlayers.length === 0) {
    return {
      success: true,
      rooms: [],
      pagination: { page, limit, total: 0, totalPages: 0 }
    };
  }

  // Step 2: Get public rooms for those game states
  const roomIds = gamesWithPlayers.map(g => g.room_id);
  const { data: publicRooms, error: roomsError } = await supabase
    .from('rooms')
    .select('room_id, settings, created_at')
    .eq('is_public', true)
    .in('room_id', roomIds)
    .order('created_at', { ascending: false });

  if (roomsError) {
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch public rooms',
      cause: roomsError
    });
  }

  // Step 3: Combine data - create lookup map for player counts
  const playerCountMap = new Map(
    gamesWithPlayers.map(g => [g.room_id, (g.players as string[]).length])
  );

  const roomsWithPlayers = (publicRooms || [])
    .filter(room => playerCountMap.has(room.room_id))
    .map((room) => {
      const settings = room.settings as RoomSettings;
      return {
        roomId: room.room_id,
        playerCount: playerCountMap.get(room.room_id) || 0,
        maxPlayers: settings.maxPlayers,
        impostorCount: settings.impostorCount,
        categories: settings.categories,
        timeLimit: settings.timeLimit,
        createdAt: room.created_at
      };
    });

  const total = roomsWithPlayers.length;
  const paginatedRooms = roomsWithPlayers.slice(offset, offset + limit);

  return {
    success: true,
    rooms: paginatedRooms,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
});
