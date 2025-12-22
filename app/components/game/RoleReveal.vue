<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { ROLE_REVEAL_DURATION } from '~/utils/constants';

const props = defineProps<{
  isImpostor: boolean;
  secretWord: string | null;
  secretCategory?: string | null;
  showCategoryToImpostor?: boolean;
}>();

const countdown = ref(ROLE_REVEAL_DURATION / 1000);
const maxCountdown = ROLE_REVEAL_DURATION / 1000;
let interval: NodeJS.Timeout | null = null;

const shouldShowCategory = computed(() => {
  if (!props.secretCategory) return false;
  if (props.isImpostor) return props.showCategoryToImpostor ?? false;
  return true;
});

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
  <div class="fixed inset-0 flex items-center justify-center transition-colors duration-500 bg-default">
    <div class="text-center p-8">
      <!-- Category (shown based on settings) -->
      <div
        v-if="shouldShowCategory"
        class="text-lg text-dimmed mb-2 uppercase tracking-wider"
      >
        {{ props.secretCategory }}
      </div>

      <!-- Role Title with subtle color -->
      <div class="mb-8">
        <h1
          :class="[
            'text-6xl font-bold mb-4',
            props.isImpostor ? 'text-red-500' : 'text-blue-500'
          ]"
        >
          {{ props.isImpostor ? 'IMPOSTOR' : 'JUGADOR' }}
        </h1>

        <div class="text-2xl font-medium text-highlighted">
          {{ props.isImpostor ? 'Descubri la palabra secreta!' : 'Descubri al impostor!' }}
        </div>
      </div>

      <!-- Secret Word (only for regular players) -->
      <div
        v-if="!props.isImpostor && props.secretWord"
        class="mb-8"
      >
        <div class="text-xl text-dimmed mb-2">
          Tu palabra secreta es:
        </div>
        <div class="text-5xl font-bold text-highlighted bg-neutral-200 dark:bg-neutral-800 px-8 py-4 rounded-lg">
          {{ props.secretWord }}
        </div>
        <div class="mt-4 text-lg text-dimmed">
          Recordala! Todos los demas tienen la misma palabra (Excepto los impostores)
        </div>
      </div>

      <!-- Impostor Instructions -->
      <div
        v-if="props.isImpostor"
        class="mb-8"
      >
        <div class="text-xl text-dimmed max-w-md mx-auto">
          No sabes la palabra secreta. Mezclate en la discusion y intenta descubrirla sin ser descubierto!
        </div>
      </div>

      <!-- Countdown -->
      <div class="mt-8">
        <div class="text-4xl font-bold text-highlighted">
          Comenzando en {{ countdown }}s
        </div>

        <!-- Progress bar with subtle colors -->
        <div class="w-64 h-2 mx-auto mt-4 rounded-full overflow-hidden bg-neutral-300 dark:bg-neutral-700">
          <div
            :class="[
              'h-full transition-all duration-1000',
              props.isImpostor ? 'bg-red-500' : 'bg-blue-500'
            ]"
            :style="{ width: `${(countdown / maxCountdown) * 100}%` }"
          />
        </div>
      </div>
    </div>
  </div>
</template>
