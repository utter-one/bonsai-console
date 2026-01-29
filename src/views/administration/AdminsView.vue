<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminsStore } from '@/stores'
import { formatRoleName, usePagination } from '@/composables'
import { User, Search, X } from 'lucide-vue-next'
import type { AdminResponse } from '@/types/api'
import AdministrationSectionLayout from '@/layouts/AdministrationSectionLayout.vue'
import PaginationControls from '@/components/PaginationControls.vue'

const router = useRouter()
const adminsStore = useAdminsStore()

// UI State
const searchQuery = ref('')
const debouncedSearchQuery = ref('')
let searchTimeout: ReturnType<typeof setTimeout> | null = null

// Pagination
const pagination = usePagination({
  store: adminsStore,
  pageSize: 20,
  onPageChange: loadAdmins
})

// Computed
const filteredAdmins = computed(() => {
  if (!debouncedSearchQuery.value) return adminsStore.items
  const query = debouncedSearchQuery.value.toLowerCase()
  return adminsStore.items.filter(admin => 
    admin.id.toLowerCase().includes(query) ||
    admin.name.toLowerCase().includes(query) ||
    admin.roles.some(role => role.toLowerCase().includes(query))
  )
})

// Watch for search query changes with debounce
watch(searchQuery, (newValue) => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    debouncedSearchQuery.value = newValue
  }, 300)
})

// Lifecycle
onMounted(async () => {
  await loadAdmins()
})

// Methods
async function loadAdmins() {
  try {
    await adminsStore.fetchAll(pagination.getParams())
  } catch (error) {
    console.error('Failed to load admins:', error)
  }
}

function createAdmin() {
  router.push({ name: 'administration.admins.create' })
}

function editAdmin(admin: AdminResponse) {
  router.push({ 
    name: 'administration.admins.edit', 
    params: { adminId: admin.id } 
  })
}

async function deleteAdmin(admin: AdminResponse) {
  if (!confirm(`Delete admin "${admin.name}" (${admin.id})?\n\nThis action cannot be undone.`)) return

  try {
    await adminsStore.remove(admin.id, admin.version)
  } catch (error: any) {
    alert(error.response?.data?.message || 'Failed to delete admin')
  }
}

function formatDate(date: string | null) {
  if (!date) return 'N/A'
  return new Date(date).toLocaleString()
}

function clearSearch() {
  searchQuery.value = ''
}
</script>

<template>
  <AdministrationSectionLayout>
    <div class="container-constrained">
      <!-- Header -->
      <div class="page-header">
      <div>
        <h1 class="page-title">Administrators</h1>
        <p class="page-subtitle">Manage admin users and permissions</p>
      </div>
      <button @click="createAdmin" class="btn-primary">
        <User class="inline-block mr-2 w-4 h-4" />
        New Administrator
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
    <div v-if="adminsStore.isLoading" class="loading-state">
      Loading administrators...
    </div>

    <!-- Error State -->
    <div v-else-if="adminsStore.error" class="error-state">
      {{ adminsStore.error }}
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredAdmins.length === 0" class="empty-state">
      <User class="empty-state-icon" />
      <p class="empty-state-title">No administrators found</p>
      <p v-if="searchQuery">Try adjusting your search criteria</p>
      <p v-else>Create your first administrator to get started</p>
    </div>

    <!-- Table -->
    <div v-else class="table-container">
      <div class="table-wrapper">
        <table class="table">
          <thead class="table-header">
            <tr>
              <th class="table-header-cell">Email</th>
              <th class="table-header-cell">Name</th>
              <th class="table-header-cell">Roles</th>
              <th class="table-header-cell">Created</th>
              <th class="table-header-cell">Updated</th>
              <th class="table-header-cell-right">Actions</th>
            </tr>
          </thead>
          <tbody class="table-body">
            <tr v-for="admin in filteredAdmins" :key="admin.id" class="table-row">
              <td class="table-clickable-cell" @click="editAdmin(admin)">
                {{ admin.id }}
              </td>
              <td class="table-clickable-cell" @click="editAdmin(admin)">
                {{ admin.name }}
              </td>
              <td class="table-cell">
                <div class="flex-gap">
                  <span v-for="role in admin.roles" :key="role" class="badge-primary">
                    {{ formatRoleName(role) }}
                  </span>
                </div>
              </td>
              <td class="table-cell-muted">{{ formatDate(admin.createdAt) }}</td>
              <td class="table-cell-muted">{{ formatDate(admin.updatedAt) }}</td>
              <td class="table-cell-right">
                <div class="flex-end">
                  <button @click="editAdmin(admin)" class="btn-secondary btn-sm">
                    Edit
                  </button>
                  <button @click="deleteAdmin(admin)" class="btn-danger btn-sm">
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
        :displayed-count="filteredAdmins.length"
        resource-name="administrators"
      />
    </div>
  </div>
  </AdministrationSectionLayout>
</template>

<style scoped>
/* Additional custom styles if needed */
</style>
