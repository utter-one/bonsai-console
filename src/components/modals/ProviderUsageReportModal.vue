<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import BaseModal from '@/components/BaseModal.vue'
import apiClient from '@/api/client'
import { parseApiError } from '@/utils/errors'
import { ChevronRight, CheckCircle2, AlertCircle, XCircle, MinusCircle, RefreshCw } from 'lucide-vue-next'
import type { ProjectProviderUsageResponse, UsedProviderDetail } from '@/api/types'

const props = defineProps<{
  projectId: string
}>()

const emit = defineEmits<{
  close: []
}>()

const projectName = ref('')
const isLoading = ref(true)
const error = ref<string | null>(null)
const data = ref<ProjectProviderUsageResponse | null>(null)

const collapsedProviders = ref<Set<string>>(new Set())
const checkAvailability = ref(false)
const isChecking = ref(false)

const providerTypeOrder: Record<string, number> = {
  llm: 0,
  tts: 1,
  asr: 2,
  embeddings: 3,
  storage: 4,
  channel: 5,
}

const entityTypeOrder: Record<string, number> = {
  agent: 0,
  stage: 1,
  classifier: 2,
  tool: 3,
  contextTransformer: 4,
  tester: 5,
}

const summaryItems = computed(() => {
  if (!data.value) return []
  const byType = data.value.summary.byType
  return [
    { label: 'Total', value: data.value.summary.totalProviders, colorClass: 'text-gray-900 dark:text-gray-100' },
    { label: 'LLM', value: byType.llm, colorClass: 'text-blue-600 dark:text-blue-400' },
    { label: 'TTS', value: byType.tts, colorClass: 'text-purple-600 dark:text-purple-400' },
    { label: 'ASR', value: byType.asr, colorClass: 'text-green-600 dark:text-green-400' },
    { label: 'Embeddings', value: byType.embeddings, colorClass: 'text-orange-600 dark:text-orange-400' },
    { label: 'Storage', value: byType.storage, colorClass: 'text-teal-600 dark:text-teal-400' },
    { label: 'Channel', value: byType.channel, colorClass: 'text-red-600 dark:text-red-400' },
  ]
})

const sortedProviders = computed(() => {
  if (!data.value) return []
  return [...data.value.providers].sort((a, b) => {
    const ta = providerTypeOrder[a.providerType] ?? 99
    const tb = providerTypeOrder[b.providerType] ?? 99
    if (ta !== tb) return ta - tb
    return a.name.localeCompare(b.name)
  })
})

const sortedUsage = (provider: UsedProviderDetail) => {
  return [...provider.usage].sort((a, b) => {
    const ea = entityTypeOrder[a.entityType] ?? 99
    const eb = entityTypeOrder[b.entityType] ?? 99
    if (ea !== eb) return ea - eb
    return a.entityName.localeCompare(b.entityName)
  })
}

function toggleProvider(providerId: string) {
  if (collapsedProviders.value.has(providerId)) {
    collapsedProviders.value.delete(providerId)
  } else {
    collapsedProviders.value.add(providerId)
  }
}

function isCollapsed(providerId: string) {
  return collapsedProviders.value.has(providerId)
}

function formatProviderType(type: string): string {
  const map: Record<string, string> = {
    llm: 'LLM',
    tts: 'TTS',
    asr: 'ASR',
    embeddings: 'Embeddings',
    storage: 'Storage',
    channel: 'Channel',
  }
  return map[type] ?? capitalizeType(type)
}

function capitalizeType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

const providerTypeBadgeClass: Record<string, string> = {
  llm: 'badge-primary',
  tts: 'badge-violet',
  asr: 'badge-success',
  embeddings: 'badge-secondary',
  storage: 'badge-info',
  channel: 'badge-danger',
}

const entityTypeBadgeClass: Record<string, string> = {
  agent: 'badge-primary',
  stage: 'badge-info',
  classifier: 'badge-violet',
  tool: 'badge-warning',
  contextTransformer: 'badge-secondary',
  tester: 'badge-warning',
}

const availabilityStatusMap: Record<string, { icon: any; color: string; label: string }> = {
  available: { icon: CheckCircle2, color: 'text-green-500', label: 'Available' },
  partially_available: { icon: AlertCircle, color: 'text-yellow-500', label: 'Partially available' },
  unavailable: { icon: XCircle, color: 'text-red-500', label: 'Unavailable' },
  not_applicable: { icon: MinusCircle, color: 'text-gray-400', label: 'N/A' },
}

function getAvailabilityStatus(provider: UsedProviderDetail) {
  return provider.availability?.status ?? null
}

function getModelStatus(provider: UsedProviderDetail, modelName: string | null | undefined) {
  if (!modelName) return null
  const model = provider.availability?.models.find(m => m.model === modelName)
  return model?.status ?? null
}

async function fetchData() {
  try {
    isLoading.value = true
    error.value = null
    data.value = null

    const response = await apiClient.projectsProvidersUsedList(
      props.projectId,
      checkAvailability.value ? { checkIfAvailable: true } : undefined,
    )
    data.value = response

    // Fetch project name
    const projectDetail = await apiClient.projectsDetail(props.projectId)
    projectName.value = projectDetail.name
  } catch (err: any) {
    error.value = parseApiError(err).message
  } finally {
    isLoading.value = false
  }
}

async function toggleAvailability() {
  checkAvailability.value = !checkAvailability.value
  isChecking.value = true
  await fetchData()
  isChecking.value = false
}

onMounted(fetchData)
</script>

<template>
  <BaseModal :title="`Provider Usage Report`" size="3xl" @close="$emit('close')">
    <div v-if="isLoading" class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
      Loading provider usage data...
    </div>

    <div v-else-if="error" class="py-8 text-center">
      <p class="text-sm text-red-500 dark:text-red-400">{{ error }}</p>
    </div>

    <template v-else>
      <!-- Project name subtitle + availability toggle -->
      <div class="flex items-center justify-between mb-4">
        <p v-if="projectName" class="text-sm text-gray-500 dark:text-gray-400">
          {{ projectName }}
        </p>
        <button
          @click="toggleAvailability"
          :disabled="isLoading"
          class="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-50 transition-colors"
        >
          <RefreshCw class="w-3.5 h-3.5" :class="isChecking ? 'animate-spin' : ''" />
          {{ checkAvailability ? 'Checking availability' : 'Check availability' }}
          <span
            v-if="checkAvailability"
            class="badge text-[10px] px-1 py-0 badge-success"
          >
            On
          </span>
        </button>
      </div>

      <!-- Summary cards -->
      <div class="grid grid-cols-7 gap-3 mb-6">
        <div
          v-for="item in summaryItems"
          :key="item.label"
          class="flex flex-col items-center justify-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600"
        >
          <span class="text-2xl font-bold" :class="item.colorClass">{{ item.value }}</span>
          <span class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ item.label }}</span>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="!data || data.providers.length === 0" class="empty-state py-8">
        <p class="empty-state-title">No providers in use</p>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          No providers are currently referenced by entities in this project.
        </p>
      </div>

      <!-- Provider list -->
      <div v-else class="space-y-1 max-h-[50vh] overflow-y-auto pr-1">
        <div
          v-for="provider in sortedProviders"
          :key="provider.id"
          class="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          <!-- Provider header (clickable to expand/collapse) -->
          <button
            @click="toggleProvider(provider.id)"
            class="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <ChevronRight
              class="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-150"
              :class="{ 'rotate-90': !isCollapsed(provider.id) }"
            />
            <span class="font-medium text-sm text-gray-900 dark:text-gray-100 truncate flex-1">
              {{ provider.name }}
            </span>
            <span class="badge text-xs px-1.5 py-0.5" :class="providerTypeBadgeClass[provider.providerType] || 'badge-secondary'">
              {{ formatProviderType(provider.providerType) }}
            </span>
            <span class="text-xs text-gray-400 dark:text-gray-500 font-mono">
              {{ provider.apiType }}
            </span>
            <component
              v-if="checkAvailability"
              :is="availabilityStatusMap[getAvailabilityStatus(provider) || 'not_applicable']?.icon"
              class="w-4 h-4 flex-shrink-0"
              :class="availabilityStatusMap[getAvailabilityStatus(provider) || 'not_applicable']?.color"
              :title="availabilityStatusMap[getAvailabilityStatus(provider) || 'not_applicable']?.label"
            />
            <span class="text-xs text-gray-400 dark:text-gray-500 ml-1">
              {{ provider.usage.length }} entit{{ provider.usage.length === 1 ? 'y' : 'ies' }}
            </span>
          </button>

          <!-- Usage table (expanded) -->
          <div v-if="!isCollapsed(provider.id)" class="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-xs text-gray-500 dark:text-gray-400">
                  <th class="text-left px-4 py-1.5 font-medium">Entity</th>
                  <th class="text-left px-4 py-1.5 font-medium">Name</th>
                  <th class="text-left px-4 py-1.5 font-medium">Model</th>
                  <th v-if="checkAvailability" class="text-left px-4 py-1.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="entry in sortedUsage(provider)"
                  :key="entry.entityId"
                  class="border-t border-gray-100 dark:border-gray-700/50"
                >
                  <td class="px-4 py-2">
                    <span class="badge text-xs px-1.5 py-0.5" :class="entityTypeBadgeClass[entry.entityType] || 'badge-secondary'">
                      {{ capitalizeType(entry.entityType) }}
                    </span>
                  </td>
                  <td class="px-4 py-2 text-gray-900 dark:text-gray-100">{{ entry.entityName }}</td>
                  <td class="px-4 py-2 text-gray-500 dark:text-gray-400 font-mono text-xs">
                    {{ entry.modelName || '—' }}
                  </td>
                  <td v-if="checkAvailability" class="px-4 py-2">
                    <template v-if="entry.modelName">
                      <CheckCircle2 v-if="getModelStatus(provider, entry.modelName) === 'available'" class="w-3.5 h-3.5 text-green-500" />
                      <XCircle v-else-if="getModelStatus(provider, entry.modelName) === 'unavailable'" class="w-3.5 h-3.5 text-red-500" />
                      <MinusCircle v-else class="w-3.5 h-3.5 text-gray-400" />
                    </template>
                    <span v-else class="text-gray-400 text-xs">—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>

    <div class="modal-footer">
      <button class="btn-secondary" @click="$emit('close')">Close</button>
    </div>
  </BaseModal>
</template>
