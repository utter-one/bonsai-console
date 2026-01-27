<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useAdminsStore } from '@/stores'
import { formatRoleName } from '@/composables'
import { User, Search, X, Eye, EyeOff } from 'lucide-vue-next'
import type { AdminResponse } from '@/types/api'
import AdminEditModal from '@/components/modals/AdminEditModal.vue'
import AdministrationSectionLayout from '@/layouts/AdministrationSectionLayout.vue'

const adminsStore = useAdminsStore()

// UI State
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showPasswordModal = ref(false)
const searchQuery = ref('')
const debouncedSearchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
let searchTimeout: ReturnType<typeof setTimeout> | null = null

// Forms
const adminForm = ref({
  id: '',
  displayName: '',
  roles: [] as string[],
  password: '',
  metadata: {}
})

const editingAdmin = ref<AdminResponse | null>(null)
const passwordForm = ref({
  adminId: '',
  password: '',
  confirmPassword: ''
})

// Password visibility
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const showNewPassword = ref(false)

// Available roles (from OpenAPI spec)
const availableRoles = ref(['super_admin', 'content_manager', 'support', 'developer', 'viewer'])

// Computed
const filteredAdmins = computed(() => {
  if (!debouncedSearchQuery.value) return adminsStore.items
  const query = debouncedSearchQuery.value.toLowerCase()
  return adminsStore.items.filter(admin => 
    admin.id.toLowerCase().includes(query) ||
    admin.displayName.toLowerCase().includes(query) ||
    admin.roles.some(role => role.toLowerCase().includes(query))
  )
})

const isSuperAdminSelected = computed(() => adminForm.value.roles.includes('super_admin'))

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
    await adminsStore.fetchAll({
      offset: (currentPage.value - 1) * pageSize.value,
      limit: pageSize.value
    })
  } catch (error) {
    console.error('Failed to load admins:', error)
  }
}

function openCreateModal() {
  adminForm.value = {
    id: '',
    displayName: '',
    roles: [],
    password: '',
    metadata: {}
  }
  showCreateModal.value = true
}

function openEditModal(admin: AdminResponse) {
  editingAdmin.value = admin
  showEditModal.value = true
}

function openPasswordModal(admin: AdminResponse) {
  passwordForm.value = {
    adminId: admin.id,
    password: '',
    confirmPassword: ''
  }
  showPasswordModal.value = true
}

async function createAdmin() {
  if (!adminForm.value.id || !adminForm.value.displayName || !adminForm.value.password) {
    alert('Please fill in all required fields')
    return
  }

  if (adminForm.value.roles.length === 0) {
    alert('Please assign at least one role')
    return
  }

  try {
    await adminsStore.create({
      id: adminForm.value.id,
      displayName: adminForm.value.displayName,
      roles: adminForm.value.roles,
      password: adminForm.value.password,
      metadata: adminForm.value.metadata
    })
    showCreateModal.value = false
    adminForm.value = {
      id: '',
      displayName: '',
      roles: [],
      password: '',
      metadata: {}
    }
  } catch (error: any) {
    alert(error.response?.data?.message || 'Failed to create admin')
  }
}

async function updateAdmin(data: { displayName: string; roles: string[]; metadata: any }) {
  if (!editingAdmin.value) return

  try {
    await adminsStore.update(editingAdmin.value.id, {
      version: editingAdmin.value.version,
      displayName: data.displayName,
      roles: data.roles,
      metadata: data.metadata
    })
    showEditModal.value = false
    editingAdmin.value = null
  } catch (error: any) {
    alert(error.response?.data?.message || 'Failed to update admin')
  }
}

async function updatePassword() {
  if (!passwordForm.value.password || !passwordForm.value.confirmPassword) {
    alert('Please fill in all fields')
    return
  }

  if (passwordForm.value.password !== passwordForm.value.confirmPassword) {
    alert('Passwords do not match')
    return
  }

  if (passwordForm.value.password.length < 8) {
    alert('Password must be at least 8 characters')
    return
  }

  try {
    const admin = adminsStore.items.find(a => a.id === passwordForm.value.adminId)
    if (!admin) return

    await adminsStore.update(admin.id, {
      version: admin.version,
      password: passwordForm.value.password
    })
    showPasswordModal.value = false
    passwordForm.value = {
      adminId: '',
      password: '',
      confirmPassword: ''
    }
  } catch (error: any) {
    alert(error.response?.data?.message || 'Failed to update password')
  }
}

async function deleteAdmin(admin: AdminResponse) {
  if (!confirm(`Delete admin "${admin.displayName}" (${admin.id})?\n\nThis action cannot be undone.`)) return

  try {
    await adminsStore.remove(admin.id, admin.version)
  } catch (error: any) {
    alert(error.response?.data?.message || 'Failed to delete admin')
  }
}

function toggleRole(role: string) {
  const index = adminForm.value.roles.indexOf(role)
  
  // If selecting super_admin, clear all other roles
  if (role === 'super_admin' && index === -1) {
    adminForm.value.roles = ['super_admin']
  }
  // If super_admin is already selected and trying to add another role, do nothing
  else if (adminForm.value.roles.includes('super_admin') && role !== 'super_admin') {
    return
  }
  // If selecting another role while super_admin is not selected
  else if (index > -1) {
    adminForm.value.roles.splice(index, 1)
  } else {
    adminForm.value.roles.push(role)
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
      <button @click="openCreateModal" class="btn-primary">
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
              <th class="table-header-cell">ID</th>
              <th class="table-header-cell">Display Name</th>
              <th class="table-header-cell">Roles</th>
              <th class="table-header-cell">Created</th>
              <th class="table-header-cell">Updated</th>
              <th class="table-header-cell-right">Actions</th>
            </tr>
          </thead>
          <tbody class="table-body">
            <tr v-for="admin in filteredAdmins" :key="admin.id" class="table-row">
              <td class="table-cell-mono">{{ admin.id }}</td>
              <td class="table-cell-medium">{{ admin.displayName }}</td>
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
                  <button @click="openEditModal(admin)" class="btn-secondary btn-sm">
                    Edit
                  </button>
                  <button @click="openPasswordModal(admin)" class="btn-secondary btn-sm">
                    Password
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

      <!-- Pagination Info -->
      <div class="table-footer">
        <div class="flex-between text-sm text-gray-600">
          <span>
            Showing {{ filteredAdmins.length }} of {{ adminsStore.pagination.total }} administrators
          </span>
          <span>Version tracking enabled (optimistic locking)</span>
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click="showCreateModal = false">
      <div class="modal-content" @click.stop>
        <h2 class="modal-header">Create Administrator</h2>
        
        <form @submit.prevent="createAdmin">
          <div class="form-group">
            <label class="form-label">
              Admin ID <span class="required">*</span>
            </label>
            <input
              v-model="adminForm.id"
              type="text"
              required
              placeholder="admin-id"
              class="form-input-mono"
            />
            <p class="form-help-text">Unique identifier for the administrator</p>
          </div>

          <div class="form-group">
            <label class="form-label">
              Display Name <span class="required">*</span>
            </label>
            <input
              v-model="adminForm.displayName"
              type="text"
              required
              placeholder="John Doe"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label class="form-label">
              Password <span class="required">*</span>
            </label>
            <div class="input-icon-container">
              <input
                v-model="adminForm.password"
                :type="showPassword ? 'text' : 'password'"
                required
                placeholder="Enter password (min. 8 characters)"
                class="input-with-right-icon"
              />
              <button type="button" @click="showPassword = !showPassword" class="input-icon-right">
                <Eye v-if="!showPassword" class="w-5 h-5" />
                <EyeOff v-else class="w-5 h-5" />
              </button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">
              Roles <span class="required">*</span>
            </label>
            <div class="flex-gap mt-2">
              <label
                v-for="role in availableRoles"
                :key="role"
                :class="isSuperAdminSelected && role !== 'super_admin' ? 'checkbox-label-disabled' : 'checkbox-label'"
              >
                <input
                  type="checkbox"
                  :checked="adminForm.roles.includes(role)"
                  :disabled="isSuperAdminSelected && role !== 'super_admin'"
                  @change="toggleRole(role)"
                  class="form-checkbox"
                />
                <span class="text-sm text-gray-700">{{ formatRoleName(role) }}</span>
              </label>
            </div>
            <p class="form-help-text">Select at least one role</p>
          </div>

          <div class="modal-footer">
            <button type="button" @click="showCreateModal = false" class="btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn-primary">
              Create Administrator
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Edit Modal -->
    <AdminEditModal
      v-if="showEditModal"
      :admin="editingAdmin"
      :available-roles="availableRoles"
      @close="showEditModal = false"
      @update="updateAdmin"
    />

    <!-- Password Modal -->
    <div v-if="showPasswordModal" class="modal-overlay" @click="showPasswordModal = false">
      <div class="modal-content-sm" @click.stop>
        <h2 class="modal-header">Update Password</h2>
        
        <form @submit.prevent="updatePassword">
          <div class="form-group">
            <label class="form-label">
              New Password <span class="required">*</span>
            </label>
            <div class="input-icon-container">
              <input
                v-model="passwordForm.password"
                :type="showNewPassword ? 'text' : 'password'"
                required
                placeholder="Enter new password (min. 8 characters)"
                class="input-with-right-icon"
              />
              <button type="button" @click="showNewPassword = !showNewPassword" class="input-icon-right">
                <Eye v-if="!showNewPassword" class="w-5 h-5" />
                <EyeOff v-else class="w-5 h-5" />
              </button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">
              Confirm Password <span class="required">*</span>
            </label>
            <div class="input-icon-container">
              <input
                v-model="passwordForm.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                required
                placeholder="Confirm new password"
                class="input-with-right-icon"
              />
              <button type="button" @click="showConfirmPassword = !showConfirmPassword" class="input-icon-right">
                <Eye v-if="!showConfirmPassword" class="w-5 h-5" />
                <EyeOff v-else class="w-5 h-5" />
              </button>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" @click="showPasswordModal = false" class="btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn-primary">
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
  </AdministrationSectionLayout>
</template>

<style scoped>
/* Additional custom styles if needed */
</style>
