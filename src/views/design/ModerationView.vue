<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useProjectsStore, useProjectSelectionStore, useProvidersStore, useProviderCatalogStore } from '@/stores'
import { useProjectReadOnly } from '@/composables/useProjectReadOnly'
import { Save, Check } from 'lucide-vue-next'
import type { ProjectResponse } from '@/api/types'

const projectsStore = useProjectsStore()
const projectSelectionStore = useProjectSelectionStore()
const providersStore = useProvidersStore()
const providerCatalogStore = useProviderCatalogStore()
const { projectIsArchived } = useProjectReadOnly()

const projectId = computed(() => projectSelectionStore.selectedProjectId || '')

const isLoading = ref(false)
const error = ref<string | null>(null)
const showSuccess = ref(false)
const currentProject = ref<ProjectResponse | null>(null)

const form = ref({
  moderationConfig: {
    enabled: false,
    llmProviderId: '',
    blockedCategories: [] as string[],
  },
})

const moderationLlmProviders = computed(() =>
  providersStore.items.filter(
    p => p.providerType === 'llm' && (p.apiType === 'openai' || p.apiType === 'mistral')
  )
)

const selectedModerationProviderApiType = computed(() => {
  if (!form.value.moderationConfig.llmProviderId) return null
  return moderationLlmProviders.value.find(p => p.id === form.value.moderationConfig.llmProviderId)?.apiType ?? null
})

const availableModerationCategories = computed(() => {
  const apiType = selectedModerationProviderApiType.value
  if (!apiType || !providerCatalogStore.catalog?.moderation) return []
  const providerInfo = providerCatalogStore.catalog.moderation.find(p => p.apiType === apiType)
  if (!providerInfo) return []
  const seen = new Set<string>()
  const categories: { name: string; displayName: string; description?: string }[] = []
  for (const model of providerInfo.models) {
    for (const cat of model.categories) {
      if (!seen.has(cat.name)) {
        seen.add(cat.name)
        categories.push(cat)
      }
    }
  }
  return categories
})

watch(() => form.value.moderationConfig.llmProviderId, () => {
  form.value.moderationConfig.blockedCategories = []
})

watch(projectId, () => {
  loadProject()
})

onMounted(async () => {
  await Promise.all([
    providersStore.fetchAll(),
    providerCatalogStore.catalog ? Promise.resolve() : providerCatalogStore.fetchCatalog(),
  ])
  loadProject()
})

async function loadProject() {
  if (!projectId.value) return

  isLoading.value = true
  error.value = null

  try {
    currentProject.value = await projectsStore.fetchById(projectId.value)
    if (currentProject.value) {
      form.value = {
        moderationConfig: {
          enabled: currentProject.value.moderationConfig?.enabled ?? false,
          llmProviderId: currentProject.value.moderationConfig?.llmProviderId || '',
          blockedCategories: currentProject.value.moderationConfig?.blockedCategories ?? [],
        },
      }
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load project'
  } finally {
    isLoading.value = false
  }
}

async function handleSubmit() {
  if (!currentProject.value) return

  isLoading.value = true
  error.value = null

  try {
    const updated = await projectsStore.update(currentProject.value.id, {
      version: currentProject.value.version,
      moderationConfig: form.value.moderationConfig.enabled
        ? {
            enabled: true,
            llmProviderId: form.value.moderationConfig.llmProviderId,
            ...(form.value.moderationConfig.blockedCategories.length > 0 && {
              blockedCategories: form.value.moderationConfig.blockedCategories,
            }),
          }
        : { enabled: false, llmProviderId: form.value.moderationConfig.llmProviderId },
    })

    currentProject.value = updated

    showSuccess.value = true
    setTimeout(() => {
      showSuccess.value = false
    }, 3000)
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to save moderation configuration'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col h-full border-none md:border md:border-gray-200 dark:border-none md:dark:border-gray-700 rounded-lg overflow-hidden bg-transparent md:bg-white md:dark:bg-gray-800">
      <!-- Header -->
      <div class="md:flex flex-col md:flex-row gap-3 items-center justify-between px-0 pb-4 md:px-8 md:py-6 border-b-0 md:border-b md:border-gray-200 bg-transparent md:bg-white dark:bg-transparent md:dark:bg-gray-800 md:dark:border-gray-700">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 mb-1 dark:text-white">Moderation</h1>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Configure content moderation for user messages in this project
          </p>
        </div>
        <div class="flex gap-3 items-center">
          <button
            v-if="!projectIsArchived"
            @click="handleSubmit"
            class="btn-primary"
            :disabled="isLoading || showSuccess"
            type="button"
          >
            <Check v-if="showSuccess" class="inline-block mr-2 w-4 h-4" />
            <Save v-else class="inline-block mr-2 w-4 h-4" />
            {{ showSuccess ? 'Saved!' : (isLoading ? 'Saving...' : 'Save Changes') }}
          </button>
        </div>
      </div>

      <!-- Archived banner -->
      <div v-if="projectIsArchived" class="alert-warning mb-4">
        This project is archived — editing is disabled.
      </div>

      <!-- Loading State -->
      <div v-if="isLoading && !currentProject" class="loading-state">
        Loading...
      </div>

      <!-- Error State -->
      <div v-else-if="error && !currentProject" class="error-state">
        {{ error }}
      </div>

      <!-- Content -->
      <div v-else class="flex-1 overflow-y-auto bg-transparent md:bg-gray-50 dark:bg-transparent md:dark:bg-gray-900">
        <div class="mx-auto">
          <fieldset :disabled="projectIsArchived" class="border-0 p-0 m-0 min-w-0 w-full">
            <div class="tab-content">
              <!-- Error Message -->
              <div v-if="error" class="alert-error mb-6">
                {{ error }}
              </div>

              <div class="space-y-6">
                <div>
                  <h3 class="text-lg font-semibold text-gray-900 mb-4 dark:text-white">Content Moderation</h3>
                  <p class="text-sm text-gray-600 mb-6 dark:text-gray-400">
                    Enable content moderation to automatically screen user messages for harmful content before processing. Only OpenAI and Mistral providers support the moderation API.
                  </p>
                </div>

                <div class="form-group">
                  <label class="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      v-model="form.moderationConfig.enabled"
                      class="form-checkbox"
                      :disabled="isLoading"
                    />
                    <span class="form-label mb-0">Enable content moderation</span>
                  </label>
                  <p class="form-help-text mt-1">
                    When enabled, each user message is screened by the moderation API before being processed
                  </p>
                </div>

                <div v-if="form.moderationConfig.enabled" class="form-group">
                  <label class="form-label">Moderation Provider <span class="text-red-500">*</span></label>
                  <select
                    v-model="form.moderationConfig.llmProviderId"
                    class="form-select-auto"
                    :disabled="isLoading"
                  >
                    <option value="">Select a provider...</option>
                    <option v-for="provider in moderationLlmProviders" :key="provider.id" :value="provider.id">
                      {{ provider.name }} ({{ provider.apiType }})
                    </option>
                  </select>
                  <p class="form-help-text">
                    Only OpenAI and Mistral providers are listed as they are the only ones that support the moderation API
                  </p>
                  <div v-if="moderationLlmProviders.length === 0" class="mt-2 bg-yellow-50 border border-yellow-200 p-3 rounded-lg dark:bg-yellow-900/20 dark:border-yellow-800">
                    <p class="text-sm text-yellow-800 dark:text-yellow-200">
                      No compatible providers found. Add an OpenAI or Mistral LLM provider in the Providers section to enable moderation.
                    </p>
                  </div>
                </div>

                <div v-if="form.moderationConfig.enabled && form.moderationConfig.llmProviderId" class="form-group">
                  <label class="form-label">Blocked Categories</label>
                  <p class="form-help-text mb-3">
                    Select which flagged categories will block the message. If none are selected, any flagged category will block it.
                  </p>
                  <div v-if="availableModerationCategories.length > 0" class="space-y-2">
                    <label
                      v-for="cat in availableModerationCategories"
                      :key="cat.name"
                      class="flex items-start gap-3 cursor-pointer p-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <input
                        type="checkbox"
                        :value="cat.name"
                        v-model="form.moderationConfig.blockedCategories"
                        class="form-checkbox mt-0.5 shrink-0"
                        :disabled="isLoading"
                      />
                      <span class="min-w-0">
                        <span class="block text-sm font-medium text-gray-900 dark:text-white">{{ cat.displayName }}</span>
                        <span v-if="cat.description" class="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ cat.description }}</span>
                        <code class="block text-xs text-gray-400 dark:text-gray-500 mt-0.5">{{ cat.name }}</code>
                      </span>
                    </label>
                    <p v-if="form.moderationConfig.blockedCategories.length === 0" class="text-xs text-amber-700 dark:text-amber-400 mt-2">
                      No categories selected — any flagged category will block the message.
                    </p>
                  </div>
                  <div v-else class="bg-gray-50 border border-gray-200 p-3 rounded-lg dark:bg-gray-800 dark:border-gray-700">
                    <p class="text-sm text-gray-500 dark:text-gray-400">Category information not available for this provider.</p>
                  </div>
                </div>

                <div v-if="!form.moderationConfig.enabled" class="bg-gray-50 border border-gray-200 p-4 rounded-lg dark:bg-gray-800 dark:border-gray-700">
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    Content moderation is disabled. User messages will not be screened before processing.
                  </p>
                </div>
              </div>
            </div>
          </fieldset>
        </div>
      </div>
    </div>
</template>
