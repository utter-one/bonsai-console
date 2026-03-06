import { computed } from 'vue'
import { useProjectSelectionStore } from '@/stores'

/**
 * Helper for components that belong to a project-scoped resource.
 * returns `projectIsArchived` and `isReadOnly(item?)`.
 */
export function useProjectReadOnly(item?: any) {
  const projectSelection = useProjectSelectionStore()
  const projectIsArchived = computed(() => !!projectSelection.selectedProject?.archivedAt)

  function archivedFlag(i: any): boolean {
    if (!i) return false
    if (typeof i === 'object' && 'value' in i) {
      return !!i.value?.archived
    }
    return !!i.archived
  }

  const isReadOnly = computed(() => projectIsArchived.value || archivedFlag(item))
  return { projectIsArchived, isReadOnly }
}
