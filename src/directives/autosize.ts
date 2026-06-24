import type { Directive } from 'vue'

interface AutosizeElement extends HTMLTextAreaElement {
  _autosizeResize?: () => void
}

export const vAutosize: Directive<HTMLTextAreaElement> = {
  mounted(el: HTMLTextAreaElement) {
    el.style.overflow = 'hidden'
    el.style.resize = 'none'
    const resize = () => {
      el.style.height = 'auto'
      if (el.scrollHeight > 0) el.style.height = el.scrollHeight + 'px'
    }
    ;(el as AutosizeElement)._autosizeResize = resize
    resize()
    el.addEventListener('input', resize)
  },
  updated(el: HTMLTextAreaElement) {
    ;(el as AutosizeElement)._autosizeResize?.()
  },
  beforeUnmount(el: HTMLTextAreaElement) {
    const autosizeEl = el as AutosizeElement
    autosizeEl._autosizeResize = undefined
  },
}
