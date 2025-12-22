import { computed } from 'vue';
import type { ClientRoomInfo, GamePhase } from '~/types/game';

export const useGameState = () => {
  // Room state
  const currentRoom = useState<ClientRoomInfo | null>('currentRoom', () => null);
  const players = computed(() => currentRoom.value?.players || []);
  const settings = computed(() => currentRoom.value?.settings);
  const phase = computed(() => currentRoom.value?.phase || 'waiting');

  // Player state
  const currentPlayerId = useState<string | null>('currentPlayerId', () => null);
  const currentPlayer = computed(() =>
    players.value.find(p => p.id === currentPlayerId.value) || null
  );

  // Role state (only set after role assignment)
  const isImpostor = useState<boolean>('isImpostor', () => false);
  const secretWord = useState<string | null>('secretWord', () => null);
  const secretCategory = useState<string | null>('secretCategory', () => null);

  // Voting state
  const votes = useState<Record<string, string>>('votes', () => ({}));
  const myVote = computed(() =>
    currentPlayerId.value ? votes.value[currentPlayerId.value] : null
  );
  const voteRound = useState<number>('voteRound', () => 0);

  // Time state
  const timeRemaining = useState<number>('timeRemaining', () => 0);

  // Computed properties
  const isHost = computed(() =>
    currentPlayer.value?.isHost || false
  );

  const isSpectator = computed(() =>
    currentPlayer.value?.status === 'spectating'
  );

  const isPlaying = computed(() =>
    currentPlayer.value?.status === 'playing'
  );

  const isReady = computed(() =>
    currentPlayer.value?.status === 'ready'
  );

  const isWaiting = computed(() =>
    currentPlayer.value?.status === 'waiting'
  );

  const allPlayersReady = computed(() => {
    if (!currentRoom.value) return false;
    return players.value.every(p =>
      p.status === 'ready' || p.isHost
    );
  });

  const activePlayers = computed(() =>
    players.value.filter(p => p.status === 'playing')
  );

  const canStartGame = computed(() =>
    isHost.value
    && allPlayersReady.value
    && players.value.length >= 3
  );

  // Actions
  const updateRoom = (room: ClientRoomInfo) => {
    currentRoom.value = room;
  };

  const setPlayerId = (id: string) => {
    currentPlayerId.value = id;
  };

  const setRole = (impostor: boolean, word: string | null, category?: string | null) => {
    isImpostor.value = impostor;
    secretWord.value = word;
    secretCategory.value = category ?? null;
  };

  const updatePhase = (newPhase: GamePhase) => {
    if (currentRoom.value) {
      currentRoom.value.phase = newPhase;
    }
  };

  const setVote = (playerId: string, targetId: string) => {
    votes.value[playerId] = targetId;
  };

  const clearVotes = () => {
    votes.value = {};
  };

  const updateTimeRemaining = (time: number) => {
    timeRemaining.value = time;
  };

  const updateVoteRound = (round: number) => {
    voteRound.value = round;
  };

  const reset = () => {
    currentRoom.value = null;
    currentPlayerId.value = null;
    isImpostor.value = false;
    secretWord.value = null;
    secretCategory.value = null;
    votes.value = {};
    voteRound.value = 0;
    timeRemaining.value = 0;
  };

  return {
    // State
    currentRoom,
    players,
    settings,
    phase,
    currentPlayerId,
    currentPlayer,
    isImpostor,
    secretWord,
    secretCategory,
    votes,
    myVote,
    voteRound,
    timeRemaining,

    // Computed
    isHost,
    isSpectator,
    isPlaying,
    isReady,
    isWaiting,
    allPlayersReady,
    activePlayers,
    canStartGame,

    // Actions
    updateRoom,
    setPlayerId,
    setRole,
    updatePhase,
    setVote,
    clearVotes,
    updateTimeRemaining,
    updateVoteRound,
    reset
  };
};
