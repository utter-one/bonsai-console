<script setup lang="ts">
import { onMounted } from 'vue'
import { useVersionStore } from '@/stores'

const versionStore = useVersionStore()

onMounted(() => {
  versionStore.fetchVersion()
})
</script>

<template>
  <div
    v-if="versionStore.versionData"
    class="px-4 py-2 text-center text-xs text-gray-400 dark:text-gray-600 select-none"
  >
    v{{ versionStore.versionData.version }}
  </div>
</template>
