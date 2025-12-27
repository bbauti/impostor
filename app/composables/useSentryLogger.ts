import * as Sentry from "@sentry/nuxt"

interface LogData {
  [key: string]: unknown
}

export const useSentryLogger = () => {
  const logRoom = (
    action: "create" | "join" | "leave" | "delete" | "not_found",
    roomId: string,
    data?: LogData,
  ) => {
    Sentry.logger.info(Sentry.logger.fmt`[room.${action}] Room ${roomId}`, { roomId, action, ...data })
  }

  const logConnection = (
    action: "connect" | "disconnect" | "reconnect" | "error" | "timeout",
    data?: LogData,
  ) => {
    if (action === "error" || action === "timeout") {
      Sentry.logger.error(Sentry.logger.fmt`[connection.${action}]`, { action, ...data })
    } else {
      Sentry.logger.info(Sentry.logger.fmt`[connection.${action}]`, { action, ...data })
    }
  }

  const logPhase = (
    phase: string,
    data?: LogData,
  ) => {
    Sentry.logger.info(Sentry.logger.fmt`[game.phase] Phase changed to: ${phase}`, { phase, ...data })
  }

  const logGameAction = (
    action: string,
    data?: LogData,
  ) => {
    Sentry.logger.info(Sentry.logger.fmt`[game.action] ${action}`, { action, ...data })
  }

  const logPlayer = (
    action: "join" | "leave" | "ready" | "role_assigned",
    playerId: string,
    data?: LogData,
  ) => {
    Sentry.logger.info(Sentry.logger.fmt`[player.${action}] ${playerId}`, { playerId, action, ...data })
  }

  const logError = (
    message: string,
    error?: Error | unknown,
    data?: LogData,
  ) => {
    Sentry.logger.error(Sentry.logger.fmt`[error] ${message}`, { ...data })

    if (error instanceof Error) {
      Sentry.captureException(error, {
        extra: data,
      })
    } else if (error) {
      Sentry.captureMessage(message, {
        level: "error",
        extra: { error, ...data },
      })
    }
  }

  const logNavigation = (
    from: string,
    to: string,
    data?: LogData,
  ) => {
    Sentry.logger.info(Sentry.logger.fmt`[navigation] ${from} → ${to}`, { from, to, ...data })
  }

  const logApi = (
    method: string,
    endpoint: string,
    status?: "start" | "success" | "error",
    data?: LogData,
  ) => {
    if (status === "error") {
      Sentry.logger.error(Sentry.logger.fmt`[api] ${method} ${endpoint} - ${status}`, { method, endpoint, status, ...data })
    } else {
      Sentry.logger.info(Sentry.logger.fmt`[api] ${method} ${endpoint} - ${status || "called"}`, { method, endpoint, status, ...data })
    }
  }

  const metricRoomCreated = (isPublic: boolean) => {
    Sentry.metrics.count("room.created", 1, {
      attributes: { is_public: String(isPublic) },
    })
  }

  const metricPlayerJoined = (roomId: string) => {
    Sentry.metrics.count("player.joined", 1, {
      attributes: { room_id: roomId },
    })
  }

  const metricPlayerLeft = (roomId: string) => {
    Sentry.metrics.count("player.left", 1, {
      attributes: { room_id: roomId },
    })
  }

  const metricPlayerReady = () => {
    Sentry.metrics.count("player.ready", 1)
  }

  const metricGameStarted = (playerCount: number, impostorCount: number) => {
    Sentry.metrics.count("game.started", 1, {
      attributes: { player_count: String(playerCount), impostor_count: String(impostorCount) },
    })
  }

  const metricGameEnded = (winner: "players" | "impostors", durationMs: number) => {
    Sentry.metrics.count("game.ended", 1, {
      attributes: { winner },
    })
    Sentry.metrics.distribution("game.duration", durationMs, {
      unit: "millisecond",
      attributes: { winner },
    })
  }

  const metricPhaseChanged = (phase: string, durationMs?: number) => {
    Sentry.metrics.count("phase.changed", 1, {
      attributes: { phase },
    })
    if (durationMs !== undefined) {
      Sentry.metrics.distribution("phase.duration", durationMs, {
        unit: "millisecond",
        attributes: { phase },
      })
    }
  }

  const metricVoteCalled = (roomId: string) => {
    Sentry.metrics.count("vote.called", 1, {
      attributes: { room_id: roomId },
    })
  }

  const metricVoteCast = (roomId: string) => {
    Sentry.metrics.count("vote.cast", 1, {
      attributes: { room_id: roomId },
    })
  }

  const metricConnectionEstablished = () => {
    Sentry.metrics.count("connection.established", 1)
  }

  const metricConnectionReconnected = (attempt: number) => {
    Sentry.metrics.count("connection.reconnected", 1, {
      attributes: { attempt: String(attempt) },
    })
  }

  const metricConnectionError = (reason: string) => {
    Sentry.metrics.count("connection.error", 1, {
      attributes: { reason },
    })
  }

  const metricRoomPlayerCount = (roomId: string, count: number) => {
    Sentry.metrics.gauge("room.player_count", count, {
      attributes: { room_id: roomId },
    })
  }

  const metricChatMessageSent = (roomId: string) => {
    Sentry.metrics.count("chat.message_sent", 1, {
      attributes: { room_id: roomId },
    })
  }

  const setUser = (playerId: string, playerName?: string) => {
    Sentry.setUser({
      id: playerId,
      username: playerName,
    })
  }

  const clearUser = () => {
    Sentry.setUser(null)
  }

  const setRoomContext = (roomId: string) => {
    Sentry.setTag("room_id", roomId)
  }

  const clearRoomContext = () => {
    Sentry.setTag("room_id", undefined)
  }

  return {
    logRoom,
    logConnection,
    logPhase,
    logGameAction,
    logPlayer,
    logError,
    logNavigation,
    logApi,
    metricRoomCreated,
    metricPlayerJoined,
    metricPlayerLeft,
    metricPlayerReady,
    metricGameStarted,
    metricGameEnded,
    metricPhaseChanged,
    metricVoteCalled,
    metricVoteCast,
    metricConnectionEstablished,
    metricConnectionReconnected,
    metricConnectionError,
    metricRoomPlayerCount,
    metricChatMessageSent,
    setUser,
    clearUser,
    setRoomContext,
    clearRoomContext,
  }
}
