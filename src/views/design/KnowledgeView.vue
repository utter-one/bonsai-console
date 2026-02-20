<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useKnowledgeStore, useProjectSelectionStore } from '@/stores'
import { BookOpen, Search, X, Plus, ChevronRight, ChevronDown, Tag } from 'lucide-vue-next'
import type { KnowledgeCategoryResponse, KnowledgeItemResponse } from '@/api/types'
import KnowledgeCategoryModal from '@/components/modals/KnowledgeCategoryModal.vue'
import KnowledgeItemModal from '@/components/modals/KnowledgeItemModal.vue'

const knowledgeStore = useKnowledgeStore()
const projectSelectionStore = useProjectSelectionStore()

// UI state 
const searchQuery = ref('')
const debouncedSearchQuery = ref('')
let searchTimeout: ReturnType<typeof setTimeout> | null = null

const expandedCategories = ref<Set<string>>(new Set())

// Modal state 
const showCategoryModal = ref(false)
const editingCategory = ref<KnowledgeCategoryResponse | null>(null)

const showItemModal = ref(false)
const editingItem = ref<KnowledgeItemResponse | null>(null)
const itemModalCategoryId = ref<string>('')

// Computed 
const projectId = computed(() => projectSelectionStore.selectedProjectId || '')

const filteredCategories = computed(() => {
  if (!debouncedSearchQuery.value) return knowledgeStore.categories
  const q = debouncedSearchQuery.value.toLowerCase()
  return knowledgeStore.categories.filter(
    (cat: KnowledgeCategoryResponse) =>
      cat.name.toLowerCase().includes(q) ||
      cat.promptTrigger.toLowerCase().includes(q) ||
      cat.knowledgeTags.some((t: string) => t.toLowerCase().includes(q)) ||
      cat.items?.some(
        (item: KnowledgeItemResponse) =>
          item.question.toLowerCase().includes(q) ||
          item.answer.toLowerCase().includes(q),
      ),
  )
})

// Watchers 
watch(searchQuery, (value) => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    debouncedSearchQuery.value = value
  }, 300)
})

watch(projectId, () => {
  searchQuery.value = ''
  debouncedSearchQuery.value = ''
  expandedCategories.value = new Set()
  loadCategories()
})

// Lifecycle 
onMounted(() => loadCategories())

// Data loading 
async function loadCategories() {
  if (!projectId.value) return
  try {
    await knowledgeStore.fetchCategories({
      filters: { projectId: projectId.value },
      orderBy: 'order',
    })
  } catch {
    // error is handled in the store
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
  editingCategory.value = null
  showCategoryModal.value = true
}

function openEditCategory(category: KnowledgeCategoryResponse, event: MouseEvent) {
  event.stopPropagation()
  editingCategory.value = category
  showCategoryModal.value = true
}

async function handleCategorySubmit(data: {
  name: string
  promptTrigger: string
  knowledgeTags: string[]
  order: number
}) {
  try {
    if (editingCategory.value) {
      await knowledgeStore.updateCategory(editingCategory.value.id, {
        ...data,
        version: editingCategory.value.version,
      })
    } else {
      const result = await knowledgeStore.createCategory({
        ...data,
        projectId: projectId.value,
      })
      // Auto-expand newly created category
      expandedCategories.value = new Set([...expandedCategories.value, result.id])
    }
    showCategoryModal.value = false
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to save category')
  }
}

async function deleteCategory(category: KnowledgeCategoryResponse, event: MouseEvent) {
  event.stopPropagation()
  const itemCount = (category.items ?? []).length
  const itemWarning = itemCount > 0 ? `\n\nThis will also delete ${itemCount} item(s) within this category.` : ''
  if (!confirm(`Delete category "${category.name}"?${itemWarning}\n\nThis action cannot be undone.`)) return
  try {
    await knowledgeStore.deleteCategory(category.id, category.version)
    expandedCategories.value.delete(category.id)
    expandedCategories.value = new Set(expandedCategories.value)
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to delete category')
  }
}

// Item CRUD 

function openCreateItem(categoryId: string, event: MouseEvent) {
  event.stopPropagation()
  editingItem.value = null
  itemModalCategoryId.value = categoryId
  showItemModal.value = true
  // Auto-expand so items are visible after creation
  expandedCategories.value = new Set([...expandedCategories.value, categoryId])
}

function openEditItem(item: KnowledgeItemResponse, categoryId: string) {
  editingItem.value = item
  itemModalCategoryId.value = categoryId
  showItemModal.value = true
}

async function handleItemSubmit(data: { question: string; answer: string; order: number }) {
  try {
    if (editingItem.value) {
      await knowledgeStore.updateItem(editingItem.value.id, itemModalCategoryId.value, {
        ...data,
        version: editingItem.value.version,
      })
    } else {
      await knowledgeStore.createItem({
        ...data,
        categoryId: itemModalCategoryId.value,
      })
    }
    showItemModal.value = false
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to save item')
  }
}

async function deleteItem(item: KnowledgeItemResponse, categoryId: string) {
  if (!confirm(`Delete item?\n\n"${item.question}"\n\nThis action cannot be undone.`)) return
  try {
    await knowledgeStore.deleteItem(item.id, categoryId, item.version)
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to delete item')
  }
}

// Helpers 
function clearSearch() {
  searchQuery.value = ''
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
      <button @click="openCreateCategory" class="btn-primary">
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
    <div v-else-if="knowledgeStore.error" class="error-state">
      {{ knowledgeStore.error }}
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
          class="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer select-none"
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
                v-for="tag in category.knowledgeTags"
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
              @click="openCreateItem(category.id, $event)"
              class="btn-secondary btn-sm"
              title="Add item to this category"
            >
              <Plus class="w-3 h-3 mr-1" />
              Add Item
            </button>
            <button @click="openEditCategory(category, $event)" class="btn-secondary btn-sm">
              Edit
            </button>
            <button @click="deleteCategory(category, $event)" class="btn-danger btn-sm">
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
            class="px-12 py-5 text-sm text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-850 italic"
          >
            No items yet — click <strong>Add Item</strong> to create the first Q&amp;A pair.
          </div>

          <!-- Item rows -->
          <div
            v-for="item in category.items"
            :key="item.id"
            class="flex items-start gap-3 px-4 py-3 pl-11 bg-gray-50 dark:bg-gray-850 border-b border-gray-100 dark:border-gray-700/50 last:border-b-0 hover:bg-gray-100 dark:hover:bg-gray-800 group"
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
              <button @click="openEditItem(item, category.id)" class="btn-secondary btn-sm">
                Edit
              </button>
              <button @click="deleteItem(item, category.id)" class="btn-danger btn-sm">
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
      @close="showCategoryModal = false"
      @save="handleCategorySubmit"
    />

    <!-- Item Modal -->
    <KnowledgeItemModal
      v-if="showItemModal"
      :item="editingItem"
      @close="showItemModal = false"
      @save="handleItemSubmit"
    />
  </div>
</template>
