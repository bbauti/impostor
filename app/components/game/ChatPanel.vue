<script setup lang="ts">
import { useWindowSize } from '@vueuse/core';
import { ref, watch, nextTick } from 'vue';
import type { ChatMessage } from '~/types/chat';

const { width } = useWindowSize();

const props = defineProps<{
  roomId: string;
  currentPlayerId: string;
  currentPlayerName: string;
  messages: ChatMessage[];
  canSend: boolean;
}>();

const emit = defineEmits<{
  sendMessage: [content: string];
}>();

const isOpen = ref(false);
const inputMessage = ref('');
const messagesContainer = ref<HTMLElement | null>(null);

const toggle = () => {
  isOpen.value = !isOpen.value;
};

const handleSubmit = () => {
  const content = inputMessage.value.trim();
  if (!content || !props.canSend) return;

  emit('sendMessage', content);
  inputMessage.value = '';
};

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
};

// Auto-scroll when new messages arrive
watch(() => props.messages.length, () => {
  scrollToBottom();
});

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
};

onMounted(() => {
  if (width.value && width.value >= 768) isOpen.value = true;
});
</script>

<template>
  <!-- Toggle button when closed -->
  <Transition name="fade">
    <UButton
      v-if="!isOpen"
      class="fixed left-4 bottom-4 z-40 shadow-lg"
      icon="i-lucide-message-circle"
      size="lg"
      color="primary"
      @click="toggle"
    >
      Chat
    </UButton>
  </Transition>

  <!-- Chat Panel -->
  <Transition name="slide">
    <div
      v-if="isOpen"
      class="fixed left-0 top-0 bottom-0 z-40 w-80 bg-default border-r border-default flex flex-col shadow-xl"
    >
      <!-- Header -->
      <div class="p-3 border-b border-default flex justify-between items-center shrink-0">
        <span class="font-semibold">Chat</span>
        <UButton
          icon="i-lucide-panel-left-close"
          variant="ghost"
          size="xs"
          color="neutral"
          @click="toggle"
        />
      </div>

      <!-- Messages -->
      <div
        ref="messagesContainer"
        class="flex-1 overflow-y-auto p-3 space-y-3"
      >
        <div
          v-if="messages.length === 0"
          class="text-center text-dimmed text-sm py-8"
        >
          No hay mensajes aún
        </div>

        <div
          v-for="msg in messages"
          :key="msg.id"
          class="flex flex-col"
          :class="msg.playerId === currentPlayerId ? 'items-end' : 'items-start'"
        >
          <!-- Player name -->
          <span
            class="text-xs text-dimmed mb-1 px-1"
            :class="msg.playerId === currentPlayerId ? 'text-right' : 'text-left'"
          >
            {{ msg.playerId === currentPlayerId ? 'Vos' : msg.playerName }}
          </span>

          <!-- Message bubble -->
          <div
            class="max-w-[85%] px-3 py-2 rounded-lg text-sm wrap-break-words"
            :class="msg.playerId === currentPlayerId
              ? 'bg-primary text-primary-foreground rounded-br-sm'
              : 'bg-elevated border border-default rounded-bl-sm'"
          >
            <!-- Using v-text to prevent XSS - content is already sanitized server-side but double protection -->
            <span v-text="msg.content" />
          </div>

          <!-- Timestamp -->
          <span class="text-xs text-dimmed mt-1 px-1">
            {{ formatTime(msg.createdAt) }}
          </span>
        </div>
      </div>

      <!-- Input -->
      <form
        class="p-3 border-t border-default shrink-0"
        @submit.prevent="handleSubmit"
      >
        <div class="flex gap-2">
          <UInput
            v-model="inputMessage"
            placeholder="Mensaje..."
            :maxlength="500"
            class="flex-1"
            :disabled="!canSend"
          />
          <UButton
            type="submit"
            :disabled="!canSend || !inputMessage.trim()"
            icon="i-lucide-send"
          />
        </div>
        <p
          v-if="!canSend"
          class="text-xs text-dimmed mt-1"
        >
          Espera un segundo...
        </p>
      </form>
    </div>
  </Transition>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.2s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
