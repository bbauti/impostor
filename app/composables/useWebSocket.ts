import { ref, onUnmounted } from 'vue'
import { MessageType, type WebSocketMessage, type JoinRoomPayload } from '~/types/websocket'

export const useWebSocket = () => {
  const ws = ref<WebSocket | null>(null)
  const connected = ref(false)
  const connecting = ref(false)

  let reconnectAttempts = 0
  const maxReconnectAttempts = 5
  let reconnectTimeout: NodeJS.Timeout | null = null
  let pingInterval: NodeJS.Timeout | null = null

  // Message handlers
  const messageHandlers = new Map<MessageType, ((payload: unknown) => void)[]>()

  const connect = () => {
    if (ws.value || connecting.value) return

    connecting.value = true

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${protocol}//${window.location.host}/_ws`

      console.log('[WS] Connecting to:', wsUrl)
      ws.value = new WebSocket(wsUrl)

      ws.value.onopen = () => {
        console.log('[WS] Connected')
        connected.value = true
        connecting.value = false
        reconnectAttempts = 0

        // Start heartbeat
        startHeartbeat()
      }

      ws.value.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          handleMessage(message)
        } catch (error) {
          console.error('[WS] Failed to parse message:', error)
        }
      }

      ws.value.onclose = () => {
        console.log('[WS] Disconnected')
        connected.value = false
        connecting.value = false
        stopHeartbeat()

        // Attempt reconnection
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000)
          console.log(`[WS] Reconnecting in ${delay}ms (attempt ${reconnectAttempts})`)

          reconnectTimeout = setTimeout(() => {
            connect()
          }, delay)
        } else {
          console.error('[WS] Max reconnection attempts reached')
        }
      }

      ws.value.onerror = (error) => {
        console.error('[WS] Error:', error)
        connecting.value = false
      }
    } catch (error) {
      console.error('[WS] Connection error:', error)
      connecting.value = false
    }
  }

  const disconnect = () => {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      reconnectTimeout = null
    }

    stopHeartbeat()

    if (ws.value) {
      ws.value.close()
      ws.value = null
    }

    connected.value = false
    connecting.value = false
    reconnectAttempts = 0
  }

  const send = (message: WebSocketMessage) => {
    if (!ws.value || ws.value.readyState !== WebSocket.OPEN) {
      console.warn('[WS] Cannot send message: not connected')
      return false
    }

    try {
      ws.value.send(JSON.stringify(message))
      return true
    } catch (error) {
      console.error('[WS] Failed to send message:', error)
      return false
    }
  }

  // Helper methods for common message types
  const joinRoom = (roomId: string, playerName: string, playerId?: string) => {
    const payload: JoinRoomPayload = {
      roomId,
      playerName,
      playerId // Optional - for reconnection via cookie
    }

    send({
      type: MessageType.JOIN_ROOM,
      payload,
      timestamp: Date.now()
    })
  }

  const leaveRoom = () => {
    send({
      type: MessageType.LEAVE_ROOM,
      payload: {},
      timestamp: Date.now()
    })
  }

  const markReady = () => {
    send({
      type: MessageType.PLAYER_READY,
      payload: {},
      timestamp: Date.now()
    })
  }

  const startGame = () => {
    send({
      type: MessageType.START_GAME,
      payload: {},
      timestamp: Date.now()
    })
  }

  const callVote = () => {
    send({
      type: MessageType.CALL_VOTE,
      payload: {},
      timestamp: Date.now()
    })
  }

  const castVote = (targetId: string | null) => {
    send({
      type: MessageType.CAST_VOTE,
      payload: { targetId },
      timestamp: Date.now()
    })
  }

  // Message handling
  const handleMessage = (message: WebSocketMessage) => {
    if (import.meta.dev) {
      console.log('[WS] Received:', message.type, message.payload)
    }

    const handlers = messageHandlers.get(message.type)
    if (handlers) {
      handlers.forEach(handler => handler(message.payload))
    }
  }

  const on = (type: MessageType, handler: (payload: unknown) => void) => {
    if (!messageHandlers.has(type)) {
      messageHandlers.set(type, [])
    }
    messageHandlers.get(type)!.push(handler)
  }

  const off = (type: MessageType, handler: (payload: unknown) => void) => {
    const handlers = messageHandlers.get(type)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index >= 0) {
        handlers.splice(index, 1)
      }
    }
  }

  // Heartbeat
  const startHeartbeat = () => {
    pingInterval = setInterval(() => {
      send({
        type: MessageType.PING,
        payload: {},
        timestamp: Date.now()
      })
    }, 30000) // 30 seconds
  }

  const stopHeartbeat = () => {
    if (pingInterval) {
      clearInterval(pingInterval)
      pingInterval = null
    }
  }

  // Cleanup on unmount
  onUnmounted(() => {
    disconnect()
  })

  return {
    // State
    connected,
    connecting,

    // Methods
    connect,
    disconnect,
    send,

    // Message helpers
    joinRoom,
    leaveRoom,
    markReady,
    startGame,
    callVote,
    castVote,

    // Event handling
    on,
    off
  }
}
