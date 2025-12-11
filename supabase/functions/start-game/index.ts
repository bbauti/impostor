import { createAdminClient, corsHeaders } from '../_shared/supabase-client.ts';
import { selectImpostors, selectSecretWord, type RoomState, type GameSettings } from '../_shared/game-logic.ts';
import { setGameState } from '../_shared/game-state-db.ts';
import { broadcastGameEvent, broadcastPrivateMessage } from '../_shared/broadcast.ts';

interface PlayerInfo {
  playerId: string;
  playerName: string;
  isReady: boolean;
  isHost: boolean;
}

interface StartGameRequest {
  roomId: string;
  playerId: string;
  players: PlayerInfo[];
  settings: GameSettings;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { roomId, playerId, players, settings } = await req.json() as StartGameRequest;

    // Validate host
    const host = players.find(p => p.isHost);
    if (!host || host.playerId !== playerId) {
      return new Response(
        JSON.stringify({ error: 'Solo el anfitrión puede iniciar el juego' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate all ready
    const allReady = players.every(p => p.isReady || p.isHost);
    if (!allReady) {
      return new Response(
        JSON.stringify({ error: 'Todos los jugadores deben estar listos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate minimum players
    if (players.length < 3) {
      return new Response(
        JSON.stringify({ error: 'Se necesitan al menos 3 jugadores' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Select word and impostors
    const secretWord = selectSecretWord(settings.categories);
    const impostorIds = selectImpostors(players, settings.impostorCount);

    // Store game state in database
    const roomState: RoomState = {
      secretWord,
      impostorIds,
      phase: 'role_reveal',
      votes: {},
      voteRound: 0,
      timeStarted: Date.now(),
      players: players.map(p => p.playerId),
      settings
    };

    await setGameState(roomId, roomState);

    // Send role assignments and phase change via Supabase Realtime
    const supabase = createAdminClient();

    // Send private role assignments to each player with retry logic
    const roleAssignmentPromises = players.map(async (player) => {
      const isImpostor = impostorIds.includes(player.playerId);
      const success = await broadcastPrivateMessage(
        supabase,
        roomId,
        player.playerId,
        'ROLE_ASSIGNED',
        {
          role: isImpostor ? 'impostor' : 'player',
          word: isImpostor ? null : secretWord
        }
      );
      if (!success) {
        console.warn(`[start-game] Failed to send role to player ${player.playerId}`);
      }
      return success;
    });

    // Broadcast phase change to all with retry logic
    const phaseChangePromise = broadcastGameEvent(
      supabase,
      roomId,
      'PHASE_CHANGE',
      { phase: 'role_reveal' }
    );

    // Wait for all broadcasts to complete (best effort)
    await Promise.all([...roleAssignmentPromises, phaseChangePromise]);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
