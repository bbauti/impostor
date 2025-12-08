<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { ROLE_REVEAL_DURATION } from '~/utils/constants';

const props = defineProps<{
  isImpostor: boolean;
  secretWord: string | null;
}>();

const countdown = ref(ROLE_REVEAL_DURATION / 1000);
const maxCountdown = ROLE_REVEAL_DURATION / 1000;
let interval: NodeJS.Timeout | null = null;

onMounted(() => {
  interval = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      if (interval) clearInterval(interval);
    }
  }, 1000);
});

onUnmounted(() => {
  if (interval) {
    clearInterval(interval);
  }
});
</script>

<template>
  <div
    :class="[
      'fixed inset-0 flex items-center justify-center transition-colors duration-500',
      props.isImpostor ? 'bg-error/70 border-2 border-error' : 'bg-success/70 border-2 border-success'
    ]"
  >
    <div class="text-center p-8">
      <!-- Role Title -->
      <div class="mb-8">
        <h1 class="text-6xl font-bold mb-4 text-highlighted">
          {{ props.isImpostor ? '🔴 IMPOSTOR' : '👤 JUGADOR' }}
        </h1>

        <div
          class="text-2xl font-medium text-highlighted"
        >
          {{ props.isImpostor ? 'Descubrí la palabra secreta!' : 'Descubrí al impostor!' }}
        </div>
      </div>

      <!-- Secret Word (only for regular players) -->
      <div
        v-if="!props.isImpostor && props.secretWord"
        class="mb-8"
      >
        <div class="text-xl text-highlighted mb-2">
          Tu palabra secreta es:
        </div>
        <div class="text-5xl font-bold text-highlighted bg-inverted/20 px-8 py-4 rounded-lg backdrop-blur-sm">
          {{ props.secretWord }}
        </div>
        <div class="mt-4 text-lg text-highlighted">
          Recordala! Todos los demás tienen la misma palabra (Excepto los impostores)
        </div>
      </div>

      <!-- Impostor Instructions -->
      <div
        v-if="props.isImpostor"
        class="mb-8"
      >
        <div class="text-xl text-highlighted max-w-md mx-auto">
          No sabes la palabra secreta. Mezclate en la discusión y intenta descubrirla sin ser descubierto!
        </div>
      </div>

      <!-- Countdown -->
      <div class="mt-8">
        <div class="text-4xl font-bold text-highlighted">
          Comenzando en {{ countdown }}s
        </div>

        <!-- Progress bar -->
        <div
          :class="[
            'w-64 h-2 mx-auto mt-4 rounded-full overflow-hidden',
            props.isImpostor ? 'bg-error' : 'bg-success'
          ]"
        >
          <div
            :class="[
              'h-full transition-all duration-1000',
              props.isImpostor ? 'bg-error/50' : 'bg-success/50'
            ]"
            :style="{ width: `${(countdown / maxCountdown) * 100}%` }"
          />
        </div>
      </div>
    </div>
  </div>
</template>
