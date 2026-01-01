<script setup lang="ts">
import type { PublicRoomListItem, PublicRoomsResponse } from '~/types/game';
import { categories } from '~/data/words';
import { useDebounceFn } from '@vueuse/core';
import type { RealtimeChannel } from '@supabase/supabase-js';

const loading = ref(false);
const error = ref<string>('');
const rooms = ref<PublicRoomListItem[]>([]);
const currentPage = ref(1);
const totalPages = ref(1);
const total = ref(0);
const failedTries = ref(0);

const supabase = useSupabaseClient();
let roomsChannel: RealtimeChannel | null = null;
let gameStatesChannel: RealtimeChannel | null = null;

// Fetch public rooms
const fetchRooms = async (showLoading = true) => {
  if (failedTries.value > 2) return;
  if (showLoading) loading.value = true;
  error.value = '';

  try {
    const response = await $fetch<PublicRoomsResponse>(`/api/rooms/public?page=${currentPage.value}`);
    if (response.success) {
      rooms.value = response.rooms;
      totalPages.value = response.pagination.totalPages;
      total.value = response.pagination.total;
      failedTries.value = 0; // Reset failed tries on success
    }
  }
  catch (e: any) {
    failedTries.value++;
    error.value = e.data?.message || 'Error al cargar salas publicas';
  }
  finally {
    loading.value = false;
  }
};

// Debounced fetch for real-time updates to prevent excessive API calls
const debouncedFetchRooms = useDebounceFn(() => {
  fetchRooms(false);
}, 300);

// Subscribe to real-time updates
const subscribeToUpdates = () => {
  // Subscribe to rooms table changes (new public rooms, updates, deletes)
  roomsChannel = supabase
    .channel('public-rooms-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'rooms',
        filter: 'is_public=eq.true'
      },
      () => {
        // Refresh the list when a public room is created, updated, or deleted
        debouncedFetchRooms();
      }
    )
    .subscribe();

  // Subscribe to game_states table changes (phase changes)
  gameStatesChannel = supabase
    .channel('game-states-changes')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'game_states'
      },
      (payload: { old?: { phase?: string }; new?: { phase?: string; room_id?: string } }) => {
        // Only refresh if phase changed (room might have started/ended)
        if (payload.new?.phase !== payload.old?.phase) {
          debouncedFetchRooms();
        }
      }
    )
    .subscribe();
};

// Unsubscribe from real-time updates
const unsubscribeFromUpdates = () => {
  if (roomsChannel) {
    const channel = roomsChannel;
    roomsChannel = null;
    try {
      supabase.removeChannel(channel);
    } catch {}
  }
  if (gameStatesChannel) {
    const channel = gameStatesChannel;
    gameStatesChannel = null;
    try {
      supabase.removeChannel(channel);
    } catch {}
  }
};

// Get category names from IDs
const getCategoryNames = (categoryIds: string[]) => {
  return categoryIds
    .map(id => categories.find(c => c.id === id)?.name)
    .filter(Boolean)
    .join(', ');
};

// Format time limit (seconds to minutes)
const formatTimeLimit = (seconds: number) => {
  return `${Math.floor(seconds / 60)} min`;
};

// Join room
const joinRoom = (roomId: string) => {
  navigateTo(`/room/${roomId}`);
};

// Pagination
const goToPage = (page: number) => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  fetchRooms();
};

// Initialize: fetch rooms and subscribe to real-time updates
onMounted(() => {
  fetchRooms();
  subscribeToUpdates();
});

// Cleanup: unsubscribe from real-time updates
onBeforeUnmount(() => {
  unsubscribeFromUpdates();
});

// Re-fetch when page changes
watch(currentPage, () => {
  fetchRooms();
});
</script>

<template>
  <div class="mt-6">
    <div class="flex items-center justify-between mb-3">
      <p class="text-xl font-semibold my-0">
        Salas Publicas
      </p>
      <UBadge
        v-if="total > 0"
        variant="soft"
      >
        {{ total }} {{ total === 1 ? 'sala' : 'salas' }}
      </UBadge>
    </div>

    <!-- Loading State -->
    <div
      v-if="loading && rooms.length === 0"
      class="text-center py-8"
    >
      <Icon
        name="lucide:loader-circle"
        class="animate-spin text-4xl"
      />
      <ProseP class="text-dimmed text-sm mt-2">
        Cargando salas...
      </ProseP>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error && rooms.length === 0"
      class="text-center py-8"
    >
      <ProseP class="text-red-500 text-sm">
        {{ error }}
      </ProseP>
      <UButton
        variant="outline"
        size="sm"
        @click="fetchRooms"
      >
        Reintentar
      </UButton>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="rooms.length === 0"
      class="text-center py-8 border border-default rounded-lg"
    >
      <ProseP class="text-gray-600 dark:text-gray-400 text-sm mb-0">
        No hay salas publicas disponibles
      </ProseP>
    </div>

    <!-- Room List -->
    <div
      v-else
      class="space-y-2"
    >
      <div
        v-for="room in rooms"
        :key="room.roomId"
        class="border border-default rounded-lg p-3 hover:border-primary transition-colors"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex-1 min-w-0">
            <!-- Room Info Row 1: Player count + Categories -->
            <div class="flex items-center gap-2 mb-2">
              <UBadge
                color="info"
                variant="soft"
              >
                {{ room.playerCount }} / {{ room.maxPlayers }} jugadores
              </UBadge>
              <ProseP class="text-sm text-dimmed truncate my-0">
                {{ getCategoryNames(room.categories.length > 2 ? room.categories.slice(0, 3) : room.categories) + (room.categories.length > 2 ? '...' : '') }}
              </ProseP>
            </div>

            <!-- Room Info Row 2: Time + Impostors -->
            <div class="flex items-center gap-3 text-sm text-toned">
              <span>
                <Icon
                  name="lucide:clock"
                  class="inline w-4 h-4 mr-1"
                />
                {{ formatTimeLimit(room.timeLimit) }}
              </span>
              <span>
                <Icon
                  name="lucide:users"
                  class="inline w-4 h-4 mr-1"
                />
                {{ room.impostorCount }} {{ room.impostorCount === 1 ? 'espia' : 'espias' }}
              </span>
            </div>
          </div>

          <!-- Join Button -->
          <UButton
            variant="outline"
            size="sm"
            @click="joinRoom(room.roomId)"
          >
            Unirse
          </UButton>
        </div>
      </div>

      <!-- Pagination -->
      <div
        v-if="totalPages > 1"
        class="flex items-center justify-center gap-2 mt-4"
      >
        <UButton
          variant="ghost"
          size="sm"
          icon="i-lucide-chevron-left"
          :disabled="currentPage === 1"
          @click="goToPage(currentPage - 1)"
        />

        <div class="flex items-center gap-1">
          <template
            v-for="page in totalPages"
            :key="page"
          >
            <UButton
              v-if="page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)"
              variant="ghost"
              size="sm"
              :color="page === currentPage ? 'primary' : 'neutral'"
              @click="goToPage(page)"
            >
              {{ page }}
            </UButton>
            <span
              v-else-if="page === currentPage - 2 || page === currentPage + 2"
              class="text-dimmed"
            >
              ...
            </span>
          </template>
        </div>

        <UButton
          variant="ghost"
          size="sm"
          icon="i-lucide-chevron-right"
          :disabled="currentPage === totalPages"
          @click="goToPage(currentPage + 1)"
        />
      </div>
    </div>
  </div>
</template>
