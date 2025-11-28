import type { Player, ClientRoomInfo, VoteResult, GameOverData, GamePhase } from './game'

export enum MessageType {
  // Connection
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  RECONNECT = 'reconnect',

  // Room
  JOIN_ROOM = 'join_room',
  LEAVE_ROOM = 'leave_room',
  ROOM_UPDATE = 'room_update',

  // Game Flow
  PLAYER_READY = 'player_ready',
  START_GAME = 'start_game',
  ROLE_ASSIGNED = 'role_assigned',
  PHASE_CHANGE = 'phase_change',

  // Voting
  CALL_VOTE = 'call_vote',
  CAST_VOTE = 'cast_vote',
  VOTE_UPDATE = 'vote_update',
  VOTE_RESULTS = 'vote_results',

  // Game End
  GAME_OVER = 'game_over',

  // Errors
  ERROR = 'error',

  // Heartbeat
  PING = 'ping',
  PONG = 'pong'
}

export interface WebSocketMessage {
  type: MessageType
  payload: unknown
  timestamp: number
  roomId?: string
  playerId?: string
}

// Specific message payloads
export interface JoinRoomPayload {
  roomId: string
  playerName: string
  playerId?: string // for reconnection
}

export interface RoomUpdatePayload {
  room: ClientRoomInfo
}

export interface RoleAssignedPayload {
  role: 'impostor' | 'player'
  word: string | null
}

export interface PhaseChangePayload {
  phase: GamePhase
  timeRemaining?: number
}

export interface CastVotePayload {
  targetId: string | null // null for skip
}

export interface VoteUpdatePayload {
  totalVotes: number
  requiredVotes: number
}

export interface ErrorPayload {
  message: string
  code?: string
}
