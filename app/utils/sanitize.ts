const htmlEntities: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
  "`": "&#x60;",
  "=": "&#x3D;",
}

/**
 * Escapes HTML special characters to prevent XSS attacks
 */
export function escapeHtml(str: string): string {
  return str.replace(/[&<>"'`=/]/g, (char) => htmlEntities[char] || char)
}

/**
 * Sanitizes chat message content:
 * - Escapes HTML entities
 * - Trims whitespace
 * - Limits length
 */
export function sanitizeChatMessage(content: string, maxLength = 500): string {
  const trimmed = content.trim()
  const truncated = trimmed.slice(0, maxLength)
  return escapeHtml(truncated)
}

/**
 * Sanitizes player name:
 * - Escapes HTML entities
 * - Trims whitespace
 * - Limits length
 */
export function sanitizePlayerName(name: string, maxLength = 20): string {
  const trimmed = name.trim()
  const truncated = trimmed.slice(0, maxLength)
  return escapeHtml(truncated)
}
