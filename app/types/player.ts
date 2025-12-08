import type { PlayerStatus } from './game';

export interface PlayerConnection {
  id: string;
  name: string;
  roomId: string;
  status: PlayerStatus;
  lastPing: number;
}

export interface LocalPlayerData {
  id: string;
  name: string;
  roomId: string;
}
