// ElevenLabs API client for text-to-speech generation

import axios, { AxiosInstance } from 'axios';
import { DEFAULT_CONFIG } from '../config';
import { ElevenLabsConfig } from '../types';

export class ElevenLabsClient {
  private apiKey: string;
  private voiceId: string;
  private modelId: string;
  private client: AxiosInstance;
  private config: ElevenLabsConfig;

  constructor(config: ElevenLabsConfig) {
    this.apiKey = config.apiKey;
    this.voiceId = config.voiceId || DEFAULT_CONFIG.DEFAULT_JAPANESE_VOICE_IDS[0];
    this.modelId = config.modelId || DEFAULT_CONFIG.DEFAULT_MODEL_ID;

    this.config = {
      apiKey: config.apiKey,
      stability: config.stability ?? DEFAULT_CONFIG.VOICE_SETTINGS.stability,
      similarityBoost: config.similarityBoost ?? DEFAULT_CONFIG.VOICE_SETTINGS.similarity_boost,
      style: config.style ?? DEFAULT_CONFIG.VOICE_SETTINGS.style,
      useSpeakerBoost: config.useSpeakerBoost ?? DEFAULT_CONFIG.VOICE_SETTINGS.use_speaker_boost,
    };

    this.client = axios.create({
      baseURL: DEFAULT_CONFIG.API_BASE_URL,
      headers: {
        'xi-api-key': this.apiKey,
      },
      responseType: 'arraybuffer',
    });
  }

  /**
   * Generate audio from text using ElevenLabs TTS
   */
  async generateAudio(text: string): Promise<Buffer> {
    try {
      const response = await this.client.post(
        `/text-to-speech/${this.voiceId}`,
        {
          text,
          model_id: this.modelId,
          language_code: "ja", // Explicitly set to Japanese for better pronunciation of short strings
          voice_settings: {
            stability: this.config.stability,
            similarity_boost: this.config.similarityBoost,
            style: this.config.style,
            use_speaker_boost: this.config.useSpeakerBoost,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return Buffer.from(response.data);
    } catch (error: any) {
      if (error.response) {
        const status = error.response.status;
        const statusText = error.response.statusText;
        let errorMessage = `ElevenLabs API error: ${status} - ${statusText}`;

        // Try to extract more detailed error message from response
        // Note: When responseType is 'arraybuffer', error data might be a Buffer
        if (error.response.data) {
          try {
            let errorData;
            if (Buffer.isBuffer(error.response.data)) {
              const text = error.response.data.toString('utf-8');
              errorData = text ? JSON.parse(text) : null;
            } else if (typeof error.response.data === 'string') {
              errorData = error.response.data ? JSON.parse(error.response.data) : null;
            } else {
              errorData = error.response.data;
            }

            if (errorData) {
              if (errorData.detail?.message) {
                errorMessage += ` - ${errorData.detail.message}`;
              } else if (errorData.detail) {
                // Handle different detail formats
                if (typeof errorData.detail === 'string') {
                  errorMessage += ` - ${errorData.detail}`;
                } else {
                  errorMessage += ` - ${JSON.stringify(errorData.detail)}`;
                }
              } else if (errorData.message) {
                errorMessage += ` - ${errorData.message}`;
              } else if (typeof errorData === 'string') {
                errorMessage += ` - ${errorData}`;
              }
            }
          } catch (e) {
            // If parsing fails, try to show raw data
            if (error.response.data && typeof error.response.data === 'string') {
              errorMessage += ` - ${error.response.data.substring(0, 200)}`;
            } else if (Buffer.isBuffer(error.response.data)) {
              const text = error.response.data.toString('utf-8').substring(0, 200);
              if (text) {
                errorMessage += ` - ${text}`;
              }
            }
          }
        }

        throw new Error(errorMessage);
      }
      throw new Error(`Failed to generate audio: ${error.message}`);
    }
  }

  /**
   * Get available voices (for verification)
   */
  async getVoices(): Promise<any[]> {
    try {
      const response = await axios.get(`${DEFAULT_CONFIG.API_BASE_URL}/voices`, {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });
      return response.data.voices || [];
    } catch (error: any) {
      if (error.response) {
        const status = error.response.status;
        const statusText = error.response.statusText;
        let errorMessage = `Request failed with status code ${status}`;

        if (error.response.data) {
          try {
            let errorData;
            if (Buffer.isBuffer(error.response.data)) {
              const text = error.response.data.toString('utf-8');
              errorData = text ? JSON.parse(text) : null;
            } else if (typeof error.response.data === 'string') {
              errorData = error.response.data ? JSON.parse(error.response.data) : null;
            } else {
              errorData = error.response.data;
            }

            if (errorData) {
              if (errorData.detail?.message) {
                errorMessage = errorData.detail.message;
              } else if (errorData.detail) {
                errorMessage = typeof errorData.detail === 'string'
                  ? errorData.detail
                  : JSON.stringify(errorData.detail);
              } else if (errorData.message) {
                errorMessage = errorData.message;
              }
            }
          } catch (e) {
            // If parsing fails, try to show raw data
            if (typeof error.response.data === 'string') {
              errorMessage = error.response.data;
            } else if (Buffer.isBuffer(error.response.data)) {
              const text = error.response.data.toString('utf-8');
              if (text) {
                errorMessage = text;
              }
            }
          }
        }
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  /**
   * Verify API key and voice ID
   */
  async verify(): Promise<boolean> {
    try {
      const voices = await this.getVoices();
      const voiceExists = voices.some((v: any) => v.voice_id === this.voiceId);

      if (!voiceExists && voices.length > 0) {
        console.warn(`Voice ID ${this.voiceId} not found. Available voices:`,
          voices.map((v: any) => ({ id: v.voice_id, name: v.name })));
      } else if (voices.length === 0) {
        console.warn('No voices found. API key may be invalid or account may have no voices.');
      }

      return true;
    } catch (error: any) {
      // Don't throw, just log the warning - verification failure shouldn't stop generation
      console.warn('Could not verify API connection:', error.message);
      return true; // Continue anyway, let the actual generation fail if there's a problem
    }
  }
}
