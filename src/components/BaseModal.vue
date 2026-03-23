<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps<{
  title: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const sizeClass: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
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
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal-content w-full" :class="sizeClass[size ?? 'md']" @click.stop>
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
