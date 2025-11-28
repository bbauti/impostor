import { roomManager } from './room-manager'
import { MessageType } from '../../app/types/websocket'
import { selectImpostors, selectSecretWord, checkWinCondition, tallyVotes } from '../../app/utils/game-logic'
import type { Room, VoteResult, GameOverData } from '../../app/types/game'
import { ROLE_REVEAL_DURATION } from '../../app/utils/constants'

/**
 * Start the game: assign roles, select word, notify players
 */
export function startGame(roomId: string): boolean {
  const room = roomManager.getRoom(roomId)
  if (!room) return false

  // Validate state
  if (room.phase !== 'waiting') return false
  if (room.players.length < 3) return false

  // Select secret word
  const secretWord = selectSecretWord(room.settings.categories)

  // Select impostors
  const impostorIds = selectImpostors(room.players, room.settings.impostorCount)

  // Update room
  room.secretWord = secretWord
  room.impostorIds = impostorIds
  room.phase = 'role_reveal'
  room.timeStarted = Date.now()

  // Set all players to playing status
  room.players.forEach(player => {
    player.status = 'playing'
  })

  // Send role assignments to each player individually
  for (const player of room.players) {
    const isImpostor = impostorIds.includes(player.id)

    roomManager.sendToPlayer(player.id, {
      type: MessageType.ROLE_ASSIGNED,
      payload: {
        role: isImpostor ? 'impostor' : 'player',
        word: isImpostor ? null : secretWord
      },
      timestamp: Date.now()
    })
  }

  // Broadcast room update with new player statuses
  roomManager.broadcastToRoom(roomId, {
    type: MessageType.ROOM_UPDATE,
    payload: { room: roomManager.toClientRoomInfo(room) },
    timestamp: Date.now()
  })

  // Broadcast phase change to all
  roomManager.broadcastToRoom(roomId, {
    type: MessageType.PHASE_CHANGE,
    payload: { phase: 'role_reveal' },
    timestamp: Date.now()
  })

  console.log(`[Game] Started game in room ${roomId}`)
  console.log(`[Game] Secret word: ${secretWord}`)
  console.log(`[Game] Impostors: ${impostorIds.join(', ')}`)

  // Auto-transition to discussion after reveal duration
  setTimeout(() => {
    transitionToDiscussion(roomId)
  }, ROLE_REVEAL_DURATION)

  return true
}

/**
 * Transition from role reveal to discussion phase
 */
export function transitionToDiscussion(roomId: string): void {
  const room = roomManager.getRoom(roomId)
  if (!room || room.phase !== 'role_reveal') return

  room.phase = 'discussion'

  roomManager.broadcastToRoom(roomId, {
    type: MessageType.PHASE_CHANGE,
    payload: { phase: 'discussion' },
    timestamp: Date.now()
  })

  console.log(`[Game] Room ${roomId} entered discussion phase`)
}

/**
 * Start voting phase
 */
export function startVoting(roomId: string): void {
  const room = roomManager.getRoom(roomId)
  if (!room || room.phase !== 'discussion') return

  room.phase = 'voting'
  room.votes = {}
  room.voteRound = (room.voteRound || 0) + 1

  roomManager.broadcastToRoom(roomId, {
    type: MessageType.PHASE_CHANGE,
    payload: { phase: 'voting', voteRound: room.voteRound },
    timestamp: Date.now()
  })

  console.log(`[Game] Room ${roomId} started voting (round ${room.voteRound})`)
}

/**
 * Process votes and handle elimination
 */
export function processVotes(roomId: string): void {
  const room = roomManager.getRoom(roomId)
  if (!room || room.phase !== 'voting') return

  // Tally votes
  const { eliminatedId, voteCounts, tie, skipVotes, majoritySkipped } = tallyVotes(room.votes)

  let wasImpostor = false

  // Eliminate player only if there's a clear decision (no tie, not majority skip)
  if (eliminatedId && !tie && !majoritySkipped) {
    const player = room.players.find(p => p.id === eliminatedId)
    if (player) {
      player.status = 'spectating'
      wasImpostor = room.impostorIds.includes(eliminatedId)
    }
  }

  // Broadcast vote results
  const voteResult: VoteResult = {
    eliminatedId,
    wasImpostor,
    voteCounts,
    tie,
    skipVotes,
    revote: false, // No longer using re-votes
    voteRound: 1
  }

  roomManager.broadcastToRoom(roomId, {
    type: MessageType.VOTE_RESULTS,
    payload: voteResult,
    timestamp: Date.now()
  })

  if (tie) {
    console.log(`[Game] Room ${roomId} vote ended in tie - returning to discussion`)
  } else if (majoritySkipped) {
    console.log(`[Game] Room ${roomId} majority voted to skip - returning to discussion`)
  } else {
    console.log(`[Game] Room ${roomId} vote results:`, voteResult)
  }

  // Check win condition (only if someone was eliminated)
  const winner = eliminatedId && !tie && !majoritySkipped ? checkWinCondition(room) : null

  if (winner) {
    // Game over
    setTimeout(() => {
      endGame(roomId, winner)
    }, 3000) // 3 seconds to show results
  } else {
    // Return to discussion (either no one eliminated, tie, or majority skip)
    setTimeout(() => {
      room.phase = 'discussion'
      room.votes = {}
      room.voteRound = 0

      roomManager.broadcastToRoom(roomId, {
        type: MessageType.PHASE_CHANGE,
        payload: { phase: 'discussion' },
        timestamp: Date.now()
      })

      console.log(`[Game] Room ${roomId} returned to discussion`)
    }, 3000)
  }
}

/**
 * End the game and show results
 */
export function endGame(roomId: string, winner: 'players' | 'impostors'): void {
  const room = roomManager.getRoom(roomId)
  if (!room) return

  room.phase = 'ended'

  const gameOverData: GameOverData = {
    winner,
    secretWord: room.secretWord!,
    impostorIds: room.impostorIds,
    players: room.players
  }

  roomManager.broadcastToRoom(roomId, {
    type: MessageType.GAME_OVER,
    payload: gameOverData,
    timestamp: Date.now()
  })

  console.log(`[Game] Room ${roomId} ended. Winner: ${winner}`)
}

/**
 * Check if all votes have been cast
 */
export function checkAllVotesCast(room: Room): boolean {
  const activePlayers = room.players.filter(p => p.status === 'playing')
  return activePlayers.every(p => p.id in room.votes)
}
