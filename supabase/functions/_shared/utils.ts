import { corsHeaders } from './supabase-client.ts';

/**
 * HTML entities for XSS prevention
 */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  '\'': '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

/**
 * Escapes HTML special characters to prevent XSS attacks.
 */
export function escapeHtml(str: string): string {
  return str.replace(/[&<>"'`=/]/g, char => HTML_ENTITIES[char] || char);
}

/**
 * Sanitizes user content (chat messages, etc.)
 * Trims, truncates to max length, and escapes HTML.
 */
export function sanitizeContent(content: string, maxLength = 500): string {
  return escapeHtml(content.trim().slice(0, maxLength));
}

/**
 * Sanitizes player names.
 * Trims, truncates to max length, and escapes HTML.
 */
export function sanitizeName(name: string, maxLength = 20): string {
  return escapeHtml(name.trim().slice(0, maxLength));
}

/**
 * Creates a JSON response with CORS headers.
 */
export function createJsonResponse(
  data: unknown,
  status = 200
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

/**
 * Creates a success response.
 */
export function successResponse(data: Record<string, unknown> = {}): Response {
  return createJsonResponse({ success: true, ...data });
}

/**
 * Creates an error response.
 */
export function errorResponse(
  message: string,
  status = 400,
  details?: string
): Response {
  const body: Record<string, unknown> = { error: message };
  if (details) {
    body.details = details;
  }
  return createJsonResponse(body, status);
}

/**
 * Wraps an edge function handler with standard error handling and CORS.
 */
export function createHandler(
  handler: (req: Request) => Promise<Response>
): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    try {
      return await handler(req);
    }
    catch (error) {
      return errorResponse(
        'Internal server error',
        500,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  };
}
