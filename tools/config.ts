// Configuration for ElevenLabs TTS generation

export const DEFAULT_CONFIG = {
  // Default Japanese voice settings
  // These are verified Japanese voice IDs from ElevenLabs
  // Users should verify these work with their account
  DEFAULT_JAPANESE_VOICE_IDS: [
    'GxxMAMfQkDlnqjpzjLHH', // Kozy - Male, Tokyo standard accent (recommended for educational content)
    'FMgBdHe1YV2Xi0B9anXW', // Hideo - Male, Japanese Asian accent
    'GKDaBI8TKSBJVhsCLD6n', // Asahi - Male, general Japanese speech synthesis
  ],

  // API endpoints
  API_BASE_URL: 'https://api.elevenlabs.io/v1',

  // Voice settings
  VOICE_SETTINGS: {
    stability: 1.0, // Set to 1.0 to comply with v3 constraints (0, 0.5, or 1) and reduce noise
    similarity_boost: 0.75,
    style: 0.0,
    use_speaker_boost: true,
  },

  // Model settings
  DEFAULT_MODEL_ID: 'eleven_v3', // Most advanced multilingual model

  // Rate limiting
  RATE_LIMIT_DELAY_MS: 100, // Delay between requests to respect rate limits
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,

  // Audio settings
  AUDIO_FORMAT: 'mp3',
  AUDIO_QUALITY: 'high',

  // Output directories
  DEFAULT_OUTPUT_DIR: 'public/audio',
  CHARACTERS_DIR: 'characters',
  VOCABULARY_DIR: 'vocabulary',
  GRAMMAR_DIR: 'grammar',
  KANJI_DIR: 'kanji',
  READING_DIR: 'reading',
  LISTENING_DIR: 'listening',

  // Piper TTS settings
  PIPER_DEFAULT_MODEL: 'ja_JP-shinji-medium', // Default Japanese model name
  PIPER_LENGTH_SCALE: 1.0, // Speech speed (1.0 = normal)
  PIPER_NOISE_SCALE: 0.667, // Voice variation
  PIPER_NOISE_W: 0.8, // Phoneme duration variation

  // Kokoro TTS settings
  KOKORO_DEFAULT_VOICE: 'jf_alpha', // Default Japanese voice
  KOKORO_VOICE_IDS: [
    'jf_alpha',      // Alpha - Clear, standard Japanese (Recommended)
    'jf_tebukuro',   // Tebukuro - Gentle, warm (Excellent for learning)
    'jm_kumo',       // Kumo - Deep, calm (Male)
    'jf_gongitsune', // Gongitsune - Soft, storytelling
    'jf_nezumi',     // Nezumi - Cute, energetic
  ],
  KOKORO_SPEED: 1.0, // Speech speed (1.0 = normal)
  KOKORO_SILENCE: 500, // Trailing silence in ms to avoid audio cutoff
} as const;

export interface Config {
  apiKey: string;
  voiceId?: string;
  modelId?: string;
  outputDir: string;
  updateJson: boolean;
  dryRun: boolean;
}
