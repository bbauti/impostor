<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import type { RoomUpdatePayload, RoleAssignedPayload } from '~/types/websocket';
import type { GameOverData, PlayerStatus, GameSettings } from '~/types/game';
import type { ChatMessage } from '~/types/chat';
import type { OfflineSettings } from '~/composables/useOfflineGame';
import { ROLE_REVEAL_DURATION } from '~/utils/constants';

const route = useRoute();
const roomId = route.params.id as string;

const isOfflineMode = computed(() => route.query.mode === 'offline');
const offlineSettings = ref<OfflineSettings | null>(null);

const game = useSupabaseGame();
const gameState = useGameState();
const session = useSession();
const soundEffects = useSoundEffects();
const roomChat = useRoomChat();

const playerName = ref('');
const joined = ref(false);
const showNamePrompt = ref(true);
const error = ref('');
const gameOverData = ref<GameOverData | null>(null);
const roomSettings = ref<GameSettings | null>(null);
const roomCreatorId = ref<string | null>(null);
const roomNotFound = ref(false);

let refreshInterval: NodeJS.Timeout | null = null;
let phaseTransitionTimeout: NodeJS.Timeout | null = null;

onMounted(async () => {
  if (isOfflineMode.value) {
    const savedOfflineSettings = sessionStorage.getItem('offline_game_settings');
    if (savedOfflineSettings) {
      try {
        offlineSettings.value = JSON.parse(savedOfflineSettings);
        sessionStorage.removeItem('offline_game_settings');
      }
      catch {
        navigateTo('/');
      }
    }
    else navigateTo('/');
    return;
  }

  // Try to load from sessionStorage first (for room creator)
  const savedSettings = sessionStorage.getItem(`room_settings_${roomId}`);
  const savedCreatorId = sessionStorage.getItem(`room_creator_${roomId}`);

  if (savedSettings && savedCreatorId) {
    try {
      roomSettings.value = JSON.parse(savedSettings);
      roomCreatorId.value = savedCreatorId;
    }
    catch { /* empty */ }
  }
  else {
    // Load from database (for users joining via link)
    try {
      const response = await $fetch(`/api/rooms/${roomId}`);
      if (response.success) {
        roomSettings.value = response.settings as GameSettings;
        roomCreatorId.value = response.creatorId;
      }
    }
    catch {
      roomNotFound.value = true;
      return;
    }
  }

  game.on('CONNECT', (payload: any) => {
    gameState.setPlayerId(payload.playerId);
    joined.value = true;

    session.createSession(payload.playerId, playerName.value, roomId);

    startCookieRefresh();
  });

  game.on('RECONNECT', (payload: any) => {
    gameState.setPlayerId(payload.playerId);
    joined.value = true;

    session.updateActivity();
    session.updateRoomId(roomId);

    startCookieRefresh();
  });

  game.on('ROOM_UPDATE', (payload: unknown) => {
    const roomUpdate = payload as RoomUpdatePayload;
    if (gameState.phase.value !== 'waiting' && roomUpdate.room.phase === 'waiting') {
      roomUpdate.room.phase = gameState.phase.value;
    }
    gameState.updateRoom(roomUpdate.room);

    session.updateActivity();
  });

  game.on('ROLE_ASSIGNED', (payload: unknown) => {
    const roleData = payload as RoleAssignedPayload;
    gameState.setRole(roleData.role === 'impostor', roleData.word);
  });

  game.on('PHASE_CHANGE', (payload: any) => {
    gameState.updatePhase(payload.phase);

    if (payload.phase === 'role_reveal') {
      game.updatePresenceStatus('playing');
      soundEffects.play('roleReveal');
    }

    if (payload.phase === 'voting') {
      gameState.clearVotes();
      soundEffects.play('callVote');
    }

    // Load chat messages when entering discussion phase
    if (payload.phase === 'discussion') {
      roomChat.loadMessages(roomId);
    }

    if (payload.phase === 'role_reveal' && gameState.isHost.value) {
      if (phaseTransitionTimeout) clearTimeout(phaseTransitionTimeout);

      phaseTransitionTimeout = setTimeout(() => {
        game.transitionPhase('discussion');
      }, ROLE_REVEAL_DURATION);
    }
  });

  game.on('VOTE_UPDATE', (payload: any) => {
    if (payload.votes) {
      Object.entries(payload.votes).forEach(([voterId, targetId]) => {
        gameState.setVote(voterId, targetId as string);
      });
    }
  });

  game.on('VOTE_RESULTS', (_payload: unknown) => {
    gameState.clearVotes();
  });

  game.on('GAME_OVER', (payload: unknown) => {
    const data = payload as Omit<GameOverData, 'players'>;
    gameOverData.value = {
      ...data,
      players: gameState.players.value
    };
    gameState.updatePhase('ended');

    const isImpostor = data.impostorIds.includes(gameState.currentPlayerId.value || '');
    const playerWon = (data.winner === 'players' && !isImpostor)
      || (data.winner === 'impostors' && isImpostor);
    soundEffects.play(playerWon ? 'victory' : 'defeat');

    // Clear chat messages locally when game ends
    roomChat.clearMessages();
  });

  // Listen for chat messages
  game.on('CHAT_MESSAGE', (payload: unknown) => {
    const message = payload as ChatMessage;
    roomChat.addMessage(message);
  });

  game.on('ERROR', (payload: any) => {
    error.value = payload.message || 'Ocurrió un error';
    showNamePrompt.value = true;
    joined.value = false;
  });

  game.on('ROOM_DELETED', (payload: any) => {
    error.value = 'La sala ha sido cerrada porque todos los jugadores se fueron';
    showNamePrompt.value = true;
    joined.value = false;

    // Redirigir después de 3 segundos
    setTimeout(() => {
      navigateTo('/');
    }, 3000);
  });
});

onBeforeUnmount(() => {
  stopCookieRefresh();

  if (phaseTransitionTimeout) clearTimeout(phaseTransitionTimeout);

  game.leaveRoom();
  gameState.reset();
  roomChat.clearMessages();

  session.updateRoomId(undefined);
});

const startCookieRefresh = () => {
  refreshInterval = setInterval(() => {
    if (joined.value && session.isSessionValid()) {
      session.refreshSession();
    }
  }, 2 * 60 * 1000);
};

const stopCookieRefresh = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
};

const joinRoom = async () => {
  const name = playerName.value.trim();

  if (!name) {
    error.value = 'Por favor ingresa tu nombre';
    return;
  }

  if (name.length > 20) {
    error.value = 'El nombre debe tener máximo 20 caracteres';
    return;
  }

  error.value = '';

  const existingSession = session.getSession();

  // Check if this user is the room creator
  const savedCreatorId = sessionStorage.getItem(`room_creator_${roomId}`);
  const isCreator = savedCreatorId && savedCreatorId === roomCreatorId.value;

  // If creator, use creatorId as playerId; otherwise use existing session or generate new
  const playerId = isCreator ? savedCreatorId : existingSession?.playerId;

  await game.joinRoom(
    roomId,
    name,
    playerId || undefined,
    roomSettings.value || undefined,
    roomCreatorId.value || undefined
  );
  showNamePrompt.value = false;
};

const handleCallVote = () => {
  game.callVote();
};

const handleCastVote = (targetId: string | null) => {
  game.castVote(targetId);

  if (gameState.currentPlayerId.value) {
    gameState.setVote(gameState.currentPlayerId.value, targetId || '');
  }
};

const translateStatus = (status: PlayerStatus) => ({
  disconnected: 'Desconectado',
  playing: 'Jugando',
  ready: 'Listo',
  spectating: 'Espectador',
  waiting: 'Esperando'
})[status];

// Show chat only during game phases (discussion, voting, ended)
const showChat = computed(() => {
  const phase = gameState.phase.value;
  return joined.value && !isOfflineMode.value && ['discussion', 'voting', 'ended', 'waiting'].includes(phase);
});

const handleSendMessage = async (content: string) => {
  if (!gameState.currentPlayerId.value) return;

  await roomChat.sendMessage(
    roomId,
    gameState.currentPlayerId.value,
    playerName.value,
    content
  );
};
</script>

<template>
  <UPage>
    <!-- Chat Panel -->
    <GameChatPanel
      v-if="showChat"
      :room-id="roomId"
      :current-player-id="gameState.currentPlayerId.value || ''"
      :current-player-name="playerName"
      :messages="roomChat.messages.value"
      :can-send="roomChat.canSend.value"
      @send-message="handleSendMessage"
    />

    <!-- Offline Mode -->
    <GameOfflineGame
      v-if="isOfflineMode && offlineSettings"
      :settings="offlineSettings"
    />

    <!-- Room Not Found -->
    <div
      v-else-if="roomNotFound"
      class="flex flex-col items-center justify-center mt-4 md:mt-6"
    >
      <ProseH2 class="m-0!">
        Sala no encontrada
      </ProseH2>
      <ProseP class="text-dimmed mb-4 mt-2!">
        La sala {{ roomId }} no existe o ha expirado.
      </ProseP>
      <UButton
        variant="outline"
        @click="navigateTo('/')"
      >
        Volver al inicio
      </UButton>
    </div>

    <!-- Online Mode -->
    <template v-else>
      <!-- Name Prompt -->
      <div
        v-if="showNamePrompt"
        class="flex flex-col items-center justify-center mt-4 md:mt-6"
      >
        <ProseH2 class="m-0!">
          Ingresa tu nombre
        </ProseH2>

        <ProseP class="text-dimmed mb-4 mt-0!">
          Codigo de sala: <span class="font-mono font-bold text-muted hover:decoration-info underline decoration-transparent decoration-2 underline-offset-2 transition-all ease-in-out">{{ roomId }}</span>
        </ProseP>

        <form
          class="flex items-center gap-2"
          @submit.prevent="joinRoom"
        >
          <UInput
            v-model="playerName"
            type="text"
            placeholder="Tu nombre"
            :maxlength="20"
            :error="!!error"
            autofocus
          />

          <UButton
            type="submit"
            variant="outline"
            :disabled="!playerName.trim()"
          >
            Entrar
          </UButton>
        </form>

        <ProseP
          v-if="error"
          class="text-red-500 text-sm mt-2"
        >
          {{ error }}
        </ProseP>
      </div>

      <!-- Game Room -->
      <div
        v-else-if="joined"
        class="mt-4 md:mt-6"
      >
        <!-- Waiting Lobby -->
        <div v-if="gameState.phase.value === 'waiting'">
          <div class="max-w-4xl mx-auto">
            <div class="border border-default rounded-lg p-2 mb-4">
              <div class="flex md:flex-row flex-col justify-between">
                <div class="flex items-center">
                  <ProseH4 class="my-0 mr-2 pr-2 border-r border-default">
                    <span class="text-toned font-semibold">Sala:</span> {{ roomId }}
                  </ProseH4>
                  <ProseP class="my-0">
                    {{ gameState.players.value.length }} / {{ gameState.settings.value?.maxPlayers }} jugadores
                  </ProseP>
                </div>
                <UBadge
                  color="warning"
                  class="w-fit"
                >
                  Esperando
                </UBadge>
              </div>
            </div>

            <div class="border border-default rounded-lg p-2 pt-1 md:pt-6 md:p-6">
              <ProseH2 class="mb-2 mt-0">
                Esperando
              </ProseH2>

              <div class="space-y-4">
                <div>
                  <ProseH4 class="font-semibold text-toned mb-2 mt-0!">
                    Jugadores:
                  </ProseH4>
                  <div class="space-y-2">
                    <div
                      v-for="player in gameState.players.value"
                      :key="player.id"
                      class="flex items-center justify-between rounded-md border border-default w-full p-1"
                    >
                      <ProseP class="font-medium my-0 flex gap-2 items-center ml-1">
                        {{ player.name }}
                        <UBadge
                          v-if="player.isHost"
                          size="sm"
                          variant="soft"
                          color="success"
                        >
                          (Host)
                        </UBadge>
                        <UBadge
                          v-if="player.id === gameState.currentPlayerId.value"
                          size="sm"
                          variant="soft"
                          color="info"
                        >
                          (Tú)
                        </UBadge>
                      </ProseP>
                      <UBadge
                        variant="soft"
                        :color="player.status === 'ready' ? 'success' : 'info'"
                      >
                        {{ translateStatus(player.status) }}
                      </UBadge>
                    </div>
                  </div>
                </div>

                <div class="flex gap-2">
                  <UButton
                    v-if="!gameState.isReady.value && !gameState.isHost.value"
                    @click="game.markReady()"
                  >
                    Listo
                  </UButton>

                  <UButton
                    v-if="gameState.isHost.value"
                    :disabled="!gameState.canStartGame.value"
                    color="neutral"
                    @click="game.startGame()"
                  >
                    Iniciar Juego
                  </UButton>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Role Reveal -->
        <GameRoleReveal
          v-else-if="gameState.phase.value === 'role_reveal'"
          :is-impostor="gameState.isImpostor.value"
          :secret-word="gameState.secretWord.value"
        />

        <!-- Discussion Phase -->
        <div
          v-else-if="gameState.phase.value === 'discussion'"
          class="rounded-lg p-6"
        >
          <GameDiscussion
            :players="gameState.players.value"
            :secret-word="gameState.secretWord.value"
            :is-impostor="gameState.isImpostor.value"
            :time-limit="gameState.settings.value?.timeLimit || 600"
            :time-started="gameState.currentRoom.value?.timeStarted || Date.now()"
            :current-player-id="gameState.currentPlayerId.value || ''"
            @call-vote="handleCallVote"
          />
        </div>

        <!-- Voting Phase -->
        <div
          v-else-if="gameState.phase.value === 'voting'"
          class="rounded-lg p-6"
        >
          <GameVoting
            :players="gameState.players.value"
            :current-player-id="gameState.currentPlayerId.value || ''"
            :has-voted="!!gameState.myVote.value"
            :all-votes="gameState.votes.value"
            @cast-vote="handleCastVote"
          />
        </div>

        <!-- Game Over -->
        <GameResults
          v-else-if="gameState.phase.value === 'ended' && gameOverData"
          :game-over-data="gameOverData"
          :current-player-id="gameState.currentPlayerId.value || ''"
        />
      </div>

      <!-- Loading/Connecting -->
      <div
        v-else
        class="mt-4 md:mt-6 text-center"
      >
        <Icon
          name="lucide:loader-circle"
          class="animate-spin text-6xl"
        />
        <ProseP class="text-dimmed mt-0!">
          Conectando...
        </ProseP>
      </div>
    </template>
  </UPage>
</template>
