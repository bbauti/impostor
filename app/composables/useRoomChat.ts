import { ref, computed, onUnmounted } from "vue"
import type { ChatMessage } from "~/types/chat"

const COOLDOWN_MS = 1000
const MESSAGE_LIMIT = 100

export const useRoomChat = () => {
  const supabase = useSupabaseClient()

  const messages = ref<ChatMessage[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Cooldown state - uses single timeout instead of 100ms interval
  const isCooldownActive = ref(false)
  let cooldownTimer: NodeJS.Timeout | undefined

  const startCooldown = () => {
    isCooldownActive.value = true
    if (cooldownTimer) clearTimeout(cooldownTimer)
    cooldownTimer = setTimeout(() => {
      isCooldownActive.value = false
    }, COOLDOWN_MS)
  }

  onUnmounted(() => {
    if (cooldownTimer) clearTimeout(cooldownTimer)
  })

  const canSend = computed(() => !isCooldownActive.value)

  const loadMessages = async (roomId: string) => {
    isLoading.value = true
    error.value = null

    try {
      // Fetch most recent messages with limit for performance
      const { data, error: fetchError } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: false })
        .limit(MESSAGE_LIMIT)

      if (fetchError) {
        error.value = fetchError.message
        return
      }

      // Reverse to show oldest first in UI
      messages.value = (data || []).reverse().map((msg) => ({
        id: msg.id,
        roomId: msg.room_id,
        playerId: msg.player_id,
        playerName: msg.player_name,
        content: msg.content,
        createdAt: msg.created_at,
      }))
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      isLoading.value = false
    }
  }

  const sendMessage = async (
    roomId: string,
    playerId: string,
    playerName: string,
    content: string,
  ): Promise<boolean> => {
    if (!canSend.value) {
      return false
    }

    const trimmedContent = content.trim()
    if (!trimmedContent) {
      return false
    }

    error.value = null

    try {
      const { error: invokeError } = await supabase.functions.invoke(
        "send-chat-message",
        {
          body: {
            roomId,
            playerId,
            playerName,
            content: trimmedContent,
          },
        },
      )

      if (invokeError) {
        error.value = invokeError.message
        return false
      }

      startCooldown()
      return true
    } catch (e) {
      error.value = (e as Error).message
      return false
    }
  }

  const addMessage = (message: ChatMessage) => {
    // Avoid duplicates
    if (!messages.value.some((m) => m.id === message.id)) {
      messages.value.push(message)
    }
  }

  const clearMessages = () => {
    messages.value = []
    isCooldownActive.value = false
    if (cooldownTimer) {
      clearTimeout(cooldownTimer)
      cooldownTimer = undefined
    }
    error.value = null
  }

  return {
    messages,
    isLoading,
    error,
    canSend,
    loadMessages,
    sendMessage,
    addMessage,
    clearMessages,
  }
}
