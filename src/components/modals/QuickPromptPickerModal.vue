<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import BaseModal from '@/components/BaseModal.vue'
import { useQuickPromptsStore } from '@/stores'
import { useSearch } from '@/composables'
import type { QuickPromptWithSource } from '@/stores/quickPrompts'
import { QUICK_PROMPT_CATEGORIES, QUICK_PROMPT_CATEGORY_LABELS } from '@/stores/quickPrompts'
import { Search, X, ExternalLink, Plus } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: boolean
  categoryId?: string
  projectId: string
}>()

const emit = defineEmits<{
  (e: 'insert', content: string): void
  (e: 'save-as'): void
  (e: 'close'): void
}>()

const router = useRouter()
const store = useQuickPromptsStore()

const selectedPrompt = ref<QuickPromptWithSource | null>(null)
const activeCategory = ref<string>('all')

const { searchQuery, debouncedSearchQuery, textSearchQuery, filteredItems, clearSearch } = useSearch(
  () => store.allPrompts
)

const filteredPrompts = computed(() => {
  let items = filteredItems.value
  if (activeCategory.value !== 'all') {
    items = items.filter(p => p.categoryId === activeCategory.value)
  }
  return items
})

const categories = computed(() => {
  return [
    { key: 'all', label: 'All' },
    ...QUICK_PROMPT_CATEGORIES.map(c => ({ key: c, label: QUICK_PROMPT_CATEGORY_LABELS[c] })),
  ]
})

function handlePromptClick(prompt: QuickPromptWithSource) {
  selectedPrompt.value = prompt
}

function handlePromptDblClick(prompt: QuickPromptWithSource) {
  insertPrompt(prompt.content)
}

function insertPrompt(content: string) {
  emit('insert', content)
}

function navigateToManage() {
  emit('close')
  router.push({ name: 'design.quickPrompts', params: { projectId: props.projectId } })
}

function handleClose() {
  emit('close')
}

function handleCategoryChange(e: Event) {
  activeCategory.value = (e.target as HTMLSelectElement).value
}

async function loadPrompts() {
  selectedPrompt.value = null
  const search = textSearchQuery.value || undefined
  const categoryId = activeCategory.value === 'all' ? undefined : activeCategory.value
  await store.fetchAll(props.projectId, categoryId, search)
}

watch(
  () => props.categoryId,
  (val) => {
    if (val) {
      activeCategory.value = val
    }
  },
  { immediate: true }
)

watch([activeCategory, debouncedSearchQuery], () => {
  loadPrompts()
}, { immediate: true })
</script>

<template>
  <BaseModal :title="'Quick Prompts'" size="full" @close="handleClose">
    <div class="flex flex-col h-[600px]">
      <!-- Top bar: Search + Category dropdown -->
      <div class="flex items-center gap-3 mb-3">
        <div class="relative flex-1 min-w-0">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search prompts..."
            class="w-full pl-10 pr-10 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-primary-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-primary-400 bg-white"
          />
          <button v-if="searchQuery" @click="clearSearch" class="absolute right-3 top-1/2 -translate-y-1/2">
            <X class="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 flex-shrink-0">
          Category
          <select
            :value="activeCategory"
            @change="handleCategoryChange"
            class="form-select-auto"
          >
          <option v-for="cat in categories" :key="cat.key" :value="cat.key">
            {{ cat.label }}
          </option>
          </select>
        </label>
      </div>

      <!-- Body: Prompt list + Preview -->
      <div class="flex gap-4 flex-1 min-h-0">
        <!-- Left sidebar: Prompt list -->
        <div class="w-[300px] flex-shrink-0 overflow-y-auto border-r border-gray-200 dark:border-gray-700 pr-4">
          <div v-if="store.isLoading" class="loading-state py-8">
            Loading prompts...
          </div>
          <div v-else-if="filteredPrompts.length === 0" class="empty-state py-8">
            <p class="text-gray-500 dark:text-gray-400">No prompts found</p>
          </div>
          <div v-else class="flex flex-col gap-2">
            <div
              v-for="prompt in filteredPrompts"
              :key="`${prompt._source}-${prompt.id}`"
              class="p-3 rounded-md border cursor-pointer transition-colors"
              :class="[
                selectedPrompt?.id === prompt.id && selectedPrompt?._source === prompt._source
                  ? 'border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50',
              ]"
              @click="handlePromptClick(prompt)"
              @dblclick="handlePromptDblClick(prompt)"
            >
              <div class="flex items-center justify-between mb-1">
                <span class="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{{ prompt.name }}</span>
                <span
                  class="badge text-xs flex-shrink-0 ml-2"
                  :class="prompt._source === 'global' ? 'badge-info' : 'badge-primary'"
                >
                  {{ prompt._source === 'global' ? 'Global' : 'Project' }}
                </span>
              </div>
              <div v-if="prompt.description" class="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
                {{ prompt.description }}
              </div>
              <div class="text-xs text-gray-400 dark:text-gray-500 font-mono line-clamp-3 whitespace-pre-wrap">
                {{ prompt.content }}
              </div>
              <div class="mt-2 flex items-center gap-2">
                <span class="text-xs text-gray-400 dark:text-gray-500">
                  {{ QUICK_PROMPT_CATEGORY_LABELS[prompt.categoryId] }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Main area: Prompt preview -->
        <div class="flex-1 flex flex-col min-w-0">
          <div v-if="!selectedPrompt" class="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
            <div class="text-center">
              <p>Select a prompt to preview</p>
              <p class="text-sm mt-1">Double-click to insert</p>
            </div>
          </div>
          <div v-else class="flex flex-col h-full">
            <div class="flex items-start justify-between mb-3">
              <div class="min-w-0">
                <h3 class="font-semibold text-gray-900 dark:text-gray-100 truncate">{{ selectedPrompt.name }}</h3>
                <div class="flex items-center gap-2 mt-1">
                  <span
                    class="badge text-xs"
                    :class="selectedPrompt._source === 'global' ? 'badge-info' : 'badge-primary'"
                  >
                    {{ selectedPrompt._source === 'global' ? 'Global' : 'Project' }}
                  </span>
                  <span class="text-xs text-gray-400 dark:text-gray-500">
                    {{ QUICK_PROMPT_CATEGORY_LABELS[selectedPrompt.categoryId] }}
                  </span>
                </div>
              </div>
            </div>

            <div v-if="selectedPrompt.description" class="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {{ selectedPrompt.description }}
            </div>

            <div class="flex-1 min-h-0 mb-3">
              <label class="form-label text-xs">Content</label>
              <textarea
                :value="selectedPrompt.content"
                readonly
                class="form-input w-full h-full min-h-[200px] resize-none font-mono text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom bar: Control buttons -->
      <div class="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="btn-secondary"
            @click="navigateToManage"
          >
            <ExternalLink class="inline-block mr-1 w-4 h-4" />
            Manage
          </button>
          <button
            type="button"
            class="btn-secondary"
            @click="emit('save-as')"
          >
            <Plus class="inline-block mr-1 w-4 h-4" />
            Save as Quick Prompt
          </button>
        </div>
        <button
          type="button"
          class="btn-primary"
          :disabled="!selectedPrompt"
          @click="selectedPrompt && insertPrompt(selectedPrompt.content)"
        >
          Insert at cursor
        </button>
      </div>
    </div>
  </BaseModal>
</template>
