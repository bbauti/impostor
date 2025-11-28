import { roomManager } from '../../utils/room-manager'

export default defineEventHandler((event) => {
  const roomId = getRouterParam(event, 'id')

  if (!roomId) {
    throw createError({
      statusCode: 400,
      message: 'Room ID is required'
    })
  }

  const room = roomManager.getRoom(roomId)

  if (!room) {
    throw createError({
      statusCode: 404,
      message: 'Room not found'
    })
  }

  // Return client-safe room info
  return {
    success: true,
    room: roomManager.toClientRoomInfo(room)
  }
})
