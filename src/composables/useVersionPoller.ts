import { ref, onUnmounted } from 'vue'

function getScriptSrcs(doc: Document): string[] {
  return [...doc.querySelectorAll('script[src]')].map((s) => (s as HTMLScriptElement).src)
}

export function useVersionPoller(intervalMs = 60_000) {
  const updateAvailable = ref(false)

  const baselineSrcs = getScriptSrcs(document).join(',')

  let timer: ReturnType<typeof setInterval> | null = null

  async function checkVersion() {
    if (document.visibilityState === 'hidden') return
    if (updateAvailable.value) return

    try {
      const res = await fetch('/?t=' + Date.now(), { cache: 'no-store' })
      if (!res.ok) return

      const html = await res.text()
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')
      const fetchedSrcs = getScriptSrcs(doc).join(',')

      if (fetchedSrcs && fetchedSrcs !== baselineSrcs) {
        updateAvailable.value = true
        stop()
      }
    } catch {
      // Silently ignore network errors — no false positives
    }
  }

  function stop() {
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
    document.removeEventListener('visibilitychange', onVisibilityChange)
  }

  function onVisibilityChange() {
    if (document.visibilityState === 'visible') {
      checkVersion()
    }
  }

  timer = setInterval(checkVersion, intervalMs)
  document.addEventListener('visibilitychange', onVisibilityChange)

  onUnmounted(stop)

  return { updateAvailable }
}
