<script setup lang="ts">
import { ref } from 'vue';

const emit = defineEmits<{
  join: [roomId: string];
}>();

const roomCode = ref('');
const loading = ref(false);
const error = ref('');

const joinRoom = async () => {
  const code = roomCode.value.trim().toUpperCase();

  if (!code) {
    error.value = 'Please enter a room code';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    // Verify room exists
    const response = await $fetch(`/api/rooms/${code}`);

    if (response.success) {
      emit('join', code);
    }
  }
  catch (e: any) {
    error.value = e.data?.message || 'Room not found';
  }
  finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
    <h2 class="text-2xl font-bold mb-6 text-gray-800">
      Join Room
    </h2>

    <form
      class="space-y-4"
      @submit.prevent="joinRoom"
    >
      <!-- Room Code Input -->
      <div>
        <label
          for="roomCode"
          class="block text-sm font-medium text-gray-700 mb-2"
        >
          Room Code
        </label>
        <input
          id="roomCode"
          v-model="roomCode"
          type="text"
          placeholder="Enter 6-character code"
          maxlength="6"
          class="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase text-center text-2xl tracking-widest font-mono"
          :disabled="loading"
        >
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
        :disabled="!roomCode.trim() || loading"
        :class="[
          'w-full py-3 px-4 rounded-md font-medium transition-colors',
          roomCode.trim() && !loading
            ? 'bg-green-500 text-white hover:bg-green-600'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        ]"
      >
        {{ loading ? 'Joining...' : 'Join Room' }}
      </button>
    </form>
  </div>
</template>
