import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

interface BroadcastOptions {
  maxRetries?: number;
  retryDelayMs?: number;
}

/**
 * Broadcasts a message to a room channel with retry logic.
 * Ensures game state updates are delivered reliably.
 */
export async function broadcastWithRetry(
  supabase: SupabaseClient,
  roomId: string,
  event: string,
  payload: unknown,
  options: BroadcastOptions = {}
): Promise<boolean> {
  const { maxRetries = 2, retryDelayMs = 100 } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const channel = supabase.channel(`room:${roomId}`);

      const result = await channel.send({
        type: 'broadcast',
        event,
        payload
      });

      // Clean up the temporary channel
      await supabase.removeChannel(channel);

      if (result === 'ok') {
        return true;
      }
    }
    catch (error) {
    }

    // Wait before retrying (exponential backoff)
    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, retryDelayMs * (attempt + 1)));
    }
  }

  return false;
}

/**
 * Broadcasts a game event to all players in a room.
 */
export async function broadcastGameEvent(
  supabase: SupabaseClient,
  roomId: string,
  eventType: string,
  eventPayload: unknown
): Promise<boolean> {
  return broadcastWithRetry(supabase, roomId, 'game_event', {
    type: eventType,
    payload: eventPayload
  });
}

/**
 * Broadcasts a private message to a specific player.
 */
export async function broadcastPrivateMessage(
  supabase: SupabaseClient,
  roomId: string,
  playerId: string,
  eventType: string,
  eventPayload: unknown
): Promise<boolean> {
  return broadcastWithRetry(supabase, roomId, `private:${playerId}`, {
    type: eventType,
    payload: eventPayload
  });
}
