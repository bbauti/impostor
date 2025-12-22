<script setup lang="ts">
import * as z from 'zod';
import { useOnline } from '@vueuse/core';
import { categories } from '~/data/words';
import { MIN_PLAYERS, MAX_PLAYERS, MIN_IMPOSTORS, MAX_IMPOSTORS, DEFAULT_TIME_LIMIT } from '~/utils/constants';
import type { GameSettings } from '~/types/game';

const isOnline = useOnline();

const schema = z.object({
  words: z.array(z.string(), { error: 'Debes seleccionar al menos un conjunto' }).min(1, 'Debes seleccionar al menos un conjunto'),
  players: z.number({ error: 'La cantidad de jugadores es requerida' }).min(3, 'Se necesitan al menos 3 jugadores'),
  spies: z.number({ error: 'La cantidad de espías es requerida' }).min(1, 'Se necesitan al menos 1 espía'),
  timer: z.number({ error: 'El temporizador es requerido' }).min(5, 'El temporizador debe ser como mínimo 5 minutos'),
  isPublic: z.boolean().optional(),
  showCategoryToImpostor: z.boolean().optional()
}).refine(data => data.spies < data.players, {
  message: 'Debe haber al menos un jugador sin ser espía',
  path: ['spies']
});

type Schema = z.output<typeof schema>;

const state = ref<Partial<Schema>>({
  words: undefined,
  players: MIN_PLAYERS,
  spies: MIN_IMPOSTORS,
  timer: DEFAULT_TIME_LIMIT,
  isPublic: false,
  showCategoryToImpostor: false
});

const loading = ref(false);
const error = ref('');

const items = ref(categories.map(category => ({
  label: category.name, value: category.id
})));

const canCreate = computed(() => {
  return (
    state.value.players
    && state.value.players >= MIN_PLAYERS
    && state.value.players <= MAX_PLAYERS
    && state.value.spies
    && state.value.spies >= MIN_IMPOSTORS
    && state.value.spies <= MAX_IMPOSTORS
    && state.value.spies < state.value.players
    && state.value.words
    && state.value.words.length > 0
    && state.value.timer
    && state.value.timer >= 5
    && state.value.timer <= 30
  );
});

const onSubmit = async () => {
  if (!canCreate.value || loading.value || !isOnline.value) return;

  loading.value = true;
  error.value = '';

  try {
    const settings: GameSettings = {
      maxPlayers: state.value.players!,
      impostorCount: state.value.spies!,
      categories: state.value.words!,
      timeLimit: state.value.timer! * 60,
      showCategoryToImpostor: state.value.showCategoryToImpostor || false
    };

    const response = await $fetch('/api/rooms/create', {
      method: 'POST',
      body: {
        ...settings,
        isPublic: state.value.isPublic || false
      }
    });

    if (response.success && response.roomId) {
      // Save settings and creatorId to sessionStorage for the room page to use
      sessionStorage.setItem(`room_settings_${response.roomId}`, JSON.stringify(response.settings));
      sessionStorage.setItem(`room_creator_${response.roomId}`, response.creatorId);
      navigateTo(`/room/${response.roomId}`);
    }
  }
  catch (e: any) {
    error.value = e.data?.message || 'Failed to create room';
  }
  finally {
    loading.value = false;
  }
};

const handlePlayerCountChange = () => {
  if (!state.value.players || state.value.players < 3) return;
  if (state.value.spies && state.value.spies >= state.value.players) state.value.spies = state.value.players - 1;
};

const createOfflineGame = () => {
  if (!canCreate.value) return;

  const offlineSettings = {
    playerCount: state.value.players!,
    impostorCount: state.value.spies!,
    categories: state.value.words!,
    timeLimit: state.value.timer! * 60,
    showCategoryToImpostor: state.value.showCategoryToImpostor || false
  };

  sessionStorage.setItem('offline_game_settings', JSON.stringify(offlineSettings));
  navigateTo('/room/offline?mode=offline');
};
</script>

<template>
  <UForm
    :schema="schema"
    :state="state"
    :validate-on="['input', 'change']"
    class="flex flex-col gap-3"
    @submit="onSubmit"
  >
    <UFormField
      name="words"
      label="Conjunto"
      help="Conjuntos de palabras a usar en la ronda"
      required
    >
      <div class="flex gap-2 items-center">
        <USelectMenu
          v-model="state.words"
          value-key="value"
          :placeholder="items.slice(0, 2).map(i => i.label).join(', ')"
          multiple
          :items
          class="w-full"
          :ui="{
            base: 'ps-1.5'
          }"
        >
          <template #default="{ modelValue }">
            <div v-if="modelValue?.length" class="flex gap-1 items-center">
              <UBadge v-for="i in modelValue.slice(0, 2)" :key="i" variant="outline" color="neutral" :ui="{ base: 'lighter-ring'}">
                {{ items.find(item => item.value === i)?.label }}
              </UBadge>
              <UBadge v-if="modelValue.length > 2" variant="outline" color="neutral" :ui="{ base: 'lighter-ring'}">
                + {{ modelValue.length - 2 }}
              </UBadge>
            </div>
            <span v-else class="text-gray-400">Seleccionar conjuntos...</span>
          </template>
        </USelectMenu>
      </div>
    </UFormField>

    <UFormField
      name="players"
      label="Jugadores"
      help="Cantidad de jugadores (Incluyendo espías)"
      required
    >
      <div class="flex gap-2 items-center">
        <UInputNumber
          v-model="state.players"
          :max="MAX_PLAYERS"
          :min="MIN_PLAYERS"
          class="w-full"
          @change="handlePlayerCountChange"
        />
      </div>
    </UFormField>

    <UFormField
      name="spies"
      label="Espias"
      help="Cantidad de espias"
      required
    >
      <div class="flex gap-2 items-center">
        <UInputNumber
          v-model="state.spies"
          :max="(state.players || MIN_PLAYERS) - 1"
          :min="MIN_IMPOSTORS"
          class="w-full"
        />
      </div>
    </UFormField>

    <UFormField
      name="timer"
      label="Temporizador"
      help="Duración de la partida en minutos"
      required
    >
      <div class="flex gap-2 items-center">
        <UInputNumber
          v-model="state.timer"
          :step="5"
          :max="MAX_TIME_LIMIT"
          :min="MIN_TIME_LIMIT"
          class="w-full"
        />
      </div>
    </UFormField>

    <UFormField
      class="max-w-[90%] text-balance"
      name="isPublic"
      label="Visibilidad de la sala"
      help="Cualquiera podrá unirse a las salas publicas"
    >
      <UCheckbox
        v-model="state.isPublic"
        label="Marcar como sala publica"
        :disabled="!isOnline"
      />
    </UFormField>

    <UFormField
      class="max-w-[90%] text-balance"
      name="showCategoryToImpostor"
      label="Mostrar categoria"
      help="Muestra la categoria de la palabra a todos los jugadores"
    >
      <UCheckbox
        v-model="state.showCategoryToImpostor"
        label="Mostrar categoria al impostor"
      />
    </UFormField>

    <div class="flex gap-2">
      <UButton
        type="submit"
        variant="outline"
        :disabled="!isOnline"
      >
        Crear
      </UButton>

      <UButton
        class="md:hidden"
        variant="solid"
        :disabled="!canCreate"
        @click.prevent="createOfflineGame"
      >
        Crear sala Offline
      </UButton>
    </div>
  </UForm>
</template>

<style>
  .lighter-ring {
    box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(64, 64, 64, 0.2) 0px 0px 0px 1px inset, rgba(0, 0, 0, 0) 0px 0px 0px 0px
  }
</style>