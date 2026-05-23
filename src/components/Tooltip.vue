<script setup lang="ts">
import { ref, nextTick, onUnmounted } from 'vue'

const props = withDefaults(defineProps<{
  text?: string
  html?: string
  maxWidth?: string
}>(), {
  maxWidth: '260px',
})

const isVisible = ref(false)
const isPositioned = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const tooltipRef = ref<HTMLElement | null>(null)
const position = ref({ top: '0px', left: '0px' })
const openAbove = ref(true)
let rafId: number | null = null

async function show() {
  isVisible.value = true
  isPositioned.value = false
  await nextTick()
  calculatePosition()
  isPositioned.value = true
  startTracking()
}

function hide() {
  isVisible.value = false
  stopTracking()
}

function calculatePosition() {
  if (!triggerRef.value || !tooltipRef.value) return

  const trigger = triggerRef.value.getBoundingClientRect()
  const tooltip = tooltipRef.value.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight
  const gap = 8

  const spaceAbove = trigger.top
  const spaceBelow = vh - trigger.bottom
  openAbove.value = spaceAbove >= tooltip.height + gap || spaceAbove > spaceBelow

  let top: number
  if (openAbove.value) {
    top = trigger.top - tooltip.height - gap
  } else {
    top = trigger.bottom + gap
  }

  let left = trigger.left + trigger.width / 2 - tooltip.width / 2
  left = Math.max(8, Math.min(left, vw - tooltip.width - 8))
  top = Math.max(8, top)

  position.value = { top: `${top}px`, left: `${left}px` }
}

function startTracking() {
  function loop() {
    calculatePosition()
    rafId = requestAnimationFrame(loop)
  }
  rafId = requestAnimationFrame(loop)
}

function stopTracking() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
}

onUnmounted(stopTracking)
</script>

<template>
  <span ref="triggerRef" class="tooltip-trigger" @mouseenter="show" @mouseleave="hide">
    <slot />
    <Teleport to="body">
      <div
        v-if="isVisible"
        ref="tooltipRef"
        class="tooltip-body"
        :class="openAbove ? 'tooltip-arrow-bottom' : 'tooltip-arrow-top'"
        :style="{
          top: position.top,
          left: position.left,
          maxWidth: props.maxWidth,
          visibility: isPositioned ? 'visible' : 'hidden',
        }"
      >
        <!-- eslint-disable-next-line vue/no-v-html -->
        <span v-if="html" v-html="html" />
        <span v-else>{{ text }}</span>
      </div>
    </Teleport>
  </span>
</template>

<style scoped>
.tooltip-trigger {
  @apply inline-flex items-center cursor-default;
}

.tooltip-body {
  --tooltip-bg: #1f2937;
  --tooltip-text: #f9fafb;
  position: fixed;
  z-index: 9999;
  background: var(--tooltip-bg);
  color: var(--tooltip-text);
  font-size: 0.75rem;
  line-height: 1.4;
  padding: 5px 8px;
  border-radius: 5px;
  pointer-events: none;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  text-align: center;
  animation: tooltip-fade-in 0.1s ease;
}

[data-theme="dark"] .tooltip-body {
  --tooltip-bg: #f3f4f6;
  --tooltip-text: #111827;
}

@keyframes tooltip-fade-in {
  from { opacity: 0 }
  to   { opacity: 1 }
}

.tooltip-body::after {
  content: '';
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
}

.tooltip-arrow-bottom::after {
  top: 100%;
  border-top-color: var(--tooltip-bg);
}

.tooltip-arrow-top::after {
  bottom: 100%;
  border-bottom-color: var(--tooltip-bg);
}
</style>
