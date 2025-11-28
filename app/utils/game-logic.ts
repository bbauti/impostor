import type { Player, Room, GameResult } from '~/types/game'
import { getRandomWord } from '~/data/words'

/**
 * Randomly select impostors from the player list
 */
export function selectImpostors(players: Player[], count: number): string[] {
  const shuffled = [...players].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count).map(p => p.id)
}

/**
 * Select a random word from the configured categories
 */
export function selectSecretWord(categories: string[]): string {
  return getRandomWord(categories)
}

/**
 * Check if the game has ended and return the winner
 */
export function checkWinCondition(room: Room): GameResult | null {
  const activePlayers = room.players.filter(p => p.status === 'playing')
  const activeImpostors = activePlayers.filter(p => room.impostorIds.includes(p.id))
  const activeNormalPlayers = activePlayers.filter(p => !room.impostorIds.includes(p.id))

  // All impostors eliminated - players win
  if (activeImpostors.length === 0 && activeNormalPlayers.length > 0) {
    return 'players'
  }

  // Impostors >= normal players - impostors win
  if (activeImpostors.length >= activeNormalPlayers.length) {
    return 'impostors'
  }

  // Check time limit
  if (room.timeStarted) {
    const elapsed = (Date.now() - room.timeStarted) / 1000
    if (elapsed >= room.settings.timeLimit) {
      return 'impostors' // Time up, impostors win
    }
  }

  return null
}

/**
 * Tally votes and determine who should be eliminated
 * Returns eliminated player ID or null if tie or majority skip
 */
export function tallyVotes(votes: Record<string, string>): {
  eliminatedId: string | null
  voteCounts: Record<string, number>
  tie: boolean
  skipVotes: number
  majoritySkipped: boolean
} {
  const voteCounts: Record<string, number> = {}
  let skipVotes = 0

  // Count votes
  for (const targetId of Object.values(votes)) {
    if (!targetId) {
      skipVotes++
      continue
    }
    voteCounts[targetId] = (voteCounts[targetId] || 0) + 1
  }

  const totalVotes = Object.keys(votes).length
  const majoritySkipped = skipVotes > totalVotes / 2

  // Find max votes
  const counts = Object.values(voteCounts)
  if (counts.length === 0) {
    return {
      eliminatedId: null,
      voteCounts: {},
      tie: true,
      skipVotes,
      majoritySkipped
    }
  }

  const maxVotes = Math.max(...counts)
  const playersWithMaxVotes = Object.entries(voteCounts)
    .filter(([_, count]) => count === maxVotes)
    .map(([id]) => id)

  // Tie if multiple players have same max votes
  const tie = playersWithMaxVotes.length > 1

  return {
    eliminatedId: tie ? null : playersWithMaxVotes[0],
    voteCounts,
    tie,
    skipVotes,
    majoritySkipped
  }
}

/**
 * Calculate remaining time for the game
 */
export function calculateRemainingTime(room: Room): number {
  if (!room.timeStarted) return room.settings.timeLimit

  const elapsed = Math.floor((Date.now() - room.timeStarted) / 1000)
  const remaining = room.settings.timeLimit - elapsed

  return Math.max(0, remaining)
}

/**
 * Format time in MM:SS format
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
