<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import BaseModal from '@/components/BaseModal.vue'
import { useQuickPromptsStore } from '@/stores'
import { useSearch } from '@/composables'
import { QUICK_PROMPT_CATEGORIES, QUICK_PROMPT_CATEGORY_LABELS } from '@/stores/quickPrompts'
import { Search, X, Plus } from 'lucide-vue-next'

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

const store = useQuickPromptsStore()

const activeCategory = ref<string>('all')

const { searchQuery, debouncedSearchQuery, textSearchQuery, filteredItems: filteredPrompts, clearSearch } = useSearch(
  () => store.allPrompts
)

const categories = computed(() => {
  return [
    { key: 'all', label: 'All' },
    ...QUICK_PROMPT_CATEGORIES.map(c => ({ key: c, label: QUICK_PROMPT_CATEGORY_LABELS[c] })),
  ]
})

function insertPrompt(content: string) {
  emit('insert', content)
}

function handleClose() {
  emit('close')
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

watch(debouncedSearchQuery, () => {
  loadPrompts()
})

watch(activeCategory, () => {
  loadPrompts()
})

onMounted(async () => {
  await loadPrompts()
})

async function loadPrompts() {
  const search = textSearchQuery.value || undefined
  const categoryId = activeCategory.value === 'all' ? undefined : activeCategory.value
  await store.fetchAll(props.projectId, categoryId, search)
}
</script>

<template>
  <BaseModal title="Quick Prompts" size="lg" @close="handleClose">
    <div class="flex flex-col" style="max-height: 500px;">
      <!-- Search + filters bar -->
      <div class="flex flex-col gap-3 mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
        <div class="flex gap-2">
          <div class="search-container flex-1">
            <Search class="input-icon-left" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search prompts..."
              class="search-input"
            />
            <button v-if="searchQuery" @click="clearSearch" class="input-icon-right">
              <X class="w-5 h-5" />
            </button>
          </div>
          <button
            type="button"
            class="btn-secondary whitespace-nowrap"
            @click="emit('save-as')"
          >
            <Plus class="inline-block mr-1 w-4 h-4" />
            Save as Quick Prompt
          </button>
        </div>

        <div class="flex gap-1 flex-wrap">
          <button
            v-for="cat in categories"
            :key="cat.key"
            type="button"
            class="px-3 py-1 text-xs rounded-full border transition-colors"
            :class="activeCategory === cat.key
              ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 dark:border-primary-600'
              : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'"
            @click="activeCategory = cat.key"
          >
            {{ cat.label }}
          </button>
        </div>
      </div>

      <!-- Prompt list -->
      <div class="overflow-y-auto flex-1">
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
            class="p-3 rounded-md border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <span class="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{{ prompt.name }}</span>
                  <span
                    class="badge text-xs flex-shrink-0"
                    :class="prompt._source === 'global' ? 'badge-info' : 'badge-primary'"
                  >
                    {{ prompt._source === 'global' ? 'Global' : 'Project' }}
                  </span>
                  <span class="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                    {{ QUICK_PROMPT_CATEGORY_LABELS[prompt.categoryId] }}
                  </span>
                </div>
                <div v-if="prompt.description" class="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-1">
                  {{ prompt.description }}
                </div>
                <div class="text-xs text-gray-400 dark:text-gray-500 font-mono line-clamp-2 whitespace-pre-wrap">
                  {{ prompt.content }}
                </div>
              </div>
              <button
                type="button"
                class="btn-sm flex-shrink-0"
                @click="insertPrompt(prompt.content)"
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </BaseModal>
</template>
