export interface ChatMessage {
  id: string;
  roomId: string;
  playerId: string;
  playerName: string;
  content: string;
  createdAt: string;
}

export interface ChatMessagePayload {
  roomId: string;
  playerId: string;
  playerName: string;
  content: string;
}
