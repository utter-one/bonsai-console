<script setup lang="ts">
import { onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useProvidersStore } from '@/stores'
import { usePagination, useTableSort, useSearch } from '@/composables'
import AdministrationSectionLayout from '@/layouts/AdministrationSectionLayout.vue'
import { CloudCog, Search, X, Plus } from 'lucide-vue-next'
import type { ProviderResponse } from '@/api/types'
import PaginationControls from '@/components/PaginationControls.vue'

const router = useRouter()
const providersStore = useProvidersStore()

// Search
const { searchQuery, debouncedSearchQuery, textSearchQuery, clearSearch } = useSearch(() => providersStore.items)

// Sorting
const { sortKey, sortOrder, toggleSort, getOrderBy, getSortIcon } = useTableSort('sort-providers')

// Pagination
const pagination = usePagination({
  store: providersStore,
  pageSize: 20,
  onPageChange: loadProviders
})

// Computed
const filteredProviders = computed(() => providersStore.items)

// Watch for sort changes and reload data
watch([sortKey, sortOrder], () => {
  loadProviders()
})

// Watch for search changes and reload data from backend
watch(debouncedSearchQuery, () => {
  pagination.reset()
})

// Lifecycle
onMounted(async () => {
  await loadProviders()
})

// Methods
async function loadProviders() {
  try {
    const orderBy = getOrderBy()
    await providersStore.fetchAll(pagination.getParams({ ...(orderBy ? { orderBy } : {}), ...(textSearchQuery.value ? { textSearch: textSearchQuery.value } : {}) }))
  } catch (error) {
    console.error('Failed to load providers:', error)
  }
}

async function deleteProvider(provider: ProviderResponse) {
  if (!confirm(`Delete provider "${provider.name}" (${provider.id})?\n\nThis action cannot be undone.`)) return

  try {
    await providersStore.remove(provider.id, provider.version)
  } catch (error: any) {
    alert(error.response?.data?.message || 'Failed to delete provider')
  }
}

function createProvider() {
  router.push({ name: 'administration.providers.create' })
}

function editProvider(provider: ProviderResponse) {
  router.push({ 
    name: 'administration.providers.edit', 
    params: { providerId: provider.id } 
  })
}

function formatDate(date: string | null) {
  if (!date) return 'N/A'
  return new Date(date).toLocaleString()
}

function getProviderTypeBadgeClass(type: string) {
  switch (type) {
    case 'llm': return 'badge-primary'
    case 'asr': return 'badge-info'
    case 'tts': return 'badge-warning'
    case 'embeddings': return 'badge-secondary'
    case 'storage': return 'badge-success'
    case 'channel': return 'badge-violet'
    default: return 'badge-default'
  }
}

const API_TYPE_COLORS: Record<string, string> = {
  // LLM
  'openai': '#10a37f',
  'openai-legacy': '#6b7280',
  'anthropic': '#d97706',
  'gemini': '#4285F4',
  'mistral': '#f2773d',
  'groq': '#f55036',
  'deepseek': '#1a73e8',
  'xai': '#374151',
  'openrouter': '#8b5cf6',
  'together': '#6366f1',
  'fireworks': '#ff6b35',
  'perplexity': '#20808d',
  'cohere': '#d18ee2',
  // ASR / TTS
  'deepgram': '#00d3d0',
  'elevenlabs': '#7c3aed',
  'cartesia': '#ec4899',
  'azure': '#0078d4',
  'speechmatics': '#00b09b',
  'assemblyai': '#3d5afe',
  // Channel
  'twilio_messaging': '#f22f46',
  'twilio_voice': '#f22f46',
  'whatsapp': '#25d366',
}

const API_TYPE_LABELS: Record<string, string> = {
  'openai': 'OpenAI',
  'openai-legacy': 'OpenAI (Legacy)',
  'anthropic': 'Anthropic',
  'gemini': 'Google Gemini',
  'mistral': 'Mistral AI',
  'groq': 'Groq',
  'deepseek': 'DeepSeek',
  'xai': 'xAI (Grok)',
  'openrouter': 'OpenRouter',
  'together': 'Together AI',
  'fireworks': 'Fireworks AI',
  'perplexity': 'Perplexity',
  'cohere': 'Cohere',
  'deepgram': 'Deepgram',
  'elevenlabs': 'ElevenLabs',
  'cartesia': 'Cartesia',
  'azure': 'Azure',
  'speechmatics': 'Speechmatics',
  'assemblyai': 'AssemblyAI',
  // Channel
  'twilio_messaging': 'Twilio Messaging',
  'twilio_voice': 'Twilio Voice',
  'whatsapp': 'WhatsApp',
}

function getApiTypeLabel(apiType: string) {
  return API_TYPE_LABELS[apiType] ?? apiType
}

function getApiTypeBadgeStyle(apiType: string) {
  const color = API_TYPE_COLORS[apiType] ?? '#6b7280'
  return { backgroundColor: color, color: '#ffffff' }
}
</script>

<template>
  <AdministrationSectionLayout>
    <div class="container-constrained">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Providers</h1>
          <p class="page-subtitle">Configure AI providers (LLM, ASR, TTS, Embeddings, Storage)</p>
        </div>
        <button @click="createProvider" class="btn-primary">
          <Plus class="inline-block mr-2 w-4 h-4" />
          New Provider
        </button>
      </div>

      <!-- Search Bar -->
      <div class="search-container">
        <Search class="input-icon-left" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by name, type, or description..."
          class="search-input"
        />
        <button v-if="searchQuery" @click="clearSearch" class="input-icon-right">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="providersStore.isLoading" class="loading-state">
        Loading providers...
      </div>

      <!-- Error State -->
      <div v-else-if="providersStore.error" class="error-state">
        {{ providersStore.error }}
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredProviders.length === 0" class="empty-state">
        <CloudCog class="empty-state-icon" />
        <p class="empty-state-title">No providers found</p>
        <p v-if="searchQuery">Try adjusting your search criteria</p>
        <template v-else>
          <p>Connect an AI service to power your projects</p>
          <button class="btn-primary mt-4" @click="createProvider">
            <Plus class="inline-block mr-2 w-4 h-4" />
            Create your first provider
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
                <th class="table-header-cell-sortable" @click="toggleSort('providerType')">
                  <div class="flex items-center gap-1">
                    Type
                    <component :is="getSortIcon('providerType')" class="w-4 h-4" :class="sortKey === 'providerType' ? 'text-primary-600' : 'text-gray-400'" />
                  </div>
                </th>
                <th class="table-header-cell-sortable" @click="toggleSort('apiType')">
                  <div class="flex items-center gap-1">
                    API Type
                    <component :is="getSortIcon('apiType')" class="w-4 h-4" :class="sortKey === 'apiType' ? 'text-primary-600' : 'text-gray-400'" />
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
              <tr v-for="provider in filteredProviders" :key="provider.id" class="table-row">
                <td class="table-clickable-cell"
                  @click="editProvider(provider)">
                    {{ provider.name }}
                </td>
                <td class="table-cell">
                  <span :class="['badge', getProviderTypeBadgeClass(provider.providerType)]">
                    {{ provider.providerType.toUpperCase() }}
                  </span>
                </td>
                <td class="table-cell">
                  <span
                    class="badge"
                    :style="getApiTypeBadgeStyle(provider.apiType)"
                  >{{ getApiTypeLabel(provider.apiType) }}</span>
                </td>
                <td class="table-cell-muted">{{ formatDate(provider.updatedAt) }}</td>
                <td class="table-cell-right">
                  <div class="flex-end">
                    <button @click="editProvider(provider)" class="btn-secondary btn-sm">
                      Edit
                    </button>
                    <button @click="deleteProvider(provider)" class="btn-danger btn-sm">
                      Delete
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
          :displayed-count="filteredProviders.length"
          resource-name="providers"
        />
      </div>
    </div>
  </AdministrationSectionLayout>
</template>

<style scoped>
/* Additional custom styles if needed */
</style>
