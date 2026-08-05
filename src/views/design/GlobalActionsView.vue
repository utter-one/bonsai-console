<script setup lang="ts">
import { onMounted, onUnmounted, computed, watch, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGlobalActionsStore, useProjectSelectionStore } from '@/stores'
import { useProjectReadOnly } from '@/composables/useProjectReadOnly'
import { usePagination, useTableSort, useSearch } from '@/composables'
import RelativeDate from '@/components/RelativeDate.vue'
import Tooltip from '@/components/Tooltip.vue'
import { Zap, Search, X, Plus, ChevronDown, ShieldAlert, Pencil, Eye, Trash2 } from 'lucide-vue-next'
import type { GlobalActionResponse } from '@/api/types'
import PaginationControls from '@/components/PaginationControls.vue'

const router = useRouter()
const globalActionsStore = useGlobalActionsStore()
const projectSelectionStore = useProjectSelectionStore()

// Sorting
const { sortKey, sortOrder, toggleSort, getOrderBy, getSortIcon } = useTableSort('sort-global-actions')

// Pagination
const pagination = usePagination({
  store: globalActionsStore,
  pageSize: 20,
  onPageChange: loadGlobalActions
})

// Computed
const projectId = computed(() => projectSelectionStore.selectedProjectId || '')
const { projectIsArchived } = useProjectReadOnly()

// Search
const { searchQuery, debouncedSearchQuery, textSearchQuery, filteredItems: filteredGlobalActions, clearSearch } = useSearch(
  () => globalActionsStore.items
)

// Watch for sort changes and reload data
watch([sortKey, sortOrder], () => {
  loadGlobalActions()
})

// Watch for search changes and reload data from backend
watch(debouncedSearchQuery, () => {
  pagination.reset()
})

// Watch for projectId changes
watch(projectId, () => {
  clearSearch()
  pagination.reset()
  loadGlobalActions()
})

// Lifecycle
onMounted(async () => {
  await loadGlobalActions()
})

// Methods
async function loadGlobalActions() {
  try {
    const orderBy = getOrderBy()
    await globalActionsStore.fetchAll(
      projectId.value,
      pagination.getParams({ ...(orderBy ? { orderBy } : {}), ...(textSearchQuery.value ? { textSearch: textSearchQuery.value } : {}) })
    )
  } catch (error) {
    console.error('Failed to load global actions:', error)
  }
}

async function deleteGlobalAction(action: GlobalActionResponse) {
  if (!confirm(`Delete global action "${action.name}" (${action.id})?\n\nThis action cannot be undone.`)) return

  try {
    await globalActionsStore.remove(projectId.value, action.id, action.version)
    if (globalActionsStore.items.length === 0 && pagination.currentPage.value > 1) {
      pagination.currentPage.value--
    }
    await loadGlobalActions()
  } catch (error: any) {
    alert(error.response?.data?.message || 'Failed to delete global action')
  }
}




function createGlobalAction() {
  if (projectIsArchived.value) return
  router.push({ 
    name: 'design.globalActions.create', 
    params: { projectId: projectId.value } 
  })
}

function editGlobalAction(action: GlobalActionResponse) {
  router.push({ 
    name: 'design.globalActions.edit', 
    params: { projectId: projectId.value, globalActionId: action.id } 
  })
}

const SPECIAL_ACTIONS: Record<string, { name: string; description: string; blockedEffects?: string[] }> = {
  '__moderation_blocked': {
    name: 'Moderation Blocked',
    description: 'Triggered when a message is blocked by the moderation guardrail.',
  },
  '__conversation_start': {
    name: 'Conversation Start',
    description: 'Executed once after the conversation and first stage are initialised.',
    blockedEffects: ['end_conversation', 'abort_conversation'],
  },
  '__conversation_resume': {
    name: 'Conversation Resume',
    description: 'Executed when a previously-interrupted conversation is resumed.',
    blockedEffects: ['end_conversation', 'abort_conversation'],
  },
  '__conversation_end': {
    name: 'Conversation End',
    description: 'Executed when the conversation is gracefully ended.',
    blockedEffects: ['go_to_stage', 'generate_response', 'abort_conversation'],
  },
  '__conversation_abort': {
    name: 'Conversation Abort',
    description: 'Executed when the conversation is aborted (immediate stop).',
    blockedEffects: ['go_to_stage', 'generate_response', 'end_conversation'],
  },
  '__conversation_failed': {
    name: 'Conversation Failed',
    description: 'Executed when the conversation encounters a fatal error.',
    blockedEffects: ['go_to_stage', 'generate_response', 'end_conversation', 'abort_conversation'],
  },
}

function isSpecialAction(action: GlobalActionResponse): boolean {
  return action.id.startsWith('__')
}

function getSpecialActionTooltip(action: GlobalActionResponse): string {
  const info = SPECIAL_ACTIONS[action.id]
  if (!info) return 'Special system action automatically triggered by the platform.'
  let html = `<strong>${info.name}</strong><br>${info.description}`
  if (info.blockedEffects?.length) {
    html += `<br><span style="opacity:0.75">Blocked: ${info.blockedEffects.join(', ')}</span>`
  }
  return html
}

// Special Actions dropdown
const showSpecialMenu = ref(false)
let outsideClickListener: (() => void) | null = null

function toggleSpecialMenu() {
  showSpecialMenu.value = !showSpecialMenu.value
  if (showSpecialMenu.value) {
    setTimeout(() => {
      outsideClickListener = () => { showSpecialMenu.value = false }
      document.addEventListener('click', outsideClickListener, { once: true })
    }, 0)
  }
}

function navigateToSpecialAction(id: string) {
  showSpecialMenu.value = false
  router.push({
    name: 'design.globalActions.edit',
    params: { projectId: projectId.value, globalActionId: id }
  })
}

onUnmounted(() => {
  if (outsideClickListener) {
    document.removeEventListener('click', outsideClickListener)
  }
})
</script>

<template>
  <div class="container-constrained">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Global Actions</h1>
          <p class="page-subtitle">Define system-wide actions for this project</p>
        </div>
        <div class="flex items-center gap-2">
          <!-- Special Actions dropdown -->
          <div class="relative">
            <button
              @click.stop="toggleSpecialMenu"
              :disabled="projectIsArchived"
              class="btn-alt"
            >
              <ShieldAlert class="w-4 h-4 mr-2" />
              Special Actions
              <ChevronDown class="w-4 h-4 transition-transform" :class="showSpecialMenu ? 'rotate-180' : ''" />
            </button>
            <div
              v-if="showSpecialMenu"
              class="absolute right-0 top-full mt-1 z-10 min-w-56 rounded-md shadow-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 py-1"
            >
              <div class="px-3 py-1 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Moderation</div>
              <button
                @click="navigateToSpecialAction('__moderation_blocked')"
                class="filter-dropdown-item flex items-center gap-2"
              >
                <ShieldAlert class="w-4 h-4 text-violet-500" />
                Moderation Blocked
              </button>
              <div class="border-t border-gray-100 dark:border-gray-600 my-1"></div>
              <div class="px-3 py-1 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Lifecycle</div>
              <button
                v-for="id in ['__conversation_start', '__conversation_resume', '__conversation_end', '__conversation_abort', '__conversation_failed']"
                :key="id"
                @click="navigateToSpecialAction(id)"
                class="filter-dropdown-item flex items-center gap-2"
              >
                <ShieldAlert class="w-4 h-4 text-violet-500" />
                {{ SPECIAL_ACTIONS[id]?.name }}
              </button>
            </div>
          </div>

          <button @click="createGlobalAction" class="btn-primary" :disabled="projectIsArchived">
            <Plus class="inline-block mr-2 w-4 h-4" />
            New Global Action
          </button>
        </div>
      </div>

      <!-- Search Bar -->
      <div class="search-container">
        <Search class="input-icon-left" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by name, trigger, or condition..."
          class="search-input"
        />
        <button v-if="searchQuery" @click="clearSearch" class="input-icon-right">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="globalActionsStore.isLoading" class="loading-state">
        Loading global actions...
      </div>

      <!-- Error State -->
      <div v-else-if="globalActionsStore.error" class="error-state">
        {{ globalActionsStore.error }}
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredGlobalActions.length === 0" class="empty-state">
        <Zap class="empty-state-icon" />
        <p class="empty-state-title">No global actions found</p>
        <p v-if="searchQuery">Try adjusting your search criteria</p>
        <p v-else>Create your first global action to get started</p>
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
                <th class="table-header-cell">Effects</th>
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
              <tr v-for="action in filteredGlobalActions" :key="action.id" class="table-row">
                <td class="table-clickable-cell" @click="editGlobalAction(action)">
                  <span class="inline-flex items-center gap-1.5">
                    {{ action.name }}
                    <Tooltip
                      v-if="isSpecialAction(action)"
                      :html="getSpecialActionTooltip(action)"
                      max-width="280px"
                      @click.stop
                    >
                      <ShieldAlert class="w-3.5 h-3.5 text-violet-500" />
                    </Tooltip>
                    <span v-if="action.archived" class="badge badge-error">Archived</span>
                  </span>
                </td>
                <td class="table-cell">
                  <span v-if="action.effects?.length" class="badge-info">
                    {{ action.effects.length }} effect(s)
                  </span>
                  <span v-else class="text-gray-400">—</span>
                </td>
                <td class="table-cell">
                  <div v-if="action.tags?.length" class="tag-list">
                    <span v-for="tag in action.tags" :key="tag" class="tag-item">{{ tag }}</span>
                  </div>
                  <span v-else class="text-gray-400">—</span>
                </td>
                <td class="table-cell-muted"><RelativeDate :date="action.updatedAt" /></td>
                <td class="table-cell-right">
                  <div class="flex-end">
                    <button @click="editGlobalAction(action)" class="btn-icon-action" :title="(projectIsArchived || action.archived) ? 'View' : 'Edit'">
                      <Eye v-if="projectIsArchived || action.archived" class="w-4 h-4" />
                      <Pencil v-else class="w-4 h-4" />
                    </button>
                    <button @click="deleteGlobalAction(action)" class="btn-icon-action-danger" :disabled="action.archived" title="Delete">
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
        :displayed-count="filteredGlobalActions.length"
        resource-name="global actions"
      />
      </div>
  </div>
</template>


