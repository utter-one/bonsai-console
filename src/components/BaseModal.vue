<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps<{
  title: string
  size?: 'sm' | 'md' | 'lg' | '3xl' | 'xl' | 'full'
  fixedHeight?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const sizeClass: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  '3xl': 'max-w-3xl',
  xl: 'max-w-4xl',
  full: 'max-w-6xl',
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="modal-overlay">
    <div
      class="bg-white rounded-lg p-6 w-full max-h-[90vh] overflow-y-auto dark:bg-gray-800 dark:text-white"
      :class="[sizeClass[size ?? 'lg'], { 'fixed-height-modal': fixedHeight }]"
      @click.stop
    >
      <slot name="header">
        <div class="modal-header">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">{{ title }}</h2>
          <button @click="emit('close')" class="btn-icon">
            <X class="w-5 h-5" />
          </button>
        </div>
      </slot>
      <slot />
      <slot name="footer" />
    </div>
  </div>
</template>
