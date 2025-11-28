<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { formatTime } from '~/utils/game-logic'
import type { Player } from '~/types/game'

const props = defineProps<{
  players: Player[]
  secretWord: string | null
  isImpostor: boolean
  timeLimit: number
  timeStarted: number
  currentPlayerId: string
}>()

const emit = defineEmits<{
  callVote: []
}>()

const timeRemaining = ref(props.timeLimit)
let timerInterval: NodeJS.Timeout | null = null

const activePlayers = computed(() =>
  props.players.filter(p => p.status === 'playing')
)

const spectators = computed(() =>
  props.players.filter(p => p.status === 'spectating')
)

const formattedTime = computed(() => formatTime(timeRemaining.value))

const updateTimer = () => {
  if (!props.timeStarted) return

  const elapsed = Math.floor((Date.now() - props.timeStarted) / 1000)
  const remaining = props.timeLimit - elapsed

  timeRemaining.value = Math.max(0, remaining)

  if (timeRemaining.value === 0) {
    if (timerInterval) {
      clearInterval(timerInterval)
    }
  }
}

onMounted(() => {
  updateTimer()
  timerInterval = setInterval(updateTimer, 1000)
})

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval)
  }
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header with Timer -->
    <div class="flex items-center justify-between">
      <ProseH2 class="my-0">Fase de discusión</ProseH2>
      <UBadge
        :color="timeRemaining < 60 ? 'error' : 'info'"
        size="xl"
      >
        ⏱️ {{ formattedTime }}
      </UBadge>
    </div>

    <!-- Secret Word Display -->
    <div
      v-if="!isImpostor && secretWord"
      class="p-4 border-2 bg-primary/20 border-primary/50 rounded-lg text-center"
    >
      <div class="text-sm mb-1">Tu palabra secreta:</div>
      <div class="text-3xl font-bold">{{ secretWord }}</div>
    </div>

    <div
      v-else-if="isImpostor"
      class="p-4 bg-red-50 border-2 border-red-200 rounded-lg text-center"
    >
      <ProseP class="my-0 text-error mb-1">Sos <span class="font-bold">IMPOSTOR</span></ProseP>
      <ProseP class="text-sm my-0 text-error">Descubrí la palabra correcta!</ProseP>
    </div>

    <!-- Instructions -->
    <div class="p-4 bg-inverted text-inverted rounded-lg">
      <h3 class="font-semibold mb-2">💬 Discutan:</h3>
      <ul class="text-sm space-y-1">
        <li>• Hablen sobre la palabra secreta sin decirla directamente</li>
        <li>• Presta atencion a quien no este seguro</li>
        <li>• Cuando estés listo, cualquiera puede solicitar votar</li>
      </ul>
    </div>

    <!-- Active Players -->
    <div>
      <h3 class="font-semibold mb-3">Jugadores activos ({{ activePlayers.length }}):</h3>
      <div class="grid grid-cols-2 gap-2">
        <div
          v-for="player in activePlayers"
          :key="player.id"
          :class="[
            'p-3 rounded-lg border-2',
            player.id === currentPlayerId
              ? 'border-success'
              : 'border-default'
          ]"
        >
          <ProseP class="my-0">{{ player.name }}</ProseP>
          <UBadge v-if="player.id === currentPlayerId" variant="soft" color="success">
            (Vos)
          </UBadge>
        </div>
      </div>
    </div>

    <!-- Spectators -->
    <div v-if="spectators.length > 0" class="opacity-60">
      <ProseH2 class="font-semibold mb-2 text-sm">👻 Espectadores:</ProseH2>
      <div class="flex flex-wrap gap-2">
        <div
          v-for="player in spectators"
          :key="player.id"
          class="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600"
        >
          {{ player.name }}
        </div>
      </div>
    </div>

    <!-- Call Vote Button -->
    <UButton
      @click="emit('callVote')"
      class="flex mx-auto w-fit"
      size="xl"
    >
      🗳️ Llamar a voto
    </UButton>
  </div>
</template>
