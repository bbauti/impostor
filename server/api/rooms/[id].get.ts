export default defineEventHandler((event) => {
  const roomId = getRouterParam(event, 'id');

  if (!roomId) {
    throw createError({
      statusCode: 400,
      message: 'Room ID is required'
    });
  }

  // With Supabase Realtime, rooms exist when players are in them (via Presence)
  // Just validate the format and return success
  // The room page will handle if the room is empty
  if (roomId.length < 4 || roomId.length > 10) {
    throw createError({
      statusCode: 400,
      message: 'Invalid room ID format'
    });
  }

  return {
    success: true,
    roomId
  };
});
