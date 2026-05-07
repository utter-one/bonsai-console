<script setup lang="ts">
import { watchEffect, onUnmounted } from 'vue'
import { useLayoutStore } from '@/stores'
import { FlaskConical, Bot, ClipboardList, PlayCircle } from 'lucide-vue-next'

const layoutStore = useLayoutStore()

const ownerId = Math.random().toString(36).substring(7)

watchEffect(() => {
  layoutStore.setSidebar('Testing', [
    { name: 'testing.playground', label: 'Playground', icon: FlaskConical },
    { name: 'testing.testers', label: 'Testers', icon: Bot },
    { name: 'testing.scenarios', label: 'Scenarios', icon: ClipboardList },
    { name: 'testing.testRuns', label: 'Test Runs', icon: PlayCircle },
  ], ownerId)
})

onUnmounted(() => {
  layoutStore.clearSidebar(ownerId)
})
</script>

<template>
  <div class="flex-1 min-w-0">
    <slot />
  </div>
</template>
