export type GamePhase = 'waiting' | 'role_reveal' | 'discussion' | 'voting' | 'ended';

export type PlayerStatus = 'waiting' | 'ready' | 'playing' | 'spectating' | 'disconnected';

export type GameResult = 'players' | 'impostors';

export interface GameSettings {
  maxPlayers: number;
  impostorCount: number;
  categories: string[];
  timeLimit: number; // in seconds
}

export interface PublicRoomListItem {
  roomId: string;
  playerCount: number;
  maxPlayers: number;
  impostorCount: number;
  categories: string[];
  timeLimit: number; // in seconds
  createdAt: string;
}

export interface PublicRoomsResponse {
  success: boolean;
  rooms: PublicRoomListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Player {
  id: string;
  name: string;
  status: PlayerStatus;
  isHost: boolean;
}

export interface ClientRoomInfo {
  id: string;
  hostId: string;
  players: Player[];
  settings: GameSettings;
  phase: GamePhase;
  timeStarted: number | null;
}

export interface GameOverData {
  winner: GameResult;
  secretWord: string;
  impostorIds: string[];
  players: Player[];
}
