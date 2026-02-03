<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUsersStore } from '@/stores'
import { usePagination } from '@/composables'
import { Users, Search, X } from 'lucide-vue-next'
import type { UserResponse } from '@/api/types'
import MonitorSectionLayout from '@/layouts/MonitorSectionLayout.vue'
import PaginationControls from '@/components/PaginationControls.vue'

const router = useRouter()
const usersStore = useUsersStore()

// UI State
const searchQuery = ref('')
const debouncedSearchQuery = ref('')
let searchTimeout: ReturnType<typeof setTimeout> | null = null

// Pagination
const pagination = usePagination({
  store: usersStore,
  pageSize: 20,
  onPageChange: loadUsers
})

// Computed
const filteredUsers = computed(() => {
  if (!debouncedSearchQuery.value) return usersStore.items
  const query = debouncedSearchQuery.value.toLowerCase()
  return usersStore.items.filter(user => {
    // Search by user ID
    if (user.id.toLowerCase().includes(query)) return true
    
    // Search by profile values
    const profileValues = Object.values(user.profile || {})
    return profileValues.some(value => {
      if (typeof value === 'string') {
        return value.toLowerCase().includes(query)
      }
      return false
    })
  })
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
  await loadUsers()
})

// Methods
async function loadUsers() {
  try {
    await usersStore.fetchAll(pagination.getParams())
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

function clearSearch() {
  searchQuery.value = ''
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

function getProfilePreview(profile: Record<string, any>): string[] {
  const keys = Object.keys(profile)
  return keys.slice(0, 3)
}
</script>

<template>
  <MonitorSectionLayout>
    <div class="container-constrained">
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
                <td class="table-clickable-cell font-mono text-sm" @click="viewUser(user)">
                  {{ user.id }}
                </td>
                <td class="table-clickable-cell" @click="viewUser(user)">
                  <div>
                    <div class="font-medium text-gray-900">{{ getProfileDisplay(user.profile) }}</div>
                    <div v-if="getProfilePreview(user.profile).length > 0" class="text-xs text-gray-500 mt-1">
                      <span v-for="(key, index) in getProfilePreview(user.profile)" :key="key">
                        {{ key }}{{ index < getProfilePreview(user.profile).length - 1 ? ', ' : '' }}
                      </span>
                      <span v-if="Object.keys(user.profile).length > 3">
                        , +{{ Object.keys(user.profile).length - 3 }} more
                      </span>
                    </div>
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
