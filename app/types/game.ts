export type GamePhase = 'waiting' | 'role_reveal' | 'discussion' | 'voting' | 'ended'

export type PlayerStatus = 'waiting' | 'ready' | 'playing' | 'spectating' | 'disconnected'

export type GameResult = 'players' | 'impostors'

export interface GameSettings {
  maxPlayers: number
  impostorCount: number
  categories: string[]
  timeLimit: number // in seconds
}

export interface Player {
  id: string
  name: string
  status: PlayerStatus
  isHost: boolean
}

export interface Room {
  id: string
  hostId: string
  players: Player[]
  settings: GameSettings
  phase: GamePhase
  secretWord: string | null
  impostorIds: string[]
  votes: Record<string, string> // playerId -> targetPlayerId
  voteRound: number // Current voting round (starts at 1)
  createdAt: number
  lastActivity: number
  timeStarted: number | null
}

export interface RoomListItem {
  id: string
  playerCount: number
  maxPlayers: number
  phase: GamePhase
}

export interface ClientRoomInfo {
  id: string
  hostId: string
  players: Player[]
  settings: GameSettings
  phase: GamePhase
  timeStarted: number | null
}

export interface VoteResult {
  eliminatedId: string | null
  wasImpostor: boolean
  voteCounts: Record<string, number>
  tie: boolean
  skipVotes: number // Number of skip votes
  revote: boolean // Whether there will be a re-vote
  voteRound: number // Current round number
}

export interface GameOverData {
  winner: GameResult
  secretWord: string
  impostorIds: string[]
  players: Player[]
}
