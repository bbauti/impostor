import { ref, onUnmounted } from "vue"
import type { RealtimeChannel } from "@supabase/supabase-js"
import type {
  ClientRoomInfo,
  Player,
  GameSettings,
  GamePhase,
} from "~/types/game"
import { useSentryLogger } from "./useSentryLogger"

interface PresencePayload {
  playerId: string
  playerName: string
  isReady: boolean
  isHost: boolean
  status: "waiting" | "ready" | "playing" | "spectating" | "disconnected"
  joinedAt: number
}

interface BroadcastPayload {
  type: string
  payload: unknown
}

interface ReconnectionState {
  playerName: string
  isReady: boolean
  status: PresencePayload["status"]
}

export const useSupabaseGame = () => {
  const supabase = useSupabaseClient()
  const sentry = useSentryLogger()

  const channel = ref<RealtimeChannel | null>(null)
  const connected = ref(false)
  const connecting = ref(false)
  const reconnecting = ref(false)
  const currentRoomId = ref<string | null>(null)
  const currentPlayerId = ref<string | null>(null)
  const roomSettings = ref<GameSettings | null>(null)
  const roomCreatorId = ref<string | null>(null)
  const activeUserCount = ref(0)
  const cleanupTimeoutId = ref<ReturnType<typeof setTimeout> | null>(null)
  const syncPlayersDebounce = ref<NodeJS.Timeout | null>(null)
  const cleanupAbortController = ref<AbortController | null>(null)
  const reconnectionState = ref<ReconnectionState | null>(null)
  const visibilityHandler = ref<() => void | null>(null)
  const reconnectAttempts = ref(0)
  const maxReconnectAttempts = 5

  const eventHandlers = new Map<string, (payload: unknown) => void[]>()

  const generatePlayerId = () =>
    `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const emit = (type: string, payload: unknown) => {
    const handlers = eventHandlers.get(type)
    if (handlers) {
      handlers.forEach((h) => h(payload))
    }
  }

  const buildPlayersFromPresence = (
    presenceState: Record<string, PresencePayload[]>,
  ): Player[] => {
    const players: Player[] = []
    const entries = Object.entries(presenceState)

    // Sort by joinedAt for consistent ordering
    const sortedEntries = entries
      .map(([_key, presences]) => presences[0])
      .filter(Boolean)
      .sort((a, b) => a.joinedAt - b.joinedAt)

    // Host is determined by creatorId, not by first joined
    // The creatorId is stored in the player's presence if they're the creator
    const hostPlayerId =
      sortedEntries.find((p) => p.playerId === roomCreatorId.value)?.playerId ||
      sortedEntries[0]?.playerId // Fallback to first player if creator hasn't joined yet

    for (const presence of sortedEntries) {
      players.push({
        id: presence.playerId,
        name: presence.playerName,
        status: presence.status,
        isHost: presence.playerId === hostPlayerId,
      })
    }

    return players
  }

  const buildClientRoomInfo = (
    roomId: string,
    players: Player[],
  ): ClientRoomInfo => {
    return {
      id: roomId,
      hostId: players.find((p) => p.isHost)?.id || "",
      players,
      settings: roomSettings.value || {
        maxPlayers: 10,
        impostorCount: 1,
        categories: ["fallback"],
        timeLimit: 600,
      },
      phase: "waiting" as GamePhase,
      timeStarted: null,
    }
  }

  const joinRoom = async (
    roomId: string,
    playerName: string,
    existingPlayerId?: string,
    settings?: GameSettings,
    creatorId?: string,
  ) => {
    if (channel.value) {
      await leaveRoom()
    }

    sentry.logRoom("join", roomId, { playerName, isCreator: !!creatorId })
    sentry.setRoomContext(roomId)

    connecting.value = true
    currentRoomId.value = roomId

    // If this user is the creator, use creatorId as their playerId
    // This ensures they're always recognized as host
    if (creatorId && existingPlayerId === creatorId) {
      currentPlayerId.value = creatorId
    } else {
      currentPlayerId.value = existingPlayerId || generatePlayerId()
    }

    // Store creatorId for host determination
    if (creatorId) {
      roomCreatorId.value = creatorId
    }

    if (settings) {
      roomSettings.value = settings
    }

    const roomChannel = supabase.channel(`room:${roomId}`, {
      config: {
        presence: { key: currentPlayerId.value },
      },
    })

    // Handle presence sync (replaces ROOM_UPDATE)
    roomChannel.on("presence", { event: "sync" }, () => {
      const presenceState = roomChannel.presenceState<PresencePayload>()
      const players = buildPlayersFromPresence(presenceState)

      // Sincronizar contador de usuarios activos con estado real
      activeUserCount.value = players.length

      const roomInfo = buildClientRoomInfo(roomId, players)

      // Preserve current phase from local state if available
      emit("ROOM_UPDATE", { room: roomInfo })

      // Sync players to database (debounced to avoid excessive calls)
      if (syncPlayersDebounce.value) clearTimeout(syncPlayersDebounce.value)
      syncPlayersDebounce.value = setTimeout(async () => {
        if (currentRoomId.value) {
          try {
            await supabase.functions.invoke("sync-players", {
              body: {
                roomId: currentRoomId.value,
                players: players.map((p) => ({
                  playerId: p.id,
                  playerName: p.name,
                })),
              },
            })
          } catch {
            void 0
          }
        }
      }, 500)
    })

    // Handle player join
    roomChannel.on("presence", { event: "join" }, () => {
      activeUserCount.value++

      // Cancelar limpieza pendiente si había alguna programada
      if (cleanupTimeoutId.value) {
        clearTimeout(cleanupTimeoutId.value)
        cleanupTimeoutId.value = null
      }
    })

    // Handle player leave with proper async cleanup using AbortController
    roomChannel.on("presence", { event: "leave" }, async () => {
      activeUserCount.value--

      // Only schedule cleanup if room appears empty
      if (activeUserCount.value === 0 && currentRoomId.value) {
        // Cancel any pending cleanup
        if (cleanupAbortController.value) {
          cleanupAbortController.value.abort()
        }
        cleanupAbortController.value = new AbortController()
        const signal = cleanupAbortController.value.signal
        const roomIdToCleanup = currentRoomId.value

        try {
          const { data, error } = await supabase
            .from("game_states")
            .select("phase")
            .eq("room_id", roomIdToCleanup)
            .single()

          // Check if cleanup was aborted or query failed
          if (signal.aborted || error || !data) {
            if (!signal.aborted) {
            }
            return
          }

          const phase = data.phase
          let cleanupDelay: number

          if (phase === "ended") {
            cleanupDelay = 0
          } else if (phase === "waiting") {
            cleanupDelay = 5 * 60 * 1000 // 5 minutes
          } else {
            cleanupDelay = 3000 // 3 seconds
          }

          // Wait for cleanup delay with abort support
          await new Promise<void>((resolve, reject) => {
            const timeoutId = setTimeout(resolve, cleanupDelay)
            signal.addEventListener("abort", () => {
              clearTimeout(timeoutId)
              reject(new Error("Cleanup aborted"))
            })
          })

          // Check again if aborted
          if (signal.aborted) return

          // Verify room is still empty before cleanup
          const finalState = roomChannel.presenceState<PresencePayload>()
          const finalPlayers = buildPlayersFromPresence(finalState)

          if (finalPlayers.length === 0) {
            await supabase.functions.invoke("cleanup-empty-room", {
              body: { roomId: roomIdToCleanup },
            })
            emit("ROOM_DELETED", { roomId: roomIdToCleanup })
          } else {
          }
        } catch (e) {
          // Cleanup was aborted or failed - that's expected
          if (!(e instanceof Error && e.message === "Cleanup aborted")) {
          }
        }
      }
    })

    // Handle broadcast events (game_event for all players)
    roomChannel.on(
      "broadcast",
      { event: "game_event" },
      ({ payload }: { payload: BroadcastPayload }) => {
        emit(payload.type, payload.payload)
      },
    )

    // Handle private messages (for ROLE_ASSIGNED)
    roomChannel.on(
      "broadcast",
      { event: `private:${currentPlayerId.value}` },
      ({ payload }: { payload: BroadcastPayload }) => {
        emit(payload.type, payload.payload)
      },
    )

    roomChannel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        connected.value = true
        connecting.value = false

        sentry.logConnection("connect", { roomId, playerId: currentPlayerId.value })
        sentry.setUser(currentPlayerId.value!, playerName)

        reconnectionState.value = {
          playerName,
          isReady: false,
          status: "waiting",
        }

        await roomChannel.track({
          playerId: currentPlayerId.value,
          playerName,
          isReady: false,
          isHost: false,
          status: "waiting",
          joinedAt: Date.now(),
        } as PresencePayload)

        setupVisibilityHandler()

        emit("CONNECT", { playerId: currentPlayerId.value, roomId })
      } else if (status === "CHANNEL_ERROR") {
        sentry.logConnection("error", { roomId, status: "CHANNEL_ERROR" })
        connecting.value = false
        connected.value = false
        if (reconnectionState.value) {
          handleReconnection()
        } else {
          emit("ERROR", { message: "Error connecting to room" })
        }
      } else if (status === "TIMED_OUT") {
        sentry.logConnection("timeout", { roomId })
        connecting.value = false
        connected.value = false
        if (reconnectionState.value) {
          handleReconnection()
        } else {
          emit("ERROR", { message: "Connection timed out" })
        }
      } else if (status === "CLOSED") {
        sentry.logConnection("disconnect", { roomId, reason: "CLOSED" })
        connecting.value = false
        connected.value = false
        if (reconnectionState.value && currentRoomId.value) {
          handleReconnection()
        } else {
          emit("ERROR", { message: "Connection closed" })
        }
      }
    })

    channel.value = roomChannel
  }

  const leaveRoom = async () => {
    if (currentRoomId.value) {
      sentry.logRoom("leave", currentRoomId.value)
    }
    sentry.clearRoomContext()
    sentry.clearUser()

    cleanupVisibilityHandler()
    reconnectionState.value = null
    reconnectAttempts.value = 0

    if (syncPlayersDebounce.value) {
      clearTimeout(syncPlayersDebounce.value)
      syncPlayersDebounce.value = null
    }

    if (cleanupAbortController.value) {
      cleanupAbortController.value.abort()
      cleanupAbortController.value = null
    }

    if (cleanupTimeoutId.value) {
      clearTimeout(cleanupTimeoutId.value)
      cleanupTimeoutId.value = null
    }

    eventHandlers.clear()

    if (channel.value && currentRoomId.value) {
      // Check if we're the last player in the room
      const presenceState = channel.value.presenceState<PresencePayload>()
      const players = buildPlayersFromPresence(presenceState)
      const roomIdBeforeLeave = currentRoomId.value

      // If we're the only player (or last player), sync empty players array immediately
      // This ensures the room disappears from the public list
      if (players.length <= 1) {
        try {
          await supabase.functions.invoke("sync-players", {
            body: {
              roomId: roomIdBeforeLeave,
              players: [],
            },
          })
        } catch {}
      }

      await channel.value.untrack()
      await supabase.removeChannel(channel.value)
      channel.value = null
    }
    connected.value = false
    connecting.value = false
    currentRoomId.value = null
    roomSettings.value = null
    roomCreatorId.value = null
    activeUserCount.value = 0
  }

  const markReady = async () => {
    if (!channel.value || !currentPlayerId.value) return

    sentry.logPlayer("ready", currentPlayerId.value)

    const presenceState = channel.value.presenceState<PresencePayload>()
    const currentPresence = presenceState[currentPlayerId.value]?.[0]

    if (currentPresence) {
      if (reconnectionState.value) {
        reconnectionState.value.isReady = true
        reconnectionState.value.status = "ready"
      }
      await channel.value.track({
        ...currentPresence,
        isReady: true,
        status: "ready",
      })
    }
  }

  const updatePresenceStatus = async (status: PresencePayload["status"]) => {
    if (!channel.value || !currentPlayerId.value) return

    const presenceState = channel.value.presenceState<PresencePayload>()
    const currentPresence = presenceState[currentPlayerId.value]?.[0]

    if (currentPresence) {
      if (reconnectionState.value) {
        reconnectionState.value.status = status
      }
      await channel.value.track({
        ...currentPresence,
        status,
      })
    }
  }

  const startGame = async () => {
    if (!currentRoomId.value || !currentPlayerId.value || !channel.value) return

    sentry.logGameAction("start_game", { roomId: currentRoomId.value, playerId: currentPlayerId.value })

    const presenceState = channel.value.presenceState<PresencePayload>()

    // Sort by joinedAt for consistent ordering
    const sortedEntries = Object.entries(presenceState)
      .map(([_key, presences]) => presences[0])
      .filter(Boolean)
      .sort((a, b) => a.joinedAt - b.joinedAt)

    // Host is determined by creatorId
    const hostPlayerId =
      sortedEntries.find((p) => p.playerId === roomCreatorId.value)?.playerId ||
      sortedEntries[0]?.playerId

    const players = sortedEntries.map((p) => ({
      playerId: p.playerId,
      playerName: p.playerName,
      isReady: p.isReady,
      isHost: p.playerId === hostPlayerId,
    }))

    const { error } = await supabase.functions.invoke("start-game", {
      body: {
        roomId: currentRoomId.value,
        playerId: currentPlayerId.value,
        players,
        settings: roomSettings.value || {
          impostorCount: 1,
          categories: ["fallback"],
          timeLimit: 600,
        },
      },
    })

    if (error) {
      emit("ERROR", { message: error.message })
    }
  }

  const callVote = async () => {
    if (!currentRoomId.value || !currentPlayerId.value) return

    sentry.logGameAction("call_vote", { roomId: currentRoomId.value, playerId: currentPlayerId.value })

    const { error } = await supabase.functions.invoke("call-vote", {
      body: {
        roomId: currentRoomId.value,
        playerId: currentPlayerId.value,
      },
    })

    if (error) {
      sentry.logError("call_vote_failed", error, { roomId: currentRoomId.value })
      emit("ERROR", { message: error.message })
    }
  }

  const castVote = async (targetId: string | null) => {
    if (!currentRoomId.value || !currentPlayerId.value) return

    sentry.logGameAction("cast_vote", { roomId: currentRoomId.value, voterId: currentPlayerId.value, targetId })

    const { error } = await supabase.functions.invoke("cast-vote", {
      body: {
        roomId: currentRoomId.value,
        playerId: currentPlayerId.value,
        targetId,
      },
    })

    if (error) {
      sentry.logError("cast_vote_failed", error, { roomId: currentRoomId.value })
      emit("ERROR", { message: error.message })
    }
  }

  const transitionPhase = async (newPhase: GamePhase) => {
    if (!currentRoomId.value || !currentPlayerId.value) return

    const { error } = await supabase.functions.invoke("transition-phase", {
      body: {
        roomId: currentRoomId.value,
        playerId: currentPlayerId.value,
        newPhase,
      },
    })

    if (error) {
      emit("ERROR", { message: error.message })
    }
  }

  const on = (type: string, handler: (payload: unknown) => void) => {
    if (!eventHandlers.has(type)) {
      eventHandlers.set(type, [])
    }
    eventHandlers.get(type)!.push(handler)
  }

  const off = (type: string, handler: (payload: unknown) => void) => {
    const handlers = eventHandlers.get(type)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index >= 0) handlers.splice(index, 1)
    }
  }

  const handleReconnection = async () => {
    if (
      !currentRoomId.value ||
      !currentPlayerId.value ||
      !reconnectionState.value
    ) {
      return
    }

    if (reconnecting.value || connecting.value) {
      return
    }

    sentry.logConnection("reconnect", { roomId: currentRoomId.value, attempt: reconnectAttempts.value + 1 })

    reconnecting.value = true
    reconnectAttempts.value++

    const delay = Math.min(
      1000 * Math.pow(2, reconnectAttempts.value - 1),
      10000,
    )
    await new Promise((resolve) => setTimeout(resolve, delay))

    try {
      if (channel.value) {
        const state = channel.value.state
        if (state === "joined") {
          await channel.value.track({
            playerId: currentPlayerId.value,
            playerName: reconnectionState.value.playerName,
            isReady: reconnectionState.value.isReady,
            isHost: false,
            status: reconnectionState.value.status,
            joinedAt: Date.now(),
          } as PresencePayload)

          reconnecting.value = false
          reconnectAttempts.value = 0
          emit("RECONNECT", {
            playerId: currentPlayerId.value,
            roomId: currentRoomId.value,
          })
          return
        }
      }

      if (channel.value) {
        await supabase.removeChannel(channel.value)
        channel.value = null
      }

      await joinRoom(
        currentRoomId.value,
        reconnectionState.value.playerName,
        currentPlayerId.value,
        roomSettings.value || undefined,
        roomCreatorId.value || undefined,
      )

      reconnectAttempts.value = 0
    } catch (e) {
      if (reconnectAttempts.value < maxReconnectAttempts) {
        setTimeout(handleReconnection, 1000)
      } else {
        sentry.logError("reconnection_failed", e, { roomId: currentRoomId.value, attempts: reconnectAttempts.value })
        emit("ERROR", {
          message: "No se pudo reconectar. Por favor recarga la página.",
        })
      }
    } finally {
      reconnecting.value = false
    }
  }

  const setupVisibilityHandler = () => {
    if (typeof document === "undefined") return

    if (visibilityHandler.value) {
      document.removeEventListener("visibilitychange", visibilityHandler.value)
    }

    visibilityHandler.value = () => {
      if (document.visibilityState === "visible") {
        if (
          currentRoomId.value &&
          currentPlayerId.value &&
          reconnectionState.value
        ) {
          if (!connected.value || channel.value?.state !== "joined") {
            handleReconnection()
          } else if (channel.value) {
            channel.value
              .track({
                playerId: currentPlayerId.value,
                playerName: reconnectionState.value.playerName,
                isReady: reconnectionState.value.isReady,
                isHost: false,
                status: reconnectionState.value.status,
                joinedAt: Date.now(),
              } as PresencePayload)
              .catch(() => {
                handleReconnection()
              })
          }
        }
      }
    }

    document.addEventListener("visibilitychange", visibilityHandler.value)
  }

  const cleanupVisibilityHandler = () => {
    if (typeof document !== "undefined" && visibilityHandler.value) {
      document.removeEventListener("visibilitychange", visibilityHandler.value)
      visibilityHandler.value = null
    }
  }

  onUnmounted(() => {
    eventHandlers.clear()
    cleanupVisibilityHandler()
    leaveRoom()
  })

  return {
    connected,
    connecting,
    reconnecting,
    currentPlayerId,
    currentRoomId,

    joinRoom,
    leaveRoom,
    markReady,
    updatePresenceStatus,
    startGame,
    callVote,
    castVote,
    transitionPhase,

    on,
    off,

    setupVisibilityHandler,
    handleReconnection,
  }
}
