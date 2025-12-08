<script setup lang="ts">
import { ref } from 'vue';
import { categories } from '~/data/words';
import { MIN_PLAYERS, MAX_PLAYERS, MIN_IMPOSTORS, MAX_IMPOSTORS, DEFAULT_TIME_LIMIT } from '~/utils/constants';
import type { GameSettings } from '~/types/game';

const emit = defineEmits<{
  create: [roomId: string];
}>();

const loading = ref(false);
const error = ref('');

// Form state
const maxPlayers = ref(6);
const impostorCount = ref(1);
const selectedCategories = ref<string[]>(['animals', 'objects', 'food']);
const timeLimit = ref(DEFAULT_TIME_LIMIT / 60); // Convert to minutes for display

// Validation
const canCreate = computed(() => {
  return (
    maxPlayers.value >= MIN_PLAYERS
    && maxPlayers.value <= MAX_PLAYERS
    && impostorCount.value >= MIN_IMPOSTORS
    && impostorCount.value <= MAX_IMPOSTORS
    && impostorCount.value < maxPlayers.value / 2
    && selectedCategories.value.length > 0
    && timeLimit.value >= 5
    && timeLimit.value <= 30
  );
});

const createRoom = async () => {
  if (!canCreate.value || loading.value) return;

  loading.value = true;
  error.value = '';

  try {
    const settings: GameSettings = {
      maxPlayers: maxPlayers.value,
      impostorCount: impostorCount.value,
      categories: selectedCategories.value,
      timeLimit: timeLimit.value * 60 // Convert minutes to seconds
    };

    const response = await $fetch('/api/rooms/create', {
      method: 'POST',
      body: settings
    });

    if (response.success && response.roomId) {
      emit('create', response.roomId);
    }
  }
  catch (e: any) {
    error.value = e.data?.message || 'Failed to create room';
  }
  finally {
    loading.value = false;
  }
};

const toggleCategory = (categoryId: string) => {
  const index = selectedCategories.value.indexOf(categoryId);
  if (index >= 0) {
    selectedCategories.value.splice(index, 1);
  }
  else {
    selectedCategories.value.push(categoryId);
  }
};
</script>

<template>
  <div class="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
    <h2 class="text-2xl font-bold mb-6 text-gray-800">
      Create Room
    </h2>

    <form
      class="space-y-6"
      @submit.prevent="createRoom"
    >
      <!-- Max Players -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Max Players: {{ maxPlayers }}
        </label>
        <input
          v-model.number="maxPlayers"
          type="range"
          :min="MIN_PLAYERS"
          :max="MAX_PLAYERS"
          class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        >
        <div class="flex justify-between text-xs text-gray-500 mt-1">
          <span>{{ MIN_PLAYERS }}</span>
          <span>{{ MAX_PLAYERS }}</span>
        </div>
      </div>

      <!-- Impostor Count -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Impostors: {{ impostorCount }}
        </label>
        <input
          v-model.number="impostorCount"
          type="range"
          :min="MIN_IMPOSTORS"
          :max="Math.min(MAX_IMPOSTORS, Math.floor(maxPlayers / 2) - 1)"
          class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        >
        <div class="flex justify-between text-xs text-gray-500 mt-1">
          <span>{{ MIN_IMPOSTORS }}</span>
          <span>{{ Math.min(MAX_IMPOSTORS, Math.floor(maxPlayers / 2) - 1) }}</span>
        </div>
      </div>

      <!-- Time Limit -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Time Limit: {{ timeLimit }} minutes
        </label>
        <input
          v-model.number="timeLimit"
          type="range"
          min="5"
          max="30"
          step="5"
          class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        >
        <div class="flex justify-between text-xs text-gray-500 mt-1">
          <span>5 min</span>
          <span>30 min</span>
        </div>
      </div>

      <!-- Categories -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Word Categories (select at least 1)
        </label>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="category in categories.filter(c => !c.premium)"
            :key="category.id"
            type="button"
            :class="[
              'px-3 py-2 rounded-md text-sm font-medium transition-colors',
              selectedCategories.includes(category.id)
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            ]"
            @click="toggleCategory(category.id)"
          >
            {{ category.name }}
          </button>
        </div>
      </div>

      <!-- Premium Categories (MVP: show all as available) -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Premium Categories <span class="text-xs text-gray-500">(available in MVP)</span>
        </label>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="category in categories.filter(c => c.premium)"
            :key="category.id"
            type="button"
            :class="[
              'px-3 py-2 rounded-md text-sm font-medium transition-colors border border-dashed border-gray-300',
              selectedCategories.includes(category.id)
                ? 'bg-purple-500 text-white border-purple-500'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            ]"
            @click="toggleCategory(category.id)"
          >
            {{ category.name }}
          </button>
        </div>
      </div>

      <!-- Error Message -->
      <div
        v-if="error"
        class="p-3 bg-red-50 border border-red-200 rounded-md"
      >
        <p class="text-sm text-red-600">
          {{ error }}
        </p>
      </div>

      <!-- Submit Button -->
      <button
        type="submit"
        :disabled="!canCreate || loading"
        :class="[
          'w-full py-3 px-4 rounded-md font-medium transition-colors',
          canCreate && !loading
            ? 'bg-blue-500 text-white hover:bg-blue-600'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        ]"
      >
        {{ loading ? 'Creating...' : 'Create Room' }}
      </button>
    </form>
  </div>
</template>
