import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Store for managing the currently selected project across the app
 * Used by MainLayout and consumed by Monitor views for filtering
 */
export const useProjectSelectionStore = defineStore('projectSelection', () => {
  const selectedProjectId = ref<string | null>(null)

  function setSelectedProjectId(projectId: string | null) {
    selectedProjectId.value = projectId
  }

  function clearSelectedProject() {
    selectedProjectId.value = null
  }

  return {
    selectedProjectId,
    setSelectedProjectId,
    clearSelectedProject,
  }
})
