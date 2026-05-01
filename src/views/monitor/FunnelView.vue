<script setup lang="ts">
import { computed } from 'vue'
import { useProjectSelectionStore } from '@/stores'
import AnalyticsFunnelsView from '@/components/analytics/AnalyticsFunnels.vue'

const projectSelectionStore = useProjectSelectionStore()
const projectId = computed(() => projectSelectionStore.selectedProjectId || '')
</script>

<template>
  <AnalyticsFunnelsView :key="projectId" :project-id="projectId" />
</template>
