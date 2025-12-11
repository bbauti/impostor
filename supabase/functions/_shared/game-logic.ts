import { getRandomWord } from './words.ts';

export interface Player {
  id: string;
  name: string;
  status: 'waiting' | 'ready' | 'playing' | 'spectating' | 'disconnected';
  isHost: boolean;
}

export interface GameSettings {
  maxPlayers: number;
  impostorCount: number;
  categories: string[];
  timeLimit: number;
}

export interface RoomState {
  secretWord: string | null;
  impostorIds: string[];
  phase: 'waiting' | 'role_reveal' | 'discussion' | 'voting' | 'ended';
  votes: Record<string, string>;
  voteRound: number;
  timeStarted: number | null;
  players: string[];
  settings: GameSettings;
}

export type GameResult = 'players' | 'impostors';

/**
 * Generates a cryptographically secure random integer in range [0, max).
 */
function secureRandomInt(max: number): number {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] % max;
}

/**
 * Selects impostors using Fisher-Yates shuffle with cryptographically secure random.
 * This ensures fair and unpredictable impostor selection.
 */
export function selectImpostors(players: { playerId: string }[], count: number): string[] {
  // Create a copy of the array to shuffle
  const shuffled = [...players];

  // Fisher-Yates shuffle with secure random
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, count).map(p => p.playerId);
}

export function selectSecretWord(categories: string[]): string {
  return getRandomWord(categories);
}

export function checkWinCondition(
  players: string[],
  impostorIds: string[],
  eliminatedPlayers: string[]
): GameResult | null {
  const activePlayers = players.filter(p => !eliminatedPlayers.includes(p));
  const activeImpostors = activePlayers.filter(p => impostorIds.includes(p));
  const activeNormalPlayers = activePlayers.filter(p => !impostorIds.includes(p));

  // All impostors eliminated - players win
  if (activeImpostors.length === 0 && activeNormalPlayers.length > 0) {
    return 'players';
  }

  // Impostors >= normal players - impostors win
  if (activeImpostors.length >= activeNormalPlayers.length) {
    return 'impostors';
  }

  return null;
}

export function tallyVotes(votes: Record<string, string>): {
  eliminatedId: string | null;
  voteCounts: Record<string, number>;
  tie: boolean;
  skipVotes: number;
  majoritySkipped: boolean;
} {
  const voteCounts: Record<string, number> = {};
  let skipVotes = 0;

  for (const targetId of Object.values(votes)) {
    if (!targetId) {
      skipVotes++;
      continue;
    }
    voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
  }

  const totalVotes = Object.keys(votes).length;
  const majoritySkipped = skipVotes > totalVotes / 2;

  const counts = Object.values(voteCounts);
  if (counts.length === 0) {
    return {
      eliminatedId: null,
      voteCounts: {},
      tie: true,
      skipVotes,
      majoritySkipped
    };
  }

  const maxVotes = Math.max(...counts);
  const playersWithMaxVotes = Object.entries(voteCounts)
    .filter(([_, count]) => count === maxVotes)
    .map(([id]) => id);

  const tie = playersWithMaxVotes.length > 1;

  return {
    eliminatedId: tie ? null : playersWithMaxVotes[0],
    voteCounts,
    tie,
    skipVotes,
    majoritySkipped
  };
}
