<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectsStore } from '@/stores'
import { usePagination, useTableSort } from '@/composables'
import AdministrationSectionLayout from '@/layouts/AdministrationSectionLayout.vue'
import PaginationControls from '@/components/PaginationControls.vue'
import { Search, X, BriefcaseBusiness, Plus } from 'lucide-vue-next'
import type { ProjectResponse } from '@/api/types'

const router = useRouter()
const projectsStore = useProjectsStore()

// Search state
const searchQuery = ref('')
const debouncedSearchQuery = ref('')
let searchTimeout: ReturnType<typeof setTimeout> | null = null

// Sorting
const { sortKey, sortOrder, toggleSort, getOrderBy, getSortIcon } = useTableSort('sort-projects')

// Pagination
const pagination = usePagination({
  store: projectsStore,
  pageSize: 20,
  onPageChange: loadProjects,
})

// Computed
const filteredProjects = computed(() => {
  if (!debouncedSearchQuery.value) return projectsStore.items
  const query = debouncedSearchQuery.value.toLowerCase()
  return projectsStore.items.filter(project =>
    project.name.toLowerCase().includes(query) ||
    project.description?.toLowerCase().includes(query)
  )
})

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

onMounted(async () => {
  await loadProjects()
})

async function loadProjects() {
  try {
    const orderBy = getOrderBy()
    await projectsStore.fetchAll(pagination.getParams(orderBy ? { orderBy } : {}))
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

async function deleteProject(project: ProjectResponse) {
  if (!confirm(`Delete project "${project.name}"?\n\nThis action cannot be undone.`)) return
  try {
    await projectsStore.remove(project.id)
  } catch (error: any) {
    alert(error.response?.data?.message || 'Failed to delete project')
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
        <button @click="createProject" class="btn-primary">
          <Plus class="inline-block mr-2 w-4 h-4" />
          New Project
        </button>
      </div>

      <!-- Search Bar -->
      <div class="search-container">
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
        <p v-else>Create your first project to get started</p>
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
                </td>
                <td class="table-cell-muted">{{ formatDate(project.createdAt) }}</td>
                <td class="table-cell-muted">{{ formatDate(project.updatedAt) }}</td>
                <td class="table-cell-right">
                  <div class="flex-end">
                    <button @click="selectProject(project.id)" class="btn-secondary btn-sm">Design</button>
                    <button @click="openPlayground(project.id)" class="btn-secondary btn-sm">Test</button>
                    <button @click="editProject(project)" class="btn-secondary btn-sm">Edit</button>
                    <button @click="deleteProject(project)" class="btn-danger btn-sm">Delete</button>
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
