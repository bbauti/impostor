import { getRandomWord, getRandomWordWithCategory, type WordSelection } from '~/data/words';

export function selectSecretWord(categories: string[]): string {
  return getRandomWord(categories);
}

export function selectSecretWordWithCategory(categories: string[]): WordSelection {
  return getRandomWordWithCategory(categories);
}

/**
 * Format time in MM:SS format
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
