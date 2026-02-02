<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStagesStore } from '@/stores'
import { formatEnum, usePagination } from '@/composables'
import { RefreshCw, Search, X } from 'lucide-vue-next'
import type { StageResponse } from '@/api/types'
import PaginationControls from '@/components/PaginationControls.vue'

const route = useRoute()
const router = useRouter()
const stagesStore = useStagesStore()

// UI State
const searchQuery = ref('')
const debouncedSearchQuery = ref('')
let searchTimeout: ReturnType<typeof setTimeout> | null = null

// Pagination
const pagination = usePagination({
  store: stagesStore,
  pageSize: 20,
  onPageChange: loadStages
})

// Computed
const projectId = computed(() => route.params.projectId as string)

const filteredStages = computed(() => {
  if (!debouncedSearchQuery.value) return stagesStore.items
  const query = debouncedSearchQuery.value.toLowerCase()
  return stagesStore.items.filter(stage => 
    stage.name.toLowerCase().includes(query) ||
    stage.prompt.toLowerCase().includes(query) ||
    stage.id.toLowerCase().includes(query)
  )
})

// Watch for search query changes with debounce
watch(searchQuery, (newValue) => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    debouncedSearchQuery.value = newValue
  }, 300)
})

// Watch for projectId changes
watch(projectId, () => {
  searchQuery.value = ''
  debouncedSearchQuery.value = ''
  pagination.reset()
  loadStages()
})

// Lifecycle
onMounted(async () => {
  await loadStages()
})

// Methods
async function loadStages() {
  try {
    await stagesStore.fetchAll(
      pagination.getParams({ filters: { projectId: projectId.value } })
    )
  } catch (error) {
    console.error('Failed to load stages:', error)
  }
}

function createStage() {
  router.push({
    name: 'design.stages.create',
    params: { projectId: projectId.value }
  })
}

function editStage(stage: StageResponse) {
  router.push({
    name: 'design.stages.edit',
    params: {
      projectId: projectId.value,
      stageId: stage.id
    }
  })
}

async function deleteStage(stage: StageResponse) {
  if (!confirm(`Delete stage "${stage.name}" (${stage.id})?\n\nThis action cannot be undone.`)) return

  try {
    await stagesStore.remove(stage.id, stage.version)
  } catch (error: any) {
    alert(error.response?.data?.message || 'Failed to delete stage')
  }
}

function formatDate(date: string | null) {
  if (!date) return 'N/A'
  return new Date(date).toLocaleString()
}

function clearSearch() {
  searchQuery.value = ''
}
</script>

<template>
  <div class="container-constrained">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Stages</h1>
          <p class="page-subtitle">Define conversation stages for this project</p>
        </div>
        <button @click="createStage" class="btn-primary">
          <RefreshCw class="inline-block mr-2 w-4 h-4" />
          New Stage
        </button>
      </div>

      <!-- Search Bar -->
      <div class="search-container">
        <Search class="input-icon-left" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by stage or prompt..."
          class="search-input"
        />
        <button v-if="searchQuery" @click="clearSearch" class="input-icon-right">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="stagesStore.isLoading" class="loading-state">
        Loading stages...
      </div>

      <!-- Error State -->
      <div v-else-if="stagesStore.error" class="error-state">
        {{ stagesStore.error }}
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredStages.length === 0" class="empty-state">
        <RefreshCw class="empty-state-icon" />
        <p class="empty-state-title">No stages found</p>
        <p v-if="searchQuery">Try adjusting your search criteria</p>
        <p v-else>Create your first stage to get started</p>
      </div>

      <!-- Table -->
      <div v-else class="table-container">
        <div class="table-wrapper">
          <table class="table">
            <thead class="table-header">
              <tr>
                <th class="table-header-cell">Stage Name</th>
                <th class="table-header-cell">Enter Behavior</th>
                <th class="table-header-cell">Features</th>
                <th class="table-header-cell">Updated</th>
                <th class="table-header-cell-right">Actions</th>
              </tr>
            </thead>
            <tbody class="table-body">
              <tr v-for="stage in filteredStages" :key="stage.id" class="table-row">
                <td class="table-clickable-cell"
                  @click="editStage(stage)">
                  {{ stage.name }}
                </td>
                <td class="table-cell">
                  <span class="badge-secondary">{{ formatEnum(stage.enterBehavior) }}</span>
                </td>
                <td class="table-cell">
                  <div class="flex gap-1 flex-wrap">
                    <span v-if="stage.useKnowledge" class="badge-info">Knowledge</span>
                    <span v-if="stage.useGlobalActions" class="badge-info">Global Actions</span>
                    <span v-if="stage.classifierIds?.length" class="badge-info">
                      {{ stage.classifierIds.length }} Classifier(s)
                    </span>
                    <span v-if="stage.transformerIds?.length" class="badge-info">
                      {{ stage.transformerIds.length }} Transformer(s)
                    </span>
                  </div>
                </td>
                <td class="table-cell-muted">{{ formatDate(stage.updatedAt) }}</td>
                <td class="table-cell-right">
                  <div class="flex-end">
                    <button @click="editStage(stage)" class="btn-secondary btn-sm">
                      Edit
                    </button>
                    <button @click="deleteStage(stage)" class="btn-danger btn-sm">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      <!-- Pagination Controls -->
      <PaginationControls
        :pagination="pagination"
        :displayed-count="filteredStages.length"
        resource-name="stages"
      />
      </div>
  </div>
</template>

<style scoped>
/* Additional custom styles if needed */
</style>
