import { createAdminClient, corsHeaders } from "../_shared/supabase-client.ts"
import { tallyVotes, checkWinCondition } from "../_shared/game-logic.ts"
import { getGameState, setGameState } from "../_shared/game-state-db.ts"
import { broadcastGameEvent } from "../_shared/broadcast.ts"

interface CastVoteRequest {
  roomId: string
  playerId: string
  targetId: string | null
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { roomId, playerId, targetId } = (await req.json()) as CastVoteRequest

    const room = await getGameState(roomId)

    if (!room) {
      return new Response(JSON.stringify({ error: "Room not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Validate phase
    if (room.phase !== "voting") {
      return new Response(JSON.stringify({ error: "No es fase de votación" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Validate player is in room
    if (!room.players.includes(playerId)) {
      return new Response(JSON.stringify({ error: "No estás en esta sala" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Record vote
    room.votes[playerId] = targetId || ""

    // Update database
    await setGameState(roomId, room)

    // Broadcast vote update with retry logic
    const supabase = createAdminClient()
    await broadcastGameEvent(supabase, roomId, "VOTE_UPDATE", {
      votes: room.votes,
      voterId: playerId,
      targetId,
    })

    // Check if all votes cast
    const allVoted = room.players.every((pid) => pid in room.votes)

    if (allVoted) {
      // Process votes
      const { eliminatedId, voteCounts, tie, skipVotes, majoritySkipped } =
        tallyVotes(room.votes)

      let wasImpostor = false
      const eliminatedPlayers: string[] = []

      // Handle elimination
      if (eliminatedId && !tie && !majoritySkipped) {
        wasImpostor = room.impostorIds.includes(eliminatedId)
        eliminatedPlayers.push(eliminatedId)
        // Remove from active players
        room.players = room.players.filter((p) => p !== eliminatedId)
      }

      // Broadcast vote results with retry logic
      await broadcastGameEvent(supabase, roomId, "VOTE_RESULTS", {
        eliminatedId:
          eliminatedId && !tie && !majoritySkipped ? eliminatedId : null,
        wasImpostor,
        voteCounts,
        tie,
        skipVotes,
        revote: false,
        voteRound: room.voteRound,
      })

      // Check win condition
      const winner =
        eliminatedId && !tie && !majoritySkipped
          ? checkWinCondition(room.players, room.impostorIds, eliminatedPlayers)
          : null

      if (winner) {
        // Game over - update phase and broadcast
        room.phase = "ended"
        await setGameState(roomId, room)

        await broadcastGameEvent(supabase, roomId, "GAME_OVER", {
          winner,
          secretWord: room.secretWord,
          impostorIds: room.impostorIds,
        })

        // Delete chat messages for this room
        await supabase.from("chat_messages").delete().eq("room_id", roomId)
      } else {
        // Return to discussion
        room.phase = "discussion"
        room.votes = {}
        await setGameState(roomId, room)

        await broadcastGameEvent(supabase, roomId, "PHASE_CHANGE", {
          phase: "discussion",
        })
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
