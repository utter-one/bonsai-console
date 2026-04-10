import { onMounted, onUnmounted } from 'vue'
import type { Ref } from 'vue'

export function useClickOutside(target: Ref<HTMLElement | null>, callback: () => void): void {
  function handleMouseDown(e: MouseEvent) {
    if (target.value && !target.value.contains(e.target as Node)) {
      callback()
    }
  }

  onMounted(() => {
    document.addEventListener('mousedown', handleMouseDown)
  })

  onUnmounted(() => {
    document.removeEventListener('mousedown', handleMouseDown)
  })
}
