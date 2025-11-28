// Game Configuration
export const MIN_PLAYERS = 3
export const MAX_PLAYERS = 10
export const MIN_IMPOSTORS = 1
export const MAX_IMPOSTORS = 3

// Time limits (in minutes for UI, converted to seconds in backend)
export const MIN_TIME_LIMIT = 5 // minutes
export const MAX_TIME_LIMIT = 30 // minutes
export const DEFAULT_TIME_LIMIT = 10 // minutes

// Phase durations (in milliseconds)
export const ROLE_REVEAL_DURATION = 10000 // 10 seconds
export const AUTO_READY_TIMEOUT = 30000 // 30 seconds

// Room cleanup (in milliseconds)
export const ROOM_EMPTY_TIMEOUT = 2 * 60 * 1000 // 2 minutes
export const ROOM_ENDED_TIMEOUT = 1 * 60 * 1000 // 1 minute

// WebSocket
export const WS_PING_INTERVAL = 30000 // 30 seconds
export const WS_MISSED_PINGS_LIMIT = 3
export const WS_RECONNECT_ATTEMPTS = 5
export const WS_RECONNECT_DELAY = 2000 // 2 seconds

// LocalStorage keys
export const LS_PLAYER_ID = 'impostor_player_id'
export const LS_PLAYER_NAME = 'impostor_player_name'
export const LS_ROOM_ID = 'impostor_room_id'

// Room ID
export const ROOM_ID_LENGTH = 6 // Short, shareable room codes
