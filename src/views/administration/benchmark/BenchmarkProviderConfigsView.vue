<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useBenchmarkProviderConfigsStore } from '@/stores'
import { Search, X, Plus, Cpu } from 'lucide-vue-next'
import type { BenchmarkProviderConfigResponse } from '@/api/types'

const router = useRouter()
const store = useBenchmarkProviderConfigsStore()

const searchQuery = ref('')

const filteredConfigs = computed(() => {
  const q = searchQuery.value.toLowerCase()
  if (!q) return store.items
  return store.items.filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.providerType.toLowerCase().includes(q) ||
    c.providerId.toLowerCase().includes(q)
  )
})

onMounted(() => store.fetchAll())

function createConfig() {
  router.push({ name: 'administration.benchmarkProviderConfigs.create' })
}

function editConfig(config: BenchmarkProviderConfigResponse) {
  router.push({ name: 'administration.benchmarkProviderConfigs.edit', params: { providerConfigId: config.id } })
}

async function deleteConfig(config: BenchmarkProviderConfigResponse) {
  if (!confirm(`Delete provider config "${config.name}"?\n\nThis action cannot be undone.`)) return
  try {
    await store.remove(config.id)
  } catch {
    alert('Failed to delete provider config')
  }
}

const providerTypeBadge: Record<string, string> = {
  llm: 'badge-info',
  tts: 'badge-primary',
  asr: 'badge-warning',
}
</script>

<template>
  <div class="flex-1 min-w-0">
  <div class="container-constrained">
    <div class="page-header">
      <div>
        <h1 class="page-title">Benchmark Provider Configs</h1>
        <p class="page-subtitle">Configure providers used by benchmark test cases</p>
      </div>
      <button @click="createConfig" class="btn-primary">
        <Plus class="inline-block mr-2 w-4 h-4" />
        New Provider Config
      </button>
    </div>

    <div class="search-container">
      <Search class="input-icon-left" />
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search by name, type, or provider ID..."
        class="search-input"
      />
      <button v-if="searchQuery" @click="searchQuery = ''" class="input-icon-right">
        <X class="w-5 h-5" />
      </button>
    </div>

    <div v-if="store.isLoading" class="loading-state">Loading provider configs...</div>

    <div v-else-if="store.error" class="error-state">
      {{ store.error.message }}
    </div>

    <div v-else-if="filteredConfigs.length === 0" class="empty-state">
      <Cpu class="empty-state-icon" />
      <p class="empty-state-title">No provider configs found</p>
      <p v-if="searchQuery">Try adjusting your search</p>
      <p v-else>Create a provider config to use in benchmark test cases</p>
    </div>

    <div v-else class="table-container">
      <div class="table-wrapper">
        <table class="table">
          <thead class="table-header">
            <tr>
              <th class="table-header-cell">Name</th>
              <th class="table-header-cell">Provider Type</th>
              <th class="table-header-cell">Provider ID</th>
              <th class="table-header-cell-right">Actions</th>
            </tr>
          </thead>
          <tbody class="table-body">
            <tr v-for="config in filteredConfigs" :key="config.id" class="table-row">
              <td class="table-clickable-cell font-medium" @click="editConfig(config)">{{ config.name }}</td>
              <td class="table-cell">
                <span :class="providerTypeBadge[config.providerType] ?? 'badge-secondary'">{{ config.providerType.toUpperCase() }}</span>
              </td>
              <td class="table-cell font-mono text-xs text-gray-600 dark:text-gray-300">{{ config.providerId }}</td>
              <td class="table-cell-right">
                <div class="flex-end">
                  <button @click="editConfig(config)" class="btn-secondary btn-sm">Edit</button>
                  <button @click="deleteConfig(config)" class="btn-danger btn-sm">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
  </div>
</template>
