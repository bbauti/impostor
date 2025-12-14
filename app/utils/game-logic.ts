import { getRandomWord } from '~/data/words';

/**
 * Select a random word from the configured categories
 */
export function selectSecretWord(categories: string[]): string {
  return getRandomWord(categories);
}

/**
 * Format time in MM:SS format
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
