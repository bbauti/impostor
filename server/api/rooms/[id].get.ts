import { serverSupabaseClient } from "#supabase/server"

export default defineEventHandler(async (event) => {
  const roomId = getRouterParam(event, "id")

  if (!roomId) {
    console.error("[room.get] Missing room ID")
    throw createError({
      statusCode: 400,
      message: "Room ID is required",
    })
  }

  if (roomId.length < 4 || roomId.length > 10) {
    console.error("[room.get] Invalid room ID format", { roomId })
    throw createError({
      statusCode: 400,
      message: "Invalid room ID format",
    })
  }

  const supabase = await serverSupabaseClient(event)
  const { data: room, error } = await supabase
    .from("rooms")
    .select("room_id, creator_id, settings")
    .eq("room_id", roomId)
    .single()

  if (error || !room) {
    console.warn("[room.get] Room not found", { roomId })
    throw createError({
      statusCode: 404,
      message: "Room not found",
    })
  }

  console.log("[room.get] Room fetched successfully", { roomId })

  return {
    success: true,
    roomId: room.room_id,
    creatorId: room.creator_id,
    settings: room.settings,
  }
})
