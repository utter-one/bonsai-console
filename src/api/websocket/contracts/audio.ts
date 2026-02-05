import { z } from 'zod';

/**
 * Supported audio output formats for TTS providers
 */
export const audioFormatValues = [
  'pcm_16000',
  'pcm_22050',
  'pcm_44100',
] as const;

/**
 * Audio output format identifier
 */
export type AudioFormat = typeof audioFormatValues[number];

/**
 * Schema for ASR configuration settings
 * Provides configuration for automatic speech recognition
 */
export const asrSettingsSchema = z.object({
  language: z.string().optional().describe('The language code for speech recognition (e.g., "en-US")'),
  dictionaryPhrases: z.array(z.string()).optional().describe('The phrases to add to the speech recognition dictionary'),
  audioFormat: z.enum(audioFormatValues).optional().describe('Audio input format for speech recognition (e.g., "pcm_16000")'),
}).describe('ASR provider settings');

export const asrConfigSchema = z.object({
  asrProviderId: z.string().optional().describe('ID of the ASR provider (e.g., "azure-speech", "openai-whisper")'),
  settings: asrSettingsSchema.optional().describe('ASR-specific settings including model, language preferences, etc.'),
}).optional().describe('ASR configuration settings');

export type AsrConfig = z.infer<typeof asrConfigSchema>;
export type AsrSettings = z.infer<typeof asrSettingsSchema>;