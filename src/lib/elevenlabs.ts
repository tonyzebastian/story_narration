import type { TTSOptions, Voice } from '@/types';

export class ElevenLabsClient {
  private apiKey: string;
  private baseURL = 'https://api.elevenlabs.io/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getVoices(): Promise<Voice[]> {
    const response = await fetch(`${this.baseURL}/voices`, {
      headers: { 'xi-api-key': this.apiKey },
    });
    if (!response.ok) throw new Error(`ElevenLabs API error: ${response.statusText}`);
    const data = await response.json();
    return data.voices as Voice[];
  }

  async textToSpeech(text: string, voiceId: string, options: TTSOptions = {}): Promise<Blob> {
    const response = await fetch(`${this.baseURL}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: options.modelId || 'eleven_monolingual_v1',
        voice_settings: {
          stability: options.stability ?? 0.5,
          similarity_boost: options.similarityBoost ?? 0.5,
        },
        output_format: options.outputFormat || 'mp3_22050_32',
      }),
    });
    if (!response.ok) throw new Error(`ElevenLabs API error: ${response.statusText}`);
    return await response.blob();
  }
}


