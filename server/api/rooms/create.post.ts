import { nanoid } from 'nanoid';
import { serverSupabaseClient } from '#supabase/server';
import type { GameSettings } from '../../../app/types/game';
import { MIN_PLAYERS, MAX_PLAYERS, MIN_IMPOSTORS, MAX_IMPOSTORS, MIN_TIME_LIMIT, MAX_TIME_LIMIT } from '../../../app/utils/constants';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  // Validate settings
  const { maxPlayers, impostorCount, categories, timeLimit } = body as GameSettings;

  if (!maxPlayers || maxPlayers < MIN_PLAYERS || maxPlayers > MAX_PLAYERS) {
    throw createError({
      statusCode: 400,
      message: `Max players must be between ${MIN_PLAYERS} and ${MAX_PLAYERS}`
    });
  }

  if (!impostorCount || impostorCount < MIN_IMPOSTORS || impostorCount > MAX_IMPOSTORS) {
    throw createError({
      statusCode: 400,
      message: `Impostor count must be between ${MIN_IMPOSTORS} and ${MAX_IMPOSTORS}`
    });
  }

  if (impostorCount >= maxPlayers / 2) {
    throw createError({
      statusCode: 400,
      message: 'Impostors cannot be more than 50% of players'
    });
  }

  if (!categories || categories.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'At least one category must be selected'
    });
  }

  // timeLimit is received in seconds, validate against minute constants converted to seconds
  const minSeconds = MIN_TIME_LIMIT * 60;
  const maxSeconds = MAX_TIME_LIMIT * 60;

  if (!timeLimit || timeLimit < minSeconds || timeLimit > maxSeconds) {
    throw createError({
      statusCode: 400,
      message: `Time limit must be between ${MIN_TIME_LIMIT} and ${MAX_TIME_LIMIT} minutes`
    });
  }

  // Generate room ID (6 characters, uppercase) and creator ID
  const roomId = nanoid(6).toUpperCase();
  const creatorId = `creator_${Date.now()}_${nanoid(9)}`;

  const settings = {
    maxPlayers,
    impostorCount,
    categories,
    timeLimit
  };

  // Save room to database
  const supabase = await serverSupabaseClient(event);
  const { error } = await supabase
    .from('rooms')
    .insert({
      room_id: roomId,
      creator_id: creatorId,
      settings
    });

  if (error) {
    throw createError({
      statusCode: 500,
      message: 'Failed to create room'
    });
  }

  return {
    success: true,
    roomId,
    creatorId,
    settings
  };
});
