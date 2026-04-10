<script setup lang="ts">
import { ref, nextTick, onUnmounted } from 'vue'

const props = withDefaults(defineProps<{
  items?: any[]
  itemKey?: string
  align?: 'left' | 'right'
  minWidth?: string
  maxHeight?: string
  triggerTitle?: string
  triggerClass?: string
}>(), {
  items: () => [],
  align: 'right',
  minWidth: '200px',
  maxHeight: '300px',
  triggerClass: 'btn-secondary',
})

const emit = defineEmits<{
  select: [item: any]
}>()

const isOpen = ref(false)
const isPositioned = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)
const position = ref({ top: '0px', left: '0px' })
let rafId: number | null = null
let openAbove = false

async function openDropdown() {
  isOpen.value = true
  isPositioned.value = false
  await nextTick()
  calculatePosition(true)
  isPositioned.value = true
  startTracking()
}

function closeDropdown() {
  isOpen.value = false
  stopTracking()
}

function toggle(e?: Event) {
  e?.stopPropagation()
  if (isOpen.value) closeDropdown()
  else openDropdown()
}

function handleSelect(item: any) {
  emit('select', item)
  closeDropdown()
}

function getItemKey(item: any, index: number): any {
  if (props.itemKey) return item[props.itemKey]
  return index
}

function calculatePosition(initial = false) {
  if (!triggerRef.value || !dropdownRef.value) return

  const trigger = triggerRef.value.getBoundingClientRect()
  const dropdown = dropdownRef.value.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight

  if (initial) {
    const spaceBelow = vh - trigger.bottom
    const spaceAbove = trigger.top
    openAbove = spaceBelow < dropdown.height + 4 && spaceAbove > spaceBelow
  }

  let top: number
  if (openAbove) {
    top = trigger.top - dropdown.height - 4
  } else {
    top = trigger.bottom + 4
  }

  let left: number
  if (props.align === 'right') {
    left = trigger.right - dropdown.width
  } else {
    left = trigger.left
  }

  left = Math.max(8, Math.min(left, vw - dropdown.width - 8))
  top = Math.max(8, Math.min(top, vh - dropdown.height - 8))

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

defineExpose({ open: openDropdown, close: closeDropdown, toggle })
</script>

<template>
  <div ref="triggerRef">
    <button
      type="button"
      :class="props.triggerClass"
      :title="props.triggerTitle"
      @click.stop="toggle"
    >
      <slot name="trigger" />
    </button>
    <Teleport to="body">
      <template v-if="isOpen">
        <div class="fixed inset-0 z-2000" @click="closeDropdown" />
        <div
          ref="dropdownRef"
          class="fixed z-2001 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-y-auto"
          :style="{
            top: position.top,
            left: position.left,
            minWidth: props.minWidth,
            maxHeight: props.maxHeight,
            visibility: isPositioned ? 'visible' : 'hidden',
          }"
          @click.stop
        >
          <button
            v-for="(item, index) in items"
            :key="getItemKey(item, index)"
            type="button"
            @click="handleSelect(item)"
            class="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between gap-2"
          >
            <slot name="item" :item="item" />
          </button>
          <slot :close="closeDropdown" />
        </div>
      </template>
    </Teleport>
  </div>
</template>
