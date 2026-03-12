<script setup lang="ts">
import { onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUsersStore, useProjectSelectionStore } from '@/stores'
import { usePagination, useSearch } from '@/composables'
import { Users, Search, X } from 'lucide-vue-next'
import type { UserResponse } from '@/api/types'
import MonitorSectionLayout from '@/layouts/MonitorSectionLayout.vue'
import PaginationControls from '@/components/PaginationControls.vue'
import NoProjectSelected from '@/components/NoProjectSelected.vue'

const router = useRouter()
const usersStore = useUsersStore()
const projectSelectionStore = useProjectSelectionStore()

const projectId = computed(() => projectSelectionStore.selectedProjectId || '')

// Search
const { searchQuery, debouncedSearchQuery, textSearchQuery, clearSearch } = useSearch(() => usersStore.items)

// Pagination
const pagination = usePagination({
  store: usersStore,
  pageSize: 20,
  onPageChange: loadUsers
})

// Computed
const filteredUsers = computed(() => usersStore.items)

// Watch for search changes and reload data from backend
watch(debouncedSearchQuery, () => {
  pagination.reset()
})

// Watch for project selection changes
watch(() => projectSelectionStore.selectedProjectId, () => {
  pagination.reset()
  loadUsers()
})

// Lifecycle
onMounted(async () => {
  await loadUsers()
})

// Methods
async function loadUsers() {
  try {
    await usersStore.fetchAll(projectId.value, pagination.getParams(textSearchQuery.value ? { textSearch: textSearchQuery.value } : {}))
  } catch (error) {
    console.error('Failed to load users:', error)
  }
}

function viewUser(user: UserResponse) {
  router.push({ 
    name: 'monitor.userDetail', 
    params: { userId: user.id } 
  })
}

function formatDate(date: string | null) {
  if (!date) return 'N/A'
  return new Date(date).toLocaleString()
}

function getProfileDisplay(profile: Record<string, any>): string {
  // Try common profile fields
  const name = profile.name || profile.displayName || profile.firstName
  const email = profile.email
  
  if (name && email) return `${name} (${email})`
  if (name) return name
  if (email) return email
  
  // Fallback: show count of profile fields
  const fieldCount = Object.keys(profile).length
  return fieldCount > 0 ? `${fieldCount} field${fieldCount !== 1 ? 's' : ''}` : 'No profile data'
}

</script>

<template>
  <MonitorSectionLayout>
    <NoProjectSelected v-if="!projectId" />
    <div v-else class="container-constrained">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Users</h1>
          <p class="page-subtitle">View and manage platform users</p>
        </div>
      </div>

      <!-- Search Bar -->
      <div class="search-container">
        <Search class="input-icon-left" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by ID or profile data..."
          class="search-input"
        />
        <button v-if="searchQuery" @click="clearSearch" class="input-icon-right">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="usersStore.isLoading" class="loading-state">
        Loading users...
      </div>

      <!-- Error State -->
      <div v-else-if="usersStore.error" class="error-state">
        {{ usersStore.error }}
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredUsers.length === 0" class="empty-state">
        <Users class="empty-state-icon" />
        <p class="empty-state-title">No users found</p>
        <p v-if="searchQuery">Try adjusting your search criteria</p>
        <p v-else>No users have been created yet</p>
      </div>

      <!-- Table -->
      <div v-else class="table-container">
        <div class="table-wrapper">
          <table class="table">
            <thead class="table-header">
              <tr>
                <th class="table-header-cell">User ID</th>
                <th class="table-header-cell">Profile</th>
                <th class="table-header-cell">Created</th>
                <th class="table-header-cell">Updated</th>
                <th class="table-header-cell-right">Actions</th>
              </tr>
            </thead>
            <tbody class="table-body">
              <tr v-for="user in filteredUsers" :key="user.id" class="table-row">
                <td class="table-clickable-cell" @click="viewUser(user)">
                  {{ user.id }}
                </td>
                <td class="table-clickable-cell" @click="viewUser(user)">
                  <div class="flex items-center gap-2">
                    {{ getProfileDisplay(user.profile) }}
                    <span v-if="user.archived" class="badge-secondary">Archived</span>
                  </div>
                </td>
                <td class="table-cell-muted">{{ formatDate(user.createdAt) }}</td>
                <td class="table-cell-muted">{{ formatDate(user.updatedAt) }}</td>
                <td class="table-cell-right">
                  <div class="flex-end">
                    <button @click="viewUser(user)" class="btn-secondary btn-sm">
                      View
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
          :displayed-count="filteredUsers.length"
          resource-name="users"
        />
      </div>
    </div>
  </MonitorSectionLayout>
</template>

<style scoped>
/* Additional custom styles if needed */
</style>
