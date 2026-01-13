// Audio file lookup and management utility
// Generates MD5 hashes of text to match generated audio files

import { createHash } from 'crypto';

const AUDIO_FORMAT = 'mp3';
const BASE_AUDIO_PATH = '/audio';

/**
 * Generate MD5 hash for audio filename (matches tts-generator.ts)
 * Uses first 8 characters of MD5 hash of "{type}-{id}-{text}"
 */
function generateAudioHash(type: string, id: string, text: string): string {
  const input = `${type}-${id}-${text}`;
  return createHash('md5')
    .update(input)
    .digest('hex')
    .substring(0, 8);
}

/**
 * Get audio URL for a character
 */
export function getCharacterAudioUrl(romaji: string, hiragana?: string): string | undefined {
  // If hiragana is provided, use it for the text part of the hash to match generator
  const hash = generateAudioHash('character', romaji, hiragana || romaji);
  return `${BASE_AUDIO_PATH}/characters/${hash}.${AUDIO_FORMAT}`;
}

/**
 * Get audio URL for vocabulary
 */
export function getVocabularyAudioUrl(id: string, word: string): string | undefined {
  const hash = generateAudioHash('vocabulary', id, word);
  return `${BASE_AUDIO_PATH}/vocabulary/${hash}.${AUDIO_FORMAT}`;
}

/**
 * Get audio URL for grammar example
 */
export function getGrammarAudioUrl(id: string, exampleText: string, exampleIndex: number): string | undefined {
  const hash = generateAudioHash('grammar', `${id}-example-${exampleIndex}`, exampleText);
  return `${BASE_AUDIO_PATH}/grammar/${hash}.${AUDIO_FORMAT}`;
}

/**
 * Get audio URL for kanji
 */
export function getKanjiAudioUrl(id: string, kanji: string, reading?: string): string | undefined {
  // Use provided reading or fall back to kanji character for the hash
  const hash = generateAudioHash('kanji', id, reading || kanji);
  return `${BASE_AUDIO_PATH}/kanji/${hash}.${AUDIO_FORMAT}`;
}

/**
 * Check if audio file exists by attempting to load it
 * Returns a promise that resolves to the URL if the file exists, undefined if not
 */
export async function checkAudioExists(audioUrl: string): Promise<string | undefined> {
  try {
    const response = await fetch(audioUrl, { method: 'HEAD' });
    return response.ok ? audioUrl : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Check if multiple audio files exist
 * Returns a promise that resolves when all checks complete
 */
export async function checkAudioFilesExist(urls: string[]): Promise<Map<string, boolean>> {
  const results = new Map<string, boolean>();
  const promises = urls.map(async (url) => {
    const exists = await checkAudioExists(url);
    results.set(url, !!exists);
  });
  await Promise.all(promises);
  return results;
}
