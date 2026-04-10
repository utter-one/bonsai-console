import { ref } from 'vue'

export function useCopyPaste<T>(label: string) {
  const clipboardData = ref<T[] | null>(null)
  const showPasteModal = ref(false)

  function copyAll(items: T[]): void {
    if (items.length === 0) {
      alert(`No ${label}s to copy`)
      return
    }
    try {
      navigator.clipboard.writeText(JSON.stringify(items, null, 2))
      alert(`Copied ${items.length} ${label}(s) to clipboard`)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
      alert(`Failed to copy ${label}s to clipboard`)
    }
  }

  async function openPasteModal(): Promise<void> {
    try {
      const text = await navigator.clipboard.readText()
      if (!text) { alert('Clipboard is empty'); return }
      let parsed: T[]
      try {
        parsed = JSON.parse(text)
      } catch {
        alert('Clipboard does not contain valid JSON data'); return
      }
      if (!Array.isArray(parsed)) {
        alert(`Clipboard does not contain valid ${label}s data (must be an array)`); return
      }
      clipboardData.value = parsed
      showPasteModal.value = true
    } catch (err) {
      console.error('Failed to read clipboard:', err)
      alert('Failed to read from clipboard. Please make sure you have clipboard permissions.')
    }
  }

  function closePasteModal(): void {
    showPasteModal.value = false
    clipboardData.value = null
  }

  return { clipboardData, showPasteModal, copyAll, openPasteModal, closePasteModal }
}
