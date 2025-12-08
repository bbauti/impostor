<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import type { OfflineSettings } from '~/composables/useOfflineGame'

const props = defineProps<{
  settings: OfflineSettings
}>()

const offlineGame = useOfflineGame()

onMounted(() => {
  offlineGame.initGame(props.settings)
})

onUnmounted(() => {
  offlineGame.cleanup()
})

const handleTap = () => {
  if (offlineGame.phase.value === 'role_reveal') {
    if (!offlineGame.showingRole.value) {
      offlineGame.revealRole()
    } else {
      offlineGame.nextPlayer()
    }
  }
}

const handleFinish = () => {
  offlineGame.endGame()
}

const goHome = () => {
  navigateTo('/')
}
</script>

<template>
  <!-- Fase: Revelación de Roles -->
  <div
    v-if="offlineGame.phase.value === 'role_reveal'"
    class="fixed inset-0 flex items-center justify-center cursor-pointer select-none"
    :class="[
      offlineGame.showingRole.value && offlineGame.currentPlayer.value?.isImpostor
        ? 'bg-error/70'
        : offlineGame.showingRole.value
          ? 'bg-success/70'
          : 'bg-default'
    ]"
    @click="handleTap"
  >
    <div class="text-center p-8">
      <!-- Estado: Esperando toque -->
      <template v-if="!offlineGame.showingRole.value">
        <h1 class="text-5xl md:text-7xl font-bold mb-6 text-highlighted">
          Jugador {{ offlineGame.currentPlayerIndex.value }}
        </h1>
        <p class="text-2xl md:text-3xl text-highlighted animate-pulse">
          Toca para ver tu rol
        </p>
      </template>

      <!-- Estado: Mostrando rol -->
      <template v-else>
        <h1 class="text-5xl md:text-7xl font-bold mb-6 text-highlighted">
          {{ offlineGame.currentPlayer.value?.isImpostor ? 'IMPOSTOR' : 'JUGADOR' }}
        </h1>

        <!-- Palabra secreta (solo para jugadores normales) -->
        <div v-if="!offlineGame.currentPlayer.value?.isImpostor" class="mb-8">
          <p class="text-xl text-highlighted mb-2">Tu palabra secreta es:</p>
          <div class="text-4xl md:text-5xl font-bold text-highlighted bg-inverted/20 px-8 py-4 rounded-lg">
            {{ offlineGame.secretWord.value }}
          </div>
        </div>

        <!-- Instrucciones para impostor -->
        <div v-else class="mb-8">
          <p class="text-xl text-highlighted max-w-md mx-auto">
            No sabes la palabra secreta. Intenta descubrirla sin ser descubierto!
          </p>
        </div>

        <p class="text-xl text-highlighted animate-pulse mt-8">
          {{ offlineGame.isLastPlayer.value ? 'Toca para iniciar el juego' : 'Toca para pasar al siguiente jugador' }}
        </p>
      </template>
    </div>
  </div>

  <!-- Fase: Timer/Discusión -->
  <div
    v-else-if="offlineGame.phase.value === 'timer'"
    class="fixed inset-0 flex flex-col items-center justify-center bg-default"
  >
    <div class="text-center p-8">
      <h1 class="text-4xl md:text-6xl font-bold mb-8 text-highlighted">
        Discusión
      </h1>

      <div
        class="text-7xl md:text-9xl font-mono font-bold mb-8"
        :class="offlineGame.timeRemaining.value <= 30 ? 'text-error animate-pulse' : 'text-highlighted'"
      >
        {{ offlineGame.formattedTimeRemaining.value }}
      </div>

      <!-- Tiempo terminado -->
      <template v-if="offlineGame.timeRemaining.value === 0">
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

  <!-- Fase: Terminado -->
  <div
    v-else-if="offlineGame.phase.value === 'ended'"
    class="fixed inset-0 flex flex-col items-center justify-center bg-error/70"
  >
    <div class="text-center p-8">
      <h1 class="text-4xl md:text-6xl font-bold mb-4 text-highlighted">
        Ganaron los Impostores!
      </h1>

      <div class="border border-default rounded-lg p-6 mb-8 bg-default/50">
        <p class="text-lg text-highlighted mb-2">La palabra secreta era:</p>
        <p class="text-4xl font-bold text-highlighted">
          {{ offlineGame.secretWord.value }}
        </p>
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
