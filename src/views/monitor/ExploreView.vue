<script setup lang="ts">
import { computed } from 'vue'
import { useProjectSelectionStore } from '@/stores'
import AnalyticsExplorerView from '@/components/analytics/AnalyticsExplorer.vue'

const projectSelectionStore = useProjectSelectionStore()
const projectId = computed(() => projectSelectionStore.selectedProjectId || '')
</script>

<template>
  <AnalyticsExplorerView :key="projectId" :project-id="projectId" />
</template>
