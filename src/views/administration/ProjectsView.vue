<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useProjectsStore, useProjectSelectionStore } from '@/stores'
import { usePagination, useTableSort, useSearch } from '@/composables'
import RelativeDate from '@/components/RelativeDate.vue'
import AdministrationSectionLayout from '@/layouts/AdministrationSectionLayout.vue'
import PaginationControls from '@/components/PaginationControls.vue'
import { Search, X, BriefcaseBusiness, Plus, Import, MoreHorizontal } from 'lucide-vue-next'
import type { ProjectResponse, ProjectExchangeBundleV1 } from '@/api/types'
import { getProjectColorHex } from '@/assets/projectColors'

const router = useRouter()
const route = useRoute()
const projectsStore = useProjectsStore()

// Search
const { searchQuery, debouncedSearchQuery, textSearchQuery, clearSearch } = useSearch(() => projectsStore.items)

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
    const params: any = { ...(orderBy ? { orderBy } : {}), ...(textSearchQuery.value ? { textSearch: textSearchQuery.value } : {}) }
    if (showArchived.value) params.archived = true
    await projectsStore.fetchAll(pagination.getParams(params))
  } catch (error) {
    console.error('Failed to load projects:', error)
  }
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
  router.push({ name: 'testing.playground', params: { projectId } })
}


// Import/Export
const importFileInput = ref<HTMLInputElement | null>(null)
const isImporting = ref(false)
const exportingProjectId = ref<string | null>(null)

function triggerImport() {
  importFileInput.value?.click()
}

async function handleImportFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  try {
    isImporting.value = true
    const text = await file.text()
    const bundle = JSON.parse(text) as ProjectExchangeBundleV1
    const result = await projectsStore.importProject(bundle)
    await loadProjects()
    alert(`Project imported successfully (ID: ${result.projectId})`)
  } catch (error: any) {
    alert(error.response?.data?.message || 'Failed to import project')
  } finally {
    isImporting.value = false
    if (importFileInput.value) importFileInput.value.value = ''
  }
}

// Row dropdown
const openDropdownId = ref<string | null>(null)
const dropdownStyle = ref<{ top: string; left: string }>()

function toggleDropdown(event: MouseEvent, projectId: string) {
  if (openDropdownId.value === projectId) {
    openDropdownId.value = null
    return
  }
  const btn = (event.currentTarget as HTMLElement).getBoundingClientRect()
  dropdownStyle.value = {
    top: `${btn.bottom + 4}px`,
    left: `${btn.right - 176}px`,
  }
  openDropdownId.value = projectId
}

function closeDropdown() {
  openDropdownId.value = null
}

onMounted(() => document.addEventListener('click', closeDropdown))
onUnmounted(() => document.removeEventListener('click', closeDropdown))

async function exportProject(project: ProjectResponse) {
  try {
    exportingProjectId.value = project.id
    const bundle = await projectsStore.exportProject(project.id)
    const json = JSON.stringify(bundle, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `project-${project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`
    a.click()
    URL.revokeObjectURL(url)
  } catch (error: any) {
    alert(error.response?.data?.message || 'Failed to export project')
  } finally {
    exportingProjectId.value = null
  }
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
          <input
            ref="importFileInput"
            type="file"
            accept=".json,application/json"
            class="hidden"
            @change="handleImportFile"
          />
          <button @click="triggerImport" class="btn-secondary" :disabled="isImporting">
            <Import class="inline-block mr-2 w-4 h-4" />
            {{ isImporting ? 'Importing...' : 'Import Project' }}
          </button>
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
                  <div class="flex items-center gap-2">
                    <span
                      class="w-3 h-3 rounded-full flex-shrink-0 ring-1 ring-black/10"
                      :style="getProjectColorHex(project.metadata?.primaryColor)
                        ? { backgroundColor: getProjectColorHex(project.metadata?.primaryColor)! }
                        : { backgroundColor: 'transparent', outline: '1px dashed #d1d5db', outlineOffset: '0', boxShadow: 'none' }"
                    />
                    {{ project.name }}
                    <span v-if="project.archivedAt" class="badge badge-error ml-2">Archived</span>
                  </div>
                </td>
                <td class="table-cell-muted"><RelativeDate :date="project.createdAt" /></td>
                <td class="table-cell-muted"><RelativeDate :date="project.updatedAt" /></td>
                <td class="table-cell-right">
                  <div class="flex-end">
                    <button @click="editProject(project)" class="btn-secondary btn-sm">Edit</button>
                    <div>
                      <button
                        @click.stop="toggleDropdown($event, project.id)"
                        class="btn-secondary btn-sm"
                        title="More actions"
                      >
                        <MoreHorizontal class="w-4 h-4" />
                      </button>
                      <Teleport to="body">
                        <div
                          v-if="openDropdownId === project.id"
                          :style="dropdownStyle"
                          class="fixed z-50 w-44 rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
                          @click.stop
                        >
                          <button
                            @click="selectProject(project.id); closeDropdown()"
                            class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                          >
                            Design
                          </button>
                          <button
                            @click="openPlayground(project.id); closeDropdown()"
                            class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                          >
                            Test
                          </button>
                          <button
                            @click="exportProject(project); closeDropdown()"
                            :disabled="exportingProjectId === project.id"
                            class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-200 dark:hover:bg-gray-700"
                          >
                            {{ exportingProjectId === project.id ? 'Exporting...' : 'Export' }}
                          </button>
                          <div class="border-t border-gray-200 dark:border-gray-700" />
                          <button
                            @click="archiveProject(project); closeDropdown()"
                            :class="[
                              'flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700',
                              project.archivedAt ? 'text-gray-700 dark:text-gray-200' : 'text-red-600 dark:text-red-400'
                            ]"
                          >
                            {{ project.archivedAt ? 'Unarchive' : 'Archive' }}
                          </button>
                        </div>
                      </Teleport>
                    </div>
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
