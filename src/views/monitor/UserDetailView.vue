<script setup lang="ts">
import { ref, onMounted, computed, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUsersStore, useConversationsStore, useProjectSelectionStore } from '@/stores'
import { ArrowLeft, User, MessageSquare, Plus, Trash2, Save, Check, Ban, ShieldCheck } from 'lucide-vue-next'
import RelativeDate from '@/components/RelativeDate.vue'
import { getStatusBadgeClass, formatStatusLabel } from '@/utils/conversationStatus'
import type { UserResponse, ConversationResponse } from '@/api/types'
import MetadataTab from '@/components/MetadataTab.vue'
import EntityHistoryView from '@/components/EntityHistoryView.vue'
import MonitorSectionLayout from '@/layouts/MonitorSectionLayout.vue'
import TabNavigator from '@/components/TabNavigator.vue'
import type { TabDefinition } from '@/components/TabNavigator.vue'
import TabContent from '@/components/TabContent.vue'

const route = useRoute()
const router = useRouter()
const usersStore = useUsersStore()
const conversationsStore = useConversationsStore()
const projectSelectionStore = useProjectSelectionStore()

const userId = computed(() => route.params.userId as string)
const projectId = computed(() => projectSelectionStore.selectedProjectId || '')
const user = ref<UserResponse | null>(null)
const conversations = ref<ConversationResponse[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const activeTab = ref<'profile' | 'conversations' | 'metadata' | 'history' | 'ban'>('profile')

const tabs = computed<TabDefinition[]>(() => [
  { key: 'profile', label: 'Profile' },
  { key: 'conversations', label: () => [
    'Conversations',
    conversations.value.length > 0
      ? h('span', { class: 'ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300' }, String(conversations.value.length))
      : null
  ] },
  { key: 'metadata', label: 'Metadata', show: !!user.value },
  { key: 'history', label: 'History', show: !!user.value },
  { key: 'ban', label: 'Ban', show: !!user.value },
])

const editableProfile = ref<Array<{ key: string; value: string }>>([])
const isSaving = ref(false)
const saveError = ref<string | null>(null)
const showSuccess = ref(false)

const banReason = ref('')
const isBanning = ref(false)
const banError = ref<string | null>(null)

onMounted(async () => {
  await loadUserData()
})

async function loadUserData() {
  isLoading.value = true
  error.value = null

  try {
    // Load user details
    user.value = await usersStore.fetchById(projectId.value, userId.value)
    initEditableProfile()

    // Load user's conversations
    const conversationsResponse = await conversationsStore.fetchAll(
      projectSelectionStore.selectedProjectId || '',
      {
        limit: 50,
        orderBy: '-createdAt',
        filters: {
          userId: {
            op: 'eq',
            value: userId.value
          }
        }
      }
    )
    conversations.value = conversationsResponse.items || []
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load user data'
    console.error('Failed to load user:', err)
  } finally {
    isLoading.value = false
  }
}

function initEditableProfile() {
  if (!user.value || !user.value.profile) {
    editableProfile.value = []
    return
  }
  editableProfile.value = Object.entries(user.value.profile)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => ({
      key,
      value: typeof value === 'object' && value !== null ? JSON.stringify(value, null, 2) : String(value)
    }))
}

function addField() {
  editableProfile.value.push({ key: '', value: '' })
}

function removeField(index: number) {
  editableProfile.value.splice(index, 1)
}

async function saveProfile() {
  saveError.value = null

  const keys = editableProfile.value.map(e => e.key.trim()).filter(Boolean)
  const uniqueKeys = new Set(keys)
  if (uniqueKeys.size !== keys.length) {
    saveError.value = 'Profile field names must be unique'
    return
  }

  const profile: Record<string, any> = {}
  for (const entry of editableProfile.value) {
    const key = entry.key.trim()
    if (!key) continue
    try {
      profile[key] = JSON.parse(entry.value)
    } catch {
      profile[key] = entry.value
    }
  }

  isSaving.value = true
  try {
    user.value = await usersStore.update(projectId.value, userId.value, { profile })
    initEditableProfile()
    showSuccess.value = true
    setTimeout(() => { showSuccess.value = false }, 3000)
  } catch (err: any) {
    saveError.value = err.response?.data?.message || 'Failed to save profile'
  } finally {
    isSaving.value = false
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


const metadataFields = computed(() => {
  if (!user.value) return []
  return [
    { label: 'User ID', value: user.value.id, format: 'mono' as const },
    { label: 'Created', value: user.value.createdAt, format: 'date' as const },
    { label: 'Updated', value: user.value.updatedAt, format: 'date' as const },
  ]
})

async function banUser() {
  if (!confirm('Are you sure you want to ban this user? They will be blocked from starting conversations.')) return
  banError.value = null
  isBanning.value = true
  try {
    user.value = await usersStore.update(projectId.value, userId.value, {
      banned: true,
      banReason: banReason.value.trim() || null
    })
  } catch (err: any) {
    banError.value = err.response?.data?.message || 'Failed to ban user'
  } finally {
    isBanning.value = false
  }
}

async function unbanUser() {
  if (!confirm('Are you sure you want to unban this user?')) return
  banError.value = null
  isBanning.value = true
  try {
    user.value = await usersStore.update(projectId.value, userId.value, {
      banned: false,
      banReason: null
    })
    banReason.value = ''
  } catch (err: any) {
    banError.value = err.response?.data?.message || 'Failed to unban user'
  } finally {
    isBanning.value = false
  }
}


</script>

<template>
  <MonitorSectionLayout>
    <div class="flex flex-col h-full border-none md:border md:border-gray-200 dark:border-none md:dark:border-gray-700 rounded-lg overflow-hidden bg-transparent md:bg-white md:dark:bg-gray-800">
      <!-- Header -->
      <div class="md:flex flex-col md:flex-row gap-3 items-center justify-between px-0 pb-4 md:px-8 md:py-6 border-b-0 md:border-b md:border-gray-200 bg-transparent md:bg-white dark:bg-transparent md:dark:bg-gray-800 md:dark:border-gray-700">
        <div class="md:flex items-center gap-4 flex-1 mb-3 md:mb-0">
          <button @click="goBack" class="btn-icon mb-2 md:mb-0" title="Back to users">
            <ArrowLeft class="w-5 h-5" />
          </button>
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-1">User Details</h1>
            <p class="text-sm text-gray-600 font-mono dark:text-gray-400">{{ userId }}</p>
          </div>
        </div>
        <div v-if="activeTab === 'profile'" class="flex gap-3 items-center">
          <button @click="saveProfile" class="btn-primary" :disabled="isSaving" type="button">
            <Check v-if="showSuccess" class="inline-block mr-2 w-4 h-4" />
            <Save v-else class="inline-block mr-2 w-4 h-4" />
            {{ showSuccess ? 'Saved!' : (isSaving ? 'Saving...' : 'Save Changes') }}
          </button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs-container">
        <TabNavigator v-model="activeTab" :tabs="tabs" />
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
          <TabContent v-model="activeTab" tab="profile">
            <div>
              <div v-if="saveError" class="alert-error mb-4">{{ saveError }}</div>

              <div class="flex items-center gap-3 mb-6">
                <User class="w-6 h-6 text-gray-600" />
                <h2 class="text-xl font-semibold text-gray-900 dark:text-white">User Profile</h2>
              </div>

              <div class="flex justify-end mb-3">
                <button @click="addField" class="btn-secondary" type="button">
                  <Plus class="inline-block mr-1 w-4 h-4" />
                  Add Field
                </button>
              </div>

              <div v-if="editableProfile.length === 0" class="text-center py-8 text-gray-500">
                No profile fields. Click "Add Field" to add one.
              </div>

              <div v-else class="table-container">
                <div class="table-wrapper">
                  <table class="table">
                    <thead class="table-header">
                      <tr>
                        <th class="table-header-cell w-1/3">Field</th>
                        <th class="table-header-cell">Value</th>
                        <th class="table-header-cell w-16"></th>
                      </tr>
                    </thead>
                    <tbody class="table-body">
                      <tr v-for="(entry, index) in editableProfile" :key="index" class="table-row">
                        <td class="table-cell">
                          <input
                            v-model="entry.key"
                            type="text"
                            class="form-input"
                            placeholder="field name"
                          />
                        </td>
                        <td class="table-cell">
                          <input
                            v-model="entry.value"
                            type="text"
                            class="form-input font-mono"
                            placeholder="value"
                          />
                        </td>
                        <td class="table-cell">
                          <button
                            @click="removeField(index)"
                            class="btn-icon text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            title="Remove field"
                            type="button"
                          >
                            <Trash2 class="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </TabContent>

          <!-- Conversations Tab -->
          <TabContent v-model="activeTab" tab="conversations">
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
                          <span class="ml-1 text-gray-900 dark:text-gray-200"><RelativeDate :date="conversation.createdAt" /></span>
                        </div>
                        <div>
                          <span class="text-gray-600 dark:text-gray-400">Updated:</span>
                          <span class="ml-1 text-gray-900 dark:text-gray-200"><RelativeDate :date="conversation.updatedAt" /></span>
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
          </TabContent>

          <!-- Metadata Tab -->
          <MetadataTab
            v-if="user"
            v-model="activeTab"
            tab="metadata"
            :fields="metadataFields"
          />
          <!-- History Tab -->
          <TabContent v-model="activeTab" tab="history">
            <EntityHistoryView
              v-if="user"
              :load-history="() => usersStore.fetchAuditLogs(projectId, userId)"
              :current-object="user"
              :active="activeTab === 'history'"
              :update-fn="(data) => usersStore.update(projectId, userId, data)"
              :create-fn="(data) => usersStore.create(projectId, data)"
              :ignore-fields="['createdAt', 'archived', 'updatedAt']"
              @recover-success="() => router.go(0)"
            />
          </TabContent>

          <!-- Ban Tab -->
          <TabContent v-if="user" v-model="activeTab" tab="ban">
            <h3 class="text-lg font-semibold text-red-600 mb-2">Ban User</h3>

            <div v-if="banError" class="alert-error mb-4">{{ banError }}</div>

            <div v-if="!user.banned">
              <p class="text-sm text-gray-700 dark:text-gray-300 mb-4">
                Banning this user will prevent them from starting new conversations. You can optionally provide a reason.
              </p>
              <div class="form-group mb-4">
                <label class="form-label">Ban reason <span class="text-gray-400 font-normal">(optional)</span></label>
                <textarea
                  v-model="banReason"
                  class="form-textarea"
                  rows="3"
                  placeholder="Reason for banning this user..."
                  :disabled="isBanning"
                />
              </div>
              <button class="btn-danger" :disabled="isBanning" @click="banUser" type="button">
                <Ban class="inline-block mr-2 w-4 h-4" />
                {{ isBanning ? 'Banning...' : 'Ban User' }}
              </button>
            </div>

            <div v-else>
              <p class="text-sm text-gray-700 dark:text-gray-300 mb-4">
                This user is currently banned and cannot start new conversations.
              </p>
              <div class="form-group mb-4">
                <label class="form-label">Ban reason</label>
                <textarea
                  :value="user.banReason || ''"
                  class="form-textarea form-input-disabled"
                  rows="3"
                  disabled
                />
              </div>
              <button class="btn-secondary" :disabled="isBanning" @click="unbanUser" type="button">
                <ShieldCheck class="inline-block mr-2 w-4 h-4" />
                {{ isBanning ? 'Unbanning...' : 'Unban User' }}
              </button>
            </div>
          </TabContent>
        </div>
      </div>
    </div>
  </MonitorSectionLayout>
</template>
