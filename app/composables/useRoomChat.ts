import { ref, computed, onUnmounted } from 'vue';
import type { ChatMessage } from '~/types/chat';

const COOLDOWN_MS = 1000;

export const useRoomChat = () => {
  const supabase = useSupabaseClient();

  const messages = ref<ChatMessage[]>([]);
  const lastSentAt = ref<number>(0);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const currentTime = ref<number>(Date.now());

  // Update current time every 100ms to make cooldown reactive
  const timer = setInterval(() => {
    currentTime.value = Date.now();
  }, 100);

  onUnmounted(() => {
    clearInterval(timer);
  });

  const canSend = computed(() => {
    return currentTime.value - lastSentAt.value >= COOLDOWN_MS;
  });

  const loadMessages = async (roomId: string) => {
    isLoading.value = true;
    error.value = null;

    try {
      const { data, error: fetchError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (fetchError) {
        error.value = fetchError.message;
        return;
      }

      messages.value = (data || []).map(msg => ({
        id: msg.id,
        roomId: msg.room_id,
        playerId: msg.player_id,
        playerName: msg.player_name,
        content: msg.content,
        createdAt: msg.created_at
      }));
    }
    catch (e) {
      error.value = (e as Error).message;
    }
    finally {
      isLoading.value = false;
    }
  };

  const sendMessage = async (
    roomId: string,
    playerId: string,
    playerName: string,
    content: string
  ): Promise<boolean> => {
    if (!canSend.value) {
      return false;
    }

    const trimmedContent = content.trim();
    if (!trimmedContent) {
      return false;
    }

    error.value = null;

    try {
      const { error: invokeError } = await supabase.functions.invoke('send-chat-message', {
        body: {
          roomId,
          playerId,
          playerName,
          content: trimmedContent
        }
      });

      if (invokeError) {
        error.value = invokeError.message;
        return false;
      }

      lastSentAt.value = Date.now();
      return true;
    }
    catch (e) {
      error.value = (e as Error).message;
      return false;
    }
  };

  const addMessage = (message: ChatMessage) => {
    // Avoid duplicates
    if (!messages.value.some(m => m.id === message.id)) {
      messages.value.push(message);
    }
  };

  const clearMessages = () => {
    messages.value = [];
    lastSentAt.value = 0;
    error.value = null;
  };

  return {
    messages,
    isLoading,
    error,
    canSend,
    loadMessages,
    sendMessage,
    addMessage,
    clearMessages
  };
};
