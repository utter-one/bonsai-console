<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useBenchmarkSuitesStore } from '@/stores'
import { Gauge, Search, X, Plus, Pencil, Trash2 } from 'lucide-vue-next'
import RelativeDate from '@/components/RelativeDate.vue'
import type { BenchmarkSuiteResponse } from '@/api/types'

const router = useRouter()
const suitesStore = useBenchmarkSuitesStore()

const searchQuery = ref('')

const filteredSuites = computed(() => {
  const q = searchQuery.value.toLowerCase()
  if (!q) return suitesStore.items
  return suitesStore.items.filter(s =>
    s.name.toLowerCase().includes(q) ||
    (s.description ?? '').toLowerCase().includes(q) ||
    s.tags.some(t => t.toLowerCase().includes(q))
  )
})

onMounted(() => suitesStore.fetchAll())

function createSuite() {
  router.push({ name: 'administration.benchmarkSuites.create' })
}

function editSuite(suite: BenchmarkSuiteResponse) {
  router.push({ name: 'administration.benchmarkSuites.edit', params: { suiteId: suite.id } })
}

async function deleteSuite(suite: BenchmarkSuiteResponse) {
  if (!confirm(`Delete benchmark suite "${suite.name}"?\n\nThis will also delete all associated configs. This action cannot be undone.`)) return
  try {
    await suitesStore.remove(suite.id)
    await suitesStore.fetchAll()
  } catch {
    alert('Failed to delete benchmark suite')
  }
}
</script>

<template>
  <div class="flex-1 min-w-0">
  <div class="container-constrained">
    <div class="page-header">
      <div>
        <h1 class="page-title">Benchmark Suites</h1>
        <p class="page-subtitle">Manage benchmark suites for automated provider performance testing</p>
      </div>
      <button @click="createSuite" class="btn-primary">
        <Plus class="inline-block mr-2 w-4 h-4" />
        New Suite
      </button>
    </div>

    <div class="search-container">
      <Search class="input-icon-left" />
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search by name, description, or tag..."
        class="search-input"
      />
      <button v-if="searchQuery" @click="searchQuery = ''" class="input-icon-right">
        <X class="w-5 h-5" />
      </button>
    </div>

    <div v-if="suitesStore.isLoading" class="loading-state">Loading suites...</div>

    <div v-else-if="suitesStore.error" class="error-state">
      {{ suitesStore.error.message }}
    </div>

    <div v-else-if="filteredSuites.length === 0" class="empty-state">
      <Gauge class="empty-state-icon" />
      <p class="empty-state-title">No benchmark suites found</p>
      <p v-if="searchQuery">Try adjusting your search</p>
      <p v-else>Create your first benchmark suite to get started</p>
    </div>

    <div v-else class="table-container">
      <div class="table-wrapper">
        <table class="table">
          <thead class="table-header">
            <tr>
              <th class="table-header-cell">Name</th>
              <th class="table-header-cell">Description</th>
              <th class="table-header-cell">Schedule</th>
              <th class="table-header-cell">Active</th>
              <th class="table-header-cell">Tags</th>
              <th class="table-header-cell">Updated</th>
              <th class="table-header-cell-right">Actions</th>
            </tr>
          </thead>
          <tbody class="table-body">
            <tr v-for="suite in filteredSuites" :key="suite.id" class="table-row">
              <td class="table-clickable-cell font-medium" @click="editSuite(suite)">
                {{ suite.name }}
              </td>
              <td class="table-cell text-gray-500 dark:text-gray-400 max-w-xs truncate">
                {{ suite.description || '—' }}
              </td>
              <td class="table-cell">
                <span v-if="suite.cronExpression" class="font-mono text-xs text-gray-700 dark:text-gray-300">
                  {{ suite.cronExpression }}
                </span>
                <span v-else class="text-gray-400 dark:text-gray-500">Manual</span>
              </td>
              <td class="table-cell">
                <span :class="suite.isActive ? 'badge-active' : 'badge-secondary'">
                  {{ suite.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="table-cell">
                <div class="flex flex-wrap gap-1">
                  <span v-for="tag in suite.tags" :key="tag" class="badge-secondary">{{ tag }}</span>
                  <span v-if="suite.tags.length === 0" class="text-gray-400 dark:text-gray-500">—</span>
                </div>
              </td>
              <td class="table-cell-muted"><RelativeDate :date="suite.updatedAt" /></td>
              <td class="table-cell-right">
                <div class="flex-end">
                  <button @click="editSuite(suite)" class="btn-icon-action" title="Edit">
                    <Pencil class="w-4 h-4" />
                  </button>
                  <button @click="deleteSuite(suite)" class="btn-icon-action-danger" title="Delete">
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
  </div>
</template>
