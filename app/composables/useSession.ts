import { useCookie } from '#app';

const SESSION_COOKIE_NAME = 'impostor_session';
const SESSION_MAX_AGE = 10 * 60; // 10 minutes in seconds

export interface SessionData {
  playerId: string;
  playerName: string;
  roomId?: string;
  lastActivity: number;
}

export const useSession = () => {
  const sessionCookie = useCookie<SessionData | null>(SESSION_COOKIE_NAME, {
    maxAge: SESSION_MAX_AGE,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    default: () => null
  });

  const createSession = (playerId: string, playerName: string, roomId?: string) => {
    sessionCookie.value = {
      playerId,
      playerName,
      roomId,
      lastActivity: Date.now()
    };
  };

  const getSession = (): SessionData | null => {
    return sessionCookie.value;
  };

  const updateActivity = () => {
    if (sessionCookie.value) {
      sessionCookie.value = {
        ...sessionCookie.value,
        lastActivity: Date.now()
      };
    }
  };

  const updateRoomId = (roomId: string | undefined) => {
    if (sessionCookie.value) {
      sessionCookie.value = {
        ...sessionCookie.value,
        roomId,
        lastActivity: Date.now()
      };
    }
  };

  const clearSession = () => {
    sessionCookie.value = null;
  };

  const isSessionValid = (): boolean => {
    if (!sessionCookie.value) return false;

    const now = Date.now();
    const elapsed = now - sessionCookie.value.lastActivity;

    // Session valid if less than 10 minutes have passed
    return elapsed < SESSION_MAX_AGE * 1000;
  };

  const refreshSession = () => {
    if (sessionCookie.value && isSessionValid()) {
      // Update the cookie to reset its max-age timer
      sessionCookie.value = {
        ...sessionCookie.value,
        lastActivity: Date.now()
      };
    }
  };

  return {
    createSession,
    getSession,
    updateActivity,
    updateRoomId,
    clearSession,
    isSessionValid,
    refreshSession
  };
};
