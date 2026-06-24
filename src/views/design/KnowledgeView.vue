<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useKnowledgeStore, useProjectSelectionStore } from '@/stores'
import { useProjectReadOnly } from '@/composables/useProjectReadOnly'
import { useSearch } from '@/composables'
import { BookOpen, Search, X, Plus, ChevronRight, ChevronDown, Trash2, GripVertical } from 'lucide-vue-next'
import type { KnowledgeCategoryLocal, KnowledgeItemLocal, TemporaryKnowledgeCategory, TemporaryKnowledgeItem } from '@/stores/knowledge'
import TagsEditor from '@/components/TagsEditor.vue'

const knowledgeStore = useKnowledgeStore()
const projectSelectionStore = useProjectSelectionStore()

const { searchQuery, debouncedSearchQuery, textSearchQuery, clearSearch } = useSearch(() => knowledgeStore.categories)

const expandedCategories = ref<Set<string>>(new Set())

const loadError = ref<string | null>(null)

const projectId = computed(() => projectSelectionStore.selectedProjectId || '')
const { projectIsArchived } = useProjectReadOnly()

const filteredCategories = computed(() => knowledgeStore.categories)

function categoryIsReadOnly(category: KnowledgeCategoryLocal | TemporaryKnowledgeCategory) {
  return projectIsArchived.value || !!category.archived
}

// --- Validation state ---
const categoryErrors = ref<Map<string, { name?: string; trigger?: string }>>(new Map())
const itemErrors = ref<Map<string, { questions?: string[]; answer?: string }>>(new Map())

function validateCategory(category: KnowledgeCategoryLocal | TemporaryKnowledgeCategory): boolean {
  const errors: { name?: string; trigger?: string } = {}
  if (!category.name?.trim()) errors.name = 'Name is required'
  if (!category.promptTrigger?.trim()) errors.trigger = 'Trigger is required'
  categoryErrors.value.set(category.id, errors)
  categoryErrors.value = new Map(categoryErrors.value)
  return !errors.name && !errors.trigger
}

function validateItem(item: KnowledgeItemLocal | TemporaryKnowledgeItem): boolean {
  const errors: { questions?: string[]; answer?: string } = {}
  const questions = item.questions ?? []
  errors.questions = questions.map((q) => q.trim() ? '' : 'Question is required')
  if (!item.answer?.trim()) errors.answer = 'Answer is required'
  itemErrors.value.set(item.id, errors)
  itemErrors.value = new Map(itemErrors.value)
  return !errors.questions?.some(e => e) && !errors.answer
}

function getCategoryError(categoryId: string, field: 'name' | 'trigger'): string | undefined {
  return categoryErrors.value.get(categoryId)?.[field]
}

function getItemQuestionError(itemId: string, index: number): string | undefined {
  const errors = itemErrors.value.get(itemId)
  return errors?.questions?.[index]
}

function getItemError(itemId: string, field: 'answer'): string | undefined {
  return itemErrors.value.get(itemId)?.[field]
}

// --- Blur-based save state ---
const skipNextItemSave = ref(false)

function onItemBlur(itemId: string) {
  if (skipNextItemSave.value) {
    skipNextItemSave.value = false
    return
  }
  saveItem(itemId)
}

// --- Drag and drop state ---
const draggedCategory = ref<KnowledgeCategoryLocal | TemporaryKnowledgeCategory | null>(null)
const draggedItem = ref<{ item: KnowledgeItemLocal | TemporaryKnowledgeItem; categoryId: string } | null>(null)
const dropTargetCategory = ref<KnowledgeCategoryLocal | TemporaryKnowledgeCategory | null>(null)
const dropTargetItem = ref<KnowledgeItemLocal | TemporaryKnowledgeItem | null>(null)

// --- Category drag and drop ---
function onCategoryDragStart(category: KnowledgeCategoryLocal | TemporaryKnowledgeCategory) {
  draggedCategory.value = category
  knowledgeStore.categories.forEach((cat) => { cat._orderBeforeDrag = cat.order })
}

function onCategoryDragOver(event: DragEvent) {
  event.preventDefault()
  event.dataTransfer!.dropEffect = 'move'
}

function onCategoryDragEnter(category: KnowledgeCategoryLocal | TemporaryKnowledgeCategory) {
  dropTargetCategory.value = category
}

function onCategoryDragLeave() {
  dropTargetCategory.value = null
}

async function onCategoryDrop(category: KnowledgeCategoryLocal | TemporaryKnowledgeCategory) {
  const from = draggedCategory.value
  if (!from || from === category) {
    draggedCategory.value = null
    dropTargetCategory.value = null
    return
  }
  const categories = knowledgeStore.categories
  const fromIndex = categories.findIndex((c) => c.id === from.id)
  const toIndex = categories.findIndex((c) => c.id === category.id)
  if (fromIndex === -1 || toIndex === -1) {
    draggedCategory.value = null
    dropTargetCategory.value = null
    return
  }
  const [moved] = categories.splice(fromIndex, 1)
  categories.splice(toIndex, 0, moved as KnowledgeCategoryLocal | TemporaryKnowledgeCategory)
  categories.forEach((cat, i) => { cat.order = i })
  for (const cat of categories) {
    if (cat.order !== cat._orderBeforeDrag) {
      try {
        if (!isTemporaryCategory(cat)) {
          await knowledgeStore.updateCategory(projectId.value, cat.id, { order: cat.order, version: cat.version })
        }
      } catch (err: any) {
        alert(err.response?.data?.message || `Failed to update order for "${cat.name}"`)
      }
    }
  }
  draggedCategory.value = null
  dropTargetCategory.value = null
}

function onCategoryDragEnd() {
  draggedCategory.value = null
  dropTargetCategory.value = null
}

// --- Item drag and drop ---
function onItemDragStart(item: KnowledgeItemLocal | TemporaryKnowledgeItem, categoryId: string) {
  draggedItem.value = { item, categoryId }
  const category = knowledgeStore.categories.find((c) => c.id === categoryId)
  category?.items?.forEach((it) => { it._orderBeforeDrag = it.order })
}

function onItemDragOver(event: DragEvent) {
  event.preventDefault()
  event.dataTransfer!.dropEffect = 'move'
}

function onItemDragEnter(item: KnowledgeItemLocal | TemporaryKnowledgeItem) {
  dropTargetItem.value = item
}

function onItemDragLeave() {
  dropTargetItem.value = null
}

async function onItemDrop(targetItem: KnowledgeItemLocal | TemporaryKnowledgeItem, targetCategoryId: string) {
  const from = draggedItem.value
  if (!from || from.categoryId !== targetCategoryId) {
    draggedItem.value = null
    dropTargetItem.value = null
    return
  }
  if (from.item.id === targetItem.id) {
    draggedItem.value = null
    dropTargetItem.value = null
    return
  }
  const category = knowledgeStore.categories.find((c) => c.id === targetCategoryId)
  if (!category?.items) {
    draggedItem.value = null
    dropTargetItem.value = null
    return
  }
  const fromIndex = category.items.findIndex((i) => i.id === from.item.id)
  const toIndex = category.items.findIndex((i) => i.id === targetItem.id)
  if (fromIndex === -1 || toIndex === -1) {
    draggedItem.value = null
    dropTargetItem.value = null
    return
  }
  const [moved] = category.items.splice(fromIndex, 1)
  category.items.splice(toIndex, 0, moved as KnowledgeItemLocal | TemporaryKnowledgeItem)
  category.items.forEach((item, i) => { item.order = i })
  for (const item of category.items) {
    if (item.order !== item._orderBeforeDrag) {
      try {
        if (!isTemporaryItem(item)) {
          await knowledgeStore.updateItem(projectId.value, item.id, targetCategoryId, { order: item.order, version: item.version })
        }
      } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to update item order')
      }
    }
  }
  draggedItem.value = null
  dropTargetItem.value = null
}

function onItemDragEnd() {
  draggedItem.value = null
  dropTargetItem.value = null
}

async function saveCategory(categoryId: string) {
  const category = knowledgeStore.categories.find((c) => c.id === categoryId)
  if (!category) return
  if (!validateCategory(category)) return
  if (isTemporaryCategory(category)) {
    try {
      await knowledgeStore.createCategory(projectId.value, {
        name: category.name,
        promptTrigger: category.promptTrigger,
        tags: category.tags,
        order: category.order,
      })
      knowledgeStore.deleteTemporaryCategory(categoryId)
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create category')
    }
    return
  }
  try {
    await knowledgeStore.updateCategory(projectId.value, categoryId, {
      name: category.name,
      promptTrigger: category.promptTrigger,
      tags: category.tags,
      order: category.order,
      version: category.version,
    })
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to save category')
  }
}

async function saveItem(itemId: string) {
  for (const cat of knowledgeStore.categories) {
    const item = (cat.items ?? []).find((i) => i.id === itemId)
    if (!item) continue
    if (!validateItem(item)) return
    if (isTemporaryItem(item)) {
      await persistNewItem(itemId, cat.id)
      return
    }
    try {
      await knowledgeStore.updateItem(projectId.value, itemId, cat.id, {
        questions: item.questions?.filter((q) => q.trim()),
        answer: item.answer,
        order: item.order,
        version: item.version,
      })
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save item')
    }
    return
  }
}

watch(projectId, () => {
  clearSearch()
  expandedCategories.value = new Set()
  loadCategories()
})

watch(debouncedSearchQuery, () => {
  loadCategories()
})

onMounted(() => loadCategories())

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

// --- Tree expand / collapse ---
function toggleExpand(categoryId: string) {
  const tempItems = knowledgeStore.categories.find((c) => c.id === categoryId)
    ?.items?.filter((i) => isTemporaryItem(i))
  if (expandedCategories.value.has(categoryId)) {
    if (tempItems?.length) {
      knowledgeStore.discardTemporaryItems(categoryId)
    }
    expandedCategories.value.delete(categoryId)
  } else {
    expandedCategories.value.add(categoryId)
  }
  expandedCategories.value = new Set(expandedCategories.value)
}

function isExpanded(categoryId: string) {
  return expandedCategories.value.has(categoryId)
}

// --- Category CRUD ---
function openCreateCategory() {
  if (projectIsArchived.value) return
  const cat = knowledgeStore.addTemporaryCategory()
  expandedCategories.value = new Set([...expandedCategories.value, cat.id])
}

async function deleteCategory(category: KnowledgeCategoryLocal | TemporaryKnowledgeCategory) {
  if (isTemporaryCategory(category)) {
    knowledgeStore.deleteTemporaryCategory(category.id)
    expandedCategories.value.delete(category.id)
    expandedCategories.value = new Set(expandedCategories.value)
    return
  }
  if (category.archived) return
  const itemCount = (category.items ?? []).filter((i) => !isTemporaryItem(i)).length
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

// --- Item CRUD ---
function openCreateItem(categoryId: string) {
  if (projectIsArchived.value) return
  knowledgeStore.addTemporaryItem(categoryId)
  expandedCategories.value = new Set([...expandedCategories.value, categoryId])
  expandedCategories.value = new Set(expandedCategories.value)
}

async function persistNewItem(itemId: string, categoryId: string) {
  const category = knowledgeStore.categories.find((c) => c.id === categoryId)
  if (!category) return
  const item = (category.items ?? []).find((i) => i.id === itemId) as TemporaryKnowledgeItem | null
  if (!item || !item.questions?.length) return
  try {
    await knowledgeStore.createItem(projectId.value, {
      categoryId,
      questions: item.questions.filter((q) => q.trim()),
      answer: item.answer,
      order: item.order,
    })
    knowledgeStore.deleteTemporaryItem(categoryId, itemId)
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to create item')
  }
}

function removeItemQuestion(categoryId: string, itemId: string, questionIndex: number) {
  const category = knowledgeStore.categories.find((c) => c.id === categoryId)
  if (!category) return
  const item = (category.items ?? []).find((i) => i.id === itemId)
  if (!item || !item.questions) return
  item.questions.splice(questionIndex, 1)
  saveItem(itemId)
}

function addItemQuestion(categoryId: string, itemId: string) {
  const category = knowledgeStore.categories.find((c) => c.id === categoryId)
  if (!category) return
  const item = (category.items ?? []).find((i) => i.id === itemId)
  if (!item) return
  item.questions.push('')
}

function deleteItem(item: KnowledgeItemLocal | TemporaryKnowledgeItem, categoryId: string) {
  if (isTemporaryItem(item)) {
    knowledgeStore.deleteTemporaryItem(categoryId, item.id)
    return
  }
  if (item.archived) return
  if (!confirm(`Delete item?\n\n"${item.questions?.[0] ?? 'No question'}"\n\nThis action cannot be undone.`)) return
  knowledgeStore.deleteItem(projectId.value, item.id, categoryId, item.version)
}

function isTemporaryItem(item: KnowledgeItemLocal | TemporaryKnowledgeItem): item is TemporaryKnowledgeItem {
  return (item as TemporaryKnowledgeItem)._temporary === true
}

function isTemporaryCategory(category: KnowledgeCategoryLocal | TemporaryKnowledgeCategory): category is TemporaryKnowledgeCategory {
  return (category as TemporaryKnowledgeCategory)._temporary === true
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
    <div v-if="knowledgeStore.isLoading && !knowledgeStore.isSaving" class="loading-state">
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
        class="rounded-lg border-gray-200 border dark:border-gray-700 overflow-hidden"
      >
        <!-- Category header -->
        <div
          class="bg-gray-100 dark:bg-gray-700"
          :class="[dropTargetCategory?.id === category.id ? 'ring-2 ring-blue-500 dark:ring-blue-400 ring-inset' : '']"
          draggable="true"
          @dragstart="onCategoryDragStart(category)"
          @dragover="onCategoryDragOver"
          @dragenter="onCategoryDragEnter(category)"
          @dragleave="onCategoryDragLeave"
          @drop="onCategoryDrop(category)"
          @dragend="onCategoryDragEnd"
        >
          <!-- Row: expand + name + tags + actions -->
          <div class="flex items-center gap-2 px-3 py-2">
            <!-- Expand toggle -->
            <button
              @click="toggleExpand(category.id)"
              class="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-0.5"
            >
              <ChevronDown v-if="isExpanded(category.id)" class="w-4 h-4" />
              <ChevronRight v-else class="w-4 h-4" />
            </button>

            <!-- Name input (inline-editable label style) -->
            <div class="flex-shrink-0">
              <input
                v-model="category.name"
                @blur="saveCategory(category.id)"
                v-autowidth
                type="text"
                :class="['font-medium bg-transparent border-none outline-none px-1 py-0.5 text-gray-900 dark:text-gray-100 cursor-pointer placeholder-gray-400 dark:placeholder-gray-500 focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:cursor-text focus:rounded focus:cursor-text transition-all duration-150', getCategoryError(category.id, 'name') ? 'ring-1 ring-red-500 dark:ring-red-400 rounded-md' : '']"
                placeholder="Category name"
                :disabled="categoryIsReadOnly(category)"
              />
            </div>

            <!-- Actions (right-aligned, column on mobile, row on md+) -->
            <div class="ml-auto flex flex-col md:flex-row items-center gap-2 flex-shrink-0">
              <!-- Tags (inline, to the right of name) -->
              <TagsEditor
                v-model="category.tags"
                :show-label="false"
                :horizontal="true"
                :simple="true"
                :disabled="categoryIsReadOnly(category)"
                @blur="saveCategory(category.id)"
              />
              <div class="flex flex-col md:flex-row items-center gap-2">
                <button
                  class="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  title="Drag to reorder"
                >
                  <GripVertical class="w-4 h-4" />
                </button>
                <button
                  v-if="!categoryIsReadOnly(category)"
                  @click="openCreateItem(category.id)"
                  class="flex-shrink-0 border border-gray-700 w-8 h-8 flex items-center justify-center rounded bg-gray-700 dark:bg-gray-900 text-gray-400 hover:text-green-400"
                >
                  <Plus class="w-4 h-4" />                  
                </button>
                <button
                  v-if="!categoryIsReadOnly(category)"
                  @click="deleteCategory(category)"
                  class="flex-shrink-0 border border-gray-700 w-8 h-8 flex items-center justify-center rounded bg-gray-700 dark:bg-gray-900 text-gray-400 hover:text-red-400"
                  title="Delete category"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          <p v-if="getCategoryError(category.id, 'name')" class="form-field-error px-12 -mt-2! pb-2">{{ getCategoryError(category.id, 'name') }}</p>

          <!-- Row: trigger -->
          <div class="flex items-start gap-2 px-3 pb-2">
            <span class="w-5" />
            <span class="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 w-16 text-right pr-2 pt-1">Trigger</span>
            <div class="flex-1 min-w-0">
              <textarea
                v-model="category.promptTrigger"
                @blur="saveCategory(category.id)"
                v-autosize
                :class="['bg-transparent border-none outline-none px-1 py-0.5 text-sm text-gray-600 dark:text-gray-300 cursor-pointer placeholder-gray-400 dark:placeholder-gray-500 italic focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:cursor-text focus:rounded focus:cursor-text transition-all duration-150', getCategoryError(category.id, 'trigger') ? 'ring-1 ring-red-500 dark:ring-red-400 rounded-md' : '']"
                placeholder="e.g. When the user asks about pricing..."
                :disabled="categoryIsReadOnly(category)"
                rows="1"
              />
              <p v-if="getCategoryError(category.id, 'trigger')" class="form-field-error -mt-1">{{ getCategoryError(category.id, 'trigger') }}</p>
            </div>
          </div>
        </div>

        <!-- Expanded items -->
        <div v-if="isExpanded(category.id)" class="bg-gray-200 dark:bg-gray-800">
          <!-- Empty items placeholder -->
          <div
            v-if="!category.items || category.items.length === 0"
            class="px-12 py-5 text-sm text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-900 italic"
          >
            No items yet — click <strong>+ Add item</strong> to create the first Q&amp;A pair.
          </div>

          <!-- Items -->
          <div
            v-for="item in category.items"
            :key="item.id"
            class="border-t border-gray-100 dark:border-gray-700"
            :class="[dropTargetItem?.id === item.id ? 'ring-2 ring-blue-500 dark:ring-blue-400 ring-inset' : '']"
            draggable="true"
            @dragstart="onItemDragStart(item, category.id)"
            @dragover="onItemDragOver"
            @dragenter="onItemDragEnter(item)"
            @dragleave="onItemDragLeave"
            @drop="onItemDrop(item, category.id)"
            @dragend="onItemDragEnd"
          >
            <div class="p-3 space-y-2">
              <!-- Questions label + actions -->
              <div class="flex items-center gap-2">
                <span class="text-xs text-gray-500 dark:text-gray-400 mr-auto">Questions</span>
                <button
                  class="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  title="Drag to reorder"
                >
                  <GripVertical class="w-4 h-4" />
                </button>
                <button
                  v-if="!categoryIsReadOnly(category)"
                  @click="deleteItem(item, category.id)"
                  class="flex-shrink-0 border border-gray-700 w-8 h-8 flex items-center justify-center rounded bg-gray-700 dark:bg-gray-900 text-gray-400 hover:text-red-400"
                  :title="isTemporaryItem(item) ? 'Discard item' : 'Delete item'"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
              <div v-for="(_, qi) in item.questions" :key="qi" class="flex items-start gap-2">
                <div class="flex-1 min-w-0">
                  <textarea
                    v-model="item.questions[qi]"
                    @blur="onItemBlur(item.id)"
                    v-autosize
                    :class="['form-input flex-1 min-w-0 text-sm bg-gray-100 dark:bg-gray-900!', getItemQuestionError(item.id, qi) ? 'ring-1 ring-red-500 dark:ring-red-400 rounded-md' : '']"
                    placeholder="Question..."
                    :disabled="categoryIsReadOnly(category)"
                    rows="1"
                  />
                  <p v-if="getItemQuestionError(item.id, qi)" class="form-field-error -mt-1">{{ getItemQuestionError(item.id, qi) }}</p>
                </div>
                <button
                  v-if="!categoryIsReadOnly(category) && qi === 0"
                  @mousedown="skipNextItemSave = true"
                  @click="addItemQuestion(category.id, item.id)"
                  class="flex-shrink-0 border border-gray-700 w-8 h-8 flex items-center justify-center rounded bg-gray-700 dark:bg-gray-900 text-gray-400 hover:text-green-400"
                  title="Add question"
                >
                  <Plus class="w-4 h-4" />
                </button>
                <button
                  v-if="!categoryIsReadOnly(category) && item.questions.length > 1"
                  @mousedown="skipNextItemSave = true"
                  @click="removeItemQuestion(category.id, item.id, qi)"
                  class="flex-shrink-0 border border-gray-700 w-8 h-8 flex items-center justify-center rounded bg-gray-700 dark:bg-gray-900 text-gray-400 hover:text-red-400"
                  title="Remove question"
                >
                  <X class="w-4 h-4" />
                </button>
              </div>

              <!-- Answer -->
              <div>
                <span class="text-xs text-gray-500 dark:text-gray-400">Answer</span>
                <textarea
                  v-model="item.answer"
                  @blur="onItemBlur(item.id)"
                  v-autosize
                  :class="['form-input w-full text-sm bg-gray-100 dark:bg-gray-900!', getItemError(item.id, 'answer') ? 'ring-1 ring-red-500 dark:ring-red-400 rounded-md' : '']"
                  placeholder="Answer..."
                  :disabled="categoryIsReadOnly(category)"
                />
              </div>

              <!-- Answer validation error -->
              <p v-if="getItemError(item.id, 'answer')" class="form-field-error -mt-1">{{ getItemError(item.id, 'answer') }}</p>
            </div>
          </div>

          <!-- Category info bar -->
          <div class="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
            <span class="text-xs text-gray-400">
              {{ (category.items ?? []).filter((i) => !isTemporaryItem(i)).length }} item{{ (category.items ?? []).filter((i) => !isTemporaryItem(i)).length === 1 ? '' : 's' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
