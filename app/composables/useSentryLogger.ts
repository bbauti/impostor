import * as Sentry from "@sentry/nuxt"
import type { SeverityLevel } from "@sentry/nuxt"

interface BreadcrumbData {
  [key: string]: unknown
}

export const useSentryLogger = () => {
  const addBreadcrumb = (
    category: string,
    message: string,
    data?: BreadcrumbData,
    level: SeverityLevel = "info",
  ) => {
    Sentry.addBreadcrumb({
      category,
      message,
      level,
      data,
      timestamp: Date.now() / 1000,
    })
  }

  const logRoom = (
    action: "create" | "join" | "leave" | "delete" | "not_found",
    roomId: string,
    data?: BreadcrumbData,
  ) => {
    addBreadcrumb("room", `Room ${action}: ${roomId}`, { roomId, ...data })
  }

  const logConnection = (
    action: "connect" | "disconnect" | "reconnect" | "error" | "timeout",
    data?: BreadcrumbData,
  ) => {
    const level: SeverityLevel = action === "error" ? "error" : "info"
    addBreadcrumb("connection", `Connection ${action}`, data, level)
  }

  const logPhase = (
    phase: string,
    data?: BreadcrumbData,
  ) => {
    addBreadcrumb("game.phase", `Phase changed to: ${phase}`, { phase, ...data })
  }

  const logGameAction = (
    action: string,
    data?: BreadcrumbData,
  ) => {
    addBreadcrumb("game.action", `Game action: ${action}`, data)
  }

  const logPlayer = (
    action: "join" | "leave" | "ready" | "role_assigned",
    playerId: string,
    data?: BreadcrumbData,
  ) => {
    addBreadcrumb("player", `Player ${action}: ${playerId}`, { playerId, ...data })
  }

  const logError = (
    message: string,
    error?: Error | unknown,
    data?: BreadcrumbData,
  ) => {
    addBreadcrumb("error", message, data, "error")

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
    data?: BreadcrumbData,
  ) => {
    addBreadcrumb("navigation", `Navigate: ${from} → ${to}`, { from, to, ...data })
  }

  const logApi = (
    method: string,
    endpoint: string,
    status?: "start" | "success" | "error",
    data?: BreadcrumbData,
  ) => {
    const level: SeverityLevel = status === "error" ? "error" : "info"
    addBreadcrumb("api", `${method} ${endpoint} - ${status || "called"}`, { method, endpoint, status, ...data }, level)
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
    addBreadcrumb,
    logRoom,
    logConnection,
    logPhase,
    logGameAction,
    logPlayer,
    logError,
    logNavigation,
    logApi,
    setUser,
    clearUser,
    setRoomContext,
    clearRoomContext,
  }
}
