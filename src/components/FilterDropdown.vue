<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ChevronDown } from 'lucide-vue-next'

const props = defineProps<{
  label: string
  active?: boolean
  disabled?: boolean
}>()

const isOpen = ref(false)
const containerRef = ref<HTMLElement | null>(null)

function toggle() {
  if (!props.disabled) isOpen.value = !isOpen.value
}

function onClickOutside(e: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => document.addEventListener('mousedown', onClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', onClickOutside))
</script>

<template>
  <div ref="containerRef" class="relative">
    <button
      class="btn-secondary flex items-center gap-1"
      :class="{ 'ring-2 ring-blue-500': active }"
      :disabled="disabled"
      @click="toggle">
      <span>{{ label }}</span>
      <ChevronDown class="w-4 h-4 transition-transform" :class="{ 'rotate-180': isOpen }" />
    </button>
    <div v-if="isOpen" class="filter-dropdown-panel" @click="isOpen = false">
      <slot />
    </div>
  </div>
</template>
