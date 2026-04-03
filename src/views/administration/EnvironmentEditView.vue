<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEnvironmentsStore } from '@/stores'
import { ArrowLeft, Save, Check } from 'lucide-vue-next'
import type { EnvironmentResponse, ParsedError } from '@/api/types'
import { parseApiError } from '@/utils/errors'
import AdministrationSectionLayout from '@/layouts/AdministrationSectionLayout.vue'
import MetadataTab from '@/components/MetadataTab.vue'
import EntityHistoryView from '@/components/EntityHistoryView.vue'
import TabNavigator from '@/components/TabNavigator.vue'
import type { TabDefinition } from '@/components/TabNavigator.vue'
import TabContent from '@/components/TabContent.vue'
import FormField from '@/components/FormField.vue'
import ErrorDisplay from '@/components/ErrorDisplay.vue'
import { useTabNavigation } from '@/composables/useTabNavigation'

const route = useRoute()
const router = useRouter()
const environmentsStore = useEnvironmentsStore()

// State
const isLoading = ref(false)
const error = ref<ParsedError | null>(null)
const showSuccess = ref(false)
const activeTab = ref<'basic' | 'metadata' | 'history'>('basic')
const form = ref({
  id: '',
  description: '',
  url: '',
  login: '',
  password: '',
})

// Computed
const environmentId = computed(() => route.params.environmentId as string | undefined)
const isEditMode = computed(() => !!environmentId.value)

const tabs = computed<TabDefinition[]>(() => [
  { key: 'basic', label: 'General' },
  { key: 'metadata', label: 'Metadata', show: isEditMode.value },
  { key: 'history', label: 'History', show: isEditMode.value },
])
const currentEnvironment = ref<EnvironmentResponse | null>(null)
const { switchToFirstErrorTab } = useTabNavigation(activeTab)

// Lifecycle
onMounted(async () => {
  if (isEditMode.value) {
    await loadEnvironment()
  }
})

// Methods
async function loadEnvironment() {
  if (!environmentId.value) return

  isLoading.value = true
  error.value = null

  try {
    currentEnvironment.value = await environmentsStore.fetchById(environmentId.value)
    if (currentEnvironment.value) {
      form.value = {
        id: currentEnvironment.value.id,
        description: currentEnvironment.value.description,
        url: currentEnvironment.value.url,
        login: currentEnvironment.value.login,
        password: '',
      }
    }
  } catch (err: any) {
    error.value = parseApiError(err)
  } finally {
    isLoading.value = false
  }
}

async function handleSubmit() {
  error.value = null
  isLoading.value = true

  try {
    if (isEditMode.value && currentEnvironment.value) {
      // Build update payload — only include password if provided
      const updateData: any = {
        version: currentEnvironment.value.version,
        description: form.value.description,
        url: form.value.url,
        login: form.value.login,
      }

      if (form.value.password) {
        updateData.password = form.value.password
      }

      const updated = await environmentsStore.update(currentEnvironment.value.id, updateData)
      currentEnvironment.value = updated
    } else {
      // Validate required fields for creation
      const validationDetails: import('@/api/types').ApiErrorDetail[] = []
      if (!form.value.description) validationDetails.push({ path: ['description'], message: 'Description is required', code: 'REQUIRED' })
      if (!form.value.url) validationDetails.push({ path: ['url'], message: 'URL is required', code: 'REQUIRED' })
      if (!form.value.login) validationDetails.push({ path: ['login'], message: 'Login is required', code: 'REQUIRED' })
      if (!form.value.password) validationDetails.push({ path: ['password'], message: 'Password is required', code: 'REQUIRED' })
      if (validationDetails.length > 0) {
        error.value = { message: 'Please correct the following errors', details: validationDetails }
        switchToFirstErrorTab(error.value)
        isLoading.value = false
        return
      }

      const createData: any = {
        description: form.value.description,
        url: form.value.url,
        login: form.value.login,
        password: form.value.password,
      }

      if (form.value.id) {
        createData.id = form.value.id
      }

      const created = await environmentsStore.create(createData)
      currentEnvironment.value = created

      // Navigate to edit mode
      await router.push({
        name: 'administration.environments.edit',
        params: { environmentId: created.id }
      })
    }

    // Show success feedback
    showSuccess.value = true
    setTimeout(() => {
      showSuccess.value = false
    }, 3000)
  } catch (err: any) {
    error.value = parseApiError(err)
    switchToFirstErrorTab(error.value)
  } finally {
    isLoading.value = false
  }
}

function goBack() {
  router.push({ name: 'administration.environments' })
}

const metadataFields = computed(() => {
  if (!currentEnvironment.value) return []
  return [
    { label: 'Environment ID', value: currentEnvironment.value.id, format: 'mono' as const },
    { label: 'Version', value: currentEnvironment.value.version },
    { label: 'Created', value: currentEnvironment.value.createdAt, format: 'date' as const },
    { label: 'Updated', value: currentEnvironment.value.updatedAt, format: 'date' as const },
  ]
})
</script>

<template>
  <AdministrationSectionLayout>
    <div class="flex flex-col h-full border-none md:border md:border-gray-200 dark:border-none md:dark:border-gray-700 rounded-lg overflow-hidden bg-transparent md:bg-white md:dark:bg-gray-800">
      <!-- Header -->
      <div class="md:flex flex-col md:flex-row gap-3 items-center justify-between px-0 pb-4 md:px-8 md:py-6 border-b-0 md:border-b md:border-gray-200 bg-transparent md:bg-white dark:bg-transparent md:dark:bg-gray-800 md:dark:border-gray-700">
        <div class="md:flex flex-col md:flex-row items-center gap-4 flex-1 mb-3 md:mb-0">
          <button @click="goBack" class="btn-icon mb-2 md:mb-0" title="Back to environments">
            <ArrowLeft class="w-5 h-5" />
          </button>
          <div>
            <h1 class="text-2xl font-bold text-gray-900 mb-1 dark:text-white">
              {{ isEditMode ? 'Edit Environment' : 'Create Environment' }}
            </h1>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ isEditMode ? 'Update environment details and credentials' : 'Configure a new deployment environment' }}
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
            {{ showSuccess ? 'Saved!' : (isLoading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Environment')) }}
          </button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs-container">
        <TabNavigator v-model="activeTab" :tabs="tabs" />
      </div>

      <!-- Loading State -->
      <div v-if="isLoading && isEditMode && !currentEnvironment" class="loading-state">
        Loading environment...
      </div>

      <!-- Error State (load failure) -->
      <div v-else-if="error && isEditMode && !currentEnvironment" class="error-state">
        <ErrorDisplay :error="error" />
        <button @click="goBack" class="btn-secondary mt-4">
          Back to Environments
        </button>
      </div>

      <!-- Form -->
      <div v-else class="flex-1 overflow-y-auto bg-transparent md:bg-gray-50 dark:bg-transparent md:dark:bg-gray-800">
        <div class="mx-auto">
          <form @submit.prevent="handleSubmit">
            <!-- Error Message -->
            <ErrorDisplay :error="error" />

            <!-- General Tab -->
            <TabContent v-model="activeTab" tab="basic">
              <FormField label="Environment ID" :error="error" path="id" class="w-full" hint="optional" :help="isEditMode ? 'The environment ID cannot be changed after creation' : 'Optional. Unique identifier using lowercase letters, numbers, and hyphens.'">
                <input
                  v-model="form.id"
                  type="text"
                  placeholder="my-environment"
                  class="form-input-mono"
                  :class="{ 'form-input-disabled': isEditMode }"
                  :disabled="isEditMode || isLoading"
                />
              </FormField>

              <FormField label="Description" required :error="error" path="description" class="w-full" help="Human-readable description of this environment">
                <input
                  v-model="form.description"
                  type="text"
                  placeholder="Production environment"
                  class="form-input"
                  :disabled="isLoading"
                />
              </FormField>

              <FormField label="URL" required :error="error" path="url" class="w-full" help="Base URL of the target server instance">
                <input
                  v-model="form.url"
                  type="url"
                  placeholder="https://api.example.com"
                  class="form-input-mono"
                  :disabled="isLoading"
                />
              </FormField>

              <FormField label="Login" required :error="error" path="login" class="w-full" help="Authentication username for this environment">
                <input
                  v-model="form.login"
                  type="text"
                  placeholder="admin"
                  class="form-input max-w-xs"
                  :disabled="isLoading"
                />
              </FormField>

              <FormField label="Password" :required="!isEditMode" :error="error" path="password" class="w-full" :hint="isEditMode ? 'leave empty to keep current' : undefined" :help="isEditMode ? 'Enter a new password only if you want to change it.' : 'Authentication password for this environment.'">
                <input
                  v-model="form.password"
                  type="password"
                  placeholder="••••••••"
                  class="form-input-mono max-w-xs"
                  :disabled="isLoading"
                />
              </FormField>
            </TabContent>

            <!-- Metadata Tab -->
            <MetadataTab
              v-if="isEditMode && currentEnvironment"
              v-model="activeTab"
              tab="metadata"
              :fields="metadataFields"
            />
            <!-- History Tab -->
            <TabContent v-model="activeTab" tab="history">
              <EntityHistoryView
                v-if="isEditMode && currentEnvironment"
                :load-history="() => environmentsStore.fetchAuditLogs(currentEnvironment!.id)"
                :current-version="currentEnvironment.version"
                :current-object="currentEnvironment"
                :active="activeTab === 'history'"
                :update-fn="(data) => environmentsStore.update(currentEnvironment!.id, data)"
                :create-fn="(data) => environmentsStore.create(data)"
                :ignore-fields="['createdAt', 'updatedAt', 'version']"
                @recover-success="() => router.go(0)"
              />
            </TabContent>
          </form>
        </div>
      </div>
    </div>
  </AdministrationSectionLayout>
</template>

<style scoped>
/* No custom styles needed - using utility classes */
</style>
