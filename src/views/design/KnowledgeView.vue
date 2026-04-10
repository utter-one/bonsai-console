<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useKnowledgeStore, useProjectSelectionStore } from '@/stores'
import { useProjectReadOnly } from '@/composables/useProjectReadOnly'
import { useSearch } from '@/composables'
import { BookOpen, Search, X, Plus, ChevronRight, ChevronDown, Tag } from 'lucide-vue-next'
import type { KnowledgeCategoryResponse, KnowledgeItemResponse, ParsedError } from '@/api/types'
import { parseApiError } from '@/utils/errors'
import KnowledgeCategoryModal from '@/components/modals/KnowledgeCategoryModal.vue'
import KnowledgeItemModal from '@/components/modals/KnowledgeItemModal.vue'

const knowledgeStore = useKnowledgeStore()
const projectSelectionStore = useProjectSelectionStore()

// Search
const { searchQuery, debouncedSearchQuery, textSearchQuery, clearSearch } = useSearch(() => knowledgeStore.categories)

const expandedCategories = ref<Set<string>>(new Set())

// Modal state 
const showCategoryModal = ref(false)
const editingCategory = ref<KnowledgeCategoryResponse | null>(null)
const categoryError = ref<ParsedError | null>(null)

const showItemModal = ref(false)
const editingItem = ref<KnowledgeItemResponse | null>(null)
const itemModalCategoryId = ref<string>('')
const itemError = ref<ParsedError | null>(null)

const loadError = ref<string | null>(null)

// computed helper to locate the category currently being edited/created for items
const activeCategory = computed(() =>
  knowledgeStore.categories.find((c) => c.id === itemModalCategoryId.value) || null
)

// Computed 
const projectId = computed(() => projectSelectionStore.selectedProjectId || '')
const { projectIsArchived } = useProjectReadOnly()

const filteredCategories = computed(() => knowledgeStore.categories)

// helper to determine if a category should be treated as read-only (project archived or category archived)
function categoryIsReadOnly(category: KnowledgeCategoryResponse) {
  return projectIsArchived.value || !!category.archived
}

// Watchers 
watch(projectId, () => {
  clearSearch()
  expandedCategories.value = new Set()
  loadCategories()
})

// Watch for search changes and reload data from backend
watch(debouncedSearchQuery, () => {
  loadCategories()
})

// Lifecycle 
onMounted(() => loadCategories())

// Data loading 
async function loadCategories() {
  if (!projectId.value) return
  loadError.value = null
  try {
    await knowledgeStore.fetchCategories(projectId.value, {
      filters: {},
      orderBy: 'order',
      ...(textSearchQuery.value ? { textSearch: textSearchQuery.value } : {}),
    })
  } catch (err: any) {
    loadError.value = err.response?.data?.message || 'Failed to load knowledge categories'
  }
}

// Tree expand / collapse 
function toggleExpand(categoryId: string) {
  if (expandedCategories.value.has(categoryId)) {
    expandedCategories.value.delete(categoryId)
  } else {
    expandedCategories.value.add(categoryId)
  }
  // trigger reactivity
  expandedCategories.value = new Set(expandedCategories.value)
}

function isExpanded(categoryId: string) {
  return expandedCategories.value.has(categoryId)
}

// Category CRUD 
function openCreateCategory() {
  if (projectIsArchived.value) return
  editingCategory.value = null
  categoryError.value = null
  showCategoryModal.value = true
}

function openEditCategory(category: KnowledgeCategoryResponse, event: MouseEvent) {
  event.stopPropagation()
  editingCategory.value = category
  categoryError.value = null
  showCategoryModal.value = true
}

async function handleCategorySubmit(data: {
  name: string
  promptTrigger: string
  tags: string[]
  order: number
}) {
  try {
    if (editingCategory.value) {
      await knowledgeStore.updateCategory(projectId.value, editingCategory.value.id, {
        ...data,
        version: editingCategory.value.version,
      })
    } else {
      const result = await knowledgeStore.createCategory(projectId.value, {
        ...data,
      })
      // Auto-expand newly created category
      expandedCategories.value = new Set([...expandedCategories.value, result.id])
    }
    showCategoryModal.value = false
  } catch (err: any) {
    categoryError.value = parseApiError(err)
  }
}

async function deleteCategory(category: KnowledgeCategoryResponse, event: MouseEvent) {
  event.stopPropagation()
  if (category.archived) return
  const itemCount = (category.items ?? []).length
  const itemWarning = itemCount > 0 ? `\n\nThis will also delete ${itemCount} item(s) within this category.` : ''
  if (!confirm(`Delete category "${category.name}"?${itemWarning}\n\nThis action cannot be undone.`)) return
  try {
    await knowledgeStore.deleteCategory(projectId.value, category.id, category.version)
    expandedCategories.value.delete(category.id)
    expandedCategories.value = new Set(expandedCategories.value)
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to delete category')
  }
}

// Item CRUD 

function openCreateItem(categoryId: string, event: MouseEvent) {
  event.stopPropagation()
  if (projectIsArchived.value) return
  editingItem.value = null
  itemModalCategoryId.value = categoryId
  itemError.value = null
  showItemModal.value = true
  // Auto-expand so items are visible after creation
  expandedCategories.value = new Set([...expandedCategories.value, categoryId])
}

function openEditItem(item: KnowledgeItemResponse, categoryId: string) {
  editingItem.value = item
  itemModalCategoryId.value = categoryId
  itemError.value = null
  showItemModal.value = true
}

async function handleItemSubmit(data: { question: string; answer: string; order: number }) {
  try {
    if (editingItem.value) {
      await knowledgeStore.updateItem(projectId.value, editingItem.value.id, itemModalCategoryId.value, {
        ...data,
        version: editingItem.value.version,
      })
    } else {
      await knowledgeStore.createItem(projectId.value, {
        ...data,
        categoryId: itemModalCategoryId.value,
      })
    }
    showItemModal.value = false
  } catch (err: any) {
    itemError.value = parseApiError(err)
  }
}

async function deleteItem(item: KnowledgeItemResponse, categoryId: string) {
  if (item.archived) return
  if (!confirm(`Delete item?\n\n"${item.question}"\n\nThis action cannot be undone.`)) return
  try {
    await knowledgeStore.deleteItem(projectId.value, item.id, categoryId, item.version)
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to delete item')
  }
}

async function handleCategoryRecoverSuccess() {
  await loadCategories()
  if (editingCategory.value) {
    editingCategory.value = knowledgeStore.categories.find(c => c.id === editingCategory.value!.id) ?? editingCategory.value
  }
}

async function handleItemRecoverSuccess() {
  await loadCategories()
  if (editingItem.value) {
    const cat = knowledgeStore.categories.find(c => c.id === itemModalCategoryId.value)
    editingItem.value = cat?.items?.find(i => i.id === editingItem.value!.id) ?? editingItem.value
  }
}

</script>

<template>
  <div class="container-constrained">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Knowledge</h1>
        <p class="page-subtitle">Manage knowledge categories and Q&amp;A items</p>
      </div>
      <button @click="openCreateCategory" class="btn-primary" :disabled="projectIsArchived">
        <Plus class="inline-block mr-2 w-4 h-4" />
        New Category
      </button>
    </div>

    <!-- Search Bar -->
    <div class="search-container">
      <Search class="input-icon-left" />
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search categories and items..."
        class="search-input"
      />
      <button v-if="searchQuery" @click="clearSearch" class="input-icon-right">
        <X class="w-5 h-5" />
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="knowledgeStore.isLoading" class="loading-state">
      Loading knowledge...
    </div>

    <!-- Error State -->
    <div v-else-if="loadError" class="error-state">
      {{ loadError }}
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredCategories.length === 0" class="empty-state">
      <BookOpen class="empty-state-icon" />
      <p class="empty-state-title">No knowledge categories found</p>
      <p v-if="searchQuery" class="text-sm text-gray-500">Try adjusting your search query</p>
      <p v-else class="text-sm text-gray-500">Create your first category to get started</p>
    </div>

    <!-- Knowledge Tree -->
    <div v-else class="space-y-2">
      <div
        v-for="category in filteredCategories"
        :key="category.id"
        class="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        <!-- Category row -->
        <div
          class="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer select-none"
          @click="toggleExpand(category.id)"
        >
          <!-- Expand toggle -->
          <span class="flex-shrink-0 text-gray-400">
            <ChevronDown v-if="isExpanded(category.id)" class="w-4 h-4" />
            <ChevronRight v-else class="w-4 h-4" />
          </span>

          <!-- Category info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-medium text-gray-900 dark:text-gray-100">{{ category.name }}</span>
              <span class="text-xs font-normal text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                {{ (category.items ?? []).length }} item{{ (category.items ?? []).length === 1 ? '' : 's' }}
              </span>
              <span
                v-for="tag in category.tags"
                :key="tag"
                class="inline-flex items-center gap-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full"
              >
                <Tag class="w-3 h-3" />
                {{ tag }}
              </span>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
              Trigger: <span class="italic">{{ category.promptTrigger }}</span>
            </p>
          </div>

          <!-- Category actions -->
          <div class="flex-shrink-0 flex items-center gap-2" @click.stop>
            <button
              v-if="!categoryIsReadOnly(category)"
              @click="openCreateItem(category.id, $event)"
              class="btn-secondary btn-sm"
              title="Add item to this category"
            >
              <Plus class="w-3 h-3 mr-1" />
              Add Item
            </button>
            <button
              @click="openEditCategory(category, $event)"
              :class="['btn-secondary btn-sm', categoryIsReadOnly(category) ? '' : '']"
            >
              {{ categoryIsReadOnly(category) ? 'View' : 'Edit' }}
            </button>
            <button
              v-if="!categoryIsReadOnly(category)"
              @click="deleteCategory(category, $event)"
              class="btn-danger btn-sm"
            >
              Delete
            </button>
          </div>
        </div>

        <!-- Items list (expandable) -->
        <div
          v-if="isExpanded(category.id)"
          class="border-t border-gray-200 dark:border-gray-700"
        >
          <!-- Empty items placeholder -->
          <div
            v-if="!category.items || category.items.length === 0"
            class="px-12 py-5 text-sm text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-900 italic"
          >
            No items yet — click <strong>Add Item</strong> to create the first Q&amp;A pair.
          </div>

          <!-- Item rows -->
          <div
            v-for="item in category.items"
            :key="item.id"
            class="flex items-start gap-3 px-4 py-3 pl-11 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700/50 last:border-b-0 hover:bg-gray-100 dark:hover:bg-gray-800 group"
          >
            <!-- Item content -->
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-800 dark:text-gray-200">
                {{ item.question }}
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                {{ item.answer }}
              </p>
            </div>

            <!-- Item actions -->
            <div class="flex-shrink-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                @click="openEditItem(item, category.id)"
                class="btn-secondary btn-sm"
              >
                {{ categoryIsReadOnly(category) ? 'View' : 'Edit' }}
              </button>
              <button
                v-if="!categoryIsReadOnly(category)"
                @click="deleteItem(item, category.id)"
                class="btn-danger btn-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Category Modal -->
    <KnowledgeCategoryModal
      v-if="showCategoryModal"
      :category="editingCategory"
      :error="categoryError"
      :load-history="editingCategory ? () => knowledgeStore.fetchCategoryAuditLogs(projectId, editingCategory!.id) : undefined"
      :update-fn="editingCategory ? (data) => knowledgeStore.updateCategory(projectId, editingCategory!.id, data) : undefined"
      :create-fn="editingCategory ? (data) => knowledgeStore.createCategory(projectId, data) : undefined"
      @close="showCategoryModal = false"
      @save="handleCategorySubmit"
      @recover-success="handleCategoryRecoverSuccess"
    />

    <!-- Item Modal -->
    <KnowledgeItemModal
      v-if="showItemModal"
      :item="editingItem"
      :error="itemError"
      :category-archived="activeCategory ? activeCategory.archived : false"
      :load-history="editingItem ? () => knowledgeStore.fetchItemAuditLogs(projectId, editingItem!.id) : undefined"
      :update-fn="editingItem ? (data) => knowledgeStore.updateItem(projectId, editingItem!.id, itemModalCategoryId, data) : undefined"
      :create-fn="editingItem ? (data) => knowledgeStore.createItem(projectId, data) : undefined"
      @close="showItemModal = false"
      @save="handleItemSubmit"
      @recover-success="handleItemRecoverSuccess"
    />
  </div>
</template>
