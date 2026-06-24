const AUDIO_EXTENSIONS: Record<string, string> = {
  'audio/pcm': '.raw',
  'audio/x-pcm': '.raw',
  'audio/basic': '.au',
  'audio/wav': '.wav',
  'audio/x-wav': '.wav',
  'audio/mpeg': '.mp3',
  'audio/mp3': '.mp3',
  'audio/opus': '.opus',
  'audio/ogg': '.ogg',
  'audio/webm': '.webm',
  'audio/flac': '.flac',
  'audio/aac': '.aac',
  'audio/x-m4a': '.m4a',
}

export function getArtifactExtension(mimeType: string): string {
  if (AUDIO_EXTENSIONS[mimeType]) return AUDIO_EXTENSIONS[mimeType]
  if (mimeType.startsWith('audio/')) return '.bin'
  if (mimeType === 'text/plain') return '.txt'
  if (mimeType === 'application/json') return '.json'
  if (mimeType.startsWith('text/')) return '.txt'
  if (mimeType.startsWith('image/png')) return '.png'
  if (mimeType.startsWith('image/jpeg')) return '.jpg'
  if (mimeType.startsWith('image/')) return '.png'
  return '.bin'
}
