import type { ClientRoomInfo, GamePhase } from './game';

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
  type: MessageType;
  payload: unknown;
  timestamp: number;
  roomId?: string;
  playerId?: string;
}

// Specific message payloads
export interface ConnectPayload {
  playerId: string;
  roomId: string;
}

export interface ReconnectPayload {
  playerId: string;
  roomId: string;
}

export interface JoinRoomPayload {
  roomId: string;
  playerName: string;
  playerId?: string; // for reconnection
}

export interface RoomUpdatePayload {
  room: ClientRoomInfo;
}

export interface RoleAssignedPayload {
  role: 'impostor' | 'player';
  word: string | null;
}

export interface PhaseChangePayload {
  phase: GamePhase;
  timeRemaining?: number;
}

export interface CastVotePayload {
  targetId: string | null; // null for skip
}

export interface VoteUpdatePayload {
  votes: Record<string, string>;
  voterId: string;
  targetId: string | null;
}

export interface VoteResultsPayload {
  eliminatedId: string | null;
  wasImpostor: boolean;
  voteCounts: Record<string, number>;
  tie: boolean;
  skipVotes: number;
  revote: boolean;
  voteRound: number;
}

export interface GameOverPayload {
  winner: 'players' | 'impostors';
  secretWord: string;
  impostorIds: string[];
}

export interface ChatMessagePayload {
  id: string;
  roomId: string;
  playerId: string;
  playerName: string;
  content: string;
  createdAt: string;
}

export interface ErrorPayload {
  message: string;
  code?: string;
}
