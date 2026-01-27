<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAdminsStore } from '@/stores'
import { User, Search, X, Eye, EyeOff, Settings } from 'lucide-vue-next'
import type { AdminResponse } from '@/types/api'
import AdminEditModal from '@/components/modals/AdminEditModal.vue'
import SectionLayout from '@/layouts/SectionLayout.vue'

const menuItems = [
  { name: 'administration.admins', label: 'Admins', icon: User },
  { name: 'administration.providers', label: 'Providers', icon: Settings },
]

const adminsStore = useAdminsStore()

// UI State
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showPasswordModal = ref(false)
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(20)

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
  if (!searchQuery.value) return adminsStore.items
  const query = searchQuery.value.toLowerCase()
  return adminsStore.items.filter(admin => 
    admin.id.toLowerCase().includes(query) ||
    admin.displayName.toLowerCase().includes(query) ||
    admin.roles.some(role => role.toLowerCase().includes(query))
  )
})

const isSuperAdminSelected = computed(() => adminForm.value.roles.includes('super_admin'))

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

function formatRoleName(role: string) {
  return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}
</script>

<template>
  <SectionLayout title="Administration" :menu-items="menuItems">
    <div class="max-w-[1400px]">
      <!-- Header -->
      <div class="flex justify-between items-start mb-6">
      <div>
        <h1 class="m-0 mb-1 text-3xl font-bold text-gray-900">Administrators</h1>
        <p class="m-0 text-gray-600">Manage admin users and permissions</p>
      </div>
      <button 
        @click="openCreateModal" 
        class="px-5 py-2.5 border-none bg-primary-500 text-white rounded-md font-medium cursor-pointer transition-colors hover:bg-primary-600"
      >
        <User class="inline-block mr-2 w-4 h-4" />
        New Administrator
      </button>
    </div>

    <!-- Search Bar -->
    <div class="mb-4 relative">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search by ID, name, or role..."
        class="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-primary-500"
      />
      <button
        v-if="searchQuery"
        @click="clearSearch"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        <X class="w-5 h-5" />
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="adminsStore.isLoading" class="text-center py-16 px-5 text-gray-600">
      Loading administrators...
    </div>

    <!-- Error State -->
    <div v-else-if="adminsStore.error" class="text-center py-16 px-5 text-red-600">
      {{ adminsStore.error }}
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredAdmins.length === 0" class="text-center py-16 px-5 text-gray-600">
      <User class="w-16 h-16 mx-auto mb-4 text-gray-400" />
      <p class="text-lg font-semibold mb-2">No administrators found</p>
      <p v-if="searchQuery">Try adjusting your search criteria</p>
      <p v-else>Create your first administrator to get started</p>
    </div>

    <!-- Table -->
    <div v-else class="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">ID</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Display Name</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Roles</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Created</th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Updated</th>
              <th class="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr 
              v-for="admin in filteredAdmins" 
              :key="admin.id"
              class="hover:bg-gray-50 transition-colors"
            >
              <td class="px-6 py-4 text-sm font-mono text-gray-900">{{ admin.id }}</td>
              <td class="px-6 py-4 text-sm font-medium text-gray-900">{{ admin.displayName }}</td>
              <td class="px-6 py-4 text-sm">
                <div class="flex flex-wrap gap-1">
                  <span 
                    v-for="role in admin.roles" 
                    :key="role"
                    class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary-100 text-primary-800"
                  >
                    {{ formatRoleName(role) }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-gray-600">
                {{ formatDate(admin.createdAt) }}
              </td>
              <td class="px-6 py-4 text-sm text-gray-600">
                {{ formatDate(admin.updatedAt) }}
              </td>
              <td class="px-6 py-4 text-sm text-right">
                <div class="flex gap-2 justify-end">
                  <button
                    @click="openEditModal(admin)"
                    class="px-3 py-1.5 border border-gray-300 bg-white text-gray-700 rounded-md text-xs font-medium cursor-pointer transition-all hover:border-primary-500 hover:text-primary-500"
                  >
                    Edit
                  </button>
                  <button
                    @click="openPasswordModal(admin)"
                    class="px-3 py-1.5 border border-gray-300 bg-white text-gray-700 rounded-md text-xs font-medium cursor-pointer transition-all hover:border-primary-500 hover:text-primary-500"
                  >
                    Password
                  </button>
                  <button
                    @click="deleteAdmin(admin)"
                    class="px-3 py-1.5 border-none bg-red-600 text-white rounded-md text-xs font-medium cursor-pointer transition-colors hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Info -->
      <div class="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div class="flex justify-between items-center text-sm text-gray-600">
          <span>
            Showing {{ filteredAdmins.length }} of {{ adminsStore.pagination.total }} administrators
          </span>
          <span>Version tracking enabled (optimistic locking)</span>
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    <div 
      v-if="showCreateModal" 
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-5"
      @click="showCreateModal = false"
    >
      <div class="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" @click.stop>
        <h2 class="m-0 mb-5 text-xl font-semibold">Create Administrator</h2>
        
        <form @submit.prevent="createAdmin">
          <div class="mb-4">
            <label class="block mb-1.5 font-medium text-gray-900">
              Admin ID <span class="text-red-600">*</span>
            </label>
            <input
              v-model="adminForm.id"
              type="text"
              required
              placeholder="admin-id"
              class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-primary-500 font-mono"
            />
            <p class="mt-1 text-xs text-gray-500">Unique identifier for the administrator</p>
          </div>

          <div class="mb-4">
            <label class="block mb-1.5 font-medium text-gray-900">
              Display Name <span class="text-red-600">*</span>
            </label>
            <input
              v-model="adminForm.displayName"
              type="text"
              required
              placeholder="John Doe"
              class="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-primary-500"
            />
          </div>

          <div class="mb-4">
            <label class="block mb-1.5 font-medium text-gray-900">
              Password <span class="text-red-600">*</span>
            </label>
            <div class="relative">
              <input
                v-model="adminForm.password"
                :type="showPassword ? 'text' : 'password'"
                required
                placeholder="Enter password (min. 8 characters)"
                class="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-primary-500"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <Eye v-if="!showPassword" class="w-5 h-5" />
                <EyeOff v-else class="w-5 h-5" />
              </button>
            </div>
          </div>

          <div class="mb-4">
            <label class="block mb-1.5 font-medium text-gray-900">
              Roles <span class="text-red-600">*</span>
            </label>
            <div class="flex flex-wrap gap-2 mt-2">
              <label
                v-for="role in availableRoles"
                :key="role"
                class="inline-flex items-center cursor-pointer"
                :class="{ 'opacity-50 cursor-not-allowed': isSuperAdminSelected && role !== 'super_admin' }"
              >
                <input
                  type="checkbox"
                  :checked="adminForm.roles.includes(role)"
                  :disabled="isSuperAdminSelected && role !== 'super_admin'"
                  @change="toggleRole(role)"
                  class="mr-2 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <span class="text-sm text-gray-700">{{ formatRoleName(role) }}</span>
              </label>
            </div>
            <p class="mt-1 text-xs text-gray-500">Select at least one role</p>
          </div>

          <div class="flex gap-3 justify-end mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              @click="showCreateModal = false"
              class="px-4 py-2 border border-gray-300 bg-white text-gray-900 rounded-md font-medium cursor-pointer transition-all hover:border-primary-500 hover:text-primary-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-5 py-2.5 border-none bg-primary-500 text-white rounded-md font-medium cursor-pointer transition-colors hover:bg-primary-600"
            >
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
    <div 
      v-if="showPasswordModal" 
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-5"
      @click="showPasswordModal = false"
    >
      <div class="bg-white rounded-lg p-6 max-w-md w-full" @click.stop>
        <h2 class="m-0 mb-5 text-xl font-semibold">Update Password</h2>
        
        <form @submit.prevent="updatePassword">
          <div class="mb-4">
            <label class="block mb-1.5 font-medium text-gray-900">
              New Password <span class="text-red-600">*</span>
            </label>
            <div class="relative">
              <input
                v-model="passwordForm.password"
                :type="showNewPassword ? 'text' : 'password'"
                required
                placeholder="Enter new password (min. 8 characters)"
                class="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-primary-500"
              />
              <button
                type="button"
                @click="showNewPassword = !showNewPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <Eye v-if="!showNewPassword" class="w-5 h-5" />
                <EyeOff v-else class="w-5 h-5" />
              </button>
            </div>
          </div>

          <div class="mb-4">
            <label class="block mb-1.5 font-medium text-gray-900">
              Confirm Password <span class="text-red-600">*</span>
            </label>
            <div class="relative">
              <input
                v-model="passwordForm.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                required
                placeholder="Confirm new password"
                class="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-primary-500"
              />
              <button
                type="button"
                @click="showConfirmPassword = !showConfirmPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <Eye v-if="!showConfirmPassword" class="w-5 h-5" />
                <EyeOff v-else class="w-5 h-5" />
              </button>
            </div>
          </div>

          <div class="flex gap-3 justify-end mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              @click="showPasswordModal = false"
              class="px-4 py-2 border border-gray-300 bg-white text-gray-900 rounded-md font-medium cursor-pointer transition-all hover:border-primary-500 hover:text-primary-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-5 py-2.5 border-none bg-primary-500 text-white rounded-md font-medium cursor-pointer transition-colors hover:bg-primary-600"
            >
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
  </SectionLayout>
</template>

<style scoped>
/* Additional custom styles if needed */
</style>
