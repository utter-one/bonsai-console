<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useProjectsStore, useProjectSelectionStore } from '@/stores'
import { usePagination, useTableSort } from '@/composables'
import AdministrationSectionLayout from '@/layouts/AdministrationSectionLayout.vue'
import PaginationControls from '@/components/PaginationControls.vue'
import { Search, X, BriefcaseBusiness, Plus } from 'lucide-vue-next'
import type { ProjectResponse } from '@/api/types'

const router = useRouter()
const route = useRoute()
const projectsStore = useProjectsStore()

// Search state
const searchQuery = ref('')
const debouncedSearchQuery = ref('')
let searchTimeout: ReturnType<typeof setTimeout> | null = null

// archived toggle
const showArchived = ref(route.query.archived === 'true')
watch(showArchived, (val) => {
  router.push({ query: { ...route.query, archived: val ? 'true' : undefined } })
  pagination.reset()
})
// if someone navigates (back/forward) update toggle
watch(() => route.query.archived, (q) => {
  showArchived.value = q === 'true'
})

// Sorting
const { sortKey, sortOrder, toggleSort, getOrderBy, getSortIcon } = useTableSort('sort-projects')

// Pagination
const pagination = usePagination({
  store: projectsStore,
  pageSize: 20,
  onPageChange: loadProjects,
})

// Computed
const filteredProjects = computed(() => projectsStore.items)

// Watch for search query changes with debounce
watch(searchQuery, (newValue) => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    debouncedSearchQuery.value = newValue
  }, 300)
})

// Watch for sort changes and reload data
watch([sortKey, sortOrder], () => {
  loadProjects()
})

// Watch for search changes and reload data from backend
watch(debouncedSearchQuery, () => {
  pagination.reset()
})

onMounted(async () => {
  await loadProjects()
})

async function loadProjects() {
  try {
    const orderBy = getOrderBy()
    const params: any = { ...(orderBy ? { orderBy } : {}), ...(debouncedSearchQuery.value ? { textSearch: debouncedSearchQuery.value } : {}) }
    if (showArchived.value) params.archived = true
    await projectsStore.fetchAll(pagination.getParams(params))
  } catch (error) {
    console.error('Failed to load projects:', error)
  }
}

function clearSearch() {
  searchQuery.value = ''
}

function createProject() {
  router.push({ name: 'administration.projects.create' })
}

function editProject(project: ProjectResponse) {
  router.push({ name: 'administration.projects.edit', params: { projectId: project.id } })
}

async function archiveProject(project: ProjectResponse) {
  const action = project.archivedAt ? 'unarchive' : 'archive'
  if (!confirm(`${action === 'archive' ? 'Archive' : 'Unarchive'} project "${project.name}"?`)) return
  try {
    if (action === 'archive') {
      await projectsStore.archive(project.id, project.version)
    } else {
      await projectsStore.unarchive(project.id, project.version)
    }
    // refresh selection if necessary
    const projSel = useProjectSelectionStore()
    if (projSel.selectedProjectId === project.id) {
      projSel.setSelectedProjectId(project.id)
    }
    await loadProjects()
  } catch (error: any) {
    alert(error.response?.data?.message || `Failed to ${action} project`)
  }
}

function selectProject(projectId: string) {
  router.push({ name: 'design.stages', params: { projectId } })
}

function openPlayground(projectId: string) {
  router.push({ name: 'playground', params: { projectId } })
}

function formatDate(date: string | null) {
  if (!date) return 'N/A'
  return new Date(date).toLocaleString()
}
</script>

<template>
  <AdministrationSectionLayout>
    <div class="container-constrained">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Projects</h1>
          <p class="page-subtitle">Manage your AI application projects</p>
        </div>
        <div class="flex items-center gap-4">
          <button @click="createProject" class="btn-primary" :disabled="showArchived">
            <Plus class="inline-block mr-2 w-4 h-4" />
            New Project
          </button>
        </div>
      </div>

      <!-- Search Bar -->
      <div class="search-container flex gap-4">
        <div class="relative flex-1">
          <Search class="input-icon-left" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by name..."
            class="search-input"
          />
          <button v-if="searchQuery" @click="clearSearch" class="input-icon-right">
            <X class="w-5 h-5" />
          </button>
        </div>
        <label class="flex items-center gap-2 cursor-pointer select-none text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
          <span>Status:</span>
          <select v-model="showArchived" class="form-select">
            <option :value="false">Active</option>
            <option :value="true">Archived</option>
          </select>
        </label>
      </div>

      <!-- Loading State -->
      <div v-if="projectsStore.isLoading" class="loading-state">
        Loading projects...
      </div>

      <!-- Error State -->
      <div v-else-if="projectsStore.error" class="error-state">
        {{ projectsStore.error }}
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredProjects.length === 0" class="empty-state">
        <BriefcaseBusiness class="empty-state-icon" />
        <p class="empty-state-title">No projects found</p>
        <p v-if="searchQuery">Try adjusting your search criteria</p>
        <template v-else>
          <p>Create a project to start designing your AI experience</p>
          <button class="btn-primary mt-4" :disabled="showArchived" @click="createProject">
            <Plus class="inline-block mr-2 w-4 h-4" />
            Create your first project
          </button>
        </template>
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
                <th class="table-header-cell-sortable" @click="toggleSort('createdAt')">
                  <div class="flex items-center gap-1">
                    Created
                    <component :is="getSortIcon('createdAt')" class="w-4 h-4" :class="sortKey === 'createdAt' ? 'text-primary-600' : 'text-gray-400'" />
                  </div>
                </th>
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
              <tr v-for="project in filteredProjects" :key="project.id" class="table-row">
                <td class="table-clickable-cell" @click="editProject(project)">
                  {{ project.name }}
                  <span v-if="project.archivedAt" class="badge badge-error ml-2">Archived</span>
                </td>
                <td class="table-cell-muted">{{ formatDate(project.createdAt) }}</td>
                <td class="table-cell-muted">{{ formatDate(project.updatedAt) }}</td>
                <td class="table-cell-right">
                  <div class="flex-end">
                    <button @click="selectProject(project.id)" class="btn-secondary btn-sm">Design</button>
                    <button @click="openPlayground(project.id)" class="btn-secondary btn-sm">Test</button>
                    <button @click="editProject(project)" class="btn-secondary btn-sm">Edit</button>
                    <button @click="archiveProject(project)" :class="['btn-sm', project.archivedAt ? 'btn-secondary' : 'btn-danger']">
                    {{ project.archivedAt ? 'Unarchive' : 'Archive' }}
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
          :displayed-count="filteredProjects.length"
          resource-name="projects"
        />
      </div>
    </div>
  </AdministrationSectionLayout>
</template>
