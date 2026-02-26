<script setup lang="ts">
import { onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { usePersonasStore, useProjectSelectionStore } from '@/stores'
import { usePagination, useTableSort, useSearch } from '@/composables'
import { Drama, Search, X } from 'lucide-vue-next'
import type { PersonaResponse } from '@/api/types'
import PaginationControls from '@/components/PaginationControls.vue'

const router = useRouter()
const personasStore = usePersonasStore()
const projectSelectionStore = useProjectSelectionStore()

// Sorting
const { sortKey, sortOrder, toggleSort, getOrderBy, getSortIcon } = useTableSort('sort-personas')

// Pagination
const pagination = usePagination({
  store: personasStore,
  pageSize: 20,
  onPageChange: loadPersonas
})

// Computed
const projectId = computed(() => projectSelectionStore.selectedProjectId || '')

// Search
const { searchQuery, filteredItems: filteredPersonas, clearSearch } = useSearch(
  () => personasStore.items,
  (persona, query) => persona.name.toLowerCase().includes(query)
)

// Watch for sort changes and reload data
watch([sortKey, sortOrder], () => {
  loadPersonas()
})

// Watch for projectId changes
watch(projectId, () => {
  clearSearch()
  pagination.reset()
  loadPersonas()
})

// Lifecycle
onMounted(async () => {
  await loadPersonas()
})

// Methods
async function loadPersonas() {
  try {
    const orderBy = getOrderBy()
    await personasStore.fetchAll(
      projectId.value,
      pagination.getParams({ ...(orderBy ? { orderBy } : {}) })
    )
  } catch (error) {
    console.error('Failed to load personas:', error)
  }
}

function createPersona() {
  router.push({
    name: 'design.personas.create',
    params: { projectId: projectId.value }
  })
}

function editPersona(persona: PersonaResponse) {
  router.push({
    name: 'design.personas.edit',
    params: {
      projectId: projectId.value,
      personaId: persona.id
    }
  })
}

async function deletePersona(persona: PersonaResponse) {
  if (!confirm(`Delete persona "${persona.name}" (${persona.id})?\n\nThis action cannot be undone.`)) return

  try {
    await personasStore.remove(projectId.value, persona.id, persona.version)
  } catch (error: any) {
    alert(error.response?.data?.message || 'Failed to delete persona')
  }
}

function formatDate(date: string | null) {
  if (!date) return 'N/A'
  return new Date(date).toLocaleString()
}


</script>

<template>
  <div class="container-constrained">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Personas</h1>
        <p class="page-subtitle">Manage AI personas for this project</p>
      </div>
      <button @click="createPersona" class="btn-primary">
        <Drama class="inline-block mr-2 w-4 h-4" />
        New Persona
      </button>
    </div>

    <!-- Search Bar -->
    <div class="search-container">
      <Search class="input-icon-left" />
      <input v-model="searchQuery" type="text" placeholder="Search by name..." class="search-input" />
      <button v-if="searchQuery" @click="clearSearch" class="input-icon-right">
        <X class="w-5 h-5" />
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="personasStore.isLoading" class="loading-state">
      Loading personas...
    </div>

    <!-- Error State -->
    <div v-else-if="personasStore.error" class="error-state">
      {{ personasStore.error }}
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredPersonas.length === 0" class="empty-state">
      <Drama class="empty-state-icon" />
      <p class="empty-state-title">No personas found</p>
      <p v-if="searchQuery">Try adjusting your search criteria</p>
      <p v-else>Create your first persona to get started</p>
    </div>

    <!-- Table -->
    <div v-else class="table-container">
      <div class="table-wrapper">
        <table class="table">
          <thead class="table-header">
            <tr>
              <th class="table-header-cell-sortable" @click="toggleSort('name')">
                <div class="flex items-center gap-1">
                  Name
                  <component :is="getSortIcon('name')" class="w-4 h-4" :class="sortKey === 'name' ? 'text-primary-600' : 'text-gray-400'" />
                </div>
              </th>
              <th class="table-header-cell">Tags</th>
              <th class="table-header-cell-sortable" @click="toggleSort('updatedAt')">
                <div class="flex items-center gap-1">
                  Updated
                  <component :is="getSortIcon('updatedAt')" class="w-4 h-4" :class="sortKey === 'updatedAt' ? 'text-primary-600' : 'text-gray-400'" />
                </div>
              </th>
              <th class="table-header-cell-right">Actions</th>
            </tr>
          </thead>
          <tbody class="table-body">
            <tr v-for="persona in filteredPersonas" :key="persona.id" class="table-row">
              <td class="table-clickable-cell"
                @click="editPersona(persona)">
                {{ persona.name }}
              </td>
              <td class="table-cell">
                <div v-if="persona.tags?.length" class="tag-list">
                  <span v-for="tag in persona.tags" :key="tag" class="tag-item">{{ tag }}</span>
                </div>
                <span v-else class="text-gray-400">—</span>
              </td>
              <td class="table-cell-muted">{{ formatDate(persona.updatedAt) }}</td>
              <td class="table-cell-right">
                <div class="flex-end">
                  <button @click="editPersona(persona)" class="btn-secondary btn-sm">
                    Edit
                  </button>
                  <button @click="deletePersona(persona)" class="btn-danger btn-sm">
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Controls -->
      <PaginationControls :pagination="pagination" :displayed-count="filteredPersonas.length"
        resource-name="personas" />
    </div>
  </div>
</template>

<style scoped>
/* Additional custom styles if needed */
</style>
