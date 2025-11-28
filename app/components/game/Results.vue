<script setup lang="ts">
import type { GameOverData } from '~/types/game'

const props = defineProps<{
  gameOverData: GameOverData
  currentPlayerId: string
}>()

const isWinner = computed(() => {
  const isImpostor = props.gameOverData.impostorIds.includes(props.currentPlayerId)
  return (props.gameOverData.winner === 'impostors' && isImpostor) ||
         (props.gameOverData.winner === 'players' && !isImpostor)
})

const goHome = () => {
  navigateTo('/')
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="max-w-2xl w-full">
      <div
        :class="[
          'text-center p-8 rounded-lg mb-6',
          gameOverData.winner === 'players'
            ? 'bg-success/70 border-2 border-success'
            : 'bg-error/70 border-2 border-error'
        ]"
      >
        <div class="text-4xl md:text-6xl mb-4">
          {{ isWinner ? '🎉' : '😔' }}
        </div>

        <ProseH1 class="font-bold text-highlighted mb-2">
          {{ gameOverData.winner === 'players' ? 'Ganaron los jugadores!' : 'Ganaron los impostores!' }}
        </ProseH1>

        <ProseH4 class="text-highlighted font-normal my-0">
          {{ isWinner ? 'Felicitaciones!' : 'Mas suerte la proxima!' }}
        </ProseH4>
      </div>

      <!-- Secret Word Reveal -->
      <div class="border border-default rounded-lg p-6 mb-6">
        <ProseH4 class="font-semibold mb-0 text-center text-highlight mt-0">
          La palabra secreta era:
        </ProseH4>
        <ProseH2 class="text-center text-info bg-info/20 py-4 rounded-lg mt-4 mb-0">
          {{ gameOverData.secretWord }}
        </ProseH2>
      </div>

      <!-- Player Roles -->
      <div class="border border-default rounded-lg p-6 mb-6">
        <ProseH4 class="font-semibold mb-4 text-highlight mt-0">Roles de los jugadores:</ProseH4>

        <div class="space-y-2">
          <div
            v-for="player in gameOverData.players"
            :key="player.id"
            :class="[
              'p-4 rounded-lg flex items-center justify-between',
              gameOverData.impostorIds.includes(player.id)
                ? 'bg-error/50 border-2 border-error'
                : 'bg-info/50 border-2 border-info'
            ]"
          >
            <span class="font-medium text-highlighted">
              {{ player.name }}
              <UBadge v-if="player.id === currentPlayerId" variant="soft" color="info">(Vos)</UBadge>
            </span>

            <span
              :class="[
                'px-3 py-1 rounded-lg text-sm font-semibold',
                gameOverData.impostorIds.includes(player.id)
                  ? 'bg-error/70 border border-error/70'
                  : 'bg-info/70 border border-info/70'
              ]"
            >
              {{ gameOverData.impostorIds.includes(player.id) ? '🔴 Impostor' : '👤 Jugador' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex gap-4">
        <UButton
          @click="goHome"
          class="flex mx-auto w-fit"
          size="xl"
        >
          🏠 Volver al inicio
        </UButton>
      </div>
    </div>
  </div>
</template>
