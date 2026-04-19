<script setup lang="ts">
import { onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useOperatorsStore } from '@/stores'
import { formatEnum, usePagination, useTableSort, useSearch } from '@/composables'
import RelativeDate from '@/components/RelativeDate.vue'
import { User, Search, X, Plus } from 'lucide-vue-next'
import type { OperatorResponse } from '@/api/types'
import AdministrationSectionLayout from '@/layouts/AdministrationSectionLayout.vue'
import PaginationControls from '@/components/PaginationControls.vue'

const router = useRouter()
const operatorsStore = useOperatorsStore()

// Search
const { searchQuery, debouncedSearchQuery, textSearchQuery, clearSearch } = useSearch(() => operatorsStore.items)

// Sorting
const { sortKey, sortOrder, toggleSort, getOrderBy, getSortIcon } = useTableSort('sort-operators')

// Pagination
const pagination = usePagination({
  store: operatorsStore,
  pageSize: 20,
  onPageChange: loadOperators
})

// Computed
const filteredOperators = computed(() => operatorsStore.items)

// Watch for sort changes and reload data
watch([sortKey, sortOrder], () => {
  loadOperators()
})

// Watch for search changes and reload data from backend
watch(debouncedSearchQuery, () => {
  pagination.reset()
})

// Lifecycle
onMounted(async () => {
  await loadOperators()
})

// Methods
async function loadOperators() {
  try {
    const orderBy = getOrderBy()
    await operatorsStore.fetchAll(pagination.getParams({ ...(orderBy ? { orderBy } : {}), ...(textSearchQuery.value ? { textSearch: textSearchQuery.value } : {}) }))
  } catch (error) {
    console.error('Failed to load operators:', error)
  }
}

function createOperator() {
  router.push({ name: 'administration.operators.create' })
}

function editOperator(operator: OperatorResponse) {
  router.push({ 
    name: 'administration.operators.edit', 
    params: { operatorId: operator.id } 
  })
}

async function deleteOperator(operator: OperatorResponse) {
  if (!confirm(`Delete operator "${operator.name}" (${operator.id})?\n\nThis action cannot be undone.`)) return

  try {
    await operatorsStore.remove(operator.id, operator.version)
  } catch (error: any) {
    alert(error.response?.data?.message || 'Failed to delete operator')
  }
}


</script>

<template>
  <AdministrationSectionLayout>
    <div class="container-constrained">
      <!-- Header -->
      <div class="page-header">
      <div>
        <h1 class="page-title">Operators</h1>
        <p class="page-subtitle">Manage operator users and permissions</p>
      </div>
      <button @click="createOperator" class="btn-primary">
        <Plus class="inline-block mr-2 w-4 h-4" />
        New Operator
      </button>
    </div>

    <!-- Search Bar -->
    <div class="search-container">
      <Search class="input-icon-left" />
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search by ID, name, or role..."
        class="search-input"
      />
      <button v-if="searchQuery" @click="clearSearch" class="input-icon-right">
        <X class="w-5 h-5" />
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="operatorsStore.isLoading" class="loading-state">
      Loading operators...
    </div>

    <!-- Error State -->
    <div v-else-if="operatorsStore.error" class="error-state">
      {{ operatorsStore.error }}
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredOperators.length === 0" class="empty-state">
      <User class="empty-state-icon" />
      <p class="empty-state-title">No operators found</p>
      <p v-if="searchQuery">Try adjusting your search criteria</p>
      <p v-else>Create your first operator to get started</p>
    </div>

    <!-- Table -->
    <div v-else class="table-container">
      <div class="table-wrapper">
        <table class="table">
          <thead class="table-header">
            <tr>
              <th class="table-header-cell-sortable" @click="toggleSort('email')">
                <div class="flex items-center gap-1">
                  Email
                  <component :is="getSortIcon('email')" class="w-4 h-4" :class="sortKey === 'email' ? 'text-primary-600' : 'text-gray-400'" />
                </div>
              </th>
              <th class="table-header-cell-sortable" @click="toggleSort('name')">
                <div class="flex items-center gap-1">
                  Name
                  <component :is="getSortIcon('name')" class="w-4 h-4" :class="sortKey === 'name' ? 'text-primary-600' : 'text-gray-400'" />
                </div>
              </th>
              <th class="table-header-cell">Roles</th>
              <th class="table-header-cell-sortable" @click="toggleSort('createdAt')">
                <div class="flex items-center gap-1">
                  Created
                  <component :is="getSortIcon('createdAt')" class="w-4 h-4" :class="sortKey === 'createdAt' ? 'text-primary-600' : 'text-gray-400'" />
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
            <tr v-for="operator in filteredOperators" :key="operator.id" class="table-row">
              <td class="table-clickable-cell" @click="editOperator(operator)">
                {{ operator.id }}
              </td>
              <td class="table-clickable-cell" @click="editOperator(operator)">
                {{ operator.name }}
              </td>
              <td class="table-cell">
                <div class="flex-gap">
                  <span v-for="role in operator.roles" :key="role" class="badge-primary">
                    {{ formatEnum(role) }}
                  </span>
                </div>
              </td>
              <td class="table-cell-muted"><RelativeDate :date="operator.createdAt" /></td>
              <td class="table-cell-muted"><RelativeDate :date="operator.updatedAt" /></td>
              <td class="table-cell-right">
                <div class="flex-end">
                  <button @click="editOperator(operator)" class="btn-secondary btn-sm">
                    Edit
                  </button>
                  <button @click="deleteOperator(operator)" class="btn-danger btn-sm">
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
        :displayed-count="filteredOperators.length"
        resource-name="operators"
      />
    </div>
  </div>
  </AdministrationSectionLayout>
</template>

<style scoped>
/* Additional custom styles if needed */
</style>
