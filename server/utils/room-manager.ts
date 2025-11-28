import { nanoid } from 'nanoid'
import type { Room, Player, GameSettings, ClientRoomInfo } from '../../app/types/game'
import type { WebSocketMessage } from '../../app/types/websocket'
import type { Peer } from 'crossws'

// In-memory storage
const rooms = new Map<string, Room>()
const playerConnections = new Map<string, Peer>()
const playerToRoom = new Map<string, string>() // playerId -> roomId

export const roomManager = {
  // Create a new room
  createRoom(settings: GameSettings, hostId: string): Room {
    const room: Room = {
      id: nanoid(6).toUpperCase(), // Short, shareable room codes
      hostId,
      players: [],
      settings,
      phase: 'waiting',
      secretWord: null,
      impostorIds: [],
      votes: {},
      voteRound: 0,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      timeStarted: null
    }

    rooms.set(room.id, room)
    return room
  },

  // Get a room by ID
  getRoom(id: string): Room | undefined {
    return rooms.get(id)
  },

  // Get all rooms
  getAllRooms(): Room[] {
    return Array.from(rooms.values())
  },

  // Update room
  updateRoom(id: string, updates: Partial<Room>): void {
    const room = rooms.get(id)
    if (room) {
      Object.assign(room, updates, { lastActivity: Date.now() })
    }
  },

  // Delete room
  deleteRoom(id: string): void {
    const room = rooms.get(id)
    if (room) {
      // Clean up all player connections
      for (const player of room.players) {
        playerConnections.delete(player.id)
        playerToRoom.delete(player.id)
      }
    }
    rooms.delete(id)
  },

  // Add player to room
  addPlayer(roomId: string, player: Player): boolean {
    const room = rooms.get(roomId)
    if (!room) return false

    // Check if room is full
    if (room.players.length >= room.settings.maxPlayers) {
      return false
    }

    // Check if player already exists
    const existingIndex = room.players.findIndex(p => p.id === player.id)
    if (existingIndex >= 0) {
      // Update existing player
      room.players[existingIndex] = player
    } else {
      // Add new player
      room.players.push(player)
    }

    playerToRoom.set(player.id, roomId)
    room.lastActivity = Date.now()
    return true
  },

  // Remove player from room
  removePlayer(roomId: string, playerId: string): void {
    const room = rooms.get(roomId)
    if (!room) return

    const playerIndex = room.players.findIndex(p => p.id === playerId)
    if (playerIndex >= 0) {
      room.players.splice(playerIndex, 1)
    }

    playerConnections.delete(playerId)
    playerToRoom.delete(playerId)
    room.lastActivity = Date.now()

    // If host left, assign new host
    if (room.hostId === playerId && room.players.length > 0) {
      room.hostId = room.players[0].id
      room.players[0].isHost = true
    }

    // Delete room if empty
    if (room.players.length === 0) {
      this.deleteRoom(roomId)
    }
  },

  // Update player status
  updatePlayerStatus(roomId: string, playerId: string, status: Player['status']): void {
    const room = rooms.get(roomId)
    if (!room) return

    const player = room.players.find(p => p.id === playerId)
    if (player) {
      player.status = status
      room.lastActivity = Date.now()
    }
  },

  // Check if a player can reconnect to a room
  canReconnect(roomId: string, playerId: string): boolean {
    const room = rooms.get(roomId)
    if (!room) return false

    const player = room.players.find(p => p.id === playerId)
    if (!player) return false

    // Can ONLY reconnect if player is disconnected (not if they're active in another tab)
    return player.status === 'disconnected'
  },

  // Reconnect a player (reactivate them)
  reconnectPlayer(roomId: string, playerId: string, peer: Peer): boolean {
    const room = rooms.get(roomId)
    if (!room) return false

    const player = room.players.find(p => p.id === playerId)
    if (!player) return false

    // Update connection
    playerConnections.set(playerId, peer)
    playerToRoom.set(playerId, roomId)

    // Restore appropriate status
    if (room.phase === 'waiting') {
      player.status = 'waiting'
    } else if (room.phase !== 'ended') {
      player.status = 'playing'
    }

    room.lastActivity = Date.now()
    return true
  },

  // Register WebSocket connection
  registerConnection(playerId: string, peer: Peer): void {
    playerConnections.set(playerId, peer)
  },

  // Unregister WebSocket connection
  unregisterConnection(playerId: string): void {
    playerConnections.delete(playerId)
  },

  // Get player's room ID
  getPlayerRoom(playerId: string): string | undefined {
    return playerToRoom.get(playerId)
  },

  // Broadcast message to all players in room
  broadcastToRoom(roomId: string, message: WebSocketMessage): void {
    const room = rooms.get(roomId)
    if (!room) return

    const messageStr = JSON.stringify(message)

    for (const player of room.players) {
      const peer = playerConnections.get(player.id)
      if (peer) {
        try {
          peer.send(messageStr)
        } catch (error) {
          console.error(`Failed to send message to player ${player.id}:`, error)
        }
      }
    }
  },

  // Send message to specific player
  sendToPlayer(playerId: string, message: WebSocketMessage): void {
    const peer = playerConnections.get(playerId)
    if (peer) {
      try {
        peer.send(JSON.stringify(message))
      } catch (error) {
        console.error(`Failed to send message to player ${playerId}:`, error)
      }
    }
  },

  // Convert Room to ClientRoomInfo (safe for client)
  toClientRoomInfo(room: Room): ClientRoomInfo {
    return {
      id: room.id,
      hostId: room.hostId,
      players: room.players,
      settings: room.settings,
      phase: room.phase,
      timeStarted: room.timeStarted
    }
  },

  // Clean up inactive rooms
  cleanup(): void {
    const now = Date.now()
    const roomsToDelete: string[] = []

    for (const [id, room] of rooms.entries()) {
      const timeSinceActivity = now - room.lastActivity

      // Delete empty rooms after 2 minutes
      if (room.players.length === 0 && timeSinceActivity > 2 * 60 * 1000) {
        roomsToDelete.push(id)
      }

      // Delete ended games after 1 minute
      if (room.phase === 'ended' && timeSinceActivity > 1 * 60 * 1000) {
        roomsToDelete.push(id)
      }
    }

    for (const id of roomsToDelete) {
      this.deleteRoom(id)
    }
  }
}

// Run cleanup every minute
setInterval(() => {
  roomManager.cleanup()
}, 60 * 1000)
