import { createAdminClient, corsHeaders } from '../_shared/supabase-client.ts';

interface SendChatMessageRequest {
  roomId: string;
  playerId: string;
  playerName: string;
  content: string;
}

const MAX_MESSAGE_LENGTH = 500;
const COOLDOWN_MS = 1000;

const htmlEntities: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  '\'': '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

function escapeHtml(str: string): string {
  return str.replace(/[&<>"'`=/]/g, char => htmlEntities[char] || char);
}

function sanitizeContent(content: string): string {
  const trimmed = content.trim();
  const truncated = trimmed.slice(0, MAX_MESSAGE_LENGTH);
  return escapeHtml(truncated);
}

function sanitizeName(name: string): string {
  const trimmed = name.trim();
  const truncated = trimmed.slice(0, 20);
  return escapeHtml(truncated);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { roomId, playerId, playerName, content } = await req.json() as SendChatMessageRequest;

    // Validate required fields
    if (!roomId || !playerId || !playerName || !content) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate content is not empty after trim
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      return new Response(
        JSON.stringify({ error: 'Message cannot be empty' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createAdminClient();

    // Check rate limit - get player's last message
    const { data: lastMessages } = await supabase
      .from('chat_messages')
      .select('created_at')
      .eq('room_id', roomId)
      .eq('player_id', playerId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (lastMessages && lastMessages.length > 0) {
      const lastMessageTime = new Date(lastMessages[0].created_at).getTime();
      const now = Date.now();

      if (now - lastMessageTime < COOLDOWN_MS) {
        return new Response(
          JSON.stringify({ error: 'Espera un segundo antes de enviar otro mensaje' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Sanitize inputs
    const sanitizedContent = sanitizeContent(trimmedContent);
    const sanitizedName = sanitizeName(playerName);

    // Insert message into database
    const { data: message, error: insertError } = await supabase
      .from('chat_messages')
      .insert({
        room_id: roomId,
        player_id: playerId,
        player_name: sanitizedName,
        content: sanitizedContent
      })
      .select()
      .single();

    if (insertError) {
      return new Response(
        JSON.stringify({ error: 'Failed to save message' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Broadcast message via realtime channel
    await supabase.channel(`room:${roomId}`).send({
      type: 'broadcast',
      event: 'game_event',
      payload: {
        type: 'CHAT_MESSAGE',
        payload: {
          id: message.id,
          roomId: message.room_id,
          playerId: message.player_id,
          playerName: message.player_name,
          content: message.content,
          createdAt: message.created_at
        }
      }
    });

    return new Response(
      JSON.stringify({ success: true, message }),
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
