import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useProjectsStore } from '@/stores'
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

  // currently loaded project details (including archived metadata)
  const selectedProject = ref<ProjectResponse | null>(null)

  // whenever id changes, fetch the full project
  watch(selectedProjectId, async (newId) => {
    if (newId) {
      try {
        const projectsStore = useProjectsStore()
        const project = await projectsStore.fetchById(newId)
        // Discard stale responses if the selected project changed while fetching
        if (selectedProjectId.value === newId) {
          selectedProject.value = project
        }
      } catch {
        if (selectedProjectId.value === newId) {
          selectedProject.value = null
        }
      }
    } else {
      selectedProject.value = null
    }
  }, { immediate: true })

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

  /**
   * Force a re-fetch of the currently selected project, regardless of whether the ID changed.
   * Use this when the project settings may have been modified externally.
   */
  async function refreshSelectedProject() {
    const id = selectedProjectId.value
    if (!id) return
    try {
      const projectsStore = useProjectsStore()
      const project = await projectsStore.fetchById(id)
      if (selectedProjectId.value === id) {
        selectedProject.value = project
      }
    } catch {
      // ignore — keep existing cached value
    }
  }

  return {
    selectedProjectId,
    setSelectedProjectId,
    clearSelectedProject,
    validateSelectedProject,
    refreshSelectedProject,
    selectedProject,
  }
})
