import type { Directive } from 'vue'

interface AutowidthElement extends HTMLInputElement {
  _autowidthSpan?: HTMLSpanElement
  _autowidthResize?: () => void
}

export const vAutowidth: Directive<HTMLInputElement> = {
  mounted(el: HTMLInputElement) {
    const span = document.createElement('span')
    span.style.visibility = 'hidden'
    span.style.whiteSpace = 'nowrap'
    span.style.overflow = 'hidden'
    span.style.position = 'absolute'
    span.style.top = '0'
    span.style.left = '0'
    document.body.appendChild(span)

    ;(el as AutowidthElement)._autowidthSpan = span

    const getComputedStyles = () => {
      const cs = window.getComputedStyle(el)
      return {
        paddingLeft: parseFloat(cs.paddingLeft) || 0,
        paddingRight: parseFloat(cs.paddingRight) || 0,
        borderLeftWidth: parseFloat(cs.borderLeftWidth) || 0,
        borderRightWidth: parseFloat(cs.borderRightWidth) || 0,
        fontSize: cs.fontSize,
        fontFamily: cs.fontFamily,
        fontWeight: cs.fontWeight,
        letterSpacing: cs.letterSpacing,
      }
    }

    const resize = () => {
      const span = (el as AutowidthElement)._autowidthSpan!
      span.textContent = el.value || el.placeholder || 'A'
      // Copy font properties from input to span for accurate measurement
      const cs = getComputedStyles()
      span.style.fontSize = cs.fontSize
      span.style.fontFamily = cs.fontFamily
      span.style.fontWeight = cs.fontWeight
      span.style.letterSpacing = cs.letterSpacing
      const width = span.offsetWidth + cs.paddingLeft + cs.paddingRight + cs.borderLeftWidth + cs.borderRightWidth
      el.style.width = width + 'px'
    }

    ;(el as AutowidthElement)._autowidthResize = resize
    resize()
    el.addEventListener('input', resize)
  },

  updated(el: HTMLInputElement) {
    ;(el as AutowidthElement)._autowidthResize?.()
  },

  beforeUnmount(el: HTMLInputElement) {
    const autowidthEl = el as AutowidthElement
    const span = autowidthEl._autowidthSpan
    if (span) {
      document.body.removeChild(span)
    }
    autowidthEl._autowidthResize = undefined
    autowidthEl._autowidthSpan = undefined
  },
}
