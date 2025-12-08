import { createAdminClient, corsHeaders } from '../_shared/supabase-client.ts';
import { selectImpostors, selectSecretWord, type RoomState, type GameSettings } from '../_shared/game-logic.ts';
import { setGameState } from '../_shared/game-state-db.ts';

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

    // Send private role assignments to each player
    for (const player of players) {
      const isImpostor = impostorIds.includes(player.playerId);

      await supabase.channel(`room:${roomId}`).send({
        type: 'broadcast',
        event: `private:${player.playerId}`,
        payload: {
          type: 'ROLE_ASSIGNED',
          payload: {
            role: isImpostor ? 'impostor' : 'player',
            word: isImpostor ? null : secretWord
          }
        }
      });
    }

    // Broadcast phase change to all
    await supabase.channel(`room:${roomId}`).send({
      type: 'broadcast',
      event: 'game_event',
      payload: {
        type: 'PHASE_CHANGE',
        payload: { phase: 'role_reveal' }
      }
    });

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
