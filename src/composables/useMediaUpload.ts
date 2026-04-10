export interface AudioUploadResult {
  data: string
  format: 'pcm' | 'mp3' | 'wav' | 'opus'
  mimeType: string
  metadata: Record<string, never>
}

export interface ImageUploadResult {
  data: string
  mimeType: string
  metadata: { width: number; height: number }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result
      if (typeof result === 'string') resolve(result)
      else reject(new Error('Failed to read file'))
    }
    reader.onerror = () => reject(new Error('FileReader error'))
    reader.readAsDataURL(file)
  })
}

export function useMediaUpload() {
  async function processAudio(event: Event): Promise<AudioUploadResult | null> {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    if (!file) return null

    const dataUrl = await readFileAsDataUrl(file)
    const parts = dataUrl.split(',')
    if (parts.length !== 2) return null

    const header = parts[0]!
    const base64Data = parts[1]!
    const mimeType = header.match(/:(.*?);/)?.[1] || 'audio/mpeg'

    let format: 'pcm' | 'mp3' | 'wav' | 'opus' = 'mp3'
    if (mimeType.includes('wav')) format = 'wav'
    else if (mimeType.includes('opus')) format = 'opus'
    else if (mimeType.includes('pcm')) format = 'pcm'

    return { data: base64Data, format, mimeType, metadata: {} as Record<string, never> }
  }

  async function processImage(event: Event): Promise<ImageUploadResult | null> {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    if (!file) return null

    const dataUrl = await readFileAsDataUrl(file)
    const parts = dataUrl.split(',')
    if (parts.length !== 2) return null

    const header = parts[0]!
    const base64Data = parts[1]!
    const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png'

    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        resolve({
          data: base64Data,
          mimeType,
          metadata: { width: img.width, height: img.height },
        })
      }
      img.onerror = () => resolve(null)
      img.src = dataUrl
    })
  }

  return { processAudio, processImage }
}
