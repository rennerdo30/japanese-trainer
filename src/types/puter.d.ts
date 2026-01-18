// Type declarations for Puter.js TTS API
// https://developer.puter.com/tutorials/free-unlimited-text-to-speech-api/

declare global {
  interface Window {
    puter?: PuterAPI;
  }
}

export interface PuterAPI {
  ai: PuterAI;
}

export interface PuterAI {
  txt2speech: (
    text: string,
    options?: PuterTTSOptions
  ) => Promise<PuterAudioResponse>;
}

export interface PuterTTSOptions {
  /** TTS provider to use. Defaults to AWS Polly */
  provider?: 'aws-polly' | 'openai' | 'elevenlabs';
  /** Model to use (provider-specific) */
  model?: string;
  /** Voice ID for ElevenLabs provider */
  voice?: string;
  /** Language code (provider-specific) */
  language?: string;
}

export interface PuterAudioResponse {
  /** Play the audio immediately */
  play: () => Promise<void>;
  /** Get the audio as a Blob */
  blob: () => Promise<Blob>;
  /** Get the audio as an ArrayBuffer */
  arrayBuffer: () => Promise<ArrayBuffer>;
}

export {};
