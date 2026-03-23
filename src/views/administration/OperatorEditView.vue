<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOperatorsStore } from '@/stores'
import { formatEnum } from '@/composables'
import { ArrowLeft, Save, Check } from 'lucide-vue-next'
import type { OperatorResponse } from '@/api/types'
import AdministrationSectionLayout from '@/layouts/AdministrationSectionLayout.vue'
import MetadataTab from '@/components/MetadataTab.vue'
import EntityHistoryView from '@/components/EntityHistoryView.vue'

const route = useRoute()
const router = useRouter()
const adminsStore = useOperatorsStore()

// State
const isLoading = ref(false)
const error = ref<string | null>(null)
const showSuccess = ref(false)
const activeTab = ref<'basic' | 'roles' | 'metadata' | 'history'>('basic')
const form = ref({
  id: '',
  name: '',
  roles: [] as string[],
  password: '',
  metadata: {}
})

// Computed
const operatorId = computed(() => route.params.operatorId as string | undefined)
const isEditMode = computed(() => !!operatorId.value)
const currentOperator = ref<OperatorResponse | null>(null)
const isSuperAdminSelected = computed(() => form.value.roles.includes('super_admin'))

// Available roles
const availableRoles = ['super_admin', 'content_manager', 'support', 'developer', 'viewer']

// Lifecycle
onMounted(async () => {
  if (isEditMode.value) {
    await loadOperator()
  }
})

// Methods
async function loadOperator() {
  if (!operatorId.value) return
  
  isLoading.value = true
  error.value = null
  
  try {
    currentOperator.value = await adminsStore.fetchById(operatorId.value)
    if (currentOperator.value) {
      form.value = {
        id: currentOperator.value.id,
        name: currentOperator.value.name,
        roles: [...currentOperator.value.roles],
        password: '',
        metadata: currentOperator.value.metadata || {}
      }
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load operator'
  } finally {
    isLoading.value = false
  }
}

async function handleSubmit() {
  error.value = null
  isLoading.value = true

  try {
    if (isEditMode.value && currentOperator.value) {
      // Update existing operator
      const updateData: any = {
        version: currentOperator.value.version,
        name: form.value.name,
        roles: form.value.roles,
        metadata: form.value.metadata
      }

      // Only include password if it's provided
      if (form.value.password) {
        if (form.value.password.length < 8) {
          error.value = 'Password must be at least 8 characters'
          isLoading.value = false
          return
        }
        updateData.password = form.value.password
      }

      const updated = await adminsStore.update(currentOperator.value.id, updateData)
      
      // Update currentOperator with the response to get the new version
      currentOperator.value = updated
    } else {
      // Create new operator
      if (!form.value.password) {
        error.value = 'Password is required for new operators'
        isLoading.value = false
        return
      }

      if (form.value.password.length < 8) {
        error.value = 'Password must be at least 8 characters'
        isLoading.value = false
        return
      }

      if (form.value.roles.length === 0) {
        error.value = 'At least one role must be selected'
        isLoading.value = false
        return
      }

      const created = await adminsStore.create({
        id: form.value.id,
        name: form.value.name,
        roles: form.value.roles as ("super_admin" | "content_manager" | "support" | "developer" | "viewer")[],
        password: form.value.password,
        metadata: form.value.metadata
      })
      
      // Update currentOperator with the created operator
      currentOperator.value = created
      
      // Navigate to edit mode
      await router.push({
        name: 'administration.operators.edit',
        params: { operatorId: created.id }
      })
    }

    // Show success feedback
    showSuccess.value = true
    setTimeout(() => {
      showSuccess.value = false
    }, 3000)
  } catch (err: any) {
    error.value = err.response?.data?.message || `Failed to ${isEditMode.value ? 'update' : 'create'} operator`
  } finally {
    isLoading.value = false
  }
}

function goBack() {
  router.push({ name: 'administration.operators' })
}

function toggleRole(role: string) {
  const index = form.value.roles.indexOf(role)
  
  // If selecting super_admin, clear all other roles
  if (role === 'super_admin' && index === -1) {
    form.value.roles = ['super_admin']
  }
  // If super_admin is already selected and trying to add another role, do nothing
  else if (form.value.roles.includes('super_admin') && role !== 'super_admin') {
    return
  }
  // If selecting another role while super_admin is not selected
  else if (index > -1) {
    form.value.roles.splice(index, 1)
  } else {
    form.value.roles.push(role)
  }
}

const metadataFields = computed(() => {
  if (!currentOperator.value) return []
  return [
    { label: 'Operator ID', value: currentOperator.value.id, format: 'mono' as const },
    { label: 'Version', value: currentOperator.value.version },
    { label: 'Created', value: currentOperator.value.createdAt, format: 'date' as const },
    { label: 'Updated', value: currentOperator.value.updatedAt, format: 'date' as const },
    { label: 'Current Roles', value: currentOperator.value.roles.map(formatEnum).join(', ') },
  ]
})
</script>

<template>
  <AdministrationSectionLayout>
  <div class="flex flex-col h-full border-none md:border md:border-gray-200 dark:border-none md:dark:border-gray-700 rounded-lg overflow-hidden bg-transparent md:bg-white md:dark:bg-gray-800">
    <!-- Header -->
    <div class="md:flex flex-col md:flex-row gap-3 items-center justify-between px-0 pb-4 md:px-8 md:py-6 border-b-0 md:border-b md:border-gray-200 bg-transparent md:bg-white dark:bg-transparent md:dark:bg-gray-800 md:dark:border-gray-700">
      <div class="md:flex flex-col md:flex-row items-center gap-4 flex-1 mb-3 md:mb-0">
        <button @click="goBack" class="btn-icon mb-2 md:mb-0" title="Back to operators">
          <ArrowLeft class="w-5 h-5" />
        </button>
        <div>
          <h1 class="text-2xl font-bold text-gray-900 mb-1 dark:text-white">{{ isEditMode ? 'Edit Operator' : 'Create Operator' }}</h1>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ isEditMode ? 'Update operator details and permissions' : 'Create a new operator account' }}
          </p>
        </div>
      </div>
      <div class="flex gap-3">
        <button type="button" @click="goBack" class="btn-secondary" :disabled="isLoading">
          Cancel
        </button>
        <button @click="handleSubmit" class="btn-primary" :disabled="isLoading || showSuccess">
          <Check v-if="showSuccess" class="inline-block mr-2 w-4 h-4" />
          <Save v-else class="inline-block mr-2 w-4 h-4" />
          {{ showSuccess ? 'Saved!' : (isLoading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Operator')) }}
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs-container">
      <nav class="tabs-nav" aria-label="Tabs">
        <button
          @click="activeTab = 'basic'"
          :class="['tab-button', { 'tab-button-active': activeTab === 'basic' }]"
          type="button"
        >
          General
        </button>
        <button
          @click="activeTab = 'roles'"
          :class="['tab-button', { 'tab-button-active': activeTab === 'roles' }]"
          type="button"
        >
          Roles & Permissions
        </button>
        <button
          v-if="isEditMode"
          @click="activeTab = 'metadata'"
          :class="['tab-button', { 'tab-button-active': activeTab === 'metadata' }]"
          type="button"
        >
          Metadata
        </button>
        <button
          v-if="isEditMode"
          @click="activeTab = 'history'"
          :class="['tab-button', { 'tab-button-active': activeTab === 'history' }]"
          type="button"
        >
          History
        </button>
      </nav>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading && isEditMode" class="loading-state">
      Loading operator...
    </div>

    <!-- Error State -->
    <div v-else-if="error && isEditMode" class="error-state">
      {{ error }}
      <button @click="goBack" class="btn-secondary mt-4">
        Back to Operators
      </button>
    </div>

    <!-- Form -->
    <div v-else class="flex-1 overflow-y-auto bg-transparent md:bg-gray-50 dark:bg-transparent md:dark:bg-gray-800">
      <div class="mx-auto">
        <form @submit.prevent="handleSubmit">
        <!-- Error Message -->
        <div v-if="error" class="alert-error mb-6">
          {{ error }}
        </div>

        <!-- General Tab -->
        <div v-show="activeTab === 'basic'" class="tab-content">
          <div class="form-group">
            <label class="form-label">
              Operator ID <span class="required">*</span>
            </label>
            <input
              v-model="form.id"
              type="text"
              required
              placeholder="operator-username"
              class="form-input-mono"
              :disabled="isEditMode || isLoading"
            />
            <p class="form-help-text">
              {{ isEditMode 
                ? 'The operator ID cannot be changed after creation' 
                : 'Unique identifier for this operator. Use lowercase letters, numbers, and hyphens only.' 
              }}
            </p>
          </div>

          <div class="form-group">
            <label class="form-label">
              Name <span class="required">*</span>
            </label>
            <input
              v-model="form.name"
              type="text"
              required
              placeholder="John Doe"
              class="form-input"
              :disabled="isLoading"
            />
            <p class="form-help-text">Full name or display name for this operator</p>
          </div>

          <div class="form-group">
            <label class="form-label">
              Password <span v-if="!isEditMode" class="required">*</span>
              <span v-else class="text-gray-500">(leave empty to keep current)</span>
            </label>
            <input
              v-model="form.password"
              type="password"
              :required="!isEditMode"
              placeholder="••••••••"
              class="form-input-mono"
              :disabled="isLoading"
            />
            <p class="form-help-text">
              {{ isEditMode 
                ? 'Enter a new password only if you want to change it. Must be at least 8 characters.' 
                : 'Password must be at least 8 characters long.' 
              }}
            </p>
          </div>
        </div>

        <!-- Roles & Permissions Tab -->
        <div v-show="activeTab === 'roles'" class="tab-content">
          <div class="form-group">
            <label class="form-label">
              Assigned Roles <span class="required">*</span>
            </label>
            <div class="flex flex-col gap-3 mt-3">
              <label
                v-for="role in availableRoles"
                :key="role"
                :class="isSuperAdminSelected && role !== 'super_admin' ? 'checkbox-label-disabled' : 'checkbox-label'"
              >
                <input
                  type="checkbox"
                  :checked="form.roles.includes(role)"
                  :disabled="(isSuperAdminSelected && role !== 'super_admin') || isLoading"
                  @change="toggleRole(role)"
                  class="form-checkbox"
                />
                <div class="flex flex-col">
                  <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ formatEnum(role) }}</span>
                  <span class="text-xs text-gray-500">
                    {{ role === 'super_admin' ? 'Full system access (overrides all other roles)' : 
                       role === 'content_manager' ? 'Manage content and projects' :
                       role === 'support' ? 'View and assist with user issues' :
                       role === 'developer' ? 'Technical configuration and integrations' :
                       'Read-only access to the system' }}
                  </span>
                </div>
              </label>
            </div>
            <p class="form-help-text mt-3">
              Note: Selecting Super Admin will grant all permissions and disable other role options.
            </p>
          </div>
        </div>

        <!-- Metadata Tab -->
        <MetadataTab
          v-if="isEditMode && currentOperator"
          v-show="activeTab === 'metadata'"
          :fields="metadataFields"
        />
        <div class="tab-content">
            <!-- History Tab -->
            <EntityHistoryView
              v-if="isEditMode && currentOperator"
              v-show="activeTab === 'history'"
              :load-history="() => adminsStore.fetchAuditLogs(currentOperator!.id)"
              :current-version="currentOperator.version"
              :current-object="currentOperator"
              :active="activeTab === 'history'"
              :update-fn="(data) => adminsStore.update(currentOperator!.id, data)"
              :create-fn="(data) => adminsStore.create(data)"
              :ignore-fields="['createdAt', 'updatedAt', 'version']"
              @recover-success="() => router.go(0)"
            />
          </div>
          </form>
      </div>
    </div>
  </div>
  </AdministrationSectionLayout>
</template>

<style scoped>
/* No custom styles needed - using utility classes */
</style>
