<script setup lang="ts">
import { onMounted, computed, watch, ref } from 'vue'
import { useQuickPromptsStore, useProjectSelectionStore } from '@/stores'
import type { QuickPromptWithSource } from '@/stores/quickPrompts'
import { QUICK_PROMPT_CATEGORIES, QUICK_PROMPT_CATEGORY_LABELS } from '@/stores/quickPrompts'
import { usePagination, useTableSort, useSearch, useConfirm } from '@/composables'
import RelativeDate from '@/components/RelativeDate.vue'
import QuickPromptEditModal from '@/components/modals/QuickPromptEditModal.vue'
import { Search, X, Plus, Pencil, Copy, Trash2, Bookmark } from 'lucide-vue-next'
import PaginationControls from '@/components/PaginationControls.vue'

const store = useQuickPromptsStore()
const projectSelectionStore = useProjectSelectionStore()

const { sortKey, sortOrder, toggleSort, getSortIcon } = useTableSort('sort-quick-prompts')

const pagination = usePagination({
  store: {
    items: computed(() => store.allPrompts),
    pagination: store.pagination,
    isLoading: store.isLoading,
    error: store.error,
  } as any,
  pageSize: 20,
  onPageChange: loadPrompts,
})

const { searchQuery, debouncedSearchQuery, textSearchQuery, filteredItems: filteredPrompts, clearSearch } = useSearch(
  () => store.allPrompts
)

const { confirmDelete } = useConfirm()

const projectId = computed(() => projectSelectionStore.selectedProjectId || '')
const activeCategory = ref<string>('all')
const activeScope = ref<'all' | 'global' | 'project'>('all')

const showEditModal = ref(false)
const editingPrompt = ref<QuickPromptWithSource | null>(null)
const editScope = ref<'global' | 'project'>('project')

const categorizedFilteredPrompts = computed(() => {
  let items = filteredPrompts.value

  if (activeCategory.value !== 'all') {
     items = items.filter(p => p.categoryId === activeCategory.value)
  }

  if (activeScope.value !== 'all') {
    items = items.filter(p => p._source === activeScope.value)
  }

  if (sortKey.value) {
    const key = sortKey.value
    const order = sortOrder.value === 'asc' ? 1 : -1
    items = [...items].sort((a, b) => {
      const aVal = (a as any)[key] ?? ''
      const bVal = (b as any)[key] ?? ''
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return aVal.localeCompare(bVal) * order
      }
      return 0
    })
  }

  return items
})

watch([sortKey, sortOrder], () => {
  loadPrompts()
})

watch(debouncedSearchQuery, () => {
  loadPrompts()
})

watch(activeCategory, () => {
  loadPrompts()
})

watch(activeScope, () => {
  loadPrompts()
})

watch(projectId, () => {
  clearSearch()
  loadPrompts()
})

onMounted(async () => {
  await loadPrompts()
})

async function loadPrompts() {
  try {
    const search = textSearchQuery.value || undefined
    const categoryId = activeCategory.value === 'all' ? undefined : activeCategory.value
    await store.fetchAll(projectId.value, categoryId, search)
  } catch (error) {
    console.error('Failed to load quick prompts:', error)
  }
}

async function deletePrompt(prompt: QuickPromptWithSource) {
  if (!(await confirmDelete(prompt.name))) return

  try {
    if (prompt._source === 'global') {
      await store.deleteGlobal(prompt.id, prompt.version)
    } else {
      await store.deleteProject(projectId.value, prompt.id, prompt.version)
    }
  } catch (error: any) {
    alert(error.response?.data?.message || 'Failed to delete quick prompt')
  }
}

async function clonePrompt(prompt: QuickPromptWithSource) {
  try {
    if (prompt._source === 'global') {
      await store.cloneGlobal(prompt.id)
    } else {
      await store.cloneProject(projectId.value, prompt.id)
    }
  } catch (error: any) {
    alert(error.response?.data?.message || 'Failed to clone quick prompt')
  }
}

function openCreateModal(scope: 'global' | 'project') {
  editingPrompt.value = null
  editScope.value = scope
  showEditModal.value = true
}

function openEditModal(prompt: QuickPromptWithSource) {
  editingPrompt.value = prompt
  editScope.value = prompt._source
  showEditModal.value = true
}

function handleModalSave() {
  loadPrompts()
}
</script>

<template>
  <div class="container-constrained">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Quick Prompts</h1>
        <p class="page-subtitle">Reusable prompt snippets organized by category</p>
      </div>
      <div class="flex gap-2">
        <button @click="openCreateModal('project')" class="btn-primary">
          <Plus class="inline-block mr-2 w-4 h-4" />
          New Project Prompt
        </button>
        <button @click="openCreateModal('global')" class="btn-secondary">
          <Plus class="inline-block mr-2 w-4 h-4" />
          New Global Prompt
        </button>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="search-container">
      <Search class="input-icon-left" />
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search by name, description, or content..."
        class="search-input"
      />
      <button v-if="searchQuery" @click="clearSearch" class="input-icon-right">
        <X class="w-5 h-5" />
      </button>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-3 mb-4">
      <div class="flex flex-col gap-1">
        <label class="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Category</label>
        <div class="flex flex-wrap gap-1">
          <button
            type="button"
            class="px-2 py-1 text-xs rounded-md transition-colors"
            :class="activeCategory === 'all'
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'"
            @click="activeCategory = 'all'"
          >
            All
          </button>
          <button
            v-for="cat in QUICK_PROMPT_CATEGORIES"
            :key="cat"
            type="button"
            class="px-2 py-1 text-xs rounded-md transition-colors"
            :class="activeCategory === cat
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'"
            @click="activeCategory = cat"
          >
            {{ QUICK_PROMPT_CATEGORY_LABELS[cat] }}
          </button>
        </div>
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Scope</label>
        <div class="flex gap-1">
          <button
            type="button"
            class="px-2 py-1 text-xs rounded-md transition-colors"
            :class="activeScope === 'all'
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'"
            @click="activeScope = 'all'"
          >
            All
          </button>
          <button
            type="button"
            class="px-2 py-1 text-xs rounded-md transition-colors"
            :class="activeScope === 'project'
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'"
            @click="activeScope = 'project'"
          >
            Project
          </button>
          <button
            type="button"
            class="px-2 py-1 text-xs rounded-md transition-colors"
            :class="activeScope === 'global'
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'"
            @click="activeScope = 'global'"
          >
            Global
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="store.isLoading && !store.allPrompts.length" class="loading-state">
      Loading quick prompts...
    </div>

    <!-- Error State -->
    <div v-else-if="store.error" class="error-state">
      {{ store.error }}
    </div>

    <!-- Empty State -->
    <div v-else-if="categorizedFilteredPrompts.length === 0" class="empty-state">
      <Bookmark class="empty-state-icon" />
      <p class="empty-state-title">No quick prompts found</p>
      <p v-if="searchQuery">Try adjusting your search criteria</p>
      <p v-else>Create your first quick prompt to get started</p>
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
              <th class="table-header-cell">Category</th>
              <th class="table-header-cell">Scope</th>
              <th class="table-header-cell">Tags</th>
              <th class="table-header-cell-sortable" @click="toggleSort('createdAt')">
                <div class="flex items-center gap-1">
                  Created
                  <component :is="getSortIcon('createdAt')" class="w-4 h-4" :class="sortKey === 'createdAt' ? 'text-primary-600' : 'text-gray-400'" />
                </div>
              </th>
              <th class="table-header-cell-right">Actions</th>
            </tr>
          </thead>
          <tbody class="table-body">
            <tr v-for="prompt in categorizedFilteredPrompts" :key="`${prompt._source}-${prompt.id}`" class="table-row">
              <td class="table-cell">
                <div class="flex items-center gap-2">
                  <span class="font-medium">{{ prompt.name }}</span>
                  <span v-if="prompt.isSystem" class="badge badge-violet ml-2">System</span>
                </div>
              </td>
              <td class="table-cell">
                <span class="text-sm">{{ QUICK_PROMPT_CATEGORY_LABELS[prompt.categoryId] }}</span>
              </td>
              <td class="table-cell">
                <span
                  class="badge text-xs"
                  :class="prompt._source === 'global' ? 'badge-info' : 'badge-primary'"
                >
                  {{ prompt._source === 'global' ? 'Global' : 'Project' }}
                </span>
              </td>
              <td class="table-cell">
                <div v-if="prompt.tags?.length" class="tag-list">
                  <span v-for="tag in prompt.tags" :key="tag" class="tag-item">{{ tag }}</span>
                </div>
                <span v-else class="text-gray-400">—</span>
              </td>
              <td class="table-cell-muted"><RelativeDate :date="prompt.createdAt" /></td>
              <td class="table-cell-right">
                <div class="flex-end">
                  <button
                    v-if="store.canManage(prompt)"
                    @click="openEditModal(prompt)"
                    class="btn-icon-action"
                    title="Edit"
                  >
                    <Pencil class="w-4 h-4" />
                  </button>
                  <button
                    v-if="store.canManage(prompt)"
                    @click="clonePrompt(prompt)"
                    class="btn-icon-action"
                    title="Clone"
                  >
                    <Copy class="w-4 h-4" />
                  </button>
                  <button
                    v-if="store.canManage(prompt) && !prompt.isSystem"
                    @click="deletePrompt(prompt)"
                    class="btn-icon-action-danger"
                    title="Delete"
                  >
                    <Trash2 class="w-4 h-4" />
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
        :displayed-count="categorizedFilteredPrompts.length"
        resource-name="quick prompts"
      />
    </div>

    <!-- Edit Modal -->
    <QuickPromptEditModal
      v-if="showEditModal"
      :model-value="true"
      :prompt="editingPrompt"
      :scope="editScope"
      :project-id="projectId"
      :default-category-id="activeCategory !== 'all' ? activeCategory : undefined"
      @close="showEditModal = false"
      @save="handleModalSave"
    />
  </div>
</template>
