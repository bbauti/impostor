<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue';
import type { OfflineSettings } from '~/composables/useOfflineGame';

const props = defineProps<{
  settings: OfflineSettings;
}>();

const offlineGame = useOfflineGame();
const soundEffects = useSoundEffects();
const lastTickedSecond = ref(-1);

onMounted(() => {
  offlineGame.initGame(props.settings);
});

onUnmounted(() => {
  offlineGame.cleanup();
});

const handlePlayerClick = (playerIndex: number) => {
  offlineGame.selectPlayer(playerIndex);
  soundEffects.play('roleReveal');
};

const handleHideRole = () => {
  offlineGame.hideRole();
};

const handleStartGame = () => {
  offlineGame.startTimer();
};

watch(() => offlineGame.timeRemaining.value, (newVal) => {
  if (newVal <= 10 && newVal > 0 && newVal !== lastTickedSecond.value) {
    soundEffects.play('countdownTick');
    lastTickedSecond.value = newVal;
  }
});

const handleFinish = () => {
  offlineGame.endGame();
};

const goHome = () => {
  navigateTo('/');
};
</script>

<template>
  <!-- Phase: Player Names Input -->
  <div
    v-if="offlineGame.phase.value === 'player_names'"
    class="fixed inset-0 flex items-center justify-center bg-default overflow-auto"
  >
    <div class="text-center p-8 max-w-md w-full">
      <h1 class="text-3xl md:text-4xl font-bold mb-4 text-highlighted">
        Nombres de Jugadores
      </h1>
      <p class="text-lg text-dimmed mb-6">
        Opcional: ingresa los nombres o usa los predeterminados
      </p>

      <div class="space-y-3 mb-6">
        <div
          v-for="(_, index) in offlineGame.playerNamesInput.value"
          :key="index"
          class="flex items-center gap-2"
        >
          <span class="text-dimmed w-8 text-right">{{ index + 1 }}.</span>
          <UInput
            v-model="offlineGame.playerNamesInput.value[index]"
            :placeholder="`Jugador ${index + 1}`"
            class="flex-1"
          />
        </div>
      </div>

      <div class="flex gap-3 justify-center">
        <UButton
          size="lg"
          variant="outline"
          @click="offlineGame.skipNamesAndStart()"
        >
          Omitir
        </UButton>
        <UButton
          size="lg"
          color="primary"
          @click="offlineGame.confirmNamesAndStart()"
        >
          Confirmar
        </UButton>
      </div>
    </div>
  </div>

  <!-- Phase: Role Reveal (List-based) -->
  <div
    v-else-if="offlineGame.phase.value === 'role_reveal'"
    class="fixed inset-0 flex items-center justify-center bg-default overflow-auto"
  >
    <!-- Showing a specific player's role -->
    <div
      v-if="offlineGame.showingRole.value && offlineGame.currentPlayer.value"
      class="text-center p-8 cursor-pointer select-none"
      @click="handleHideRole"
    >
      <!-- Category (shown to all players, or only non-impostors based on setting) -->
      <div
        v-if="!offlineGame.currentPlayer.value.isImpostor || offlineGame.showCategoryToImpostor.value"
        class="text-lg text-dimmed mb-2 uppercase tracking-wider"
      >
        {{ offlineGame.secretCategory.value }}
      </div>

      <!-- Role indicator with subtle colors -->
      <h1
        :class="[
          'text-5xl md:text-7xl font-bold mb-6',
          offlineGame.currentPlayer.value.isImpostor ? 'text-red-500' : 'text-blue-500'
        ]"
      >
        {{ offlineGame.currentPlayer.value.isImpostor ? 'IMPOSTOR' : 'JUGADOR' }}
      </h1>

      <!-- Player name -->
      <p class="text-2xl text-highlighted mb-4">
        {{ offlineGame.currentPlayer.value.name }}
      </p>

      <!-- Secret word (only for regular players) -->
      <div
        v-if="!offlineGame.currentPlayer.value.isImpostor"
        class="mb-8"
      >
        <p class="text-xl text-dimmed mb-2">
          Tu palabra secreta es:
        </p>
        <div class="text-4xl md:text-5xl font-bold text-highlighted bg-neutral-200 dark:bg-neutral-800 px-8 py-4 rounded-lg">
          {{ offlineGame.secretWord.value }}
        </div>
      </div>

      <!-- Impostor instructions -->
      <div
        v-else
        class="mb-8"
      >
        <p class="text-xl text-dimmed max-w-md mx-auto">
          No sabes la palabra secreta. Intenta descubrirla sin ser descubierto!
        </p>
      </div>

      <p class="text-lg text-dimmed animate-pulse mt-8">
        Toca para ocultar y volver
      </p>
    </div>

    <!-- Player list for role reveal -->
    <div
      v-else
      class="text-center p-8 max-w-md w-full"
    >
      <h1 class="text-3xl md:text-4xl font-bold mb-2 text-highlighted">
        Ver Roles
      </h1>
      <p class="text-lg text-dimmed mb-6">
        Cada jugador debe tocar su nombre para ver su rol
      </p>

      <div class="space-y-3 mb-6">
        <button
          v-for="player in offlineGame.players.value"
          :key="player.index"
          :disabled="player.hasSeenRole"
          :class="[
            'w-full p-4 rounded-lg border-2 transition-all text-left flex items-center justify-between',
            player.hasSeenRole
              ? 'border-success/50 bg-success/10 cursor-not-allowed opacity-60'
              : 'border-default hover:border-primary hover:bg-primary/5 cursor-pointer'
          ]"
          @click="handlePlayerClick(player.index)"
        >
          <span class="font-medium text-lg">{{ player.name }}</span>
          <span v-if="player.hasSeenRole" class="text-success text-sm">
            Visto
          </span>
          <span v-else class="text-dimmed text-sm">
            Toca para ver
          </span>
        </button>
      </div>

      <!-- Start game button (only when all have seen their roles) -->
      <UButton
        v-if="offlineGame.allPlayersHaveSeenRole.value"
        size="xl"
        color="primary"
        class="w-full"
        @click="handleStartGame"
      >
        Iniciar Juego
      </UButton>

      <p
        v-else
        class="text-sm text-dimmed mt-4"
      >
        {{ offlineGame.players.value.filter(p => p.hasSeenRole).length }} / {{ offlineGame.players.value.length }} jugadores han visto su rol
      </p>
    </div>
  </div>

  <!-- Phase: Timer/Discussion -->
  <div
    v-else-if="offlineGame.phase.value === 'timer'"
    class="fixed inset-0 flex flex-col items-center justify-center bg-default"
  >
    <div class="text-center p-8">
      <h1 class="text-4xl md:text-6xl font-bold mb-8 text-highlighted">
        Discusion
      </h1>

      <div
        class="text-7xl md:text-9xl font-mono font-bold mb-8"
        :class="offlineGame.timeRemaining.value <= 30 ? 'text-error animate-pulse' : 'text-highlighted'"
      >
        {{ offlineGame.formattedTimeRemaining.value }}
      </div>

      <!-- Time remaining -->
      <template v-if="offlineGame.timeRemaining.value > 0">
        <UButton
          size="xl"
          variant="outline"
          @click="goHome"
        >
          Finalizar
        </UButton>
      </template>

      <!-- Time ended -->
      <template v-else>
        <div class="mb-8">
          <h2 class="text-3xl md:text-4xl font-bold text-error mb-4">
            Tiempo terminado!
          </h2>
          <p class="text-xl text-highlighted">
            Ganaron los Impostores
          </p>
        </div>

        <UButton
          size="xl"
          color="primary"
          @click="handleFinish"
        >
          Finalizar
        </UButton>
      </template>
    </div>
  </div>

  <!-- Phase: Ended -->
  <div
    v-else-if="offlineGame.phase.value === 'ended'"
    class="fixed inset-0 flex flex-col items-center justify-center bg-default"
  >
    <div class="text-center p-8">
      <h1 class="text-4xl md:text-6xl font-bold mb-4 text-red-500">
        Ganaron los Impostores!
      </h1>

      <div class="border border-default rounded-lg p-6 mb-8 bg-neutral-100 dark:bg-neutral-800">
        <p class="text-lg text-dimmed mb-2">
          La palabra secreta era:
        </p>
        <p class="text-sm text-dimmed uppercase tracking-wider mb-1">
          {{ offlineGame.secretCategory.value }}
        </p>
        <p class="text-4xl font-bold text-highlighted">
          {{ offlineGame.secretWord.value }}
        </p>
      </div>

      <div class="mb-6">
        <p class="text-lg text-dimmed mb-2">Impostores:</p>
        <div class="flex flex-wrap gap-2 justify-center">
          <UBadge
            v-for="player in offlineGame.players.value.filter(p => p.isImpostor)"
            :key="player.index"
            color="error"
            size="lg"
          >
            {{ player.name }}
          </UBadge>
        </div>
      </div>

      <UButton
        size="xl"
        color="neutral"
        @click="goHome"
      >
        Volver al inicio
      </UButton>
    </div>
  </div>
</template>
