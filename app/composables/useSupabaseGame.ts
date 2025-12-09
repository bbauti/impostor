import { ref, onUnmounted } from 'vue';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { ClientRoomInfo, Player, GameSettings, GamePhase } from '~/types/game';

interface PresencePayload {
  playerId: string;
  playerName: string;
  isReady: boolean;
  isHost: boolean;
  status: 'waiting' | 'ready' | 'playing' | 'spectating' | 'disconnected';
  joinedAt: number;
}

interface BroadcastPayload {
  type: string;
  payload: unknown;
}

export const useSupabaseGame = () => {
  const supabase = useSupabaseClient();

  const channel = ref<RealtimeChannel | null>(null);
  const connected = ref(false);
  const connecting = ref(false);
  const currentRoomId = ref<string | null>(null);
  const currentPlayerId = ref<string | null>(null);
  const roomSettings = ref<GameSettings | null>(null);
  const roomCreatorId = ref<string | null>(null);
  const activeUserCount = ref(0);
  const cleanupTimeoutId = ref<ReturnType<typeof setTimeout> | null>(null);

  const eventHandlers = new Map<string, ((payload: unknown) => void)[]>();

  const generatePlayerId = () =>
    `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const emit = (type: string, payload: unknown) => {
    const handlers = eventHandlers.get(type);
    if (handlers) {
      handlers.forEach(h => h(payload));
    }
  };

  const buildPlayersFromPresence = (
    presenceState: Record<string, PresencePayload[]>
  ): Player[] => {
    const players: Player[] = [];
    const entries = Object.entries(presenceState);

    // Sort by joinedAt for consistent ordering
    const sortedEntries = entries
      .map(([_key, presences]) => presences[0])
      .filter(Boolean)
      .sort((a, b) => a.joinedAt - b.joinedAt);

    // Host is determined by creatorId, not by first joined
    // The creatorId is stored in the player's presence if they're the creator
    const hostPlayerId = sortedEntries.find(p => p.playerId === roomCreatorId.value)?.playerId
      || sortedEntries[0]?.playerId; // Fallback to first player if creator hasn't joined yet

    for (const presence of sortedEntries) {
      players.push({
        id: presence.playerId,
        name: presence.playerName,
        status: presence.status,
        isHost: presence.playerId === hostPlayerId
      });
    }

    return players;
  };

  const buildClientRoomInfo = (roomId: string, players: Player[]): ClientRoomInfo => {
    return {
      id: roomId,
      hostId: players.find(p => p.isHost)?.id || '',
      players,
      settings: roomSettings.value || {
        maxPlayers: 10,
        impostorCount: 1,
        categories: ['fallback'],
        timeLimit: 600
      },
      phase: 'waiting' as GamePhase,
      timeStarted: null
    };
  };

  const joinRoom = async (
    roomId: string,
    playerName: string,
    existingPlayerId?: string,
    settings?: GameSettings,
    creatorId?: string
  ) => {
    if (channel.value) {
      await leaveRoom();
    }

    connecting.value = true;
    currentRoomId.value = roomId;

    // If this user is the creator, use creatorId as their playerId
    // This ensures they're always recognized as host
    if (creatorId && existingPlayerId === creatorId) {
      currentPlayerId.value = creatorId;
    }
    else {
      currentPlayerId.value = existingPlayerId || generatePlayerId();
    }

    // Store creatorId for host determination
    if (creatorId) {
      roomCreatorId.value = creatorId;
    }

    if (settings) {
      roomSettings.value = settings;
    }

    const roomChannel = supabase.channel(`room:${roomId}`, {
      config: {
        presence: { key: currentPlayerId.value }
      }
    });

    // Handle presence sync (replaces ROOM_UPDATE)
    roomChannel.on('presence', { event: 'sync' }, () => {
      const presenceState = roomChannel.presenceState<PresencePayload>();
      const players = buildPlayersFromPresence(presenceState);

      // Sincronizar contador de usuarios activos con estado real
      activeUserCount.value = players.length;

      const roomInfo = buildClientRoomInfo(roomId, players);

      // Preserve current phase from local state if available
      emit('ROOM_UPDATE', { room: roomInfo });
    });

    // Handle player join
    roomChannel.on('presence', { event: 'join' }, ({ key }) => {
      console.log('Player joined:', key);
      activeUserCount.value++;

      // Cancelar limpieza pendiente si había alguna programada
      if (cleanupTimeoutId.value) {
        clearTimeout(cleanupTimeoutId.value);
        cleanupTimeoutId.value = null;
        console.log('Cleanup cancelled - player joined');
      }
    });

    // Handle player leave
    roomChannel.on('presence', { event: 'leave' }, ({ key }) => {
      console.log('Player left:', key);
      activeUserCount.value--;

      // Solo programar limpieza si llegamos a 0 usuarios
      if (activeUserCount.value === 0 && currentRoomId.value) {
        console.log('Room appears empty, scheduling cleanup in 3 seconds...');

        cleanupTimeoutId.value = setTimeout(async () => {
          // Verificar de nuevo antes de eliminar (por si acaso)
          const finalState = roomChannel.presenceState<PresencePayload>();
          const finalPlayers = buildPlayersFromPresence(finalState);

          if (finalPlayers.length === 0) {
            console.log('Room confirmed empty, cleaning up...');
            try {
              await supabase.functions.invoke('cleanup-empty-room', {
                body: { roomId: currentRoomId.value }
              });
              emit('ROOM_DELETED', { roomId: currentRoomId.value });
            } catch (error) {
              console.error('Failed to cleanup empty room:', error);
            }
          } else {
            console.log('Room not empty after all, cleanup aborted');
          }
        }, 3000); // 3 segundos de debounce
      }
    });

    // Handle broadcast events (game_event for all players)
    roomChannel.on('broadcast', { event: 'game_event' }, ({ payload }: { payload: BroadcastPayload }) => {
      emit(payload.type, payload.payload);
    });

    // Handle private messages (for ROLE_ASSIGNED)
    roomChannel.on('broadcast', { event: `private:${currentPlayerId.value}` }, ({ payload }: { payload: BroadcastPayload }) => {
      emit(payload.type, payload.payload);
    });

    // Subscribe and track presence
    roomChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        connected.value = true;
        connecting.value = false;

        // Track this player's presence
        await roomChannel.track({
          playerId: currentPlayerId.value,
          playerName,
          isReady: false,
          isHost: false,
          status: 'waiting',
          joinedAt: Date.now()
        } as PresencePayload);

        emit('CONNECT', { playerId: currentPlayerId.value, roomId });
      }
      else if (status === 'CHANNEL_ERROR') {
        connecting.value = false;
        emit('ERROR', { message: 'Error connecting to room' });
      }
      else if (status === 'TIMED_OUT') {
        connecting.value = false;
        emit('ERROR', { message: 'Connection timed out' });
      }
      else if (status === 'CLOSED') {
        connecting.value = false;
        emit('ERROR', { message: 'Connection closed' });
      }
    });

    channel.value = roomChannel;
  };

  const leaveRoom = async () => {
    // Limpiar timeout de limpieza pendiente
    if (cleanupTimeoutId.value) {
      clearTimeout(cleanupTimeoutId.value);
      cleanupTimeoutId.value = null;
    }

    if (channel.value) {
      await channel.value.untrack();
      await supabase.removeChannel(channel.value);
      channel.value = null;
    }
    connected.value = false;
    connecting.value = false;
    currentRoomId.value = null;
    roomSettings.value = null;
    roomCreatorId.value = null;
    activeUserCount.value = 0;
  };

  const markReady = async () => {
    if (!channel.value || !currentPlayerId.value) return;

    const presenceState = channel.value.presenceState<PresencePayload>();
    const currentPresence = presenceState[currentPlayerId.value]?.[0];

    if (currentPresence) {
      await channel.value.track({
        ...currentPresence,
        isReady: true,
        status: 'ready'
      });
    }
  };

  const updatePresenceStatus = async (status: PresencePayload['status']) => {
    if (!channel.value || !currentPlayerId.value) return;

    const presenceState = channel.value.presenceState<PresencePayload>();
    const currentPresence = presenceState[currentPlayerId.value]?.[0];

    if (currentPresence) {
      await channel.value.track({
        ...currentPresence,
        status
      });
    }
  };

  const startGame = async () => {
    if (!currentRoomId.value || !currentPlayerId.value || !channel.value) return;

    const presenceState = channel.value.presenceState<PresencePayload>();

    // Sort by joinedAt for consistent ordering
    const sortedEntries = Object.entries(presenceState)
      .map(([_key, presences]) => presences[0])
      .filter(Boolean)
      .sort((a, b) => a.joinedAt - b.joinedAt);

    // Host is determined by creatorId
    const hostPlayerId = sortedEntries.find(p => p.playerId === roomCreatorId.value)?.playerId
      || sortedEntries[0]?.playerId;

    const players = sortedEntries.map(p => ({
      playerId: p.playerId,
      playerName: p.playerName,
      isReady: p.isReady,
      isHost: p.playerId === hostPlayerId
    }));

    const { error } = await supabase.functions.invoke('start-game', {
      body: {
        roomId: currentRoomId.value,
        playerId: currentPlayerId.value,
        players,
        settings: roomSettings.value || {
          impostorCount: 1,
          categories: ['fallback'],
          timeLimit: 600
        }
      }
    });

    if (error) {
      emit('ERROR', { message: error.message });
    }
  };

  const callVote = async () => {
    if (!currentRoomId.value || !currentPlayerId.value) return;

    const { error } = await supabase.functions.invoke('call-vote', {
      body: {
        roomId: currentRoomId.value,
        playerId: currentPlayerId.value
      }
    });

    if (error) {
      emit('ERROR', { message: error.message });
    }
  };

  const castVote = async (targetId: string | null) => {
    if (!currentRoomId.value || !currentPlayerId.value) return;

    const { error } = await supabase.functions.invoke('cast-vote', {
      body: {
        roomId: currentRoomId.value,
        playerId: currentPlayerId.value,
        targetId
      }
    });

    if (error) {
      emit('ERROR', { message: error.message });
    }
  };

  const transitionPhase = async (newPhase: GamePhase) => {
    if (!currentRoomId.value || !currentPlayerId.value) return;

    const { error } = await supabase.functions.invoke('transition-phase', {
      body: {
        roomId: currentRoomId.value,
        playerId: currentPlayerId.value,
        newPhase
      }
    });

    if (error) {
      emit('ERROR', { message: error.message });
    }
  };

  const on = (type: string, handler: (payload: unknown) => void) => {
    if (!eventHandlers.has(type)) {
      eventHandlers.set(type, []);
    }
    eventHandlers.get(type)!.push(handler);
  };

  const off = (type: string, handler: (payload: unknown) => void) => {
    const handlers = eventHandlers.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index >= 0) handlers.splice(index, 1);
    }
  };

  onUnmounted(() => {
    leaveRoom();
  });

  return {
    // State
    connected,
    connecting,
    currentPlayerId,
    currentRoomId,

    // Methods
    joinRoom,
    leaveRoom,
    markReady,
    updatePresenceStatus,
    startGame,
    callVote,
    castVote,
    transitionPhase,

    // Event handling
    on,
    off
  };
};
