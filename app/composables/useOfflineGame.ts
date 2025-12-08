import { ref, computed } from 'vue';
import { selectSecretWord, formatTime } from '~/utils/game-logic';

export interface OfflineSettings {
  playerCount: number;
  impostorCount: number;
  categories: string[];
  timeLimit: number; // en segundos
}

interface OfflinePlayer {
  index: number;
  isImpostor: boolean;
}

type OfflinePhase = 'role_reveal' | 'timer' | 'ended';

export const useOfflineGame = () => {
  // Estado
  const phase = ref<OfflinePhase>('role_reveal');
  const settings = ref<OfflineSettings | null>(null);
  const secretWord = ref('');
  const players = ref<OfflinePlayer[]>([]);
  const currentPlayerIndex = ref(1);
  const showingRole = ref(false);
  const timeRemaining = ref(0);
  const timerInterval = ref<ReturnType<typeof setInterval> | null>(null);
  const wakeLock = ref<WakeLockSentinel | null>(null);

  // Computados
  const currentPlayer = computed(() =>
    players.value.find(p => p.index === currentPlayerIndex.value)
  );

  const formattedTimeRemaining = computed(() =>
    formatTime(timeRemaining.value)
  );

  const isLastPlayer = computed(() =>
    currentPlayerIndex.value === settings.value?.playerCount
  );

  // Wake Lock - mantener pantalla encendida
  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLock.value = await navigator.wakeLock.request('screen');
      }
      catch { /* empty */ }
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLock.value) {
      await wakeLock.value.release();
      wakeLock.value = null;
    }
  };

  // Inicializar juego
  const initGame = async (gameSettings: OfflineSettings) => {
    settings.value = gameSettings;
    secretWord.value = selectSecretWord(gameSettings.categories);

    // Crear jugadores
    const allPlayers: OfflinePlayer[] = [];
    for (let i = 1; i <= gameSettings.playerCount; i++) {
      allPlayers.push({ index: i, isImpostor: false });
    }

    // Seleccionar impostores aleatoriamente
    const shuffled = [...allPlayers].sort(() => Math.random() - 0.5);
    for (let i = 0; i < gameSettings.impostorCount; i++) {
      shuffled[i].isImpostor = true;
    }

    players.value = allPlayers;
    phase.value = 'role_reveal';
    currentPlayerIndex.value = 1;
    showingRole.value = false;
    timeRemaining.value = gameSettings.timeLimit;

    // Activar wake lock
    await requestWakeLock();
  };

  // Revelar rol
  const revealRole = () => {
    showingRole.value = true;
  };

  // Siguiente jugador
  const nextPlayer = () => {
    if (isLastPlayer.value) {
      startTimer();
    }
    else {
      currentPlayerIndex.value++;
      showingRole.value = false;
    }
  };

  // Iniciar timer
  const startTimer = () => {
    phase.value = 'timer';
    timerInterval.value = setInterval(() => {
      timeRemaining.value--;
      if (timeRemaining.value <= 0) {
        if (timerInterval.value) {
          clearInterval(timerInterval.value);
          timerInterval.value = null;
        }
      }
    }, 1000);
  };

  // Terminar juego
  const endGame = async () => {
    if (timerInterval.value) {
      clearInterval(timerInterval.value);
      timerInterval.value = null;
    }
    phase.value = 'ended';
    await releaseWakeLock();
  };

  // Limpiar al desmontar
  const cleanup = async () => {
    if (timerInterval.value) {
      clearInterval(timerInterval.value);
      timerInterval.value = null;
    }
    await releaseWakeLock();
  };

  return {
    // Estado
    phase,
    settings,
    secretWord,
    players,
    currentPlayerIndex,
    showingRole,
    timeRemaining,

    // Computados
    currentPlayer,
    formattedTimeRemaining,
    isLastPlayer,

    // Acciones
    initGame,
    revealRole,
    nextPlayer,
    startTimer,
    endGame,
    cleanup
  };
};
