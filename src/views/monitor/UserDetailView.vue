<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUsersStore, useConversationsStore } from '@/stores'
import { ArrowLeft, User, MessageSquare } from 'lucide-vue-next'
import type { UserResponse, ConversationResponse } from '@/api/types'
import MetadataTab from '@/components/MetadataTab.vue'
import MonitorSectionLayout from '@/layouts/MonitorSectionLayout.vue'

const route = useRoute()
const router = useRouter()
const usersStore = useUsersStore()
const conversationsStore = useConversationsStore()

const userId = computed(() => route.params.userId as string)
const user = ref<UserResponse | null>(null)
const conversations = ref<ConversationResponse[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const activeTab = ref<'profile' | 'conversations' | 'metadata'>('profile')

onMounted(async () => {
  await loadUserData()
})

async function loadUserData() {
  isLoading.value = true
  error.value = null

  try {
    // Load user details
    user.value = await usersStore.fetchById(userId.value)

    // Load user's conversations
    const conversationsResponse = await conversationsStore.fetchAll({
      limit: 50,
      orderBy: '-createdAt',
      filters: {
        userId: {
          op: 'eq',
          value: userId.value
        }
      }
    })
    conversations.value = conversationsResponse.items || []
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load user data'
    console.error('Failed to load user:', err)
  } finally {
    isLoading.value = false
  }
}

function goBack() {
  router.push({ name: 'monitor.users' })
}

function viewConversation(conversation: ConversationResponse) {
  router.push({ 
    name: 'monitor.conversationDetail', 
    params: { conversationId: conversation.id } 
  })
}

function formatDate(date: string | null) {
  if (!date) return 'N/A'
  return new Date(date).toLocaleString()
}

function formatStatusLabel(status: string): string {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

function getStatusBadgeClass(status: string): string {
  switch (status.toLowerCase()) {
    case 'active':
      return 'badge-active'
    case 'completed':
      return 'badge-success'
    case 'failed':
      return 'badge-error'
    case 'aborted':
      return 'badge-warning'
    default:
      return 'badge-secondary'
  }
}

const metadataFields = computed(() => {
  if (!user.value) return []
  return [
    { label: 'User ID', value: user.value.id, format: 'mono' as const },
    { label: 'Created', value: user.value.createdAt, format: 'date' as const },
    { label: 'Updated', value: user.value.updatedAt, format: 'date' as const },
  ]
})

const profileEntries = computed(() => {
  if (!user.value || !user.value.profile) return []
  return Object.entries(user.value.profile)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => ({
      key,
      value,
      displayValue: typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value),
      isComplex: typeof value === 'object' && value !== null
    }))
})
</script>

<template>
  <MonitorSectionLayout>
    <div class="flex flex-col h-full border-none md:border md:border-gray-200 dark:border-none md:dark:border-gray-700 rounded-lg overflow-hidden bg-transparent md:bg-white md:dark:bg-gray-800">
      <!-- Header -->
      <div class="flex items-center justify-between px-0 py-4 md:px-8 md:py-6 border-b-0 md:border-b md:border-gray-200 bg-transparent md:bg-white dark:bg-transparent md:dark:bg-gray-800 md:dark:border-gray-700">
        <div class="md:flex items-center gap-4 flex-1">
          <button @click="goBack" class="btn-icon mb-2 md:mb-0" title="Back to users">
            <ArrowLeft class="w-5 h-5" />
          </button>
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-1">User Details</h1>
            <p class="text-sm text-gray-600 font-mono dark:text-gray-400">{{ userId }}</p>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs-container">
        <nav class="tabs-nav" aria-label="Tabs">
          <button 
            @click="activeTab = 'profile'" 
            :class="['tab-button', { 'tab-button-active': activeTab === 'profile' }]"
            type="button"
          >
            Profile
          </button>
          <button 
            @click="activeTab = 'conversations'" 
            :class="['tab-button relative', { 'tab-button-active': activeTab === 'conversations' }]"
            type="button"
          >
            Conversations
            <span class="absolute top-1 -right-4 ml-2 px-1 py-0.5 text-xs rounded-full bg-gray-200 text-gray-700">
              {{ conversations.length }}
            </span>
          </button>
          <button 
            v-if="user" 
            @click="activeTab = 'metadata'"
            :class="['tab-button', { 'tab-button-active': activeTab === 'metadata' }]" 
            type="button"
          >
            Metadata
          </button>
        </nav>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        Loading user data...
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        {{ error }}
        <button @click="loadUserData" class="btn-secondary mt-4">
          Retry
        </button>
      </div>

      <!-- Content -->
      <div v-else class="flex-1 overflow-y-auto bg-transparent md:bg-gray-50 dark:bg-transparent md:dark:bg-gray-800">
        <div class="mx-auto">
          <!-- Profile Tab -->
          <div v-show="activeTab === 'profile'" class="tab-content">
            <div class="">
              <div class="flex items-center gap-3 mb-6 ">
                <User class="w-6 h-6 text-gray-600" />
                <h2 class="text-xl font-semibold text-gray-900 dark:text-white">User Profile</h2>
              </div>

              <div v-if="profileEntries.length === 0" class="text-center py-8 text-gray-500">
                No profile data available
              </div>

              <div v-else class="table-container">
                <div class="table-wrapper">
                  <table class="table">
                    <thead class="table-header">
                      <tr>
                        <th class="table-header-cell w-1/3">Field</th>
                        <th class="table-header-cell">Value</th>
                      </tr>
                    </thead>
                    <tbody class="table-body">
                      <tr v-for="entry in profileEntries" :key="entry.key" class="table-row">
                        <td class="table-cell font-medium text-gray-700">
                          {{ entry.key }}
                        </td>
                        <td class="table-cell">
                          <div v-if="entry.isComplex" class="bg-gray-50 rounded p-3 font-mono text-xs overflow-x-auto max-w-2xl">
                            <pre class="whitespace-pre-wrap break-words">{{ entry.displayValue }}</pre>
                          </div>
                          <div v-else class="text-gray-900 dark:text-gray-200">
                            {{ entry.displayValue }}
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <!-- Conversations Tab -->
          <div v-show="activeTab === 'conversations'" class="tab-content">
            <div class="">
              <div class="flex items-center gap-3 mb-6">
                <MessageSquare class="w-6 h-6 text-gray-600" />
                <h2 class="text-xl font-semibold text-gray-900 dark:text-white">User Conversations</h2>
              </div>

              <div v-if="conversations.length === 0" class="text-center py-8 text-gray-500">
                No conversations found for this user
              </div>

              <div v-else class="space-y-3">
                <div 
                  v-for="conversation in conversations" 
                  :key="conversation.id"
                  class="border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer dark:border-gray-700 dark:hover:border-gray-600 dark:hover:shadow-sm"
                  @click="viewConversation(conversation)"
                >
                  <div class="flex items-start justify-between gap-4">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-2">
                        <span class="font-mono text-sm text-gray-600 truncate dark:text-gray-400">
                          {{ conversation.id }}
                        </span>
                        <span 
                          class="px-2 py-0.5 text-xs rounded-full font-medium"
                          :class="getStatusBadgeClass(conversation.status)"
                        >
                          {{ formatStatusLabel(conversation.status) }}
                        </span>
                      </div>
                      <div class="md:grid md:grid-cols-2 md:gap-x-4 md:gap-y-1 text-sm">
                        <div>
                          <span class="text-gray-600 dark:text-gray-400 w-32 md:w-auto">Project:</span>
                          <span class="ml-1 font-mono text-xs text-gray-900 dark:text-gray-200">{{ conversation.projectId }}</span>
                        </div>
                        <div>
                          <span class="text-gray-600 dark:text-gray-400 w-32 md:w-auto">Stage:</span>
                          <span class="ml-1 font-mono text-xs text-gray-900 dark:text-gray-200">{{ conversation.stageId }}</span>
                        </div>
                        <div>
                          <span class="text-gray-600 dark:text-gray-400">Created:</span>
                          <span class="ml-1 text-gray-900 dark:text-gray-200">{{ formatDate(conversation.createdAt) }}</span>
                        </div>
                        <div>
                          <span class="text-gray-600 dark:text-gray-400">Updated:</span>
                          <span class="ml-1 text-gray-900 dark:text-gray-200">{{ formatDate(conversation.updatedAt) }}</span>
                        </div>
                      </div>
                      <div v-if="conversation.statusDetails" class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        <span class="font-medium">Details:</span> {{ conversation.statusDetails }}
                      </div>
                    </div>
                    <button 
                      class="btn-secondary btn-sm flex-shrink-0"
                      @click.stop="viewConversation(conversation)"
                    >
                      View
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Metadata Tab -->
          <MetadataTab 
            v-if="user" 
            v-show="activeTab === 'metadata'" 
            :fields="metadataFields" 
          />
        </div>
      </div>
    </div>
  </MonitorSectionLayout>
</template>

<style scoped>
.badge-active {
  background-color: rgb(220 252 231);
  color: rgb(22 101 52);
}

.badge-success {
  background-color: rgb(219 234 254);
  color: rgb(30 64 175);
}

.badge-warning {
  background-color: rgb(254 249 195);
  color: rgb(133 77 14);
}

.badge-error {
  background-color: rgb(254 226 226);
  color: rgb(153 27 27);
}

.badge-secondary {
  background-color: rgb(243 244 246);
  color: rgb(31 41 55);
}
</style>
