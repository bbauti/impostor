import { serverSupabaseClient } from "#supabase/server"

export default defineEventHandler(async (event) => {
  const roomId = getRouterParam(event, "id")

  if (!roomId) {
    throw createError({
      statusCode: 400,
      message: "Room ID is required",
    })
  }

  if (roomId.length < 4 || roomId.length > 10) {
    throw createError({
      statusCode: 400,
      message: "Invalid room ID format",
    })
  }

  // Fetch room from database
  const supabase = await serverSupabaseClient(event)
  const { data: room, error } = await supabase
    .from("rooms")
    .select("room_id, creator_id, settings")
    .eq("room_id", roomId)
    .single()

  if (error || !room) {
    throw createError({
      statusCode: 404,
      message: "Room not found",
    })
  }

  return {
    success: true,
    roomId: room.room_id,
    creatorId: room.creator_id,
    settings: room.settings,
  }
})
