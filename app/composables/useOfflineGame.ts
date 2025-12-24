import { ref, computed } from "vue"
import { selectSecretWordWithCategory, formatTime } from "~/utils/game-logic"

export interface OfflineSettings {
  playerCount: number
  impostorCount: number
  categories: string[]
  timeLimit: number
  showCategoryToImpostor?: boolean
}

interface OfflinePlayer {
  index: number
  name: string
  isImpostor: boolean
  hasSeenRole: boolean
}

type OfflinePhase = "player_names" | "role_reveal" | "timer" | "ended"

export const useOfflineGame = () => {
  const phase = ref<OfflinePhase>("player_names")
  const settings = ref<OfflineSettings | null>(null)
  const secretWord = ref("")
  const secretCategory = ref("")
  const players = ref<OfflinePlayer[]>([])
  const currentPlayerIndex = ref<number | null>(null)
  const showingRole = ref(false)
  const timeRemaining = ref(0)
  const timerInterval = ref<ReturnType<typeof setInterval> | null>(null)
  const wakeLock = ref<WakeLockSentinel | null>(null)
  const playerNamesInput = ref<string[]>([])
  const skipPlayerNames = ref(false)

  const currentPlayer = computed(() =>
    currentPlayerIndex.value !== null
      ? players.value.find((p) => p.index === currentPlayerIndex.value)
      : null,
  )

  const formattedTimeRemaining = computed(() => formatTime(timeRemaining.value))

  const allPlayersHaveSeenRole = computed(() =>
    players.value.every((p) => p.hasSeenRole),
  )

  const showCategoryToImpostor = computed(
    () => settings.value?.showCategoryToImpostor ?? false,
  )

  const requestWakeLock = async () => {
    if ("wakeLock" in navigator) {
      try {
        wakeLock.value = await navigator.wakeLock.request("screen")
      } catch {
        /* empty */
      }
    }
  }

  const releaseWakeLock = async () => {
    if (wakeLock.value) {
      await wakeLock.value.release()
      wakeLock.value = null
    }
  }

  const initGame = async (gameSettings: OfflineSettings) => {
    settings.value = gameSettings

    const wordSelection = selectSecretWordWithCategory(gameSettings.categories)
    secretWord.value = wordSelection.word
    secretCategory.value = wordSelection.categoryName

    playerNamesInput.value = Array(gameSettings.playerCount).fill("")
    phase.value = "player_names"
    currentPlayerIndex.value = null
    showingRole.value = false
    timeRemaining.value = gameSettings.timeLimit

    await requestWakeLock()
  }

  const setupPlayers = (names?: string[]) => {
    if (!settings.value) return

    const allPlayers: OfflinePlayer[] = []
    for (let i = 1; i <= settings.value.playerCount; i++) {
      const providedName = names?.[i - 1]?.trim()
      allPlayers.push({
        index: i,
        name: providedName || `Jugador ${i}`,
        isImpostor: false,
        hasSeenRole: false,
      })
    }

    const shuffled = [...allPlayers].sort(() => Math.random() - 0.5)
    for (let i = 0; i < settings.value.impostorCount; i++) {
      shuffled[i]!.isImpostor = true
    }

    players.value = allPlayers
    phase.value = "role_reveal"
  }

  const skipNamesAndStart = () => {
    skipPlayerNames.value = true
    setupPlayers()
  }

  const confirmNamesAndStart = () => {
    setupPlayers(playerNamesInput.value)
  }

  const selectPlayer = (playerIndex: number) => {
    const player = players.value.find((p) => p.index === playerIndex)
    if (player && !player.hasSeenRole) {
      currentPlayerIndex.value = playerIndex
      showingRole.value = true
    }
  }

  const hideRole = () => {
    if (currentPlayerIndex.value !== null) {
      const player = players.value.find(
        (p) => p.index === currentPlayerIndex.value,
      )
      if (player) {
        player.hasSeenRole = true
      }
    }
    showingRole.value = false
    currentPlayerIndex.value = null
  }

  const startTimer = () => {
    phase.value = "timer"
    timerInterval.value = setInterval(() => {
      timeRemaining.value--
      if (timeRemaining.value <= 0) {
        if (timerInterval.value) {
          clearInterval(timerInterval.value)
          timerInterval.value = null
        }
      }
    }, 1000)
  }

  const endGame = async () => {
    if (timerInterval.value) {
      clearInterval(timerInterval.value)
      timerInterval.value = null
    }
    phase.value = "ended"
    await releaseWakeLock()
  }

  const cleanup = async () => {
    if (timerInterval.value) {
      clearInterval(timerInterval.value)
      timerInterval.value = null
    }
    await releaseWakeLock()
  }

  return {
    phase,
    settings,
    secretWord,
    secretCategory,
    players,
    currentPlayerIndex,
    showingRole,
    timeRemaining,
    playerNamesInput,
    skipPlayerNames,

    currentPlayer,
    formattedTimeRemaining,
    allPlayersHaveSeenRole,
    showCategoryToImpostor,

    initGame,
    setupPlayers,
    skipNamesAndStart,
    confirmNamesAndStart,
    selectPlayer,
    hideRole,
    startTimer,
    endGame,
    cleanup,
  }
}
