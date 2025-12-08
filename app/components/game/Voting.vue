<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Player } from '~/types/game';

const soundEffects = useSoundEffects();

const props = defineProps<{
  players: Player[];
  currentPlayerId: string;
  hasVoted: boolean;
  allVotes: Record<string, string>;
}>();

const emit = defineEmits<{
  castVote: [targetId: string | null];
}>();

const selectedTarget = ref<string | null>(null);
const showConfirmation = ref(false);

const activePlayers = computed(() =>
  props.players.filter(p => p.status === 'playing' && p.id !== props.currentPlayerId)
);

// Calculate who has voted
const playersWhoVoted = computed(() => {
  return Object.keys(props.allVotes);
});

const playersWhoHaventVoted = computed(() => {
  return props.players
    .filter(p => p.status === 'playing')
    .filter(p => !playersWhoVoted.value.includes(p.id));
});

// Check if all players have voted (processing votes)
const allPlayersVoted = computed(() => {
  const totalPlayers = props.players.filter(p => p.status === 'playing').length;
  return playersWhoVoted.value.length === totalPlayers && totalPlayers > 0;
});

const selectPlayer = (playerId: string) => {
  selectedTarget.value = playerId;
  showConfirmation.value = true;
};

const selectSkip = () => {
  selectedTarget.value = null;
  showConfirmation.value = true;
};

const confirmVote = () => {
  soundEffects.play('voteCast');
  emit('castVote', selectedTarget.value);
  showConfirmation.value = false;
};

const cancelVote = () => {
  selectedTarget.value = null;
  showConfirmation.value = false;
};

const getPlayerName = (playerId: string) => {
  return props.players.find(p => p.id === playerId)?.name || 'Unknown';
};

const getVoteTargetName = (targetId: string) => {
  if (!targetId) return 'Saltear';
  return getPlayerName(targetId);
};
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col">
      <ProseH2 class="my-0">
        Fase de votación
      </ProseH2>
      <ProseP class="my-0">
        Quien sera el impostor?
      </ProseP>
    </div>

    <!-- Processing Votes Loader -->
    <div
      v-if="allPlayersVoted"
      class="flex flex-col items-center justify-center py-12"
    >
      <Icon
        name="lucide:loader-circle"
        class="animate-spin text-6xl mb-4"
      />
      <ProseH3 class="my-0">
        Procesando votos...
      </ProseH3>
      <ProseP class="text-dimmed mt-2">
        Calculando resultados
      </ProseP>
    </div>

    <template v-else>
      <!-- Public Votes Display -->
      <div class="border border-default rounded-lg p-4 space-y-3">
        <ProseH4 class="my-0 text-sm font-semibold text-toned">
          Votos ({{ playersWhoVoted.length }} / {{ players.filter(p => p.status === 'playing').length }})
        </ProseH4>

        <!-- Players who voted -->
        <div
          v-if="playersWhoVoted.length > 0"
          class="space-y-2"
        >
          <div
            v-for="voterId in playersWhoVoted"
            :key="voterId"
            class="flex items-center justify-between p-2 bg-success/20 border border-success/30 rounded"
          >
            <span class="font-medium text-sm">
              {{ getPlayerName(voterId) }}
            </span>
            <span class="text-sm flex items-center gap-2">
              <span class="text-toned">→</span>
              <span class="font-semibold">{{ getVoteTargetName(allVotes[voterId]) }}</span>
            </span>
          </div>
        </div>

        <!-- Players who haven't voted -->
        <div
          v-if="playersWhoHaventVoted.length > 0"
          class="space-y-2"
        >
          <div
            v-for="player in playersWhoHaventVoted"
            :key="player.id"
            class="flex items-center justify-between p-2 bg-inverted/10 border border-inverted/20 rounded"
          >
            <span class="font-medium text-sm text-toned">
              {{ player.name }}
            </span>
            <span class="text-xs text-toned">Esperando...</span>
          </div>
        </div>
      </div>

      <!-- Voted Status -->
      <div
        v-if="hasVoted"
        class="p-6 bg-success/50 border border-success rounded-lg text-center"
      >
        <div class="text-2xl mb-2">
          ✅
        </div>
        <div class="font-semibold">
          Has votado!
        </div>
        <div class="text-sm mt-1">
          Esperando a los otros jugadores...
        </div>
      </div>

      <!-- Voting Interface -->
      <div
        v-else-if="!showConfirmation"
        class="space-y-4"
      >
        <div class="p-4 bg-warning/50 border border-warning rounded-lg">
          <p class="text-sm text-highlighted">
            Pensa tu voto! Una vez votas, no podes cambiarlo.
          </p>
        </div>

        <!-- Player Cards -->
        <div class="grid grid-cols-2 gap-3">
          <UButton
            v-for="player in activePlayers"
            :key="player.id"
            color="neutral"
            variant="subtle"
            class="hover:border-error/20 hover:bg-error/50 transition-all font-medium text-lg"
            @click="selectPlayer(player.id)"
          >
            <span class="text-highlighted">{{ player.name }}</span>
          </UButton>
        </div>

        <!-- Skip Button -->
        <button
          class="w-full p-4 bg-inverted/50 border border-inverted/50 rounded-lg hover:border-inverted/70 hover:bg-inverted/70 transition-all font-medium hover:text-highlighted text-inverted"
          @click="selectSkip"
        >
          ⏭️ Saltear voto
        </button>
      </div>

      <!-- Confirmation Dialog -->
      <div
        v-else
        class="space-y-4"
      >
        <div class="p-6 bg-warning/50 border border-warning rounded-lg text-center">
          <ProseH2 class="font-semibold text-highlighted mt-0 mb-2">
            Confirma el voto
          </ProseH2>
          <ProseP class="text-lg text-highlighted my-0">
            <span v-if="selectedTarget">
              Votar para eliminar: <span class="font-bold">{{ getPlayerName(selectedTarget) }}</span>
            </span>
            <span v-else>
              Saltear esta ronda
            </span>
          </ProseP>
        </div>

        <div class="flex gap-3">
          <UButton
            size="xl"
            color="neutral"
            class="w-full justify-center"
            @click="cancelVote"
          >
            Cancelar
          </UButton>
          <UButton
            size="xl"
            color="error"
            class="w-full justify-center"
            @click="confirmVote"
          >
            Confirmar voto
          </UButton>
        </div>
      </div>
    </template>
  </div>
</template>
