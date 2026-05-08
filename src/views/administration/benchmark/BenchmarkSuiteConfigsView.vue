<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBenchmarkSuitesStore, useBenchmarkConfigsStore, useBenchmarkProviderConfigsStore } from '@/stores'
import { Search, X, Plus, ArrowLeft, Pencil, Trash2 } from 'lucide-vue-next'
import type { BenchmarkConfigResponse } from '@/api/types'

const route = useRoute()
const router = useRouter()
const suitesStore = useBenchmarkSuitesStore()
const configsStore = useBenchmarkConfigsStore()
const providerConfigsStore = useBenchmarkProviderConfigsStore()

const suiteId = computed(() => route.params.suiteId as string)
const searchQuery = ref('')

const suite = computed(() => suitesStore.items.find(s => s.id === suiteId.value) ?? suitesStore.currentItem)

const providerConfigName = (id: string) => {
  return providerConfigsStore.items.find(p => p.id === id)?.name ?? id
}

const filteredConfigs = computed(() => {
  const q = searchQuery.value.toLowerCase()
  if (!q) return configsStore.items
  return configsStore.items.filter(c =>
    c.name.toLowerCase().includes(q) ||
    (c.description ?? '').toLowerCase().includes(q)
  )
})

onMounted(async () => {
  await Promise.all([
    configsStore.fetchBySuite(suiteId.value),
    providerConfigsStore.fetchAll(),
    suitesStore.fetchById(suiteId.value),
  ])
})

function createConfig() {
  router.push({ name: 'testing.benchmarkSuites.configs.create', params: { suiteId: suiteId.value } })
}

function editConfig(config: BenchmarkConfigResponse) {
  router.push({ name: 'testing.benchmarkSuites.configs.edit', params: { suiteId: suiteId.value, configId: config.id } })
}

async function deleteConfig(config: BenchmarkConfigResponse) {
  if (!confirm(`Delete benchmark config "${config.name}"?\n\nThis action cannot be undone.`)) return
  try {
    await configsStore.remove(config.id)
  } catch {
    alert('Failed to delete benchmark config')
  }
}

const inputTypeBadge: Record<string, string> = {
  messages: 'badge-info',
  text: 'badge-primary',
  audio: 'badge-warning',
}
</script>

<template>
  <div class="container-constrained">
    <div class="page-header">
      <div class="flex items-center gap-3">
        <button @click="router.push({ name: 'testing.benchmarkSuites.edit', params: { suiteId } })" class="btn-icon">
          <ArrowLeft :size="18" />
        </button>
        <div>
          <h1 class="page-title">Benchmark Configs</h1>
          <p class="page-subtitle">
            Test cases for suite:
            <span class="font-medium text-gray-900 dark:text-white">{{ suite?.name ?? suiteId }}</span>
          </p>
        </div>
      </div>
      <button @click="createConfig" class="btn-primary">
        <Plus class="inline-block mr-2 w-4 h-4" />
        New Config
      </button>
    </div>

    <div class="search-container">
      <Search class="input-icon-left" />
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search configs..."
        class="search-input"
      />
      <button v-if="searchQuery" @click="searchQuery = ''" class="input-icon-right">
        <X class="w-5 h-5" />
      </button>
    </div>

    <div v-if="configsStore.isLoading" class="loading-state">Loading configs...</div>

    <div v-else-if="configsStore.error" class="error-state">
      {{ configsStore.error.message }}
    </div>

    <div v-else-if="filteredConfigs.length === 0" class="empty-state">
      <p class="empty-state-title">No benchmark configs found</p>
      <p v-if="searchQuery">Try adjusting your search</p>
      <p v-else>Add test cases to define what will be benchmarked</p>
    </div>

    <div v-else class="table-container">
      <div class="table-wrapper">
        <table class="table">
          <thead class="table-header">
            <tr>
              <th class="table-header-cell">Name</th>
              <th class="table-header-cell">Description</th>
              <th class="table-header-cell">Provider Config</th>
              <th class="table-header-cell">Input Type</th>
              <th class="table-header-cell">Repeats</th>
              <th class="table-header-cell-right">Actions</th>
            </tr>
          </thead>
          <tbody class="table-body">
            <tr v-for="config in filteredConfigs" :key="config.id" class="table-row">
              <td class="table-clickable-cell font-medium" @click="editConfig(config)">{{ config.name }}</td>
              <td class="table-cell text-gray-500 dark:text-gray-400 max-w-xs truncate">{{ config.description || '—' }}</td>
              <td class="table-cell text-sm">{{ providerConfigName(config.providerConfigId) }}</td>
              <td class="table-cell">
                <span :class="inputTypeBadge[config.inputType] ?? 'badge-secondary'">{{ config.inputType }}</span>
              </td>
              <td class="table-cell">{{ config.repeats }}</td>
              <td class="table-cell-right">
                <div class="flex-end">
                  <button @click="editConfig(config)" class="btn-icon-action" title="Edit">
                    <Pencil class="w-4 h-4" />
                  </button>
                  <button @click="deleteConfig(config)" class="btn-icon-action-danger" title="Delete">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
