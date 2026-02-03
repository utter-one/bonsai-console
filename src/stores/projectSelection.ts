import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Store for managing the currently selected project across the app
 * Used by MainLayout and consumed by Design and Monitor views for filtering
 * This ensures consistent project selection across all sections
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
