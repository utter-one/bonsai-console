import type { Ref } from 'vue'
import type { ParsedError } from '@/api/types'

export function useTabNavigation<T extends string>(activeTab: Ref<T>) {
  function switchToFirstErrorTab(error: ParsedError | null) {
    if (!error?.details?.length) return
    for (const detail of error.details) {
      const pathKey = detail.path[0]
      if (pathKey === undefined || pathKey === null) continue
      const pathStr = String(pathKey)
      const fieldEls = document.querySelectorAll<HTMLElement>('[data-field-paths]')
      for (const el of fieldEls) {
        const paths = el.getAttribute('data-field-paths')?.split(' ') ?? []
        if (paths.includes(pathStr)) {
          const tabEl = el.closest<HTMLElement>('[data-tab]')
          if (tabEl) {
            activeTab.value = tabEl.getAttribute('data-tab') as T
            return
          }
        }
      }
    }
  }

  return { switchToFirstErrorTab }
}
