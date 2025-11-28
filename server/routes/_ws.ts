import type { Peer } from 'crossws'
import { roomManager } from '../utils/room-manager'
import { MessageType, type WebSocketMessage, type JoinRoomPayload } from '../../app/types/websocket'
import { startGame, startVoting, processVotes, checkAllVotesCast } from '../utils/game-engine'

// Map peer IDs to player IDs
const peerToPlayer = new Map<string, string>()

export default defineWebSocketHandler({
  open(peer) {
    console.log('[WS] Client connected:', peer.id)
  },

  message(peer, message) {
    try {
      const msg: WebSocketMessage = JSON.parse(message.text())
      handleMessage(peer, msg)
    } catch (error) {
      console.error('[WS] Failed to parse message:', error)
      sendError(peer, 'Invalid message format')
    }
  },

  close(peer) {
    console.log('[WS] Client disconnected:', peer.id)
    handleDisconnect(peer)
  },

  error(peer, error) {
    console.error('[WS] WebSocket error:', error)
  }
})

function handleMessage(peer: Peer, msg: WebSocketMessage) {
  console.log('[WS] Received:', msg.type, 'from peer:', peer.id)

  switch (msg.type) {
    case MessageType.JOIN_ROOM:
      handleJoinRoom(peer, msg.payload as JoinRoomPayload)
      break

    case MessageType.LEAVE_ROOM:
      handleLeaveRoom(peer)
      break

    case MessageType.PLAYER_READY:
      handlePlayerReady(peer)
      break

    case MessageType.START_GAME:
      handleStartGame(peer)
      break

    case MessageType.CALL_VOTE:
      handleCallVote(peer)
      break

    case MessageType.CAST_VOTE:
      handleCastVote(peer, msg.payload as { targetId: string | null })
      break

    case MessageType.PING:
      handlePing(peer)
      break

    default:
      console.warn('[WS] Unknown message type:', msg.type)
  }
}

function handleJoinRoom(peer: Peer, payload: JoinRoomPayload) {
  const { roomId, playerName, playerId: existingPlayerId } = payload

  // Validate room exists
  const room = roomManager.getRoom(roomId)
  if (!room) {
    sendError(peer, 'Sala no encontrada')
    return
  }

  let playerId: string
  let isReconnecting = false

  // Check if player is trying to reconnect with existing ID
  if (existingPlayerId && roomManager.canReconnect(roomId, existingPlayerId)) {
    // Reconnect existing player
    const reconnected = roomManager.reconnectPlayer(roomId, existingPlayerId, peer)
    if (reconnected) {
      playerId = existingPlayerId
      isReconnecting = true
      peerToPlayer.set(peer.id, playerId)

      console.log(`[WS] Player ${playerName} (${playerId}) reconnected to room ${roomId}`)

      // Send reconnection success
      roomManager.sendToPlayer(playerId, {
        type: MessageType.RECONNECT,
        payload: { playerId, roomId },
        timestamp: Date.now()
      })

      // Broadcast room update
      broadcastRoomUpdate(roomId)
      return
    }
  }

  // New player or failed reconnection

  // Check if room is full
  if (room.players.length >= room.settings.maxPlayers) {
    sendError(peer, 'La sala está llena')
    return
  }

  // Generate new player ID
  playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Check if this is the first player (becomes host)
  const isFirstPlayer = room.players.length === 0

  // Create player
  const player = {
    id: playerId,
    name: playerName,
    status: 'waiting' as const,
    isHost: isFirstPlayer
  }

  // Add player to room
  const added = roomManager.addPlayer(roomId, player)
  if (!added) {
    sendError(peer, 'Error al unirse a la sala')
    return
  }

  // Update room hostId if this is the first player
  if (isFirstPlayer) {
    room.hostId = playerId
    console.log(`[WS] Set ${playerId} as host for room ${roomId}`)
  }

  // Register connection
  peerToPlayer.set(peer.id, playerId)
  roomManager.registerConnection(playerId, peer)

  // Send success message with player ID
  roomManager.sendToPlayer(playerId, {
    type: MessageType.CONNECT,
    payload: { playerId, roomId },
    timestamp: Date.now()
  })

  // Broadcast room update to all players
  broadcastRoomUpdate(roomId)

  console.log(`[WS] Player ${playerName} (${playerId}) joined room ${roomId}`)
}

function handleLeaveRoom(peer: Peer) {
  const playerId = peerToPlayer.get(peer.id)
  if (!playerId) return

  const roomId = roomManager.getPlayerRoom(playerId)
  if (!roomId) return

  // Remove player from room
  roomManager.removePlayer(roomId, playerId)
  peerToPlayer.delete(peer.id)

  // Broadcast room update if room still exists
  const room = roomManager.getRoom(roomId)
  if (room) {
    broadcastRoomUpdate(roomId)
  }

  console.log(`[WS] Player ${playerId} left room ${roomId}`)
}

function handleDisconnect(peer: Peer) {
  const playerId = peerToPlayer.get(peer.id)
  if (!playerId) return

  const roomId = roomManager.getPlayerRoom(playerId)
  if (!roomId) return

  // Mark player as disconnected
  roomManager.updatePlayerStatus(roomId, playerId, 'disconnected')
  roomManager.unregisterConnection(playerId)
  peerToPlayer.delete(peer.id)

  // Broadcast room update
  broadcastRoomUpdate(roomId)

  // TODO: In post-MVP, implement reconnection grace period
  // For now, remove disconnected players after brief delay
  setTimeout(() => {
    const room = roomManager.getRoom(roomId)
    const player = room?.players.find(p => p.id === playerId)
    if (player && player.status === 'disconnected') {
      roomManager.removePlayer(roomId, playerId)
      if (room) {
        broadcastRoomUpdate(roomId)
      }
    }
  }, 5000) // 5 seconds grace period

  console.log(`[WS] Player ${playerId} disconnected from room ${roomId}`)
}

function handlePlayerReady(peer: Peer) {
  const playerId = peerToPlayer.get(peer.id)
  if (!playerId) return

  const roomId = roomManager.getPlayerRoom(playerId)
  if (!roomId) return

  // Update player status
  roomManager.updatePlayerStatus(roomId, playerId, 'ready')

  // Broadcast room update
  broadcastRoomUpdate(roomId)

  console.log(`[WS] Player ${playerId} is ready`)
}

function handleStartGame(peer: Peer) {
  const playerId = peerToPlayer.get(peer.id)
  if (!playerId) return

  console.log('playerId', playerId)

  const roomId = roomManager.getPlayerRoom(playerId)
  if (!roomId) return

  const room = roomManager.getRoom(roomId)
  if (!room) return

  console.log('room.hostId', room.hostId)

  // Validate host
  if (room.hostId !== playerId) {
    sendError(peer, 'Solo el anfitrión puede iniciar el juego')
    return
  }

  // Validate all players ready
  const allReady = room.players.every(p => p.status === 'ready' || p.isHost)
  if (!allReady) {
    sendError(peer, 'Todos los jugadores deben estar listos')
    return
  }

  // Validate minimum players
  if (room.players.length < 3) {
    sendError(peer, 'Se necesitan al menos 3 jugadores para comenzar')
    return
  }

  // Start game using game engine
  const started = startGame(roomId)
  if (!started) {
    sendError(peer, 'Error al iniciar el juego')
  }
}

function handleCallVote(peer: Peer) {
  const playerId = peerToPlayer.get(peer.id)
  if (!playerId) return

  const roomId = roomManager.getPlayerRoom(playerId)
  if (!roomId) return

  // Start voting using game engine
  startVoting(roomId)
}

function handleCastVote(peer: Peer, payload: { targetId: string | null }) {
  const playerId = peerToPlayer.get(peer.id)
  if (!playerId) return

  const roomId = roomManager.getPlayerRoom(playerId)
  if (!roomId) return

  const room = roomManager.getRoom(roomId)
  if (!room) return

  // Record vote
  room.votes[playerId] = payload.targetId || ''

  console.log(`[WS] Player ${playerId} voted for ${payload.targetId || 'skip'}`)

  // Broadcast vote update to all players (public voting)
  roomManager.broadcastToRoom(roomId, {
    type: MessageType.VOTE_UPDATE,
    payload: {
      votes: room.votes,
      voterId: playerId,
      targetId: payload.targetId
    },
    timestamp: Date.now()
  })

  // Check if all votes cast
  if (checkAllVotesCast(room)) {
    console.log(`[WS] All votes cast in room ${roomId}, processing results...`)
    processVotes(roomId)
  }
}

function handlePing(peer: Peer) {
  peer.send(JSON.stringify({
    type: MessageType.PONG,
    payload: {},
    timestamp: Date.now()
  }))
}

function broadcastRoomUpdate(roomId: string) {
  const room = roomManager.getRoom(roomId)
  if (!room) return

  roomManager.broadcastToRoom(roomId, {
    type: MessageType.ROOM_UPDATE,
    payload: { room: roomManager.toClientRoomInfo(room) },
    timestamp: Date.now()
  })
}

function sendError(peer: Peer, message: string) {
  peer.send(JSON.stringify({
    type: MessageType.ERROR,
    payload: { message },
    timestamp: Date.now()
  }))
}
