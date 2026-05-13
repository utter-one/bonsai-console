<script setup lang="ts">
import { computed } from 'vue'
import { useProjectSelectionStore } from '@/stores'
import NoProjectSelected from '@/components/NoProjectSelected.vue'

const projectSelectionStore = useProjectSelectionStore()

const hasProject = computed(() => !!projectSelectionStore.selectedProjectId)
</script>

<template>
  <div v-if="hasProject" class="flex-1 min-w-0">
    <slot />
  </div>
  
  <NoProjectSelected
    v-else
    description="Please select a project from the dropdown in the top navigation bar to access Design features."
  />
</template>

