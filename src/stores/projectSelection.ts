import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ProjectResponse } from '@/api/types'

const SELECTED_PROJECT_KEY = 'selectedProjectId'

/**
 * Store for managing the currently selected project across the app
 * Used by MainLayout and consumed by Design and Monitor views for filtering
 * This ensures consistent project selection across all sections
 * Project selection is persisted in localStorage and restored on app load
 */
export const useProjectSelectionStore = defineStore('projectSelection', () => {
  // Load from localStorage on initialization
  const savedProjectId = localStorage.getItem(SELECTED_PROJECT_KEY)
  const selectedProjectId = ref<string | null>(savedProjectId)

  function setSelectedProjectId(projectId: string | null) {
    selectedProjectId.value = projectId
    
    // Save to localStorage
    if (projectId) {
      localStorage.setItem(SELECTED_PROJECT_KEY, projectId)
    } else {
      localStorage.removeItem(SELECTED_PROJECT_KEY)
    }
  }

  function clearSelectedProject() {
    selectedProjectId.value = null
    localStorage.removeItem(SELECTED_PROJECT_KEY)
  }

  /**
   * Validate that the currently selected project still exists
   * If it doesn't exist, clear the selection
   * @param availableProjects - List of available projects to validate against
   */
  function validateSelectedProject(availableProjects: ProjectResponse[]) {
    if (!selectedProjectId.value) return

    const projectExists = availableProjects.some(
      (project) => project.id === selectedProjectId.value
    )

    if (!projectExists) {
      console.log(`Previously selected project ${selectedProjectId.value} no longer exists, clearing selection`)
      clearSelectedProject()
    }
  }

  return {
    selectedProjectId,
    setSelectedProjectId,
    clearSelectedProject,
    validateSelectedProject,
  }
})
