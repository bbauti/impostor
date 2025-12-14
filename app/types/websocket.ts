import type { ClientRoomInfo, GamePhase } from './game';

export interface ConnectPayload {
  playerId: string;
  roomId: string;
}

export interface ReconnectPayload {
  playerId: string;
  roomId: string;
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

export interface VoteUpdatePayload {
  votes: Record<string, string>;
  voterId: string;
  targetId: string | null;
}

export interface ErrorPayload {
  message: string;
  code?: string;
}
